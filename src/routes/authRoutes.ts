import { deleteCookie, getCookie, setCookie } from 'hono/cookie'
import type { Hono } from 'hono'
import type { AppBindings } from '../types/app'
import { generateSecureToken, storeAdminSessionToken, validateAdminSessionToken, hashPassword, verifyPassword } from '../lib/adminHelpers'
import { clearUserSessionCookie, getUserSessionUserId, setUserSessionCookie } from '../lib/userSessionHelpers'

type AuthRouteDeps = {
  initDB: (db: D1Database) => Promise<void>
  resolveAdminProfile: (db: D1Database, c: any) => Promise<any>
  normalizeAdminUserKey: (raw: any) => string
  getAppSettingValue: (db: D1Database, key: string) => Promise<string>
  upsertAppSettings: (db: D1Database, entries: Array<{ key: string, value: string }>) => Promise<void>
}

function buildGoogleAuthErrorRedirect(requestUrl: string, step = 'google_config_missing', error = 'GOOGLE_AUTH_NOT_CONFIGURED') {
  const url = new URL('/', requestUrl)
  url.searchParams.set('login', 'error')
  url.searchParams.set('step', step)
  url.searchParams.set('error', error)
  return url.toString()
}

function isGoogleOAuthClientId(clientId: string) {
  return /^[0-9A-Za-z_-]+\.apps\.googleusercontent\.com$/.test(String(clientId || '').trim())
}

function normalizeStorefrontUsername(raw: unknown) {
  return String(raw || '').trim().toLowerCase()
}

function isValidStorefrontUsername(username: string) {
  return /^[a-z0-9._-]{3,32}$/.test(username) && !['admin', 'root', 'support'].includes(username)
}

function normalizeStorefrontPhone(raw: unknown) {
  return String(raw || '').trim().replace(/\s+/g, ' ')
}

function isValidOptionalPhone(phone: string) {
  return !phone || /^\+?[0-9 .()-]{7,20}$/.test(phone)
}

function buildLocalUserEmail(username: string) {
  return `${username}@user.qhclothes.local`
}

function clearAdminSessionCookies(c: any) {
  deleteCookie(c, 'admin_token', { path: '/' })
  deleteCookie(c, 'admin_user_key', { path: '/' })
}

