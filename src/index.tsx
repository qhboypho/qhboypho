import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { serveStatic } from 'hono/cloudflare-workers'
import { getCookie, setCookie, deleteCookie } from 'hono/cookie'
import { PDFDocument } from 'pdf-lib'
import { storefrontHTML } from './pages/storefrontPage'
import { adminHTML } from './pages/adminPage'
import { adminLoginHTML } from './pages/adminLoginPage'

type Bindings = {
  DB: D1Database
  GOOGLE_CLIENT_ID?: string
  GOOGLE_CLIENT_SECRET?: string
  CASSO_SECURE_TOKEN?: string
  PAYOS_CLIENT_ID?: string
  PAYOS_API_KEY?: string
  PAYOS_CHECKSUM_KEY?: string
  ZALOPAY_APP_ID?: string
  ZALOPAY_KEY1?: string
  ZALOPAY_KEY2?: string
  ZALOPAY_CREATE_ENDPOINT?: string
  ZALOPAY_QUERY_ENDPOINT?: string
  ZALOPAY_CALLBACK_URL?: string
  GHTK_TOKEN?: string
  GHTK_CLIENT_SOURCE?: string
  GHTK_PICK_NAME?: string
  GHTK_PICK_ADDRESS?: string
  GHTK_PICK_PROVINCE?: string
  GHTK_PICK_DISTRICT?: string
  GHTK_PICK_WARD?: string
  GHTK_PICK_TEL?: string
  GHTK_FALLBACK_PROVINCE?: string
  GHTK_FALLBACK_DISTRICT?: string
  GHTK_FALLBACK_WARD?: string
  GHTK_DEFAULT_WEIGHT_KG?: string
  GHTK_LABEL_ORIGINAL?: string
  GHTK_LABEL_PAGE_SIZE?: string
}

const app = new Hono<{ Bindings: Bindings }>()

app.use('/api/*', cors())
app.use('/static/*', serveStatic({ root: './' }))

// Enforce admin auth for all admin APIs except login
app.use('/api/admin/*', async (c, next) => {
  if (c.req.path === '/api/admin/login') {
    return next()
  }
  const adminToken = getCookie(c, 'admin_token')
  if (adminToken !== 'super_secret_admin_token') {
    return c.json({ success: false, error: 'Unauthorized' }, 401)
  }
  return next()
})

// --- INIT DB ---------------------------------------------------
async function initDB(db: D1Database) {
  const statements = [
    `CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT,
      price REAL NOT NULL,
      original_price REAL,
      category TEXT DEFAULT 'unisex',
      brand TEXT,
      material TEXT,
      thumbnail TEXT,
      images TEXT DEFAULT '[]',
      colors TEXT DEFAULT '[]',
      sizes TEXT DEFAULT '[]',
      stock INTEGER DEFAULT 0,
      is_active INTEGER DEFAULT 1,
      is_featured INTEGER DEFAULT 0,
      is_trending INTEGER DEFAULT 0,
      trending_order INTEGER DEFAULT 0,
      display_order INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_code TEXT UNIQUE NOT NULL,
      customer_name TEXT NOT NULL,
      customer_phone TEXT NOT NULL,
      customer_address TEXT NOT NULL,
      user_id INTEGER,
      product_id INTEGER NOT NULL,
      product_name TEXT NOT NULL,
      product_price REAL NOT NULL,
      color TEXT,
      selected_color_image TEXT DEFAULT '',
      size TEXT,
      quantity INTEGER DEFAULT 1,
      total_price REAL NOT NULL,
      voucher_code TEXT DEFAULT '',
      discount_amount REAL DEFAULT 0,
      note TEXT,
      payment_method TEXT DEFAULT 'COD',
      payment_status TEXT DEFAULT 'unpaid',
      payment_paid_at DATETIME,
      payment_ref TEXT,
      payment_provider TEXT,
      payment_link_id TEXT,
      payment_checkout_url TEXT,
      payment_order_code INTEGER,
      shipping_arranged INTEGER DEFAULT 0,
      shipping_arranged_at DATETIME,
      shipping_carrier TEXT DEFAULT '',
      shipping_tracking_code TEXT,
      shipping_label TEXT,
      shipping_fee REAL DEFAULT 0,
      status TEXT DEFAULT 'pending',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS vouchers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT UNIQUE NOT NULL,
      discount_amount REAL NOT NULL,
      valid_from DATETIME NOT NULL,
      valid_to DATETIME NOT NULL,
      usage_limit INTEGER DEFAULT 0,
      used_count INTEGER DEFAULT 0,
      is_active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status)`,
    `CREATE INDEX IF NOT EXISTS idx_products_active ON products(is_active)`,
    `CREATE INDEX IF NOT EXISTS idx_vouchers_code ON vouchers(code)`,
    `CREATE TABLE IF NOT EXISTS transactions (id INTEGER PRIMARY KEY AUTOINCREMENT, tid TEXT UNIQUE, amount REAL, description TEXT, user_id INTEGER, created_at DATETIME DEFAULT CURRENT_TIMESTAMP)`,
    `CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY AUTOINCREMENT, email TEXT UNIQUE NOT NULL, name TEXT, avatar TEXT, balance REAL DEFAULT 0, is_admin INTEGER DEFAULT 0, created_at DATETIME DEFAULT CURRENT_TIMESTAMP)`,
    `CREATE TABLE IF NOT EXISTS hero_banners (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      image_url TEXT NOT NULL,
      subtitle TEXT,
      title TEXT,
      price TEXT,
      product_id INTEGER,
      display_order INTEGER DEFAULT 0,
      is_active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS app_settings (
      key TEXT PRIMARY KEY,
      value TEXT,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`
  ]
  for (const sql of statements) {
    try { await db.prepare(sql).run() } catch (_) { }
  }

  // Ensure column exists for older databases
  try { await db.prepare("ALTER TABLE hero_banners ADD COLUMN product_id INTEGER").run() } catch (_) { }
  try { await db.prepare("ALTER TABLE products ADD COLUMN display_order INTEGER DEFAULT 0").run() } catch (_) { }
  try { await db.prepare("ALTER TABLE products ADD COLUMN is_trending INTEGER DEFAULT 0").run() } catch (_) { }
  try { await db.prepare("ALTER TABLE products ADD COLUMN trending_order INTEGER DEFAULT 0").run() } catch (_) { }
  try { await db.prepare("ALTER TABLE orders ADD COLUMN selected_color_image TEXT DEFAULT ''").run() } catch (_) { }
  try { await db.prepare("ALTER TABLE orders ADD COLUMN payment_method TEXT DEFAULT 'COD'").run() } catch (_) { }
  try { await db.prepare("ALTER TABLE orders ADD COLUMN payment_status TEXT DEFAULT 'unpaid'").run() } catch (_) { }
  try { await db.prepare("ALTER TABLE orders ADD COLUMN payment_paid_at DATETIME").run() } catch (_) { }
  try { await db.prepare("ALTER TABLE orders ADD COLUMN payment_ref TEXT").run() } catch (_) { }
  try { await db.prepare("ALTER TABLE orders ADD COLUMN payment_provider TEXT").run() } catch (_) { }
  try { await db.prepare("ALTER TABLE orders ADD COLUMN payment_link_id TEXT").run() } catch (_) { }
  try { await db.prepare("ALTER TABLE orders ADD COLUMN payment_checkout_url TEXT").run() } catch (_) { }
  try { await db.prepare("ALTER TABLE orders ADD COLUMN payment_order_code INTEGER").run() } catch (_) { }
  try { await db.prepare("ALTER TABLE orders ADD COLUMN shipping_arranged INTEGER DEFAULT 0").run() } catch (_) { }
  try { await db.prepare("ALTER TABLE orders ADD COLUMN shipping_arranged_at DATETIME").run() } catch (_) { }
  try { await db.prepare("ALTER TABLE orders ADD COLUMN shipping_carrier TEXT DEFAULT ''").run() } catch (_) { }
  try { await db.prepare("ALTER TABLE orders ADD COLUMN shipping_tracking_code TEXT").run() } catch (_) { }
  try { await db.prepare("ALTER TABLE orders ADD COLUMN shipping_label TEXT").run() } catch (_) { }
  try { await db.prepare("ALTER TABLE orders ADD COLUMN shipping_fee REAL DEFAULT 0").run() } catch (_) { }

  // Backfill old orders so selected color images stay in sync with product color mappings.
  try {
    const backfillRows = await db.prepare(`
      SELECT o.id, o.color, o.selected_color_image, p.colors AS product_colors, p.thumbnail AS product_thumbnail
      FROM orders o
      LEFT JOIN products p ON p.id = o.product_id
      WHERE (o.selected_color_image IS NULL OR TRIM(o.selected_color_image) = '')
        AND TRIM(COALESCE(o.color, '')) <> ''
        AND p.id IS NOT NULL
      ORDER BY o.id ASC
      LIMIT 1000
    `).all()
    const rows = Array.isArray(backfillRows?.results) ? backfillRows.results as any[] : []
    for (const row of rows) {
      const resolved = resolveSelectedColorImage(row.product_colors, row.color, row.product_thumbnail || '')
      if (!resolved) continue
      await db.prepare(`UPDATE orders SET selected_color_image=?, updated_at=CURRENT_TIMESTAMP WHERE id=?`)
        .bind(resolved, row.id)
        .run()
    }
  } catch (err) {
    console.error('Failed to backfill order color images', err)
  }

  // Seed initial banners if empty
  try {
    const bannerCountResult = await db.prepare("SELECT COUNT(*) as num_rows FROM hero_banners").all()
    let count = 1
    if (bannerCountResult && bannerCountResult.results && bannerCountResult.results.length > 0) {
      count = bannerCountResult.results[0].num_rows as number || 0
    }
    if (count === 0) {
      const initialBanners = [
        ['https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=500', 'M?i nh?t', 'B? suu t?p Spring 2026', 'T? 299.000d', null, 1],
        ['https://images.unsplash.com/photo-1550614000-4b95d4edc457?w=500', 'Bán chạy', 'Phong Cách Đường Phố', 'Giảm 20%', null, 2],
        ['https://images.unsplash.com/photo-1492707892479-7bc8d5a4ee93?w=500', 'Nam giới', 'Lịch lãm & Tinh tế', 'Từ 450.000đ', null, 3]
      ]
      for (const [img, sub, title, price, pid, order] of initialBanners) {
        await db.prepare("INSERT INTO hero_banners (image_url, subtitle, title, price, product_id, display_order) VALUES (?, ?, ?, ?, ?, ?)").bind(img, sub, title, price, pid, order).run()
      }
    }
  } catch (err) {
    console.error('Failed to seed banners on init', err)
  }
}

function payOSBuildDataString(input: Record<string, any>) {
  const normalize = (v: any) => {
    if (v === null || v === undefined) return ''
    if (typeof v === 'object') return JSON.stringify(v)
    return String(v)
  }
  return Object.keys(input)
    .sort()
    .map((k) => k + '=' + normalize(input[k]))
    .join('&')
}

async function payOSSignWithChecksum(checksumKey: string, dataString: string) {
  const encoder = new TextEncoder()
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(checksumKey),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )
  const sigBuf = await crypto.subtle.sign('HMAC', key, encoder.encode(dataString))
  return Array.from(new Uint8Array(sigBuf)).map((b) => b.toString(16).padStart(2, '0')).join('')
}

