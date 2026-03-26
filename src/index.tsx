import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { serveStatic } from 'hono/cloudflare-workers'
import { getCookie, setCookie, deleteCookie } from 'hono/cookie'
import { PDFDocument } from 'pdf-lib'

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

// ─── INIT DB ───────────────────────────────────────────────────
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
        ['https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=500', 'Mới nhất', 'Bộ sưu tập Spring 2026', 'Từ 299.000đ', null, 1],
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

// ─── API: HERO BANNERS ─────────────────────────────────────────────
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

// ─── API: AUTH ─────────────────────────────────────────────────
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

// ─── API: PRODUCTS ─────────────────────────────────────────────

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
app.get('/api/admin/products', async (c) => {
  try {
    await initDB(c.env.DB)
    const result = await c.env.DB.prepare(
      `SELECT * FROM products ORDER BY created_at DESC`
    ).all()
    const rows = (result.results || []).map((row: any) => ({
      ...row,
      color_options: parseColorOptions(row.colors),
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

// ─── API: ORDERS ───────────────────────────────────────────────

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
    let query = `
      SELECT o.*,
             p.thumbnail AS product_thumbnail,
             CASE WHEN LOWER(COALESCE(o.payment_status, ''))='paid' THEN 0 ELSE o.total_price END AS amount_due
      FROM orders o
      LEFT JOIN products p ON p.id = o.product_id
      WHERE ${internalFilterSql}
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
      SELECT id, order_code, total_price, customer_name, customer_phone, product_name, quantity, payment_method, payment_status
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
      SELECT id, order_code, total_price, customer_name, customer_phone, product_name, quantity, payment_method, payment_status
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

    const clientId = String((c.env as any).PAYOS_CLIENT_ID || '')
    const apiKey = String((c.env as any).PAYOS_API_KEY || '')
    const checksumKey = String((c.env as any).PAYOS_CHECKSUM_KEY || '')
    if (!clientId || !apiKey || !checksumKey) {
      return c.json({ success: false, error: 'PAYOS_CONFIG_MISSING' }, 500)
    }

    const amount = Math.round(Number(order.total_price || 0))
    if (amount <= 0) return c.json({ success: false, error: 'INVALID_ORDER_AMOUNT' }, 400)

    const orderCodeNum = Number(order.id) // numeric order code for PayOS
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
          payment_order_code=?,
          updated_at=CURRENT_TIMESTAMP
      WHERE id=?
    `).bind(
      payosRes.data.paymentLinkId || null,
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

// ─── API: VOUCHERS ─────────────────────────────────────────────

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
        revenue: revenue?.total || 0,
        recentOrders: recentOrders.results || []
      }
    })
  } catch (e: any) {
    return c.json({ success: false, error: e.message }, 500)
  }
})

// ─── FRONTEND ROUTES ───────────────────────────────────────────

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

// ─── HTML TEMPLATES ────────────────────────────────────────────