function getGoogleRedirectUri(c: any) {
  const configured = String(c.env.GOOGLE_REDIRECT_URI || '').trim()
  if (configured) return configured
  return new URL('/api/auth/callback', c.req.url).toString()
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
      if (!currentPassword) {
        return c.json({ success: false, error: 'OLD_PASSWORD_INCORRECT' }, 400)
      }
      const isMatch = await verifyPassword(oldPassword, currentPassword)
      if (!isMatch) {
        return c.json({ success: false, error: 'OLD_PASSWORD_INCORRECT' }, 400)
      }

      const hashedPassword = await hashPassword(newPassword)
      await deps.upsertAppSettings(c.env.DB, [{ key: settingKey, value: hashedPassword }])
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
    if (!expectedPassword) {
      return c.json({ success: false, error: 'Invalid credentials' }, 401)
    }
    const isMatch = await verifyPassword(password, expectedPassword)
    if (!isMatch) {
      return c.json({ success: false, error: 'Invalid credentials' }, 401)
    }
    // Auto-migrate legacy plaintext password to hashed on successful login
    if (!expectedPassword.startsWith('pbkdf2:')) {
      const hashed = await hashPassword(password)
      await deps.upsertAppSettings(c.env.DB, [{ key: `admin_password_${adminKey}`, value: hashed }])
    }
    const token = generateSecureToken()
    await storeAdminSessionToken(c.env.DB, adminKey, token)
    const isSecure = c.req.url.startsWith('https://')
    clearUserSessionCookie(c)
    setCookie(c, 'admin_token', token, { path: '/', maxAge: 86400 * 30, httpOnly: true, secure: isSecure, sameSite: 'Lax' })
    setCookie(c, 'admin_user_key', adminKey, { path: '/', maxAge: 86400 * 30, httpOnly: true, secure: isSecure, sameSite: 'Lax' })
    return c.json({ success: true })
  })

  app.get('/api/auth/me', async (c) => {
    await deps.initDB(c.env.DB)
    const adminToken = getCookie(c, 'admin_token')
    const userToken = await getUserSessionUserId(c)
    const adminUserKeyCookie = getCookie(c, 'admin_user_key') || 'admin'

    let isAdmin = await validateAdminSessionToken(c.env.DB, adminUserKeyCookie, adminToken || '')
    let currentUser = null

    if (isAdmin) {
      try {
        await deps.initDB(c.env.DB)
        currentUser = await deps.resolveAdminProfile(c.env.DB, c)
      } catch (e: any) {
        console.error('[auth] resolve admin profile failed', e)
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
        const user = await c.env.DB.prepare("SELECT id as userId, email, username, phone, name, avatar, balance, is_admin FROM users WHERE id=?").bind(parsedId).first()
        if (user) currentUser = user
      } catch (e: any) {
        console.error('[auth] resolve current user failed', e)
      }
    }

    if (!currentUser && !isAdmin) return c.json({ success: false, error: 'UNAUTHORIZED' }, 401)

    return c.json({
      success: true,
      data: currentUser,
      isAdmin
    })
  })

  app.post('/api/auth/logout', async (c) => {
    deleteCookie(c, 'admin_token', { path: '/' })
    deleteCookie(c, 'admin_user_key', { path: '/' })
    clearUserSessionCookie(c)
    return c.json({ success: true })
  })

  app.post('/api/auth/register', async (c) => {
    await deps.initDB(c.env.DB)
    const body: any = await c.req.json().catch(() => ({}))
    const username = normalizeStorefrontUsername(body.username)
    const password = String(body.password || '')
    const phone = normalizeStorefrontPhone(body.phone)

    if (!isValidStorefrontUsername(username)) {
      return c.json({ success: false, error: 'INVALID_USERNAME' }, 400)
    }
    if (password.length < 6 || password.length > 64) {
      return c.json({ success: false, error: 'PASSWORD_LENGTH_INVALID' }, 400)
    }
    if (!isValidOptionalPhone(phone)) {
      return c.json({ success: false, error: 'INVALID_PHONE' }, 400)
    }

    const existing = await c.env.DB.prepare("SELECT id FROM users WHERE username=? LIMIT 1").bind(username).first()
    if (existing) {
      return c.json({ success: false, error: 'USERNAME_TAKEN' }, 409)
    }

    const passwordHash = await hashPassword(password)
    const localEmail = buildLocalUserEmail(username)
    const result = await c.env.DB.prepare(`
      INSERT INTO users (email, username, name, phone, password_hash, balance, is_admin)
      VALUES (?, ?, ?, ?, ?, 0, 0)
    `).bind(localEmail, username, username, phone || null, passwordHash).run()
    const user = {
      id: result.meta.last_row_id,
      userId: result.meta.last_row_id,
      email: localEmail,
      username,
      name: username,
      phone,
      avatar: '',
      balance: 0,
      is_admin: 0
    }
    clearAdminSessionCookies(c)
    await setUserSessionCookie(c, user.id)
    return c.json({ success: true, data: user })
  })

  app.post('/api/auth/login', async (c) => {
    await deps.initDB(c.env.DB)
    const body: any = await c.req.json().catch(() => ({}))
    const username = normalizeStorefrontUsername(body.username)
    const password = String(body.password || '')
    if (!isValidStorefrontUsername(username) || !password) {
      return c.json({ success: false, error: 'INVALID_CREDENTIALS' }, 401)
    }

    const user = await c.env.DB.prepare(`
      SELECT id, email, username, name, avatar, phone, balance, is_admin, password_hash
      FROM users
      WHERE username=?
      LIMIT 1
    `).bind(username).first() as any
    const isMatch = user && await verifyPassword(password, String(user.password_hash || ''))
    if (!isMatch) {
      return c.json({ success: false, error: 'INVALID_CREDENTIALS' }, 401)
    }

    clearAdminSessionCookies(c)
    await setUserSessionCookie(c, user.id)
    return c.json({
      success: true,
      data: {
        userId: Number(user.id),
        email: String(user.email || ''),
        username: String(user.username || ''),
        name: String(user.name || user.username || ''),
        avatar: String(user.avatar || ''),
        phone: String(user.phone || ''),
        balance: Number(user.balance || 0),
        is_admin: Number(user.is_admin || 0)
      }
    })
  })

  app.get('/api/auth/google', (c) => {
    const clientId = String(c.env.GOOGLE_CLIENT_ID || '').trim()
    const clientSecret = String(c.env.GOOGLE_CLIENT_SECRET || '').trim()
    if (!clientId || !clientSecret) {
      console.error('[auth] google oauth config missing')
      return c.redirect(buildGoogleAuthErrorRedirect(c.req.url))
    }
    if (!isGoogleOAuthClientId(clientId)) {
      console.error('[auth] google oauth client id invalid')
      return c.redirect(buildGoogleAuthErrorRedirect(c.req.url, 'google_client_id_invalid', 'GOOGLE_AUTH_CLIENT_ID_INVALID'))
    }
    const redirectUri = getGoogleRedirectUri(c)
    const url = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=openid%20email%20profile&prompt=select_account`
    return c.redirect(url)
  })

  app.get('/api/auth/callback', async (c) => {
    const code = c.req.query('code')
    if (!code) return c.redirect('/?login=error&step=google_callback_missing_code&error=AUTH_CALLBACK_FAILED')

    const clientId = String(c.env.GOOGLE_CLIENT_ID || '').trim()
    const clientSecret = String(c.env.GOOGLE_CLIENT_SECRET || '').trim()

    await deps.initDB(c.env.DB)

    if (!clientId || !clientSecret) {
      console.error('[auth] google oauth config missing')
      return c.redirect(buildGoogleAuthErrorRedirect(c.req.url))
    }
    if (!isGoogleOAuthClientId(clientId)) {
      console.error('[auth] google oauth client id invalid')
      return c.redirect(buildGoogleAuthErrorRedirect(c.req.url, 'google_client_id_invalid', 'GOOGLE_AUTH_CLIENT_ID_INVALID'))
    }

    const redirectUri = getGoogleRedirectUri(c)

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
      if (!tokenData.access_token) {
        console.error('[auth] google token exchange failed', tokenData)
        return c.json({ success: false, error: 'AUTH_PROVIDER_TOKEN_EXCHANGE_FAILED' }, 502)
      }

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

      await setUserSessionCookie(c, user.id)
      return c.redirect('/?login=success')
    } catch (e: any) {
      return c.redirect('/?login=error&step=exchange&msg=' + encodeURIComponent(e.message))
    }
  })
}