async function payOSGetPaymentInfo(env: any, id: string | number) {
  const clientId = String(env.PAYOS_CLIENT_ID || '')
  const apiKey = String(env.PAYOS_API_KEY || '')
  if (!clientId || !apiKey || !id) return null

  const resp = await fetch(`https://api-merchant.payos.vn/v2/payment-requests/${encodeURIComponent(String(id))}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'x-client-id': clientId,
      'x-api-key': apiKey
    }
  })
  const body: any = await resp.json().catch(() => ({}))
  if (!resp.ok || String(body?.code || '') !== '00' || !body?.data) return null
  return body.data
}

function getVietnamDatePrefixYYMMDD(ts = Date.now()) {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Ho_Chi_Minh',
    year: '2-digit',
    month: '2-digit',
    day: '2-digit'
  }).formatToParts(new Date(ts))
  const yy = parts.find((p) => p.type === 'year')?.value || '00'
  const mm = parts.find((p) => p.type === 'month')?.value || '01'
  const dd = parts.find((p) => p.type === 'day')?.value || '01'
  return `${yy}${mm}${dd}`
}

function buildZaloPayAppTransId(orderId: number, ts = Date.now()) {
  const datePrefix = getVietnamDatePrefixYYMMDD(ts)
  const suffix = `${Math.max(1, Number(orderId) || 1)}_${ts}`
  const out = `${datePrefix}_${suffix}`
  return out.length <= 40 ? out : out.slice(0, 40)
}

function parseJsonObject(input: any) {
  if (!input) return {}
  if (typeof input === 'object') return input
  if (typeof input !== 'string') return {}
  try {
    const parsed = JSON.parse(input)
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    return {}
  }
}

function getZaloPayConfig(env: any) {
  const appIdRaw = String(env.ZALOPAY_APP_ID || '').trim()
  const appIdNum = Number(appIdRaw)
  const key1 = String(env.ZALOPAY_KEY1 || '').trim()
  const key2 = String(env.ZALOPAY_KEY2 || '').trim()
  const createEndpoint = String(env.ZALOPAY_CREATE_ENDPOINT || 'https://sb-openapi.zalopay.vn/v2/create').trim()
  const queryEndpoint = String(env.ZALOPAY_QUERY_ENDPOINT || 'https://sb-openapi.zalopay.vn/v2/query').trim()
  return {
    appIdRaw,
    appIdNum,
    key1,
    key2,
    createEndpoint,
    queryEndpoint
  }
}

function getZaloPayMissingConfigKeys(config: ReturnType<typeof getZaloPayConfig>) {
  const missing: string[] = []
  if (!config.appIdRaw || !Number.isFinite(config.appIdNum) || config.appIdNum <= 0) missing.push('ZALOPAY_APP_ID')
  if (!config.key1) missing.push('ZALOPAY_KEY1')
  if (!config.key2) missing.push('ZALOPAY_KEY2')
  return missing
}

const ADDRESS_KIT_BASE_URL = 'https://production.cas.so/address-kit'
const addressKitCache = {
  provinces: new Map<string, any[]>(),
  communes: new Map<string, any[]>()
}

function sanitizeAddressEffectiveDate(input: string) {
  const raw = String(input || '').trim()
  if (!raw) return 'latest'
  if (raw === 'latest') return raw
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw
  return 'latest'
}

async function syncOrderPaymentWithPayOS(db: D1Database, env: any, order: any) {
  const isBankTransfer = String(order?.payment_method || '').toUpperCase() === 'BANK_TRANSFER'
  const isPaid = String(order?.payment_status || '').toLowerCase() === 'paid'
  if (!isBankTransfer || isPaid) return { synced: false, paid: isPaid }

  const payOSId = order?.payment_link_id || order?.payment_order_code || order?.id
  if (!payOSId) return { synced: false, paid: false }

  const paymentInfo = await payOSGetPaymentInfo(env, payOSId)
  if (!paymentInfo) return { synced: false, paid: false }

  const payStatus = String(paymentInfo.status || '').toUpperCase()
  const amountPaid = Number(paymentInfo.amountPaid || 0)
  const orderTotal = Number(order.total_price || 0)
  const isPayOSPaid = payStatus === 'PAID' && amountPaid >= orderTotal
  if (!isPayOSPaid) return { synced: false, paid: false, paymentInfo }

  await db.prepare(`
    UPDATE orders
    SET payment_status='paid',
        payment_paid_at=COALESCE(payment_paid_at, CURRENT_TIMESTAMP),
        payment_ref=COALESCE(payment_ref, ?),
        payment_provider='PAYOS',
        payment_link_id=COALESCE(payment_link_id, ?),
        payment_order_code=COALESCE(payment_order_code, ?),
        status=CASE WHEN status='pending' THEN 'confirmed' ELSE status END,
        updated_at=CURRENT_TIMESTAMP
    WHERE id=?
  `).bind(
    String(paymentInfo.reference || paymentInfo.id || payOSId),
    String(paymentInfo.id || order.payment_link_id || ''),
    Number(paymentInfo.orderCode || order.payment_order_code || order.id || 0),
    order.id
  ).run()

  return { synced: true, paid: true, paymentInfo }
}

async function syncOrderPaymentWithZaloPay(db: D1Database, env: any, order: any) {
  const isZaloPay = String(order?.payment_method || '').toUpperCase() === 'ZALOPAY'
  const isPaid = String(order?.payment_status || '').toLowerCase() === 'paid'
  if (!isZaloPay || isPaid) return { synced: false, paid: isPaid }

  const config = getZaloPayConfig(env)
  if (!config.appIdRaw || !Number.isFinite(config.appIdNum) || config.appIdNum <= 0 || !config.key1) {
    return { synced: false, paid: false }
  }

  const appTransId = String(order?.payment_link_id || '').trim()
  if (!appTransId) return { synced: false, paid: false }

  const macData = `${config.appIdRaw}|${appTransId}|${config.key1}`
  const mac = await payOSSignWithChecksum(config.key1, macData)
  const form = new URLSearchParams()
  form.set('app_id', config.appIdRaw)
  form.set('app_trans_id', appTransId)
  form.set('mac', mac)

  const resp = await fetch(config.queryEndpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: form.toString()
  })
  const body: any = await resp.json().catch(() => ({}))
  const returnCode = Number(body?.return_code || 0)
  if (!resp.ok || returnCode !== 1) {
    return { synced: false, paid: false, paymentInfo: body }
  }

  const paidAmount = Number(body?.amount || 0)
  const orderTotal = Number(order?.total_price || 0)
  if (paidAmount > 0 && orderTotal > 0 && paidAmount < orderTotal) {
    return { synced: false, paid: false, paymentInfo: body }
  }

  const zpTransIdNum = Number(body?.zp_trans_id || 0)
  const paymentRef = String(body?.zp_trans_id || appTransId || '')

  await db.prepare(`
    UPDATE orders
    SET payment_status='paid',
        payment_paid_at=COALESCE(payment_paid_at, CURRENT_TIMESTAMP),
        payment_ref=COALESCE(payment_ref, ?),
        payment_provider='ZALOPAY',
        payment_link_id=COALESCE(payment_link_id, ?),
        payment_order_code=COALESCE(payment_order_code, ?),
        status=CASE WHEN status='pending' THEN 'confirmed' ELSE status END,
        updated_at=CURRENT_TIMESTAMP
    WHERE id=?
  `).bind(
    paymentRef || null,
    appTransId || null,
    Number.isFinite(zpTransIdNum) && zpTransIdNum > 0 ? zpTransIdNum : null,
    order.id
  ).run()

  return { synced: true, paid: true, paymentInfo: body }
}

async function syncOrderPayment(db: D1Database, env: any, order: any) {
  const method = String(order?.payment_method || '').toUpperCase()
  if (method === 'BANK_TRANSFER') return syncOrderPaymentWithPayOS(db, env, order)
  if (method === 'ZALOPAY') return syncOrderPaymentWithZaloPay(db, env, order)
  const isPaid = String(order?.payment_status || '').toLowerCase() === 'paid'
  return { synced: false, paid: isPaid }
}

function normalizeGHTKOriginal(v: any) {
  const value = String(v || '').toLowerCase()
  return value === 'landscape' ? 'landscape' : 'portrait'
}

function normalizeGHTKPageSize(v: any) {
  const value = String(v || '').toUpperCase()
  return value === 'A5' ? 'A5' : 'A6'
}

function parseVietnamAddress(address: string) {
  const parts = String(address || '').split(',').map((s) => s.trim()).filter(Boolean)
  if (parts.length < 3) return null
  const province = parts[parts.length - 1]
  const ward = parts[parts.length - 2]
  const detail = parts.slice(0, parts.length - 2).join(', ')
  // AddressKit checkout currently stores: "detail, ward/commune, province" (no district).
  // For GHTK, fall back district to the same ward/commune string in this 3-part format.
  const district = parts.length >= 4 ? parts[parts.length - 3] : ward
  if (!detail || !province || !district || !ward) return null
  return { detail, ward, district, province }
}

function resolveRecipientAddressForGHTK(env: any, rawAddress: string) {
  const parsed = parseVietnamAddress(rawAddress)
  if (parsed) return { ...parsed, usedFallback: false }
  const fallbackProvince = String(env.GHTK_FALLBACK_PROVINCE || env.GHTK_PICK_PROVINCE || '').trim()
  const fallbackDistrict = String(env.GHTK_FALLBACK_DISTRICT || env.GHTK_PICK_DISTRICT || '').trim()
  const fallbackWard = String(env.GHTK_FALLBACK_WARD || env.GHTK_PICK_WARD || '').trim()
  const detail = String(rawAddress || '').trim()
  if (!detail || !fallbackProvince || !fallbackDistrict || !fallbackWard) return null
  return {
    detail,
    ward: fallbackWard,
    district: fallbackDistrict,
    province: fallbackProvince,
    usedFallback: true
  }
}

function normalizeAddressToken(value: string) {
  return String(value || '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .replace(/[.,]/g, '')
    .trim()
}

function normalizeRecipientAddressForGHTK(input: { detail: string, ward: string, district: string, province: string, usedFallback?: boolean }) {
  const ward = String(input.ward || '').trim()
  const province = String(input.province || '').trim()
  let district = String(input.district || '').trim()
  const detailParts = String(input.detail || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)

  const wardNorm = normalizeAddressToken(ward)
  const districtNorm = normalizeAddressToken(district)
  const provinceNorm = normalizeAddressToken(province)

  if (districtNorm && wardNorm && districtNorm === wardNorm && detailParts.length > 1) {
    const candidate = detailParts[detailParts.length - 1]
    const candidateNorm = normalizeAddressToken(candidate)
    if (candidateNorm && candidateNorm !== wardNorm && candidateNorm !== provinceNorm) {
      district = candidate
    }
  }

  while (detailParts.length > 0) {
    const lastNorm = normalizeAddressToken(detailParts[detailParts.length - 1])
    const districtNowNorm = normalizeAddressToken(district)
    if (!lastNorm) {
      detailParts.pop()
      continue
    }
    if (lastNorm === wardNorm || lastNorm === districtNowNorm || lastNorm === provinceNorm) {
      detailParts.pop()
      continue
    }
    break
  }

  return {
    detail: detailParts.join(', ').trim(),
    ward,
    district,
    province,
    usedFallback: !!input.usedFallback
  }
}

function getOrderAmountDueServer(order: any) {
  return String(order?.payment_status || '').toLowerCase() === 'paid'
    ? 0
    : Number(order?.total_price || 0)
}

function buildInternalTestOrderWhereSql(alias = '') {
  const p = alias ? `${alias}.` : ''
  return `(
    LOWER(TRIM(COALESCE(${p}customer_name, '')))='local script test'
    OR LOWER(TRIM(COALESCE(${p}note, '')))='test:payos-local'
    OR LOWER(TRIM(COALESCE(${p}note, '')))='test:zalopay-local'
  )`
}

type GhtkPickupConfig = {
  pickAddressId: string
  pickName: string
  pickAddress: string
  pickProvince: string
  pickDistrict: string
  pickWard: string
  pickTel: string
}

const GHTK_PICKUP_SETTING_KEYS = [
  'ghtk_pick_address_id',
  'ghtk_pick_name',
  'ghtk_pick_address',
  'ghtk_pick_province',
  'ghtk_pick_district',
  'ghtk_pick_ward',
  'ghtk_pick_tel'
] as const

async function getGhtkPickupConfig(db: D1Database, env: any): Promise<GhtkPickupConfig> {
  const query = `SELECT key, value FROM app_settings WHERE key IN (${GHTK_PICKUP_SETTING_KEYS.map(() => '?').join(',')})`
  const result = await db.prepare(query).bind(...GHTK_PICKUP_SETTING_KEYS).all()
  const map = new Map<string, string>()
  for (const row of (result.results || []) as any[]) {
    map.set(String(row.key || ''), String(row.value || ''))
  }
  const dbValue = (key: string) => String(map.get(key) || '').trim()
  return {
    pickAddressId: dbValue('ghtk_pick_address_id'),
    pickName: dbValue('ghtk_pick_name') || String(env.GHTK_PICK_NAME || '').trim(),
    pickAddress: dbValue('ghtk_pick_address') || String(env.GHTK_PICK_ADDRESS || '').trim(),
    pickProvince: dbValue('ghtk_pick_province') || String(env.GHTK_PICK_PROVINCE || '').trim(),
    pickDistrict: dbValue('ghtk_pick_district') || String(env.GHTK_PICK_DISTRICT || '').trim(),
    pickWard: dbValue('ghtk_pick_ward') || String(env.GHTK_PICK_WARD || '').trim(),
    pickTel: dbValue('ghtk_pick_tel') || String(env.GHTK_PICK_TEL || '').trim()
  }
}

async function upsertAppSettings(db: D1Database, entries: Array<{ key: string, value: string }>) {
  for (const entry of entries) {
    await db.prepare(`
      INSERT INTO app_settings (key, value, updated_at)
      VALUES (?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(key) DO UPDATE SET value=excluded.value, updated_at=CURRENT_TIMESTAMP
    `).bind(entry.key, entry.value).run()
  }
}

async function getAppSettingValue(db: D1Database, key: string) {
  const row = await db.prepare("SELECT value FROM app_settings WHERE key=? LIMIT 1").bind(key).first() as any
  return String(row?.value || '')
}

function normalizeAdminUserKey(raw: any) {
  const key = String(raw || 'admin').trim().toLowerCase().replace(/[^a-z0-9._-]+/g, '')
  return key || 'admin'
}

async function resolveAdminProfile(db: D1Database, c: any) {
  const adminUserKey = normalizeAdminUserKey(getCookie(c, 'admin_user_key') || 'admin')
  const userToken = String(getCookie(c, 'user_id') || '').trim()
  if (userToken) {
    const uid = Number.parseInt(userToken, 10)
    if (Number.isFinite(uid) && uid > 0) {
      const user = await db.prepare("SELECT id, email, name, avatar, balance, is_admin FROM users WHERE id=? LIMIT 1").bind(uid).first() as any
      if (user && Number(user.is_admin || 0) === 1) {
        return {
          scope: 'db-user',
          adminUserKey,
          userId: Number(user.id),
          email: String(user.email || ''),
          name: String(user.name || 'Admin'),
          avatar: String(user.avatar || ''),
          balance: Number(user.balance || 0),
          is_admin: 1
        }
      }
    }
  }
  const avatar = await getAppSettingValue(db, `admin_avatar_${adminUserKey}`)
  const fallbackName = adminUserKey === 'admin'
    ? 'Admin'
    : adminUserKey.split(/[._-]/).filter(Boolean).map((s) => s.charAt(0).toUpperCase() + s.slice(1)).join(' ')
  return {
    scope: 'legacy-admin',
    adminUserKey,
    userId: 0,
    email: `${adminUserKey}@qhclothes.local`,
    name: fallbackName || 'Admin',
    avatar,
    balance: 0,
    is_admin: 1
  }
}

async function ghtkFetchPickupAddresses(env: any) {
  const token = String(env.GHTK_TOKEN || '').trim()
  const clientSource = String(env.GHTK_CLIENT_SOURCE || '').trim()
  if (!token || !clientSource) return { ok: false, message: 'MISSING_GHTK_KEYS', data: [] as any[] }

  const resp = await fetch('https://services.giaohangtietkiem.vn/services/shipment/list_pick_add', {
    method: 'GET',
    headers: {
      'Token': token,
      'X-Client-Source': clientSource
    }
  })
  const body: any = await resp.json().catch(() => ({}))
  if (!resp.ok || !body?.success) {
    return { ok: false, message: String(body?.message || 'GHTK_FETCH_PICKUP_ADDRESSES_FAILED'), data: [] as any[], detail: body }
  }
  const raw = Array.isArray(body?.data) ? body.data : []
  const data = raw.map((row: any) => {
    const id = String(row?.pick_address_id || row?.address_id || row?.id || '').trim()
    const name = String(row?.pick_name || row?.name || row?.contact_name || '').trim()
    const tel = String(row?.pick_tel || row?.phone || row?.tel || '').trim()
    const fullAddress = String(row?.address || row?.pick_address || row?.full_address || '').trim()
    const parsed = parseVietnamAddress(fullAddress)
    return {
      pick_address_id: id,
      pick_name: name,
      pick_tel: tel,
      full_address: fullAddress,
      pick_address: parsed?.detail || fullAddress,
      pick_ward: parsed?.ward || '',
      pick_district: parsed?.district || '',
      pick_province: parsed?.province || ''
    }
  }).filter((v: any) => v.pick_address_id || v.full_address)

  return { ok: true, data }
}

async function ghtkCreateShipment(env: any, db: D1Database, order: any) {
  const token = String(env.GHTK_TOKEN || '').trim()
  const clientSource = String(env.GHTK_CLIENT_SOURCE || '').trim()
  if (!token || !clientSource) return { ok: false, message: 'MISSING_GHTK_KEYS' }

  const pickup = await getGhtkPickupConfig(db, env)
  if (!pickup.pickAddressId && (!pickup.pickName || !pickup.pickAddress || !pickup.pickProvince || !pickup.pickDistrict || !pickup.pickWard || !pickup.pickTel)) {
    return { ok: false, message: 'MISSING_GHTK_PICKUP_CONFIG' }
  }

  const parsedAddress = resolveRecipientAddressForGHTK(env, String(order?.customer_address || ''))
  if (!parsedAddress) return { ok: false, message: 'INVALID_CUSTOMER_ADDRESS_FORMAT' }
  const recipientAddress = normalizeRecipientAddressForGHTK(parsedAddress)
  if (!recipientAddress.detail || !recipientAddress.ward || !recipientAddress.district || !recipientAddress.province) {
    return { ok: false, message: 'INVALID_CUSTOMER_ADDRESS_FORMAT' }
  }

  const weight = Number(env.GHTK_DEFAULT_WEIGHT_KG || 0.5)
  const payload = {
    products: [
      {
        name: String(order?.product_name || 'San pham'),
        weight: Number.isFinite(weight) && weight > 0 ? weight : 0.5,
        quantity: Number(order?.quantity || 1) || 1,
        product_code: ''
      }
    ],
    order: {
      id: String(order?.order_code || order?.id || ''),
      pick_name: pickup.pickName,
      pick_address: pickup.pickAddress,
      pick_province: pickup.pickProvince,
      pick_district: pickup.pickDistrict,
      pick_ward: pickup.pickWard,
      pick_tel: pickup.pickTel,
      pick_address_id: pickup.pickAddressId || undefined,
      name: String(order?.customer_name || ''),
      address: recipientAddress.detail,
      province: recipientAddress.province,
      district: recipientAddress.district,
      ward: recipientAddress.ward,
      hamlet: 'Khac',
      tel: String(order?.customer_phone || ''),
      pick_money: Math.max(0, Math.round(getOrderAmountDueServer(order))),
      value: Math.max(0, Math.round(Number(order?.total_price || 0))),
      pick_option: 'cod',
      transport: 'road',
      note: String(order?.note || '').slice(0, 120)
    }
  }

  const resp = await fetch('https://services.giaohangtietkiem.vn/services/shipment/order/?ver=1.5', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Token': token,
      'X-Client-Source': clientSource
    },
    body: JSON.stringify(payload)
  })
  const body: any = await resp.json().catch(() => ({}))
  if (resp.ok && body?.success && body?.order) return { ok: true, data: body.order, usedFallbackAddress: !!recipientAddress.usedFallback }
  return { ok: false, message: String(body?.message || 'GHTK_CREATE_ORDER_FAILED'), detail: body }
}

async function ghtkFetchLabelPdf(env: any, trackingCode: string, original?: string, pageSize?: string) {
  const token = String(env.GHTK_TOKEN || '').trim()
  const clientSource = String(env.GHTK_CLIENT_SOURCE || '').trim()
  if (!token || !clientSource) throw new Error('MISSING_GHTK_KEYS')

  const url = 'https://services.giaohangtietkiem.vn/services/label/'
    + encodeURIComponent(String(trackingCode || '').trim())
    + '?original=' + encodeURIComponent(normalizeGHTKOriginal(original || env.GHTK_LABEL_ORIGINAL))
    + '&page_size=' + encodeURIComponent(normalizeGHTKPageSize(pageSize || env.GHTK_LABEL_PAGE_SIZE))

  const resp = await fetch(url, {
    method: 'GET',
    headers: {
      'Token': token,
      'X-Client-Source': clientSource
    }
  })
  const contentType = String(resp.headers.get('content-type') || '').toLowerCase()
  if (!resp.ok || contentType.indexOf('application/pdf') < 0) {
    const detail = await resp.text().catch(() => '')
    throw new Error('GHTK_LABEL_FETCH_FAILED:' + detail)
  }
  return new Uint8Array(await resp.arrayBuffer())
}

async function ghtkCancelShipment(env: any, trackingOrder: string) {
  const token = String(env.GHTK_TOKEN || '').trim()
  const clientSource = String(env.GHTK_CLIENT_SOURCE || '').trim()
  if (!token || !clientSource) throw new Error('MISSING_GHTK_KEYS')

  const code = String(trackingOrder || '').trim()
  if (!code) throw new Error('MISSING_GHTK_TRACKING_CODE')

  const resp = await fetch('https://services.giaohangtietkiem.vn/services/shipment/cancel/' + encodeURIComponent(code), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Token': token,
      'X-Client-Source': clientSource
    }
  })
  const body: any = await resp.json().catch(() => ({}))
  const message = String(body?.message || '').trim()
  const alreadyCancelled = /hủy|huy/i.test(message) && /đã|da/i.test(message)
  if (resp.ok && body?.success) return { ok: true, alreadyCancelled: false, detail: body }
  if (alreadyCancelled) return { ok: true, alreadyCancelled: true, detail: body }
  return { ok: false, message: message || 'GHTK_CANCEL_FAILED', detail: body }
}

async function mergePdfBytes(files: Uint8Array[]) {
  const merged = await PDFDocument.create()
  for (const file of files) {
    const src = await PDFDocument.load(file)
    const pages = await merged.copyPages(src, src.getPageIndices())
    for (const p of pages) merged.addPage(p)
  }
  return await merged.save()
}

// --- API: HERO BANNERS ---------------------------------------------
app.get('/api/hero_banners', async (c) => {
  await initDB(c.env.DB)
  const result = await c.env.DB.prepare("SELECT * FROM hero_banners WHERE is_active=1 ORDER BY display_order ASC").all()
  return c.json({ success: true, data: result.results || [] })
})

app.get('/api/admin/hero_banners', async (c) => {
  await initDB(c.env.DB)
  const adminToken = getCookie(c, 'admin_token')
  if (adminToken !== 'super_secret_admin_token') return c.json({ success: false, error: 'Unauthorized' }, 401)
  const result = await c.env.DB.prepare("SELECT * FROM hero_banners ORDER BY display_order ASC, created_at DESC").all()
  return c.json({ success: true, data: result.results || [] })
})

app.post('/api/admin/hero_banners', async (c) => {
  await initDB(c.env.DB)
  const adminToken = getCookie(c, 'admin_token')
  if (adminToken !== 'super_secret_admin_token') return c.json({ success: false, error: 'Unauthorized' }, 401)
  const body = await c.req.json()
  const { image_url, subtitle, title, price, product_id, display_order, is_active } = body
  const res = await c.env.DB.prepare("INSERT INTO hero_banners (image_url, subtitle, title, price, product_id, display_order, is_active) VALUES (?, ?, ?, ?, ?, ?, ?)").bind(
    image_url, subtitle || '', title || '', price || '', product_id ? parseInt(product_id) : null, display_order || 0, is_active !== undefined ? is_active : 1
  ).run()
  return c.json({ success: true, id: res.meta.last_row_id })
})

app.put('/api/admin/hero_banners/:id', async (c) => {
  await initDB(c.env.DB)
  const adminToken = getCookie(c, 'admin_token')
  if (adminToken !== 'super_secret_admin_token') return c.json({ success: false, error: 'Unauthorized' }, 401)
  const id = c.req.param('id')
  const body = await c.req.json()
  const { image_url, subtitle, title, price, product_id, display_order, is_active } = body
  await c.env.DB.prepare("UPDATE hero_banners SET image_url=?, subtitle=?, title=?, price=?, product_id=?, display_order=?, is_active=? WHERE id=?").bind(
    image_url, subtitle || '', title || '', price || '', product_id ? parseInt(product_id) : null, display_order || 0, is_active !== undefined ? is_active : 1, id
  ).run()
  return c.json({ success: true })
})

app.delete('/api/admin/hero_banners/:id', async (c) => {
  await initDB(c.env.DB)
  const adminToken = getCookie(c, 'admin_token')
  if (adminToken !== 'super_secret_admin_token') return c.json({ success: false, error: 'Unauthorized' }, 401)
  const id = c.req.param('id')
  await c.env.DB.prepare("DELETE FROM hero_banners WHERE id=?").bind(id).run()
  return c.json({ success: true })
})

app.get('/api/admin/ghtk/pickup-config', async (c) => {
  try {
    await initDB(c.env.DB)
    const config = await getGhtkPickupConfig(c.env.DB, c.env)
    return c.json({
      success: true,
      data: config,
      has_ghtk_keys: !!String(c.env.GHTK_TOKEN || '').trim() && !!String(c.env.GHTK_CLIENT_SOURCE || '').trim()
    })
  } catch (e: any) {
    return c.json({ success: false, error: e.message }, 500)
  }
})

app.put('/api/admin/ghtk/pickup-config', async (c) => {
  try {
    await initDB(c.env.DB)
    const body: any = await c.req.json().catch(() => ({}))
    const sanitize = (value: any, max = 200) => String(value || '').trim().slice(0, max)
    const payload = {
      pickAddressId: sanitize(body.pick_address_id, 80),
      pickName: sanitize(body.pick_name, 120),
      pickAddress: sanitize(body.pick_address, 220),
      pickProvince: sanitize(body.pick_province, 80),
      pickDistrict: sanitize(body.pick_district, 80),
      pickWard: sanitize(body.pick_ward, 80),
      pickTel: sanitize(body.pick_tel, 30)
    }
    await upsertAppSettings(c.env.DB, [
      { key: 'ghtk_pick_address_id', value: payload.pickAddressId },
      { key: 'ghtk_pick_name', value: payload.pickName },
      { key: 'ghtk_pick_address', value: payload.pickAddress },
      { key: 'ghtk_pick_province', value: payload.pickProvince },
      { key: 'ghtk_pick_district', value: payload.pickDistrict },
      { key: 'ghtk_pick_ward', value: payload.pickWard },
      { key: 'ghtk_pick_tel', value: payload.pickTel }
    ])
    return c.json({ success: true })
  } catch (e: any) {
    return c.json({ success: false, error: e.message }, 500)
  }
})

app.get('/api/admin/ghtk/pickup-addresses', async (c) => {
  try {
    await initDB(c.env.DB)
    const sync = await ghtkFetchPickupAddresses(c.env)
    if (!sync.ok) {
      return c.json({ success: false, error: sync.message, detail: (sync as any).detail || null }, 400)
    }
    return c.json({ success: true, data: sync.data || [] })
  } catch (e: any) {
    return c.json({ success: false, error: e.message }, 500)
  }
})

app.get('/api/admin/profile', async (c) => {
  try {
    await initDB(c.env.DB)
    const profile = await resolveAdminProfile(c.env.DB, c)
    return c.json({ success: true, data: profile })
  } catch (e: any) {
    return c.json({ success: false, error: e.message }, 500)
  }
})

app.put('/api/admin/profile/avatar', async (c) => {
  try {
    await initDB(c.env.DB)
    const body: any = await c.req.json().catch(() => ({}))
    const avatar = String(body.avatar || '').trim()
    if (avatar && !/^data:image\/(png|jpe?g|webp);base64,/i.test(avatar)) {
      return c.json({ success: false, error: 'INVALID_AVATAR_FORMAT' }, 400)
    }
    if (avatar.length > 700000) {
      return c.json({ success: false, error: 'AVATAR_TOO_LARGE' }, 400)
    }
    const profile = await resolveAdminProfile(c.env.DB, c)
    if (profile.scope === 'db-user' && Number(profile.userId || 0) > 0) {
      await c.env.DB.prepare("UPDATE users SET avatar=? WHERE id=?").bind(avatar || null, profile.userId).run()
    } else {
      await upsertAppSettings(c.env.DB, [{ key: `admin_avatar_${profile.adminUserKey}`, value: avatar }])
    }
    const latest = await resolveAdminProfile(c.env.DB, c)
    return c.json({ success: true, data: latest })
  } catch (e: any) {
    return c.json({ success: false, error: e.message }, 500)
  }
})

app.put('/api/admin/profile/password', async (c) => {
  try {
    await initDB(c.env.DB)
    const body: any = await c.req.json().catch(() => ({}))
    const oldPassword = String(body.old_password || '')
    const newPassword = String(body.new_password || '')
    if (!oldPassword || !newPassword) return c.json({ success: false, error: 'MISSING_PASSWORD' }, 400)
    if (newPassword.length < 6 || newPassword.length > 64) {
      return c.json({ success: false, error: 'PASSWORD_LENGTH_INVALID' }, 400)
    }

    const adminUserKey = normalizeAdminUserKey(getCookie(c, 'admin_user_key') || 'admin')
    const settingKey = `admin_password_${adminUserKey}`
    const storedPassword = await getAppSettingValue(c.env.DB, settingKey)
    const currentPassword = storedPassword || (adminUserKey === 'admin' ? 'admin' : '')
    if (!currentPassword || oldPassword !== currentPassword) {
      return c.json({ success: false, error: 'OLD_PASSWORD_INCORRECT' }, 400)
    }

    await upsertAppSettings(c.env.DB, [{ key: settingKey, value: newPassword }])
    return c.json({ success: true })
  } catch (e: any) {
    return c.json({ success: false, error: e.message }, 500)
  }
})

// --- API: AUTH -------------------------------------------------
app.post('/api/admin/login', async (c) => {
  await initDB(c.env.DB)
  const body = await c.req.json()
  const { username, password } = body
  const adminKey = normalizeAdminUserKey(username)
  const storedPassword = await getAppSettingValue(c.env.DB, `admin_password_${adminKey}`)
  const expectedPassword = storedPassword || (adminKey === 'admin' ? 'admin' : '')
  if (expectedPassword && password === expectedPassword) {
    // Ensure admin session is not mixed with a previous Google user session.
    deleteCookie(c, 'user_id', { path: '/' })
    setCookie(c, 'admin_token', 'super_secret_admin_token', { path: '/', maxAge: 86400 * 30, httpOnly: true })
    setCookie(c, 'admin_user_key', adminKey, { path: '/', maxAge: 86400 * 30, httpOnly: true })
    return c.json({ success: true })
  }
  return c.json({ success: false, error: 'Invalid credentials' }, 401)
})

app.get('/api/auth/me', async (c) => {
  const adminToken = getCookie(c, 'admin_token')
  const userToken = getCookie(c, 'user_id')

  let isAdmin = adminToken === 'super_secret_admin_token'
  let currentUser = null

  let dbError = null

  if (isAdmin) {
    try {
      await initDB(c.env.DB)
      currentUser = await resolveAdminProfile(c.env.DB, c)
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
      if (user) {
        currentUser = user
      }
    } catch (e: any) { dbError = e.message }
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
    // Fallback for local testing without GOOGLE_CLIENT_ID
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

  await initDB(c.env.DB)

  if (!clientId || !clientSecret || code === 'mock_google_code') {
    try {
      // Mock login fallback
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

app.get('/api/user/orders', async (c) => {
  const userId = getCookie(c, 'user_id')
  if (!userId) return c.json({ success: false, error: 'Unauthorized' }, 401)
  const orders = await c.env.DB.prepare(`
    SELECT *,
           CASE WHEN LOWER(COALESCE(payment_status, ''))='paid' THEN 0 ELSE total_price END AS amount_due
    FROM orders
    WHERE user_id=?
    ORDER BY created_at DESC
  `).bind(userId).all()
  return c.json({ success: true, data: orders.results || [] })
})


app.post('/api/webhooks/casso', async (c) => {
  try {
    const body = await c.req.json()
    if (body.error !== 0) return c.json({ success: false })

    const secureToken = c.req.header('secure-token')
    if (c.env.CASSO_SECURE_TOKEN && secureToken !== c.env.CASSO_SECURE_TOKEN) {
      return c.json({ error: 'Invalid token' }, 401)
    }

    await initDB(c.env.DB)
    const transactions = body.data || []

    let count = 0;
    for (const tx of transactions) {
      const exists = await c.env.DB.prepare("SELECT id FROM transactions WHERE tid=?").bind(tx.tid).first()
      if (exists) continue;

      const desc = (tx.description || '').toUpperCase()
      const match = desc.match(/QHVN90(\d+)/)

      if (match) {
        const userId = match[1]
        const amount = tx.amount
        await c.env.DB.prepare("UPDATE users SET balance = balance + ? WHERE id = ?").bind(amount, userId).run()
        await c.env.DB.prepare("INSERT INTO transactions (tid, amount, description, user_id) VALUES (?, ?, ?, ?)").bind(tx.tid, amount, tx.description, userId).run()
        count++;
      } else {
        await c.env.DB.prepare("INSERT INTO transactions (tid, amount, description) VALUES (?, ?, ?)").bind(tx.tid, tx.amount, tx.description).run()
      }
    }

    return c.json({ success: true, processed: count })
  } catch (e: any) {
    return c.json({ success: false, error: e.message }, 500)
  }
})

// --- API: PRODUCTS ---------------------------------------------

// GET all active products (public)
app.get('/api/products', async (c) => {
  try {
    await initDB(c.env.DB)
    const result = await c.env.DB.prepare(
      `SELECT * FROM products WHERE is_active = 1 ORDER BY created_at DESC`
    ).all()
    return c.json({ success: true, data: result.results || [] })
  } catch (e: any) {
    return c.json({ success: false, error: e.message }, 500)
  }
})

// GET single product
app.get('/api/products/:id', async (c) => {
  try {
    const id = c.req.param('id')
    const row = await c.env.DB.prepare(`SELECT * FROM products WHERE id = ?`).bind(id).first()
    if (!row) return c.json({ success: false, error: 'Not found' }, 404)
    return c.json({
      success: true,
      data: {
        ...row,
        color_options: parseColorOptions((row as any).colors),
        color_names: compactColorNamesJson((row as any).colors)
      }
    })
  } catch (e: any) {
    return c.json({ success: false, error: e.message }, 500)
  }
})

// GET all products (admin)
app.get('/api/admin/products/:id', async (c) => {
  try {
    await initDB(c.env.DB)
    const id = c.req.param('id')
    const row = await c.env.DB.prepare(`SELECT * FROM products WHERE id = ?`).bind(id).first()
    if (!row) return c.json({ success: false, error: 'Không tìm thấy sản phẩm' }, 404)
    const images = (() => {
      try {
        const parsed = JSON.parse(String((row as any).images || '[]'))
        return normalizeImageList(parsed)
      } catch {
        return []
      }
    })()
    const sizes = (() => {
      try {
        const parsed = JSON.parse(String((row as any).sizes || '[]'))
        return Array.isArray(parsed) ? parsed.map((v) => String(v || '').trim()).filter(Boolean) : []
      } catch {
        return []
      }
    })()
    return c.json({
      success: true,
      data: {
        ...row,
        image_list: images,
        size_list: sizes,
        color_options: parseColorOptions((row as any).colors),
        color_names: compactColorNamesJson((row as any).colors)
      }
    })
  } catch (e: any) {
    return c.json({ success: false, error: e.message }, 500)
  }
})

app.get('/api/admin/products', async (c) => {
  try {
    await initDB(c.env.DB)
    const result = await c.env.DB.prepare(
      `SELECT id, name, description, price, original_price, category, brand, material, thumbnail, colors, sizes, stock, is_active, is_featured, is_trending, trending_order, created_at, updated_at, display_order
       FROM products ORDER BY created_at DESC`
    ).all()
    const rows = (result.results || []).map((row: any) => ({
      ...row,
      colors: compactColorNamesJson(row.colors),
      color_names: compactColorNamesJson(row.colors)
    }))
    return c.json({ success: true, data: rows })
  } catch (e: any) {
    return c.json({ success: false, error: e.message }, 500)
  }
})

function normalizeImageList(input: any): string[] {
  if (!Array.isArray(input)) return []
  return input.map((v) => String(v || '').trim()).filter(Boolean)
}

function normalizeColorOptionsInput(input: any): Array<{ name: string; image: string }> {
  if (!Array.isArray(input)) return []
  const out: Array<{ name: string; image: string }> = []
  for (const item of input) {
    if (typeof item === 'string') {
      const name = String(item || '').trim()
      if (name) out.push({ name, image: '' })
      continue
    }
    if (item && typeof item === 'object') {
      const name = String((item as any).name || (item as any).label || '').trim()
      const image = String((item as any).image || (item as any).image_url || '').trim()
      if (name || image) out.push({ name, image })
    }
  }
  return out
}

function parseColorOptions(raw: any): Array<{ name: string; image: string }> {
  const parsed = Array.isArray(raw)
    ? raw
    : (() => {
        try {
          const value = JSON.parse(String(raw || '[]'))
          return Array.isArray(value) ? value : []
        } catch {
          return []
        }
      })()
  return normalizeColorOptionsInput(parsed)
}

function resolveSelectedColorImage(productColors: any, selectedColor: any, fallbackImage = ''): string {
  const selected = String(selectedColor || '').trim().toLowerCase()
  if (!selected) return String(fallbackImage || '').trim()
  const colors = parseColorOptions(productColors)
  if (!colors.length) return String(fallbackImage || '').trim()
  const matched =
    colors.find((item) => String(item.name || '').trim().toLowerCase() === selected) ||
    colors.find((item) => {
      const name = String(item.name || '').trim().toLowerCase()
      return name.includes(selected) || selected.includes(name)
    })
  if (matched && String(matched.image || '').trim()) return String(matched.image).trim()
  return String(fallbackImage || '').trim()
}

function compactColorNamesJson(raw: any): string {
  let arr: any[] = []
  try { arr = JSON.parse(String(raw || '[]')) } catch { arr = [] }
  if (!Array.isArray(arr)) return '[]'
  const names = arr.map((item: any) => {
    if (typeof item === 'string') return String(item || '').trim()
    if (item && typeof item === 'object') return String(item.name || item.label || '').trim()
    return ''
  }).filter(Boolean)
  return JSON.stringify(names)
}

// POST create product
app.post('/api/admin/products', async (c) => {
  try {
    await initDB(c.env.DB)
    const body = await c.req.json()
    const {
      name, description, price, original_price,
      category, brand, material, thumbnail,
      images, colors, sizes, stock, is_featured, is_trending, trending_order
    } = body

    if (!name || !price) {
      return c.json({ success: false, error: 'Name and price are required' }, 400)
    }
    const normalizedImages = normalizeImageList(images)
    const normalizedColors = normalizeColorOptionsInput(colors)
    const normalizedThumbnail = String(thumbnail || '').trim()
    if (!normalizedThumbnail && normalizedImages.length === 0) {
      return c.json({ success: false, error: 'Product image is required' }, 400)
    }

    const result = await c.env.DB.prepare(`
      INSERT INTO products 
        (name, description, price, original_price, category, brand, material, thumbnail, images, colors, sizes, stock, is_featured, is_trending, trending_order)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      name,
      description || '',
      parseFloat(price),
      original_price ? parseFloat(original_price) : null,
      category || 'unisex',
      brand || '',
      material || '',
      normalizedThumbnail,
      JSON.stringify(normalizedImages),
      JSON.stringify(normalizedColors),
      JSON.stringify(sizes || []),
      parseInt(stock) || 0,
      is_featured ? 1 : 0,
      is_trending ? 1 : 0,
      parseInt(trending_order) || 0
    ).run()

    return c.json({ success: true, id: result.meta.last_row_id })
  } catch (e: any) {
    return c.json({ success: false, error: e.message }, 500)
  }
})

