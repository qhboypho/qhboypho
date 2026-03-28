import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { serveStatic } from 'hono/cloudflare-workers'
import { getCookie, setCookie, deleteCookie } from 'hono/cookie'
import { PDFDocument } from 'pdf-lib'
import { registerPageRoutes } from './routes/pageRoutes'
import { registerAuthRoutes } from './routes/authRoutes'
import { registerProductRoutes } from './routes/productRoutes'
import { registerOrderRoutes } from './routes/orderRoutes'

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

registerAuthRoutes(app, {
  initDB,
  resolveAdminProfile,
  normalizeAdminUserKey,
  getAppSettingValue,
  upsertAppSettings
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
registerProductRoutes(app, { initDB })

function resolveSelectedColorImage(productColors: any, selectedColor: any, fallbackImage = ""): string {
  const selected = String(selectedColor || "").trim().toLowerCase()
  if (!selected) return String(fallbackImage || "").trim()
  const colors = Array.isArray(productColors)
    ? productColors
    : (() => {
        try {
          const parsed = JSON.parse(String(productColors || "[]"))
          return Array.isArray(parsed) ? parsed : []
        } catch {
          return []
        }
      })()
  if (!colors.length) return String(fallbackImage || "").trim()
  const matched =
    colors.find((item: any) => String(item?.name || "").trim().toLowerCase() === selected) ||
    colors.find((item: any) => {
      const name = String(item?.name || "").trim().toLowerCase()
      return name.includes(selected) || selected.includes(name)
    })
  if (matched && String(matched.image || "").trim()) return String(matched.image).trim()
  return String(fallbackImage || "").trim()
}

// --- API: ORDERS -----------------------------------------------
registerOrderRoutes(app, {
  initDB,
  buildInternalTestOrderWhereSql,
  resolveSelectedColorImage,
  ghtkCancelShipment,
  ghtkCreateShipment,
  ghtkFetchLabelPdf,
  mergePdfBytes
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

registerPageRoutes(app)

export default app
