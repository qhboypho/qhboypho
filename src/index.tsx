import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { serveStatic } from 'hono/cloudflare-workers'
import { getCookie, setCookie, deleteCookie } from 'hono/cookie'
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
import {
  buildInternalTestOrderWhereSql,
  getGhtkPickupConfig,
  ghtkCancelShipment,
  ghtkCreateShipment,
  ghtkFetchLabelPdf,
  ghtkFetchPickupAddresses,
  mergePdfBytes
} from './lib/shippingHelpers'
import {
  getAppSettingValue,
  normalizeAdminUserKey,
  resolveAdminProfile,
  upsertAppSettings
} from './lib/adminHelpers'

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