// PUT update product
app.put('/api/admin/products/:id', async (c) => {
  try {
    const id = c.req.param('id')
    const body = await c.req.json()
    const {
      name, description, price, original_price,
      category, brand, material, thumbnail,
      images, colors, sizes, stock, is_active, is_featured, is_trending, trending_order
    } = body

    const normalizedImages = normalizeImageList(images)
    const normalizedColors = normalizeColorOptionsInput(colors)
    const normalizedThumbnail = String(thumbnail || '').trim()
    if (!normalizedThumbnail && normalizedImages.length === 0) {
      return c.json({ success: false, error: 'Product image is required' }, 400)
    }

    await c.env.DB.prepare(`
      UPDATE products SET
        name=?, description=?, price=?, original_price=?,
        category=?, brand=?, material=?, thumbnail=?,
        images=?, colors=?, sizes=?, stock=?, is_active=?, is_featured=?, is_trending=?, trending_order=?,
        updated_at=CURRENT_TIMESTAMP
      WHERE id=?
    `).bind(
      name,
      description || '',
      parseFloat(price),
      original_price ? parseFloat(original_price) : null,
      category || 'unisex',
      brand || '',
      material || '',
      normalizedThumbnail,
      JSON.stringify(normalizedImages),
      JSON.stringify(normalizedColors),
      JSON.stringify(sizes || []),
      parseInt(stock) || 0,
      is_active !== undefined ? (is_active ? 1 : 0) : 1,
      is_featured ? 1 : 0,
      is_trending ? 1 : 0,
      parseInt(trending_order) || 0,
      id
    ).run()

    return c.json({ success: true })
  } catch (e: any) {
    return c.json({ success: false, error: e.message }, 500)
  }
})