function storefrontHTML(): string {
  return `<!DOCTYPE html>
<html lang="vi">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>QH Clothes – Phong Cách Thời Trang Hot Trend</title>
<meta name="description" content="Thời trang hot trend cho giới trẻ, cập nhập các mẫu mới và thịnh hành nhất. Mua sắm phong cách, dẫn đầu xu hướng, giá cực chất tại QH Clothes.">
<meta name="keywords" content="QH Boypho, QH Clothes, boypho, girlpho, Hiếu Quỳnh, thời trang hot trend, thời trang giới trẻ, quần áo nam nữ, local brand, áo thun unisex, áo khoác nam nữ, mẫu mới thịnh hành">
<meta name="author" content="QH Clothes">
<meta name="robots" content="index, follow">
<meta property="og:title" content="QH Clothes – Phong Cách Thời Trang Hot Trend">
<meta property="og:description" content="Thời trang hot trend cho giới trẻ, cập nhập các mẫu mới và thịnh hành nhất.">
<meta property="og:image" content="/qh-logo.png">
<meta property="og:type" content="website">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="QH Clothes – Phong Cách Thời Trang Hot Trend">
<meta name="twitter:description" content="Thời trang hot trend cho giới trẻ, cập nhập các mẫu mới và thịnh hành nhất.">
<meta name="twitter:image" content="/qh-logo.png">
<link rel="icon" type="image/png" href="/qh-logo.png">
<link rel="apple-touch-icon" href="/qh-logo.png">
<script src="https://cdn.tailwindcss.com"></script>
<link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
<script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700&family=Inter:wght@300;400;500;600&display=swap');
  * { font-family: 'Inter', sans-serif; }
  h1,h2,h3,.font-display { font-family: 'Playfair Display', serif; }
  .gradient-hero { background: linear-gradient(135deg, #1a1a2e 0%, #16213e 40%, #0f3460 100%); }
  .card-hover { transition: all 0.3s ease; }
  .card-hover:hover { transform: translateY(-6px); box-shadow: 0 20px 40px rgba(0,0,0,0.15); }
  .badge-sale { background: linear-gradient(135deg, #e84393, #c0392b); }
  .btn-primary { background: linear-gradient(135deg, #c0392b, #e84393); transition: all 0.3s; }
  .btn-primary:hover { background: linear-gradient(135deg, #a93226, #c0307a); transform: scale(1.02); }
  .overlay { background: rgba(0,0,0,0.6); backdrop-filter: blur(4px); }
  .popup-card { animation: slideUp 0.3s ease; }
  @keyframes slideUp { from { opacity:0; transform:translateY(40px); } to { opacity:1; transform:translateY(0); } }
  .color-btn.active { ring: 2px; outline: 3px solid #e84393; outline-offset: 2px; }
  .size-btn.active { background: #1a1a2e; color: white; }
  .img-gallery img { cursor: pointer; transition: all 0.2s; }
  .img-gallery img:hover { opacity: 0.8; transform: scale(1.05); }
  .toast { animation: fadeInOut 3s ease forwards; }
  @keyframes fadeInOut { 0%{opacity:0;transform:translateY(20px)} 15%{opacity:1;transform:translateY(0)} 85%{opacity:1} 100%{opacity:0} }
  ::-webkit-scrollbar { width: 6px; } ::-webkit-scrollbar-thumb { background: #c0392b; border-radius: 3px; }
  .product-img-main { width: 100%; aspect-ratio: 1/1; height: 100%; object-fit: cover; display: block; }
  .skeleton { background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%); background-size: 200% 100%; animation: shimmer 1.5s infinite; }
  @keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
  .navbar-blur { backdrop-filter: blur(12px); background: rgba(26,26,46,0.95); }
  .filter-btn.active { background: #c0392b; color: white; border-color: #c0392b; }
  /* Shake animation for validation */
  @keyframes shake {
    0%,100%{transform:translateX(0)}
    15%{transform:translateX(-6px)}
    30%{transform:translateX(6px)}
    45%{transform:translateX(-5px)}
    60%{transform:translateX(5px)}
    75%{transform:translateX(-3px)}
    90%{transform:translateX(3px)}
  }
  .shake { animation: shake 0.5s ease; }
  .field-error label, .field-error .field-title { color: #e84393 !important; }
  .field-error input, .field-error textarea { border-color: #e84393 !important; box-shadow: 0 0 0 3px rgba(232,67,147,0.15) !important; }
  .field-error select { border-color: #e84393 !important; box-shadow: 0 0 0 3px rgba(232,67,147,0.15) !important; }
  .field-error .payment-method-btn { border-color: #e84393 !important; box-shadow: 0 0 0 3px rgba(232,67,147,0.12) !important; }
  .address-option-item { width: 100%; text-align: left; padding: 9px 12px; font-size: 14px; line-height: 1.4; }
  .address-option-item:hover { background: #fdf2f8; color: #be185d; }
  .address-option-item.active { background: #ec4899; color: #fff; font-weight: 600; }
  /* Voucher styles */
  .voucher-success { background: linear-gradient(135deg,#d1fae5,#a7f3d0); border: 1.5px solid #6ee7b7; }
  .voucher-error { background: #fff1f2; border: 1.5px solid #fecdd3; }
  /* Cart modal */
  .cart-modal { animation: slideInRight 0.35s cubic-bezier(0.32,0.72,0,1); }
  @keyframes slideInRight { from { transform:translateX(100%); opacity:0.5; } to { transform:translateX(0); opacity:1; } }
  .cart-item { position:relative; overflow:hidden; touch-action:pan-y; }
  .cart-item-inner { position:relative; background:#fff; transition: transform 0.25s ease; }
  .cart-item-delete-bg { position:absolute; right:0; top:0; bottom:0; width:80px; background:linear-gradient(135deg,#e84393,#c0392b); display:flex; align-items:center; justify-content:center; color:white; font-size:1.2rem; border-radius:0 0.75rem 0.75rem 0; }
  .cart-checkout { animation: slideUp 0.3s ease; }
  .cart-badge-bounce { animation: badgeBounce 0.4s cubic-bezier(0.36,0.07,0.19,0.97); }
  @keyframes badgeBounce { 0%{transform:scale(1)} 30%{transform:scale(1.5)} 60%{transform:scale(0.9)} 100%{transform:scale(1)} }
  .cart-fly-chip {
    position: fixed;
    width: 42px;
    height: 42px;
    border-radius: 9999px;
    overflow: hidden;
    border: 2px solid rgba(255,255,255,0.85);
    box-shadow: 0 10px 24px rgba(0,0,0,0.25);
    z-index: 10000;
    pointer-events: none;
    transform: translate(0,0) scale(1);
    opacity: 1;
    transition: transform 0.7s cubic-bezier(0.2,0.8,0.2,1), opacity 0.7s ease;
  }
  .cart-fly-chip img { width: 100%; height: 100%; object-fit: cover; display: block; }
  .line-clamp-1 { overflow:hidden; display:-webkit-box; -webkit-line-clamp:1; -webkit-box-orient:vertical; }
  /* Checkout step in cart */
  .checkout-slide { animation: slideUp 0.3s ease; }
  .user-menu-overlay { background: rgba(0,0,0,0.5); backdrop-filter: blur(4px); }
  .user-menu-panel { animation: slideInRight 0.35s cubic-bezier(0.32,0.72,0,1); }
  .user-menu-panel.closing { animation: slideOutRight 0.3s ease forwards; }
  @keyframes slideOutRight { from { transform:translateX(0); opacity:1; } to { transform:translateX(100%); opacity:0; } }
  .order-history-item { transition: all 0.2s; }
  .order-history-item:hover { background: #fdf2f8; }
  @keyframes spinSlow { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
  @keyframes glowSpin { 0% { filter: hue-rotate(0deg) drop-shadow(0 0 6px rgba(99,102,241,0.7)); } 50% { filter: hue-rotate(60deg) drop-shadow(0 0 10px rgba(139,92,246,0.9)); } 100% { filter: hue-rotate(0deg) drop-shadow(0 0 6px rgba(99,102,241,0.7)); } }
  .logo-spinner { position:relative; display:inline-flex; align-items:center; justify-content:center; }
  .logo-spinner::before { content:''; position:absolute; inset:-3px; border-radius:50%; background:conic-gradient(from 0deg, #6366f1, #8b5cf6, #a855f7, #6366f1); animation: spinSlow 8s linear infinite; z-index:0; }
  .logo-spinner::after { content:''; position:absolute; inset:-3px; border-radius:50%; background:conic-gradient(from 0deg, #6366f1, #8b5cf6, #a855f7, #6366f1); animation: spinSlow 8s linear infinite; filter:blur(8px); opacity:0.6; z-index:0; }
  .logo-spinner img { position:relative; z-index:1; border-radius:50%; width:36px; height:36px; object-fit:cover; animation: spinSlow 12s linear infinite; background:white; }

  /* ── HERO BANNERS EXPAND ────────────────────────── */
  #heroBannersWrapper {
    position: relative;
    cursor: pointer;
  }
  /* Collapsed: stacked cards */
  #heroBannersCollapsed {
    position: relative;
    width: 320px;
    height: 380px;
    transition: opacity 0.35s ease, transform 0.35s ease;
  }
  /* Expanded overlay: full-width horizontal row */
  #heroBannersExpanded {
    display: none;
    position: fixed;
    top: 0; left: 0; right: 0; bottom: 0;
    z-index: 999;
    background: rgba(10,10,30,0.85);
    backdrop-filter: blur(8px);
    padding: 80px 24px 24px;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    opacity: 0;
    transition: opacity 0.35s ease;
  }
  #heroBannersExpanded.open {
    display: flex;
    opacity: 1;
  }
  #heroBannersExpandedInner {
    display: flex;
    flex-direction: row;
    gap: 16px;
    overflow-x: auto;
    overflow-y: hidden;
    max-width: 100%;
    width: 100%;
    padding-bottom: 8px;
    scroll-snap-type: x mandatory;
    -webkit-overflow-scrolling: touch;
  }
  #heroBannersExpandedInner::-webkit-scrollbar { height: 6px; }
  #heroBannersExpandedInner::-webkit-scrollbar-thumb { background: rgba(232,67,147,0.6); border-radius:3px; }
  .hero-banner-card {
    flex: 0 0 calc(25% - 12px);
    min-width: 220px;
    position: relative;
    border-radius: 20px;
    overflow: hidden;
    cursor: pointer;
    scroll-snap-align: start;
    box-shadow: 0 20px 50px rgba(0,0,0,0.4);
    transition: transform 0.25s ease, box-shadow 0.25s ease;
    text-decoration: none;
  }
  .hero-banner-card:hover {
    transform: translateY(-8px);
    box-shadow: 0 30px 60px rgba(0,0,0,0.5);
  }
  .hero-banner-card img {
    width: 100%;
    height: 320px;
    object-fit: cover;
    display: block;
  }
  .hero-banner-card .banner-caption {
    position: absolute;
    bottom: 0; left: 0; right: 0;
    background: linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.4) 60%, transparent 100%);
    padding: 40px 16px 16px;
    color: white;
  }
  .hero-banner-card .banner-caption .banner-subtitle {
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: 2px;
    color: rgba(255,200,200,0.9);
    margin-bottom: 4px;
  }
  .hero-banner-card .banner-caption .banner-title {
    font-size: 15px;
    font-weight: 700;
    line-height: 1.3;
    margin-bottom: 4px;
  }
  .hero-banner-card .banner-caption .banner-price {
    font-size: 13px;
    font-weight: 700;
    color: #fda4af;
  }
  /* Close button for expanded */
  #heroBannersCloseBtn {
    position: absolute;
    top: 20px; right: 20px;
    width: 40px; height: 40px;
    border-radius: 50%;
    background: rgba(255,255,255,0.2);
    border: none;
    color: white;
    font-size: 18px;
    cursor: pointer;
    display: flex; align-items: center; justify-content: center;
    transition: background 0.2s;
    backdrop-filter: blur(4px);
  }
  #heroBannersCloseBtn:hover { background: rgba(255,255,255,0.35); }
  #heroBannersExpandedTitle {
    color: white;
    font-size: 18px;
    font-weight: 700;
    margin-bottom: 20px;
    text-align: center;
    letter-spacing: 0.5px;
  }
  /* Mobile: vertical layout */
  @media (max-width: 768px) {
    #heroBannersCollapsed { width: 240px; height: 280px; }
    #heroBannersExpanded { padding: 70px 16px 24px; }
    #heroBannersExpandedInner {
      flex-direction: column;
      overflow-x: hidden;
      overflow-y: auto;
      max-height: calc(100vh - 140px);
    }
    .hero-banner-card {
      flex: 0 0 auto;
      min-width: unset;
      width: 100%;
    }
    .hero-banner-card img { height: 220px; }
  }
</style>
</head>
<body class="bg-gray-50">

<!-- NAVBAR -->
<nav class="navbar-blur fixed top-0 left-0 right-0 z-50 border-b border-white/10">
  <div class="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
    <a href="/" class="flex items-center gap-2">
      <span class="inline-flex items-center justify-center"><img src="/qh-logo.png" alt="QH" class="rounded-full w-9 h-9 object-cover bg-white"></span><span class="text-2xl font-display text-white font-bold tracking-wide ml-1.5"><span class="text-pink-400">Clothes</span></span>
    </a>
    <div class="hidden md:flex items-center gap-6 text-sm text-gray-300">
      <a href="#products" class="hover:text-pink-400 transition">Sản phẩm</a>
      <a href="#about" class="hover:text-pink-400 transition">Về chúng tôi</a>
      <a href="#contact" class="hover:text-pink-400 transition">Liên hệ</a>
    </div>
    <div class="flex items-center gap-3">
      <button onclick="openCart()" id="cartNavBtn" class="relative text-white hover:text-pink-400 transition p-2">
        <i class="fas fa-shopping-bag text-xl"></i>
        <span id="cartBadge" class="absolute -top-1 -right-1 bg-pink-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center hidden font-bold">0</span>
      </button>
      <!-- Wallet / Top-up -->
      <button onclick="openTopupModal()" id="walletNavBtn" class="hidden items-center gap-1.5 bg-white/10 hover:bg-white/20 text-white px-3 py-1.5 rounded-xl transition text-xs font-medium">
        <i class="fas fa-wallet text-pink-400"></i>
        <span id="walletBalanceNav">0đ</span>
      </button>
      <!-- User Avatar / Login -->
      <button onclick="toggleUserMenu()" id="userAvatarBtn" class="relative text-white hover:text-pink-400 transition p-1">
        <div id="userAvatarDefault" class="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
          <i class="fas fa-user text-sm"></i>
        </div>
        <img id="userAvatarImg" src="" alt="" class="w-8 h-8 rounded-full object-cover border-2 border-pink-400 hidden">
      </button>
      <a href="/admin" id="adminNavLink" class="text-gray-400 hover:text-white transition p-2 hidden" title="Admin">
        <i class="fas fa-user-shield"></i>
      </a>
      <button class="md:hidden text-white p-2" onclick="toggleMobileMenu()">
        <i class="fas fa-bars text-xl"></i>
      </button>
    </div>
  </div>
  <!-- Mobile menu -->
  <div id="mobileMenu" class="hidden md:hidden border-t border-white/10 py-4 px-4 flex flex-col gap-3">
    <a href="#products" class="text-gray-300 hover:text-pink-400" onclick="toggleMobileMenu()">Sản phẩm</a>
    <a href="#about" class="text-gray-300 hover:text-pink-400" onclick="toggleMobileMenu()">Về chúng tôi</a>
    <a href="#contact" class="text-gray-300 hover:text-pink-400" onclick="toggleMobileMenu()">Liên hệ</a>
  </div>
</nav>

<!-- HERO -->
<section class="gradient-hero min-h-screen flex items-center pt-16" id="hero">
  <div class="max-w-7xl mx-auto px-4 py-20 grid md:grid-cols-2 gap-12 items-center">
    <div>
      <p class="text-pink-400 font-medium tracking-widest uppercase text-sm mb-4">Bộ sưu tập mới 2026</p>
      <h1 class="font-display text-5xl md:text-6xl text-white font-bold leading-tight mb-6">
        Phong Cách<br><span style="background:linear-gradient(135deg,#e84393,#f39c12);-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent">Không Giới Hạn</span>
      </h1>
      <p class="text-gray-300 text-lg mb-8 leading-relaxed">Khám phá bộ sưu tập thời trang cao cấp dành cho cả nam lẫn nữ. Chất lượng vải premium, thiết kế tinh tế – thể hiện cá tính của bạn.</p>
      <div class="flex gap-4 flex-wrap">
        <a href="#products" class="btn-primary text-white px-8 py-3 rounded-full font-semibold">
          <i class="fas fa-shopping-bag mr-2"></i>Mua sắm ngay
        </a>
        <a href="#about" class="border border-white/30 text-white px-8 py-3 rounded-full font-semibold hover:bg-white/10 transition">
          Khám phá thêm
        </a>
      </div>
      <div class="mt-12 grid grid-cols-3 gap-6">
        <div class="text-center"><p class="text-3xl font-bold text-white">500+</p><p class="text-gray-400 text-sm">Sản phẩm</p></div>
        <div class="text-center"><p class="text-3xl font-bold text-white">10K+</p><p class="text-gray-400 text-sm">Khách hàng</p></div>
        <div class="text-center"><p class="text-3xl font-bold text-white">4.9★</p><p class="text-gray-400 text-sm">Đánh giá</p></div>
      </div>
    </div>
    <div class="flex justify-center" id="heroBannersWrapper">
      <!-- Collapsed / stacked state -->
      <div id="heroBannersCollapsed" title="Click để xem thêm">
        <!-- will be rendered by JS -->
        <div class="relative w-80 h-96">
          <div class="absolute inset-0 bg-gradient-to-br from-pink-500/20 to-purple-600/20 rounded-3xl rotate-6"></div>
          <div class="relative rounded-3xl w-full h-full bg-gray-700/40 shadow-2xl flex items-center justify-center">
            <i class="fas fa-spinner fa-spin text-white text-3xl"></i>
          </div>
        </div>
      </div>
    </div>

    <!-- Expanded fullscreen overlay -->
    <div id="heroBannersExpanded" onclick="handleBannerOverlayClick(event)">
      <p id="heroBannersExpandedTitle">🔥 Đang thịnh hành</p>
      <p id="heroBannersExpandedSubtitle" class="text-white/70 text-xs md:text-sm text-center mb-4">Đây là những sản phẩm hot nhất và đang được đặt mua nhiều nhất ở thời điểm hiện tại.</p>
      <div id="heroBannersExpandedInner">
        <!-- filled by JS -->
      </div>
    </div>
  </div>
</section>

<!-- FILTER BAR -->
<section class="sticky top-16 z-40 bg-white shadow-sm border-b" id="filterBar">
  <div class="max-w-7xl mx-auto px-4 py-3 flex gap-3 overflow-x-auto scrollbar-none items-center">
    <span class="text-sm text-gray-500 whitespace-nowrap font-medium">Lọc:</span>
    <button class="filter-btn active whitespace-nowrap px-4 py-1.5 rounded-full border text-sm font-medium transition" data-cat="all" onclick="filterProducts('all',this)">Tất cả</button>
    <button class="filter-btn whitespace-nowrap px-4 py-1.5 rounded-full border text-sm font-medium transition text-gray-600 hover:border-red-400" data-cat="unisex" onclick="filterProducts('unisex',this)">Unisex</button>
    <button class="filter-btn whitespace-nowrap px-4 py-1.5 rounded-full border text-sm font-medium transition text-gray-600 hover:border-red-400" data-cat="male" onclick="filterProducts('male',this)">Nam</button>
    <button class="filter-btn whitespace-nowrap px-4 py-1.5 rounded-full border text-sm font-medium transition text-gray-600 hover:border-red-400" data-cat="female" onclick="filterProducts('female',this)">Nữ</button>
    <div class="flex-1"></div>
    <div class="relative">
      <input type="text" id="searchInput" placeholder="Tìm sản phẩm..." 
        class="pl-8 pr-4 py-1.5 border rounded-full text-sm focus:outline-none focus:border-pink-400 w-48"
        oninput="searchProducts(this.value)">
      <i class="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs"></i>
    </div>
  </div>
</section>

<!-- PRODUCTS -->
<section class="max-w-7xl mx-auto px-4 py-16" id="products">
  <div class="text-center mb-12">
    <p class="text-pink-500 font-medium tracking-widest uppercase text-sm">Khám phá ngay</p>
    <h2 class="font-display text-4xl font-bold text-gray-900 mt-2">Sản Phẩm Nổi Bật</h2>
    <p class="text-gray-500 mt-3">Những thiết kế được yêu thích nhất từ bộ sưu tập của chúng tôi</p>
  </div>
  <div id="productsGrid" class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
    <!-- skeleton placeholders -->
    
    <div class="skeleton rounded-2xl h-80"></div>
    <div class="skeleton rounded-2xl h-80"></div>
    <div class="skeleton rounded-2xl h-80"></div>
    <div class="skeleton rounded-2xl h-80"></div>
  </div>
  <div id="emptyState" class="hidden text-center py-20">
    <i class="fas fa-box-open text-6xl text-gray-300 mb-4"></i>
    <p class="text-gray-400 text-lg">Không tìm thấy sản phẩm nào</p>
  </div>
</section>

<!-- FEATURES SECTION -->
<section class="bg-white py-16" id="about">
  <div class="max-w-7xl mx-auto px-4">
    <div class="grid md:grid-cols-4 gap-8 text-center">
      <div class="p-6"><div class="w-14 h-14 bg-pink-50 rounded-2xl flex items-center justify-center mx-auto mb-4"><i class="fas fa-truck text-pink-500 text-2xl"></i></div><h3 class="font-semibold text-gray-800 mb-2">Giao hàng toàn quốc</h3><p class="text-gray-500 text-sm">Giao tận nơi, nhanh chóng, an toàn</p></div>
      <div class="p-6"><div class="w-14 h-14 bg-pink-50 rounded-2xl flex items-center justify-center mx-auto mb-4"><i class="fas fa-shield-alt text-pink-500 text-2xl"></i></div><h3 class="font-semibold text-gray-800 mb-2">Chất lượng đảm bảo</h3><p class="text-gray-500 text-sm">100% vải cao cấp, kiểm định chặt chẽ</p></div>
      <div class="p-6"><div class="w-14 h-14 bg-pink-50 rounded-2xl flex items-center justify-center mx-auto mb-4"><i class="fas fa-undo text-pink-500 text-2xl"></i></div><h3 class="font-semibold text-gray-800 mb-2">Đổi trả dễ dàng</h3><p class="text-gray-500 text-sm">7 ngày đổi trả, không cần lý do</p></div>
      <div class="p-6"><div class="w-14 h-14 bg-pink-50 rounded-2xl flex items-center justify-center mx-auto mb-4"><i class="fas fa-headset text-pink-500 text-2xl"></i></div><h3 class="font-semibold text-gray-800 mb-2">Hỗ trợ 24/7</h3><p class="text-gray-500 text-sm">Tư vấn nhiệt tình, tận tâm</p></div>
    </div>
  </div>
</section>

<!-- FOOTER -->
<footer class="gradient-hero text-white py-12" id="contact">
  <div class="max-w-7xl mx-auto px-4 grid md:grid-cols-3 gap-8">
    <div>
      <h3 class="font-display text-2xl font-bold mb-4 flex items-center gap-2">
        <span class="logo-spinner"><img src="/qh-logo.png" alt="QH"></span>
        <span>QH<span class="text-pink-400">Clothes</span></span>
      </h3>
      <p class="text-gray-400 text-sm leading-relaxed">Thương hiệu thời trang Việt Nam cao cấp, mang phong cách hiện đại đến với mọi người.</p>
    </div>
    <div>
      <h4 class="font-semibold mb-4">Liên kết nhanh</h4>
      <div class="flex flex-col gap-2 text-gray-400 text-sm">
        <a href="#products" class="hover:text-pink-400 transition">Sản phẩm</a>
        <a href="#about" class="hover:text-pink-400 transition">Về chúng tôi</a>
        <a href="/admin" class="hover:text-pink-400 transition">Quản trị</a>
      </div>
    </div>
    <div>
      <h4 class="font-semibold mb-4">Liên hệ</h4>
      <div class="flex flex-col gap-2 text-gray-400 text-sm">
        <p><i class="fas fa-phone mr-2 text-pink-400"></i>0987 654 321</p>
        <p><i class="fas fa-envelope mr-2 text-pink-400"></i>hello@qhclothes.com</p>
        <p><i class="fas fa-map-marker-alt mr-2 text-pink-400"></i>TP. Hồ Chí Minh, Việt Nam</p>
      </div>
    </div>
  </div>
  <div class="max-w-7xl mx-auto px-4 mt-8 pt-8 border-t border-white/10 text-center text-gray-500 text-sm">
    © 2026 QH Clothes. All rights reserved.
  </div>
</footer>

<!-- ORDER POPUP -->
<div id="orderOverlay" class="fixed inset-0 overlay z-50 hidden flex items-center justify-center p-4">
  <div class="popup-card bg-white rounded-3xl shadow-2xl w-full max-w-md md:max-w-[56rem] max-h-[90vh] overflow-y-auto" id="orderPopupCard">
    <div class="sticky top-0 bg-white rounded-t-3xl border-b px-6 py-4 flex items-center justify-between">
      <h3 class="font-display text-xl font-bold text-gray-900">Đặt hàng nhanh</h3>
      <button onclick="closeOrder()" class="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 transition">
        <i class="fas fa-times text-gray-600"></i>
      </button>
    </div>
    
    <div class="px-6 py-4">
      <!-- Product Preview -->
      <div id="orderProductPreview" class="flex gap-3 p-3 bg-gray-50 rounded-2xl mb-5">
        <img id="orderProductImg" src="" alt="" class="w-16 h-20 object-cover rounded-xl">
        <div>
          <p id="orderProductName" class="font-semibold text-gray-800 text-sm"></p>
          <p id="orderProductPrice" class="text-pink-600 font-bold mt-1"></p>
        </div>
      </div>

      <div class="space-y-4">
        <!-- Họ tên -->
        <div id="fieldName">
          <label class="block text-sm font-semibold text-gray-700 mb-1.5 field-title">
            <i class="fas fa-user text-pink-400 mr-1"></i>Họ và tên *
          </label>
          <input type="text" id="orderName" placeholder="Nhập họ và tên"
            class="w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-pink-400 focus:ring-1 focus:ring-pink-200">
        </div>
        <!-- SĐT -->
        <div id="fieldPhone">
          <label class="block text-sm font-semibold text-gray-700 mb-1.5 field-title">
            <i class="fas fa-phone text-pink-400 mr-1"></i>Số điện thoại *
          </label>
          <input type="tel" id="orderPhone" placeholder="0987 654 321"
            class="w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-pink-400 focus:ring-1 focus:ring-pink-200">
        </div>
        <!-- Địa chỉ -->
        <div id="fieldAddress">
          <label class="block text-sm font-semibold text-gray-700 mb-1.5 field-title">
            <i class="fas fa-map-marker-alt text-pink-400 mr-1"></i>Địa chỉ giao hàng *
          </label>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-2.5">
            <div id="orderProvinceDropdown" class="relative">
              <button type="button" id="orderProvinceTrigger" onclick="toggleAddressDropdown('order','province')"
                class="w-full border rounded-xl px-3.5 py-2.5 text-sm bg-white text-left flex items-center justify-between focus:outline-none focus:border-pink-400 focus:ring-1 focus:ring-pink-200">
                <span id="orderProvinceLabel" class="text-gray-500">Chọn tỉnh/thành</span>
                <i class="fas fa-chevron-down text-gray-400 text-xs"></i>
              </button>
              <div id="orderProvinceMenu" class="hidden absolute z-[90] mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden">
                <div class="p-2 border-b bg-gray-50">
                  <input type="text" id="orderProvinceSearch" placeholder="Tìm tỉnh/thành..."
                    oninput="onAddressDropdownSearchInput('order','province')"
                    class="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-pink-400 focus:ring-1 focus:ring-pink-200">
                </div>
                <div id="orderProvinceOptions" class="max-h-56 overflow-auto"></div>
              </div>
              <select id="orderProvince" onchange="onAddressProvinceChange('order')" class="hidden">
                <option value="">Chọn tỉnh/thành</option>
              </select>
            </div>
            <div id="orderCommuneDropdown" class="relative">
              <button type="button" id="orderCommuneTrigger" onclick="toggleAddressDropdown('order','commune')"
                class="w-full border rounded-xl px-3.5 py-2.5 text-sm bg-white text-left flex items-center justify-between focus:outline-none focus:border-pink-400 focus:ring-1 focus:ring-pink-200">
                <span id="orderCommuneLabel" class="text-gray-500">Chọn phường/xã</span>
                <i class="fas fa-chevron-down text-gray-400 text-xs"></i>
              </button>
              <div id="orderCommuneMenu" class="hidden absolute z-[90] mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden">
                <div class="p-2 border-b bg-gray-50">
                  <input type="text" id="orderCommuneSearch" placeholder="Tìm phường/xã..."
                    oninput="onAddressDropdownSearchInput('order','commune')"
                    class="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-pink-400 focus:ring-1 focus:ring-pink-200">
                </div>
                <div id="orderCommuneOptions" class="max-h-56 overflow-auto"></div>
              </div>
              <select id="orderCommune" onchange="onAddressCommuneChange('order')" class="hidden">
                <option value="">Chọn phường/xã</option>
              </select>
            </div>
          </div>
          <input type="text" id="orderAddressDetail"
            placeholder="Số nhà, tên đường..."
            class="mt-2.5 w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-pink-400 focus:ring-1 focus:ring-pink-200"
            oninput="clearFieldError('fieldAddress'); syncAddressFullText('order')">
          <input type="text" id="orderAddress"
            readonly
            placeholder="Địa chỉ đầy đủ sẽ tự động ghép tại đây"
            class="mt-2.5 w-full border rounded-xl px-4 py-2.5 text-sm bg-gray-50 text-gray-600 focus:outline-none">
        </div>
        
        <!-- Color -->
        <div id="fieldColor">
          <label class="block text-sm font-semibold text-gray-700 mb-2 field-title">
            <i class="fas fa-palette text-pink-400 mr-1"></i>Màu sắc
          </label>
          <div id="colorOptions" class="flex flex-wrap gap-2"></div>
        </div>
        
        <!-- Size -->
        <div id="sizeSection">
          <label class="block text-sm font-semibold text-gray-700 mb-2 field-title">
            <i class="fas fa-ruler text-pink-400 mr-1"></i>Size
          </label>
          <div id="sizeOptions" class="flex flex-wrap gap-2"></div>
        </div>
        
        <!-- Quantity -->
        <div>
          <label class="block text-sm font-semibold text-gray-700 mb-2">
            <i class="fas fa-sort-numeric-up text-pink-400 mr-1"></i>Số lượng
          </label>
          <div class="flex items-center gap-3">
            <button onclick="changeQty(-1)" class="w-9 h-9 rounded-full border-2 border-gray-300 flex items-center justify-center hover:border-pink-400 hover:text-pink-500 transition font-bold">−</button>
            <span id="qtyDisplay" class="text-xl font-bold w-8 text-center">1</span>
            <button onclick="changeQty(1)" class="w-9 h-9 rounded-full border-2 border-gray-300 flex items-center justify-center hover:border-pink-400 hover:text-pink-500 transition font-bold">+</button>
          </div>
        </div>
        
        <!-- Voucher -->
        <div id="fieldVoucher">
          <label class="block text-sm font-semibold text-gray-700 mb-1.5 field-title">
            <i class="fas fa-tag text-pink-400 mr-1"></i>Mã giảm giá (tuỳ chọn)
          </label>
          <div class="flex gap-2">
            <input type="text" id="orderVoucher" placeholder="Nhập mã voucher..."
              class="flex-1 border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-pink-400 focus:ring-1 focus:ring-pink-200 uppercase tracking-wider"
              oninput="this.value=this.value.toUpperCase()">
            <button onclick="applyVoucher()" id="voucherBtn"
              class="px-4 py-2.5 bg-gray-800 hover:bg-gray-700 text-white rounded-xl text-sm font-semibold transition whitespace-nowrap">
              Áp dụng
            </button>
          </div>
          <div id="voucherStatus" class="mt-2 hidden"></div>
        </div>
        
        <!-- Note -->
        <div>
          <label class="block text-sm font-semibold text-gray-700 mb-1.5">
            <i class="fas fa-sticky-note text-pink-400 mr-1"></i>Ghi chú (tuỳ chọn)
          </label>
          <input type="text" id="orderNote" placeholder="Ghi chú cho đơn hàng..."
            class="w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-pink-400 focus:ring-1 focus:ring-pink-200">
        </div>

        <div id="fieldPaymentMethod">
          <label class="block text-sm font-semibold text-gray-700 mb-1.5 field-title">
            <i class="fas fa-credit-card text-pink-400 mr-1"></i>Chọn phương thức thanh toán *
          </label>
          <p class="text-xs text-red-500 mb-2">Trường này là bắt buộc</p>
          <div class="space-y-2">
            <button type="button" class="payment-method-btn w-full flex items-center gap-3 border rounded-xl px-3 py-2.5 text-left hover:border-pink-400 transition"
              onclick="selectPaymentMethod('COD', this)">
              <span class="w-8 h-8 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center">
                <i class="fas fa-money-bill-wave"></i>
              </span>
              <span>
                <span class="block text-sm font-semibold text-gray-800">COD</span>
                <span class="block text-xs text-gray-500">Thanh toán khi giao</span>
              </span>
            </button>

            <div class="w-full flex items-center gap-2 border rounded-xl px-3 py-2.5 hover:border-pink-400 transition">
              <button type="button" class="payment-method-btn flex-1 flex items-center gap-3 text-left border rounded-lg px-2 py-1.5"
                onclick="selectPaymentMethod('ZALOPAY', this)">
                <span class="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold">ZP</span>
                <span class="block text-sm font-semibold text-gray-800">Zalopay</span>
              </button>
              <button type="button" class="text-sm font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
                onclick="openZaloPayLink(event)">
                Liên kết <i class="fas fa-chevron-right text-xs"></i>
              </button>
            </div>

            <button type="button" class="payment-method-btn w-full flex items-center gap-3 border rounded-xl px-3 py-2.5 text-left hover:border-pink-400 transition"
              onclick="selectPaymentMethod('MOMO', this)">
              <span class="w-8 h-8 rounded-full bg-pink-100 text-pink-600 flex items-center justify-center">
                <i class="fas fa-wallet"></i>
              </span>
              <span class="block text-sm font-semibold text-gray-800">Ví điện tử MoMo</span>
            </button>

            <button type="button" class="payment-method-btn w-full flex items-center gap-3 border rounded-xl px-3 py-2.5 text-left hover:border-pink-400 transition"
              onclick="selectPaymentMethod('BANK_TRANSFER', this)">
              <span class="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
                <i class="fas fa-university"></i>
              </span>
              <span class="block text-sm font-semibold text-gray-800">Chuyển khoản ngân hàng</span>
            </button>
          </div>
        </div>
        
        <!-- Total -->
        <div class="bg-gradient-to-r from-pink-50 to-red-50 rounded-2xl p-4 space-y-1.5">
          <div id="subtotalRow" class="flex justify-between items-center hidden">
            <span class="text-sm text-gray-500">Tạm tính:</span>
            <span id="orderSubtotal" class="text-sm font-semibold text-gray-700">0đ</span>
          </div>
          <div id="discountRow" class="flex justify-between items-center hidden">
            <span class="text-sm text-green-600 font-medium"><i class="fas fa-tag mr-1"></i>Giảm giá:</span>
            <span id="orderDiscount" class="text-sm font-bold text-green-600">-0đ</span>
          </div>
          <div class="flex justify-between items-center">
            <span class="font-semibold text-gray-700">Tổng cộng:</span>
            <span id="orderTotal" class="text-2xl font-bold text-pink-600">0đ</span>
          </div>
        </div>
        
        <div class="flex gap-2">
          <button onclick="addCurrentToCart()" id="addToCartBtn"
            class="flex-shrink-0 flex items-center justify-center gap-2 bg-gray-800 hover:bg-gray-700 text-white px-4 py-3.5 rounded-xl font-semibold text-sm transition">
            <i class="fas fa-shopping-bag"></i><span class="hidden sm:inline">Giỏ hàng</span>
          </button>
          <button onclick="submitOrder()" id="submitOrderBtn"
            class="btn-primary flex-1 text-white py-3.5 rounded-xl font-bold text-base">
            <i class="fas fa-bolt mr-2"></i>Đặt ngay
          </button>
        </div>
      </div>
    </div>
  </div>
</div>

<!-- ORDER BANK TRANSFER QR MODAL -->
<div id="orderBankTransferOverlay" class="fixed inset-0 overlay z-[70] hidden flex items-center justify-center p-4">
  <div class="popup-card bg-white rounded-3xl shadow-2xl w-full max-w-md max-h-[92vh] overflow-y-auto">
    <div class="sticky top-0 bg-white rounded-t-3xl border-b px-6 py-4 flex items-center justify-between">
      <h3 class="font-display text-xl font-bold text-gray-900">
        <i class="fas fa-qrcode text-pink-500 mr-2"></i>Quét mã QR để thanh toán
      </h3>
      <button onclick="closeOrderBankTransferModal()" class="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 transition">
        <i class="fas fa-times text-gray-600"></i>
      </button>
    </div>
    <div class="px-6 py-5">
      <div class="border rounded-2xl p-4 bg-gray-50">
        <div class="flex justify-center mb-3">
          <img id="orderBankQrImg" src="" alt="VietQR thanh toán đơn hàng" class="w-56 h-56 object-contain rounded-xl border bg-white">
        </div>
        <div class="space-y-2 text-sm">
          <div class="flex justify-between items-center bg-white rounded-lg px-3 py-2 border">
            <span class="text-gray-500">Ngân hàng</span>
            <span class="font-bold text-gray-800">MB Bank</span>
          </div>
          <div class="flex justify-between items-center bg-white rounded-lg px-3 py-2 border">
            <span class="text-gray-500">Số TK</span>
            <span class="font-bold text-gray-800">
              <span id="orderBankAccountNo"></span>
              <button type="button" class="ml-1 text-gray-400 hover:text-gray-600" onclick="copyBankValue(document.getElementById('orderBankAccountNo').textContent)">
                <i class="fas fa-copy"></i>
              </button>
            </span>
          </div>
          <div class="flex justify-between items-center bg-white rounded-lg px-3 py-2 border">
            <span class="text-gray-500">Chủ TK</span>
            <span class="font-bold text-gray-800" id="orderBankAccountName"></span>
          </div>
          <div class="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
            <p class="text-amber-700 text-xs font-semibold mb-1">Nội dung CK (BẮT BUỘC)</p>
            <div class="flex items-center justify-between">
              <span id="orderBankTransferContent" class="font-mono font-bold text-amber-800"></span>
              <button type="button" class="text-amber-500 hover:text-amber-700" onclick="copyBankValue(document.getElementById('orderBankTransferContent').textContent)">
                <i class="fas fa-copy"></i>
              </button>
            </div>
          </div>
          <div class="flex justify-between items-center bg-white rounded-lg px-3 py-2 border">
            <span class="text-gray-500">Số tiền</span>
            <span class="font-bold text-pink-600" id="orderBankAmountDisplay"></span>
          </div>
          <div class="flex justify-between items-center bg-white rounded-lg px-3 py-2 border">
            <span class="text-gray-500">Mã đơn</span>
            <span class="font-mono font-bold text-blue-600" id="orderBankOrderCode"></span>
          </div>
        </div>
      </div>
      <div class="mt-4 bg-blue-50 border border-blue-200 rounded-xl px-3 py-2 text-xs text-blue-700">
        Sau khi chuyển khoản, đơn hàng sẽ được xác nhận khi shop đối soát giao dịch.
      </div>
    </div>
  </div>
</div>

<div id="orderPaidNoticeOverlay" class="fixed inset-0 z-[80] hidden items-center justify-center bg-black/30 p-4">
  <div class="bg-white rounded-2xl shadow-2xl w-full max-w-xs p-5 text-center">
    <div class="w-12 h-12 mx-auto mb-3 rounded-full bg-green-100 text-green-600 flex items-center justify-center">
      <i class="fas fa-check text-xl"></i>
    </div>
    <p class="text-green-600 font-bold text-lg">Đã thanh toán thành công</p>
    <p class="text-sm text-gray-600 mt-1">Đơn hàng đã được ghi nhận.</p>
    <p class="text-xs font-mono text-blue-600 mt-2" id="orderPaidNoticeCode"></p>
  </div>
</div>

<!-- PRODUCT DETAIL POPUP -->
<div id="detailOverlay" class="fixed inset-0 overlay hidden flex items-center justify-center p-4" style="z-index:1001;">
  <div class="popup-card bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
    <div class="sticky top-0 bg-white rounded-t-3xl border-b px-6 py-4 flex items-center justify-between">
      <h3 class="font-display text-xl font-bold text-gray-900">Chi tiết sản phẩm</h3>
      <button onclick="closeDetail()" class="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 transition">
        <i class="fas fa-times text-gray-600"></i>
      </button>
    </div>
    <div id="detailContent" class="px-6 py-4"></div>
  </div>
</div>

<!-- CART MODAL (full-screen, slide from right) -->
<div id="cartOverlay" class="fixed inset-0 overlay z-50 hidden" onclick="handleCartOverlayClick(event)">
  <div id="cartModal" class="cart-modal absolute right-0 top-0 bottom-0 w-full max-w-lg bg-white flex flex-col shadow-2xl">
    
    <!-- Cart Header -->
    <div id="cartHeader" class="flex items-center justify-between px-5 py-4 border-b bg-gradient-to-r from-gray-900 to-gray-800 text-white flex-shrink-0">
      <div class="flex items-center gap-3">
        <button id="cartBackBtn" onclick="cartGoBack()" class="hidden w-8 h-8 flex items-center justify-center rounded-full bg-white/20 hover:bg-white/30 transition">
          <i class="fas fa-arrow-left text-sm"></i>
        </button>
        <div>
          <h2 id="cartTitle" class="font-display text-lg font-bold">Giỏ hàng</h2>
          <p id="cartSubtitle" class="text-xs text-gray-300">Chưa có sản phẩm</p>
        </div>
      </div>
      <button onclick="closeCart()" class="w-9 h-9 flex items-center justify-center rounded-full bg-white/20 hover:bg-white/30 transition">
        <i class="fas fa-times"></i>
      </button>
    </div>

    <!-- STEP 1: Cart items list -->
    <div id="cartStep1" class="flex flex-col flex-1 overflow-hidden">
      <!-- Check all bar -->
      <div id="cartCheckAllBar" class="hidden flex items-center gap-3 px-5 py-3 bg-gray-50 border-b flex-shrink-0">
        <label class="flex items-center gap-2 cursor-pointer select-none">
          <input type="checkbox" id="checkAll" onchange="toggleCheckAll(this)" class="w-4 h-4 accent-pink-500 cursor-pointer">
          <span class="text-sm font-medium text-gray-700">Chọn tất cả</span>
        </label>
        <span id="selectedCount" class="ml-auto text-xs text-gray-400"></span>
        <button onclick="removeChecked()" id="deleteCheckedBtn" class="hidden text-xs text-red-500 hover:text-red-600 font-medium transition">
          <i class="fas fa-trash mr-1"></i>Xoá đã chọn
        </button>
      </div>

      <!-- Items scroll area -->
      <div id="cartItemsList" class="flex-1 overflow-y-auto px-4 py-3 space-y-3">
        <!-- filled dynamically -->
      </div>

      <!-- Cart Footer -->
      <div id="cartFooter" class="hidden flex-shrink-0 border-t bg-white px-5 py-4">
        <div class="flex items-center justify-between mb-3">
          <span class="text-gray-600 font-medium">Tổng cộng (<span id="cartSelectedItems">0</span> sản phẩm):</span>
          <span id="cartTotalPrice" class="text-xl font-bold text-pink-600">0đ</span>
        </div>
        <button onclick="proceedToCheckout()" id="checkoutBtn"
          class="btn-primary w-full text-white py-3.5 rounded-xl font-bold text-base disabled:opacity-50">
          <i class="fas fa-credit-card mr-2"></i>Xác nhận & Đặt hàng
        </button>
      </div>
    </div>

    <!-- STEP 2: Checkout form -->
    <div id="cartStep2" class="hidden flex-col flex-1 overflow-hidden checkout-slide">
      <!-- Order summary mini -->
      <div id="checkoutSummary" class="flex-shrink-0 bg-gray-50 border-b px-5 py-3 overflow-x-auto">
        <div id="checkoutSummaryItems" class="flex gap-3 min-w-max"></div>
      </div>

      <!-- Form -->
      <div class="flex-1 overflow-y-auto px-5 py-4">
        <h3 class="font-display text-base font-bold text-gray-800 mb-4">Thông tin giao hàng</h3>
        <div class="space-y-4">
          <!-- Họ tên -->
          <div id="ckFieldName">
            <label class="block text-sm font-semibold text-gray-700 mb-1.5 field-title">
              <i class="fas fa-user text-pink-400 mr-1"></i>Họ và tên *
            </label>
            <input type="text" id="ckName" placeholder="Nhập họ và tên"
              class="w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-pink-400 focus:ring-1 focus:ring-pink-200"
              oninput="clearCheckoutError('ckFieldName')">
          </div>
          <!-- SĐT -->
          <div id="ckFieldPhone">
            <label class="block text-sm font-semibold text-gray-700 mb-1.5 field-title">
              <i class="fas fa-phone text-pink-400 mr-1"></i>Số điện thoại *
            </label>
            <input type="tel" id="ckPhone" placeholder="0987 654 321"
              class="w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-pink-400 focus:ring-1 focus:ring-pink-200"
              oninput="clearCheckoutError('ckFieldPhone')">
          </div>
          <!-- Địa chỉ -->
          <div id="ckFieldAddress">
            <label class="block text-sm font-semibold text-gray-700 mb-1.5 field-title">
              <i class="fas fa-map-marker-alt text-pink-400 mr-1"></i>Địa chỉ giao hàng *
            </label>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-2.5">
              <div id="ckProvinceDropdown" class="relative">
                <button type="button" id="ckProvinceTrigger" onclick="toggleAddressDropdown('ck','province')"
                  class="w-full border rounded-xl px-3.5 py-2.5 text-sm bg-white text-left flex items-center justify-between focus:outline-none focus:border-pink-400 focus:ring-1 focus:ring-pink-200">
                  <span id="ckProvinceLabel" class="text-gray-500">Chọn tỉnh/thành</span>
                  <i class="fas fa-chevron-down text-gray-400 text-xs"></i>
                </button>
                <div id="ckProvinceMenu" class="hidden absolute z-[90] mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden">
                  <div class="p-2 border-b bg-gray-50">
                    <input type="text" id="ckProvinceSearch" placeholder="Tìm tỉnh/thành..."
                      oninput="onAddressDropdownSearchInput('ck','province')"
                      class="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-pink-400 focus:ring-1 focus:ring-pink-200">
                  </div>
                  <div id="ckProvinceOptions" class="max-h-56 overflow-auto"></div>
                </div>
                <select id="ckProvince" onchange="onAddressProvinceChange('ck')" class="hidden">
                  <option value="">Chọn tỉnh/thành</option>
                </select>
              </div>
              <div id="ckCommuneDropdown" class="relative">
                <button type="button" id="ckCommuneTrigger" onclick="toggleAddressDropdown('ck','commune')"
                  class="w-full border rounded-xl px-3.5 py-2.5 text-sm bg-white text-left flex items-center justify-between focus:outline-none focus:border-pink-400 focus:ring-1 focus:ring-pink-200">
                  <span id="ckCommuneLabel" class="text-gray-500">Chọn phường/xã</span>
                  <i class="fas fa-chevron-down text-gray-400 text-xs"></i>
                </button>
                <div id="ckCommuneMenu" class="hidden absolute z-[90] mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden">
                  <div class="p-2 border-b bg-gray-50">
                    <input type="text" id="ckCommuneSearch" placeholder="Tìm phường/xã..."
                      oninput="onAddressDropdownSearchInput('ck','commune')"
                      class="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-pink-400 focus:ring-1 focus:ring-pink-200">
                  </div>
                  <div id="ckCommuneOptions" class="max-h-56 overflow-auto"></div>
                </div>
                <select id="ckCommune" onchange="onAddressCommuneChange('ck')" class="hidden">
                  <option value="">Chọn phường/xã</option>
                </select>
              </div>
            </div>
            <input type="text" id="ckAddressDetail"
              placeholder="Số nhà, tên đường..."
              class="mt-2.5 w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-pink-400 focus:ring-1 focus:ring-pink-200"
              oninput="clearCheckoutError('ckFieldAddress'); syncAddressFullText('ck')">
            <input type="text" id="ckAddress"
              readonly
              placeholder="Địa chỉ đầy đủ sẽ tự động ghép tại đây"
              class="mt-2.5 w-full border rounded-xl px-4 py-2.5 text-sm bg-gray-50 text-gray-600 focus:outline-none">
          </div>
          <!-- Voucher -->
          <div id="ckFieldVoucher">
            <label class="block text-sm font-semibold text-gray-700 mb-1.5">
              <i class="fas fa-tag text-pink-400 mr-1"></i>Mã giảm giá (tuỳ chọn)
            </label>
            <div class="flex gap-2">
              <input type="text" id="ckVoucher" placeholder="Nhập mã voucher..."
                class="flex-1 border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-pink-400 focus:ring-1 focus:ring-pink-200 uppercase tracking-wider"
                oninput="this.value=this.value.toUpperCase()">
              <button onclick="applyCkVoucher()" id="ckVoucherBtn"
                class="px-4 py-2.5 bg-gray-800 hover:bg-gray-700 text-white rounded-xl text-sm font-semibold transition whitespace-nowrap">
                Áp dụng
              </button>
            </div>
            <div id="ckVoucherStatus" class="mt-2 hidden"></div>
          </div>
          <!-- Note -->
          <div>
            <label class="block text-sm font-semibold text-gray-700 mb-1.5">
              <i class="fas fa-sticky-note text-pink-400 mr-1"></i>Ghi chú (tuỳ chọn)
            </label>
            <input type="text" id="ckNote" placeholder="Ghi chú cho đơn hàng..."
              class="w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-pink-400 focus:ring-1 focus:ring-pink-200">
          </div>
          <!-- Total box -->
          <div class="bg-gradient-to-r from-pink-50 to-red-50 rounded-2xl p-4 space-y-1.5">
            <div id="ckSubtotalRow" class="hidden flex justify-between items-center">
              <span class="text-sm text-gray-500">Tạm tính:</span>
              <span id="ckSubtotal" class="text-sm font-semibold text-gray-700">0đ</span>
            </div>
            <div id="ckDiscountRow" class="hidden flex justify-between items-center">
              <span class="text-sm text-green-600 font-medium"><i class="fas fa-tag mr-1"></i>Giảm giá:</span>
              <span id="ckDiscount" class="text-sm font-bold text-green-600">-0đ</span>
            </div>
            <div class="flex justify-between items-center">
              <span class="font-semibold text-gray-700">Tổng cộng:</span>
              <span id="ckTotal" class="text-2xl font-bold text-pink-600">0đ</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Submit button -->
      <div class="flex-shrink-0 border-t bg-white px-5 py-4">
        <button onclick="submitCartOrder()" id="submitCartBtn"
          class="btn-primary w-full text-white py-3.5 rounded-xl font-bold text-base">
          <i class="fas fa-shopping-cart mr-2"></i>Đặt hàng ngay
        </button>
      </div>
    </div>

  </div>
</div>

<!-- TOAST -->
<!-- USER MENU OVERLAY -->
<div id="userMenuOverlay" class="fixed inset-0 user-menu-overlay z-50 hidden" onclick="handleUserMenuOverlayClick(event)">
  <div id="userMenuPanel" class="user-menu-panel absolute right-0 top-0 bottom-0 w-full max-w-sm bg-white flex flex-col shadow-2xl">
    <!-- Header -->
    <div class="bg-gradient-to-r from-gray-900 to-gray-800 text-white px-5 py-5 flex-shrink-0">
      <div class="flex items-center justify-between mb-4">
        <h2 class="font-display text-lg font-bold">Tài khoản</h2>
        <button onclick="closeUserMenu()" class="w-8 h-8 flex items-center justify-center rounded-full bg-white/20 hover:bg-white/30 transition">
          <i class="fas fa-times"></i>
        </button>
      </div>
      <!-- Guest state -->
      <div id="userMenuGuest">
        <p class="text-gray-300 text-sm mb-3">Đăng nhập để lưu lịch sử đơn hàng</p>
        <button onclick="loginWithGoogle()" class="w-full flex items-center justify-center gap-3 bg-white text-gray-800 px-4 py-3 rounded-xl font-semibold text-sm hover:bg-gray-100 transition">
          <svg width="18" height="18" viewBox="0 0 18 18"><path d="M17.6 9.2c0-.6-.1-1.2-.2-1.8H9v3.4h4.8c-.2 1.1-.8 2-1.7 2.6v2.2h2.8c1.6-1.5 2.7-3.7 2.7-6.4z" fill="#4285F4"/><path d="M9 18c2.4 0 4.5-.8 6-2.2l-2.8-2.2c-.8.6-1.9.9-3.2.9-2.5 0-4.5-1.7-5.3-3.9H.8v2.3C2.3 16 5.4 18 9 18z" fill="#34A853"/><path d="M3.7 10.7c-.2-.6-.3-1.2-.3-1.7s.1-1.2.3-1.7V5H.8C.3 6 0 7.2 0 9s.3 3 .8 4l2.9-2.3z" fill="#FBBC05"/><path d="M9 3.6c1.4 0 2.6.5 3.5 1.4l2.6-2.6C13.5.9 11.4 0 9 0 5.4 0 2.3 2 .8 5l2.9 2.3c.8-2.2 2.8-3.7 5.3-3.7z" fill="#EA4335"/></svg>
          Đăng nhập bằng Google
        </button>
      </div>
      <!-- Logged in state -->
      <div id="userMenuLoggedIn" class="hidden">
        <div class="flex items-center gap-3">
          <img id="userMenuAvatar" src="" class="w-12 h-12 rounded-full object-cover border-2 border-pink-400">
          <div>
            <p id="userMenuName" class="font-semibold"></p>
            <p id="userMenuEmail" class="text-gray-400 text-xs"></p>
          </div>
        </div>
      </div>
    </div>
    <!-- Menu Items -->
    <div class="flex-1 overflow-y-auto px-4 py-4">
      <nav class="space-y-1">
        <button onclick="showUserAccount()" class="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-gray-700 hover:bg-pink-50 hover:text-pink-600 transition text-sm font-medium text-left">
          <i class="fas fa-user-circle w-5 text-pink-400"></i>Quản lý tài khoản
        </button>
        <button onclick="showUserOrders()" id="userOrdersBtn" class="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-gray-700 hover:bg-pink-50 hover:text-pink-600 transition text-sm font-medium text-left">
          <i class="fas fa-clipboard-list w-5 text-pink-400"></i>Lịch sử mua hàng
        </button>
        <button onclick="showWalletInMenu()" class="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-gray-700 hover:bg-pink-50 hover:text-pink-600 transition text-sm font-medium text-left">
          <i class="fas fa-wallet w-5 text-pink-400"></i>Nạp tiền vào ví
          <span id="walletBalanceMenu" class="ml-auto text-xs bg-green-50 text-green-600 px-2 py-0.5 rounded-full font-semibold">0đ</span>
        </button>
      </nav>
      <!-- Content area -->
      <div id="userMenuContent" class="mt-4"></div>
    </div>
    <!-- Logout (only when logged in) -->
    <div id="userMenuLogoutArea" class="hidden flex-shrink-0 border-t px-5 py-4">
      <button onclick="logoutUser()" class="w-full flex items-center justify-center gap-2 border-2 border-red-200 text-red-500 py-2.5 rounded-xl font-semibold text-sm hover:bg-red-50 transition">
        <i class="fas fa-sign-out-alt"></i>Đăng xuất
      </button>
    </div>
  </div>
</div>

<!-- TOAST -->
<div id="toastContainer" class="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex flex-col gap-2 pointer-events-none"></div>

<script>
let allProducts = []
let filteredProducts = []
let currentProduct = null
let orderQty = 1
let selectedColor = ''
let orderColorOptions = []
let selectedSize = ''
let selectedPaymentMethod = ''
let pendingBankTransferOrder = null
let bankTransferPollTimer = null
let zaloPayLinkTab = null
let appliedVoucher = null   // { code, discount_amount }

// ── CART STATE ─────────────────────────────────────
// cart = [{ cartId, productId, name, sku, thumbnail, price, color, size, qty, checked }]
let cart = []
let cartStep = 1  // 1=list, 2=checkout
let ckAppliedVoucher = null
let currentUser = null
let isAdminUser = false
let cartStorageKey = 'qhclothes_cart_guest'
const ADDRESS_EFFECTIVE_DATE = 'latest'
let addressProvinceOptions = []
let addressCommuneOptionsByProvince = {}
let addressKitLoadingPromise = null
let addressAutoFillInProgress = false
const addressDropdownSearchState = {}

function getAddressScopeElements(scope) {
  const isCart = scope === 'ck'
  return {
    fieldId: isCart ? 'ckFieldAddress' : 'fieldAddress',
    provinceId: isCart ? 'ckProvince' : 'orderProvince',
    communeId: isCart ? 'ckCommune' : 'orderCommune',
    detailId: isCart ? 'ckAddressDetail' : 'orderAddressDetail',
    fullAddressId: isCart ? 'ckAddress' : 'orderAddress'
  }
}

function getSelectedAddressOptionText(selectEl) {
  if (!selectEl) return ''
  const idx = selectEl.selectedIndex
  if (idx < 0 || !selectEl.options[idx]) return ''
  return String(selectEl.options[idx].textContent || '').trim()
}

function setAddressSelectOptions(selectEl, options, placeholder) {
  if (!selectEl) return
  const safeOptions = Array.isArray(options) ? options : []
  const previousValue = String(selectEl.value || '').trim()
  selectEl.innerHTML = '<option value="">' + placeholder + '</option>'
  safeOptions.forEach((item) => {
    if (!item || !item.code || !item.name) return
    const opt = document.createElement('option')
    opt.value = String(item.code)
    opt.textContent = String(item.name)
    selectEl.appendChild(opt)
  })
  if (previousValue && safeOptions.some((item) => String(item.code) === previousValue)) {
    selectEl.value = previousValue
  }
}

function normalizeSearchText(input) {
  return String(input || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\\u0300-\\u036f]/g, '')
    .trim()
}

function getAddressPreferenceKey() {
  if (isAdminUser) return 'qhclothes_saved_address_admin'
  const uid = Number(currentUser?.userId || currentUser?.id || 0)
  if (uid > 0) return 'qhclothes_saved_address_user_' + uid
  return 'qhclothes_saved_address_guest'
}

function saveAddressPreference(payload) {
  try {
    localStorage.setItem(getAddressPreferenceKey(), JSON.stringify({
      provinceCode: String(payload?.provinceCode || '').trim(),
      communeCode: String(payload?.communeCode || '').trim(),
      detail: String(payload?.detail || '').trim(),
      updatedAt: Date.now()
    }))
  } catch (_) { }
}

function loadAddressPreference() {
  try {
    const raw = localStorage.getItem(getAddressPreferenceKey())
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (!parsed || typeof parsed !== 'object') return null
    const provinceCode = String(parsed.provinceCode || '').trim()
    const communeCode = String(parsed.communeCode || '').trim()
    const detail = String(parsed.detail || '').trim()
    if (!provinceCode || !communeCode || !detail) return null
    return { provinceCode, communeCode, detail }
  } catch (_) {
    return null
  }
}

function getFilteredAddressOptions(options, keyword) {
  const list = Array.isArray(options) ? options : []
  const q = normalizeSearchText(keyword)
  if (!q) return list
  return list.filter((item) => normalizeSearchText(item?.name || '').indexOf(q) >= 0)
}

function getAddressDropdownIds(scope, type) {
  const prefix = scope === 'ck' ? 'ck' : 'order'
  const part = type === 'province' ? 'Province' : 'Commune'
  const root = prefix + part
  return {
    dropdownId: root + 'Dropdown',
    triggerId: root + 'Trigger',
    labelId: root + 'Label',
    menuId: root + 'Menu',
    searchId: root + 'Search',
    optionsId: root + 'Options'
  }
}

function closeAddressDropdown(scope, type) {
  const ids = getAddressDropdownIds(scope, type)
  const menuEl = document.getElementById(ids.menuId)
  if (menuEl) menuEl.classList.add('hidden')
}

function closeAllAddressDropdowns() {
  ;[
    ['order', 'province'],
    ['order', 'commune'],
    ['ck', 'province'],
    ['ck', 'commune']
  ].forEach(([scope, type]) => closeAddressDropdown(scope, type))
}

function renderAddressDropdownList(scope, type, keyword = '') {
  const ids = getAddressScopeElements(scope)
  const dIds = getAddressDropdownIds(scope, type)
  const selectEl = document.getElementById(type === 'province' ? ids.provinceId : ids.communeId)
  const optionsEl = document.getElementById(dIds.optionsId)
  const labelEl = document.getElementById(dIds.labelId)
  if (!selectEl || !optionsEl || !labelEl) return

  const placeholder = String(selectEl.options?.[0]?.textContent || (type === 'province' ? 'Chọn tỉnh/thành' : 'Chọn phường/xã'))
  const selectedCode = String(selectEl.value || '').trim()
  const selectedOpt = Array.from(selectEl.options).find((opt, idx) => idx > 0 && String(opt.value || '').trim() === selectedCode)
  labelEl.textContent = selectedOpt ? String(selectedOpt.textContent || '') : placeholder
  labelEl.classList.toggle('text-gray-500', !selectedOpt)
  labelEl.classList.toggle('text-gray-900', !!selectedOpt)

  const list = Array.from(selectEl.options)
    .slice(1)
    .map((opt) => ({ code: String(opt.value || ''), name: String(opt.textContent || '') }))
  const filtered = getFilteredAddressOptions(list, keyword)

  if (!filtered.length) {
    optionsEl.innerHTML = '<div class="px-3 py-2 text-sm text-gray-400">Không tìm thấy kết quả</div>'
    return
  }

  optionsEl.innerHTML = filtered.map((item) => {
    const active = String(item.code) === selectedCode ? ' active' : ''
    return '<button type="button" class="address-option-item' + active + '" data-scope="' + scope + '" data-type="' + type + '" data-code="' + item.code + '" onclick="selectAddressDropdownOption(this.dataset.scope,this.dataset.type,this.dataset.code)">' + item.name + '</button>'
  }).join('')
}

function renderProvinceOptionsForScope(scope, keyword = '') {
  const ids = getAddressScopeElements(scope)
  const provinceEl = document.getElementById(ids.provinceId)
  const filtered = getFilteredAddressOptions(addressProvinceOptions, keyword)
  setAddressSelectOptions(provinceEl, filtered, filtered.length ? 'Chọn tỉnh/thành' : 'Không tìm thấy tỉnh/thành')
  renderAddressDropdownList(scope, 'province', keyword)
}

function renderCommuneOptionsForScope(scope, keyword = '') {
  const ids = getAddressScopeElements(scope)
  const provinceEl = document.getElementById(ids.provinceId)
  const communeEl = document.getElementById(ids.communeId)
  const provinceCode = String(provinceEl?.value || '').trim()
  const list = provinceCode ? (addressCommuneOptionsByProvince[provinceCode] || []) : []
  const filtered = getFilteredAddressOptions(list, keyword)
  const placeholder = provinceCode
    ? (filtered.length ? 'Chọn phường/xã' : 'Không tìm thấy phường/xã')
    : 'Chọn phường/xã'
  setAddressSelectOptions(communeEl, filtered, placeholder)
  renderAddressDropdownList(scope, 'commune', keyword)
}

async function fetchAddressProvinces() {
  const res = await axios.get('/api/address/provinces', { params: { effectiveDate: ADDRESS_EFFECTIVE_DATE } })
  const list = Array.isArray(res.data?.data) ? res.data.data : []
  addressProvinceOptions = list.filter((p) => p && p.code && p.name)
  renderProvinceOptionsForScope('order')
  renderProvinceOptionsForScope('ck')
}

async function ensureAddressKitReady() {
  if (!addressKitLoadingPromise) {
    addressKitLoadingPromise = fetchAddressProvinces()
      .catch((err) => {
        addressProvinceOptions = []
        addressCommuneOptionsByProvince = {}
        throw err
      })
      .finally(() => { addressKitLoadingPromise = null })
  }
  return addressKitLoadingPromise
}

async function fetchAddressCommunesByProvince(provinceCode) {
  const code = String(provinceCode || '').trim()
  if (!code) return []
  if (Array.isArray(addressCommuneOptionsByProvince[code])) return addressCommuneOptionsByProvince[code]
  const res = await axios.get('/api/address/provinces/' + encodeURIComponent(code) + '/communes', {
    params: { effectiveDate: ADDRESS_EFFECTIVE_DATE }
  })
  const list = Array.isArray(res.data?.data) ? res.data.data : []
  const safeList = list.filter((item) => item && item.code && item.name)
  addressCommuneOptionsByProvince[code] = safeList
  return safeList
}

function syncAddressFullText(scope) {
  const ids = getAddressScopeElements(scope)
  const provinceEl = document.getElementById(ids.provinceId)
  const communeEl = document.getElementById(ids.communeId)
  const detailEl = document.getElementById(ids.detailId)
  const fullAddressEl = document.getElementById(ids.fullAddressId)
  if (!fullAddressEl) return ''

  const provinceName = getSelectedAddressOptionText(provinceEl)
  const communeName = getSelectedAddressOptionText(communeEl)
  const detail = String(detailEl?.value || '').trim()
  const fullParts = [detail, communeName, provinceName].filter(Boolean)
  const fullAddress = fullParts.join(', ')
  fullAddressEl.value = fullAddress
  if (!addressAutoFillInProgress) {
    const provinceCode = String(provinceEl?.value || '').trim()
    const communeCode = String(communeEl?.value || '').trim()
    if (provinceCode && communeCode && detail && fullAddress) {
      saveAddressPreference({ provinceCode, communeCode, detail })
    }
  }
  return fullAddress
}

function resetAddressScope(scope) {
  const ids = getAddressScopeElements(scope)
  const provinceEl = document.getElementById(ids.provinceId)
  const communeEl = document.getElementById(ids.communeId)
  const detailEl = document.getElementById(ids.detailId)
  const fullAddressEl = document.getElementById(ids.fullAddressId)
  addressDropdownSearchState[scope + ':province'] = ''
  addressDropdownSearchState[scope + ':commune'] = ''
  renderProvinceOptionsForScope(scope)
  if (provinceEl) provinceEl.value = ''
  if (communeEl) setAddressSelectOptions(communeEl, [], 'Chọn phường/xã')
  renderAddressDropdownList(scope, 'province', '')
  renderAddressDropdownList(scope, 'commune', '')
  if (detailEl) detailEl.value = ''
  if (fullAddressEl) fullAddressEl.value = ''
}

async function onAddressProvinceChange(scope) {
  const ids = getAddressScopeElements(scope)
  const provinceEl = document.getElementById(ids.provinceId)
  const communeEl = document.getElementById(ids.communeId)
  const selectedCode = String(provinceEl?.value || '').trim()
  addressDropdownSearchState[scope + ':commune'] = ''
  setAddressSelectOptions(communeEl, [], selectedCode ? 'Đang tải phường/xã...' : 'Chọn phường/xã')
  renderAddressDropdownList(scope, 'commune', '')
  if (!selectedCode) {
    renderCommuneOptionsForScope(scope)
    syncAddressFullText(scope)
    if (scope === 'ck') clearCheckoutError(ids.fieldId)
    else clearFieldError(ids.fieldId)
    return
  }
  try {
    await fetchAddressCommunesByProvince(selectedCode)
    renderCommuneOptionsForScope(scope)
  } catch (_) {
    setAddressSelectOptions(communeEl, [], 'Không tải được phường/xã')
    showToast('Không tải được danh sách phường/xã. Vui lòng thử lại.', 'error', 4500)
  }
  syncAddressFullText(scope)
  if (scope === 'ck') clearCheckoutError(ids.fieldId)
  else clearFieldError(ids.fieldId)
}

function onAddressCommuneChange(scope) {
  syncAddressFullText(scope)
  renderAddressDropdownList(scope, 'commune', '')
  const ids = getAddressScopeElements(scope)
  if (scope === 'ck') clearCheckoutError(ids.fieldId)
  else clearFieldError(ids.fieldId)
}

function onAddressDropdownSearchInput(scope, type) {
  const dIds = getAddressDropdownIds(scope, type)
  const searchEl = document.getElementById(dIds.searchId)
  const keyword = String(searchEl?.value || '')
  addressDropdownSearchState[scope + ':' + type] = keyword
  if (type === 'province') renderProvinceOptionsForScope(scope, keyword)
  else renderCommuneOptionsForScope(scope, keyword)
}

function selectAddressDropdownOption(scope, type, code) {
  const ids = getAddressScopeElements(scope)
  const selectEl = document.getElementById(type === 'province' ? ids.provinceId : ids.communeId)
  if (!selectEl) return
  selectEl.value = String(code || '')
  const dIds = getAddressDropdownIds(scope, type)
  const searchEl = document.getElementById(dIds.searchId)
  if (searchEl) searchEl.value = ''
  addressDropdownSearchState[scope + ':' + type] = ''
  closeAddressDropdown(scope, type)
  if (type === 'province') onAddressProvinceChange(scope)
  else onAddressCommuneChange(scope)
}

function toggleAddressDropdown(scope, type) {
  const dIds = getAddressDropdownIds(scope, type)
  const menuEl = document.getElementById(dIds.menuId)
  const searchEl = document.getElementById(dIds.searchId)
  if (!menuEl) return
  const willOpen = menuEl.classList.contains('hidden')
  closeAllAddressDropdowns()
  if (!willOpen) return
  menuEl.classList.remove('hidden')
  if (searchEl) {
    searchEl.value = ''
    setTimeout(() => searchEl.focus(), 0)
  }
  addressDropdownSearchState[scope + ':' + type] = ''
  if (type === 'province') renderProvinceOptionsForScope(scope, '')
  else renderCommuneOptionsForScope(scope, '')
}

function bindAddressSearchableDropdowns() {
  document.addEventListener('click', (e) => {
    const target = e.target
    if (!target) return
    const inDropdown = target.closest && target.closest('#orderProvinceDropdown, #orderCommuneDropdown, #ckProvinceDropdown, #ckCommuneDropdown')
    if (!inDropdown) closeAllAddressDropdowns()
  })
}

async function applySavedAddressToScope(scope) {
  resetAddressScope(scope)
  const saved = loadAddressPreference()
  if (!saved) return
  const ids = getAddressScopeElements(scope)
  const provinceEl = document.getElementById(ids.provinceId)
  const communeEl = document.getElementById(ids.communeId)
  const detailEl = document.getElementById(ids.detailId)
  if (!provinceEl || !communeEl || !detailEl) return
  const hasProvince = addressProvinceOptions.some((item) => String(item.code) === saved.provinceCode)
  if (!hasProvince) return
  addressAutoFillInProgress = true
  try {
    provinceEl.value = saved.provinceCode
    await onAddressProvinceChange(scope)
    const communes = addressCommuneOptionsByProvince[saved.provinceCode] || []
    if (communes.some((item) => String(item.code) === saved.communeCode)) {
      communeEl.value = saved.communeCode
    }
    detailEl.value = saved.detail
    syncAddressFullText(scope)
  } finally {
    addressAutoFillInProgress = false
  }
}

function getAddressPayload(scope) {
  const ids = getAddressScopeElements(scope)
  const provinceEl = document.getElementById(ids.provinceId)
  const communeEl = document.getElementById(ids.communeId)
  const detailEl = document.getElementById(ids.detailId)
  const provinceCode = String(provinceEl?.value || '').trim()
  const communeCode = String(communeEl?.value || '').trim()
  const detail = String(detailEl?.value || '').trim()
  const address = syncAddressFullText(scope)
  return {
    address,
    valid: !!(provinceCode && communeCode && detail && address),
    provinceCode,
    communeCode,
    detail
  }
}

function resolveCartStorageKey() {
  if (isAdminUser) return 'qhclothes_cart_admin'
  const uid = Number(currentUser?.userId || currentUser?.id || 0)
  if (uid > 0) return 'qhclothes_cart_user_' + uid
  return 'qhclothes_cart_guest'
}

function syncCartScope(force = false) {
  const nextKey = resolveCartStorageKey()
  if (!force && nextKey === cartStorageKey) return
  cartStorageKey = nextKey
  loadCart(true)
  const overlay = document.getElementById('cartOverlay')
  if (overlay && !overlay.classList.contains('hidden')) {
    renderCartStep1()
  }
}

function loadCart(useCurrentScope = false) {
  if (!useCurrentScope) cartStorageKey = resolveCartStorageKey()
  try { cart = JSON.parse(localStorage.getItem(cartStorageKey) || '[]') } catch { cart = [] }
  updateCartBadge()
}
function saveCart() {
  localStorage.setItem(cartStorageKey, JSON.stringify(cart))
  updateCartBadge()
}
function updateCartBadge() {
  const total = cart.reduce((s,i)=>s+i.qty,0)
  const badge = document.getElementById('cartBadge')
  if (!badge) return
  if (total > 0) {
    badge.textContent = total > 99 ? '99+' : total
    badge.classList.remove('hidden')
    badge.classList.add('flex')
    badge.classList.add('cart-badge-bounce')
    setTimeout(()=>badge.classList.remove('cart-badge-bounce'),400)
  } else {
    badge.classList.add('hidden')
    badge.classList.remove('flex')
  }
}
function genCartId() { return Date.now().toString(36)+Math.random().toString(36).slice(2,7) }

function addToCart(product, color, size, qty) {
  // check duplicate: same productId + color + size
  const exist = cart.find(i=>i.productId===product.id && i.color===color && i.size===size)
  if (exist) {
    exist.qty = Math.min(99, exist.qty + qty)
  } else {
    cart.push({
      cartId: genCartId(),
      productId: product.id,
      name: product.name,
      sku: product.sku || ('SKU-'+String(product.id).padStart(4,'0')),
      thumbnail: product.thumbnail || 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400',
      price: product.price,
      color,
      colorImage: getSelectedColorImageFromProduct(product, color),
      size, qty,
      checked: true
    })
  }
  saveCart()
}

// ── INIT ──────────────────────────────────────────
async function loadProducts() {
  try {
    const res = await axios.get('/api/products')
    allProducts = res.data.data || []
    filteredProducts = [...allProducts]
    renderProducts(filteredProducts)
  } catch(e) {
    document.getElementById('productsGrid').innerHTML = '<div class="col-span-4 text-center text-gray-400 py-12"><i class="fas fa-exclamation-circle text-4xl mb-3"></i><p>Không thể tải sản phẩm</p></div>'
  }
}

function renderProducts(products) {
  const grid = document.getElementById('productsGrid')
  const empty = document.getElementById('emptyState')
  if (!products.length) {
    grid.innerHTML = ''
    empty.classList.remove('hidden')
    return
  }
  empty.classList.add('hidden')
  grid.innerHTML = products.map(p => {
    const colors = getProductColorOptions(p).map((c) => c.name)
    const discount = p.original_price ? Math.round((1 - p.price/p.original_price)*100) : 0
    return \`
    <div class="bg-white rounded-2xl overflow-hidden card-hover shadow-sm border border-gray-100 cursor-pointer" onclick="showDetail(\${p.id})">
      <div class="relative overflow-hidden bg-gray-100">
        <img src="\${p.thumbnail || 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400'}"
          alt="\${p.name}" class="w-full product-img-main" loading="lazy"
          onerror="this.src='https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400'">
        \${discount > 0 ? \`<span class="absolute top-3 left-3 badge-sale text-white text-xs font-bold px-2 py-1 rounded-full">-\${discount}%</span>\` : ''}
        \${p.is_featured ? \`<span class="absolute top-3 right-3 bg-amber-400 text-white text-xs font-bold px-2 py-1 rounded-full">⭐ Hot</span>\` : ''}
        <div class="absolute inset-0 bg-black/0 hover:bg-black/10 transition flex items-center justify-center opacity-0 hover:opacity-100">
          <span class="bg-white/90 text-gray-800 px-3 py-1 rounded-full text-xs font-semibold">Xem chi tiết</span>
        </div>
      </div>
      <div class="p-3 md:p-4">
        \${p.brand ? \`<p class="text-xs text-pink-500 font-medium mb-1">\${p.brand}</p>\` : ''}
        <h3 class="font-semibold text-gray-900 text-sm leading-tight mb-2 line-clamp-2">\${p.name}</h3>
        <div class="flex items-center gap-2 mb-3">
          <span class="text-pink-600 font-bold">\${fmtPrice(p.price)}</span>
          \${p.original_price ? \`<span class="text-gray-400 text-xs line-through">\${fmtPrice(p.original_price)}</span>\` : ''}
        </div>
        \${colors.length > 0 ? \`
        <div class="flex gap-1 mb-3 flex-wrap">
          \${colors.slice(0,4).map(c => \`<span class="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">\${c}</span>\`).join('')}
          \${colors.length > 4 ? \`<span class="text-xs text-gray-400">+\${colors.length-4}</span>\` : ''}
        </div>\` : ''}
        <div class="flex gap-2">
          <button onclick="event.stopPropagation();openOrder(\${p.id})" title="Mua ngay"
            class="btn-primary flex-1 text-white py-2 rounded-xl text-sm font-semibold">
            <i class="fas fa-bolt mr-1"></i>Mua ngay
          </button>
          <button onclick="event.stopPropagation();addToCartFromCard(event, \${p.id})" title="Thêm vào giỏ hàng"
            class="w-10 h-9 flex items-center justify-center bg-gray-800 hover:bg-gray-700 text-white rounded-xl transition group relative">
            <i class="fas fa-shopping-bag text-sm"></i>
          </button>
        </div>
      </div>
    </div>\`
  }).join('')
}

// ── FILTER & SEARCH ────────────────────────────────
function filterProducts(cat, btn) {
  document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'))
  btn.classList.add('active')
  const search = document.getElementById('searchInput').value.toLowerCase()
  filteredProducts = allProducts.filter(p => {
    const matchCat = cat === 'all' || p.category === cat
    const matchSearch = !search || p.name.toLowerCase().includes(search) || (p.brand||'').toLowerCase().includes(search)
    return matchCat && matchSearch
  })
  renderProducts(filteredProducts)
}

function searchProducts(q) {
  const activeCat = document.querySelector('.filter-btn.active')?.dataset.cat || 'all'
  const ql = q.toLowerCase()
  filteredProducts = allProducts.filter(p => {
    const matchCat = activeCat === 'all' || p.category === activeCat
    const matchSearch = !q || p.name.toLowerCase().includes(ql) || (p.brand||'').toLowerCase().includes(ql)
    return matchCat && matchSearch
  })
  renderProducts(filteredProducts)
}

// ── PRODUCT DETAIL ─────────────────────────────────
async function showDetail(id) {
  try {
    const res = await axios.get('/api/products/' + id)
    const p = res.data.data
    const colorOptions = getProductColorOptions(p)
    const colors = colorOptions.map((c) => c.name)
    const sizes = safeJson(p.sizes)
    const images = safeJson(p.images)
    const discount = p.original_price ? Math.round((1 - p.price/p.original_price)*100) : 0
    document.getElementById('detailContent').innerHTML = \`
    <div class="grid md:grid-cols-2 gap-6">
      <div>
        <img id="mainDetailImg" src="\${p.thumbnail || images[0] || ''}" alt="\${p.name}" class="w-full rounded-2xl h-80 object-cover mb-3">
        <div class="img-gallery grid grid-cols-4 gap-2">
          \${[p.thumbnail, ...images].filter((v,i,a)=>v&&a.indexOf(v)===i).slice(0,8).map(img => \`
          <img src="\${img}" alt="" class="w-full h-16 object-cover rounded-lg border-2 border-transparent hover:border-pink-400"
            onclick="document.getElementById('mainDetailImg').src='\${img}'">\`).join('')}
        </div>
      </div>
      <div>
        \${p.brand ? \`<p class="text-sm text-pink-500 font-medium mb-1">\${p.brand}</p>\` : ''}
        <h2 class="font-display text-2xl font-bold text-gray-900 mb-3">\${p.name}</h2>
        <div class="flex items-baseline gap-3 mb-4">
          <span class="text-3xl font-bold text-pink-600">\${fmtPrice(p.price)}</span>
          \${p.original_price ? \`<span class="text-gray-400 line-through">\${fmtPrice(p.original_price)}</span><span class="badge-sale text-white text-xs px-2 py-1 rounded-full">-\${discount}%</span>\` : ''}
        </div>
        \${p.description ? \`<p class="text-gray-600 text-sm leading-relaxed mb-4">\${p.description}</p>\` : ''}
        \${p.material ? \`<p class="text-sm text-gray-500 mb-4"><strong>Chất liệu:</strong> \${p.material}</p>\` : ''}
        \${colors.length ? \`
        <div class="mb-4">
          <p class="text-sm font-semibold mb-2">Màu sắc: <span class="text-pink-500" id="detailColorLabel"></span></p>
          <div class="flex flex-wrap gap-2">
            \${colors.map(c => \`<button class="px-3 py-1.5 border rounded-lg text-sm hover:border-pink-400 hover:text-pink-600 transition" onclick="selectDetailColor('\${c}',this)">\${c}</button>\`).join('')}
          </div>
        </div>\` : ''}
        \${sizes.length ? \`
        <div class="mb-6">
          <p class="text-sm font-semibold mb-2">Size:</p>
          <div class="flex flex-wrap gap-2">
            \${sizes.map(s => \`<button class="size-btn w-12 h-10 border rounded-lg text-sm font-medium hover:border-pink-400 transition" onclick="selectDetailSize('\${s}',this)">\${s}</button>\`).join('')}
          </div>
        </div>\` : ''}
        <button onclick="closeDetail();collapseBanners();openOrder(\${p.id})" class="btn-primary w-full text-white py-3.5 rounded-xl font-bold text-base">
          <i class="fas fa-shopping-cart mr-2"></i>Đặt hàng ngay
        </button>
      </div>
    </div>\`
    document.getElementById('detailOverlay').classList.remove('hidden')
  } catch(e) { showToast('Không thể tải chi tiết sản phẩm', 'error') }
}

function selectDetailColor(c, btn) {
  btn.closest('.flex').querySelectorAll('button').forEach(b => b.classList.remove('bg-pink-50','border-pink-400','text-pink-600'))
  btn.classList.add('bg-pink-50','border-pink-400','text-pink-600')
  document.getElementById('detailColorLabel').textContent = c
}
function selectDetailSize(s, btn) {
  btn.closest('.flex').querySelectorAll('button').forEach(b => b.classList.remove('active','bg-gray-900','text-white'))
  btn.classList.add('active','bg-gray-900','text-white')
}
function closeDetail() { document.getElementById('detailOverlay').classList.add('hidden') }

// ── ORDER POPUP ────────────────────────────────────
async function openOrder(id) {
  try {
    await ensureAddressKitReady()
    const res = await axios.get('/api/products/' + id)
    currentProduct = res.data.data
    orderQty = 1
    selectedColor = ''
    selectedColorImage = String(currentProduct.thumbnail || 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400')
    selectedSize = ''
    selectedPaymentMethod = ''
    appliedVoucher = null

    document.getElementById('orderProductImg').src = selectedColorImage
    document.getElementById('orderProductName').textContent = currentProduct.name
    document.getElementById('orderProductPrice').textContent = fmtPrice(currentProduct.price)
    document.getElementById('qtyDisplay').textContent = '1'
    document.getElementById('orderName').value = ''
    document.getElementById('orderPhone').value = ''
    await applySavedAddressToScope('order')
    document.getElementById('orderNote').value = ''
    document.getElementById('orderVoucher').value = ''
    document.getElementById('voucherStatus').classList.add('hidden')
    document.getElementById('discountRow').classList.add('hidden')
    document.getElementById('subtotalRow').classList.add('hidden')
    document.querySelectorAll('.payment-method-btn').forEach(b => b.classList.remove('active','border-pink-500','bg-pink-50'))
    // Clear field errors
    ;['fieldName','fieldPhone','fieldAddress','fieldColor','fieldPaymentMethod'].forEach(id => {
      document.getElementById(id)?.classList.remove('field-error','shake')
    })
    updateOrderTotal()

    // Colors
    const colorOptions = getProductColorOptions(currentProduct)
    orderColorOptions = Array.isArray(colorOptions) ? colorOptions : []
    const colorDiv = document.getElementById('colorOptions')
    colorDiv.innerHTML = orderColorOptions.length ? orderColorOptions.map((item, idx) => \`
      <button class="color-btn px-3 py-1.5 border rounded-lg text-sm hover:border-pink-400 transition inline-flex items-center gap-2"
        onclick="selectOrderColorByIndex(\${idx}, this)">
        \${item.image ? \`<img src="\${item.image}" alt="" class="w-5 h-5 rounded-md object-cover border border-gray-200">\` : '<span class="w-5 h-5 rounded-md bg-gray-100 border border-gray-200"></span>'}
        <span>\${item.name}</span>
      </button>
    \`).join('') : '<p class="text-gray-400 text-sm">Không có lựa chọn màu</p>'

    // Sizes
    const sizes = safeJson(currentProduct.sizes)
    const sizeDiv = document.getElementById('sizeOptions')
    sizeDiv.innerHTML = sizes.length ? sizes.map(s => \`
      <button class="size-btn px-3 py-1.5 border rounded-lg text-sm font-medium hover:border-pink-400 transition" onclick="selectOrderSize('\${s}',this)">\${s}</button>
    \`).join('') : '<p class="text-gray-400 text-sm">Không có size</p>'
    document.getElementById('sizeSection').style.display = sizes.length ? '' : 'none'

    document.getElementById('orderOverlay').classList.remove('hidden')
    document.body.style.overflow = 'hidden'
  } catch(e) { showToast('Lỗi khi tải sản phẩm', 'error') }
}

function selectOrderColor(c, colorImage, btn) {
  document.querySelectorAll('.color-btn').forEach(b => b.classList.remove('active','bg-pink-50','border-pink-400','text-pink-600'))
  btn.classList.add('active','bg-pink-50','border-pink-400','text-pink-600')
  selectedColor = c
  selectedColorImage = String(colorImage || '').trim() || getSelectedColorImageFromProduct(currentProduct, c) || (currentProduct?.thumbnail || '')
  const preview = document.getElementById('orderProductImg')
  if (preview && selectedColorImage) preview.src = selectedColorImage
  document.getElementById('fieldColor')?.classList.remove('field-error','shake')
}

function selectOrderColorByIndex(idx, btn) {
  const item = Array.isArray(orderColorOptions) ? orderColorOptions[idx] : null
  if (!item) return
  selectOrderColor(String(item.name || ''), String(item.image || ''), btn)
}
function selectOrderSize(s, btn) {
  document.querySelectorAll('.size-btn').forEach(b => b.classList.remove('active','bg-gray-900','text-white','border-gray-900'))
  btn.classList.add('active','bg-gray-900','text-white','border-gray-900')
  selectedSize = s
}
function selectPaymentMethod(method, btn) {
  document.querySelectorAll('.payment-method-btn').forEach(b => b.classList.remove('active','border-pink-500','bg-pink-50'))
  btn.classList.add('active','border-pink-500','bg-pink-50')
  selectedPaymentMethod = method
  document.getElementById('fieldPaymentMethod')?.classList.remove('field-error','shake')
}
function isPopupTabAlive(tab) {
  try { return !!(tab && !tab.closed) } catch (_) { return false }
}
function openOrReuseZaloPayLinkTab() {
  if (isPopupTabAlive(zaloPayLinkTab)) {
    try { zaloPayLinkTab.focus() } catch (_) { }
    return zaloPayLinkTab
  }
  let tab = null
  try { tab = window.open('https://zalopay.vn/', '_blank') } catch (_) { tab = null }
  zaloPayLinkTab = tab
  return tab
}

async function ensureZaloPayConfigReady(showMessage) {
  try {
    const res = await axios.get('/api/payments/zalopay/config')
    const ready = !!res.data?.data?.ready
    const missing = Array.isArray(res.data?.data?.missing) ? res.data.data.missing : []
    if (ready) return { ready: true, missing: [] }
    if (showMessage) {
      const detail = missing.length ? (': ' + missing.join(', ')) : ''
      showToast('ZaloPay chua cau hinh day du' + detail, 'error', 5500)
    }
    return { ready: false, missing }
  } catch (_) {
    if (showMessage) showToast('Khong kiem tra duoc cau hinh ZaloPay. Thu lai sau.', 'error', 5000)
    return { ready: false, missing: [] }
  }
}

function openZaloPayLink(evt) {
  if (evt) {
    evt.preventDefault()
    evt.stopPropagation()
  }
  const zaloBtn = Array.from(document.querySelectorAll('.payment-method-btn')).find(function (btn) {
    return String(btn.getAttribute('onclick') || '').indexOf("'ZALOPAY'") >= 0
  })
  if (zaloBtn) selectPaymentMethod('ZALOPAY', zaloBtn)
  const tab = openOrReuseZaloPayLinkTab()
  if (tab) {
    showToast('Da mo ZaloPay. Bam Dat ngay de tao QR thanh toan.', 'success', 4500)
    return
  }
  const fallback = window.open('https://zalopay.vn/', '_blank')
  if (fallback) {
    showToast('Da mo trang ZaloPay.', 'success', 3500)
  } else {
    showToast('Trinh duyet dang chan popup, hay cho phep popup roi thu lai.', 'error', 4000)
  }
}
function changeQty(d) {
  orderQty = Math.max(1, Math.min(99, orderQty + d))
  document.getElementById('qtyDisplay').textContent = orderQty
  updateOrderTotal()
}
function updateOrderTotal() {
  if (!currentProduct) return
  const subtotal = currentProduct.price * orderQty
  const discount = appliedVoucher ? appliedVoucher.discount_amount : 0
  const total = Math.max(0, subtotal - discount)
  document.getElementById('orderTotal').textContent = fmtPrice(total)
  if (appliedVoucher) {
    document.getElementById('orderSubtotal').textContent = fmtPrice(subtotal)
    document.getElementById('orderDiscount').textContent = '-' + fmtPrice(discount)
    document.getElementById('subtotalRow').classList.remove('hidden')
    document.getElementById('discountRow').classList.remove('hidden')
  } else {
    document.getElementById('subtotalRow').classList.add('hidden')
    document.getElementById('discountRow').classList.add('hidden')
  }
}
function closeOrder() {
  document.getElementById('orderOverlay').classList.add('hidden')
  document.body.style.overflow = ''
}

function resolveFlyImage(product) {
  if (!product) return 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=200'
  const imgs = safeJson(product.images)
  return product.thumbnail || imgs[0] || 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=200'
}

function animateFlyToCart(imgUrl, sourceEl) {
  const cartBtn = document.getElementById('cartNavBtn')
  if (!cartBtn) return
  const flyImg = imgUrl || 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=200'
  const fromRect = sourceEl ? sourceEl.getBoundingClientRect() : null
  const toRect = cartBtn.getBoundingClientRect()

  const chip = document.createElement('div')
  chip.className = 'cart-fly-chip'
  const startX = fromRect ? (fromRect.left + fromRect.width / 2 - 21) : (window.innerWidth / 2 - 21)
  const startY = fromRect ? (fromRect.top + fromRect.height / 2 - 21) : (window.innerHeight / 2 - 21)
  chip.style.left = startX + 'px'
  chip.style.top = startY + 'px'

  const img = document.createElement('img')
  img.src = flyImg
  img.onerror = () => { img.src = 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=200' }
  chip.appendChild(img)
  document.body.appendChild(chip)

  requestAnimationFrame(() => {
    const endX = toRect.left + toRect.width / 2 - 21
    const endY = toRect.top + toRect.height / 2 - 21
    chip.style.transform = 'translate(' + (endX - startX) + 'px, ' + (endY - startY) + 'px) scale(0.35)'
    chip.style.opacity = '0.1'
  })

  setTimeout(() => chip.remove(), 760)
}

// Add to cart from product card – always add directly, pick first color/size as default
async function addToCartFromCard(evt, id) {
  try {
    const res = await axios.get('/api/products/' + id)
    const p = res.data.data
    const colors = getProductColorOptions(p).map((c) => c.name)
    const sizes = safeJson(p.sizes)
    const color = colors.length > 0 ? colors[0] : ''
    const size = sizes.length > 0 ? sizes[0] : ''
    animateFlyToCart(resolveFlyImage(p), evt?.currentTarget || evt?.target || null)
    addToCart(p, color, size, 1)
    showToast('Đã thêm "' + p.name + '" vào giỏ hàng!', 'success', 2500)
  } catch(e) { showToast('Lỗi khi thêm vào giỏ', 'error') }
}

// ── VOUCHER ────────────────────────────────────────
async function applyVoucher() {
  const code = document.getElementById('orderVoucher').value.trim().toUpperCase()
  const statusEl = document.getElementById('voucherStatus')
  const btn = document.getElementById('voucherBtn')
  
  if (!code) {
    statusEl.className = 'mt-2 voucher-error rounded-xl px-3 py-2 text-sm text-red-600 font-medium'
    statusEl.innerHTML = '<i class="fas fa-times-circle mr-1"></i>Vui lòng nhập mã voucher'
    statusEl.classList.remove('hidden')
    return
  }
  
  btn.disabled = true
  btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>'
  statusEl.classList.add('hidden')
  
  try {
    const res = await axios.post('/api/vouchers/validate', { code })
    appliedVoucher = res.data.data
    statusEl.className = 'mt-2 voucher-success rounded-xl px-3 py-2 text-sm text-green-700 font-semibold flex items-center gap-2'
    statusEl.innerHTML = \`<i class="fas fa-check-circle text-green-500"></i>Áp dụng thành công! Giảm <strong>\${fmtPrice(appliedVoucher.discount_amount)}</strong>\`
    statusEl.classList.remove('hidden')
    updateOrderTotal()
    document.getElementById('orderVoucher').classList.add('border-green-400','bg-green-50')
  } catch(err) {
    appliedVoucher = null
    const errCode = err.response?.data?.error
    const msg = errCode === 'VOUCHER_LIMIT' ? 'Voucher đã hết lượt sử dụng'
              : errCode === 'INVALID_VOUCHER' ? 'Mã không hợp lệ hoặc đã hết hạn'
              : 'Không thể áp dụng mã này'
    statusEl.className = 'mt-2 voucher-error rounded-xl px-3 py-2 text-sm text-red-600 font-medium flex items-center gap-1'
    statusEl.innerHTML = \`<i class="fas fa-times-circle mr-1"></i>\${msg}\`
    statusEl.classList.remove('hidden')
    document.getElementById('orderVoucher').classList.remove('border-green-400','bg-green-50')
    updateOrderTotal()
  } finally {
    btn.disabled = false
    btn.innerHTML = appliedVoucher ? '<i class="fas fa-check mr-1"></i>Đã áp dụng' : 'Áp dụng'
    if (appliedVoucher) btn.classList.replace('bg-gray-800','bg-green-600')
    else btn.className = 'px-4 py-2.5 bg-gray-800 hover:bg-gray-700 text-white rounded-xl text-sm font-semibold transition whitespace-nowrap'
  }
}

// ── VALIDATION SHAKE + SCROLL ─────────────────────
function shakeField(fieldId) {
  const el = document.getElementById(fieldId)
  if (!el) return
  el.classList.add('field-error')
  el.classList.remove('shake')
  void el.offsetWidth  // reflow to restart animation
  el.classList.add('shake')
  // Scroll to field inside popup
  el.scrollIntoView({ behavior: 'smooth', block: 'center' })
  setTimeout(() => el.classList.remove('shake'), 600)
}
function clearFieldError(fieldId) {
  document.getElementById(fieldId)?.classList.remove('field-error')
}

// ── SUBMIT ORDER ───────────────────────────────────
async function submitOrder() {
  const name = document.getElementById('orderName').value.trim()
  const phone = document.getElementById('orderPhone').value.trim()
  const addressPayload = getAddressPayload('order')
  const address = addressPayload.address

  // Validate with shake + scroll
  if (!name) { shakeField('fieldName'); return }
  clearFieldError('fieldName')
  if (!phone || !/^[0-9]{9,11}$/.test(phone.replace(/\\s/g,''))) { shakeField('fieldPhone'); return }
  clearFieldError('fieldPhone')
  if (!addressPayload.valid) { shakeField('fieldAddress'); return }
  clearFieldError('fieldAddress')
  if (!selectedPaymentMethod) { shakeField('fieldPaymentMethod'); return }
  clearFieldError('fieldPaymentMethod')
  if (selectedPaymentMethod === 'ZALOPAY') {
    const check = await ensureZaloPayConfigReady(true)
    if (!check.ready) return
  }

  const btn = document.getElementById('submitOrderBtn')
  btn.disabled = true
  btn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Đang xử lý...'
  let payTabRef = null
  if (selectedPaymentMethod === 'BANK_TRANSFER') {
    try { payTabRef = window.open('about:blank', '_blank') } catch (_) { payTabRef = null }
  } else if (selectedPaymentMethod === 'ZALOPAY') {
    payTabRef = openOrReuseZaloPayLinkTab()
    if (!payTabRef) {
      try { payTabRef = window.open('about:blank', '_blank') } catch (_) { payTabRef = null }
    }
  }

  try {
    const resolvedColorImage = getSelectedColorImageFromProduct(currentProduct, selectedColor)
    const res = await axios.post('/api/orders', {
      customer_name: name,
      customer_phone: phone,
      customer_address: address,
      product_id: currentProduct.id,
      color: selectedColor,
      selected_color_image: resolvedColorImage || selectedColorImage || (currentProduct?.thumbnail || ''),
      size: selectedSize,
      quantity: orderQty,
      voucher_code: appliedVoucher ? appliedVoucher.code : '',
      note: document.getElementById('orderNote').value.trim(),
      payment_method: selectedPaymentMethod
    })
    closeOrder()
    const orderCode = res.data.order_code
    const orderTotal = Number(res.data.total || 0)
    const orderId = Number(res.data.id || 0)
    if (selectedPaymentMethod === 'BANK_TRANSFER') {
      let payosData = null
      try {
        const payos = await axios.post('/api/orders/' + orderId + '/payos-link', { origin: window.location.origin })
        payosData = payos.data?.data || null
      } catch (_) {
        showToast('PayOS tạm lỗi, đang chuyển sang QR dự phòng.', 'error', 4500)
      }
      if (payosData?.alreadyPaid) {
        onOrderMarkedPaid(orderCode)
        showToast('Đơn ' + orderCode + ' đã được thanh toán trước đó.', 'success', 4500)
        return
      }
      const checkoutUrl = String(payosData?.checkoutUrl || '').trim()
      if (checkoutUrl) {
        let payTab = payTabRef
        if (payTab) {
          try { payTab.location.href = checkoutUrl } catch (_) { payTab = null }
        }
        if (!payTab) payTab = window.open(checkoutUrl, '_blank')
        if (payTab) {
          startOrderPaymentPolling(orderCode)
          showToast(\`Đơn \${orderCode}: đã mở tab PayOS, vui lòng hoàn tất thanh toán.\`, 'success', 5000)
        } else {
          showToast('Trình duyệt đang chặn popup, hiển thị QR dự phòng để bạn thanh toán thủ công.', 'error', 5000)
          openOrderBankTransferModal({
            orderCode,
            orderId,
            amount: orderTotal,
            transferContent: 'DH' + orderId,
            paymentLinkId: payosData?.paymentLinkId || ''
          })
        }
      } else {
        try { if (payTabRef && !payTabRef.closed) payTabRef.close() } catch (_) { }
        openOrderBankTransferModal({
          orderCode,
          orderId,
          amount: orderTotal,
          transferContent: 'DH' + orderId,
          paymentLinkId: payosData?.paymentLinkId || ''
        })
        showToast(\`Đơn hàng \${orderCode} đã tạo. Vui lòng chuyển khoản để hoàn tất.\`, 'success', 5000)
      }
    } else if (selectedPaymentMethod === 'ZALOPAY') {
      let zaloData = null
      try {
        const zalo = await axios.post('/api/orders/' + orderId + '/zalopay-link', { origin: window.location.origin })
        zaloData = zalo.data?.data || null
      } catch (err) {
        const errCode = err.response?.data?.error
        const missing = Array.isArray(err.response?.data?.missing) ? err.response.data.missing : []
        if (errCode === 'ZALOPAY_CONFIG_MISSING') {
          const detail = missing.length ? (': ' + missing.join(', ')) : ''
          showToast('ZaloPay chua cau hinh day du' + detail, 'error', 5500)
        } else {
          showToast('ZaloPay tam loi, vui long thu lai sau it phut.', 'error', 4500)
        }
      }

      if (zaloData?.alreadyPaid) {
        onOrderMarkedPaid(orderCode)
        showToast('Đơn ' + orderCode + ' đã được thanh toán trước đó.', 'success', 4500)
        return
      }

      const checkoutUrl = String(zaloData?.orderUrl || '').trim()
      if (!checkoutUrl) {
        try { if (payTabRef && !payTabRef.closed) payTabRef.close() } catch (_) { }
        showToast('Không tạo được liên kết thanh toán ZaloPay.', 'error', 4500)
        return
      }

      let payTab = payTabRef
      if (payTab) {
        try { payTab.location.href = checkoutUrl } catch (_) { payTab = null }
      }
      if (!payTab) payTab = window.open(checkoutUrl, '_blank')

      if (payTab) {
        zaloPayLinkTab = payTab
        startOrderPaymentPolling(orderCode)
        showToast(\`Đơn \${orderCode}: đã mở tab ZaloPay, vui lòng quét QR để thanh toán.\`, 'success', 5000)
      } else {
        // Fallback: popup bị chặn, điều hướng luôn tại tab hiện tại
        startOrderPaymentPolling(orderCode)
        window.location.href = checkoutUrl
      }
    } else {
      showToast(\`🎉 Đặt hàng thành công! Mã đơn: \${orderCode}\`, 'success', 5000)
    }
  } catch(e) {
    try { if (payTabRef && !payTabRef.closed) payTabRef.close() } catch (_) { }
    const errCode = e.response?.data?.error
    if (errCode === 'INVALID_VOUCHER' || errCode === 'VOUCHER_LIMIT') {
      showToast('Voucher không còn hiệu lực, vui lòng thử lại', 'error')
      appliedVoucher = null
      updateOrderTotal()
      document.getElementById('voucherBtn').innerHTML = 'Áp dụng'
      document.getElementById('voucherBtn').className = 'px-4 py-2.5 bg-gray-800 hover:bg-gray-700 text-white rounded-xl text-sm font-semibold transition whitespace-nowrap'
    } else if (errCode === 'ZALOPAY_CONFIG_MISSING') {
      const missing = Array.isArray(e.response?.data?.missing) ? e.response.data.missing : []
      const detail = missing.length ? (': ' + missing.join(', ')) : ''
      showToast('ZaloPay chua cau hinh day du' + detail, 'error', 5500)
    } else {
      showToast('Đặt hàng thất bại, thử lại sau', 'error')
    }
  } finally {
    btn.disabled = false
    btn.innerHTML = '<i class="fas fa-shopping-cart mr-2"></i>Đặt hàng ngay'
  }
}

// Add current product from order popup to cart
function addCurrentToCart() {
  if (!currentProduct) return
  animateFlyToCart(resolveFlyImage(currentProduct), document.getElementById('addToCartBtn'))
  addToCart(currentProduct, selectedColor, selectedSize, orderQty)
  closeOrder()
  showToast('Da them "' + currentProduct.name + '" vao gio hang!', 'success', 2500)
}

// ── UTILS ──────────────────────────────────────────
function fmtPrice(p) { return new Intl.NumberFormat('vi-VN',{style:'currency',currency:'VND'}).format(p) }
function safeJson(v) { try { return JSON.parse(v||'[]') } catch { return [] } }
function normalizeColorOptions(raw) {
  const arr = Array.isArray(raw) ? raw : safeJson(raw)
  if (!Array.isArray(arr)) return []
  return arr.map((item) => {
    if (typeof item === 'string') return { name: String(item || '').trim(), image: '' }
    if (item && typeof item === 'object') {
      return {
        name: String(item.name || item.label || '').trim(),
        image: String(item.image || item.image_url || '').trim()
      }
    }
    return { name: '', image: '' }
  }).filter((c) => c.name || c.image)
}
function getProductColorOptions(product) {
  if (!product) return []
  const direct = Array.isArray(product.color_options) ? product.color_options : null
  if (direct && direct.length) return normalizeColorOptions(direct)
  return normalizeColorOptions(product.colors || [])
}
function getColorNames(raw) {
  const arr = Array.isArray(raw) ? raw : safeJson(raw)
  if (!Array.isArray(arr)) return []
  return arr.map((item) => {
    if (typeof item === 'string') return String(item || '').trim()
    if (item && typeof item === 'object') return String(item.name || item.label || '').trim()
    return ''
  }).filter(Boolean)
}
function getSelectedColorImageFromProduct(product, selectedColor) {
  const color = String(selectedColor || '').trim().toLowerCase()
  if (!color) return String(product?.thumbnail || '').trim()
  const colors = getProductColorOptions(product)
  const matched =
    colors.find((item) => String(item.name || '').trim().toLowerCase() === color) ||
    colors.find((item) => {
      const name = String(item.name || '').trim().toLowerCase()
      return name.includes(color) || color.includes(name)
    })
  if (matched && String(matched.image || '').trim()) return String(matched.image).trim()
  return String(product?.thumbnail || '').trim()
}
window.normalizeColorOptions = normalizeColorOptions
window.getColorNames = getColorNames
function formatPaymentMethod(v) {
  const key = String(v || '').toUpperCase()
  if (key === 'ZALOPAY') return 'ZaloPay'
  if (key === 'MOMO') return 'Ví điện tử MoMo'
  if (key === 'BANK_TRANSFER') return 'Chuyển khoản ngân hàng'
  return 'COD - Thanh toán khi giao'
}
function paymentStatusLabel(v) {
  return String(v || '').toLowerCase() === 'paid' ? 'Đã thanh toán' : 'Chưa thanh toán'
}
function paymentStatusClass(v) {
  return String(v || '').toLowerCase() === 'paid'
    ? 'bg-green-100 text-green-700 border border-green-200'
    : 'bg-amber-100 text-amber-700 border border-amber-200'
}
function getOrderAmountDue(order) {
  if (order && order.amount_due !== undefined && order.amount_due !== null) {
    return Number(order.amount_due || 0)
  }
  return String(order?.payment_status || '').toLowerCase() === 'paid'
    ? 0
    : Number(order?.total_price || 0)
}

function showToast(msg, type='success', duration=3000) {
  const c = document.getElementById('toastContainer')
  const t = document.createElement('div')
  t.className = \`toast px-5 py-3 rounded-2xl shadow-xl text-white text-sm font-medium pointer-events-auto \${type==='error'?'bg-red-500':'bg-green-500'}\`
  t.textContent = msg
  c.appendChild(t)
  setTimeout(() => t.remove(), duration)
}

function toggleMobileMenu() {
  const m = document.getElementById('mobileMenu')
  m.classList.toggle('hidden')
}
// ── CART MODAL ────────────────────────────────────
function openCart() {
  cartStep = 1
  ckAppliedVoucher = null
  renderCartStep1()
  document.getElementById('cartOverlay').classList.remove('hidden')
  document.getElementById('cartStep2').classList.add('hidden')
  document.getElementById('cartStep2').classList.remove('flex')
  document.getElementById('cartStep1').classList.remove('hidden')
  document.getElementById('cartBackBtn').classList.add('hidden')
  document.getElementById('cartTitle').textContent = 'Giỏ hàng'
  document.body.style.overflow = 'hidden'
}
function closeCart() {
  document.getElementById('cartOverlay').classList.add('hidden')
  document.body.style.overflow = ''
}
function handleCartOverlayClick(e) {
  if (e.target.id === 'cartOverlay') closeCart()
}
function cartGoBack() {
  cartStep = 1
  document.getElementById('cartStep2').classList.add('hidden')
  document.getElementById('cartStep2').classList.remove('flex')
  document.getElementById('cartStep1').classList.remove('hidden')
  document.getElementById('cartBackBtn').classList.add('hidden')
  document.getElementById('cartTitle').textContent = 'Giỏ hàng'
  updateCartHeaderSubtitle()
}

function renderCartStep1() {
  const listEl = document.getElementById('cartItemsList')
  const checkAllBar = document.getElementById('cartCheckAllBar')
  const footer = document.getElementById('cartFooter')
  
  if (cart.length === 0) {
    checkAllBar.classList.add('hidden')
    footer.classList.add('hidden')
    listEl.innerHTML = '<div class="flex flex-col items-center justify-center py-20 text-center"><div class="w-24 h-24 rounded-full bg-gray-100 flex items-center justify-center mb-4"><i class="fas fa-shopping-bag text-4xl text-gray-300"></i></div><p class="text-gray-500 font-medium text-lg mb-1">Chua co san pham nao</p><p class="text-gray-400 text-sm">Hay them san pham vao gio hang</p><button onclick="closeCart()" class="mt-6 btn-primary text-white px-6 py-2.5 rounded-full font-semibold text-sm"><i class="fas fa-arrow-left mr-2"></i>Tiep tuc mua sam</button></div>'
    updateCartHeaderSubtitle()
    return
  }

  checkAllBar.classList.remove('hidden')
  footer.classList.remove('hidden')

  // Sync checkAll state
  const allChecked = cart.every(i=>i.checked)
  document.getElementById('checkAll').checked = allChecked

  listEl.innerHTML = cart.map(function(item) {
    const col = (typeof item.color === 'string' && item.color) ? item.color : ''
    const sz = item.size || ''
    const chk = item.checked ? 'checked' : ''
    const colorTag = col ? '<span class="text-xs bg-pink-50 text-pink-600 border border-pink-200 px-2 py-0.5 rounded-full">' + col + '</span>' : ''
    const sizeTag = sz ? '<span class="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">' + sz + '</span>' : ''
    return '<div class="cart-item rounded-xl border border-gray-200 bg-white" data-cart-id="' + item.cartId + '">'
      + '<div class="cart-item-delete-bg cart-del-btn" data-id="' + item.cartId + '"><i class="fas fa-trash"></i></div>'
      + '<div class="cart-item-inner rounded-xl p-3" data-cart-id="' + item.cartId + '">'
      + '<div class="flex gap-3 items-start">'
      + '<div class="flex-shrink-0 pt-1"><input type="checkbox" ' + chk + ' data-toggle-id="' + item.cartId + '" class="cart-chk w-4 h-4 accent-pink-500 cursor-pointer mt-0.5"></div>'
      + '<img src="' + item.thumbnail + '" alt="' + item.name + '" class="w-16 h-20 object-cover rounded-lg flex-shrink-0" onerror="this.src=&quot;https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&quot;">'
      + '<div class="flex-1 min-w-0">'
      + '<p class="font-semibold text-gray-900 text-sm line-clamp-1 mb-0.5">' + item.name + '</p>'
      + '<p class="text-xs text-gray-400 mb-1">' + item.sku + '</p>'
      + '<div class="flex flex-wrap gap-1 mb-2">' + colorTag + sizeTag + '</div>'
      + '<div class="flex items-center justify-between">'
      + '<span class="text-pink-600 font-bold text-sm">' + fmtPrice(item.price) + '</span>'
      + '<div class="flex items-center gap-2">'
      + '<button class="cart-qty-btn w-7 h-7 rounded-full border flex items-center justify-center text-gray-600 hover:border-pink-400 hover:text-pink-500 transition font-bold text-base" data-id="' + item.cartId + '" data-delta="-1">&minus;</button>'
      + '<span class="text-sm font-bold w-6 text-center">' + item.qty + '</span>'
      + '<button class="cart-qty-btn w-7 h-7 rounded-full border flex items-center justify-center text-gray-600 hover:border-pink-400 hover:text-pink-500 transition font-bold text-base" data-id="' + item.cartId + '" data-delta="1">+</button>'
      + '</div></div>'
      + '<p class="text-right text-xs text-gray-400 mt-1">= ' + fmtPrice(item.price * item.qty) + '</p>'
      + '</div></div></div></div>'
  }).join('')

  // Bind events via delegation
  listEl.querySelectorAll('.cart-del-btn').forEach(function(btn) {
    btn.addEventListener('click', function() { removeCartItem(btn.dataset.id) })
  })
  listEl.querySelectorAll('.cart-chk').forEach(function(cb) {
    cb.addEventListener('change', function() { toggleCartItem(cb.dataset.toggleId, cb.checked) })
  })
  listEl.querySelectorAll('.cart-qty-btn').forEach(function(btn) {
    btn.addEventListener('click', function() { changeCartQty(btn.dataset.id, parseInt(btn.dataset.delta)) })
  })

  // Setup swipe-to-delete for each item
  setupSwipeToDelete()
  updateCartSummary()
  updateCartHeaderSubtitle()
}

function updateCartHeaderSubtitle() {
  const total = cart.reduce(function(s,i){return s+i.qty},0)
  document.getElementById('cartSubtitle').textContent = total > 0 ? (total + ' san pham trong gio') : 'Chua co san pham nao'
}

function toggleCheckAll(cb) {
  cart.forEach(i=>i.checked = cb.checked)
  saveCart()
  renderCartStep1()
}
function toggleCartItem(cartId, checked) {
  const item = cart.find(i=>i.cartId===cartId)
  if (item) item.checked = checked
  saveCart()
  updateCartSummary()
  // sync checkAll
  document.getElementById('checkAll').checked = cart.every(i=>i.checked)
}
function updateCartSummary() {
  const checked = cart.filter(i=>i.checked)
  const total = checked.reduce((s,i)=>s+i.price*i.qty,0)
  const count = checked.length
  document.getElementById('cartSelectedItems').textContent = checked.reduce((s,i)=>s+i.qty,0)
  document.getElementById('cartTotalPrice').textContent = fmtPrice(total)
  const deleteBtn = document.getElementById('deleteCheckedBtn')
  const checkoutBtn = document.getElementById('checkoutBtn')
  if (count > 0) {
    deleteBtn.classList.remove('hidden')
    checkoutBtn.disabled = false
  } else {
    deleteBtn.classList.add('hidden')
    checkoutBtn.disabled = true
  }
  document.getElementById('selectedCount').textContent = 'Da chon ' + count
}
function changeCartQty(cartId, delta) {
  const item = cart.find(i=>i.cartId===cartId)
  if (!item) return
  item.qty = Math.max(1, Math.min(99, item.qty + delta))
  saveCart()
  renderCartStep1()
}
function removeCartItem(cartId) {
  cart = cart.filter(i=>i.cartId!==cartId)
  saveCart()
  renderCartStep1()
}
function removeChecked() {
  cart = cart.filter(i=>!i.checked)
  saveCart()
  renderCartStep1()
}

// ── SWIPE TO DELETE ────────────────────────────────
function setupSwipeToDelete() {
  document.querySelectorAll('.cart-item').forEach(itemEl => {
    const inner = itemEl.querySelector('.cart-item-inner')
    if (!inner) return
    let startX = 0, currentX = 0, isDragging = false
    const threshold = 60

    function onStart(e) {
      startX = e.touches ? e.touches[0].clientX : e.clientX
      isDragging = true
    }
    function onMove(e) {
      if (!isDragging) return
      currentX = (e.touches ? e.touches[0].clientX : e.clientX) - startX
      if (currentX < 0) {
        inner.style.transform = 'translateX(' + Math.max(currentX,-80) + 'px)'
      } else {
        inner.style.transform = ''
      }
    }
    function onEnd() {
      if (!isDragging) return
      isDragging = false
      const cartId = inner.dataset.cartId
      if (currentX < -threshold) {
        inner.style.transform = 'translateX(-80px)'
        setTimeout(()=>removeCartItem(cartId),200)
      } else {
        inner.style.transform = ''
      }
      currentX = 0
    }
    inner.addEventListener('touchstart', onStart, {passive:true})
    inner.addEventListener('touchmove', onMove, {passive:true})
    inner.addEventListener('touchend', onEnd)
    inner.addEventListener('mousedown', onStart)
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onEnd)
  })
}

// ── CHECKOUT from CART ────────────────────────────
async function proceedToCheckout() {
  const checked = cart.filter(i=>i.checked)
  if (checked.length === 0) { showToast('Vui lòng chọn ít nhất 1 sản phẩm','error'); return }
  try {
    await ensureAddressKitReady()
  } catch (_) {
    showToast('Không tải được danh mục địa chỉ, vui lòng thử lại.', 'error', 4500)
    return
  }
  // Build summary
  document.getElementById('checkoutSummaryItems').innerHTML = checked.map(function(i){
    return '<div class="flex-shrink-0 w-20 text-center">'
      + '<div class="relative inline-block">'
      + '<img src="' + i.thumbnail + '" class="w-16 h-20 object-cover rounded-xl border-2 border-white shadow" onerror="this.src=&quot;https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&quot;">'
      + '<span class="absolute -top-1 -right-1 w-5 h-5 bg-pink-500 text-white text-xs rounded-full flex items-center justify-center font-bold">' + i.qty + '</span>'
      + '</div><p class="text-xs text-gray-600 mt-1 line-clamp-1">' + i.name + '</p></div>'
  }).join('')
  // reset form
  ;['ckName','ckPhone','ckAddress','ckAddressDetail','ckNote'].forEach(id => { const el=document.getElementById(id); if(el) el.value='' })
  await applySavedAddressToScope('ck')
  ;['ckFieldName','ckFieldPhone','ckFieldAddress'].forEach(id => clearCheckoutError(id))
  ckAppliedVoucher = null
  document.getElementById('ckVoucher').value = ''
  document.getElementById('ckVoucherStatus').classList.add('hidden')
  document.getElementById('ckVoucherBtn').textContent = 'Áp dụng'
  document.getElementById('ckVoucherBtn').className = 'px-4 py-2.5 bg-gray-800 hover:bg-gray-700 text-white rounded-xl text-sm font-semibold transition whitespace-nowrap'
  updateCkTotal()
  // show step2
  cartStep = 2
  document.getElementById('cartStep1').classList.add('hidden')
  document.getElementById('cartStep2').classList.remove('hidden')
  document.getElementById('cartStep2').classList.add('flex')
  document.getElementById('cartBackBtn').classList.remove('hidden')
  document.getElementById('cartTitle').textContent = 'Xác nhận đơn hàng'
  document.getElementById('cartSubtitle').textContent = checked.reduce(function(s,i){return s+i.qty},0) + ' san pham'
}

function updateCkTotal() {
  const checked = cart.filter(i=>i.checked)
  const subtotal = checked.reduce((s,i)=>s+i.price*i.qty,0)
  const discount = ckAppliedVoucher ? ckAppliedVoucher.discount_amount : 0
  const total = Math.max(0, subtotal - discount)
  document.getElementById('ckTotal').textContent = fmtPrice(total)
  if (ckAppliedVoucher) {
    document.getElementById('ckSubtotal').textContent = fmtPrice(subtotal)
    document.getElementById('ckDiscount').textContent = '-'+fmtPrice(discount)
    document.getElementById('ckSubtotalRow').classList.remove('hidden')
    document.getElementById('ckDiscountRow').classList.remove('hidden')
  } else {
    document.getElementById('ckSubtotalRow').classList.add('hidden')
    document.getElementById('ckDiscountRow').classList.add('hidden')
  }
}
async function applyCkVoucher() {
  const code = document.getElementById('ckVoucher').value.trim().toUpperCase()
  const statusEl = document.getElementById('ckVoucherStatus')
  const btn = document.getElementById('ckVoucherBtn')
  if (!code) {
    statusEl.className='mt-2 voucher-error rounded-xl px-3 py-2 text-sm text-red-600 font-medium'
    statusEl.innerHTML='<i class="fas fa-times-circle mr-1"></i>Vui lòng nhập mã voucher'
    statusEl.classList.remove('hidden'); return
  }
  btn.disabled=true; btn.innerHTML='<i class="fas fa-spinner fa-spin"></i>'
  statusEl.classList.add('hidden')
  try {
    const res = await axios.post('/api/vouchers/validate', { code })
    ckAppliedVoucher = res.data.data
    statusEl.className='mt-2 voucher-success rounded-xl px-3 py-2 text-sm text-green-700 font-semibold flex items-center gap-2'
    statusEl.innerHTML='<i class="fas fa-check-circle text-green-500"></i>Ap dung thanh cong! Giam <strong>' + fmtPrice(ckAppliedVoucher.discount_amount) + '</strong>'
    statusEl.classList.remove('hidden')
    document.getElementById('ckVoucher').classList.add('border-green-400','bg-green-50')
    updateCkTotal()
  } catch(err) {
    ckAppliedVoucher = null
    const errCode = err.response?.data?.error
    const msg = errCode==='VOUCHER_LIMIT'?'Voucher đã hết lượt':errCode==='INVALID_VOUCHER'?'Mã không hợp lệ hoặc hết hạn':'Không thể áp dụng'
    statusEl.className='mt-2 voucher-error rounded-xl px-3 py-2 text-sm text-red-600 font-medium flex items-center gap-1'
    statusEl.innerHTML='<i class="fas fa-times-circle mr-1"></i>' + msg
    statusEl.classList.remove('hidden')
    document.getElementById('ckVoucher').classList.remove('border-green-400','bg-green-50')
    updateCkTotal()
  } finally {
    btn.disabled=false
    btn.innerHTML = ckAppliedVoucher ? '<i class="fas fa-check mr-1"></i>Đã áp dụng' : 'Áp dụng'
    if(ckAppliedVoucher) btn.classList.replace('bg-gray-800','bg-green-600')
    else btn.className='px-4 py-2.5 bg-gray-800 hover:bg-gray-700 text-white rounded-xl text-sm font-semibold transition whitespace-nowrap'
  }
}
function shakeCheckoutField(fieldId) {
  const el = document.getElementById(fieldId)
  if (!el) return
  el.classList.add('field-error')
  el.classList.remove('shake')
  void el.offsetWidth
  el.classList.add('shake')
  el.scrollIntoView({ behavior:'smooth', block:'center' })
  setTimeout(()=>el.classList.remove('shake'),600)
}
function clearCheckoutError(fieldId) {
  document.getElementById(fieldId)?.classList.remove('field-error')
}
async function submitCartOrder() {
  const name = document.getElementById('ckName').value.trim()
  const phone = document.getElementById('ckPhone').value.trim()
  const addressPayload = getAddressPayload('ck')
  const address = addressPayload.address
  if (!name) { shakeCheckoutField('ckFieldName'); return }
  clearCheckoutError('ckFieldName')
  if (!phone || !/^[0-9]{9,11}$/.test(phone.replace(/s/g,''))) { shakeCheckoutField('ckFieldPhone'); return }
  clearCheckoutError('ckFieldPhone')
  if (!addressPayload.valid) { shakeCheckoutField('ckFieldAddress'); return }
  clearCheckoutError('ckFieldAddress')

  const note = document.getElementById('ckNote').value.trim()
  const checkedItems = cart.filter(i=>i.checked)
  const btn = document.getElementById('submitCartBtn')
  btn.disabled=true
  btn.innerHTML='<i class="fas fa-spinner fa-spin mr-2"></i>Đang xử lý...'

  try {
    const codes = []
    for (const item of checkedItems) {
      const res = await axios.post('/api/orders', {
        customer_name: name, customer_phone: phone, customer_address: address,
        product_id: item.productId, color: item.color, size: item.size,
        selected_color_image: item.colorImage || '',
        quantity: item.qty,
        voucher_code: ckAppliedVoucher ? ckAppliedVoucher.code : '',
        note,
        payment_method: 'COD'
      })
      codes.push(res.data.order_code)
    }
    // Remove checked items from cart
    cart = cart.filter(i=>!i.checked)
    saveCart()
    closeCart()
    showToast('Dat hang thanh cong! ' + codes.length + ' don hang da duoc tao', 'success', 5000)
  } catch(e) {
    const errCode = e.response?.data?.error
    if (errCode==='INVALID_VOUCHER'||errCode==='VOUCHER_LIMIT') {
      showToast('Voucher không còn hiệu lực','error')
      ckAppliedVoucher=null; updateCkTotal()
      document.getElementById('ckVoucherBtn').innerHTML='Áp dụng'
      document.getElementById('ckVoucherBtn').className='px-4 py-2.5 bg-gray-800 hover:bg-gray-700 text-white rounded-xl text-sm font-semibold transition whitespace-nowrap'
    } else { showToast('Đặt hàng thất bại, thử lại sau','error') }
  } finally {
    btn.disabled=false
    btn.innerHTML='<i class="fas fa-shopping-cart mr-2"></i>Đặt hàng ngay'
  }
}

function toggleCart() { openCart() }

// Close overlays on outside click
document.getElementById('orderOverlay').addEventListener('click', (e) => { if(e.target.id==='orderOverlay') closeOrder() })
document.getElementById('detailOverlay').addEventListener('click', (e) => { if(e.target.id==='detailOverlay') closeDetail() })
document.getElementById('orderBankTransferOverlay').addEventListener('click', (e) => { if (e.target.id === 'orderBankTransferOverlay') closeOrderBankTransferModal() })
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    const bankModal = document.getElementById('orderBankTransferOverlay')
    if (bankModal && !bankModal.classList.contains('hidden')) closeOrderBankTransferModal()
  }
})

// Auto clear error on input
;['orderName','orderPhone','orderAddressDetail','orderProvince','orderCommune'].forEach(id => {
  const el = document.getElementById(id)
  if (!el) return
  const fieldMap = {
    orderName: 'fieldName',
    orderPhone: 'fieldPhone',
    orderAddressDetail: 'fieldAddress',
    orderProvince: 'fieldAddress',
    orderCommune: 'fieldAddress'
  }
  const clearFn = () => clearFieldError(fieldMap[id])
  el.addEventListener('input', clearFn)
  el.addEventListener('change', clearFn)
})

// ── DYNAMIC HERO BANNERS ──────────────────────────
let heroBannersData = []
let heroBannersIsExpanded = false

async function loadSettings() {
  try {
    const trendingRes = await axios.get('/api/trending-products').catch(() => ({ data: { data: [] } }))
    const trendingProducts = (trendingRes.data && trendingRes.data.data) ? trendingRes.data.data : []
    heroBannersData = sortHeroCards(mapTrendingProductsToHeroCards(trendingProducts))
    renderCollapsedBanners(heroBannersData)
    renderExpandedBanners(heroBannersData)
    bindHeroBannersWheelScroll()
  } catch (e) {
    console.error('Failed to load banners', e)
  }
}

function mapTrendingProductsToHeroCards(products) {
  if (!Array.isArray(products)) return []
  return products.map((p) => {
    const imgs = safeJson(p.images)
    const categoryLabel = p.category === 'male' ? 'Nam' : p.category === 'female' ? 'Nu' : 'Unisex'
    return {
      image_url: p.thumbnail || imgs[0] || 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400',
      subtitle: categoryLabel + ' · Dang thinh hanh',
      title: p.name || '',
      price: fmtPrice(p.price || 0),
      product_id: p.id,
      trending_order: Number(p.trending_order || 0),
      updated_at: p.updated_at || '',
      created_at: p.created_at || ''
    }
  })
}
function sortHeroCards(cards) {
  return [...cards].sort((a, b) => {
    const ao = Number(a.trending_order || 0)
    const bo = Number(b.trending_order || 0)
    const aHas = ao > 0
    const bHas = bo > 0
    if (aHas && !bHas) return -1
    if (!aHas && bHas) return 1
    if (aHas && bHas && ao !== bo) return ao - bo
    const au = Date.parse(a.updated_at || a.created_at || '')
    const bu = Date.parse(b.updated_at || b.created_at || '')
    if (!Number.isNaN(au) && !Number.isNaN(bu) && au !== bu) return bu - au
    return Number(a.product_id || 0) - Number(b.product_id || 0)
  })
}
function bindHeroBannersWheelScroll() {
  const overlay = document.getElementById('heroBannersExpanded')
  const inner = document.getElementById('heroBannersExpandedInner')
  if (!overlay || !inner || inner.dataset.wheelBound === '1') return
  inner.dataset.wheelBound = '1'
  const onWheel = (e) => {
    if (!heroBannersIsExpanded) return
    const delta = Math.abs(e.deltaY) > Math.abs(e.deltaX) ? e.deltaY : e.deltaX
    if (!delta) return
    inner.scrollLeft += delta * 1.2
    e.preventDefault()
  }
  inner.addEventListener('wheel', onWheel, { passive: false })
  overlay.addEventListener('wheel', onWheel, { passive: false })
}

function renderCollapsedBanners(banners) {
  const container = document.getElementById('heroBannersCollapsed')
  if (!container) return
  if (!banners.length) {
    container.innerHTML = \`<div class="relative w-full h-full rounded-3xl border border-white/20 bg-white/5 flex items-center justify-center text-center px-6">
      <div>
        <i class="fas fa-fire text-2xl text-pink-300 mb-2"></i>
        <p class="text-white/80 text-sm font-medium">Chưa có sản phẩm thịnh hành</p>
      </div>
    </div>\`
    return
  }
  const len = banners.length
  const shown = banners.slice(0, Math.min(len, 4)).reverse()
  container.innerHTML = \`<div class="relative" style="width:300px;height:360px">
  \${shown.map((b, i) => {
    const rot = shown.length > 1 ? (i - Math.floor((shown.length - 1) / 2)) * 6 : 0
    const z = i * 10
    const isTop = i === shown.length - 1
    const clickHandler = \`expandBanners()\`
    const cursor = 'cursor-pointer'
    return \`<div class="absolute inset-0 rounded-3xl overflow-hidden \${cursor}" onclick="\${clickHandler}" style="transform:rotate(\${rot}deg);z-index:\${z};transition:transform 0.5s ease,box-shadow 0.5s ease;box-shadow:0 12px 40px rgba(0,0,0,0.25);">
      <div class="absolute inset-0 bg-gradient-to-br from-pink-500/15 to-purple-600/15 rounded-3xl pointer-events-none"></div>
      <img src="\${b.image_url}" alt="\${b.title || 'Banner'}" class="w-full h-full object-cover rounded-3xl pointer-events-none" onerror="this.src='https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400'">
      \${isTop && (b.subtitle || b.title || b.price) ? \`
        <div class="absolute left-0 right-0 bottom-0 px-4 pt-10 pb-4 pointer-events-none rounded-b-3xl"
          style="z-index:\${z+5};background:linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.6) 42%, rgba(0,0,0,0) 100%);">
          \${b.subtitle ? \`<p class="text-[10px] text-white/75 uppercase tracking-[2px] font-semibold mb-1">\${b.subtitle}</p>\` : ''}
          \${b.title ? \`<p class="font-bold text-white text-sm leading-tight overflow-hidden text-ellipsis whitespace-nowrap" style="max-width:100%;">\${b.title}</p>\` : ''}
          \${b.price ? \`<p class="text-pink-300 font-bold text-sm mt-1">\${b.price}</p>\` : ''}
        </div>\` : ''}
    </div>\`
  }).join('')}
  </div>
  <div class="absolute flex items-center gap-1.5 bg-white/20 backdrop-blur-sm rounded-full px-3 py-1.5 text-white text-xs font-medium cursor-pointer hover:bg-white/30 transition whitespace-nowrap" style="bottom:-28px;left:50%;transform:translateX(-50%);z-index:100" onclick="expandBanners()">
    <i class="fas fa-expand-alt mr-1 text-pink-300"></i>Xem tất cả \${len} ảnh
  </div>\`
  container.style.paddingBottom = '36px'
  // Hover expand
  container.onclick = () => { if (!heroBannersIsExpanded) expandBanners() }
}

function renderExpandedBanners(banners) {
  const inner = document.getElementById('heroBannersExpandedInner')
  const title = document.getElementById('heroBannersExpandedTitle')
  if (!inner) return
  if (title) title.textContent = \`🔥 Đang thịnh hành (\${banners.length} mẫu)\`
  inner.innerHTML = banners.map(b => {
    if (b.product_id) {
      return \`<a href="javascript:void(0)" class="hero-banner-card" onclick="showDetail(\${b.product_id})">
        <img src="\${b.image_url}" alt="\${b.title || ''}" onerror="this.src='https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400'" loading="lazy">
        \${(b.subtitle || b.title || b.price) ? \`
          <div class="banner-caption">
            \${b.subtitle ? \`<p class="banner-subtitle">\${b.subtitle}</p>\` : ''}
            \${b.title ? \`<p class="banner-title">\${b.title}</p>\` : ''}
            \${b.price ? \`<p class="banner-price">\${b.price}</p>\` : ''}
          </div>\` : ''}
      </a>\`
    } else {
      return \`<div class="hero-banner-card" style="cursor:default;">
        <img src="\${b.image_url}" alt="\${b.title || ''}" onerror="this.src='https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400'" loading="lazy">
        \${(b.subtitle || b.title || b.price) ? \`
          <div class="banner-caption">
            \${b.subtitle ? \`<p class="banner-subtitle">\${b.subtitle}</p>\` : ''}
            \${b.title ? \`<p class="banner-title">\${b.title}</p>\` : ''}
            \${b.price ? \`<p class="banner-price">\${b.price}</p>\` : ''}
          </div>\` : ''}
      </div>\`
    }
  }).join('')
  // Add placeholders to always have 4 per row
  const needed = Math.max(0, 4 - banners.length)
  for (let i = 0; i < needed; i++) {
    inner.innerHTML += \`<div class="hero-banner-card" style="background:rgba(255,255,255,0.05);pointer-events:none;"></div>\`
  }
}

function expandBanners() {
  if (heroBannersIsExpanded) return
  heroBannersIsExpanded = true
  const overlay = document.getElementById('heroBannersExpanded')
  overlay.style.display = 'flex'
  requestAnimationFrame(() => { overlay.style.opacity = '1' })
  document.body.style.overflow = 'hidden'
}

function collapseBanners() {
  if (!heroBannersIsExpanded) return
  heroBannersIsExpanded = false
  const overlay = document.getElementById('heroBannersExpanded')
  overlay.style.opacity = '0'
  setTimeout(() => {
    overlay.style.display = 'none'
    document.body.style.overflow = ''
  }, 350)
}

function handleBannerOverlayClick(e) {
  if (e.target.id === 'heroBannersExpanded') collapseBanners()
}

document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && heroBannersIsExpanded) collapseBanners()
})

// Init
bindAddressSearchableDropdowns()
loadSettings()
loadCart()
loadProducts()
checkUserAuth()
handlePaymentReturnFlow()
ensureAddressKitReady().catch(() => {
  showToast('Không tải được danh mục tỉnh/phường. Bạn có thể thử lại sau.', 'error', 4500)
})

window.addEventListener('message', function (event) {
  if (event.origin !== window.location.origin) return
  const data = event.data || {}
  if ((data.type === 'payment_paid' || data.type === 'payos_paid') && data.orderCode) {
    onOrderMarkedPaid(String(data.orderCode))
  }
})

// ── USER AUTH & MENU ──────────────────────────────
async function checkUserAuth() {
  try {
    const res = await axios.get('/api/auth/me')
    currentUser = res.data.data
    isAdminUser = !!res.data.isAdmin
    syncCartScope()
    ensureAddressKitReady()
      .then(() => {
        applySavedAddressToScope('order')
          .catch(() => { })
      })
      .catch(() => { })
    updateUserUI()
  } catch {
    currentUser = null
    isAdminUser = false
    syncCartScope()
    ensureAddressKitReady()
      .then(() => {
        applySavedAddressToScope('order')
          .catch(() => { })
      })
      .catch(() => { })
    updateUserUI()
  }
}

function fmtBalance(v) { return new Intl.NumberFormat('vi-VN').format(v||0) + 'đ' }

function updateUserUI() {
  const defaultAvatar = document.getElementById('userAvatarDefault')
  const imgAvatar = document.getElementById('userAvatarImg')
  const guestSection = document.getElementById('userMenuGuest')
  const loggedInSection = document.getElementById('userMenuLoggedIn')
  const logoutArea = document.getElementById('userMenuLogoutArea')
  const walletNav = document.getElementById('walletNavBtn')
  const adminLink = document.getElementById('adminNavLink')
  // Admin icon
  if (isAdminUser) { adminLink.classList.remove('hidden') } else { adminLink.classList.add('hidden') }
  if (currentUser && isAdminUser) {
    defaultAvatar.classList.remove('hidden')
    imgAvatar.classList.add('hidden')
    guestSection.classList.add('hidden')
    loggedInSection.classList.remove('hidden')
    logoutArea.classList.remove('hidden')
    document.getElementById('userMenuAvatar').src = '/qh-logo.png'
    document.getElementById('userMenuName').textContent = 'Admin'
    document.getElementById('userMenuEmail').textContent = 'Quyen quan tri'
    walletNav.classList.add('hidden')
    walletNav.classList.remove('flex')
  } else if (currentUser) {
    defaultAvatar.classList.add('hidden')
    imgAvatar.src = currentUser.avatar || ''
    imgAvatar.classList.remove('hidden')
    guestSection.classList.add('hidden')
    loggedInSection.classList.remove('hidden')
    logoutArea.classList.remove('hidden')
    document.getElementById('userMenuAvatar').src = currentUser.avatar || ''
    document.getElementById('userMenuName').textContent = currentUser.name || ''
    document.getElementById('userMenuEmail').textContent = currentUser.email || ''
    // Wallet
    walletNav.classList.remove('hidden')
    walletNav.classList.add('flex')
    const bal = fmtBalance(currentUser.balance)
    document.getElementById('walletBalanceNav').textContent = bal
    document.getElementById('walletBalanceMenu').textContent = bal
  } else {
    defaultAvatar.classList.remove('hidden')
    imgAvatar.classList.add('hidden')
    guestSection.classList.remove('hidden')
    loggedInSection.classList.add('hidden')
    logoutArea.classList.add('hidden')
    walletNav.classList.add('hidden')
    walletNav.classList.remove('flex')
  }
}

function toggleUserMenu() {
  const overlay = document.getElementById('userMenuOverlay')
  if (overlay.classList.contains('hidden')) { openUserMenu() } else { closeUserMenu() }
}
function openUserMenu() {
  const overlay = document.getElementById('userMenuOverlay')
  const panel = document.getElementById('userMenuPanel')
  panel.classList.remove('closing')
  overlay.classList.remove('hidden')
  document.body.style.overflow = 'hidden'
  document.getElementById('userMenuContent').innerHTML = ''
}
function closeUserMenu() {
  const overlay = document.getElementById('userMenuOverlay')
  const panel = document.getElementById('userMenuPanel')
  panel.classList.add('closing')
  setTimeout(() => { overlay.classList.add('hidden'); panel.classList.remove('closing'); document.body.style.overflow = '' }, 300)
}
function handleUserMenuOverlayClick(e) { if (e.target.id === 'userMenuOverlay') closeUserMenu() }

function loginWithGoogle() { window.location.href = '/api/auth/google' }

async function logoutUser() {
  try { await axios.post('/api/auth/logout') } catch {}
  currentUser = null
  isAdminUser = false
  syncCartScope(true)
  updateUserUI()
  closeUserMenu()
  showToast('Đã đăng xuất thành công', 'success')
}

function showUserAccount() {
  const content = document.getElementById('userMenuContent')
  if (!currentUser) {
    content.innerHTML = '<div class="text-center py-8 text-gray-400"><i class="fas fa-lock text-3xl mb-3"></i><p>Vui lòng đăng nhập để xem thông tin</p></div>'
    return
  }
  content.innerHTML = '<div class="bg-white rounded-2xl border p-4 space-y-3">'
    + '<h3 class="font-semibold text-gray-800 mb-3"><i class="fas fa-user-circle text-pink-400 mr-2"></i>Thông tin tài khoản</h3>'
    + '<div class="flex items-center gap-4"><img src="' + (currentUser.avatar||'') + '" class="w-16 h-16 rounded-full object-cover border-2 border-pink-200"><div>'
    + '<p class="font-bold text-gray-900">' + (currentUser.name||'') + '</p>'
    + '<p class="text-sm text-gray-500">' + (currentUser.email||'') + '</p></div></div></div>'
}

async function showUserOrders() {
  const content = document.getElementById('userMenuContent')
  if (!currentUser) {
    content.innerHTML = '<div class="text-center py-8 text-gray-400"><i class="fas fa-lock text-3xl mb-3"></i><p>Vui lòng đăng nhập để xem lịch sử</p></div>'
    return
  }
  content.innerHTML = '<div class="text-center py-8"><i class="fas fa-spinner fa-spin text-2xl text-pink-400"></i></div>'
  try {
    const res = await axios.get('/api/user/orders')
    let orders = res.data.data || []
    const unpaidGatewayOrders = orders.filter(function (o) {
      const method = String(o.payment_method || '').toUpperCase()
      const unpaid = String(o.payment_status || '').toLowerCase() !== 'paid'
      return unpaid && (method === 'BANK_TRANSFER' || method === 'ZALOPAY')
    }).slice(0, 6)
    if (unpaidGatewayOrders.length) {
      await Promise.all(unpaidGatewayOrders.map(function (o) {
        const method = String(o.payment_method || '').toUpperCase()
        const syncEndpoint = method === 'ZALOPAY'
          ? '/api/orders/' + o.id + '/zalopay-sync'
          : '/api/orders/' + o.id + '/payos-sync'
        return axios.post(syncEndpoint).catch(function () { return null })
      }))
      const refreshed = await axios.get('/api/user/orders')
      orders = refreshed.data.data || orders
    }
    if (!orders.length) {
      content.innerHTML = '<div class="text-center py-8 text-gray-400"><i class="fas fa-shopping-bag text-4xl mb-3"></i><p>Chưa có đơn hàng nào</p></div>'
      return
    }
    content.innerHTML = '<h3 class="font-semibold text-gray-800 mb-3"><i class="fas fa-clipboard-list text-pink-400 mr-2"></i>Lịch sử mua hàng</h3>'
      + '<div class="space-y-2">' + orders.map(function(o) {
        const paymentPaid = String(o.payment_status || '').toLowerCase() === 'paid'
        const paymentBadgeClass = paymentPaid ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
        const paymentBadgeText = paymentPaid ? 'Đã thanh toán' : 'Chưa thanh toán'
        const paymentMethod = String(o.payment_method || '').toUpperCase()
        const canResume = !paymentPaid && (paymentMethod === 'BANK_TRANSFER' || paymentMethod === 'ZALOPAY')
        const safeOrderCode = String(o.order_code || '').replace(/'/g, "\\'")
        const methodArg = paymentMethod.replace(/'/g, "\\'")
        const codeHtml = canResume
          ? '<button class="font-mono text-xs text-blue-600 font-semibold hover:underline" onclick="resumeOrderPayment(' + o.id + ',\\'' + safeOrderCode + '\\',\\'' + methodArg + '\\')">' + o.order_code + '</button>'
          : '<span class="font-mono text-xs text-blue-600 font-semibold">' + o.order_code + '</span>'
        return '<div class="order-history-item border rounded-xl p-3">'
          + '<div class="flex justify-between items-start mb-1">' + codeHtml
          + '<span class="text-xs px-2 py-0.5 rounded-full font-medium ' + paymentBadgeClass + '">' + paymentBadgeText + '</span></div>'
          + '<p class="text-sm font-medium text-gray-800">' + o.product_name + '</p>'
          + '<div class="flex justify-between items-center mt-1"><span class="text-xs text-gray-400">' + new Date(o.created_at).toLocaleDateString('vi-VN') + '</span>'
          + '<span class="font-bold text-pink-600 text-sm">' + fmtPrice(getOrderAmountDue(o)) + '</span></div></div>'
      }).join('') + '</div>'
  } catch { content.innerHTML = '<div class="text-center py-8 text-red-400">Lỗi tải dữ liệu</div>' }
}

async function resumeOrderPayment(orderId, orderCode, paymentMethod) {
  const method = String(paymentMethod || '').toUpperCase()
  const isZaloPay = method === 'ZALOPAY'
  if (isZaloPay) {
    const check = await ensureZaloPayConfigReady(true)
    if (!check.ready) return
  }
  const providerLabel = isZaloPay ? 'ZaloPay' : 'PayOS'
  const createEndpoint = isZaloPay ? '/api/orders/' + orderId + '/zalopay-link' : '/api/orders/' + orderId + '/payos-link'
  const syncEndpoint = isZaloPay ? '/api/orders/' + orderId + '/zalopay-sync' : '/api/orders/' + orderId + '/payos-sync'
  let payTab = isZaloPay ? openOrReuseZaloPayLinkTab() : window.open('about:blank', '_blank')
  try {
    const paymentRes = await axios.post(createEndpoint, { origin: window.location.origin })
    const paymentData = paymentRes.data?.data || {}
    if (paymentData.alreadyPaid) {
      try { if (payTab && !payTab.closed) payTab.close() } catch (_) { }
      await axios.post(syncEndpoint).catch(function () { return null })
      showUserOrders()
      showToast('Đơn này đã thanh toán thành công', 'success', 3500)
      return
    }
    const checkoutUrl = isZaloPay
      ? String(paymentData.orderUrl || '').trim()
      : String(paymentData.checkoutUrl || '').trim()
    if (!checkoutUrl) {
      try { if (payTab && !payTab.closed) payTab.close() } catch (_) { }
      showToast('Không tạo được link thanh toán ' + providerLabel, 'error', 3500)
      return
    }
    if (payTab) {
      payTab.location.href = checkoutUrl
      if (isZaloPay) zaloPayLinkTab = payTab
    } else {
      payTab = window.open(checkoutUrl, '_blank')
      if (isZaloPay && payTab) zaloPayLinkTab = payTab
    }
    startOrderPaymentPolling(orderCode)
    showToast('Đang mở lại trang ' + providerLabel + ' để bạn thanh toán tiếp', 'success', 3500)
  } catch (err) {
    const errCode = err.response?.data?.error
    if (errCode === 'ZALOPAY_CONFIG_MISSING') {
      const missing = Array.isArray(err.response?.data?.missing) ? err.response.data.missing : []
      const detail = missing.length ? (': ' + missing.join(', ')) : ''
      showToast('ZaloPay chua cau hinh day du' + detail, 'error', 5500)
      return
    }
    try { if (payTab && !payTab.closed) payTab.close() } catch (_) { }
    showToast('Không thể mở lại thanh toán cho đơn này', 'error', 3500)
  }
}

// ── WALLET CONFIG (thay thông tin ngân hàng ở đây) ──
const BANK_CONFIG = {
  bankId: 'MB',
  accountNo: '0200100441441',
  accountName: 'TRAN CONG HANH',
  template: 'compact2'
}

let selectedTopupAmount = 50000

function getVietQRUrl(amount, customInfo = '') {
  const info = customInfo || ('QHVN90' + (currentUser ? currentUser.userId : ''))
  return 'https://img.vietqr.io/image/' + BANK_CONFIG.bankId + '-' + BANK_CONFIG.accountNo + '-' + BANK_CONFIG.template + '.png?amount=' + amount + '&addInfo=' + encodeURIComponent(info) + '&accountName=' + encodeURIComponent(BANK_CONFIG.accountName)
}

function getOrderTransferContent(orderCode) {
  const safeCode = String(orderCode || '').replace(/[^a-zA-Z0-9]/g, '')
  return 'DH' + safeCode
}

function openOrderBankTransferModal(info) {
  const orderCode = info?.orderCode || ''
  const amount = Number(info?.amount || 0)
  const transferContent = info?.transferContent || getOrderTransferContent(info?.orderId || orderCode)
  const qrImage = getVietQRUrl(amount, transferContent)
  pendingBankTransferOrder = { orderCode, amount, transferContent, paymentLinkId: info?.paymentLinkId || '' }
  document.getElementById('orderBankOrderCode').textContent = orderCode
  document.getElementById('orderBankAmountDisplay').textContent = fmtPrice(amount)
  document.getElementById('orderBankAccountNo').textContent = BANK_CONFIG.accountNo
  document.getElementById('orderBankAccountName').textContent = BANK_CONFIG.accountName
  document.getElementById('orderBankTransferContent').textContent = transferContent
  document.getElementById('orderBankQrImg').src = qrImage
  document.getElementById('orderBankTransferOverlay').classList.remove('hidden')
  document.body.style.overflow = 'hidden'
  startOrderPaymentPolling(orderCode)
}

function closeOrderBankTransferModal() {
  document.getElementById('orderBankTransferOverlay').classList.add('hidden')
  stopOrderPaymentPolling()
  pendingBankTransferOrder = null
  document.body.style.overflow = ''
}

async function copyBankValue(value) {
  try {
    await navigator.clipboard.writeText(String(value || '').trim())
    showToast('Đã sao chép', 'success', 1500)
  } catch (_) {
    showToast('Không thể sao chép', 'error', 1500)
  }
}

function stopOrderPaymentPolling() {
  if (bankTransferPollTimer) {
    clearInterval(bankTransferPollTimer)
    bankTransferPollTimer = null
  }
}

function showOrderPaidNotice(orderCode) {
  const overlay = document.getElementById('orderPaidNoticeOverlay')
  const codeEl = document.getElementById('orderPaidNoticeCode')
  if (codeEl) codeEl.textContent = orderCode || ''
  if (!overlay) return
  overlay.classList.remove('hidden')
  overlay.classList.add('flex')
  setTimeout(() => {
    overlay.classList.add('hidden')
    overlay.classList.remove('flex')
  }, 2600)
}

function onOrderMarkedPaid(orderCode) {
  stopOrderPaymentPolling()
  closeOrderBankTransferModal()
  showOrderPaidNotice(orderCode)
  showToast('Đã thanh toán thành công và ghi nhận đơn hàng', 'success', 4500)
  const userMenuContent = document.getElementById('userMenuContent')
  if (userMenuContent && userMenuContent.textContent && userMenuContent.textContent.includes('Lịch sử mua hàng')) {
    showUserOrders()
  }
  if (typeof loadAdminOrders === 'function') loadAdminOrders()
}

function startOrderPaymentPolling(orderCode) {
  stopOrderPaymentPolling()
  bankTransferPollTimer = setInterval(async () => {
    try {
      const res = await axios.get('/api/orders/' + encodeURIComponent(orderCode) + '/payment-status')
      const paymentStatus = res.data?.data?.payment_status
      if (paymentStatus === 'paid') {
        onOrderMarkedPaid(orderCode)
      }
    } catch (_) { }
  }, 4000)
}

function cleanPaymentQueryParams() {
  const url = new URL(window.location.href)
  if (!url.searchParams.has('pay')) return
  url.searchParams.delete('pay')
  url.searchParams.delete('order')
  url.searchParams.delete('provider')
  url.searchParams.delete('closeTab')
  const next = url.pathname + (url.searchParams.toString() ? '?' + url.searchParams.toString() : '') + url.hash
  window.history.replaceState({}, '', next)
}

function handlePaymentReturnFlow() {
  const params = new URLSearchParams(window.location.search)
  const payState = String(params.get('pay') || '').toLowerCase()
  const orderCode = String(params.get('order') || '').trim().toUpperCase()
  const provider = String(params.get('provider') || 'payos').trim().toLowerCase()
  const providerLabel = provider === 'zalopay' ? 'ZaloPay' : 'PayOS'
  const closeTab = params.get('closeTab') === '1'
  if (!payState) return

  if (payState === 'success' && orderCode) {
    try {
      if (window.opener && !window.opener.closed) {
        window.opener.postMessage({ type: 'payment_paid', orderCode, provider }, window.location.origin)
      }
    } catch (_) { }
    startOrderPaymentPolling(orderCode)
    cleanPaymentQueryParams()
    if (closeTab && window.opener && !window.opener.closed) {
      setTimeout(() => { window.close() }, 80)
      return
    }
    showToast('Thanh toán ' + providerLabel + ' thành công', 'success', 3000)
    return
  }

  if (payState === 'cancel') {
    showToast('Bạn đã hủy thanh toán ' + providerLabel, 'error', 3000)
  }
  cleanPaymentQueryParams()
}

function showWalletInMenu() {
    var content = document.getElementById('userMenuContent')
    if (!currentUser) {
        content.innerHTML = '<div class="text-center py-8 text-gray-400"><i class="fas fa-lock text-3xl mb-3"></i><p>Vui lòng đăng nhập để nạp tiền</p></div>'
        return
    }
    var tc = 'QHVN90' + currentUser.userId
    var html = '<div class="bg-gradient-to-r from-pink-50 to-purple-50 rounded-2xl p-4 mb-4 flex items-center justify-between">'
    html += '<div><p class="text-xs text-gray-500">Số dư ví</p><p class="text-xl font-bold text-pink-600">' + fmtBalance(currentUser.balance) + '</p></div>'
    html += '<i class="fas fa-wallet text-3xl text-pink-300"></i></div>'
    html += '<h4 class="font-semibold text-gray-700 text-sm mb-2"><i class="fas fa-coins text-pink-400 mr-1"></i>Chọn số tiền</h4>'
    html += '<div class="grid grid-cols-3 gap-2 mb-3" id="topupAmountGrid">'
    var amounts = [50000, 100000, 200000, 500000, 1000000, 2000000]
    for (var i = 0; i < amounts.length; i++) {
        var v = amounts[i]
        var isActive = v === selectedTopupAmount
        var cls = isActive ? 'border-pink-500 bg-pink-50 text-pink-600' : 'border-gray-200 text-gray-600 hover:border-pink-300'
        html += '<button onclick="selectTopupAmount(' + v + ')" class="topup-amt-btn border-2 rounded-xl py-2 text-xs font-semibold transition ' + cls + '" data-amt="' + v + '">' + new Intl.NumberFormat('vi-VN').format(v) + 'đ</button>'
    }
    html += '</div>'
    html += '<div class="flex items-center gap-2 mb-4"><input id="customTopupAmt" type="number" placeholder="Số tiền khác..." class="flex-1 border-2 border-gray-200 rounded-xl px-3 py-2 text-sm focus:border-pink-400 outline-none" oninput="onCustomAmountInput(this.value)"><span class="text-gray-400 text-sm font-semibold">đ</span></div>'
    html += '<div class="bg-white border-2 border-gray-100 rounded-2xl p-4 text-center">'
    html += '<p class="text-sm font-semibold text-gray-700 mb-3"><i class="fas fa-qrcode text-pink-400 mr-1"></i>Quét mã QR để thanh toán</p>'
    html += '<div class="flex justify-center mb-3"><img id="vietqrImg" src="' + getVietQRUrl(selectedTopupAmount) + '" class="w-48 h-48 object-contain rounded-xl border"></div>'
    html += '<div class="text-left space-y-2 text-xs">'
    html += '<div class="flex justify-between items-center bg-gray-50 rounded-lg px-3 py-2"><span class="text-gray-500">Ngân hàng</span><span class="font-bold text-gray-800">MB Bank</span></div>'
    html += '<div class="flex justify-between items-center bg-gray-50 rounded-lg px-3 py-2"><span class="text-gray-500">Số TK</span><span class="font-bold text-gray-800">' + BANK_CONFIG.accountNo + ' <i class="fas fa-copy text-gray-400 cursor-pointer ml-1 copy-btn" data-copy="' + BANK_CONFIG.accountNo + '"></i></span></div>'
    html += '<div class="flex justify-between items-center bg-gray-50 rounded-lg px-3 py-2"><span class="text-gray-500">Chủ TK</span><span class="font-bold text-gray-800">' + BANK_CONFIG.accountName + '</span></div>'
    html += '<div class="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2"><p class="text-amber-600 font-semibold mb-0.5">Nội dung CK (BẮT BUỘC)</p><div class="flex justify-between items-center"><span class="font-mono font-bold text-amber-800 text-sm">' + tc + '</span><i class="fas fa-copy text-amber-400 cursor-pointer copy-btn" data-copy="' + tc + '"></i></div></div>'
    html += '<div class="flex justify-between items-center bg-gray-50 rounded-lg px-3 py-2"><span class="text-gray-500">Số tiền</span><span class="font-bold text-pink-600" id="qrAmountDisplay">' + fmtBalance(selectedTopupAmount) + '</span></div>'
    html += '</div></div>'
    html += '<div class="mt-3 bg-blue-50 border border-blue-200 rounded-xl px-3 py-2 text-xs text-blue-700 space-y-1">'
    html += '<p class="font-semibold"><i class="fas fa-info-circle mr-1"></i>Lưu ý:</p>'
    html += '<p>• Nội dung CK phải <strong>CHÍNH XÁC</strong></p>'
    html += '<p>• Tiền sẽ được cộng <strong>tự động</strong> trong 1-5 phút</p>'
    html += '<p>• Liên hệ admin nếu không nhận được tiền sau 10 phút</p>'
    html += '</div>'
    content.innerHTML = html
}

function selectTopupAmount(amt) {
    selectedTopupAmount = amt
    document.querySelectorAll('.topup-amt-btn').forEach(function (btn) {
        var btnAmt = parseInt(btn.getAttribute('data-amt'))
        if (btnAmt === amt) {
            btn.className = btn.className.replace(/border-gray-200 text-gray-600 hover:border-pink-300/g, '').replace(/border-pink-500 bg-pink-50 text-pink-600/g, '') + ' border-pink-500 bg-pink-50 text-pink-600'
        } else {
            btn.className = btn.className.replace(/border-pink-500 bg-pink-50 text-pink-600/g, '').replace(/border-gray-200 text-gray-600 hover:border-pink-300/g, '') + ' border-gray-200 text-gray-600 hover:border-pink-300'
        }
    })
    var ci = document.getElementById('customTopupAmt')
    if (ci) ci.value = ''
    updateQRCode(amt)
}

function onCustomAmountInput(val) {
    var amt = parseInt(val) || 0
    if (amt >= 2000) {
        selectedTopupAmount = amt
        document.querySelectorAll('.topup-amt-btn').forEach(function (btn) {
            btn.className = btn.className.replace(/border-pink-500 bg-pink-50 text-pink-600/g, '') + ' border-gray-200 text-gray-600 hover:border-pink-300'
        })
        updateQRCode(amt)
    }
}

function updateQRCode(amount) {
    var img = document.getElementById('vietqrImg')
    var display = document.getElementById('qrAmountDisplay')
    if (img) img.src = getVietQRUrl(amount)
    if (display) display.textContent = fmtBalance(amount)
}

function copyText(text) {
    navigator.clipboard.writeText(text).then(function () { showToast('Đã sao chép: ' + text, 'success') })
}

// Event delegation for copy buttons
document.addEventListener('click', function(e) {
  if (e.target.classList.contains('copy-btn') && e.target.dataset.copy) {
    copyText(e.target.dataset.copy)
  }
})

function openTopupModal() {
    if (!currentUser) { toggleUserMenu(); return }
    openUserMenu()
    showWalletInMenu()
}

// ── BALANCE POLLING & SUCCESS NOTIFICATION ──
var balancePollingTimer = null
var lastKnownBalance = null

function startBalancePolling() {
  if (balancePollingTimer) return
  if (!currentUser) return
  lastKnownBalance = currentUser.balance || 0
  balancePollingTimer = setInterval(checkBalanceChange, 5000)
}

function stopBalancePolling() {
  if (balancePollingTimer) { clearInterval(balancePollingTimer); balancePollingTimer = null }
}

async function checkBalanceChange() {
  if (!currentUser) { stopBalancePolling(); return }
  try {
    var res = await axios.get('/api/auth/me')
    if (res.data.data && res.data.data.balance !== undefined) {
      var newBalance = res.data.data.balance
      if (lastKnownBalance !== null && newBalance > lastKnownBalance) {
        var added = newBalance - lastKnownBalance
        currentUser.balance = newBalance
        updateUserUI()
        showWalletInMenu()
        showTopupSuccessModal(added)
        playTingSound()
      }
      lastKnownBalance = newBalance
      currentUser.balance = newBalance
    }
  } catch(e) {}
}

function showTopupSuccessModal(amount) {
  var overlay = document.createElement('div')
  overlay.id = 'topupSuccessOverlay'
  overlay.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.5);backdrop-filter:blur(4px);z-index:9999;display:flex;align-items:center;justify-content:center;animation:fadeIn 0.3s ease'
  overlay.innerHTML = '<div style="background:white;border-radius:1.5rem;padding:2.5rem 2rem;text-align:center;max-width:340px;width:90%;box-shadow:0 25px 50px rgba(0,0,0,0.25);animation:scaleIn 0.4s cubic-bezier(0.34,1.56,0.64,1)">'
    + '<div style="width:70px;height:70px;border-radius:50%;background:linear-gradient(135deg,#10b981,#059669);margin:0 auto 1rem;display:flex;align-items:center;justify-content:center"><i class="fas fa-check" style="color:white;font-size:2rem"></i></div>'
    + '<h3 style="color:#059669;font-size:1.25rem;font-weight:700;margin-bottom:0.5rem">Đã nạp tiền thành công!</h3>'
    + '<p style="color:#047857;font-size:1.75rem;font-weight:800">+' + fmtBalance(amount) + '</p>'
    + '<p style="color:#6b7280;font-size:0.8rem;margin-top:0.5rem">Số dư mới: ' + fmtBalance(currentUser.balance) + '</p>'
    + '<button onclick="closeTopupSuccessModal()" style="margin-top:1.25rem;background:linear-gradient(135deg,#10b981,#059669);color:white;border:none;padding:0.75rem 2rem;border-radius:0.75rem;font-weight:600;font-size:0.9rem;cursor:pointer">OK</button>'
    + '</div>'
  document.body.appendChild(overlay)
  overlay.addEventListener('click', function(e) { if (e.target === overlay) closeTopupSuccessModal() })
}

function closeTopupSuccessModal() {
  var el = document.getElementById('topupSuccessOverlay')
  if (el) el.remove()
}

function playTingSound() {
  try {
    var ctx = new (window.AudioContext || window.webkitAudioContext)()
    // Note 1
    var osc1 = ctx.createOscillator()
    var gain1 = ctx.createGain()
    osc1.type = 'sine'
    osc1.frequency.setValueAtTime(880, ctx.currentTime)
    gain1.gain.setValueAtTime(0.3, ctx.currentTime)
    gain1.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3)
    osc1.connect(gain1)
    gain1.connect(ctx.destination)
    osc1.start(ctx.currentTime)
    osc1.stop(ctx.currentTime + 0.3)
    // Note 2 (higher, delayed)
    var osc2 = ctx.createOscillator()
    var gain2 = ctx.createGain()
    osc2.type = 'sine'
    osc2.frequency.setValueAtTime(1318, ctx.currentTime + 0.15)
    gain2.gain.setValueAtTime(0.01, ctx.currentTime)
    gain2.gain.setValueAtTime(0.3, ctx.currentTime + 0.15)
    gain2.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5)
    osc2.connect(gain2)
    gain2.connect(ctx.destination)
    osc2.start(ctx.currentTime + 0.15)
    osc2.stop(ctx.currentTime + 0.5)
  } catch(e) {}
}

// Start polling when wallet menu is opened
var origShowWallet = showWalletInMenu
showWalletInMenu = function() { origShowWallet(); startBalancePolling() }

// Stop polling when user menu closes
var origCloseMenu = closeUserMenu
closeUserMenu = function() { stopBalancePolling(); origCloseMenu() }
</script>
</body>
</html>`
}

