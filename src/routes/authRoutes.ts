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

function normalizeIdentityPhone(raw: unknown) {
  return String(raw || '').replace(/[^\d]/g, '')
}

function isValidOptionalPhone(phone: string) {
  return !phone || /^\+?[0-9 .()-]{7,20}$/.test(phone)
}

function isBlockedValue(value: unknown) {
  return Number(value || 0) === 1
}

function buildLocalUserEmail(username: string) {
  return `${username}@user.qhclothes.local`
}

function toHex(bytes: Uint8Array): string {
  return Array.from(bytes).map((byte) => byte.toString(16).padStart(2, '0')).join('')
}

async function sha256Hex(value: string) {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value))
  return toHex(new Uint8Array(digest))
}

function getClientIp(c: any) {
  const cfIp = String(c.req.header('cf-connecting-ip') || '').trim()
  if (cfIp) return cfIp
  const realIp = String(c.req.header('x-real-ip') || '').trim()
  if (realIp) return realIp
  const forwarded = String(c.req.header('x-forwarded-for') || '').split(',')[0]?.trim()
  return forwarded || ''
}

async function buildRegistrationIdentities(c: any, phone: string) {
  const identities: Array<{ type: 'phone' | 'ip_hash', value: string }> = []
  const identityPhone = normalizeIdentityPhone(phone)
  if (identityPhone) {
    identities.push({ type: 'phone', value: identityPhone })
  }

  const ip = getClientIp(c)
  if (ip) {
    identities.push({ type: 'ip_hash', value: await sha256Hex(`ip:${ip}`) })
  }

  return identities
}

async function findBlockedRegistrationIdentity(db: D1Database, identities: Array<{ type: string, value: string }>) {
  for (const identity of identities) {
    if (identity.type === 'phone') {
      const blockedPhone = await db.prepare(`
        SELECT blocked_reason
        FROM blocked_customers
        WHERE is_active = 1
          AND customer_phone IS NOT NULL
          AND REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(TRIM(customer_phone), ' ', ''), '-', ''), '.', ''), '(', ''), ')', ''), '+', '') = ?
        LIMIT 1
      `).bind(identity.value).first<{ blocked_reason?: string }>()
      if (blockedPhone) return blockedPhone.blocked_reason || ''

      const blockedUserPhone = await db.prepare(`
        SELECT blocked_reason
        FROM users
        WHERE is_blocked = 1
          AND phone IS NOT NULL
          AND REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(TRIM(phone), ' ', ''), '-', ''), '.', ''), '(', ''), ')', ''), '+', '') = ?
        LIMIT 1
      `).bind(identity.value).first<{ blocked_reason?: string }>()
      if (blockedUserPhone) return blockedUserPhone.blocked_reason || ''
    }

    const blockedIdentity = await db.prepare(`
      SELECT COALESCE(u.blocked_reason, bc.blocked_reason, '') AS blocked_reason
      FROM user_registration_identities uri
      LEFT JOIN users u ON u.id = uri.user_id
      LEFT JOIN blocked_customers bc ON bc.user_id = uri.user_id AND bc.is_active = 1
      WHERE uri.identity_type = ?
        AND uri.identity_value = ?
        AND (COALESCE(u.is_blocked, 0) = 1 OR bc.id IS NOT NULL)
      LIMIT 1
    `).bind(identity.type, identity.value).first<{ blocked_reason?: string }>()
    if (blockedIdentity) return blockedIdentity.blocked_reason || ''
  }

  return ''
}

async function countAccountsForIdentity(db: D1Database, identity: { type: string, value: string }) {
  if (identity.type === 'phone') {
    const byPhone = await db.prepare(`
      SELECT COUNT(DISTINCT id) AS total
      FROM users
      WHERE phone IS NOT NULL
        AND REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(TRIM(phone), ' ', ''), '-', ''), '.', ''), '(', ''), ')', ''), '+', '') = ?
    `).bind(identity.value).first<{ total?: number }>()
    const directCount = Number(byPhone?.total || 0)
    if (directCount > 0) return directCount
  }

  const byIdentity = await db.prepare(`
    SELECT COUNT(DISTINCT user_id) AS total
    FROM user_registration_identities
    WHERE identity_type = ?
      AND identity_value = ?
  `).bind(identity.type, identity.value).first<{ total?: number }>()
  return Number(byIdentity?.total || 0)
}

async function enforceRegistrationGuard(db: D1Database, identities: Array<{ type: string, value: string }>) {
  const blockedReason = await findBlockedRegistrationIdentity(db, identities)
  if (blockedReason) {
    return {
      allowed: false,
      error: 'BOM_HANG_BLOCKED',
      reason: 'Bạn không thể tạo tài khoản do bom hàng nhiều lần, liên hệ shop để được hỗ trợ nhanh.'
    }
  }

  for (const identity of identities) {
    const existingAccounts = await countAccountsForIdentity(db, identity)
    if (existingAccounts >= 3) {
      return {
        allowed: false,
        error: 'ACCOUNT_LIMIT_REACHED',
        reason: 'Bạn chỉ có thể tạo tối đa 3 tài khoản. Liên hệ shop nếu cần hỗ trợ.'
      }
    }
  }

  return { allowed: true, error: '', reason: '' }
}

async function saveRegistrationIdentities(db: D1Database, userId: number, identities: Array<{ type: string, value: string }>) {
  for (const identity of identities) {
    await db.prepare(`
      INSERT OR IGNORE INTO user_registration_identities (user_id, identity_type, identity_value)
      VALUES (?, ?, ?)
    `).bind(userId, identity.type, identity.value).run()
  }
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
        const user = await c.env.DB.prepare(`
          SELECT id as userId, email, username, phone, name, avatar, balance, is_admin, is_blocked, blocked_reason
          FROM users
          WHERE id=?
        `).bind(parsedId).first() as any
        if (user) {
          currentUser = {
            ...user,
            is_blocked: isBlockedValue(user.is_blocked) ? 1 : 0,
            blocked_reason: String(user.blocked_reason || '')
          }
        }
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

    const identities = await buildRegistrationIdentities(c, phone)
    const guard = await enforceRegistrationGuard(c.env.DB, identities)
    if (!guard.allowed) {
      return c.json({ success: false, error: guard.error, reason: guard.reason }, 403)
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
    await saveRegistrationIdentities(c.env.DB, Number(result.meta.last_row_id), identities)
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