// DELETE product
app.delete('/api/admin/products/:id', async (c) => {
  try {
    const id = c.req.param('id')
    await c.env.DB.prepare(`DELETE FROM products WHERE id = ?`).bind(id).run()
    return c.json({ success: true })
  } catch (e: any) {
    return c.json({ success: false, error: e.message }, 500)
  }
})

// PATCH toggle active
app.patch('/api/admin/products/:id/toggle', async (c) => {
  try {
    const id = c.req.param('id')
    await c.env.DB.prepare(`
      UPDATE products SET is_active = CASE WHEN is_active=1 THEN 0 ELSE 1 END,
      updated_at=CURRENT_TIMESTAMP WHERE id=?
    `).bind(id).run()
    return c.json({ success: true })
  } catch (e: any) {
    return c.json({ success: false, error: e.message }, 500)
  }
})

// PATCH toggle featured + set display_order
app.patch('/api/admin/products/:id/featured', async (c) => {
  try {
    const id = c.req.param('id')
    const body = await c.req.json()
    const { is_featured, display_order } = body

    await c.env.DB.prepare(`
      UPDATE products SET is_featured=?, display_order=?,
      updated_at=CURRENT_TIMESTAMP WHERE id=?
    `).bind(is_featured ? 1 : 0, display_order ?? 0, id).run()

    return c.json({ success: true })
  } catch (e: any) {
    return c.json({ success: false, error: e.message }, 500)
  }
})