// ─── ADMIN HTML ────────────────────────────────────
function adminHTML(): string {
  return `<!DOCTYPE html>
<html lang="vi">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Admin – QH Clothes</title>
<script src="https://cdn.tailwindcss.com"><\/script>
<link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
<script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"><\/script>
<script src="https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js"><\/script>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
  * { font-family: 'Inter', sans-serif; }
  .sidebar { background: linear-gradient(180deg, #1a1a2e 0%, #16213e 100%); }
  .nav-item { transition: all 0.2s; }
  .nav-item.active, .nav-item:hover { background: rgba(232,67,147,0.15); color: #e84393; }
  .nav-item.active { border-left: 3px solid #e84393; }
  .nav-sub-item { transition: all 0.2s; }
  .nav-sub-item.active, .nav-sub-item:hover { background: rgba(16,185,129,0.15); color: #34d399; }
  .stat-card { background: linear-gradient(135deg, var(--from), var(--to)); }
  .btn-pink { background: linear-gradient(135deg,#e84393,#c0392b); transition:all 0.2s; }
  .btn-pink:hover { opacity:0.9; transform:scale(1.01); }
  .table-row:hover { background: #fdf2f8; }
  .badge { display:inline-flex; align-items:center; padding:2px 10px; border-radius:99px; font-size:12px; font-weight:600; }
  .badge-pending { background:#fef3c7; color:#d97706; }
  .badge-confirmed { background:#dbeafe; color:#2563eb; }
  .badge-shipping { background:#ede9fe; color:#7c3aed; }
  .badge-done { background:#d1fae5; color:#059669; }
  .badge-cancelled { background:#fee2e2; color:#dc2626; }
  .modal-overlay { background:rgba(0,0,0,0.6); backdrop-filter:blur(4px); }
  .modal-card { animation: fadeIn 0.25s ease; }
  @keyframes fadeIn { from{opacity:0;transform:scale(0.95)} to{opacity:1;transform:scale(1)} }
  .avatar-edit-overlay { position:absolute; inset:0; display:flex; align-items:center; justify-content:center; background:rgba(0,0,0,0.35); opacity:0; transition:opacity 0.2s; pointer-events:none; }
  .avatar-wrap:hover .avatar-edit-overlay { opacity:1; }
  .img-slot { aspect-ratio:1; border:2px dashed #e5e7eb; border-radius:12px; cursor:pointer; transition:all 0.2s; }
  .img-slot:hover { border-color:#e84393; background:#fdf2f8; }
  .img-slot.drag-over { border-color:#ec4899; background:#fce7f3; box-shadow:0 0 0 2px rgba(236,72,153,.12) inset; }
  .img-slot.has-img { border-style:solid; border-color:#e84393; }
  .tag-item { display:inline-flex; align-items:center; background:#fdf2f8; border:1px solid #f9a8d4; color:#be185d; border-radius:999px; padding:3px 10px; font-size:13px; gap:4px; }
  .tag-del { cursor:pointer; width:16px; height:16px; display:flex; align-items:center; justify-content:center; border-radius:50%; background:#fecdd3; color:#e11d48; font-size:10px; }
  .tag-del:hover { background:#fca5a5; }
  .toast-admin { animation: slideIn 0.3s ease; }
  @keyframes slideIn { from{opacity:0;transform:translateX(100%)} to{opacity:1;transform:translateX(0)} }
  .scrollbar-thin::-webkit-scrollbar { width:4px; }
  .scrollbar-thin::-webkit-scrollbar-thumb { background:#e84393; border-radius:2px; }
  .mobile-overlay { background:rgba(0,0,0,0.5); }
  [x-cloak] { display:none; }
  .col-tag { width: 32px; height: 32px; border-radius: 50%; display:inline-flex; align-items:center; justify-content:center; font-size:11px; font-weight:600; }
  /* Force hide sidebar overlay on desktop - overrides any JS toggle */
  @media (min-width: 768px) {
    #sidebarOverlay { display: none !important; }
  }
  /* Ensure modals don't accidentally block page */
  .modal-overlay.hidden { pointer-events: none !important; }
</style>
</head>
<body class="bg-gray-50 flex">

<!-- MOBILE MENU TOGGLE -->
<button id="menuToggle" onclick="toggleSidebar()" class="fixed top-4 left-4 z-50 md:hidden bg-white shadow-lg rounded-xl p-2.5">
  <i class="fas fa-bars text-gray-700"></i>
</button>

<!-- SIDEBAR OVERLAY (mobile) -->
<div id="sidebarOverlay" class="fixed inset-0 mobile-overlay z-30 md:hidden" style="display:none" onclick="toggleSidebar()"></div>

<!-- SIDEBAR -->
<aside id="sidebar" class="sidebar w-64 min-h-screen fixed left-0 top-0 z-40 transform -translate-x-full md:translate-x-0 transition-transform duration-300 flex flex-col">
  <div class="p-6 border-b border-white/10">
    <div class="flex items-center gap-3">
      <span class="inline-flex items-center justify-center"><img src="/qh-logo.png" alt="QH" class="rounded-full w-9 h-9 object-cover bg-white"></span>
      <div>
        <p class="text-white font-bold text-lg leading-tight">QH<span class="text-pink-400">Clothes</span></p>
        <p class="text-gray-400 text-xs">Admin Panel</p>
      </div>
    </div>
  </div>
  
  <nav class="p-4 flex-1 space-y-1">
    <button class="nav-item active w-full text-left flex items-center gap-3 px-4 py-3 rounded-xl text-gray-300 text-sm font-medium" data-page="dashboard" onclick="showPage('dashboard')">
      <i class="fas fa-chart-pie w-5"></i>Dashboard
    </button>
    <button class="nav-item w-full text-left flex items-center gap-3 px-4 py-3 rounded-xl text-gray-300 text-sm font-medium" data-page="products" onclick="showPage('products')">
      <i class="fas fa-tshirt w-5"></i>Sản phẩm
    </button>
    <button class="nav-item w-full text-left flex items-center gap-3 px-4 py-3 rounded-xl text-gray-300 text-sm font-medium" data-page="orders" onclick="showPage('orders')">
      <i class="fas fa-clipboard-list w-5"></i>Đơn hàng
      <span id="pendingBadge" class="ml-auto bg-pink-500 text-white text-xs rounded-full px-2 py-0.5 hidden"></span>
    </button>
    <button class="nav-item w-full text-left flex items-center gap-3 px-4 py-3 rounded-xl text-gray-300 text-sm font-medium" data-page="vouchers" onclick="showPage('vouchers')">
      <i class="fas fa-ticket-alt w-5"></i>Voucher
    </button>
    <button class="nav-item w-full text-left flex items-center gap-3 px-4 py-3 rounded-xl text-gray-300 text-sm font-medium" data-page="featured" onclick="showPage('featured')">
      <i class="fas fa-star w-5"></i>Sản phẩm Nổi Bật
    </button>
    <button id="settingsMenuBtn" class="nav-item w-full text-left flex items-center gap-3 px-4 py-3 rounded-xl text-gray-300 text-sm font-medium" onclick="toggleSettingsMenu()">
      <i class="fas fa-gear w-5"></i>
      <span>Cài đặt</span>
      <i id="settingsMenuChevron" class="fas fa-chevron-down ml-auto text-xs transition-transform"></i>
    </button>
    <div id="settingsSubmenu" class="hidden ml-5 mt-1 space-y-1">
      <button class="nav-sub-item w-full text-left flex items-center gap-2 px-3 py-2 rounded-lg text-gray-400 text-sm font-medium" data-sub-page="settings-warehouse" onclick="openSettingsWarehouse()">
        <i class="fas fa-warehouse w-4"></i>Cài đặt kho hàng
      </button>
    </div>
  </nav>
  
  <div class="p-4 border-t border-white/10">
    <a href="/" target="_blank" class="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-400 text-sm hover:text-pink-400 transition">
      <i class="fas fa-external-link-alt w-5"></i>Xem trang chủ
    </a>
  </div>
</aside>

<!-- MAIN CONTENT -->
<main class="flex-1 md:ml-64 min-h-screen">
  <!-- Top bar -->
  <header class="bg-white border-b px-6 py-4 flex items-center justify-between sticky top-0 z-20 shadow-sm">
    <div class="ml-10 md:ml-0">
      <h1 id="pageTitle" class="text-lg font-bold text-gray-800">Dashboard</h1>
    </div>
    <div class="flex items-center gap-3">
      <div id="adminAvatarMenuRoot" class="relative">
        <button type="button" onclick="toggleAdminAvatarMenu()" title="Tài khoản quản trị" class="w-auto max-w-[260px] rounded-full bg-gray-900 text-white pl-1.5 pr-3 py-1.5 flex items-center gap-2 shadow-sm hover:bg-gray-800 transition">
          <span class="relative w-8 h-8 rounded-full overflow-hidden bg-gray-50 text-gray-700 font-bold text-xs flex items-center justify-center flex-none">
            <img id="adminHeaderAvatarImg" src="" alt="avatar" class="w-full h-full object-cover hidden">
            <span id="adminHeaderAvatarFallback">A</span>
          </span>
          <span id="adminHeaderProfileName" class="text-sm font-semibold truncate">QH Clothes</span>
        </button>
        <div id="adminAvatarDropdown" class="hidden absolute right-0 mt-2 w-[320px] bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden z-50">
          <div class="p-3 bg-gray-50 border-b border-gray-200">
            <div class="flex items-center gap-3">
              <button type="button" class="avatar-wrap relative w-14 h-14 rounded-full overflow-hidden bg-gray-50 text-gray-700 font-bold text-lg flex items-center justify-center cursor-pointer flex-none">
                <input id="adminAvatarInput" type="file" accept="image/*" class="absolute inset-0 z-20 opacity-0 cursor-pointer" onclick="event.stopPropagation()" onchange="onAdminAvatarSelected(this)">
                <img id="adminMenuAvatarImg" src="" alt="avatar" class="w-full h-full object-cover hidden">
                <span id="adminMenuAvatarFallback">A</span>
                <span class="avatar-edit-overlay"><i class="fas fa-camera text-white text-sm"></i></span>
              </button>
              <div class="min-w-0">
                <p id="adminMenuProfileName" class="text-sm font-semibold text-gray-900 truncate">QH Clothes</p>
                <p id="adminMenuShopCode" class="text-xs text-gray-400 truncate">Shop Code: ADMIN</p>
                <p class="text-xs text-gray-400">Tự bán hàng</p>
              </div>
            </div>
          </div>
          <button type="button" onclick="openChangeAdminPasswordModal(); closeAdminAvatarMenu();" class="w-full text-left px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2">
            <i class="fas fa-key text-amber-500"></i>Thay đổi mật khẩu
          </button>
          <button type="button" onclick="logoutAdminUser(); closeAdminAvatarMenu();" class="w-full text-left px-3 py-2.5 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 border-t border-gray-100">
            <i class="fas fa-right-from-bracket"></i>Logout
          </button>
        </div>
      </div>
    </div>
  </header>

  <!-- DASHBOARD PAGE -->
  <div id="page-dashboard" class="p-6">
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      <div class="stat-card rounded-2xl p-5 text-white" style="--from:#e84393;--to:#c0392b">
        <div class="flex justify-between items-start">
          <div><p class="text-white/80 text-sm">Sản phẩm</p><p id="statProducts" class="text-3xl font-bold mt-1">—</p></div>
          <div class="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center"><i class="fas fa-tshirt"></i></div>
        </div>
      </div>
      <div class="stat-card rounded-2xl p-5 text-white" style="--from:#667eea;--to:#764ba2">
        <div class="flex justify-between items-start">
          <div><p class="text-white/80 text-sm">Đơn hàng</p><p id="statOrders" class="text-3xl font-bold mt-1">—</p></div>
          <div class="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center"><i class="fas fa-shopping-bag"></i></div>
        </div>
      </div>
      <div class="stat-card rounded-2xl p-5 text-white" style="--from:#f093fb;--to:#f5576c">
        <div class="flex justify-between items-start">
          <div><p class="text-white/80 text-sm">Chờ xử lý</p><p id="statPending" class="text-3xl font-bold mt-1">—</p></div>
          <div class="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center"><i class="fas fa-clock"></i></div>
        </div>
      </div>
      <div class="stat-card rounded-2xl p-5 text-white" style="--from:#43e97b;--to:#38f9d7">
        <div class="flex justify-between items-start">
          <div><p class="text-white/80 text-sm">Doanh thu</p><p id="statRevenue" class="text-2xl font-bold mt-1">—</p></div>
          <div class="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center"><i class="fas fa-coins"></i></div>
        </div>
      </div>
    </div>
    
    <div class="bg-white rounded-2xl shadow-sm border p-6">
      <div class="flex items-center justify-between mb-4">
        <h2 class="font-bold text-gray-800">Đơn hàng gần đây</h2>
        <button onclick="showPage('orders')" class="text-pink-500 text-sm hover:underline">Xem tất cả</button>
      </div>
      <div id="recentOrdersTable" class="overflow-x-auto">
        <div class="text-center py-8 text-gray-400"><i class="fas fa-spinner fa-spin text-2xl"></i></div>
      </div>
    </div>
  </div>

  <!-- PRODUCTS PAGE -->
  <div id="page-products" class="p-6 hidden">
    <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
      <div class="flex gap-2 items-center">
        <input type="text" id="productSearch" placeholder="Tìm sản phẩm..." oninput="filterAdminProducts()" 
          class="border rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-pink-400 w-48">
        <select id="productCatFilter" onchange="filterAdminProducts()" class="border rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-pink-400">
          <option value="">Tất cả</option>
          <option value="unisex">Unisex</option>
          <option value="male">Nam</option>
          <option value="female">Nữ</option>
        </select>
      </div>
      <button onclick="openProductModal()" class="btn-pink text-white px-5 py-2.5 rounded-xl font-semibold text-sm flex items-center gap-2">
        <i class="fas fa-plus"></i>Thêm sản phẩm
      </button>
    </div>
    
    <div id="adminProductsGrid" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"></div>
  </div>

  <!-- ORDERS PAGE -->
  <div id="page-orders" class="p-6 hidden">
    <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
      <div class="flex gap-2 flex-wrap items-center">
        <select id="orderStatusFilter" onchange="filterOrders()" class="border rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-pink-400">
          <option value="all">Tất cả trạng thái</option>
          <option value="pending">Chờ xử lý</option>
          <option value="confirmed">Đã xác nhận</option>
          <option value="shipping">Đang giao</option>
          <option value="done">Hoàn thành</option>
          <option value="cancelled">Đã hủy</option>
        </select>
        <input type="text" id="orderSearch" placeholder="Tìm tên/SĐT/mã..." oninput="filterOrders()" 
          class="border rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-pink-400 w-48">
        <button id="ordersModeArrangeBtn" onclick="setOrdersViewMode('to_arrange')" class="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-sm font-semibold inline-flex items-center gap-2 transition">
          <i class="fas fa-truck-loading"></i>
          <span>Sắp xếp vận chuyển</span>
          <span id="ordersToArrangeCount" class="bg-white/20 px-2 py-0.5 rounded-full text-xs">0</span>
        </button>
        <button id="ordersModeWaitingBtn" onclick="setOrdersViewMode('waiting_ship')" class="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-xl text-sm font-semibold inline-flex items-center gap-2 transition border border-gray-200">
          <i class="fas fa-box-open"></i>
          <span>Đang chờ vận chuyển</span>
          <span id="ordersWaitingShipCount" class="bg-gray-200 text-gray-700 px-2 py-0.5 rounded-full text-xs">0</span>
        </button>
      </div>
      <div class="flex items-center gap-2">
        <button onclick="exportExcel()" class="bg-green-600 hover:bg-green-700 text-white px-5 py-2.5 rounded-xl font-semibold text-sm flex items-center gap-2 transition">
          <i class="fas fa-file-excel"></i>Xuất Excel
        </button>
      </div>
    </div>
    
    <div class="bg-white rounded-2xl shadow-sm border overflow-hidden">
      <div class="hidden md:block overflow-x-auto scrollbar-thin">
        <table class="w-full text-sm">
          <thead>
            <tr class="bg-gray-50 border-b">
              <th class="px-4 py-3 text-center font-semibold text-gray-600">
                <input id="ordersSelectAll" type="checkbox" onchange="toggleSelectAllOrders(this.checked)" class="w-4 h-4 rounded border-gray-300 text-pink-500 focus:ring-pink-400">
              </th>
              <th class="px-4 py-3 text-left font-semibold text-gray-600 w-[360px]">Thông tin ĐH</th>
              <th class="px-2 py-3 text-center font-semibold text-gray-600 w-12">SL</th>
              <th class="px-4 py-3 text-right font-semibold text-gray-600">Tổng tiền</th>
              <th class="px-4 py-3 text-center font-semibold text-gray-600 hidden lg:table-cell">Voucher</th>
              <th class="px-4 py-3 text-center font-semibold text-gray-600">Trạng thái</th>
              <th class="px-4 py-3 text-center font-semibold text-gray-600">Thao tác</th>
            </tr>
          </thead>
          <tbody id="ordersTable"></tbody>
        </table>
      </div>
      <div id="ordersMobileList" class="md:hidden divide-y"></div>
      <div id="ordersEmpty" class="hidden text-center py-16 text-gray-400">
        <i class="fas fa-inbox text-4xl mb-3"></i><p>Không có đơn hàng nào</p>
      </div>
    </div>
    <div id="orderStats" class="mt-4 text-sm text-gray-500 text-right"></div>
  </div>

  <div id="ordersBulkActionBar" class="hidden fixed left-1/2 -translate-x-1/2 z-[70]" style="bottom: 200px;">
    <div class="bg-white/95 backdrop-blur border border-gray-200 shadow-2xl rounded-2xl px-3 py-2 flex items-center gap-2">
      <button id="bulkArrangeShipBtn" onclick="arrangeSelectedForShipping()" class="hidden bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl font-semibold text-sm flex items-center gap-2 transition">
        <i class="fas fa-truck-loading"></i><span id="bulkArrangeShipText">Sắp xếp vận chuyển</span>
      </button>
      <button id="bulkDeleteOrdersBtn" onclick="deleteSelectedOrders()" class="hidden bg-red-600 hover:bg-red-700 text-white px-4 py-2.5 rounded-xl font-semibold text-sm flex items-center gap-2 transition">
        <i class="fas fa-trash"></i><span id="bulkDeleteOrdersText">Xoá đã chọn</span>
      </button>
    </div>
  </div>

  <div id="shippingBulkActionBar" class="hidden fixed bottom-5 left-1/2 -translate-x-1/2 z-[70]">
    <div class="bg-white border border-gray-200 shadow-2xl rounded-2xl px-3 py-2 flex items-center gap-2">
      <span id="shippingBulkSelectedText" class="text-sm text-gray-700 px-2">Đã chọn 0 đơn</span>
      <button onclick="printSelectedOrders()" class="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-sm font-semibold transition">
        In đơn hàng loạt
      </button>
    </div>
  </div>

  <!-- VOUCHERS PAGE -->
  <div id="page-vouchers" class="p-6 hidden">
    <div class="grid md:grid-cols-2 gap-6">
      <!-- Create Voucher Form -->
      <div class="bg-white rounded-2xl shadow-sm border p-6">
        <h2 class="font-bold text-gray-800 text-lg mb-5 flex items-center gap-2">
          <i class="fas fa-plus-circle text-pink-500"></i>Tạo Voucher mới
        </h2>
        <form onsubmit="createVoucher(event)" class="space-y-4">
          <div>
            <label class="block text-sm font-semibold text-gray-700 mb-1.5">
              <i class="fas fa-coins text-pink-400 mr-1"></i>Số tiền giảm (VNĐ) *
            </label>
            <input type="number" id="vDiscount" placeholder="VD: 50000" min="1000" required
              class="w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-pink-400">
          </div>
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-sm font-semibold text-gray-700 mb-1.5">
                <i class="fas fa-calendar-check text-pink-400 mr-1"></i>Hiệu lực từ *
              </label>
              <input type="datetime-local" id="vFrom" required
                class="w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-pink-400">
            </div>
            <div>
              <label class="block text-sm font-semibold text-gray-700 mb-1.5">
                <i class="fas fa-calendar-times text-pink-400 mr-1"></i>Hết hạn *
              </label>
              <input type="datetime-local" id="vTo" required
                class="w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-pink-400">
            </div>
          </div>
          <div>
            <label class="block text-sm font-semibold text-gray-700 mb-1.5">
              <i class="fas fa-barcode text-pink-400 mr-1"></i>Mã tuỳ chỉnh <span class="text-gray-400 font-normal">(để trống = tự sinh)</span>
            </label>
            <input type="text" id="vCode" placeholder="VD: SUMMER30"
              class="w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-pink-400 uppercase tracking-wider"
              oninput="this.value=this.value.toUpperCase()">
          </div>
          <div>
            <label class="block text-sm font-semibold text-gray-700 mb-1.5">
              <i class="fas fa-users text-pink-400 mr-1"></i>Giới hạn lượt dùng <span class="text-gray-400 font-normal">(0 = không giới hạn)</span>
            </label>
            <input type="number" id="vLimit" placeholder="0" min="0" value="0"
              class="w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-pink-400">
          </div>
          <button type="submit" id="createVoucherBtn" class="btn-pink w-full text-white py-3 rounded-xl font-bold text-sm">
            <i class="fas fa-magic mr-2"></i>Tạo & Sinh mã Voucher
          </button>
        </form>
        <!-- Generated code display -->
        <div id="generatedCode" class="hidden mt-4 p-4 rounded-2xl bg-gradient-to-r from-pink-50 to-red-50 border border-pink-200 text-center">
          <p class="text-xs text-gray-500 mb-1">Mã voucher vừa tạo:</p>
          <p id="generatedCodeText" class="text-2xl font-bold tracking-widest text-pink-600 font-mono"></p>
          <button onclick="copyCode()" class="mt-2 text-xs text-gray-500 hover:text-pink-500 transition">
            <i class="fas fa-copy mr-1"></i>Sao chép
          </button>
        </div>
      </div>

      <!-- Voucher List -->
      <div class="bg-white rounded-2xl shadow-sm border p-6">
        <div class="flex items-center justify-between mb-4">
          <h2 class="font-bold text-gray-800 text-lg flex items-center gap-2">
            <i class="fas fa-list text-pink-500"></i>Danh sách Voucher
          </h2>
          <button onclick="loadVouchers()" class="text-sm text-pink-500 hover:underline">
            <i class="fas fa-sync-alt mr-1"></i>Làm mới
          </button>
        </div>
        <div id="voucherList" class="space-y-3 max-h-[500px] overflow-y-auto scrollbar-thin pr-1">
          <div class="text-center py-8 text-gray-400"><i class="fas fa-spinner fa-spin text-2xl"></i></div>
        </div>
      </div>
    </div>
  </div>

  <!-- FEATURED PRODUCTS PAGE -->
  <div id="page-featured" class="p-6 hidden">
    <div class="mb-6">
      <div class="flex items-center justify-between mb-2">
        <div>
          <h2 class="font-bold text-gray-800 text-xl flex items-center gap-2">
            <i class="fas fa-star text-amber-400"></i>Quản lý Sản phẩm Nổi Bật
          </h2>
          <p class="text-sm text-gray-500 mt-1">Chọn sản phẩm muốn hiển thị nổi bật và sắp xếp thứ tự. Khi khách bấm vào, sẽ mở modal chi tiết sản phẩm.</p>
        </div>
        <div class="flex items-center gap-3">
          <span id="featuredCount" class="text-sm font-semibold text-amber-600 bg-amber-50 px-3 py-1.5 rounded-xl border border-amber-200">
            <i class="fas fa-star mr-1"></i>0 sản phẩm nổi bật
          </span>
          <button onclick="saveFeaturedOrder()" id="saveFeaturedBtn" class="bg-gradient-to-r from-amber-400 to-orange-400 hover:from-amber-500 hover:to-orange-500 text-white px-5 py-2.5 rounded-xl font-semibold text-sm flex items-center gap-2 transition shadow-sm">
            <i class="fas fa-save"></i>Lưu thứ tự
          </button>
        </div>
      </div>

      <!-- Featured Preview Strip -->
      <div id="featuredPreviewStrip" class="hidden bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-4 mb-4">
        <p class="text-xs font-semibold text-amber-700 uppercase tracking-wider mb-3"><i class="fas fa-eye mr-1"></i>Xem trước thứ tự hiển thị</p>
        <div id="featuredPreviewItems" class="flex gap-3 overflow-x-auto pb-2"></div>
      </div>
    </div>

    <!-- Products Grid for Featured Management -->
    <div class="bg-white rounded-2xl shadow-sm border overflow-hidden">
      <div class="border-b px-6 py-4 flex items-center gap-3 bg-gray-50">
        <i class="fas fa-list text-gray-400"></i>
        <span class="text-sm font-semibold text-gray-700">Tất cả sản phẩm – Tích chọn để đánh dấu nổi bật</span>
        <div class="ml-auto flex gap-2">
          <input type="text" id="featuredSearch" placeholder="Tìm sản phẩm..." oninput="filterFeaturedProducts()"
            class="border rounded-xl px-3 py-1.5 text-sm focus:outline-none focus:border-amber-400 w-44">
        </div>
      </div>
      <div id="featuredProductsList" class="divide-y max-h-[70vh] overflow-y-auto">
        <div class="py-12 text-center text-gray-400"><i class="fas fa-spinner fa-spin text-3xl"></i></div>
      </div>
    </div>
  </div>

  <!-- BANNERS PAGE -->
  <div id="page-settings" class="p-6 hidden">
    <div class="bg-white rounded-2xl shadow-sm border p-4 mb-4">
      <div class="flex items-center gap-2">
        <button type="button" class="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
          <i class="fas fa-warehouse"></i>Cài đặt kho hàng
        </button>
      </div>
    </div>

    <div class="bg-white rounded-2xl shadow-sm border p-6 mb-6">
      <div class="flex flex-wrap items-center justify-between gap-3 mb-5">
        <h2 class="font-bold text-gray-800 text-lg flex items-center gap-2">
          <i class="fas fa-warehouse text-emerald-500"></i>Cài đặt kho lấy hàng GHTK
        </h2>
        <button onclick="syncGhtkPickupAddresses()" id="syncGhtkPickupBtn" class="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-xl text-sm font-medium transition flex items-center gap-2">
          <i class="fas fa-rotate"></i> Đồng bộ kho từ GHTK
        </button>
      </div>
      <p class="text-sm text-gray-500 mb-4">Chọn kho đã tạo trên GHTK để dùng mặc định khi bấm Sắp xếp vận chuyển.</p>
      <div class="grid md:grid-cols-2 gap-4">
        <div class="md:col-span-2">
          <label class="block text-sm font-semibold text-gray-700 mb-1.5">Kho lấy hàng từ GHTK</label>
          <select id="ghtkPickupAddressId" onchange="applySelectedGhtkWarehouse()" class="w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-emerald-400">
            <option value="">-- Chọn kho đồng bộ --</option>
          </select>
          <p id="ghtkPickupHint" class="text-xs text-gray-500 mt-1.5">Nếu chưa thấy kho, bấm "Đồng bộ kho từ GHTK".</p>
        </div>
        <div>
          <label class="block text-sm font-semibold text-gray-700 mb-1.5">Tên người lấy hàng</label>
          <input type="text" id="ghtkPickName" class="w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-emerald-400">
        </div>
        <div>
          <label class="block text-sm font-semibold text-gray-700 mb-1.5">Số điện thoại lấy hàng</label>
          <input type="text" id="ghtkPickTel" class="w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-emerald-400">
        </div>
        <div class="md:col-span-2">
          <label class="block text-sm font-semibold text-gray-700 mb-1.5">Địa chỉ lấy hàng (chi tiết)</label>
          <input type="text" id="ghtkPickAddress" class="w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-emerald-400">
        </div>
        <div>
          <label class="block text-sm font-semibold text-gray-700 mb-1.5">Tỉnh/Thành</label>
          <input type="text" id="ghtkPickProvince" class="w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-emerald-400">
        </div>
        <div>
          <label class="block text-sm font-semibold text-gray-700 mb-1.5">Quận/Huyện</label>
          <input type="text" id="ghtkPickDistrict" class="w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-emerald-400">
        </div>
        <div>
          <label class="block text-sm font-semibold text-gray-700 mb-1.5">Phường/Xã</label>
          <input type="text" id="ghtkPickWard" class="w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-emerald-400">
        </div>
        <div class="md:col-span-2 flex justify-end">
          <button onclick="saveGhtkPickupConfig()" id="saveGhtkPickupBtn" class="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl font-semibold text-sm flex items-center gap-2 transition">
            <i class="fas fa-save"></i>Lưu cấu hình kho GHTK
          </button>
        </div>
      </div>
    </div>
  </div>

</main>

<!-- PRODUCT MODAL -->
<div id="productModal" class="fixed inset-0 modal-overlay z-50 hidden flex items-start justify-center p-4 overflow-y-auto">
  <div class="modal-card bg-white rounded-3xl shadow-2xl w-full max-w-3xl my-4">
    <div class="sticky top-0 bg-white rounded-t-3xl border-b px-6 py-4 flex items-center justify-between">
      <h2 id="modalTitle" class="font-bold text-xl text-gray-900">Thêm sản phẩm mới</h2>
      <button onclick="closeProductModal()" class="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition">
        <i class="fas fa-times text-gray-600"></i>
      </button>
    </div>
    
    <form id="productForm" onsubmit="saveProduct(event)" class="px-6 py-5 space-y-6">
      <input type="hidden" id="productId">
      
      <!-- Basic Info -->
      <div class="grid md:grid-cols-2 gap-4">
        <div class="md:col-span-2">
          <label class="block text-sm font-semibold mb-1.5 text-gray-700">Tên sản phẩm *</label>
          <input type="text" id="pName" required placeholder="VD: Áo thun Unisex Premium" class="w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-pink-400 focus:ring-1 focus:ring-pink-100">
        </div>
        <div class="md:col-span-2">
          <label class="block text-sm font-semibold mb-2 text-gray-700"><i class="fas fa-images text-pink-400 mr-1"></i>Hình ảnh *</label>
          <p class="text-xs text-gray-400 mb-2">Ảnh chính hiển thị ở khung lớn bên trái, ảnh phụ nằm ở các khung nhỏ bên phải.</p>
          <div class="grid md:grid-cols-3 gap-3 items-start">
            <div class="md:col-span-1">
              <div class="img-slot w-full flex flex-col items-center justify-center p-3 min-h-[220px]" id="thumbnailPreviewBox" onclick="document.getElementById('thumbnailInput').click()" ondragover="handleImageDragOver(event)" ondragleave="handleImageDragLeave(event)" ondrop="handleImageDrop(event, 'thumbnail', -1)">
                <img id="thumbnailPreview" src="" alt="" draggable="true" ondragstart="startImageReorderDrag(event, 'thumbnail', -1)" class="w-full h-full object-cover rounded-xl hidden">
                <div id="thumbnailPlaceholder" class="flex flex-col items-center gap-1 text-gray-400">
                  <i class="fas fa-camera text-2xl"></i>
                  <span class="text-sm font-medium">Tải lên ảnh chính</span>
                </div>
              </div>
              <input type="file" id="thumbnailInput" accept="image/*" multiple class="hidden" onchange="handleThumbnailFile(this)">
              <input type="url" id="pThumbnail" placeholder="Dán URL ảnh chính..." class="w-full border rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-pink-400 mt-2" oninput="previewThumbnail(this.value)">
            </div>
            <div class="md:col-span-2">
              <div class="grid grid-cols-2 sm:grid-cols-3 gap-3" id="galleryGrid">
                ${[0, 1, 2, 3, 4, 5, 6, 7, 8].map(i => `
                <div class="img-slot relative flex flex-col items-center justify-center min-h-[102px]" id="slot-${i}" ondragover="handleImageDragOver(event)" ondragleave="handleImageDragLeave(event)" ondrop="handleImageDrop(event, 'gallery', ${i})">
                  <img id="galleryImg-${i}" src="" alt="" draggable="true" ondragstart="startImageReorderDrag(event, 'gallery', ${i})" class="w-full h-full object-cover rounded-xl hidden absolute inset-0">
                  <div class="flex flex-col items-center gap-1 text-gray-400 text-center p-2" id="slotPlaceholder-${i}">
                    <i class="fas fa-plus text-base"></i>
                    <span class="text-xs">Ảnh ${i + 1}</span>
                  </div>
                  <button type="button" class="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white rounded-full items-center justify-center hidden text-xs z-10"
                    id="slotDel-${i}" onclick="removeGalleryImg(${i})">×</button>
                  <input type="file" accept="image/*" multiple class="hidden" id="galleryFile-${i}" onchange="handleGalleryFile(${i},this)">
                </div>`).join('')}
              </div>
              <p class="text-xs text-gray-400 mt-2">Nhấn vào từng ô để thêm ảnh phụ hoặc dán URL nhanh bên dưới.</p>
              <div class="mt-2 flex gap-2">
                <input type="url" id="galleryUrlInput" placeholder="Dán URL ảnh phụ..." class="flex-1 border rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-pink-400">
                <button type="button" onclick="addGalleryUrl()" class="btn-pink text-white px-4 py-2 rounded-xl text-sm font-semibold">Thêm</button>
              </div>
            </div>
          </div>
        </div>
        <div>
          <label class="block text-sm font-semibold mb-1.5 text-gray-700">Giá bán (VNĐ) *</label>
          <input type="number" id="pPrice" required placeholder="299000" min="0" class="w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-pink-400">
        </div>
        <div>
          <label class="block text-sm font-semibold mb-1.5 text-gray-700">Giá gốc (VNĐ)</label>
          <input type="number" id="pOriginalPrice" placeholder="399000" min="0" class="w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-pink-400">
        </div>
        <div>
          <label class="block text-sm font-semibold mb-1.5 text-gray-700">Danh mục</label>
          <select id="pCategory" class="w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-pink-400">
            <option value="unisex">Unisex</option>
            <option value="male">Nam</option>
            <option value="female">Nữ</option>
          </select>
        </div>
        <div>
          <label class="block text-sm font-semibold mb-1.5 text-gray-700">Thương hiệu</label>
          <input type="text" id="pBrand" placeholder="VD: QH Clothes" class="w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-pink-400">
        </div>
        <div class="md:col-span-2">
          <label class="block text-sm font-semibold mb-1.5 text-gray-700">Chất liệu</label>
          <input type="text" id="pMaterial" placeholder="VD: 100% Cotton Combed" class="w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-pink-400">
        </div>
        <div class="md:col-span-2">
          <label class="block text-sm font-semibold mb-1.5 text-gray-700">Mô tả</label>
          <textarea id="pDescription" rows="3" placeholder="Mô tả chi tiết về sản phẩm..." class="w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-pink-400 resize-none"></textarea>
        </div>
        <div>
          <label class="block text-sm font-semibold mb-1.5 text-gray-700">Số lượng tồn kho</label>
          <input type="number" id="pStock" placeholder="100" min="0" class="w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-pink-400">
        </div>
        <div class="flex items-center gap-6 pt-4">
          <label class="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" id="pFeatured" class="w-4 h-4 accent-pink-500">
            <span class="text-sm font-medium text-gray-700">Sản phẩm nổi bật</span>
          </label>
          <label class="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" id="pTrending" class="w-4 h-4 accent-pink-500">
            <span class="text-sm font-medium text-gray-700">Sản phẩm thịnh hành</span>
          </label>
          <div class="flex items-center gap-2">
            <label for="pTrendingOrder" class="text-sm font-medium text-gray-700 whitespace-nowrap">Vị trí hiển thị</label>
            <select id="pTrendingOrder" class="border rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-pink-400">
              <option value="0">Tự động</option>
              <option value="1">1</option>
              <option value="2">2</option>
              <option value="3">3</option>
              <option value="4">4</option>
              <option value="5">5</option>
              <option value="6">6</option>
              <option value="7">7</option>
              <option value="8">8</option>
              <option value="9">9</option>
              <option value="10">10</option>
              <option value="11">11</option>
              <option value="12">12</option>
            </select>
          </div>
          <label class="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" id="pActive" checked class="w-4 h-4 accent-pink-500">
            <span class="text-sm font-medium text-gray-700">Hiển thị</span>
          </label>
        </div>
      </div>
      <!-- Colors -->
      <div>
        <label class="block text-sm font-semibold mb-2 text-gray-700"><i class="fas fa-palette text-pink-400 mr-1"></i>Màu sắc</label>
        <div id="colorOptionsEditor" class="space-y-2"></div>
        <button type="button" onclick="addColorOptionRow()" class="mt-2 inline-flex items-center gap-2 text-sm font-semibold text-gray-600 hover:text-pink-600 transition">
          <i class="fas fa-plus"></i>Thêm lựa chọn
        </button>
      </div>
      
      <!-- Sizes -->
      <div>
        <label class="block text-sm font-semibold mb-2 text-gray-700"><i class="fas fa-ruler text-pink-400 mr-1"></i>Size số</label>
        <div class="flex flex-wrap gap-2 mb-2">
          <button type="button" onclick="addPresetSizes(['XS','S','M','L','XL','XXL'])" class="px-3 py-1.5 border rounded-lg text-xs text-gray-600 hover:border-pink-400 hover:text-pink-600 transition">+ XS→XXL</button>
          <button type="button" onclick="addPresetSizes(['28','29','30','31','32','33','34'])" class="px-3 py-1.5 border rounded-lg text-xs text-gray-600 hover:border-pink-400 hover:text-pink-600 transition">+ Size quần</button>
          <button type="button" onclick="addPresetSizes(['35','36','37','38','39','40','41','42'])" class="px-3 py-1.5 border rounded-lg text-xs text-gray-600 hover:border-pink-400 hover:text-pink-600 transition">+ Size giày</button>
        </div>
        <div id="sizeTags" class="flex flex-wrap gap-2 mb-2 min-h-[36px]"></div>
        <div class="flex gap-2">
          <input type="text" id="sizeInput" placeholder="VD: S, M, L, XL, 28, 29..." class="flex-1 border rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-pink-400"
            onkeydown="if(event.key==='Enter'){event.preventDefault();addTag('size')}">
          <button type="button" onclick="addTag('size')" class="btn-pink text-white px-4 py-2 rounded-xl text-sm">Thêm</button>
        </div>
      </div>
      
      <div class="flex gap-3 pt-2">
        <button type="button" onclick="closeProductModal()" class="flex-1 border-2 border-gray-200 text-gray-700 py-3 rounded-xl font-semibold hover:bg-gray-50 transition">Huỷ</button>
        <button type="submit" class="flex-1 btn-pink text-white py-3 rounded-xl font-semibold">
          <i class="fas fa-save mr-2"></i><span id="saveBtn">Lưu sản phẩm</span>
        </button>
      </div>
    </form>
  </div>
</div>

<!-- ORDER DETAIL MODAL -->
<div id="orderDetailModal" class="fixed inset-0 modal-overlay z-50 hidden flex items-center justify-center p-4">
  <div class="modal-card bg-white rounded-3xl shadow-2xl w-full max-w-lg">
    <div class="border-b px-6 py-4 flex items-center justify-between">
      <h2 class="font-bold text-xl text-gray-900">Chi tiết đơn hàng</h2>
      <button onclick="document.getElementById('orderDetailModal').classList.add('hidden')" class="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center">
        <i class="fas fa-times"></i>
      </button>
    </div>
    <div id="orderDetailContent" class="px-6 py-4"></div>
  </div>
</div>

<!-- SHIPPING ARRANGE SUCCESS MODAL -->
<div id="arrangeSuccessModal" class="fixed inset-0 modal-overlay z-[80] hidden flex items-center justify-center p-4">
  <div class="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden">
    <div class="px-6 py-4 border-b flex items-center justify-between">
      <h3 class="font-bold text-lg text-gray-900">Sắp xếp vận chuyển</h3>
      <button onclick="closeArrangeSuccessModal()" class="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center">
        <i class="fas fa-times text-gray-600"></i>
      </button>
    </div>
    <div class="px-6 py-6 text-center">
      <div class="mx-auto mb-3 w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
        <i class="fas fa-check text-xl"></i>
      </div>
      <p id="arrangeSuccessText" class="text-gray-800 font-semibold">Đã sắp xếp vận chuyển thành công 0 đơn hàng.</p>
      <button id="arrangeModalPrintBtn" onclick="printArrangedOrdersFromModal()" class="mt-5 bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2.5 rounded-xl font-semibold text-sm inline-flex items-center gap-2 transition">
        <i class="fas fa-print"></i>In đơn
      </button>
      <div id="arrangeFailedWrap" class="hidden mt-4 text-left bg-amber-50 border border-amber-200 rounded-xl p-3">
        <p class="text-xs font-semibold text-amber-700 mb-2">Đơn lỗi khi tạo vận đơn GHTK</p>
        <div id="arrangeFailedList" class="max-h-32 overflow-auto space-y-1 text-xs text-amber-800"></div>
      </div>
    </div>
  </div>
</div>

<!-- CHANGE ADMIN PASSWORD MODAL -->
<div id="adminChangePasswordModal" onclick="if(event.target===this) closeChangeAdminPasswordModal()" style="display:none" class="fixed inset-0 modal-overlay z-50 items-start justify-center p-4 overflow-y-auto">
  <div class="modal-card bg-white rounded-3xl shadow-2xl w-full max-w-md my-8">
    <div class="sticky top-0 bg-white rounded-t-3xl border-b px-6 py-4 flex items-center justify-between">
      <h2 class="font-bold text-lg text-gray-900">Thay đổi mật khẩu</h2>
      <button onclick="closeChangeAdminPasswordModal()" class="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition">
        <i class="fas fa-times text-gray-600"></i>
      </button>
    </div>
    <form onsubmit="submitAdminPasswordChange(event)" class="px-6 py-5 space-y-4">
      <div>
        <label class="block text-sm font-semibold text-gray-700 mb-1.5">Mật khẩu hiện tại</label>
        <input type="password" id="adminOldPassword" required class="w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-pink-400">
      </div>
      <div>
        <label class="block text-sm font-semibold text-gray-700 mb-1.5">Mật khẩu mới</label>
        <input type="password" id="adminNewPassword" required minlength="6" maxlength="64" class="w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-pink-400">
      </div>
      <div>
        <label class="block text-sm font-semibold text-gray-700 mb-1.5">Nhập lại mật khẩu mới</label>
        <input type="password" id="adminConfirmPassword" required minlength="6" maxlength="64" class="w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-pink-400">
      </div>
      <div class="pt-1 flex justify-end gap-3">
        <button type="button" onclick="closeChangeAdminPasswordModal()" class="px-4 py-2.5 rounded-xl border text-gray-600 font-medium hover:bg-gray-50 transition">Hủy</button>
        <button type="submit" id="adminChangePasswordBtn" class="bg-pink-500 hover:bg-pink-600 text-white px-5 py-2.5 rounded-xl font-semibold text-sm transition">
          Cập nhật mật khẩu
        </button>
      </div>
    </form>
  </div>
</div>

<!-- TOAST -->
<div id="adminToast" class="fixed top-6 right-6 z-50 flex flex-col gap-2 pointer-events-none"></div>

<script>
// ── STATE ─────────────────────────────────────────
let adminProducts = []
let adminOrders = []
let selectedOrderIds = new Set()
let filteredAdminOrders = []
let ordersViewMode = 'to_arrange'
let arrangedOrdersForPrint = []
let arrangedFailedOrders = []
let colors = []
let sizes = []
let galleryImages = ['','','','','','','','','']
let editingId = null
let gallerySlotClickBound = false
let ghtkPickupAddresses = []
let adminProfile = null
let adminAvatarMenuOpen = false
let settingsSubmenuOpen = false
let settingsActiveSubPage = ''
let selectedColorImage = ''
const MAX_PRODUCT_PAYLOAD_SIZE = 1200000

// ── NAVIGATION ────────────────────────────────────
function getInitialFromName(name) {
  const text = String(name || '').trim()
  if (!text) return 'A'
  return text.charAt(0).toUpperCase()
}

function applyAdminAvatarUI() {
  const rawAvatar = String(adminProfile?.avatar || '').trim()
  const lowerAvatar = rawAvatar.toLowerCase()
  const avatar = ['null', 'undefined', 'none'].includes(lowerAvatar) ? '' : rawAvatar
  const name = String(adminProfile?.name || 'QH Clothes').trim() || 'QH Clothes'
  const adminKey = String(adminProfile?.adminUserKey || 'admin').trim().toUpperCase()

  const bindAvatarImg = (img, fallback) => {
    if (!img || !fallback || img.dataset.bound === '1') return
    img.dataset.bound = '1'
    img.addEventListener('load', () => {
      if (!img.src) return
      if (img.naturalWidth <= 1 && img.naturalHeight <= 1) {
        img.classList.add('hidden')
        fallback.classList.remove('hidden')
        return
      }
      img.classList.remove('hidden')
      fallback.classList.add('hidden')
    })
    img.addEventListener('error', () => {
      img.classList.add('hidden')
      fallback.classList.remove('hidden')
    })
  }

  const syncAvatar = (imgId, fallbackId) => {
    const img = document.getElementById(imgId)
    const fallback = document.getElementById(fallbackId)
    if (!img || !fallback) return
    bindAvatarImg(img, fallback)
    fallback.textContent = getInitialFromName(name)
    if (avatar) {
      img.src = avatar
      img.classList.remove('hidden')
      fallback.classList.add('hidden')
    } else {
      img.src = ''
      img.classList.add('hidden')
      fallback.classList.remove('hidden')
    }
  }

  syncAvatar('adminHeaderAvatarImg', 'adminHeaderAvatarFallback')
  syncAvatar('adminMenuAvatarImg', 'adminMenuAvatarFallback')

  const headerName = document.getElementById('adminHeaderProfileName')
  if (headerName) headerName.textContent = name
  const menuName = document.getElementById('adminMenuProfileName')
  if (menuName) menuName.textContent = name
  const menuCode = document.getElementById('adminMenuShopCode')
  if (menuCode) menuCode.textContent = 'Shop Code: ' + adminKey
}

function applyAvatarSrcDirect(dataUrl) {
  const ids = [
    ['adminHeaderAvatarImg', 'adminHeaderAvatarFallback'],
    ['adminMenuAvatarImg', 'adminMenuAvatarFallback']
  ]
  ids.forEach(([imgId, fbId]) => {
    const img = document.getElementById(imgId)
    const fallback = document.getElementById(fbId)
    if (!img || !fallback) return
    if (!dataUrl) {
      img.src = ''
      img.classList.add('hidden')
      fallback.classList.remove('hidden')
      return
    }
    img.src = dataUrl
    img.classList.remove('hidden')
    fallback.classList.add('hidden')
  })
}

async function loadAdminProfile() {
  try {
    const res = await axios.get('/api/admin/profile')
    adminProfile = res.data?.data || null
    applyAdminAvatarUI()
  } catch (_) {
    // keep default avatar fallback
  }
}

function closeAdminAvatarMenu() {
  adminAvatarMenuOpen = false
  const menu = document.getElementById('adminAvatarDropdown')
  if (menu) menu.classList.add('hidden')
}

function toggleAdminAvatarMenu() {
  adminAvatarMenuOpen = !adminAvatarMenuOpen
  const menu = document.getElementById('adminAvatarDropdown')
  if (menu) menu.classList.toggle('hidden', !adminAvatarMenuOpen)
}

function sanitizeAdminOverlayState() {
  const modalIds = ['productModal', 'orderDetailModal', 'arrangeSuccessModal']
  modalIds.forEach((id) => {
    const el = document.getElementById(id)
    if (el) el.classList.add('hidden')
  })
  closeChangeAdminPasswordModal()
  closeAdminAvatarMenu()
  syncSidebarOverlay()
  document.body.style.overflow = ''
}

function openChangeAdminPasswordModal() {
  const modal = document.getElementById('adminChangePasswordModal')
  if (modal) modal.style.display = 'flex'
  const oldInput = document.getElementById('adminOldPassword')
  if (oldInput) setTimeout(() => oldInput.focus(), 0)
}

function closeChangeAdminPasswordModal() {
  const modal = document.getElementById('adminChangePasswordModal')
  if (modal) modal.style.display = 'none'
  const formIds = ['adminOldPassword', 'adminNewPassword', 'adminConfirmPassword']
  formIds.forEach((id) => {
    const el = document.getElementById(id)
    if (el) el.value = ''
  })
}

async function submitAdminPasswordChange(e) {
  e.preventDefault()
  const oldPassword = String(document.getElementById('adminOldPassword')?.value || '')
  const newPassword = String(document.getElementById('adminNewPassword')?.value || '')
  const confirmPassword = String(document.getElementById('adminConfirmPassword')?.value || '')
  if (newPassword.length < 6) {
    showAdminToast('Mật khẩu mới tối thiểu 6 ký tự', 'error')
    return
  }
  if (newPassword !== confirmPassword) {
    showAdminToast('Nhập lại mật khẩu chưa khớp', 'error')
    return
  }
  const btn = document.getElementById('adminChangePasswordBtn')
  btn.disabled = true
  btn.textContent = 'Đang cập nhật...'
  try {
    await axios.put('/api/admin/profile/password', {
      old_password: oldPassword,
      new_password: newPassword
    })
    showAdminToast('Đã đổi mật khẩu thành công', 'success')
    closeChangeAdminPasswordModal()
  } catch (err) {
    const msg = err.response?.data?.error || 'Đổi mật khẩu thất bại'
    showAdminToast(msg, 'error')
  } finally {
    btn.disabled = false
    btn.textContent = 'Cập nhật mật khẩu'
  }
}

async function logoutAdminUser() {
  try { await axios.post('/api/auth/logout') } catch (_) {}
  window.location.href = '/admin/login'
}

function readImageAsDataURL(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result || ''))
    reader.onerror = () => reject(new Error('FILE_READ_FAILED'))
    reader.readAsDataURL(file)
  })
}

function loadImageElement(src) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('IMAGE_LOAD_FAILED'))
    img.src = src
  })
}

async function compressAvatarDataUrl(dataUrl, maxSide = 512, quality = 0.85) {
  const img = await loadImageElement(dataUrl)
  const scale = Math.min(1, maxSide / Math.max(img.width || 1, img.height || 1))
  const w = Math.max(1, Math.round((img.width || 1) * scale))
  const h = Math.max(1, Math.round((img.height || 1) * scale))
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')
  if (!ctx) return dataUrl
  ctx.drawImage(img, 0, 0, w, h)
  return canvas.toDataURL('image/jpeg', quality)
}

function triggerAdminAvatarPicker(evt) {
  if (evt) evt.stopPropagation()
  const input = document.getElementById('adminAvatarInput')
  if (input) input.click()
}

async function onAdminAvatarSelected(inputOrEvent) {
  const input = inputOrEvent?.target || inputOrEvent
  const file = input?.files?.[0]
  if (!file) return
  await handleAdminAvatarFile(file)
  input.value = ''
}

async function handleAdminAvatarFile(file) {
  const mimeType = String(file.type || '').toLowerCase()
  if (!mimeType.startsWith('image/')) {
    showAdminToast('Vui lòng chọn file ảnh', 'error')
    return
  }
  try {
    const rawDataUrl = await readImageAsDataURL(file)
    let dataUrl = await compressAvatarDataUrl(rawDataUrl, 512, 0.85)
    if (dataUrl.length > 700000) dataUrl = await compressAvatarDataUrl(rawDataUrl, 448, 0.8)
    if (dataUrl.length > 700000) dataUrl = await compressAvatarDataUrl(rawDataUrl, 384, 0.75)
    if (dataUrl.length > 700000) dataUrl = await compressAvatarDataUrl(rawDataUrl, 320, 0.7)
    if (!dataUrl.startsWith('data:image/')) {
      showAdminToast('File ảnh không hợp lệ', 'error')
      return
    }
    if (dataUrl.length > 700000) {
      showAdminToast('Ảnh quá lớn, vui lòng chọn ảnh nhỏ hơn', 'error')
      return
    }
    const prevAvatar = String(adminProfile?.avatar || '').trim()
    adminProfile = { ...(adminProfile || {}), avatar: dataUrl }
    applyAdminAvatarUI()
    try {
      const res = await axios.put('/api/admin/profile/avatar', { avatar: dataUrl })
      adminProfile = res.data?.data || adminProfile
      applyAdminAvatarUI()
      applyAvatarSrcDirect(String(adminProfile?.avatar || dataUrl))
      loadAdminProfile()
      showAdminToast('Đã cập nhật avatar', 'success')
    } catch (e) {
      adminProfile = { ...(adminProfile || {}), avatar: prevAvatar }
      applyAdminAvatarUI()
      const msg = e.response?.data?.error || 'Lưu avatar thất bại'
      showAdminToast(msg, 'error')
    }
  } catch (_) {
    showAdminToast('Không đọc được ảnh, vui lòng thử lại', 'error')
  }
}

function showPage(name) {
  ['dashboard','products','orders','vouchers','featured','settings'].forEach(p => {
    const section = document.getElementById('page-'+p)
    if (section) section.classList.toggle('hidden', p !== name)
  })
  document.querySelectorAll('.nav-item').forEach(b => b.classList.remove('active'))
  const mainBtn = document.querySelector('.nav-item[data-page="' + name + '"]')
  if (mainBtn) mainBtn.classList.add('active')
  document.querySelectorAll('.nav-sub-item').forEach(b => {
    b.classList.toggle('active', b.dataset.subPage === settingsActiveSubPage)
  })
  if (name === 'settings') {
    const settingsBtn = document.getElementById('settingsMenuBtn')
    if (settingsBtn) settingsBtn.classList.add('active')
    setSettingsSubmenuOpen(true)
  } else {
    setSettingsSubmenuOpen(false)
    settingsActiveSubPage = ''
    document.querySelectorAll('.nav-sub-item').forEach(b => b.classList.remove('active'))
  }
  const titles = {dashboard:'Dashboard', products:'Quản lý Sản phẩm', orders:'Quản lý Đơn hàng', vouchers:'Quản lý Voucher', featured:'Sản phẩm Nổi Bật', settings:'Cài đặt'}
  document.getElementById('pageTitle').textContent = titles[name] || name

  if (name === 'dashboard') loadDashboard()
  else if (name === 'products') loadAdminProducts()
  else if (name === 'orders') loadAdminOrders()
  else if (name === 'vouchers') loadVouchers()
  else if (name === 'featured') loadFeaturedAdmin()
  else if (name === 'settings') loadSettingsAdmin()

  if (name !== 'orders') {
    const bulkBar = document.getElementById('ordersBulkActionBar')
    const shipBar = document.getElementById('shippingBulkActionBar')
    if (bulkBar) bulkBar.classList.add('hidden')
    if (shipBar) shipBar.classList.add('hidden')
  }

  // Close mobile sidebar
  document.getElementById('sidebar').classList.add('-translate-x-full')
  document.getElementById('sidebarOverlay').classList.add('hidden')
}

function toggleSidebar() {
  document.getElementById('sidebar').classList.toggle('-translate-x-full')
  syncSidebarOverlay()
}

function syncSidebarOverlay() {
  const sidebar = document.getElementById('sidebar')
  const overlay = document.getElementById('sidebarOverlay')
  if (!sidebar || !overlay) return
  const isDesktop = window.matchMedia && window.matchMedia('(min-width: 768px)').matches
  const sidebarOpen = !sidebar.classList.contains('-translate-x-full')
  if (isDesktop) {
    overlay.style.display = 'none'
    overlay.classList.add('hidden')
    overlay.style.pointerEvents = 'none'
    return
  }
  if (sidebarOpen) {
    overlay.style.display = 'block'
    overlay.classList.remove('hidden')
    overlay.style.pointerEvents = ''
  } else {
    overlay.style.display = 'none'
    overlay.classList.add('hidden')
    overlay.style.pointerEvents = 'none'
  }
}

function setSettingsSubmenuOpen(open) {
  settingsSubmenuOpen = !!open
  const submenu = document.getElementById('settingsSubmenu')
  const chevron = document.getElementById('settingsMenuChevron')
  if (submenu) submenu.classList.toggle('hidden', !settingsSubmenuOpen)
  if (chevron) chevron.classList.toggle('rotate-180', settingsSubmenuOpen)
}

function toggleSettingsMenu() {
  setSettingsSubmenuOpen(!settingsSubmenuOpen)
}

function openSettingsWarehouse() {
  settingsActiveSubPage = 'settings-warehouse'
  setSettingsSubmenuOpen(true)
  showPage('settings')
}

// ── FEATURED PRODUCTS ────────────────────────────
let allProductsForFeatured = []
let featuredOrderMap = {} // { productId: displayOrder }

async function loadFeaturedAdmin() {
  const listEl = document.getElementById('featuredProductsList')
  listEl.innerHTML = '<div class="py-12 text-center text-gray-400"><i class="fas fa-spinner fa-spin text-3xl"></i></div>'
  try {
    const res = await axios.get('/api/admin/products')
    allProductsForFeatured = res.data.data || []
    // Build orderMap from existing data
    featuredOrderMap = {}
    allProductsForFeatured.forEach(p => {
      if (p.is_featured) featuredOrderMap[p.id] = p.display_order || 0
    })
    renderFeaturedProductsList(allProductsForFeatured)
    updateFeaturedPreview()
  } catch(e) {
    listEl.innerHTML = '<div class="py-12 text-center text-red-400">Lỗi tải dữ liệu</div>'
  }
}

function filterFeaturedProducts() {
  const q = document.getElementById('featuredSearch').value.toLowerCase()
  const filtered = allProductsForFeatured.filter(p =>
    !q || p.name.toLowerCase().includes(q) || (p.brand||'').toLowerCase().includes(q)
  )
  renderFeaturedProductsList(filtered)
}

function renderFeaturedProductsList(products) {
  const listEl = document.getElementById('featuredProductsList')
  if (!products.length) {
    listEl.innerHTML = '<div class="py-12 text-center text-gray-400"><i class="fas fa-box-open text-4xl mb-3"></i><p>Không có sản phẩm nào</p></div>'
    return
  }

  // Sort: featured first (by display_order), then non-featured
  const sorted = [...products].sort((a,b) => {
    if (a.is_featured && !b.is_featured) return -1
    if (!a.is_featured && b.is_featured) return 1
    return (a.display_order||0) - (b.display_order||0)
  })

  listEl.innerHTML = sorted.map(p => {
    const isFeatured = !!p.is_featured
    const order = featuredOrderMap[p.id] ?? (p.display_order || 0)
    return \`
    <div class="featured-product-row flex items-center gap-4 px-5 py-4 hover:bg-gray-50 transition \${isFeatured ? 'bg-amber-50/60 border-l-4 border-amber-400' : ''}" data-id="\${p.id}">
      <!-- Checkbox -->
      <div class="flex-none">
        <label class="relative inline-flex items-center cursor-pointer">
          <input type="checkbox" \${isFeatured ? 'checked' : ''} onchange="toggleFeaturedCheck(\${p.id}, this.checked)"
            class="sr-only peer">
          <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-400"></div>
        </label>
      </div>
      <!-- Thumbnail -->
      <div class="flex-none">
        <img src="\${p.thumbnail || 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=80'}" alt="\${p.name}"
          class="w-14 h-16 object-cover rounded-xl shadow-sm border-2 \${isFeatured ? 'border-amber-300' : 'border-gray-200'}"
          onerror="this.src='https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=80'">
      </div>
      <!-- Info -->
      <div class="flex-1 min-w-0">
        <div class="flex items-center gap-2">
          \${isFeatured ? '<span class="text-xs bg-amber-400 text-white px-2 py-0.5 rounded-full font-semibold">⭐ Nổi bật</span>' : ''}
          \${p.brand ? \`<span class="text-xs text-pink-500 font-medium">\${p.brand}</span>\` : ''}
        </div>
        <p class="font-semibold text-gray-800 text-sm mt-0.5 truncate">\${p.name}</p>
        <p class="text-xs text-pink-600 font-bold">\${new Intl.NumberFormat('vi-VN',{style:'currency',currency:'VND'}).format(p.price)}</p>
      </div>
      <!-- Order Input (only if featured) -->
      <div class="flex-none w-32 \${isFeatured ? '' : 'opacity-30 pointer-events-none'}">
        <label class="block text-xs text-gray-500 mb-1 text-center">Thứ tự</label>
        <input type="number" min="1" max="99" value="\${order || 1}"
          id="order-\${p.id}"
          onchange="updateFeaturedOrder(\${p.id}, this.value)"
          class="w-full border-2 border-amber-200 rounded-xl px-3 py-1.5 text-sm text-center font-bold focus:outline-none focus:border-amber-400 bg-white">
      </div>
      <!-- Badge Status -->
      <div class="flex-none">
        <span class="text-xs px-2 py-1 rounded-full \${p.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}">
          \${p.is_active ? '● Đang bán' : '○ Đã ẩn'}
        </span>
      </div>
    </div>\`
  }).join('')
}

function toggleFeaturedCheck(id, checked) {
  // Update local state
  const prod = allProductsForFeatured.find(p => p.id === id)
  if (prod) prod.is_featured = checked ? 1 : 0
  
  if (checked) {
    // Auto-assign next order if not set
    const maxOrder = Math.max(0, ...Object.values(featuredOrderMap))
    featuredOrderMap[id] = maxOrder + 1
  } else {
    delete featuredOrderMap[id]
  }
  
  // Re-render
  const q = document.getElementById('featuredSearch').value.toLowerCase()
  const filtered = q ? allProductsForFeatured.filter(p => p.name.toLowerCase().includes(q) || (p.brand||'').toLowerCase().includes(q)) : allProductsForFeatured
  renderFeaturedProductsList(filtered)
  updateFeaturedPreview()
}

function updateFeaturedOrder(id, val) {
  featuredOrderMap[id] = parseInt(val) || 1
  updateFeaturedPreview()
}

function updateFeaturedPreview() {
  const featured = allProductsForFeatured
    .filter(p => p.is_featured)
    .sort((a,b) => (featuredOrderMap[a.id]||0) - (featuredOrderMap[b.id]||0))

  const countEl = document.getElementById('featuredCount')
  countEl.innerHTML = \`<i class="fas fa-star mr-1"></i>\${featured.length} sản phẩm nổi bật\`

  const strip = document.getElementById('featuredPreviewStrip')
  const previewItems = document.getElementById('featuredPreviewItems')

  if (!featured.length) {
    strip.classList.add('hidden')
    return
  }
  strip.classList.remove('hidden')
  previewItems.innerHTML = featured.map((p, i) => \`
    <div class="flex-none flex flex-col items-center gap-1" style="min-width:72px">
      <div class="relative">
        <img src="\${p.thumbnail || 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=80'}" alt="\${p.name}"
          class="w-16 h-20 object-cover rounded-xl border-2 border-amber-300 shadow-sm"
          onerror="this.src='https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=80'">
        <span class="absolute -top-1 -left-1 w-5 h-5 bg-amber-400 text-white text-xs font-bold rounded-full flex items-center justify-center">\${i+1}</span>
      </div>
      <p class="text-xs text-gray-600 text-center leading-tight w-16 truncate">\${p.name}</p>
    </div>
  \`).join('')
}

async function saveFeaturedOrder() {
  const btn = document.getElementById('saveFeaturedBtn')
  btn.disabled = true
  btn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Đang lưu...'
  
  try {
    const promises = allProductsForFeatured.map(p => {
      const isFeatured = !!p.is_featured
      const order = featuredOrderMap[p.id] || 0
      return axios.patch('/api/admin/products/' + p.id + '/featured', {
        is_featured: isFeatured,
        display_order: order
      })
    })
    await Promise.all(promises)
    showAdminToast('Đã lưu sản phẩm nổi bật thành công!', 'success')
    loadFeaturedAdmin()
  } catch(e) {
    showAdminToast('Lỗi lưu dữ liệu: ' + (e.response?.data?.error || e.message), 'error')
  } finally {
    btn.disabled = false
    btn.innerHTML = '<i class="fas fa-save"></i>Lưu thứ tự'
  }
}

// ── BANNERS ──────────────────────────────────────
async function loadSettingsAdmin() {
  try {
    const pickupRes = await axios.get('/api/admin/ghtk/pickup-config')
    const pickupCfg = pickupRes.data.data || {}
    fillGhtkPickupConfig(pickupCfg)
    await syncGhtkPickupAddresses(true, pickupCfg.pickAddressId || '')
  } catch (e) {
    showAdminToast('Lỗi tải dữ liệu cài đặt kho GHTK', 'error')
  }
}

function fillGhtkPickupConfig(cfg) {
  document.getElementById('ghtkPickupAddressId').value = cfg.pickAddressId || ''
  document.getElementById('ghtkPickName').value = cfg.pickName || ''
  document.getElementById('ghtkPickTel').value = cfg.pickTel || ''
  document.getElementById('ghtkPickAddress').value = cfg.pickAddress || ''
  document.getElementById('ghtkPickProvince').value = cfg.pickProvince || ''
  document.getElementById('ghtkPickDistrict').value = cfg.pickDistrict || ''
  document.getElementById('ghtkPickWard').value = cfg.pickWard || ''
}

function renderGhtkPickupAddressOptions(selectedId = '') {
  const select = document.getElementById('ghtkPickupAddressId')
  if (!select) return
  const options = ['<option value="">-- Chọn kho đồng bộ --</option>']
  ghtkPickupAddresses.forEach(item => {
    const text = [item.pick_name || 'Kho', item.full_address || '', item.pick_tel || ''].filter(Boolean).join(' | ')
    options.push('<option value="' + (item.pick_address_id || '') + '">' + text + '</option>')
  })
  select.innerHTML = options.join('')
  select.value = selectedId || ''
}

function applySelectedGhtkWarehouse() {
  const selectedId = document.getElementById('ghtkPickupAddressId').value
  if (!selectedId) return
  const found = ghtkPickupAddresses.find(item => String(item.pick_address_id) === String(selectedId))
  if (!found) return
  if (found.pick_name) document.getElementById('ghtkPickName').value = found.pick_name
  if (found.pick_tel) document.getElementById('ghtkPickTel').value = found.pick_tel
  if (found.pick_address) document.getElementById('ghtkPickAddress').value = found.pick_address
  if (found.pick_province) document.getElementById('ghtkPickProvince').value = found.pick_province
  if (found.pick_district) document.getElementById('ghtkPickDistrict').value = found.pick_district
  if (found.pick_ward) document.getElementById('ghtkPickWard').value = found.pick_ward
}

async function syncGhtkPickupAddresses(silent = false, selectedId = '') {
  const btn = document.getElementById('syncGhtkPickupBtn')
  const currentSelected = selectedId || document.getElementById('ghtkPickupAddressId').value
  btn.disabled = true
  btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Đang đồng bộ...'
  try {
    const res = await axios.get('/api/admin/ghtk/pickup-addresses')
    ghtkPickupAddresses = res.data.data || []
    renderGhtkPickupAddressOptions(currentSelected)
    document.getElementById('ghtkPickupHint').textContent = ghtkPickupAddresses.length
      ? ('Đã đồng bộ ' + ghtkPickupAddresses.length + ' kho từ GHTK.')
      : 'Chưa tìm thấy kho trên GHTK.'
    if (!silent) showAdminToast('Đã đồng bộ kho GHTK', 'success')
  } catch (e) {
    const msg = e.response?.data?.error || e.message || 'SYNC_GHTK_FAILED'
    if (!silent) showAdminToast('Đồng bộ kho thất bại: ' + msg, 'error')
    document.getElementById('ghtkPickupHint').textContent = 'Không đồng bộ được kho từ GHTK: ' + msg
  } finally {
    btn.disabled = false
    btn.innerHTML = '<i class="fas fa-rotate"></i> Đồng bộ kho từ GHTK'
  }
}

async function saveGhtkPickupConfig() {
  const btn = document.getElementById('saveGhtkPickupBtn')
  const payload = {
    pick_address_id: document.getElementById('ghtkPickupAddressId').value.trim(),
    pick_name: document.getElementById('ghtkPickName').value.trim(),
    pick_tel: document.getElementById('ghtkPickTel').value.trim(),
    pick_address: document.getElementById('ghtkPickAddress').value.trim(),
    pick_province: document.getElementById('ghtkPickProvince').value.trim(),
    pick_district: document.getElementById('ghtkPickDistrict').value.trim(),
    pick_ward: document.getElementById('ghtkPickWard').value.trim()
  }
  btn.disabled = true
  btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Đang lưu...'
  try {
    await axios.put('/api/admin/ghtk/pickup-config', payload)
    showAdminToast('Đã lưu cấu hình kho GHTK', 'success')
  } catch (e) {
    showAdminToast('Lưu cấu hình kho thất bại', 'error')
  } finally {
    btn.disabled = false
    btn.innerHTML = '<i class="fas fa-save"></i>Lưu cấu hình kho GHTK'
  }
}


// ── DASHBOARD ─────────────────────────────────────
async function loadDashboard() {
  try {
    const res = await axios.get('/api/admin/stats')
    const d = res.data.data
    document.getElementById('statProducts').textContent = d.totalProducts
    document.getElementById('statOrders').textContent = d.totalOrders
    document.getElementById('statPending').textContent = d.pendingOrders
    document.getElementById('statRevenue').textContent = fmtPrice(d.revenue)
    
    if (d.pendingOrders > 0) {
      document.getElementById('pendingBadge').textContent = d.pendingOrders
      document.getElementById('pendingBadge').classList.remove('hidden')
    }
    
    const recent = (d.recentOrders || []).filter(o => !isInternalTestOrder(o))
    if (!recent.length) {
      document.getElementById('recentOrdersTable').innerHTML = '<div class="text-center py-8 text-gray-400">Chưa có đơn hàng nào</div>'
      return
    }
    document.getElementById('recentOrdersTable').innerHTML = '<table class="w-full text-sm"><thead><tr class="border-b text-gray-500"><th class="py-2 text-left pr-4">Mã ĐH</th><th class="py-2 text-left pr-4">Khách hàng</th><th class="py-2 text-right pr-4">Còn phải thu</th><th class="py-2 text-center">Trạng thái</th></tr></thead><tbody>' +
      recent.map(o => '<tr class="border-b last:border-0"><td class="py-2 pr-4 font-mono text-xs text-blue-600">' + o.order_code + '</td><td class="py-2 pr-4">' + displayCustomerName(o.customer_name) + '</td><td class="py-2 pr-4 text-right font-semibold">' + fmtPrice(getOrderAmountDue(o)) + '</td><td class="py-2 text-center"><span class="badge badge-' + o.status + '">' + statusLabel(o.status) + '</span></td></tr>').join('') +
      '</tbody></table>'
  } catch(e) {
    if (e && e.response && e.response.status === 401) {
      showAdminToast('Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại', 'error')
      setTimeout(() => { window.location.href = '/admin/login' }, 400)
      return
    }
    document.getElementById('recentOrdersTable').innerHTML = '<div class="text-center py-8 text-red-400">Lỗi tải dữ liệu dashboard</div>'
    console.error(e)
  }
}

// ── PRODUCTS ─────────────────────────────────────
async function loadAdminProducts() {
  const grid = document.getElementById('adminProductsGrid')
  grid.innerHTML = '<div class="col-span-4 text-center py-12 text-gray-400"><i class="fas fa-spinner fa-spin text-3xl"></i></div>'
  try {
    const res = await axios.get('/api/admin/products')
    adminProducts = res.data.data || []
    renderAdminProducts(adminProducts)
  } catch(e) {
    if (e && e.response && e.response.status === 401) {
      showAdminToast('Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại', 'error')
      setTimeout(() => { window.location.href = '/admin/login' }, 400)
      return
    }
    const msg = e?.response?.data?.error || e?.message || 'Lỗi tải dữ liệu'
    grid.innerHTML = '<div class="col-span-4 text-center py-12 text-red-400">Lỗi tải dữ liệu</div>'
    showAdminToast(msg, 'error')
    console.error('loadAdminProducts error:', e)
  }
}

function filterAdminProducts() {
  const q = document.getElementById('productSearch').value.toLowerCase()
  const cat = document.getElementById('productCatFilter').value
  const filtered = adminProducts.filter(p => 
    (!q || p.name.toLowerCase().includes(q) || (p.brand||'').toLowerCase().includes(q)) &&
    (!cat || p.category === cat)
  )
  renderAdminProducts(filtered)
}

function renderAdminProducts(products) {
  const grid = document.getElementById('adminProductsGrid')
  const safeProducts = (Array.isArray(products) ? products : []).filter(Boolean)
  if (!safeProducts.length) {
    grid.innerHTML = '<div class="col-span-4 text-center py-12 text-gray-400"><i class="fas fa-box-open text-4xl mb-3"></i><p>Không có sản phẩm</p></div>'
    return
  }
  grid.innerHTML = safeProducts.map(raw => {
    const p = raw || {}
    const name = String(p.name || 'Sản phẩm')
    const brand = String(p.brand || '').trim()
    const thumbnail = String(p.thumbnail || '').trim() || 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400'
    const colors = getProductColorOptions(p).map((c) => c.name)
    const sizes = safeJson(p.sizes)
    return \`
    <div class="bg-white rounded-2xl shadow-sm border overflow-hidden \${!p.is_active ? 'opacity-60' : ''}">
      <div class="relative h-48 bg-gray-100 overflow-hidden">
        <img src="\${thumbnail}" alt="\${name}" 
          class="w-full h-full object-cover" onerror="this.src='https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400'">
        <div class="absolute top-2 left-2 flex gap-1">
          <span class="px-2 py-0.5 rounded-full text-xs font-semibold bg-white/90 text-gray-700">\${catLabel(p.category)}</span>
          \${p.is_featured ? '<span class="px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-400 text-white">⭐ Hot</span>' : ''}
          \${p.is_trending ? '<span class="px-2 py-0.5 rounded-full text-xs font-semibold bg-rose-500 text-white">🔥 Trend</span>' : ''}
          \${p.is_trending && (p.trending_order||0) > 0 ? \`<span class="px-2 py-0.5 rounded-full text-xs font-semibold bg-indigo-500 text-white">#\${p.trending_order}</span>\` : ''}
        </div>
        <div class="absolute top-2 right-2">
          <span class="w-2.5 h-2.5 rounded-full inline-block \${p.is_active ? 'bg-green-400' : 'bg-gray-400'}"></span>
        </div>
      </div>
      <div class="p-4">
        \${brand ? \`<p class="text-xs text-pink-500 font-medium mb-1">\${brand}</p>\` : ''}
        <h3 class="font-semibold text-gray-900 text-sm mb-2 line-clamp-2 leading-tight">\${name}</h3>
        <div class="flex items-center gap-2 mb-3">
          <span class="font-bold text-pink-600">\${fmtPrice(p.price)}</span>
          \${p.original_price ? \`<span class="text-xs text-gray-400 line-through">\${fmtPrice(p.original_price)}</span>\` : ''}
        </div>
        \${colors.length ? \`<div class="flex flex-wrap gap-1 mb-2">\${colors.slice(0,3).map(c=>\`<span class="text-xs bg-pink-50 text-pink-600 px-2 py-0.5 rounded-full">\${c}</span>\`).join('')}\${colors.length>3?\`<span class="text-xs text-gray-400">+\${colors.length-3}</span>\`:''}</div>\` : ''}
        \${sizes.length ? \`<div class="flex flex-wrap gap-1 mb-3">\${sizes.slice(0,4).map(s=>\`<span class="text-xs border text-gray-600 px-1.5 py-0.5 rounded">\${s}</span>\`).join('')}\${sizes.length>4?\`<span class="text-xs text-gray-400">+\${sizes.length-4}</span>\`:''}</div>\` : ''}
        <p class="text-xs text-gray-400 mb-3">Tồn kho: <span class="font-semibold text-gray-700">\${p.stock || 0}</span></p>
        <div class="flex gap-2">
          <button onclick="openProductModal(\${p.id})" class="flex-1 py-2 border-2 border-pink-200 text-pink-600 rounded-xl text-xs font-semibold hover:bg-pink-50 transition">
            <i class="fas fa-edit mr-1"></i>Sửa
          </button>
          <button onclick="toggleProductActive(\${p.id})" class="py-2 px-3 border-2 border-gray-200 rounded-xl text-xs hover:bg-gray-50 transition" title="\${p.is_active ? 'Ẩn' : 'Hiện'}">
            <i class="fas fa-\${p.is_active ? 'eye-slash' : 'eye'} text-gray-500"></i>
          </button>
          <button onclick="deleteProduct(\${p.id})" class="py-2 px-3 border-2 border-red-200 text-red-500 rounded-xl text-xs hover:bg-red-50 transition">
            <i class="fas fa-trash"></i>
          </button>
        </div>
      </div>
    </div>\`
  }).join('')
}

async function toggleProductActive(id) {
  try {
    await axios.patch('/api/admin/products/' + id + '/toggle')
    loadAdminProducts()
    showAdminToast('Đã cập nhật trạng thái', 'success')
  } catch(e) { showAdminToast('Lỗi cập nhật', 'error') }
}

async function deleteProduct(id) {
  if (!confirm('Bạn chắc chắn muốn xoá sản phẩm này?')) return
  try {
    await axios.delete('/api/admin/products/' + id)
    loadAdminProducts()
    showAdminToast('Đã xoá sản phẩm', 'success')
  } catch(e) { showAdminToast('Lỗi xoá sản phẩm', 'error') }
}

// ── PRODUCT MODAL ─────────────────────────────────
async function openProductModal(id = null) {
  editingId = id
  colors = []
  sizes = []
  galleryImages = ['','','','','','','','','']
  
  resetProductForm()
  document.getElementById('modalTitle').textContent = id ? 'Chỉnh sửa sản phẩm' : 'Thêm sản phẩm mới'
  
  // Bind gallery slots
  for (let i = 0; i < 9; i++) {
    const slot = document.getElementById('slot-'+i)
    slot.onclick = () => handleGallerySlotClick(i)
  }
  
  if (id) {
    try {
      const res = await axios.get('/api/products/'+id)
      const p = res.data.data
      document.getElementById('productId').value = p.id
      document.getElementById('pName').value = p.name
      document.getElementById('pPrice').value = p.price
      document.getElementById('pOriginalPrice').value = p.original_price || ''
      document.getElementById('pCategory').value = p.category
      document.getElementById('pBrand').value = p.brand || ''
      document.getElementById('pMaterial').value = p.material || ''
      document.getElementById('pDescription').value = p.description || ''
      document.getElementById('pStock').value = p.stock || 0
      document.getElementById('pFeatured').checked = !!p.is_featured
      document.getElementById('pTrending').checked = !!p.is_trending
      document.getElementById('pTrendingOrder').value = String(p.trending_order || 0)
      document.getElementById('pActive').checked = !!p.is_active
      
      // Thumbnail
      previewThumbnail(p.thumbnail || '')
      document.getElementById('pThumbnail').value = p.thumbnail || ''
      
      // Gallery
      const imgs = safeJson(p.images)
      imgs.forEach((url, i) => { if (i < 9 && url) setGallerySlot(i, url) })
      
      // Colors & sizes
      colors = getProductColorOptions(p)
      sizes = safeJson(p.sizes)
      renderColorOptionsEditor()
      renderTags('size')
    } catch(e) { showAdminToast('Lỗi tải sản phẩm', 'error'); return }
  }
  
  document.getElementById('productModal').classList.remove('hidden')
  document.body.style.overflow = 'hidden'
}

function closeProductModal() {
  document.getElementById('productModal').classList.add('hidden')
  document.body.style.overflow = ''
  editingId = null
}

function resetProductForm() {
  document.getElementById('productForm').reset()
  document.getElementById('productId').value = ''
  document.getElementById('pActive').checked = true
  document.getElementById('pTrendingOrder').value = '0'
  previewThumbnail('')
  for (let i = 0; i < 9; i++) clearGallerySlot(i)
  colors = []; sizes = []
  renderColorOptionsEditor(); renderTags('size')
  galleryImages = ['','','','','','','','','']
}

async function saveProduct(e) {
  e.preventDefault()
  const btn = document.getElementById('saveBtn')
  btn.textContent = 'Đang lưu...'
  
  const imgList = galleryImages.filter(v => v && v.trim())
  const normalizedThumbnail = String(document.getElementById('pThumbnail').value || '').trim()
  const normalizedColors = colors
    .map((c) => ({ name: String(c?.name || '').trim(), image: String(c?.image || '').trim() }))
    .filter((c) => c.name || c.image)
  if (!normalizedThumbnail && imgList.length === 0) {
    showAdminToast('Trường hình ảnh là bắt buộc', 'error')
    btn.textContent = 'Lưu sản phẩm'
    return
  }
  
  const data = {
    name: document.getElementById('pName').value,
    price: document.getElementById('pPrice').value,
    original_price: document.getElementById('pOriginalPrice').value || null,
    category: document.getElementById('pCategory').value,
    brand: document.getElementById('pBrand').value,
    material: document.getElementById('pMaterial').value,
    description: document.getElementById('pDescription').value,
    thumbnail: normalizedThumbnail,
    images: imgList,
    colors: normalizedColors,
    sizes: sizes,
    stock: document.getElementById('pStock').value || 0,
    is_featured: document.getElementById('pFeatured').checked,
    is_trending: document.getElementById('pTrending').checked,
    trending_order: parseInt(document.getElementById('pTrendingOrder').value) || 0,
    is_active: document.getElementById('pActive').checked
  }
  const payloadSize = JSON.stringify(data).length
  if (payloadSize > MAX_PRODUCT_PAYLOAD_SIZE) {
    showAdminToast('Ảnh quá nặng, vui lòng giảm dung lượng hoặc số lượng ảnh', 'error')
    btn.textContent = 'Lưu sản phẩm'
    return
  }
  
  try {
    if (editingId) {
      await axios.put('/api/admin/products/' + editingId, data)
      showAdminToast('Cập nhật sản phẩm thành công!', 'success')
    } else {
      await axios.post('/api/admin/products', data)
      showAdminToast('Thêm sản phẩm thành công!', 'success')
    }
    closeProductModal()
    loadAdminProducts()
  } catch(e) {
    const msg = e.response?.data?.error || e.message || 'Lỗi lưu sản phẩm'
    showAdminToast(msg, 'error')
  } finally {
    btn.textContent = 'Lưu sản phẩm'
  }
}

// ── GALLERY ───────────────────────────────────────
function handleGallerySlotClick(i) {
  const hasImg = galleryImages[i]
  if (!hasImg) {
    document.getElementById('galleryFile-'+i).click()
  }
}

function setGallerySlot(i, url) {
  galleryImages[i] = url
  const img = document.getElementById('galleryImg-'+i)
  const placeholder = document.getElementById('slotPlaceholder-'+i)
  const delBtn = document.getElementById('slotDel-'+i)
  const slot = document.getElementById('slot-'+i)
  img.src = url
  img.classList.remove('hidden')
  placeholder.classList.add('hidden')
  delBtn.classList.remove('hidden')
  delBtn.classList.add('flex')
  slot.classList.add('has-img')
}

function clearGallerySlot(i) {
  galleryImages[i] = ''
  const img = document.getElementById('galleryImg-'+i)
  const placeholder = document.getElementById('slotPlaceholder-'+i)
  const delBtn = document.getElementById('slotDel-'+i)
  const slot = document.getElementById('slot-'+i)
  img.src = ''; img.classList.add('hidden')
  placeholder.classList.remove('hidden')
  delBtn.classList.add('hidden'); delBtn.classList.remove('flex')
  slot.classList.remove('has-img')
}

function compactGallerySlots() {
  const compacted = galleryImages.filter(v => String(v || '').trim())
  galleryImages = ['','','','','','','','','']
  for (let i = 0; i < 9; i++) clearGallerySlot(i)
  compacted.forEach((url, idx) => {
    if (idx < 9) setGallerySlot(idx, url)
  })
}

function removeGalleryImg(i) {
  event.stopPropagation()
  clearGallerySlot(i)
}

async function handleGalleryFile(i, input) {
  const files = Array.from(input.files || []).filter(f => f.type && f.type.startsWith('image/'))
  if (!files.length) return
  await applyMultipleImagesFrom(files, 'gallery', i)
  input.value = ''
}

function handleImageDragOver(event) {
  event.preventDefault()
  const hasInternalSource = !!event.dataTransfer?.types?.includes('application/x-image-source')
  event.dataTransfer.dropEffect = hasInternalSource ? 'move' : 'copy'
  event.currentTarget.classList.add('drag-over')
}

function handleImageDragLeave(event) {
  event.currentTarget.classList.remove('drag-over')
}

async function handleImageDrop(event, targetType, targetIndex = -1) {
  event.preventDefault()
  event.currentTarget.classList.remove('drag-over')
  const srcPayload = event.dataTransfer?.getData('application/x-image-source')
  if (srcPayload) {
    handleImageReorderDrop(srcPayload, targetType, targetIndex)
    return
  }
  const files = Array.from(event.dataTransfer?.files || []).filter(f => f.type && f.type.startsWith('image/'))
  if (!files.length) {
    showAdminToast('Vui lòng kéo thả file ảnh hợp lệ', 'warning')
    return
  }
  await applyMultipleImagesFrom(files, targetType, targetIndex)
}

function startImageReorderDrag(event, sourceType, sourceIndex = -1) {
  const sourceUrl = sourceType === 'thumbnail'
    ? String(document.getElementById('pThumbnail')?.value || '').trim()
    : String(galleryImages[sourceIndex] || '').trim()
  if (!sourceUrl) {
    event.preventDefault()
    return
  }
  event.dataTransfer.effectAllowed = 'move'
  event.dataTransfer.setData('application/x-image-source', JSON.stringify({ sourceType, sourceIndex }))
  event.dataTransfer.setData('text/plain', sourceUrl)
}

function handleImageReorderDrop(rawSource, targetType, targetIndex = -1) {
  let source
  try {
    source = JSON.parse(rawSource)
  } catch {
    return
  }
  const sourceType = source?.sourceType === 'thumbnail' ? 'thumbnail' : 'gallery'
  const sourceIndex = Number.isInteger(source?.sourceIndex) ? source.sourceIndex : -1
  if (sourceType === targetType && sourceIndex === targetIndex) return
  const sourceUrl = sourceType === 'thumbnail'
    ? String(document.getElementById('pThumbnail')?.value || '').trim()
    : String(galleryImages[sourceIndex] || '').trim()
  if (!sourceUrl) return
  const targetUrl = targetType === 'thumbnail'
    ? String(document.getElementById('pThumbnail')?.value || '').trim()
    : String(galleryImages[targetIndex] || '').trim()
  if (targetType === 'thumbnail') {
    document.getElementById('pThumbnail').value = sourceUrl
    previewThumbnail(sourceUrl)
  } else if (targetIndex >= 0 && targetIndex < 9) {
    setGallerySlot(targetIndex, sourceUrl)
  }
  if (sourceType === 'thumbnail') {
    if (targetUrl) {
      document.getElementById('pThumbnail').value = targetUrl
      previewThumbnail(targetUrl)
    } else {
      document.getElementById('pThumbnail').value = ''
      previewThumbnail('')
    }
  } else if (sourceIndex >= 0 && sourceIndex < 9) {
    if (targetUrl) setGallerySlot(sourceIndex, targetUrl)
    else clearGallerySlot(sourceIndex)
  }
  compactGallerySlots()
}

async function applyMultipleImagesFrom(files, targetType, startIndex = 0) {
  try {
    let fileIndex = 0
    if (targetType === 'thumbnail' && files[0]) {
      const thumbDataUrl = await fileToOptimizedDataURL(files[0], 900, 0.85)
      document.getElementById('pThumbnail').value = thumbDataUrl
      previewThumbnail(thumbDataUrl)
      fileIndex = 1
      startIndex = 0
    }
    for (let i = startIndex; i < 9 && fileIndex < files.length; i++) {
      const dataUrl = await fileToOptimizedDataURL(files[fileIndex], 1200, 0.82)
      setGallerySlot(i, dataUrl)
      fileIndex++
    }
    if (fileIndex < files.length) {
      showAdminToast('Đã đầy ô ảnh, một số ảnh chưa được thêm', 'warning')
    }
  } catch (e) {
    showAdminToast('Không thể xử lý ảnh, vui lòng thử ảnh khác', 'error')
  }
}

function addGalleryUrl() {
  const url = document.getElementById('galleryUrlInput').value.trim()
  if (!url) return
  const emptySlot = galleryImages.findIndex(v => !v)
  if (emptySlot === -1) { showAdminToast('Đã đầy 9 ảnh', 'error'); return }
  setGallerySlot(emptySlot, url)
  document.getElementById('galleryUrlInput').value = ''
}

function previewThumbnail(url) {
  const img = document.getElementById('thumbnailPreview')
  const placeholder = document.getElementById('thumbnailPlaceholder')
  const box = document.getElementById('thumbnailPreviewBox')
  if (url) {
    img.src = url; img.classList.remove('hidden'); placeholder.classList.add('hidden')
    box.classList.add('has-img')
  } else {
    img.src = ''; img.classList.add('hidden'); placeholder.classList.remove('hidden')
    box.classList.remove('has-img')
  }
}

async function handleThumbnailFile(input) {
  const files = Array.from(input.files || []).filter(f => f.type && f.type.startsWith('image/'))
  if (!files.length) return
  await applyMultipleImagesFrom(files, 'thumbnail', 0)
  input.value = ''
}

function fileToOptimizedDataURL(file, maxWidth = 1200, quality = 0.82) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(new Error('read_failed'))
    reader.onload = () => {
      const img = new Image()
      img.onerror = () => reject(new Error('decode_failed'))
      img.onload = () => {
        const scale = Math.min(1, maxWidth / img.width)
        const width = Math.max(1, Math.round(img.width * scale))
        const height = Math.max(1, Math.round(img.height * scale))
        const canvas = document.createElement('canvas')
        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext('2d')
        if (!ctx) return reject(new Error('canvas_failed'))
        ctx.drawImage(img, 0, 0, width, height)
        resolve(canvas.toDataURL('image/jpeg', quality))
      }
      img.src = reader.result
    }
    reader.readAsDataURL(file)
  })
}

// ── TAGS (Colors/Sizes) ────────────────────────────
function addTag(type) {
  const input = document.getElementById(type === 'size' ? 'sizeInput' : '')
  if (!input) return
  const val = input.value.trim()
  if (!val) return
  val.split(',').map(v => v.trim()).filter(v => v && !sizes.includes(v)).forEach(v => sizes.push(v))
  renderTags('size')
  input.value = ''
}

function removeTag(type, val) {
  if (type !== 'size') return
  sizes = sizes.filter(s => s !== val)
  renderTags('size')
}

function renderTags(type) {
  if (type !== 'size') return
  const container = document.getElementById('sizeTags')
  container.innerHTML = sizes.map(v => \`
    <span class="tag-item">\${v}<span class="tag-del" onclick="removeTag('size','\${v}')">×</span></span>
  \`).join('')
}

function renderColorOptionsEditor() {
  const wrap = document.getElementById('colorOptionsEditor')
  if (!wrap) return
  if (!colors.length) colors = [{ name: '', image: '' }]
  wrap.innerHTML = colors.map((color, idx) => \`
    <div class="grid grid-cols-[78px_1fr_auto] gap-3 items-start">
      <div class="img-slot group relative w-[78px] h-[78px] flex items-center justify-center cursor-pointer select-none overflow-hidden"
        ondragover="handleColorImageDragOver(event)"
        ondragleave="handleColorImageDragLeave(event)"
        ondrop="handleColorImageDrop(event, \${idx})">
        <img src="\${color.image || ''}" alt="" class="w-full h-full object-cover rounded-xl \${color.image ? '' : 'hidden'}" id="colorImg-\${idx}">
        <div class="text-[11px] text-gray-400 text-center px-2 leading-tight \${color.image ? 'hidden' : ''}" id="colorPlaceholder-\${idx}">
          Bấm hoặc kéo ảnh
        </div>
        <input type="file" accept="image/*" class="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" id="colorFile-\${idx}" onchange="handleColorImageFile(\${idx}, this)">
        <div class="\${color.image ? 'absolute inset-0 hidden group-hover:flex items-center justify-center bg-black/45 text-white transition z-20' : 'hidden'}" id="colorOverlay-\${idx}">
          <button type="button" onclick="event.preventDefault();event.stopPropagation();removeColorImage(\${idx})" class="w-8 h-8 rounded-full bg-black/35 hover:bg-red-500 flex items-center justify-center z-30">
            <i class="fas fa-trash text-xs"></i>
          </button>
        </div>
      </div>
      <input type="text" value="\${String(color.name || '').replace(/"/g, '&quot;')}" placeholder="Nhập màu (VD: Đen, Navy...)" class="w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-pink-400" oninput="updateColorName(\${idx}, this.value)">
      <button type="button" onclick="removeColorOptionRow(\${idx})" class="w-9 h-9 rounded-lg border border-red-200 text-red-500 hover:bg-red-50 mt-1">
        <i class="fas fa-trash text-xs"></i>
      </button>
    </div>
  \`).join('')
}

function addColorOptionRow() {
  colors.push({ name: '', image: '' })
  renderColorOptionsEditor()
}

function removeColorOptionRow(idx) {
  if (colors.length <= 1) {
    colors = [{ name: '', image: '' }]
  } else {
    colors.splice(idx, 1)
  }
  renderColorOptionsEditor()
}

function updateColorName(idx, value) {
  if (!colors[idx]) return
  colors[idx].name = String(value || '')
}

function removeColorImage(idx) {
  if (!colors[idx]) return
  colors[idx].image = ''
  renderColorOptionsEditor()
}

function handleColorImageDragOver(event) {
  event.preventDefault()
  event.currentTarget.classList.add('drag-over')
}

function handleColorImageDragLeave(event) {
  event.currentTarget.classList.remove('drag-over')
}

async function handleColorImageDrop(event, idx) {
  event.preventDefault()
  event.currentTarget.classList.remove('drag-over')
  const file = Array.from(event.dataTransfer?.files || []).find((f) => f.type && f.type.startsWith('image/'))
  if (!file) return
  await applyColorImageFile(idx, file)
}

async function handleColorImageFile(idx, input) {
  const file = Array.from(input.files || []).find((f) => f.type && f.type.startsWith('image/'))
  if (!file) return
  await applyColorImageFile(idx, file)
  input.value = ''
}

async function applyColorImageFile(idx, file) {
  try {
    if (!colors[idx]) return
    colors[idx].image = await fileToOptimizedDataURL(file, 500, 0.85)
    renderColorOptionsEditor()
  } catch (_) {
    showAdminToast('Không thể xử lý ảnh màu', 'error')
  }
}

function addPresetSizes(arr) {
  arr.forEach(s => { if (!sizes.includes(s)) sizes.push(s) })
  renderTags('size')
}

// ── ORDERS ────────────────────────────────────────
async function loadAdminOrders() {
  document.getElementById('ordersTable').innerHTML = '<tr><td colspan="7" class="text-center py-12 text-gray-400"><i class="fas fa-spinner fa-spin text-2xl"></i></td></tr>'
  document.getElementById('ordersMobileList').innerHTML = '<div class="py-12 text-center text-gray-400"><i class="fas fa-spinner fa-spin text-2xl"></i></div>'
  try {
    const res = await axios.get('/api/admin/orders')
    adminOrders = res.data.data || []
    const validIds = new Set(adminOrders.map(o => Number(o.id)))
    selectedOrderIds = new Set(Array.from(selectedOrderIds).filter(id => validIds.has(Number(id))))
    filterOrders()
  } catch(e) {
    if (e && e.response && e.response.status === 401) {
      showAdminToast('Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại', 'error')
      setTimeout(() => { window.location.href = '/admin/login' }, 400)
      return
    }
    const msg = e?.response?.data?.error || e?.message || 'Lỗi tải dữ liệu'
    document.getElementById('ordersTable').innerHTML = '<tr><td colspan="7" class="text-center py-8 text-red-400">Lỗi tải dữ liệu</td></tr>'
    document.getElementById('ordersMobileList').innerHTML = '<div class="py-8 text-center text-red-400">Lỗi tải dữ liệu</div>'
    showAdminToast(msg, 'error')
    console.error('loadAdminOrders error:', e)
  }
}

function setOrdersViewMode(mode) {
  ordersViewMode = mode === 'waiting_ship' ? 'waiting_ship' : 'to_arrange'
  selectedOrderIds.clear()
  filterOrders()
}

function updateOrdersModeButtons(counters) {
  const arrangeBtn = document.getElementById('ordersModeArrangeBtn')
  const waitingBtn = document.getElementById('ordersModeWaitingBtn')
  const arrangeCount = document.getElementById('ordersToArrangeCount')
  const waitingCount = document.getElementById('ordersWaitingShipCount')

  if (arrangeCount) arrangeCount.textContent = String(counters.toArrange || 0)
  if (waitingCount) waitingCount.textContent = String(counters.waitingShip || 0)

  if (arrangeBtn) {
    const active = ordersViewMode === 'to_arrange'
    arrangeBtn.className = active
      ? 'bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-sm font-semibold inline-flex items-center gap-2 transition'
      : 'bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-xl text-sm font-semibold inline-flex items-center gap-2 transition border border-gray-200'
  }
  if (waitingBtn) {
    const active = ordersViewMode === 'waiting_ship'
    waitingBtn.className = active
      ? 'bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-sm font-semibold inline-flex items-center gap-2 transition'
      : 'bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-xl text-sm font-semibold inline-flex items-center gap-2 transition border border-gray-200'
  }
}

function filterOrders() {
  const status = document.getElementById('orderStatusFilter').value
  const q = document.getElementById('orderSearch').value.toLowerCase()
  const sourceOrders = adminOrders.filter(o => !isInternalTestOrder(o))

  const activeOrders = sourceOrders.filter(o => {
    const st = String(o.status || '').toLowerCase()
    return st !== 'shipping' && st !== 'done' && st !== 'cancelled'
  })
  const toArrangeCount = activeOrders.filter(o => Number(o.shipping_arranged || 0) !== 1).length
  const waitingShipCount = activeOrders.filter(o => Number(o.shipping_arranged || 0) === 1).length
  updateOrdersModeButtons({ toArrange: toArrangeCount, waitingShip: waitingShipCount })

  const byView = sourceOrders.filter(o => {
    const st = String(o.status || '').toLowerCase()
    if (st === 'shipping' || st === 'done' || st === 'cancelled') return false
    if (ordersViewMode === 'waiting_ship') return Number(o.shipping_arranged || 0) === 1
    return Number(o.shipping_arranged || 0) !== 1
  })
  const byStatus = status === 'all'
    ? byView
    : byView.filter(o => String(o.status || '').toLowerCase() === status)
  const filtered = q ? byStatus.filter(o =>
    String(o.customer_name || '').toLowerCase().includes(q) ||
    String(o.customer_phone || '').includes(q) ||
    String(o.order_code || '').toLowerCase().includes(q) ||
    String(o.product_name || '').toLowerCase().includes(q)
  ) : byStatus
  
  filteredAdminOrders = filtered
  renderOrdersTable(filtered)
  const total = filtered.reduce((s,o) => s + getOrderAmountDue(o), 0)
  const modeLabel = ordersViewMode === 'waiting_ship' ? 'Đang chờ vận chuyển' : 'Sắp xếp vận chuyển'
  document.getElementById('orderStats').textContent = \`\${modeLabel}: \${filtered.length} đơn – Tổng: \${fmtPrice(total)}\`
  updateOrderSelectionUI()
}

function buildOrderSkuText(order) {
  const color = String(order?.color || '').trim()
  const size = String(order?.size || '').trim()
  const bits = []
  if (color) bits.push(color)
  if (size) bits.push('Size ' + size)
  return bits.length ? bits.join(' / ') : 'N/A'
}

function getOrderItemImage(order) {
  const fallback = String(order?.selected_color_image || order?.product_thumbnail || order?.thumbnail || '').trim()
    || 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=80'
  const rawImages = String(order?.product_images || '').trim()
  const rawColors = Array.isArray(order?.product_colors) ? order.product_colors : safeJson(order?.product_colors || '[]')
  const selectedColor = String(order?.color || '').trim()
  if (!rawImages || !selectedColor) return fallback
  let images = []
  try { images = JSON.parse(rawImages || '[]') } catch (_) { images = [] }
  if (!Array.isArray(images) || !images.length) return fallback
  if (Array.isArray(rawColors) && rawColors.length) {
    const idx = rawColors.findIndex((c) => {
      const name = typeof c === 'string' ? c : String(c?.name || c?.label || '')
      return String(name || '').trim().toLowerCase() === selectedColor.toLowerCase()
    })
    if (idx >= 0 && String(images[idx] || '').trim()) return String(images[idx]).trim()
  }
  const first = images.find((img) => String(img || '').trim())
  return first ? String(first).trim() : fallback
}

function renderOrdersTable(orders) {
  const empty = document.getElementById('ordersEmpty')
  if (!orders.length) {
    document.getElementById('ordersTable').innerHTML = ''
    document.getElementById('ordersMobileList').innerHTML = ''
    empty.classList.remove('hidden')
    updateOrderSelectionUI()
    return
  }
  empty.classList.add('hidden')
  
  document.getElementById('ordersTable').innerHTML = orders.map(o => \`
  <tr class="table-row border-b cursor-pointer">
    <td class="px-4 py-3 text-center">
      <input type="checkbox" class="w-4 h-4 rounded border-gray-300 text-pink-500 focus:ring-pink-400" \${selectedOrderIds.has(Number(o.id)) ? 'checked' : ''} onchange="toggleOrderSelection(\${o.id}, this.checked)">
    </td>
    <td class="px-4 py-3 w-[360px] align-top">
      <div class="flex items-start gap-3 max-w-[360px]">
        <img src="\${getOrderItemImage(o)}" alt="\${o.product_name || 'product'}" class="w-12 h-12 rounded-lg object-cover border border-gray-200 bg-gray-100 flex-none" onerror="this.src='https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=80'">
        <div class="min-w-0 max-w-[300px] space-y-0.5">
          <div>
            <button type="button"
              onclick="copyOrderCode(decodeURIComponent('\${encodeURIComponent(String(o.order_code || '').trim())}')); return false;"
              title="Bấm để copy mã đơn hàng"
              class="font-mono text-[11px] text-blue-600 font-semibold hover:text-blue-700 transition">
              Mã ĐH: \${o.order_code}
            </button>
          </div>
          <p class="text-sm text-gray-800 font-semibold truncate max-w-[290px]">\${o.product_name}</p>
          <div class="text-xs text-gray-500">
            <span>\${displayCustomerName(o.customer_name)}</span>
            <span> • </span>
            <button type="button"
              onclick="copyPhoneNumber(decodeURIComponent('\${encodeURIComponent(String(o.customer_phone || '').trim())}')); return false;"
              title="Bấm để copy số điện thoại"
              class="hover:text-blue-600 no-underline transition">\${o.customer_phone}</button>
          </div>
          <p class="text-xs text-gray-500">SKU: \${buildOrderSkuText(o)}</p>
          <div>
            \${String(o.shipping_tracking_code || '').trim()
              ? \`<button type="button"
                    onclick="copyTrackingCode(decodeURIComponent('\${encodeURIComponent(String(o.shipping_tracking_code || '').trim())}')); return false;"
                    title="Bấm để copy mã đầy đủ: \${String(o.shipping_tracking_code || '').trim()}"
                    class="font-mono text-[11px] text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-lg font-semibold hover:bg-emerald-100 transition">
                    Mã vận đơn: \${getTrackingDisplayCode(o.shipping_tracking_code)}
                  </button>\`
              : '<span class="text-xs text-gray-300">Mã vận đơn: —</span>'}
          </div>
        </div>
      </div>
    </td>
    <td class="px-2 py-3 text-center w-12 align-top">
      <span class="inline-flex min-w-6 justify-center text-[11px] font-semibold text-gray-700 bg-gray-100 border border-gray-200 rounded-md px-1.5 py-0.5">\${o.quantity || 1}</span>
    </td>
    <td class="px-4 py-3 text-right">
      <p class="font-bold text-gray-800">\${fmtPrice(getOrderAmountDue(o))}</p>
      \${o.discount_amount > 0 ? \`<p class="text-xs text-green-600">-\${fmtPrice(o.discount_amount)}</p>\` : ''}
      <p class="mt-1"><span class="text-[11px] px-2 py-0.5 rounded-full \${paymentStatusClass(o.payment_status)}">\${paymentStatusLabel(o.payment_status)}</span></p>
      <div class="mt-1 flex justify-end">\${paymentMethodTagHTML(o.payment_method, o.payment_status)}</div>
    </td>
    <td class="px-4 py-3 text-center hidden lg:table-cell">
      \${o.voucher_code ? \`<span class="font-mono text-xs bg-green-50 text-green-700 border border-green-200 px-2 py-0.5 rounded-lg font-semibold">\${o.voucher_code}</span>\` : '<span class="text-gray-300 text-xs">—</span>'}
    </td>
    <td class="px-4 py-3 text-center">
      <select onchange="updateOrderStatus(\${o.id}, this.value)" class="text-xs border rounded-lg px-2 py-1 focus:outline-none badge badge-\${o.status}" style="max-width:120px">
        <option value="pending" \${o.status==='pending'?'selected':''}>Chờ xử lý</option>
        <option value="confirmed" \${o.status==='confirmed'?'selected':''}>Xác nhận</option>
        <option value="shipping" \${o.status==='shipping'?'selected':''}>Đang giao</option>
        <option value="done" \${o.status==='done'?'selected':''}>Hoàn thành</option>
        <option value="cancelled" \${o.status==='cancelled'?'selected':''}>Huỷ</option>
      </select>
    </td>
    <td class="px-4 py-3 text-center">
      <div class="flex justify-center gap-1">
        <button onclick="showOrderDetail(\${o.id})" class="p-1.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition" title="Chi tiết">
          <i class="fas fa-eye text-xs"></i>
        </button>
        <button onclick="deleteOrder(\${o.id})" class="p-1.5 bg-red-50 text-red-500 rounded-lg hover:bg-red-100 transition" title="Xoá">
          <i class="fas fa-trash text-xs"></i>
        </button>
      </div>
    </td>
  </tr>\`).join('')
  renderOrdersMobileList(orders)
  updateOrderSelectionUI()
}

function renderOrdersMobileList(orders) {
  const wrap = document.getElementById('ordersMobileList')
  wrap.innerHTML = orders.map(o => {
    const tracking = String(o.shipping_tracking_code || '').trim()
    return \`
    <div class="p-3 bg-white">
      <div class="flex items-start gap-2">
        <input type="checkbox" class="mt-1 w-4 h-4 rounded border-gray-300 text-pink-500 focus:ring-pink-400" \${selectedOrderIds.has(Number(o.id)) ? 'checked' : ''} onchange="toggleOrderSelection(\${o.id}, this.checked)">
        <div class="min-w-0 flex-1">
          <div class="flex items-start justify-between gap-2">
            <div class="min-w-0">
              <button type="button"
                onclick="copyOrderCode(decodeURIComponent('\${encodeURIComponent(String(o.order_code || '').trim())}')); return false;"
                class="font-mono text-[11px] text-blue-600 font-semibold truncate max-w-[200px]">Mã ĐH: \${o.order_code}</button>
              <p class="text-sm font-semibold text-gray-800 truncate">\${o.product_name}</p>
              <p class="text-xs text-gray-500">SKU: \${buildOrderSkuText(o)} • SL: \${o.quantity || 1}</p>
            </div>
            <div class="text-right flex-none">
              <p class="text-sm font-bold text-gray-800">\${fmtPrice(getOrderAmountDue(o))}</p>
              <p class="mt-1"><span class="text-[11px] px-2 py-0.5 rounded-full \${paymentStatusClass(o.payment_status)}">\${paymentStatusLabel(o.payment_status)}</span></p>
            </div>
          </div>
          <div class="mt-2 flex items-start gap-2">
            <img src="\${getOrderItemImage(o)}" alt="\${o.product_name || 'product'}" class="w-11 h-11 rounded-lg object-cover border border-gray-200 bg-gray-100 flex-none" onerror="this.src='https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=80'">
            <div class="min-w-0 flex-1">
              <div class="text-xs text-gray-500">
                <span>\${displayCustomerName(o.customer_name)}</span>
                <span> • </span>
                <button type="button"
                  onclick="copyPhoneNumber(decodeURIComponent('\${encodeURIComponent(String(o.customer_phone || '').trim())}')); return false;"
                  class="hover:text-blue-600 no-underline transition">\${o.customer_phone}</button>
              </div>
              <div class="mt-1">
                \${tracking
                  ? \`<button type="button"
                        onclick="copyTrackingCode(decodeURIComponent('\${encodeURIComponent(tracking)}')); return false;"
                        class="font-mono text-[11px] text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-lg font-semibold hover:bg-emerald-100 transition">Mã vận đơn: \${getTrackingDisplayCode(tracking)}</button>\`
                  : '<span class="text-xs text-gray-300">Mã vận đơn: —</span>'}
              </div>
            </div>
          </div>
          <div class="mt-2 flex items-center justify-between gap-2">
            <select onchange="updateOrderStatus(\${o.id}, this.value)" class="text-xs border rounded-lg px-2 py-1 focus:outline-none badge badge-\${o.status}" style="max-width:124px">
              <option value="pending" \${o.status==='pending'?'selected':''}>Chờ xử lý</option>
              <option value="confirmed" \${o.status==='confirmed'?'selected':''}>Xác nhận</option>
              <option value="shipping" \${o.status==='shipping'?'selected':''}>Đang giao</option>
              <option value="done" \${o.status==='done'?'selected':''}>Hoàn thành</option>
              <option value="cancelled" \${o.status==='cancelled'?'selected':''}>Huỷ</option>
            </select>
            <div class="flex items-center gap-1">
              <button onclick="showOrderDetail(\${o.id})" class="p-1.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition" title="Chi tiết">
                <i class="fas fa-eye text-xs"></i>
              </button>
              <button onclick="deleteOrder(\${o.id})" class="p-1.5 bg-red-50 text-red-500 rounded-lg hover:bg-red-100 transition" title="Xoá">
                <i class="fas fa-trash text-xs"></i>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>\`
  }).join('')
}

function toggleOrderSelection(id, checked) {
  const n = Number(id)
  if (checked) selectedOrderIds.add(n)
  else selectedOrderIds.delete(n)
  updateOrderSelectionUI()
}

function toggleSelectAllOrders(checked) {
  filteredAdminOrders.forEach(o => {
    const id = Number(o.id)
    if (checked) selectedOrderIds.add(id)
    else selectedOrderIds.delete(id)
  })
  renderOrdersTable(filteredAdminOrders)
}

function updateOrderSelectionUI() {
  const bulkBar = document.getElementById('ordersBulkActionBar')
  const bulkBtn = document.getElementById('bulkDeleteOrdersBtn')
  const bulkText = document.getElementById('bulkDeleteOrdersText')
  const arrangeBtn = document.getElementById('bulkArrangeShipBtn')
  const arrangeText = document.getElementById('bulkArrangeShipText')
  const selectAll = document.getElementById('ordersSelectAll')
  const shipBar = document.getElementById('shippingBulkActionBar')
  const shipBarText = document.getElementById('shippingBulkSelectedText')
  const visibleIds = filteredAdminOrders.map(o => Number(o.id))
  const checkedVisible = visibleIds.filter(id => selectedOrderIds.has(id)).length
  const anySelectedVisible = checkedVisible > 0

  if (arrangeBtn) {
    const showArrange = ordersViewMode === 'to_arrange' && anySelectedVisible
    arrangeBtn.classList.toggle('hidden', !showArrange)
    arrangeBtn.classList.toggle('flex', showArrange)
  }
  if (arrangeText) {
    arrangeText.textContent = anySelectedVisible
      ? ('Sắp xếp vận chuyển (' + checkedVisible + ')')
      : 'Sắp xếp vận chuyển'
  }
  if (bulkBtn) {
    const showDelete = ordersViewMode !== 'waiting_ship' && anySelectedVisible
    bulkBtn.classList.toggle('hidden', !showDelete)
    bulkBtn.classList.toggle('flex', showDelete)
  }
  if (bulkBar) {
    const showBar = ordersViewMode === 'to_arrange' && anySelectedVisible
    bulkBar.classList.toggle('hidden', !showBar)
  }
  if (bulkText) {
    bulkText.textContent = anySelectedVisible ? ('Xoá đã chọn (' + checkedVisible + ')') : 'Xoá đã chọn'
  }
  if (shipBar) {
    const showShipBar = ordersViewMode === 'waiting_ship' && anySelectedVisible
    shipBar.classList.toggle('hidden', !showShipBar)
  }
  if (shipBarText) {
    shipBarText.textContent = 'Đã chọn ' + checkedVisible + ' đơn'
  }
  if (selectAll) {
    const allVisibleChecked = visibleIds.length > 0 && checkedVisible === visibleIds.length
    selectAll.checked = allVisibleChecked
    selectAll.indeterminate = checkedVisible > 0 && checkedVisible < visibleIds.length
  }
}

async function deleteSelectedOrders() {
  const ids = Array.from(selectedOrderIds)
  if (!ids.length) return
  if (!confirm('Xoá ' + ids.length + ' đơn đã chọn?')) return
  try {
    await Promise.all(ids.map(id => axios.delete('/api/admin/orders/' + id)))
    selectedOrderIds.clear()
    showAdminToast('Đã xoá ' + ids.length + ' đơn hàng', 'success')
    await loadAdminOrders()
  } catch (e) {
    showAdminToast('Lỗi xoá hàng loạt', 'error')
  }
}

async function arrangeSelectedForShipping() {
  const ids = filteredAdminOrders.map(o => Number(o.id)).filter(id => selectedOrderIds.has(id))
  if (!ids.length) return
  try {
    const res = await axios.post('/api/admin/orders/arrange-shipping', { ids })
    const updated = Array.isArray(res.data?.updated) ? res.data.updated : []
    const failed = Array.isArray(res.data?.failed) ? res.data.failed : []
    arrangedOrdersForPrint = updated.map((o) => ({
      id: Number(o.id),
      order_code: String(o.order_code || ''),
      shipping_carrier: String(o.shipping_carrier || o.carrier || 'GHTK'),
      shipping_tracking_code: String(o.shipping_tracking_code || o.tracking_code || '').trim()
    }))
    arrangedFailedOrders = failed
    selectedOrderIds.clear()
    openArrangeSuccessModal(arrangedOrdersForPrint.length, failed)
    await loadAdminOrders()
  } catch (e) {
    showAdminToast('Lỗi sắp xếp vận chuyển', 'error')
  }
}

function printSelectedOrders() {
  const selected = filteredAdminOrders.filter(o => selectedOrderIds.has(Number(o.id)))
  if (!selected.length) return
  const ghtkOrders = extractGHTKPrintableOrders(selected)
  if (!ghtkOrders.length) {
    showAdminToast('Chưa có mã vận đơn GHTK để in nhãn', 'warning')
    return
  }
  if (ghtkOrders.length < selected.length) {
    showAdminToast('Một số đơn chưa có mã vận đơn, chỉ in các đơn đã có mã GHTK', 'warning')
  }
  openGHTKLabelsPdf(ghtkOrders.map(o => Number(o.id)))
}

function openGHTKLabelsPdf(orderIds) {
  const ids = (orderIds || []).map((v) => Number(v)).filter((v) => Number.isFinite(v) && v > 0)
  if (!ids.length) return
  const url = '/api/admin/orders/ghtk/print-labels?ids=' + encodeURIComponent(ids.join(',')) + '&original=portrait&page_size=A6'
  const tab = window.open(url, '_blank')
  if (!tab) showAdminToast('Trình duyệt đang chặn mở PDF nhãn GHTK', 'error')
}

function openPrintOrdersPopup(selected) {
  if (!Array.isArray(selected) || !selected.length) return
  const rows = selected.map(o =>
    '<div class="order-card">'
    + '<div class="row"><strong>Mã đơn:</strong><span>' + (o.order_code || '') + '</span></div>'
    + '<div class="row"><strong>Khách:</strong><span>' + displayCustomerName(o.customer_name || '') + '</span></div>'
    + '<div class="row"><strong>SĐT:</strong><span>' + (o.customer_phone || '') + '</span></div>'
    + '<div class="row"><strong>Địa chỉ:</strong><span>' + (o.customer_address || '') + '</span></div>'
    + '<div class="row"><strong>Sản phẩm:</strong><span>' + (o.product_name || '') + ' x ' + (o.quantity || 0) + '</span></div>'
    + '<div class="row"><strong>Thanh toán:</strong><span>' + formatPaymentMethod(o.payment_method) + ' (' + paymentStatusLabel(o.payment_status) + ')</span></div>'
    + '<div class="row total"><strong>Cần thu:</strong><span>' + fmtPrice(getOrderAmountDue(o)) + '</span></div>'
    + '</div>'
  ).join('')

  const popup = window.open('', '_blank', 'width=1080,height=760')
  if (!popup) {
    showAdminToast('Trình duyệt đang chặn popup in đơn', 'error')
    return
  }
  popup.onload = function() {
    setTimeout(function() { popup.print() }, 120)
  }
  const html = '<!doctype html>'
    + '<html lang="vi">'
    + '<head>'
    + '<meta charset="UTF-8" />'
    + '<title>In đơn hàng loạt</title>'
    + '<style>'
    + 'body{font-family:Arial,sans-serif;margin:16px;color:#111827;}'
    + 'h1{margin:0 0 8px;font-size:22px;}'
    + '.meta{color:#6b7280;font-size:13px;margin-bottom:14px;}'
    + '.grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;}'
    + '.order-card{border:1px solid #e5e7eb;border-radius:12px;padding:12px;break-inside:avoid;}'
    + '.row{display:flex;gap:6px;margin:5px 0;font-size:13px;}'
    + '.row strong{min-width:86px;}'
    + '.total{margin-top:8px;padding-top:8px;border-top:1px dashed #d1d5db;font-size:15px;}'
    + '@media print{body{margin:8px;}}'
    + '</style>'
    + '</head>'
    + '<body>'
    + '<h1>In đơn hàng loạt</h1>'
    + '<div class="meta">Số đơn: ' + selected.length + ' • In lúc: ' + new Date().toLocaleString('vi-VN') + '</div>'
    + '<div class="grid">' + rows + '</div>'
    + '</body></html>'
  popup.document.write(html)
  popup.document.close()
}

function extractGHTKPrintableOrders(rows) {
  const list = Array.isArray(rows) ? rows : []
  return list.filter((o) => {
    const carrier = String(o.shipping_carrier || o.carrier || '').toUpperCase()
    const tracking = String(o.shipping_tracking_code || o.tracking_code || '').trim()
    return carrier === 'GHTK' && !!tracking
  })
}

function mapArrangeErrorText(code) {
  if (code === 'ORDER_NOT_FOUND') return 'Không tìm thấy đơn'
  if (code === 'ORDER_CLOSED') return 'Đơn đã đóng/hủy'
  if (code === 'MISSING_GHTK_KEYS') return 'Thiếu GHTK_TOKEN hoặc GHTK_CLIENT_SOURCE'
  if (code === 'MISSING_GHTK_PICKUP_CONFIG') return 'Thiếu cấu hình địa chỉ lấy hàng GHTK'
  if (code === 'INVALID_CUSTOMER_ADDRESS_FORMAT') return 'Địa chỉ khách chưa hợp lệ và không có fallback'
  if (code === 'GHTK_TRACKING_EMPTY') return 'GHTK không trả mã vận đơn'
  return String(code || 'Lỗi không xác định')
}

function openArrangeSuccessModal(count, failedList) {
  const text = document.getElementById('arrangeSuccessText')
  const failed = Array.isArray(failedList) ? failedList : []
  if (text) text.textContent = 'Đã sắp xếp vận chuyển thành công ' + count + ' đơn hàng.'
  const printBtn = document.getElementById('arrangeModalPrintBtn')
  if (printBtn) printBtn.classList.toggle('hidden', count <= 0)
  const failWrap = document.getElementById('arrangeFailedWrap')
  const failListEl = document.getElementById('arrangeFailedList')
  if (failWrap && failListEl) {
    const hasFail = failed.length > 0
    failWrap.classList.toggle('hidden', !hasFail)
    if (hasFail) {
      failListEl.innerHTML = failed.map((f) => {
        const code = String(f.order_code || f.id || 'N/A')
        const reason = mapArrangeErrorText(f.error)
        return '<div>• <span class="font-semibold">' + code + '</span>: ' + reason + '</div>'
      }).join('')
    } else {
      failListEl.innerHTML = ''
    }
  }
  const modal = document.getElementById('arrangeSuccessModal')
  if (modal) modal.classList.remove('hidden')
}

function closeArrangeSuccessModal() {
  const modal = document.getElementById('arrangeSuccessModal')
  if (modal) modal.classList.add('hidden')
  arrangedFailedOrders = []
}

function printArrangedOrdersFromModal() {
  if (!arrangedOrdersForPrint.length) {
    showAdminToast('Không có đơn để in', 'warning')
    closeArrangeSuccessModal()
    return
  }
  const ghtkOrders = extractGHTKPrintableOrders(arrangedOrdersForPrint)
  if (!ghtkOrders.length) {
    showAdminToast('Chưa có mã vận đơn GHTK để in nhãn', 'warning')
    return
  }
  openGHTKLabelsPdf(ghtkOrders.map((o) => Number(o.id)))
  closeArrangeSuccessModal()
}

async function updateOrderStatus(id, status) {
  try {
    const nextStatus = String(status || '').trim().toLowerCase()
    if (nextStatus === 'cancelled') {
      const order = adminOrders.find((x) => Number(x.id) === Number(id))
      const carrier = String(order?.shipping_carrier || '').trim().toUpperCase()
      if (carrier === 'GHTK' && String(order?.shipping_tracking_code || '').trim()) {
        showAdminToast('Dang huy don nay tren dashboard va GHTK...', 'warning')
      }
    }
    await axios.patch('/api/admin/orders/'+id+'/status', { status: nextStatus })
    showAdminToast('Cập nhật trạng thái thành công', 'success')
    await loadAdminOrders()
  } catch(e) { showAdminToast('Lỗi cập nhật', 'error') }
}

async function deleteOrder(id) {
  if (!confirm('Xoá đơn hàng này?')) return
  try {
    await axios.delete('/api/admin/orders/'+id)
    selectedOrderIds.delete(Number(id))
    showAdminToast('Đã xoá đơn hàng', 'success')
    loadAdminOrders()
  } catch(e) { showAdminToast('Lỗi xoá', 'error') }
}

function showOrderDetail(id) {
  const o = adminOrders.find(x => x.id === id)
  if (!o) return
  document.getElementById('orderDetailContent').innerHTML = \`
  <div class="space-y-3 pb-4">
    <div class="grid grid-cols-2 gap-3">
      <div class="bg-gray-50 rounded-xl p-3">
        <p class="text-xs text-gray-500">Mã đơn hàng</p>
        <p class="font-bold text-blue-600">\${o.order_code}</p>
      </div>
      <div class="bg-gray-50 rounded-xl p-3">
        <p class="text-xs text-gray-500">Trạng thái</p>
        <span class="badge badge-\${o.status}">\${statusLabel(o.status)}</span>
      </div>
    </div>
    <div class="bg-pink-50 rounded-xl p-3">
      <p class="text-xs text-gray-500 mb-1">Khách hàng</p>
      <p class="font-semibold">\${displayCustomerName(o.customer_name)}</p>
      <p class="text-sm text-gray-600">\${o.customer_phone}</p>
      <p class="text-sm text-gray-600">\${o.customer_address}</p>
      <p class="text-sm text-gray-600 mt-1"><span class="text-gray-500">Thanh toán:</span> \${formatPaymentMethod(o.payment_method)}</p>
      <p class="text-sm text-gray-600"><span class="text-gray-500">Trạng thái TT:</span> <span class="\${paymentStatusClass(o.payment_status)} px-2 py-0.5 rounded-full text-xs">\${paymentStatusLabel(o.payment_status)}</span></p>
      \${o.payment_paid_at ? \`<p class="text-xs text-green-600 mt-1">Đã thanh toán lúc: \${new Date(o.payment_paid_at).toLocaleString('vi-VN')}</p>\` : ''}
    </div>
    <div class="bg-gray-50 rounded-xl p-3">
      <p class="text-xs text-gray-500 mb-1">Sản phẩm</p>
      <p class="font-semibold">\${o.product_name}</p>
      <div class="flex gap-2 mt-1 flex-wrap">
        \${o.color ? \`<span class="text-xs bg-pink-50 text-pink-600 px-2 py-0.5 rounded-full border border-pink-200">Màu: \${o.color}</span>\` : ''}
        \${o.size ? \`<span class="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full border">Size: \${o.size}</span>\` : ''}
        <span class="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full border">SL: \${o.quantity}</span>
      </div>
    </div>
    \${o.voucher_code ? \`
    <div class="bg-green-50 rounded-xl p-3 flex justify-between items-center">
      <div>
        <p class="text-xs text-gray-500">Voucher áp dụng</p>
        <p class="font-mono font-bold text-green-700 text-sm">\${o.voucher_code}</p>
      </div>
      <span class="font-bold text-green-600">-\${fmtPrice(o.discount_amount)}</span>
    </div>\` : ''}
    <div class="bg-gradient-to-r from-pink-50 to-red-50 rounded-xl p-3 space-y-1">
      \${o.discount_amount > 0 ? \`
      <div class="flex justify-between text-sm">
        <span class="text-gray-500">Tạm tính:</span>
        <span class="text-gray-700">\${fmtPrice(o.product_price * o.quantity)}</span>
      </div>
      <div class="flex justify-between text-sm">
        <span class="text-green-600">Giảm giá:</span>
        <span class="text-green-600 font-semibold">-\${fmtPrice(o.discount_amount)}</span>
      </div>\` : ''}
      <div class="flex justify-between items-center">
        <span class="font-semibold text-gray-700">Còn phải thu:</span>
        <span class="text-xl font-bold text-pink-600">\${fmtPrice(getOrderAmountDue(o))}</span>
      </div>
      \${String(o.payment_status || '').toLowerCase() === 'paid' ? '<p class="text-xs text-green-600">Đơn này đã thanh toán online, khi in đơn hiển thị 0đ.</p>' : ''}
    </div>
    \${o.note ? \`<div class="bg-yellow-50 rounded-xl p-3"><p class="text-xs text-gray-500">Ghi chú</p><p class="text-sm">\${o.note}</p></div>\` : ''}
    <p class="text-xs text-gray-400 text-right">Đặt lúc: \${new Date(o.created_at).toLocaleString('vi-VN')}</p>
  </div>\`
  document.getElementById('orderDetailModal').classList.remove('hidden')
}

// ── EXCEL EXPORT ──────────────────────────────────
function exportExcel() {
  if (!adminOrders.length) { showAdminToast('Không có dữ liệu để xuất', 'error'); return }

  const data = adminOrders.map((o, i) => ({
    'STT': i + 1,
    'Mã đơn hàng': o.order_code,
    'Họ và tên': displayCustomerName(o.customer_name),
    'Số điện thoại': o.customer_phone,
    'Địa chỉ': o.customer_address,
    'Sản phẩm': o.product_name,
    'Đơn giá': o.product_price,
    'Màu sắc': o.color || '',
    'Size': o.size || '',
    'Số lượng': o.quantity,
    'Phương thức thanh toán': formatPaymentMethod(o.payment_method),
    'Trạng thái thanh toán': paymentStatusLabel(o.payment_status),
    'Voucher': o.voucher_code || '',
    'Giảm giá': o.discount_amount || 0,
    'Tổng tiền': getOrderAmountDue(o),
    'Ghi chú': o.note || '',
    'Trạng thái': statusLabel(o.status),
    'Thanh toán lúc': o.payment_paid_at ? new Date(o.payment_paid_at).toLocaleString('vi-VN') : '',
    'Ngày đặt': new Date(o.created_at).toLocaleString('vi-VN')
  }))

  const ws = XLSX.utils.json_to_sheet(data)
  ws['!cols'] = [
    {wch:5},{wch:15},{wch:20},{wch:14},{wch:35},{wch:30},
    {wch:12},{wch:12},{wch:8},{wch:8},{wch:14},{wch:12},{wch:12},{wch:20},{wch:12},{wch:18}
  ]
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Đơn hàng')
  XLSX.writeFile(wb, 'DonHang_QHClothes_' + new Date().toISOString().split('T')[0] + '.xlsx')
  showAdminToast('Xuất Excel thành công!', 'success')
}

// ── VOUCHERS ──────────────────────────────────────
async function loadVouchers() {
  const list = document.getElementById('voucherList')
  list.innerHTML = '<div class="text-center py-8 text-gray-400"><i class="fas fa-spinner fa-spin text-2xl"></i></div>'
  try {
    const res = await axios.get('/api/admin/vouchers')
    const vouchers = res.data.data || []
    if (!vouchers.length) {
      list.innerHTML = '<div class="text-center py-8 text-gray-400"><i class="fas fa-ticket-alt text-4xl mb-2"></i><p>Chưa có voucher nào</p></div>'
      return
    }
    list.innerHTML = vouchers.map(v => {
      const now = new Date()
      const from = new Date(v.valid_from)
      const to = new Date(v.valid_to)
      const expired = to < now
      const notStarted = from > now
      const isValid = !expired && !notStarted && v.is_active
      return \`
      <div class="border rounded-2xl p-4 \${!v.is_active ? 'opacity-50 bg-gray-50' : isValid ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-200' : 'bg-gray-50 border-gray-200'}">
        <div class="flex items-start justify-between gap-2 mb-2">
          <div class="flex items-center gap-2 flex-wrap">
            <span class="font-mono font-bold text-lg tracking-widest \${isValid ? 'text-green-700' : 'text-gray-500'}">\${v.code}</span>
            <span class="text-xs px-2 py-0.5 rounded-full font-medium \${isValid ? 'bg-green-100 text-green-700' : expired ? 'bg-gray-100 text-gray-500' : notStarted ? 'bg-blue-100 text-blue-600' : 'bg-red-100 text-red-600'}">
              \${isValid ? '✅ Hiệu lực' : expired ? '⏰ Hết hạn' : notStarted ? '🕐 Chưa bắt đầu' : '🚫 Tắt'}
            </span>
          </div>
          <div class="flex gap-1 shrink-0">
            <button onclick="toggleVoucher(\${v.id})" class="p-1.5 rounded-lg text-xs \${v.is_active ? 'bg-amber-50 text-amber-600 hover:bg-amber-100' : 'bg-green-50 text-green-600 hover:bg-green-100'} transition" title="\${v.is_active ? 'Tắt' : 'Bật'}">
              <i class="fas fa-\${v.is_active ? 'toggle-off' : 'toggle-on'}"></i>
            </button>
            <button onclick="deleteVoucher(\${v.id})" class="p-1.5 bg-red-50 text-red-500 hover:bg-red-100 rounded-lg text-xs transition" title="Xoá">
              <i class="fas fa-trash"></i>
            </button>
          </div>
        </div>
        <div class="flex items-center gap-3 flex-wrap text-sm">
          <span class="font-bold text-pink-600 text-base">-\${fmtPrice(v.discount_amount)}</span>
          <span class="text-gray-400">|</span>
          <span class="text-gray-500 text-xs">
            <i class="fas fa-calendar text-gray-400 mr-1"></i>
            \${new Date(v.valid_from).toLocaleDateString('vi-VN')} → \${new Date(v.valid_to).toLocaleDateString('vi-VN')}
          </span>
        </div>
        <div class="flex gap-3 mt-1.5 text-xs text-gray-500">
          <span><i class="fas fa-users mr-1 text-gray-400"></i>Đã dùng: <strong>\${v.used_count}</strong>\${v.usage_limit > 0 ? '/'+v.usage_limit : ' (không giới hạn)'}</span>
        </div>
      </div>\`
    }).join('')
  } catch(e) {
    list.innerHTML = '<div class="text-center text-red-400 py-8">Lỗi tải dữ liệu</div>'
  }
}

async function createVoucher(e) {
  e.preventDefault()
  const btn = document.getElementById('createVoucherBtn')
  btn.disabled = true
  btn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Đang tạo...'
  try {
    const res = await axios.post('/api/admin/vouchers', {
      discount_amount: document.getElementById('vDiscount').value,
      valid_from: new Date(document.getElementById('vFrom').value).toISOString(),
      valid_to: new Date(document.getElementById('vTo').value).toISOString(),
      usage_limit: document.getElementById('vLimit').value || 0,
      custom_code: document.getElementById('vCode').value || ''
    })
    const code = res.data.code
    document.getElementById('generatedCode').classList.remove('hidden')
    document.getElementById('generatedCodeText').textContent = code
    showAdminToast('Tạo voucher ' + code + ' thành công!', 'success')
    e.target.reset()
    loadVouchers()
  } catch(err) {
    showAdminToast('Lỗi tạo voucher: ' + (err.response?.data?.error || 'Unknown'), 'error')
  } finally {
    btn.disabled = false
    btn.innerHTML = '<i class="fas fa-magic mr-2"></i>Tạo & Sinh mã Voucher'
  }
}

async function toggleVoucher(id) {
  try {
    await axios.patch('/api/admin/vouchers/' + id + '/toggle')
    loadVouchers()
    showAdminToast('Đã cập nhật trạng thái voucher', 'success')
  } catch(e) { showAdminToast('Lỗi', 'error') }
}

async function deleteVoucher(id) {
  if (!confirm('Xoá voucher này?')) return
  try {
    await axios.delete('/api/admin/vouchers/' + id)
    loadVouchers()
    showAdminToast('Đã xoá voucher', 'success')
  } catch(e) { showAdminToast('Lỗi xoá', 'error') }
}

function copyCode() {
  const code = document.getElementById('generatedCodeText').textContent
  navigator.clipboard.writeText(code).then(() => showAdminToast('Đã sao chép: ' + code, 'success'))
}

// ── UTILS ─────────────────────────────────────────
function fmtPrice(p) { return new Intl.NumberFormat('vi-VN',{style:'currency',currency:'VND'}).format(p||0) }
function getOrderAmountDue(order) {
  if (order && order.amount_due !== undefined && order.amount_due !== null) {
    return Number(order.amount_due || 0)
  }
  return String(order?.payment_status || '').toLowerCase() === 'paid'
    ? 0
    : Number(order?.total_price || 0)
}
function paymentStatusLabel(v) {
  return String(v || '').toLowerCase() === 'paid' ? 'Đã thanh toán' : 'Chưa thanh toán'
}
function paymentStatusClass(v) {
  return String(v || '').toLowerCase() === 'paid'
    ? 'bg-green-100 text-green-700 border border-green-200'
    : 'bg-amber-100 text-amber-700 border border-amber-200'
}
function formatPaymentMethod(v) {
  const key = String(v || '').toUpperCase()
  if (key === 'BANK_TRANSFER') return 'Chuyển khoản ngân hàng'
  if (key === 'MOMO') return 'Ví điện tử MoMo'
  if (key === 'ZALOPAY') return 'ZaloPay'
  return 'COD - Thanh toán khi giao'
}
function paymentMethodTagHTML(method, paymentStatus) {
  const key = String(method || '').toUpperCase()
  const paid = String(paymentStatus || '').toLowerCase() === 'paid'
  const paidMark = paid ? '<i class="fas fa-check-circle text-green-600"></i>' : ''
  if (key === 'BANK_TRANSFER') {
    return '<span class="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200"><i class="fas fa-university"></i>CK ngân hàng ' + paidMark + '</span>'
  }
  if (key === 'MOMO') {
    return '<span class="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-pink-50 text-pink-700 border border-pink-200"><i class="fas fa-wallet"></i>MoMo ' + paidMark + '</span>'
  }
  if (key === 'ZALOPAY') {
    return '<span class="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-sky-50 text-sky-700 border border-sky-200"><i class="fas fa-mobile-alt"></i>ZaloPay ' + paidMark + '</span>'
  }
  return '<span class="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-orange-50 text-orange-700 border border-orange-200"><i class="fas fa-money-bill-wave"></i>COD</span>'
}
function displayCustomerName(name) {
  let n = String(name || '').trim()
  while (n.indexOf('  ') >= 0) n = n.replace('  ', ' ')
  if (/^Trần\s+Công\s+Hiếu[a-z]$/i.test(n)) return 'Trần Công Hiếu'
  if (n.toLowerCase().endsWith("'s")) n = n.slice(0, -2)
  // Fix common input artifact: Vietnamese char + stray latin suffix (e.g. "Hiếus")
  if (n.length >= 2) {
    const last = n.charAt(n.length - 1)
    const prev = n.charAt(n.length - 2)
    const isAsciiLetter = (last >= 'A' && last <= 'Z') || (last >= 'a' && last <= 'z')
    if (isAsciiLetter && prev.charCodeAt(0) > 127) {
      n = n.slice(0, -1)
    }
  }
  return n
}
function isInternalTestOrder(o) {
  const customerName = String(o?.customer_name || '').trim().toLowerCase()
  const note = String(o?.note || '').trim().toLowerCase()
  return customerName === 'local script test' || note.indexOf('test:payos-local') >= 0 || note.indexOf('test:zalopay-local') >= 0
}

function getTrackingDisplayCode(fullCode) {
  const full = String(fullCode || '').trim()
  if (!full) return ''
  const parts = full.split('.').map((p) => String(p || '').trim()).filter(Boolean)
  if (parts.length >= 2 && parts[1]) return parts[1]
  return full
}

async function copyTextValue(value, successMessage) {
  const full = String(value || '').trim()
  if (!full) return false
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(full)
    } else {
      const ta = document.createElement('textarea')
      ta.value = full
      ta.setAttribute('readonly', '')
      ta.style.position = 'fixed'
      ta.style.left = '-9999px'
      document.body.appendChild(ta)
      ta.select()
      document.execCommand('copy')
      document.body.removeChild(ta)
    }
    showAdminToast(successMessage || 'Đã copy', 'success')
    return true
  } catch (_) {
    showAdminToast('Không thể copy', 'error')
    return false
  }
}

async function copyTrackingCode(fullCode) {
  await copyTextValue(fullCode, 'Đã copy mã vận đơn đầy đủ')
}

async function copyPhoneNumber(phone) {
  await copyTextValue(phone, 'Đã copy số điện thoại')
}

async function copyOrderCode(orderCode) {
  await copyTextValue(orderCode, 'Đã copy mã đơn hàng')
}
function safeJson(v) { try { return JSON.parse(v||'[]') } catch { return [] } }
function catLabel(c) { return {unisex:'Unisex',male:'Nam',female:'Nữ'}[c]||c }
function statusLabel(s) { return {pending:'Chờ xử lý',confirmed:'Xác nhận',shipping:'Đang giao',done:'Hoàn thành',cancelled:'Đã hủy'}[s]||s }

function showAdminToast(msg, type='success') {
  const c = document.getElementById('adminToast')
  const t = document.createElement('div')
  t.className = \`toast-admin flex items-center gap-2 px-5 py-3 rounded-2xl shadow-xl text-white text-sm font-medium pointer-events-auto \${type==='error'?'bg-red-500':type==='warning'?'bg-amber-500':'bg-green-500'}\`
  t.innerHTML = \`<i class="fas fa-\${type==='error'?'exclamation-circle':type==='warning'?'exclamation-triangle':'check-circle'}"></i>\${msg}\`
  c.appendChild(t)
  setTimeout(() => { t.style.opacity='0'; t.style.transform='translateX(100%)'; t.style.transition='all 0.3s'; setTimeout(()=>t.remove(),300) }, 3000)
}

// ── ESC key handler - close any open modal ──────────
document.addEventListener('keydown', function(e) {
  if (e.key === 'Escape') {
    const modals = ['productModal', 'orderDetailModal', 'arrangeSuccessModal']
    modals.forEach(id => {
      const el = document.getElementById(id)
      if (el && !el.classList.contains('hidden')) {
        el.classList.add('hidden')
      }
    })
    closeChangeAdminPasswordModal()
    closeAdminAvatarMenu()
    document.body.style.overflow = ''
    // Also close sidebar overlay if open
    document.getElementById('sidebarOverlay').classList.add('hidden')
    document.getElementById('sidebar').classList.add('-translate-x-full')
  }
})

// ── Safety: ensure all modals start hidden on page load ──
document.addEventListener('DOMContentLoaded', function() {
  sanitizeAdminOverlayState()
  window.addEventListener('resize', syncSidebarOverlay)

  document.addEventListener('click', function(e) {
    const target = e.target
    if (!target) return
    const root = document.getElementById('adminAvatarMenuRoot')
    if (!root) return
    if (!root.contains(target)) closeAdminAvatarMenu()
  })
})

// Init
async function initAdminAuth() {
  sanitizeAdminOverlayState()
  try {
    const res = await axios.get('/api/auth/me')
    if (!res.data.isAdmin) {
      window.location.href = '/admin/login'
      return
    }
    adminProfile = res.data?.data || null
    applyAdminAvatarUI()
  } catch (e) {
    // 401 or error → redirect to login
    window.location.href = '/admin/login'
    return
  }
  await loadAdminProfile()
  loadDashboard()
}
initAdminAuth()
<\/script>
</body>
</html>`
}

