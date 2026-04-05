import { deleteCookie, getSignedCookie, setSignedCookie } from 'hono/cookie'

const USER_SESSION_SECRET_KEY = 'user_session_cookie_secret'

type SecretRow = {
  value?: string | null
}

function generateUserSessionSecret(byteLength = 32) {
  const bytes = new Uint8Array(byteLength)
  crypto.getRandomValues(bytes)
  return Array.from(bytes).map((b) => b.toString(16).padStart(2, '0')).join('')
}

function normalizeUserId(raw: unknown) {
  const value = String(raw ?? '').trim()
  if (!/^\d+$/.test(value)) return null
  const parsed = Number.parseInt(value, 10)
  return Number.isFinite(parsed) && parsed > 0 ? String(parsed) : null
}

export async function getOrCreateUserSessionSecret(db: D1Database) {
  const existing = await db.prepare('SELECT value FROM app_settings WHERE key=? LIMIT 1')
    .bind(USER_SESSION_SECRET_KEY)
    .first<SecretRow>()
  const current = String(existing?.value || '').trim()
  if (current.length >= 32) return current

  const secret = generateUserSessionSecret()
  await db.prepare(`
    INSERT INTO app_settings (key, value, updated_at)
    VALUES (?, ?, CURRENT_TIMESTAMP)
    ON CONFLICT(key) DO UPDATE SET value=excluded.value, updated_at=CURRENT_TIMESTAMP
  `).bind(USER_SESSION_SECRET_KEY, secret).run()
  return secret
}

export async function getUserSessionUserId(c: any) {
  const secret = await getOrCreateUserSessionSecret(c.env.DB)
  const signedValue = await getSignedCookie(c, secret, 'user_id')
  return normalizeUserId(signedValue)
}

export async function setUserSessionCookie(c: any, userId: number | string, maxAge = 86400 * 30) {
  const normalized = normalizeUserId(userId)
  if (!normalized) {
    throw new Error('INVALID_USER_SESSION_ID')
  }
  const secret = await getOrCreateUserSessionSecret(c.env.DB)
  const isSecure = c.req.url.startsWith('https://')
  await setSignedCookie(c, 'user_id', normalized, secret, {
    path: '/',
    maxAge,
    httpOnly: true,
    secure: isSecure,
    sameSite: 'Lax'
  })
}

export function clearUserSessionCookie(c: any) {
  deleteCookie(c, 'user_id', { path: '/' })
}