// GET featured products for storefront
app.get('/api/featured-products', async (c) => {
  try {
    await initDB(c.env.DB)
    const res = await c.env.DB.prepare(
      `SELECT * FROM products WHERE is_active=1 AND is_featured=1 ORDER BY display_order ASC, id DESC`
    ).all()
    return c.json({ success: true, data: res.results || [] })
  } catch (e: any) {
    return c.json({ success: false, error: e.message }, 500)
  }
})

// GET trending products for stacked "Dang thinh hanh" section
app.get('/api/trending-products', async (c) => {
  try {
    await initDB(c.env.DB)
    const res = await c.env.DB.prepare(
      `SELECT * FROM products WHERE is_active=1 AND is_trending=1
       ORDER BY
         CASE WHEN COALESCE(trending_order, 0) > 0 THEN 0 ELSE 1 END ASC,
         CASE WHEN COALESCE(trending_order, 0) > 0 THEN trending_order ELSE 999999 END ASC,
         datetime(updated_at) DESC,
         id DESC`
    ).all()
    return c.json({ success: true, data: res.results || [] })
  } catch (e: any) {
    return c.json({ success: false, error: e.message }, 500)
  }
})

// --- API: ORDERS -----------------------------------------------

function generateNumericOrderSuffix6() {
  return Math.floor(Math.random() * 1000000).toString().padStart(6, '0')
}

async function generateUniqueOrderCode(db: D1Database) {
  for (let i = 0; i < 12; i++) {
    const code = 'QH' + generateNumericOrderSuffix6()
    const existing = await db.prepare(`SELECT id FROM orders WHERE order_code=? LIMIT 1`).bind(code).first()
    if (!existing) return code
  }
  const fallback = Date.now().toString().slice(-6).padStart(6, '0')
  return 'QH' + fallback
}

