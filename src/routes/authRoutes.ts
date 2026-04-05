import { deleteCookie, getCookie, setCookie } from 'hono/cookie'
import type { Hono } from 'hono'
import type { AppBindings } from '../types/app'
import { generateSecureToken, storeAdminSessionToken, validateAdminSessionToken } from '../lib/adminHelpers'

type AuthRouteDeps = {
  initDB: (db: D1Database) => Promise<void>
  resolveAdminProfile: (db: D1Database, c: any) => Promise<any>
  normalizeAdminUserKey: (raw: any) => string
  getAppSettingValue: (db: D1Database, key: string) => Promise<string>
  upsertAppSettings: (db: D1Database, entries: Array<{ key: string, value: string }>) => Promise<void>
}

export function registerAuthRoutes(app: Hono<{ Bindings: AppBindings }>, deps: AuthRouteDeps) {
  app.get('/api/admin/profile', async (c) => {
    try {
      await deps.initDB(c.env.DB)
      const profile = await deps.resolveAdminProfile(c.env.DB, c)
      return c.json({ success: true, data: profile })
    } catch (e: any) {
      return c.json({ success: false, error: e.message }, 500)
    }
  })

  app.put('/api/admin/profile/avatar', async (c) => {
    try {
      await deps.initDB(c.env.DB)
      const body: any = await c.req.json().catch(() => ({}))
      const avatar = String(body.avatar || '').trim()
      if (avatar && !/^data:image\/(png|jpe?g|webp);base64,/i.test(avatar)) {
        return c.json({ success: false, error: 'INVALID_AVATAR_FORMAT' }, 400)
      }
      if (avatar.length > 700000) {
        return c.json({ success: false, error: 'AVATAR_TOO_LARGE' }, 400)
      }
      const profile = await deps.resolveAdminProfile(c.env.DB, c)
      if (profile.scope === 'db-user' && Number(profile.userId || 0) > 0) {
        await c.env.DB.prepare("UPDATE users SET avatar=? WHERE id=?").bind(avatar || null, profile.userId).run()
      } else {
        await deps.upsertAppSettings(c.env.DB, [{ key: `admin_avatar_${profile.adminUserKey}`, value: avatar }])
      }
      const latest = await deps.resolveAdminProfile(c.env.DB, c)
      return c.json({ success: true, data: latest })
    } catch (e: any) {
      return c.json({ success: false, error: e.message }, 500)
    }
  })

  app.put('/api/admin/profile/password', async (c) => {
    try {
      await deps.initDB(c.env.DB)
      const body: any = await c.req.json().catch(() => ({}))
      const oldPassword = String(body.old_password || '')
      const newPassword = String(body.new_password || '')
      if (!oldPassword || !newPassword) return c.json({ success: false, error: 'MISSING_PASSWORD' }, 400)
      if (newPassword.length < 6 || newPassword.length > 64) {
        return c.json({ success: false, error: 'PASSWORD_LENGTH_INVALID' }, 400)
      }

      const adminUserKey = deps.normalizeAdminUserKey(getCookie(c, 'admin_user_key') || 'admin')
      const settingKey = `admin_password_${adminUserKey}`
      const storedPassword = await deps.getAppSettingValue(c.env.DB, settingKey)
      const currentPassword = storedPassword || (adminUserKey === 'admin' ? 'admin' : '')
      if (!currentPassword || oldPassword !== currentPassword) {
        return c.json({ success: false, error: 'OLD_PASSWORD_INCORRECT' }, 400)
      }

      await deps.upsertAppSettings(c.env.DB, [{ key: settingKey, value: newPassword }])
      return c.json({ success: true })
    } catch (e: any) {
      return c.json({ success: false, error: e.message }, 500)
    }
  })

  app.post('/api/admin/login', async (c) => {
    await deps.initDB(c.env.DB)
    const body = await c.req.json()
    const { username, password } = body
    const adminKey = deps.normalizeAdminUserKey(username)
    const storedPassword = await deps.getAppSettingValue(c.env.DB, `admin_password_${adminKey}`)
    const expectedPassword = storedPassword || (adminKey === 'admin' ? 'admin' : '')
    if (expectedPassword && password === expectedPassword) {
      const token = generateSecureToken()
      await storeAdminSessionToken(c.env.DB, adminKey, token)
      const isSecure = c.req.url.startsWith('https://')
      deleteCookie(c, 'user_id', { path: '/' })
      setCookie(c, 'admin_token', token, { path: '/', maxAge: 86400 * 30, httpOnly: true, secure: isSecure, sameSite: 'Lax' })
      setCookie(c, 'admin_user_key', adminKey, { path: '/', maxAge: 86400 * 30, httpOnly: true, secure: isSecure, sameSite: 'Lax' })
      return c.json({ success: true })
    }
    return c.json({ success: false, error: 'Invalid credentials' }, 401)
  })

  app.get('/api/auth/me', async (c) => {
    const adminToken = getCookie(c, 'admin_token')
    const userToken = getCookie(c, 'user_id')
    const adminUserKeyCookie = getCookie(c, 'admin_user_key') || 'admin'

    let isAdmin = await validateAdminSessionToken(c.env.DB, adminUserKeyCookie, adminToken || '')
    let currentUser = null

    let dbError = null

    if (isAdmin) {
      try {
        await deps.initDB(c.env.DB)
        currentUser = await deps.resolveAdminProfile(c.env.DB, c)
      } catch (e: any) {
        dbError = e.message
        currentUser = {
          userId: 0,
          email: 'admin@qhclothes.local',
          name: 'Admin',
          avatar: '',
          balance: 0,
          is_admin: 1
        }
      }
    } else if (userToken) {
      try {
        const parsedId = parseInt(userToken, 10)
        const user = await c.env.DB.prepare("SELECT id as userId, email, name, avatar, balance, is_admin FROM users WHERE id=?").bind(parsedId).first()
        if (user) currentUser = user
      } catch (e: any) {
        dbError = e.message
      }
    }

    if (!currentUser && !isAdmin) return c.json({ success: false, debug: { userToken, dbError } }, 401)

    return c.json({
      success: true,
      data: currentUser,
      isAdmin
    })
  })

  app.post('/api/auth/logout', async (c) => {
    deleteCookie(c, 'admin_token', { path: '/' })
    deleteCookie(c, 'admin_user_key', { path: '/' })
    deleteCookie(c, 'user_id', { path: '/' })
    return c.json({ success: true })
  })

  app.get('/api/auth/google', (c) => {
    const clientId = c.env.GOOGLE_CLIENT_ID
    if (!clientId) {
      const redirectUri = c.req.url.replace('/api/auth/google', '/api/auth/callback')
      return c.redirect(redirectUri + '?code=mock_google_code')
    }
    const redirectUri = new URL('/api/auth/callback', c.req.url).toString()
    const url = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=openid%20email%20profile&prompt=select_account`
    return c.redirect(url)
  })

  app.get('/api/auth/callback', async (c) => {
    const code = c.req.query('code')
    if (!code) return c.json({ error: 'No code provided' }, 400)

    const clientId = c.env.GOOGLE_CLIENT_ID
    const clientSecret = c.env.GOOGLE_CLIENT_SECRET

    await deps.initDB(c.env.DB)

    if (!clientId || !clientSecret || code === 'mock_google_code') {
      try {
        const mockEmail = 'user@example.com'
        const mockName = 'Nguyen Van A (Mock)'
        const mockAvatar = 'https://ui-avatars.com/api/?name=Nguyen+Van+A&background=random'

        let user = await c.env.DB.prepare("SELECT id FROM users WHERE email=?").bind(mockEmail).first() as any
        if (!user) {
          const res = await c.env.DB.prepare("INSERT INTO users (email, name, avatar, balance) VALUES (?, ?, ?, 0)").bind(mockEmail, mockName, mockAvatar).run()
          user = { id: res.meta.last_row_id }
        }
        setCookie(c, 'user_id', user.id.toString(), { path: '/', maxAge: 86400 * 30, httpOnly: true })
        return c.redirect('/')
      } catch (err: any) {
        return c.json({ error: "Fallback Mock Auth error", msg: err.message, stack: err.stack }, 500)
      }
    }

    const redirectUri = new URL('/api/auth/callback', c.req.url).toString()

    try {
      const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          code,
          client_id: clientId,
          client_secret: clientSecret,
          redirect_uri: redirectUri,
          grant_type: 'authorization_code'
        })
      })
      const tokenData = await tokenRes.json() as any
      if (!tokenData.access_token) return c.json({ error: 'Failed to get token', details: tokenData })

      const userRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: { Authorization: `Bearer ${tokenData.access_token}` }
      })
      const userData = await userRes.json() as any

      let user = null
      try {
        user = await c.env.DB.prepare("SELECT id FROM users WHERE email=?").bind(userData.email).first() as any
        if (!user) {
          const res = await c.env.DB.prepare("INSERT INTO users (email, name, avatar, balance) VALUES (?, ?, ?, 0)").bind(userData.email, userData.name, userData.picture || null).run()
          user = { id: res.meta.last_row_id }
        } else {
          await c.env.DB.prepare("UPDATE users SET name=?, avatar=? WHERE id=?").bind(userData.name, userData.picture || null, user.id).run()
        }
      } catch (dbErr: any) {
        return c.redirect('/?login=error&step=db_sync&msg=' + encodeURIComponent(dbErr.message))
      }

      if (!user || !user.id) {
        return c.redirect('/?login=error&step=user_id_missing')
      }

      const isSecure = c.req.url.startsWith('https://')
      setCookie(c, 'user_id', user.id.toString(), { path: '/', maxAge: 86400 * 30, httpOnly: true, secure: isSecure, sameSite: 'Lax' })
      return c.redirect('/?login=success')
    } catch (e: any) {
      return c.redirect('/?login=error&step=exchange&msg=' + encodeURIComponent(e.message))
    }
  })
}