export default app


function adminLoginHTML(): string {
  return `<!DOCTYPE html>
<html lang="vi">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Đăng nhập Admin – QH Clothes</title>
<link rel="icon" type="image/png" href="/qh-logo.png">
<script src="https://cdn.tailwindcss.com"></script>
<link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
<script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700&family=Inter:wght@300;400;500;600&display=swap');
  * { font-family: 'Inter', sans-serif; }
  .font-display { font-family: 'Playfair Display', serif; }
  .login-bg { background: linear-gradient(135deg, #1a1a2e 0%, #16213e 40%, #0f3460 100%); min-height: 100vh; }
  .glass-card { background: rgba(255,255,255,0.05); backdrop-filter: blur(20px); border: 1px solid rgba(255,255,255,0.1); }
  .btn-login { background: linear-gradient(135deg, #e84393, #c0392b); transition: all 0.3s; }
  .btn-login:hover { opacity: 0.9; transform: scale(1.02); box-shadow: 0 10px 30px rgba(232,67,147,0.3); }
  .input-dark { background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.15); color: white; }
  .input-dark::placeholder { color: rgba(255,255,255,0.4); }
  .input-dark:focus { border-color: #e84393; box-shadow: 0 0 0 3px rgba(232,67,147,0.15); outline: none; }
  @keyframes fadeUp { from { opacity:0; transform:translateY(30px); } to { opacity:1; transform:translateY(0); } }
  .fade-up { animation: fadeUp 0.6s ease; }
  @keyframes shake { 0%,100%{transform:translateX(0)} 15%{transform:translateX(-8px)} 30%{transform:translateX(8px)} 45%{transform:translateX(-6px)} 60%{transform:translateX(6px)} 75%{transform:translateX(-3px)} 90%{transform:translateX(3px)} }
  .shake { animation: shake 0.5s ease; }
</style>
</head>
<body class="login-bg flex items-center justify-center p-4">
  <div class="fade-up w-full max-w-md">
    <!-- Logo -->
    <div class="text-center mb-8">
      <div class="w-16 h-16 rounded-2xl bg-gradient-to-br from-pink-500 to-red-500 flex items-center justify-center mx-auto mb-4 shadow-xl">
        <i class="fas fa-tshirt text-white text-2xl"></i>
      </div>
      <h1 class="font-display text-3xl font-bold text-white">QH<span class="text-pink-400">Clothes</span></h1>
      <p class="text-gray-400 mt-2 text-sm">Admin Panel</p>
    </div>
    <!-- Login Card -->
    <div class="glass-card rounded-3xl p-8" id="loginCard">
      <h2 class="text-white text-xl font-bold mb-6 text-center">
        <i class="fas fa-lock text-pink-400 mr-2"></i>Đăng nhập quản trị
      </h2>
      <div id="loginError" class="hidden mb-4 bg-red-500/20 border border-red-500/30 text-red-300 text-sm px-4 py-3 rounded-xl text-center">
        <i class="fas fa-exclamation-circle mr-1"></i><span id="loginErrorText"></span>
      </div>
      <div class="space-y-4">
        <div>
          <label class="block text-gray-300 text-sm font-medium mb-2"><i class="fas fa-user text-pink-400 mr-1"></i>Tên đăng nhập</label>
          <input type="text" id="loginUsername" placeholder="Nhập tên đăng nhập" class="input-dark w-full px-4 py-3 rounded-xl text-sm" autofocus>
        </div>
        <div>
          <label class="block text-gray-300 text-sm font-medium mb-2"><i class="fas fa-key text-pink-400 mr-1"></i>Mật khẩu</label>
          <div class="relative">
            <input type="password" id="loginPassword" placeholder="Nhập mật khẩu" class="input-dark w-full px-4 py-3 rounded-xl text-sm pr-10">
            <button type="button" onclick="togglePasswordVisibility()" class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-pink-400 transition">
              <i id="togglePwIcon" class="fas fa-eye text-sm"></i>
            </button>
          </div>
        </div>
        <button onclick="doLogin()" id="loginBtn" class="btn-login w-full text-white py-3.5 rounded-xl font-bold text-sm mt-2">
          <i class="fas fa-sign-in-alt mr-2"></i>Đăng nhập
        </button>
      </div>
    </div>
    <p class="text-center text-gray-500 text-xs mt-6">&copy; 2026 QH Clothes. All rights reserved.</p>
  </div>
<script>
  document.getElementById('loginPassword').addEventListener('keydown', (e) => { if (e.key === 'Enter') doLogin() })
  document.getElementById('loginUsername').addEventListener('keydown', (e) => { if (e.key === 'Enter') document.getElementById('loginPassword').focus() })

  function togglePasswordVisibility() {
    const pw = document.getElementById('loginPassword')
    const icon = document.getElementById('togglePwIcon')
    if (pw.type === 'password') { pw.type = 'text'; icon.className = 'fas fa-eye-slash text-sm' }
    else { pw.type = 'password'; icon.className = 'fas fa-eye text-sm' }
  }

  async function doLogin() {
    const username = document.getElementById('loginUsername').value.trim()
    const password = document.getElementById('loginPassword').value
    const errEl = document.getElementById('loginError')
    const errText = document.getElementById('loginErrorText')
    const btn = document.getElementById('loginBtn')
    const card = document.getElementById('loginCard')
    errEl.classList.add('hidden')
    if (!username || !password) {
      errText.textContent = 'Vui lòng nhập đầy đủ thông tin'
      errEl.classList.remove('hidden')
      card.classList.remove('shake'); void card.offsetWidth; card.classList.add('shake')
      return
    }
    btn.disabled = true
    btn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Đang xử lý...'
    try {
      await axios.post('/api/admin/login', { username, password })
      window.location.href = '/admin/dashboard'
    } catch (e) {
      errText.textContent = 'Sai tên đăng nhập hoặc mật khẩu'
      errEl.classList.remove('hidden')
      card.classList.remove('shake'); void card.offsetWidth; card.classList.add('shake')
    } finally {
      btn.disabled = false
      btn.innerHTML = '<i class="fas fa-sign-in-alt mr-2"></i>Đăng nhập'
    }
  }
</script>
</body>
</html>`
}