// POST create order (public)
app.post('/api/orders', async (c) => {
  try {
    await initDB(c.env.DB)
    const body = await c.req.json()
    const {
      customer_name, customer_phone, customer_address,
      product_id, color, selected_color_image, size, quantity, note, voucher_code, payment_method
    } = body

    if (!customer_name || !customer_phone || !customer_address || !product_id) {
      return c.json({ success: false, error: 'Missing required fields' }, 400)
    }

    const product = await c.env.DB.prepare(`SELECT * FROM products WHERE id=? AND is_active=1`).bind(product_id).first() as any
    if (!product) return c.json({ success: false, error: 'Product not found' }, 404)

    const qty = parseInt(quantity) || 1
    let discount = 0

    // Validate voucher if provided
    if (voucher_code && voucher_code.trim()) {
      const now = new Date().toISOString()
      const voucher = await c.env.DB.prepare(
        `SELECT * FROM vouchers WHERE code=? AND is_active=1 AND valid_from<=? AND valid_to>=?`
      ).bind(voucher_code.trim().toUpperCase(), now, now).first() as any

      if (!voucher) {
        return c.json({ success: false, error: 'INVALID_VOUCHER' }, 400)
      }
      if (voucher.usage_limit > 0 && voucher.used_count >= voucher.usage_limit) {
        return c.json({ success: false, error: 'VOUCHER_LIMIT' }, 400)
      }
      discount = voucher.discount_amount

      // Increment used_count
      await c.env.DB.prepare(`UPDATE vouchers SET used_count=used_count+1 WHERE id=?`).bind(voucher.id).run()
    }

    const subtotal = product.price * qty
    const total = Math.max(0, subtotal - discount)
    const orderCode = await generateUniqueOrderCode(c.env.DB)
    const normalizedPaymentMethod = String(payment_method || '').toUpperCase()
    const paymentMethod = ['COD', 'ZALOPAY', 'MOMO', 'BANK_TRANSFER'].includes(normalizedPaymentMethod)
      ? normalizedPaymentMethod
      : 'COD'
    const selectedColorImage = String(selected_color_image || '').trim()
      || resolveSelectedColorImage(product.colors, color, product.thumbnail || '')

    const result = await c.env.DB.prepare(`
      INSERT INTO orders 
        (user_id, order_code, customer_name, customer_phone, customer_address, product_id, product_name, product_price, color, selected_color_image, size, quantity, total_price, voucher_code, discount_amount, note, payment_method)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      getCookie(c, 'user_id') || null,
      orderCode,
      customer_name,
      customer_phone,
      customer_address,
      product_id,
      product.name,
      product.price,
      color || '',
      selectedColorImage || '',
      size || '',
      qty,
      total,
      voucher_code ? voucher_code.trim().toUpperCase() : '',
      discount,
      note || '',
      paymentMethod
    ).run()

    return c.json({ success: true, order_code: orderCode, id: result.meta.last_row_id, discount, total })
  } catch (e: any) {
    return c.json({ success: false, error: e.message }, 500)
  }
})

// GET all orders (admin)
app.get('/api/admin/orders', async (c) => {
  try {
    await initDB(c.env.DB)
    const status = c.req.query('status')
    const includeInternal = c.req.query('include_internal') === '1'
    const internalFilterSql = includeInternal ? '1=1' : `NOT ${buildInternalTestOrderWhereSql('o')}`
    const shippingQueueOnly = c.req.query('shipping_queue') === '1'
    const shippingQueueSql = shippingQueueOnly
      ? `AND (
           UPPER(COALESCE(o.payment_method, '')) = 'COD'
           OR (
             UPPER(COALESCE(o.payment_method, '')) IN ('BANK_TRANSFER', 'ZALOPAY')
             AND LOWER(COALESCE(o.payment_status, '')) = 'paid'
           )
         )`
      : ''
    let query = `
      SELECT o.*,
             p.thumbnail AS product_thumbnail,
             CASE WHEN LOWER(COALESCE(o.payment_status, ''))='paid' THEN 0 ELSE o.total_price END AS amount_due
      FROM orders o
      LEFT JOIN products p ON p.id = o.product_id
      WHERE ${internalFilterSql}
      ${shippingQueueSql}
      ORDER BY o.created_at DESC
    `
    if (status && status !== 'all') {
      query = `
        SELECT o.*,
               p.thumbnail AS product_thumbnail,
               CASE WHEN LOWER(COALESCE(o.payment_status, ''))='paid' THEN 0 ELSE o.total_price END AS amount_due
        FROM orders o
        LEFT JOIN products p ON p.id = o.product_id
        WHERE o.status=? AND ${internalFilterSql}
        ${shippingQueueSql}
        ORDER BY o.created_at DESC
      `
    }
    const stmt = status && status !== 'all'
      ? c.env.DB.prepare(query).bind(status)
      : c.env.DB.prepare(query)
    const result2 = await stmt.all()
    return c.json({ success: true, data: result2.results || [] })
  } catch (e: any) {
    return c.json({ success: false, error: e.message }, 500)
  }
})

// PATCH update order status
app.patch('/api/admin/orders/:id/status', async (c) => {
  try {
    await initDB(c.env.DB)
    const id = c.req.param('id')
    const { status } = await c.req.json()
    const nextStatus = String(status || '').trim().toLowerCase()
    const existing = await c.env.DB.prepare(`
      SELECT id, status, shipping_carrier, shipping_tracking_code, shipping_arranged
      FROM orders
      WHERE id=?
      LIMIT 1
    `).bind(id).first() as any
    if (!existing) return c.json({ success: false, error: 'ORDER_NOT_FOUND' }, 404)

    if (nextStatus === 'cancelled') {
      const carrier = String(existing.shipping_carrier || '').trim().toUpperCase()
      const trackingCode = String(existing.shipping_tracking_code || '').trim()
      if (carrier === 'GHTK' && trackingCode) {
        const cancelRes = await ghtkCancelShipment(c.env, trackingCode)
        if (!cancelRes.ok) {
          return c.json({ success: false, error: cancelRes.message || 'GHTK_CANCEL_FAILED', detail: cancelRes.detail || null }, 400)
        }
      }
    }
    await c.env.DB.prepare(`
      UPDATE orders SET status=?, updated_at=CURRENT_TIMESTAMP WHERE id=?
    `).bind(nextStatus, id).run()
    return c.json({ success: true, status: nextStatus })
  } catch (e: any) {
    return c.json({ success: false, error: e.message }, 500)
  }
})

// DELETE order
app.delete('/api/admin/orders/:id', async (c) => {
  try {
    const id = c.req.param('id')
    await c.env.DB.prepare(`DELETE FROM orders WHERE id = ?`).bind(id).run()
    return c.json({ success: true })
  } catch (e: any) {
    return c.json({ success: false, error: e.message }, 500)
  }
})

app.post('/api/admin/orders/arrange-shipping', async (c) => {
  try {
    await initDB(c.env.DB)
    const body: any = await c.req.json().catch(() => ({}))
    const ids = Array.isArray(body.ids) ? body.ids.map((v: any) => Number(v)).filter((v: number) => Number.isFinite(v) && v > 0) : []
    if (!ids.length) return c.json({ success: false, error: 'NO_ORDER_IDS' }, 400)

    const orderQuery = `
      SELECT id, order_code, customer_name, customer_phone, customer_address, product_name,
             quantity, total_price, note, payment_status, status, shipping_tracking_code
      FROM orders
      WHERE id IN (${ids.map(() => '?').join(',')})
    `
    const orderResult = await c.env.DB.prepare(orderQuery).bind(...ids).all()
    const rows = (orderResult.results || []) as any[]
    const map = new Map<number, any>(rows.map((o) => [Number(o.id), o]))

    const updated: any[] = []
    const failed: any[] = []
    for (const id of ids) {
      const order = map.get(Number(id))
      if (!order) {
        failed.push({ id, error: 'ORDER_NOT_FOUND' })
        continue
      }
      const status = String(order.status || '').toLowerCase()
      if (status === 'done' || status === 'cancelled') {
        failed.push({ id, order_code: order.order_code, error: 'ORDER_CLOSED' })
        continue
      }

      let trackingCode = String(order.shipping_tracking_code || '').trim()
      let labelCode = ''
      let fee = 0
      if (!trackingCode) {
        const createRes: any = await ghtkCreateShipment(c.env, c.env.DB, order)
        if (!createRes.ok) {
          failed.push({ id, order_code: order.order_code, error: createRes.message || 'GHTK_CREATE_ORDER_FAILED', detail: createRes.detail || null })
          continue
        }
        trackingCode = String(createRes.data?.label || createRes.data?.tracking_id || '').trim()
        labelCode = String(createRes.data?.label || '').trim()
        fee = Number(createRes.data?.fee || 0) || 0
        if (!trackingCode) {
          failed.push({ id, order_code: order.order_code, error: 'GHTK_TRACKING_EMPTY', detail: createRes.data || null })
          continue
        }
        updated.push({
          id,
          order_code: order.order_code,
          tracking_code: trackingCode,
          carrier: 'GHTK',
          used_fallback_address: !!createRes.usedFallbackAddress
        })
      } else {
        updated.push({ id, order_code: order.order_code, tracking_code: trackingCode, carrier: 'GHTK', reused_tracking: true })
      }

      await c.env.DB.prepare(`
        UPDATE orders
        SET shipping_arranged=1,
            shipping_arranged_at=COALESCE(shipping_arranged_at, CURRENT_TIMESTAMP),
            shipping_carrier='GHTK',
            shipping_tracking_code=COALESCE(NULLIF(?, ''), shipping_tracking_code),
            shipping_label=COALESCE(NULLIF(?, ''), shipping_label),
            shipping_fee=CASE WHEN ? > 0 THEN ? ELSE shipping_fee END,
            status=CASE WHEN status='pending' THEN 'confirmed' ELSE status END,
            updated_at=CURRENT_TIMESTAMP
        WHERE id=?
      `).bind(trackingCode, labelCode, fee, fee, id).run()

    }

    return c.json({
      success: failed.length === 0,
      updated_count: updated.length,
      failed_count: failed.length,
      updated,
      failed
    })
  } catch (e: any) {
    return c.json({ success: false, error: e.message }, 500)
  }
})

app.get('/api/admin/orders/ghtk/print-labels', async (c) => {
  try {
    await initDB(c.env.DB)
    const ids = String(c.req.query('ids') || '')
      .split(',')
      .map((v) => Number(v.trim()))
      .filter((v) => Number.isFinite(v) && v > 0)
    if (!ids.length) return c.json({ success: false, error: 'NO_ORDER_IDS' }, 400)

    const ordersResult = await c.env.DB.prepare(`
      SELECT id, shipping_carrier, shipping_tracking_code
      FROM orders
      WHERE id IN (${ids.map(() => '?').join(',')})
    `).bind(...ids).all()
    const orders = (ordersResult.results || []) as any[]
    const selected = ids
      .map((id) => orders.find((o) => Number(o.id) === id))
      .filter(Boolean)
      .filter((o: any) => String(o.shipping_carrier || '').toUpperCase() === 'GHTK' && String(o.shipping_tracking_code || '').trim())
    if (!selected.length) return c.json({ success: false, error: 'NO_GHTK_TRACKING_FOUND' }, 400)

    const files: Uint8Array[] = []
    for (const row of selected) {
      files.push(await ghtkFetchLabelPdf(c.env, String(row.shipping_tracking_code), c.req.query('original'), c.req.query('page_size')))
    }
    const merged = files.length === 1 ? files[0] : await mergePdfBytes(files)
    return new Response(merged, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="ghtk-labels-${new Date().toISOString().slice(0, 10)}.pdf"`,
        'Cache-Control': 'no-store'
      }
    })
  } catch (e: any) {
    return c.json({ success: false, error: e.message }, 500)
  }
})

// GET payment status by order code (public - used for polling QR payment result)
app.get('/api/orders/:orderCode/payment-status', async (c) => {
  try {
    await initDB(c.env.DB)
    const orderCode = String(c.req.param('orderCode') || '').trim().toUpperCase()
    if (!orderCode) return c.json({ success: false, error: 'MISSING_ORDER_CODE' }, 400)
    const order = await c.env.DB.prepare(`
      SELECT id, order_code, payment_status, payment_paid_at, status, payment_method, payment_link_id, payment_order_code, total_price
      FROM orders
      WHERE order_code=?
    `).bind(orderCode).first() as any
    if (!order) return c.json({ success: false, error: 'ORDER_NOT_FOUND' }, 404)
    await syncOrderPayment(c.env.DB, c.env, order)
    const latest = await c.env.DB.prepare(`SELECT order_code, payment_status, payment_paid_at, status FROM orders WHERE id=?`).bind(order.id).first() as any
    return c.json({ success: true, data: latest || order })
  } catch (e: any) {
    return c.json({ success: false, error: e.message }, 500)
  }
})

app.post('/api/orders/:id/payos-sync', async (c) => {
  try {
    await initDB(c.env.DB)
    const id = Number(c.req.param('id') || 0)
    if (!id) return c.json({ success: false, error: 'INVALID_ORDER_ID' }, 400)
    const order = await c.env.DB.prepare(`
      SELECT id, order_code, payment_status, payment_paid_at, status, payment_method, payment_link_id, payment_order_code, total_price
      FROM orders
      WHERE id=?
    `).bind(id).first() as any
    if (!order) return c.json({ success: false, error: 'ORDER_NOT_FOUND' }, 404)
    const sync = await syncOrderPaymentWithPayOS(c.env.DB, c.env, order)
    const latest = await c.env.DB.prepare(`SELECT order_code, payment_status, payment_paid_at, status FROM orders WHERE id=?`).bind(id).first() as any
    return c.json({ success: true, data: latest || order, synced: !!sync.synced })
  } catch (e: any) {
    return c.json({ success: false, error: e.message }, 500)
  }
})

app.post('/api/orders/:id/zalopay-sync', async (c) => {
  try {
    await initDB(c.env.DB)
    const id = Number(c.req.param('id') || 0)
    if (!id) return c.json({ success: false, error: 'INVALID_ORDER_ID' }, 400)
    const order = await c.env.DB.prepare(`
      SELECT id, order_code, payment_status, payment_paid_at, status, payment_method, payment_link_id, payment_order_code, total_price
      FROM orders
      WHERE id=?
    `).bind(id).first() as any
    if (!order) return c.json({ success: false, error: 'ORDER_NOT_FOUND' }, 404)
    const sync = await syncOrderPaymentWithZaloPay(c.env.DB, c.env, order)
    const latest = await c.env.DB.prepare(`SELECT order_code, payment_status, payment_paid_at, status FROM orders WHERE id=?`).bind(id).first() as any
    return c.json({ success: true, data: latest || order, synced: !!sync.synced })
  } catch (e: any) {
    return c.json({ success: false, error: e.message }, 500)
  }
})

app.get('/api/payments/zalopay/config', async (c) => {
  const config = getZaloPayConfig(c.env)
  const missing = getZaloPayMissingConfigKeys(config)
  return c.json({
    success: true,
    data: {
      ready: missing.length === 0,
      missing
    }
  })
})

app.get('/api/address/provinces', async (c) => {
  try {
    const effectiveDate = sanitizeAddressEffectiveDate(c.req.query('effectiveDate') || 'latest')
    if (addressKitCache.provinces.has(effectiveDate)) {
      return c.json({ success: true, data: addressKitCache.provinces.get(effectiveDate) || [] })
    }

    const url = `${ADDRESS_KIT_BASE_URL}/${effectiveDate}/provinces`
    const res = await fetch(url, { headers: { accept: 'application/json' } })
    if (!res.ok) return c.json({ success: false, error: 'ADDRESSKIT_UPSTREAM_FAILED' }, 502)

    const json: any = await res.json().catch(() => ({}))
    const provinces = Array.isArray(json?.provinces) ? json.provinces : []
    const normalized = provinces
      .map((p: any) => ({
        code: String(p?.code || '').trim(),
        name: String(p?.name || '').trim(),
        administrativeLevel: String(p?.administrativeLevel || '').trim()
      }))
      .filter((p: any) => p.code && p.name)
      .sort((a: any, b: any) => a.name.localeCompare(b.name, 'vi'))

    addressKitCache.provinces.set(effectiveDate, normalized)
    return c.json({ success: true, data: normalized })
  } catch (e: any) {
    return c.json({ success: false, error: e?.message || 'ADDRESSKIT_FETCH_FAILED' }, 500)
  }
})

app.get('/api/address/provinces/:provinceCode/communes', async (c) => {
  try {
    const effectiveDate = sanitizeAddressEffectiveDate(c.req.query('effectiveDate') || 'latest')
    const provinceCode = String(c.req.param('provinceCode') || '').trim()
    if (!provinceCode) return c.json({ success: false, error: 'INVALID_PROVINCE_CODE' }, 400)
    const cacheKey = `${effectiveDate}:${provinceCode}`
    if (addressKitCache.communes.has(cacheKey)) {
      return c.json({ success: true, data: addressKitCache.communes.get(cacheKey) || [] })
    }

    const encodedProvinceCode = encodeURIComponent(provinceCode)
    const url = `${ADDRESS_KIT_BASE_URL}/${effectiveDate}/provinces/${encodedProvinceCode}/communes`
    const res = await fetch(url, { headers: { accept: 'application/json' } })
    if (!res.ok) return c.json({ success: false, error: 'ADDRESSKIT_UPSTREAM_FAILED' }, 502)

    const json: any = await res.json().catch(() => ({}))
    const communes = Array.isArray(json?.communes) ? json.communes : []
    const normalized = communes
      .map((p: any) => ({
        code: String(p?.code || '').trim(),
        name: String(p?.name || '').trim(),
        administrativeLevel: String(p?.administrativeLevel || '').trim(),
        provinceCode: String(p?.provinceCode || '').trim(),
        provinceName: String(p?.provinceName || '').trim()
      }))
      .filter((p: any) => p.code && p.name)
      .sort((a: any, b: any) => a.name.localeCompare(b.name, 'vi'))

    addressKitCache.communes.set(cacheKey, normalized)
    return c.json({ success: true, data: normalized })
  } catch (e: any) {
    return c.json({ success: false, error: e?.message || 'ADDRESSKIT_FETCH_FAILED' }, 500)
  }
})

