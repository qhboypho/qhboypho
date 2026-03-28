import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { serveStatic } from 'hono/cloudflare-workers'
import { getCookie, setCookie, deleteCookie } from 'hono/cookie'
import { PDFDocument } from 'pdf-lib'
import { registerPageRoutes } from './routes/pageRoutes'
import { registerAuthRoutes } from './routes/authRoutes'
import { registerProductRoutes } from './routes/productRoutes'
import { registerOrderRoutes } from './routes/orderRoutes'
import { registerPaymentRoutes } from './routes/paymentRoutes'
import { registerVoucherStatsRoutes } from './routes/voucherStatsRoutes'
import {
  ADDRESS_KIT_BASE_URL,
  addressKitCache,
  buildZaloPayAppTransId,
  getZaloPayConfig,
  getZaloPayMissingConfigKeys,
  parseJsonObject,
  payOSBuildDataString,
  payOSGetPaymentInfo,
  payOSSignWithChecksum,
  sanitizeAddressEffectiveDate,
  syncOrderPayment,
  syncOrderPaymentWithPayOS,
  syncOrderPaymentWithZaloPay
} from './lib/paymentHelpers'

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

registerPaymentRoutes(app, {
  initDB,
  syncOrderPayment,
  syncOrderPaymentWithPayOS,
  syncOrderPaymentWithZaloPay,
  getZaloPayConfig,
  getZaloPayMissingConfigKeys,
  sanitizeAddressEffectiveDate,
  addressKitCache,
  ADDRESS_KIT_BASE_URL,
  buildZaloPayAppTransId,
  payOSSignWithChecksum,
  payOSBuildDataString,
  parseJsonObject,
  payOSGetPaymentInfo
})

registerVoucherStatsRoutes(app, {
  initDB,
  buildInternalTestOrderWhereSql
})


registerPageRoutes(app)

export default app
