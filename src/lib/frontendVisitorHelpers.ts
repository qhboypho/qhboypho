import { getSignedCookie, setSignedCookie } from 'hono/cookie'

const FRONTEND_VISITOR_SECRET_KEY = 'frontend_visitor_cookie_secret'
const FRONTEND_VISITOR_COOKIE = 'frontend_visitor_id'
const FRONTEND_VISITOR_COOKIE_MAX_AGE = 86400 * 365

type SecretRow = {
  value?: string | null
}

function generateFrontendVisitorSecret(byteLength = 32): string {
  const bytes = new Uint8Array(byteLength)
  crypto.getRandomValues(bytes)
  return Array.from(bytes).map((b) => b.toString(16).padStart(2, '0')).join('')
}

function generateFrontendVisitorId(): string {
  if (typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return generateFrontendVisitorSecret(16)
}

function normalizeVisitorId(raw: unknown): string | null {
  const value = String(raw ?? '').trim()
  return value ? value : null
}

export function isLikelyHumanBrowser(userAgent: string | null | undefined): boolean {
  const ua = String(userAgent || '').trim().toLowerCase()
  if (!ua) return false
  const blockedTokens = [
    'bot',
    'crawler',
    'spider',
    'scrapy',
    'curl',
    'wget',
    'postman',
    'insomnia',
    'axios',
    'node-fetch',
    'undici',
    'wrangler',
    'playwright',
    'puppeteer',
    'headless',
  ]
  if (blockedTokens.some((token) => ua.includes(token))) return false
  return ua.includes('mozilla')
}

export function getVietnamDateKey(value = new Date()): string {
  const shifted = new Date(value.getTime() + (7 * 60 * 60 * 1000))
  const year = shifted.getUTCFullYear()
  const month = String(shifted.getUTCMonth() + 1).padStart(2, '0')
  const day = String(shifted.getUTCDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export async function getOrCreateFrontendVisitorSecret(db: D1Database): Promise<string> {
  const existing = await db.prepare('SELECT value FROM app_settings WHERE key=? LIMIT 1')
    .bind(FRONTEND_VISITOR_SECRET_KEY)
    .first<SecretRow>()
  const current = String(existing?.value || '').trim()
  if (current.length >= 32) return current

  const secret = generateFrontendVisitorSecret()
  await db.prepare(`
    INSERT INTO app_settings (key, value, updated_at)
    VALUES (?, ?, CURRENT_TIMESTAMP)
    ON CONFLICT(key) DO UPDATE SET value=excluded.value, updated_at=CURRENT_TIMESTAMP
  `).bind(FRONTEND_VISITOR_SECRET_KEY, secret).run()
  return secret
}

async function getFrontendVisitorId(c: any) {
  const secret = await getOrCreateFrontendVisitorSecret(c.env.DB)
  const signedValue = await getSignedCookie(c, secret, FRONTEND_VISITOR_COOKIE)
  return normalizeVisitorId(signedValue)
}

export async function ensureFrontendVisitorId(c: any): Promise<string> {
  const existing = await getFrontendVisitorId(c)
  if (existing) return existing

  const visitorId = generateFrontendVisitorId()
  const secret = await getOrCreateFrontendVisitorSecret(c.env.DB)
  const isSecure = c.req.url.startsWith('https://')
  await setSignedCookie(c, FRONTEND_VISITOR_COOKIE, visitorId, secret, {
    path: '/',
    maxAge: FRONTEND_VISITOR_COOKIE_MAX_AGE,
    httpOnly: true,
    secure: isSecure,
    sameSite: 'Lax',
  })
  return visitorId
}

export async function recordFrontendProductVisit(c: any, db: D1Database): Promise<void> {
  const visitorId = await ensureFrontendVisitorId(c)
  const visitDate = getVietnamDateKey()
  await db.prepare(`
    INSERT INTO frontend_product_visits (visitor_id, visit_date, first_seen_at, last_seen_at)
    VALUES (?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    ON CONFLICT(visitor_id, visit_date) DO UPDATE SET
      last_seen_at = CURRENT_TIMESTAMP
  `).bind(visitorId, visitDate).run()
}