// POST create ZaloPay payment link from an existing order
app.post('/api/orders/:id/zalopay-link', async (c) => {
  try {
    await initDB(c.env.DB)
    const id = Number(c.req.param('id') || 0)
    if (!id) return c.json({ success: false, error: 'INVALID_ORDER_ID' }, 400)
    const body: any = await c.req.json().catch(() => ({}))
    const origin = String(body.origin || c.req.header('origin') || '').trim()
    if (!origin) return c.json({ success: false, error: 'MISSING_ORIGIN' }, 400)

    const order = await c.env.DB.prepare(`
      SELECT id, order_code, total_price, customer_name, customer_phone, product_name, quantity, payment_method, payment_status, payment_link_id, payment_checkout_url, payment_order_code
      FROM orders WHERE id=?
    `).bind(id).first() as any
    if (!order) return c.json({ success: false, error: 'ORDER_NOT_FOUND' }, 404)
    if (String(order.payment_method || '').toUpperCase() !== 'ZALOPAY') {
      return c.json({ success: false, error: 'PAYMENT_METHOD_NOT_ZALOPAY' }, 400)
    }
    if (String(order.payment_status || '').toLowerCase() === 'paid') {
      return c.json({ success: true, data: { alreadyPaid: true, orderCode: order.order_code } })
    }

    const sync = await syncOrderPaymentWithZaloPay(c.env.DB, c.env, order)
    if (sync.paid) {
      return c.json({ success: true, data: { alreadyPaid: true, orderCode: order.order_code } })
    }

    const config = getZaloPayConfig(c.env)
    const missingConfig = getZaloPayMissingConfigKeys(config)
    if (missingConfig.length) {
      return c.json({ success: false, error: 'ZALOPAY_CONFIG_MISSING', missing: missingConfig }, 500)
    }

    const amount = Math.round(Number(order.total_price || 0))
    if (amount <= 0) return c.json({ success: false, error: 'INVALID_ORDER_AMOUNT' }, 400)

    const nowMs = Date.now()
    const appTransId = buildZaloPayAppTransId(Number(order.id || 0), nowMs)
    const successUrl = `${origin}/?order=${encodeURIComponent(order.order_code)}&pay=success&provider=zalopay&closeTab=1`
    const cancelUrl = `${origin}/?order=${encodeURIComponent(order.order_code)}&pay=cancel&provider=zalopay`
    const embedData = JSON.stringify({
      order_id: Number(order.id || 0),
      order_code: String(order.order_code || ''),
      redirecturl: successUrl,
      cancelurl: cancelUrl
    })
    const item = JSON.stringify([
      {
        itemid: String(order.id || ''),
        itemname: String(order.product_name || 'Don hang'),
        itemprice: amount,
        itemquantity: Number(order.quantity || 1) || 1
      }
    ])
    const appUser = String(order.customer_phone || order.customer_name || `user_${order.id}`).slice(0, 50)
    const description = `QHClothes - Thanh toan don hang #${order.order_code}`.slice(0, 256)
    const callbackUrl = String((c.env as any).ZALOPAY_CALLBACK_URL || '').trim()

    const macInput = `${config.appIdRaw}|${appTransId}|${appUser}|${amount}|${nowMs}|${embedData}|${item}`
    const mac = await payOSSignWithChecksum(config.key1, macInput)

    const form = new URLSearchParams()
    form.set('app_id', config.appIdRaw)
    form.set('app_user', appUser)
    form.set('app_time', String(nowMs))
    form.set('amount', String(amount))
    form.set('app_trans_id', appTransId)
    form.set('embed_data', embedData)
    form.set('item', item)
    form.set('description', description)
    form.set('expire_duration_seconds', '900')
    form.set('mac', mac)
    if (callbackUrl) form.set('callback_url', callbackUrl)

    const resp = await fetch(config.createEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: form.toString()
    })
    const zaloRes: any = await resp.json().catch(() => ({}))
    const returnCode = Number(zaloRes?.return_code || 0)
    if (!resp.ok || returnCode !== 1 || !zaloRes?.order_url) {
      return c.json({ success: false, error: 'ZALOPAY_CREATE_LINK_FAILED', detail: zaloRes }, 400)
    }

    await c.env.DB.prepare(`
      UPDATE orders
      SET payment_provider='ZALOPAY',
          payment_link_id=?,
          updated_at=CURRENT_TIMESTAMP
      WHERE id=?
    `).bind(appTransId, id).run()

    return c.json({
      success: true,
      data: {
        appTransId,
        orderUrl: zaloRes.order_url,
        qrCode: zaloRes.qr_code || '',
        zpTransToken: zaloRes.zp_trans_token || '',
        orderToken: zaloRes.order_token || '',
        orderCode: order.order_code
      }
    })
  } catch (e: any) {
    return c.json({ success: false, error: e.message }, 500)
  }
})

// POST create PayOS payment link from an existing order
app.post('/api/orders/:id/payos-link', async (c) => {
  try {
    await initDB(c.env.DB)
    const id = Number(c.req.param('id') || 0)
    if (!id) return c.json({ success: false, error: 'INVALID_ORDER_ID' }, 400)
    const body: any = await c.req.json().catch(() => ({}))
    const origin = String(body.origin || c.req.header('origin') || '').trim()
    if (!origin) return c.json({ success: false, error: 'MISSING_ORIGIN' }, 400)

    const order = await c.env.DB.prepare(`
      SELECT id, order_code, total_price, customer_name, customer_phone, product_name, quantity,
             payment_method, payment_status, payment_link_id, payment_checkout_url, payment_order_code
      FROM orders WHERE id=?
    `).bind(id).first() as any
    if (!order) return c.json({ success: false, error: 'ORDER_NOT_FOUND' }, 404)
    if (String(order.payment_method || '').toUpperCase() !== 'BANK_TRANSFER') {
      return c.json({ success: false, error: 'PAYMENT_METHOD_NOT_BANK_TRANSFER' }, 400)
    }
    if (String(order.payment_status || '').toLowerCase() === 'paid') {
      return c.json({ success: true, data: { alreadyPaid: true, orderCode: order.order_code } })
    }

    const sync = await syncOrderPaymentWithPayOS(c.env.DB, c.env, order)
    if (sync.paid) {
      return c.json({ success: true, data: { alreadyPaid: true, orderCode: order.order_code } })
    }

    const existingLinkId = String(order.payment_link_id || '').trim()
    const existingCheckoutUrl = String(order.payment_checkout_url || '').trim()
    const existingPayment = await payOSGetPaymentInfo(c.env, existingLinkId || order.payment_order_code || order.id)
    if (existingPayment) {
      const existingPaymentStatus = String(existingPayment.status || '').trim().toUpperCase()
      const existingPaymentLinkId = String(existingPayment.id || '').trim()
      const existingPaymentCheckoutUrl = String(existingCheckoutUrl || existingPayment.checkoutUrl || (existingPaymentLinkId ? `https://pay.payos.vn/web/${encodeURIComponent(existingPaymentLinkId)}` : '')).trim()
      if (existingPaymentStatus === 'PENDING' && (existingPaymentLinkId || existingPaymentCheckoutUrl)) {
        await c.env.DB.prepare(`
          UPDATE orders
          SET payment_link_id=COALESCE(NULLIF(?, ''), payment_link_id),
              payment_checkout_url=COALESCE(NULLIF(?, ''), payment_checkout_url),
              payment_order_code=COALESCE(NULLIF(?, 0), payment_order_code),
              updated_at=CURRENT_TIMESTAMP
          WHERE id=?
        `).bind(
          existingPaymentLinkId || null,
          existingPaymentCheckoutUrl || null,
          Number(existingPayment.orderCode || order.payment_order_code || order.id || 0),
          id
        ).run()
        return c.json({
          success: true,
          data: {
            paymentLinkId: existingPaymentLinkId || existingPayment.id || '',
            checkoutUrl: existingPaymentCheckoutUrl || '',
            orderCode: order.order_code
          }
        })
      }
    }

    const clientId = String((c.env as any).PAYOS_CLIENT_ID || '')
    const apiKey = String((c.env as any).PAYOS_API_KEY || '')
    const checksumKey = String((c.env as any).PAYOS_CHECKSUM_KEY || '')
    if (!clientId || !apiKey || !checksumKey) {
      return c.json({ success: false, error: 'PAYOS_CONFIG_MISSING' }, 500)
    }

    const amount = Math.round(Number(order.total_price || 0))
    if (amount <= 0) return c.json({ success: false, error: 'INVALID_ORDER_AMOUNT' }, 400)

    const orderCodeNum = Math.floor(Date.now() * 10 + Math.floor(Math.random() * 10)) // numeric order code for PayOS, unique per retry
    const description = `DH${orderCodeNum}`.slice(0, 25)
    const returnUrl = `${origin}/?order=${encodeURIComponent(order.order_code)}&pay=success&provider=payos&closeTab=1`
    const cancelUrl = `${origin}/?order=${encodeURIComponent(order.order_code)}&pay=cancel&provider=payos`
    const signPayload = {
      amount,
      cancelUrl,
      description,
      orderCode: orderCodeNum,
      returnUrl
    }
    const signature = await payOSSignWithChecksum(checksumKey, payOSBuildDataString(signPayload))
    const reqPayload = {
      orderCode: orderCodeNum,
      amount,
      description,
      buyerName: order.customer_name || '',
      buyerPhone: order.customer_phone || '',
      items: [{ name: order.product_name || 'Don hang', quantity: Number(order.quantity || 1), price: amount }],
      cancelUrl,
      returnUrl,
      signature
    }

    const resp = await fetch('https://api-merchant.payos.vn/v2/payment-requests', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-client-id': clientId,
        'x-api-key': apiKey
      },
      body: JSON.stringify(reqPayload)
    })
    const payosRes: any = await resp.json().catch(() => ({}))
    if (!resp.ok || String(payosRes.code || '') !== '00' || !payosRes.data) {
      return c.json({ success: false, error: 'PAYOS_CREATE_LINK_FAILED', detail: payosRes }, 400)
    }

    await c.env.DB.prepare(`
      UPDATE orders
      SET payment_provider='PAYOS',
          payment_link_id=?,
          payment_checkout_url=?,
          payment_order_code=?,
          updated_at=CURRENT_TIMESTAMP
      WHERE id=?
    `).bind(
      payosRes.data.paymentLinkId || null,
      payosRes.data.checkoutUrl || null,
      orderCodeNum,
      id
    ).run()

    return c.json({
      success: true,
      data: {
        paymentLinkId: payosRes.data.paymentLinkId,
        checkoutUrl: payosRes.data.checkoutUrl,
        qrCode: payosRes.data.qrCode,
        orderCode: order.order_code
      }
    })
  } catch (e: any) {
    return c.json({ success: false, error: e.message }, 500)
  }
})

// POST ZaloPay callback (payment notify)
app.post('/api/payments/zalopay/callback', async (c) => {
  try {
    await initDB(c.env.DB)
    const body: any = await c.req.json().catch(() => ({}))
    const cbDataStr = String(body?.data || '')
    const providedMac = String(body?.mac || '').toLowerCase()
    const config = getZaloPayConfig(c.env)
    if (!config.key2) {
      return c.json({ return_code: 0, return_message: 'ZALOPAY_CONFIG_MISSING' })
    }
    if (!cbDataStr || !providedMac) {
      return c.json({ return_code: -1, return_message: 'missing_data_or_mac' })
    }

    const expectedMac = await payOSSignWithChecksum(config.key2, cbDataStr)
    if (expectedMac !== providedMac) {
      return c.json({ return_code: -1, return_message: 'mac not equal' })
    }

    const data = parseJsonObject(cbDataStr)
    const appTransId = String(data?.app_trans_id || '').trim()
    const paidAmount = Number(data?.amount || 0)
    const zpTransIdNum = Number(data?.zp_trans_id || 0)
    const embedData = parseJsonObject(data?.embed_data)
    const orderId = Number(embedData?.order_id || 0)
    const orderCode = String(embedData?.order_code || '').trim().toUpperCase()

    let order: any = null
    if (orderId > 0) {
      order = await c.env.DB.prepare(`
        SELECT id, order_code, total_price, payment_status
        FROM orders
        WHERE id=?
        LIMIT 1
      `).bind(orderId).first() as any
    }
    if (!order && orderCode) {
      order = await c.env.DB.prepare(`
        SELECT id, order_code, total_price, payment_status
        FROM orders
        WHERE order_code=?
        LIMIT 1
      `).bind(orderCode).first() as any
    }
    if (!order && appTransId) {
      order = await c.env.DB.prepare(`
        SELECT id, order_code, total_price, payment_status
        FROM orders
        WHERE payment_link_id=?
        LIMIT 1
      `).bind(appTransId).first() as any
    }
    if (!order) {
      return c.json({ return_code: 1, return_message: 'ignored_order_not_found' })
    }
    if (String(order.payment_status || '').toLowerCase() === 'paid') {
      return c.json({ return_code: 2, return_message: 'already_paid' })
    }

    if (paidAmount > 0 && Number(order.total_price || 0) > 0 && paidAmount < Number(order.total_price || 0)) {
      return c.json({ return_code: 1, return_message: 'ignored_insufficient_amount' })
    }

    await c.env.DB.prepare(`
      UPDATE orders
      SET payment_status='paid',
          payment_paid_at=CURRENT_TIMESTAMP,
          payment_ref=?,
          payment_provider='ZALOPAY',
          payment_link_id=COALESCE(?, payment_link_id),
          payment_order_code=COALESCE(?, payment_order_code),
          status=CASE WHEN status='pending' THEN 'confirmed' ELSE status END,
          updated_at=CURRENT_TIMESTAMP
      WHERE id=?
    `).bind(
      String(data?.zp_trans_id || appTransId || ''),
      appTransId || null,
      Number.isFinite(zpTransIdNum) && zpTransIdNum > 0 ? zpTransIdNum : null,
      order.id
    ).run()

    return c.json({ return_code: 1, return_message: 'success' })
  } catch (e: any) {
    return c.json({ return_code: 0, return_message: String(e?.message || 'UNKNOWN_ERROR') })
  }
})

// POST PayOS webhook (payment callback)
app.post('/api/payments/payos/webhook', async (c) => {
  try {
    await initDB(c.env.DB)
    const body: any = await c.req.json()
    const checksumKey = String((c.env as any).PAYOS_CHECKSUM_KEY || '')
    if (!checksumKey) return c.json({ success: false, error: 'PAYOS_CONFIG_MISSING' }, 500)

    const data = body?.data || {}
    const providedSignature = String(body?.signature || '').toLowerCase()
    if (!providedSignature) {
      return c.json({ success: false, error: 'MISSING_SIGNATURE' }, 400)
    }
    const verifyString = payOSBuildDataString(data)
    const expectedSignature = await payOSSignWithChecksum(checksumKey, verifyString)
    if (providedSignature !== expectedSignature) {
      return c.json({ success: false, error: 'INVALID_PAYOS_SIGNATURE' }, 401)
    }

    const payosOrderCode = Number(data?.orderCode || 0)
    if (!payosOrderCode) return c.json({ success: false, error: 'MISSING_ORDER_CODE' }, 400)
    const order = await c.env.DB.prepare(`
      SELECT id, order_code, total_price, payment_status, status, payment_order_code
      FROM orders
      WHERE id=? OR payment_order_code=?
      LIMIT 1
    `).bind(payosOrderCode, payosOrderCode).first() as any
    if (!order) {
      return c.json({ success: true, data: { ignored: true, reason: 'ORDER_NOT_FOUND', payosOrderCode } })
    }

    if (order.payment_status === 'paid') {
      return c.json({ success: true, data: { order_code: order.order_code, already_paid: true } })
    }

    const status = String(data?.status || '').toUpperCase()
    if (status !== 'PAID') {
      return c.json({ success: true, data: { ignored: true, reason: `status_${status || 'UNKNOWN'}` } })
    }

    const paidAmount = Number(data?.amount || data?.amountPaid || 0)
    if (paidAmount > 0 && Number(order.total_price) > 0 && paidAmount < Number(order.total_price)) {
      return c.json({ success: false, error: 'INSUFFICIENT_AMOUNT' }, 400)
    }

    const paymentRef = String(data?.paymentLinkId || data?.reference || payosOrderCode)
    await c.env.DB.prepare(`
      UPDATE orders
      SET payment_status='paid',
          payment_paid_at=CURRENT_TIMESTAMP,
          payment_ref=?,
          payment_provider='PAYOS',
          payment_order_code=?,
          payment_link_id=COALESCE(?, payment_link_id),
          status=CASE WHEN status='pending' THEN 'confirmed' ELSE status END,
          updated_at=CURRENT_TIMESTAMP
      WHERE id=?
    `).bind(
      paymentRef || null,
      payosOrderCode,
      data?.paymentLinkId || null,
      order.id
    ).run()

    return c.json({ success: true, data: { order_code: order.order_code, payment_status: 'paid' } })
  } catch (e: any) {
    return c.json({ success: false, error: e.message }, 500)
  }
})

// POST confirm/update webhook URL on PayOS (helper endpoint)
app.post('/api/payments/payos/confirm-webhook', async (c) => {
  try {
    const body: any = await c.req.json().catch(() => ({}))
    const webhookUrl = String(body.webhookUrl || '').trim()
    if (!webhookUrl || !/^https:\/\//i.test(webhookUrl)) {
      return c.json({ success: false, error: 'INVALID_WEBHOOK_URL' }, 400)
    }

    const clientId = String((c.env as any).PAYOS_CLIENT_ID || '')
    const apiKey = String((c.env as any).PAYOS_API_KEY || '')
    if (!clientId || !apiKey) {
      return c.json({ success: false, error: 'PAYOS_CONFIG_MISSING' }, 500)
    }

    const resp = await fetch('https://api-merchant.payos.vn/confirm-webhook', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-client-id': clientId,
        'x-api-key': apiKey
      },
      body: JSON.stringify({ webhookUrl })
    })
    const data: any = await resp.json().catch(() => ({}))
    if (!resp.ok || String(data.code || '') !== '00') {
      return c.json({ success: false, error: 'PAYOS_CONFIRM_WEBHOOK_FAILED', detail: data }, 400)
    }
    return c.json({ success: true, data })
  } catch (e: any) {
    return c.json({ success: false, error: e.message }, 500)
  }
})

// --- API: VOUCHERS ---------------------------------------------

// POST validate voucher (public)
app.post('/api/vouchers/validate', async (c) => {
  try {
    await initDB(c.env.DB)
    const { code } = await c.req.json()
    if (!code) return c.json({ success: false, error: 'MISSING_CODE' }, 400)

    const now = new Date().toISOString()
    const voucher = await c.env.DB.prepare(
      `SELECT * FROM vouchers WHERE code=? AND is_active=1 AND valid_from<=? AND valid_to>=?`
    ).bind(code.trim().toUpperCase(), now, now).first() as any

    if (!voucher) return c.json({ success: false, error: 'INVALID_VOUCHER' }, 400)
    if (voucher.usage_limit > 0 && voucher.used_count >= voucher.usage_limit) {
      return c.json({ success: false, error: 'VOUCHER_LIMIT' }, 400)
    }

    return c.json({ success: true, data: { id: voucher.id, code: voucher.code, discount_amount: voucher.discount_amount } })
  } catch (e: any) {
    return c.json({ success: false, error: e.message }, 500)
  }
})

// GET all vouchers (admin)
app.get('/api/admin/vouchers', async (c) => {
  try {
    await initDB(c.env.DB)
    const result = await c.env.DB.prepare(`SELECT * FROM vouchers ORDER BY created_at DESC`).all()
    return c.json({ success: true, data: result.results || [] })
  } catch (e: any) {
    return c.json({ success: false, error: e.message }, 500)
  }
})

// POST create voucher (admin)
app.post('/api/admin/vouchers', async (c) => {
  try {
    await initDB(c.env.DB)
    const body = await c.req.json()
    const { discount_amount, valid_from, valid_to, usage_limit, custom_code } = body

    if (!discount_amount || !valid_from || !valid_to) {
      return c.json({ success: false, error: 'Missing required fields' }, 400)
    }

    // Generate or use custom code
    let code = custom_code
      ? custom_code.trim().toUpperCase()
      : 'FASHION' + Math.random().toString(36).substring(2, 7).toUpperCase()

    // Ensure unique
    const existing = await c.env.DB.prepare(`SELECT id FROM vouchers WHERE code=?`).bind(code).first()
    if (existing) {
      code = code + Math.floor(Math.random() * 100)
    }

    const result = await c.env.DB.prepare(`
      INSERT INTO vouchers (code, discount_amount, valid_from, valid_to, usage_limit, is_active)
      VALUES (?, ?, ?, ?, ?, 1)
    `).bind(code, parseFloat(discount_amount), valid_from, valid_to, parseInt(usage_limit) || 0).run()

    return c.json({ success: true, id: result.meta.last_row_id, code })
  } catch (e: any) {
    return c.json({ success: false, error: e.message }, 500)
  }
})

// PATCH toggle voucher active
app.patch('/api/admin/vouchers/:id/toggle', async (c) => {
  try {
    const id = c.req.param('id')
    await c.env.DB.prepare(
      `UPDATE vouchers SET is_active = CASE WHEN is_active=1 THEN 0 ELSE 1 END WHERE id=?`
    ).bind(id).run()
    return c.json({ success: true })
  } catch (e: any) {
    return c.json({ success: false, error: e.message }, 500)
  }
})

// DELETE voucher
app.delete('/api/admin/vouchers/:id', async (c) => {
  try {
    const id = c.req.param('id')
    await c.env.DB.prepare(`DELETE FROM vouchers WHERE id=?`).bind(id).run()
    return c.json({ success: true })
  } catch (e: any) {
    return c.json({ success: false, error: e.message }, 500)
  }
})

// GET stats (admin dashboard)
app.get('/api/admin/stats', async (c) => {
  try {
    await initDB(c.env.DB)
    const includeInternal = c.req.query('include_internal') === '1'
    const internalFilterSql = includeInternal ? '1=1' : `NOT ${buildInternalTestOrderWhereSql()}`
    const totalProducts = await c.env.DB.prepare(`SELECT COUNT(*) as count FROM products WHERE is_active=1`).first() as any
    const totalOrders = await c.env.DB.prepare(`SELECT COUNT(*) as count FROM orders WHERE ${internalFilterSql}`).first() as any
    const pendingOrders = await c.env.DB.prepare(`SELECT COUNT(*) as count FROM orders WHERE status='pending' AND ${internalFilterSql}`).first() as any
    const shippingQueueOrders = await c.env.DB.prepare(`
      SELECT COUNT(*) as count
      FROM orders
      WHERE ${internalFilterSql}
        AND status NOT IN ('shipping', 'done', 'cancelled')
        AND (
          UPPER(COALESCE(payment_method, '')) = 'COD'
          OR (
            UPPER(COALESCE(payment_method, '')) IN ('BANK_TRANSFER', 'ZALOPAY')
            AND LOWER(COALESCE(payment_status, '')) = 'paid'
          )
        )
    `).first() as any
    const revenue = await c.env.DB.prepare(`SELECT SUM(total_price) as total FROM orders WHERE status != 'cancelled' AND ${internalFilterSql}`).first() as any
    const recentOrdersRes = await c.env.DB.prepare(`
      SELECT *,
             CASE WHEN LOWER(COALESCE(payment_status, ''))='paid' THEN 0 ELSE total_price END AS amount_due
      FROM orders
      WHERE ${internalFilterSql}
      ORDER BY created_at DESC
      LIMIT 5
    `).all()
    const recentOrders = recentOrdersRes

    return c.json({
      success: true,
      data: {
        totalProducts: totalProducts?.count || 0,
        totalOrders: totalOrders?.count || 0,
        pendingOrders: pendingOrders?.count || 0,
        shippingQueueOrders: shippingQueueOrders?.count || 0,
        revenue: revenue?.total || 0,
        recentOrders: recentOrders.results || []
      }
    })
  } catch (e: any) {
    return c.json({ success: false, error: e.message }, 500)
  }
})

// --- FRONTEND ROUTES -------------------------------------------

// Admin
app.get('/admin', (c) => c.redirect('/admin/dashboard'))
app.get('/admin/login', (c) => c.html(adminLoginHTML()))
app.get('/admin/*', (c) => {
  const adminToken = getCookie(c, 'admin_token')
  if (adminToken !== 'super_secret_admin_token') {
    return c.redirect('/admin/login')
  }
  return c.html(adminHTML())
})

// Storefront (home)
app.get('/', (c) => {
  return c.html(storefrontHTML())
})

app.get('*', (c) => {
  return c.html(storefrontHTML())
})

export default app


