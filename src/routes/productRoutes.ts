import { getCookie } from 'hono/cookie'
import type { Hono } from 'hono'
import type { AppBindings } from '../types/app'
import { getAppSettingValue, upsertAppSettings, validateAdminSessionToken } from '../lib/adminHelpers'
import { ensureFrontendVisitorId, getVietnamDateKey, isLikelyHumanBrowser, recordFrontendProductVisit } from '../lib/frontendVisitorHelpers'
import { shapeFlashSaleProduct, loadActiveFlashSaleProductMap } from '../lib/flashSaleHelpers.ts'
import { attachSkuStateToProduct } from '../lib/productFlashSaleView.ts'
import { loadProductSkusByProductIds, syncProductSkus } from '../lib/productSkuHelpers.ts'
import { applyAutoVouchersToProducts } from '../lib/autoVoucherHelpers.ts'

type ProductRouteDeps = {
  initDB: (db: D1Database) => Promise<void>
}

const PRODUCT_TYPES_SETTING_KEY = 'product_types'
const PRODUCT_TYPE_MAP_SETTING_KEY = 'product_type_map'

type ProductTypeDefinition = {
  slug: string
  name: string
  active: boolean
  order: number
  thumbnail?: string
}

const DEFAULT_PRODUCT_TYPES: ProductTypeDefinition[] = [
  { slug: 'tshirt', name: 'Áo phông / thun', active: true, order: 1 },
  { slug: 'polo', name: 'Áo Polo', active: true, order: 2 },
  { slug: 'jacket', name: 'Áo khoác', active: true, order: 3 },
  { slug: 'hoodie', name: 'Hoodie / Sweater', active: true, order: 4 },
  { slug: 'pants', name: 'Quần', active: true, order: 5 },
  { slug: 'jeans', name: 'Quần Jean', active: true, order: 6 },
  { slug: 'dress', name: 'Váy / Đầm', active: true, order: 7 },
  { slug: 'set', name: 'Bộ đồ', active: true, order: 8 }
]

const STOREFRONT_KEYS = ['boypho', 'hottrendnu'] as const
type StorefrontKey = typeof STOREFRONT_KEYS[number]
let storefrontVisibilityColumnReady = false
let productNewArrivalColumnReady = false

async function ensureProductNewArrivalColumn(db: D1Database) {
  if (productNewArrivalColumnReady) return
  try {
    await db.prepare(`ALTER TABLE products ADD COLUMN is_new_arrival INTEGER DEFAULT 0`).run()
  } catch (error: any) {
    const message = String(error?.message || error || '').toLowerCase()
    if (!message.includes('duplicate column') && !message.includes('already exists')) {
      throw error
    }
  }
  await db.prepare(`
    UPDATE products
    SET is_new_arrival = 0
    WHERE is_new_arrival IS NULL
  `).run()
  productNewArrivalColumnReady = true
}

async function ensureStorefrontVisibilityColumn(db: D1Database) {
  if (storefrontVisibilityColumnReady) {
    await ensureProductNewArrivalColumn(db)
    return
  }
  let createdColumn = false
  try {
    await db.prepare(`ALTER TABLE products ADD COLUMN storefront_visibility TEXT NOT NULL DEFAULT '["boypho"]'`).run()
    createdColumn = true
  } catch (error: any) {
    const message = String(error?.message || error || '').toLowerCase()
    if (!message.includes('duplicate column') && !message.includes('already exists')) {
      throw error
    }
  }
  await db.prepare(`
    UPDATE products
    SET storefront_visibility = '["boypho"]'
    WHERE storefront_visibility IS NULL OR TRIM(storefront_visibility) = ''
  `).run()
  if (createdColumn) {
    await db.prepare(`
      UPDATE products
      SET storefront_visibility = '["boypho","hottrendnu"]'
      WHERE LOWER(COALESCE(category, '')) IN ('female', 'women', 'girls')
         OR LOWER(COALESCE(name, '')) LIKE '%váy%'
         OR LOWER(COALESCE(name, '')) LIKE '%đầm%'
         OR LOWER(COALESCE(name, '')) LIKE '%nữ%'
         OR LOWER(COALESCE(name, '')) LIKE '%set%'
         OR LOWER(COALESCE(description, '')) LIKE '%váy%'
         OR LOWER(COALESCE(description, '')) LIKE '%đầm%'
         OR LOWER(COALESCE(description, '')) LIKE '%thời trang nữ%'
    `).run()
  }
  storefrontVisibilityColumnReady = true
  await ensureProductNewArrivalColumn(db)
}

function normalizeStorefrontKey(value: unknown): StorefrontKey | '' {
  const key = String(value || '').trim().toLowerCase()
  return (STOREFRONT_KEYS as readonly string[]).includes(key) ? key as StorefrontKey : ''
}

function normalizeStorefrontVisibility(input: unknown): StorefrontKey[] {
  const source = (() => {
    if (Array.isArray(input)) return input
    if (typeof input === 'string') {
      const trimmed = input.trim()
      if (!trimmed) return []
      try {
        const parsed = JSON.parse(trimmed)
        return Array.isArray(parsed) ? parsed : [trimmed]
      } catch {
        return trimmed.split(',')
      }
    }
    return []
  })()
  const rawKeys = source.map((item) => String(item || '').trim().toLowerCase())
  if (rawKeys.includes('all')) return [...STOREFRONT_KEYS]
  const keys = STOREFRONT_KEYS.filter((key) => rawKeys.includes(key))
  return keys.length ? keys : ['boypho']
}

function serializeStorefrontVisibility(input: unknown): string {
  return JSON.stringify(normalizeStorefrontVisibility(input))
}

function attachStorefrontVisibility<T extends Record<string, any>>(product: T): T & { storefront_visibility: StorefrontKey[] } {
  return {
    ...product,
    storefront_visibility: normalizeStorefrontVisibility(product?.storefront_visibility)
  }
}

function buildStorefrontVisibilityWhere(storefront: unknown, alias = 'p') {
  const key = normalizeStorefrontKey(storefront)
  if (!key) return { clause: '', binds: [] as string[] }
  const column = alias ? `${alias}.storefront_visibility` : 'storefront_visibility'
  const binds = [`%"${key}"%`]
  if (key === 'boypho') {
    return {
      clause: ` AND (${column} IS NULL OR TRIM(${column}) = '' OR ${column} LIKE ?)`,
      binds
    }
  }
  return {
    clause: ` AND ${column} LIKE ?`,
    binds
  }
}

function normalizeProductTypeSlug(value: unknown): string {
  return String(value || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48)
}

function parseJsonValue<T>(raw: unknown, fallback: T): T {
  try {
    const parsed = JSON.parse(String(raw || ''))
    return parsed as T
  } catch {
    return fallback
  }
}

function normalizeProductTypes(input: unknown): ProductTypeDefinition[] {
  const source = Array.isArray(input) ? input : []
  const seen = new Set<string>()
  const out: ProductTypeDefinition[] = []
  source.forEach((item: any, index) => {
    const name = String(item?.name || item?.label || '').trim()
    const slug = normalizeProductTypeSlug(item?.slug || name)
    if (!slug || !name || seen.has(slug)) return
    seen.add(slug)
    out.push({
      slug,
      name: name.slice(0, 80),
      active: item?.active === undefined ? true : !!item.active,
      order: Number.isFinite(Number(item?.order)) ? Number(item.order) : index + 1,
      thumbnail: String(item?.thumbnail || item?.image || '').trim()
    })
  })
  return out.sort((a, b) => a.order - b.order || a.name.localeCompare(b.name, 'vi'))
}

async function loadProductTypes(db: D1Database, options?: { includeInactive?: boolean }): Promise<ProductTypeDefinition[]> {
  const raw = await getAppSettingValue(db, PRODUCT_TYPES_SETTING_KEY)
  const normalized = normalizeProductTypes(parseJsonValue(raw, []))
  const types = normalized.length ? normalized : DEFAULT_PRODUCT_TYPES
  return (options?.includeInactive ? types : types.filter((item) => item.active))
    .map((item, index) => ({ ...item, order: Number(item.order || index + 1) }))
}

async function saveProductTypes(db: D1Database, types: ProductTypeDefinition[]) {
  await upsertAppSettings(db, [{ key: PRODUCT_TYPES_SETTING_KEY, value: JSON.stringify(normalizeProductTypes(types)) }])
}

async function loadProductTypeMap(db: D1Database): Promise<Record<string, string>> {
  const raw = await getAppSettingValue(db, PRODUCT_TYPE_MAP_SETTING_KEY)
  const parsed = parseJsonValue<Record<string, unknown>>(raw, {})
  const out: Record<string, string> = {}
  if (!parsed || typeof parsed !== 'object') return out
  Object.entries(parsed).forEach(([key, value]) => {
    const productId = String(Number(key))
    const slug = normalizeProductTypeSlug(value)
    if (productId !== 'NaN' && slug) out[productId] = slug
  })
  return out
}

async function saveProductTypeMap(db: D1Database, map: Record<string, string>) {
  await upsertAppSettings(db, [{ key: PRODUCT_TYPE_MAP_SETTING_KEY, value: JSON.stringify(map) }])
}

function inferProductTypeFromProduct(product: any): string {
  const explicit = normalizeProductTypeSlug(product?.product_type || product?.product_type_slug)
  if (explicit) return explicit
  const text = `${product?.name || ''} ${product?.description || ''}`.toLowerCase()
  if (text.includes('áo phông') || text.includes('áo thun') || text.includes('t-shirt') || text.includes('tshirt')) return 'tshirt'
  if (text.includes('quần jean') || text.includes('quần bò') || text.includes('jeans')) return 'jeans'
  if (text.includes('áo khoác') || text.includes('jacket')) return 'jacket'
  if (text.includes('hoodie') || text.includes('sweater') || text.includes('nỉ')) return 'hoodie'
  if (text.includes('polo')) return 'polo'
  if (text.includes('váy') || text.includes('đầm')) return 'dress'
  if (text.includes('bộ') || text.includes('set')) return 'set'
  if (text.includes('quần')) return 'pants'
  return ''
}

function attachProductType(product: any, typeMap: Record<string, string>, typeNameMap: Map<string, string>) {
  const productType = typeMap[String(product?.id)] || inferProductTypeFromProduct(product)
  return {
    ...product,
    product_type: productType,
    product_type_name: productType ? (typeNameMap.get(productType) || productType) : ''
  }
}

function getProductPrimaryImage(product: any): string {
  const thumbnail = String(product?.thumbnail || '').trim()
  if (thumbnail) return thumbnail
  try {
    const images = JSON.parse(String(product?.images || '[]'))
    if (Array.isArray(images)) {
      const first = images.map((item) => String(item || '').trim()).find(Boolean)
      if (first) return first
    }
  } catch {
    // ignore malformed legacy image data
  }
  return ''
}

async function enrichProductTypesWithStats(db: D1Database, types: ProductTypeDefinition[], storefront?: unknown) {
  const storefrontWhere = buildStorefrontVisibilityWhere(storefront, '')
  const rows = await db.prepare(`
    SELECT id, name, description, thumbnail, images, storefront_visibility
    FROM products
    WHERE is_active = 1${storefrontWhere.clause}
  `).bind(...storefrontWhere.binds).all()
  const typeMap = await loadProductTypeMap(db)
  const buckets = new Map<string, string[]>()
  const counts = new Map<string, number>()
  ;((rows.results || []) as any[]).forEach((product) => {
    const slug = typeMap[String(product?.id)] || inferProductTypeFromProduct(product)
    if (!slug) return
    counts.set(slug, (counts.get(slug) || 0) + 1)
    const image = getProductPrimaryImage(product)
    if (!image) return
    const list = buckets.get(slug) || []
    list.push(image)
    buckets.set(slug, list)
  })
  return types.map((type) => {
    const images = buckets.get(type.slug) || []
    const randomImage = images.length ? images[Math.floor(Math.random() * images.length)] : ''
    const manualThumbnail = String(type.thumbnail || '').trim()
    return {
      ...type,
      product_count: counts.get(type.slug) || 0,
      resolved_thumbnail: manualThumbnail || randomImage,
      fallback_thumbnail: randomImage
    }
  })
}

function normalizeImageList(input: any): string[] {
  if (!Array.isArray(input)) return []
  return input.map((v) => String(v || '').trim()).filter(Boolean)
}

function normalizeRouteMoney(value: unknown) {
  if (value === null || value === undefined) return null
  const raw = String(value).trim()
  if (!raw) return null
  const num = Number(raw)
  return Number.isFinite(num) ? num : null
}

function resolveProductBasePricing(input: {
  price: unknown
  original_price: unknown
  stock: unknown
  product_skus: unknown
}) {
  const skuRows = Array.isArray(input.product_skus) ? input.product_skus : []
  const activeSkuRows = skuRows
    .filter((row: any) => Number(row?.is_active ?? 1) !== 0 && normalizeRouteMoney(row?.price) !== null && Number(row?.price) > 0)
    .sort((a: any, b: any) => Number(a.price || 0) - Number(b.price || 0))
  const cheapest = activeSkuRows[0] as any
  const price = normalizeRouteMoney(input.price) ?? normalizeRouteMoney(cheapest?.price)
  const originalPrice = normalizeRouteMoney(input.original_price) ?? normalizeRouteMoney(cheapest?.original_price)
  const stock = normalizeRouteMoney(input.stock)
  const skuStock = activeSkuRows.reduce((sum: number, row: any) => sum + Math.max(0, Math.floor(normalizeRouteMoney(row?.stock) ?? 0)), 0)
  return {
    price,
    originalPrice,
    stock: Math.max(0, Math.floor(stock ?? skuStock ?? 0))
  }
}

async function validateUniqueTrendingOrder(
  db: D1Database,
  isTrending: unknown,
  trendingOrder: unknown,
  currentProductId: unknown = null
) {
  const order = parseInt(String(trendingOrder || '0'), 10) || 0
  if (!isTrending || order <= 0) return { ok: true, order: 0 }
  const currentId = Number(currentProductId || 0)
  const result = await db.prepare(
    `SELECT id, name FROM products WHERE is_trending=1 AND COALESCE(trending_order, 0)=? AND (? <= 0 OR id != ?) ORDER BY updated_at DESC, id DESC`
  ).bind(order, currentId, currentId).all()
  const conflicts = Array.isArray((result as any).results) ? (result as any).results : []
  if (conflicts.length === 0) return { ok: true, order }
  if (conflicts.length > 0) return { ok: true, order, staleConflictIds: conflicts.map((row: any) => Number(row?.id || 0)).filter(Boolean) }
  return { ok: true, order }
}

async function clearStaleTrendingOrderConflicts(db: D1Database, validation: any) {
  const ids = Array.isArray(validation?.staleConflictIds)
    ? validation.staleConflictIds.map((id: any) => Number(id || 0)).filter((id: number) => id > 0)
    : []
  for (const id of ids) {
    await db.prepare(
      `UPDATE products SET trending_order=0, updated_at=CURRENT_TIMESTAMP WHERE id=?`
    ).bind(id).run()
  }
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

function compactColorNamesJson(raw: any): string {
  let arr: any[] = []
  try {
    arr = JSON.parse(String(raw || '[]'))
  } catch {
    arr = []
  }
  if (!Array.isArray(arr)) return '[]'
  const names = arr.map((item: any) => {
    if (typeof item === 'string') return String(item || '').trim()
    if (item && typeof item === 'object') return String(item.name || item.label || '').trim()
    return ''
  }).filter(Boolean)
  return JSON.stringify(names)
}

async function buildProductsWithSkus(db: D1Database, rows: any[], options?: { includeInactiveSkus?: boolean }) {
  const productIds = rows.map((row: any) => Number(row.id)).filter((id) => Number.isFinite(id) && id > 0)
  const productTypes = await loadProductTypes(db, { includeInactive: true })
  const productTypeMap = await loadProductTypeMap(db)
  const productTypeNameMap = new Map(productTypes.map((item) => [item.slug, item.name]))
  const skuMap = await loadProductSkusByProductIds(
    db,
    productIds,
    options?.includeInactiveSkus ? { includeInactive: true } : undefined
  )
  const activeFlashSaleRows = await loadActiveFlashSaleProductMap(db, productIds)
  const reviewStats = new Map<number, { avg_rating: number; total_reviews: number }>()
  if (productIds.length) {
    const placeholders = productIds.map(() => '?').join(',')
    const stats = await db.prepare(`
      SELECT product_id, COUNT(*) as total_reviews, ROUND(AVG(rating), 1) as avg_rating
      FROM reviews
      WHERE product_id IN (${placeholders})
      GROUP BY product_id
    `).bind(...productIds).all()
    for (const row of (stats.results || []) as any[]) {
      reviewStats.set(Number(row.product_id), {
        avg_rating: Number(row.avg_rating || 0),
        total_reviews: Number(row.total_reviews || 0)
      })
    }
  }
  const shaped = rows.map((row: any) => attachSkuStateToProduct(
    shapeFlashSaleProduct({
      product: {
        ...attachStorefrontVisibility(attachProductType(row, productTypeMap, productTypeNameMap)),
        avg_rating: reviewStats.get(Number(row.id))?.avg_rating || 0,
        total_reviews: reviewStats.get(Number(row.id))?.total_reviews || 0
      }
    }),
    skuMap.get(Number(row.id)) || [],
    activeFlashSaleRows
  ))
  return applyAutoVouchersToProducts(db, shaped)
}

async function maybeTrackFrontendProductVisit(c: any) {
  try {
    const userAgent = c.req.header('user-agent')
    if (!isLikelyHumanBrowser(userAgent)) return

    const adminToken = String(getCookie(c, 'admin_token') || '')
    if (adminToken) {
      const adminUserKey = String(getCookie(c, 'admin_user_key') || 'admin').trim() || 'admin'
      const isAdmin = await validateAdminSessionToken(c.env.DB, adminUserKey, adminToken)
      if (isAdmin) return
    }

    await recordFrontendProductVisit(c, c.env.DB)
  } catch (error) {
    console.warn('[analytics] frontend product visit tracking skipped', error)
  }
}

async function isTrackableStorefrontVisitor(c: any): Promise<boolean> {
  const userAgent = c.req.header('user-agent')
  if (!isLikelyHumanBrowser(userAgent)) return false

  const adminToken = String(getCookie(c, 'admin_token') || '')
  if (!adminToken) return true

  const adminUserKey = String(getCookie(c, 'admin_user_key') || 'admin').trim() || 'admin'
  return !(await validateAdminSessionToken(c.env.DB, adminUserKey, adminToken))
}

async function recordProductDetailView(c: any, productId: number): Promise<boolean> {
  if (!Number.isFinite(productId) || productId <= 0) return false
  if (!(await isTrackableStorefrontVisitor(c))) return false

  const row = await c.env.DB.prepare(`SELECT id FROM products WHERE id = ? AND is_active = 1`)
    .bind(productId)
    .first()
  if (!row) return false

  const visitorId = await ensureFrontendVisitorId(c)
  const viewDate = getVietnamDateKey()
  const inserted = await c.env.DB.prepare(`
    INSERT OR IGNORE INTO product_daily_viewers (product_id, visitor_id, view_date, first_seen_at, last_seen_at)
    VALUES (?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
  `).bind(productId, visitorId, viewDate).run() as any
  const counted = Number(inserted?.meta?.changes || 0) > 0

  if (!counted) {
    await c.env.DB.prepare(`
      UPDATE product_daily_viewers
      SET last_seen_at = CURRENT_TIMESTAMP
      WHERE product_id = ? AND visitor_id = ? AND view_date = ?
    `).bind(productId, visitorId, viewDate).run()
    return false
  }

  await c.env.DB.prepare(`
    INSERT INTO product_daily_views (product_id, view_date, view_count, updated_at)
    VALUES (?, ?, 1, CURRENT_TIMESTAMP)
    ON CONFLICT(product_id, view_date) DO UPDATE SET
      view_count = view_count + 1,
      updated_at = CURRENT_TIMESTAMP
  `).bind(
    productId,
    viewDate
  ).run()
  return true
}

export function registerProductRoutes(app: Hono<{ Bindings: AppBindings }>, deps: ProductRouteDeps) {
  app.get('/api/product-types', async (c) => {
    try {
      await deps.initDB(c.env.DB)
      await ensureStorefrontVisibilityColumn(c.env.DB)
      const types = await loadProductTypes(c.env.DB)
      const data = await enrichProductTypesWithStats(c.env.DB, types, c.req.query('storefront'))
      return c.json({ success: true, data })
    } catch (e: any) {
      return c.json({ success: false, error: e.message }, 500)
    }
  })

  app.get('/api/admin/product-types', async (c) => {
    try {
      await deps.initDB(c.env.DB)
      const types = await loadProductTypes(c.env.DB, { includeInactive: true })
      const data = await enrichProductTypesWithStats(c.env.DB, types)
      return c.json({ success: true, data })
    } catch (e: any) {
      return c.json({ success: false, error: e.message }, 500)
    }
  })

  app.put('/api/admin/product-types', async (c) => {
    try {
      await deps.initDB(c.env.DB)
      const body = await c.req.json()
      const nextTypes = normalizeProductTypes(Array.isArray(body?.types) ? body.types : [])
      if (!nextTypes.length) return c.json({ success: false, error: 'Cần ít nhất 1 loại sản phẩm' }, 400)
      const typeMap = await loadProductTypeMap(c.env.DB)
      const available = new Set(nextTypes.map((item) => item.slug))
      const missingUsedSlug = Object.values(typeMap).find((slug) => slug && !available.has(slug))
      if (missingUsedSlug) {
        return c.json({ success: false, error: 'Không thể xóa loại đang được gán cho sản phẩm. Hãy tắt hiển thị loại đó hoặc chuyển sản phẩm sang loại khác.' }, 400)
      }
      await saveProductTypes(c.env.DB, nextTypes)
      return c.json({ success: true, data: nextTypes })
    } catch (e: any) {
      return c.json({ success: false, error: e.message }, 500)
    }
  })

  app.get('/api/products', async (c) => {
    try {
      await deps.initDB(c.env.DB)
      await ensureStorefrontVisibilityColumn(c.env.DB)
      const storefrontWhere = buildStorefrontVisibilityWhere(c.req.query('storefront'), '')
      const result = await c.env.DB.prepare(
        `SELECT * FROM products WHERE is_active = 1${storefrontWhere.clause} ORDER BY created_at DESC`
      ).bind(...storefrontWhere.binds).all()
      const rows = result.results || []
      const data = await buildProductsWithSkus(c.env.DB, rows)
      await maybeTrackFrontendProductVisit(c)
      return c.json({
        success: true,
        data
      })
    } catch (e: any) {
      return c.json({ success: false, error: e.message }, 500)
    }
  })

  app.get('/api/products/:id', async (c) => {
    try {
      await deps.initDB(c.env.DB)
      await ensureStorefrontVisibilityColumn(c.env.DB)
      const id = c.req.param('id')
      const row = await c.env.DB.prepare(`SELECT * FROM products WHERE id = ?`).bind(id).first()
      if (!row) return c.json({ success: false, error: 'Not found' }, 404)
      const [shaped] = await buildProductsWithSkus(c.env.DB, [row])
      if (Number((row as any).is_active || 0) === 1) {
        await maybeTrackFrontendProductVisit(c)
      }
      return c.json({
        success: true,
        data: {
          ...shaped,
          storefront_visibility: normalizeStorefrontVisibility((row as any).storefront_visibility),
          color_options: parseColorOptions((row as any).colors),
          color_names: compactColorNamesJson((row as any).colors)
        }
      })
    } catch (e: any) {
      return c.json({ success: false, error: e.message }, 500)
    }
  })

  app.post('/api/products/:id/view', async (c) => {
    try {
      await deps.initDB(c.env.DB)
      await ensureStorefrontVisibilityColumn(c.env.DB)
      const productId = Number(c.req.param('id'))
      const counted = await recordProductDetailView(c, productId)
      return c.json({ success: true, counted })
    } catch (e: any) {
      console.warn('[analytics] product detail view tracking skipped', e)
      return c.json({ success: true, counted: false })
    }
  })

  app.get('/api/admin/products/:id', async (c) => {
    try {
      await deps.initDB(c.env.DB)
      await ensureStorefrontVisibilityColumn(c.env.DB)
      const id = c.req.param('id')
      const productTypes = await loadProductTypes(c.env.DB, { includeInactive: true })
      const productTypeMap = await loadProductTypeMap(c.env.DB)
      const productTypeNameMap = new Map(productTypes.map((item) => [item.slug, item.name]))
      const row = await c.env.DB.prepare(`
        SELECT p.*,
               COALESCE(v.view_count, 0) AS view_count
        FROM products p
        LEFT JOIN (
          SELECT product_id, SUM(view_count) AS view_count
          FROM product_daily_views
          GROUP BY product_id
        ) v ON v.product_id = p.id
        WHERE p.id = ?
      `).bind(id).first()
      if (!row) return c.json({ success: false, error: 'Không tìm thấy sản phẩm' }, 404)
      const skuMap = await loadProductSkusByProductIds(c.env.DB, [id], { includeInactive: true })
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
          ...attachStorefrontVisibility(attachProductType(row, productTypeMap, productTypeNameMap)),
          image_list: images,
          size_list: sizes,
          skus: skuMap.get(Number(id)) || [],
          product_skus: skuMap.get(Number(id)) || [],
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
      await deps.initDB(c.env.DB)
      await ensureStorefrontVisibilityColumn(c.env.DB)
      const productTypes = await loadProductTypes(c.env.DB, { includeInactive: true })
      const productTypeMap = await loadProductTypeMap(c.env.DB)
      const productTypeNameMap = new Map(productTypes.map((item) => [item.slug, item.name]))
      const result = await c.env.DB.prepare(
        `SELECT p.id, p.name, p.description, p.price, p.original_price, p.category, p.brand, p.material,
                p.thumbnail, p.colors, p.sizes, p.stock, p.is_active, p.is_featured, p.is_trending, p.is_new_arrival,
                p.trending_order, p.created_at, p.updated_at, p.display_order, p.storefront_visibility,
                COALESCE(v.view_count, 0) AS view_count
         FROM products p
         LEFT JOIN (
           SELECT product_id, SUM(view_count) AS view_count
           FROM product_daily_views
           GROUP BY product_id
         ) v ON v.product_id = p.id
         ORDER BY
           CASE WHEN p.is_trending=1 AND COALESCE(p.trending_order, 0) > 0 THEN 0 ELSE 1 END ASC,
           CASE WHEN p.is_trending=1 AND COALESCE(p.trending_order, 0) > 0 THEN p.trending_order ELSE 999999 END ASC,
           datetime(p.created_at) DESC,
           p.id DESC`
      ).all()
      const rows = result.results || []
      const skuMap = await loadProductSkusByProductIds(c.env.DB, rows.map((row: any) => row.id), { includeInactive: true })
      return c.json({
        success: true,
        data: rows.map((row: any) => ({
          ...attachStorefrontVisibility(attachProductType(row, productTypeMap, productTypeNameMap)),
          colors: compactColorNamesJson(row.colors),
          color_names: compactColorNamesJson(row.colors),
          skus: skuMap.get(Number(row.id)) || [],
          product_skus: skuMap.get(Number(row.id)) || []
        }))
      })
    } catch (e: any) {
      return c.json({ success: false, error: e.message }, 500)
    }
  })

  app.post('/api/admin/products', async (c) => {
    try {
      await deps.initDB(c.env.DB)
      await ensureStorefrontVisibilityColumn(c.env.DB)
      const body = await c.req.json()
      const {
        name, description, price, original_price,
        category, product_type, brand, material, thumbnail,
        images, colors, sizes, stock, is_featured, is_trending, is_new_arrival, trending_order, storefront_visibility, product_skus
      } = body
      const basePricing = resolveProductBasePricing({ price, original_price, stock, product_skus })

      if (!name || !basePricing.price) {
        return c.json({ success: false, error: 'Name and price are required' }, 400)
      }
      const normalizedImages = normalizeImageList(images)
      const normalizedColors = normalizeColorOptionsInput(colors)
      const normalizedThumbnail = String(thumbnail || '').trim()
      if (!normalizedThumbnail && normalizedImages.length === 0) {
        return c.json({ success: false, error: 'Product image is required' }, 400)
      }
      const trendingOrderValidation = await validateUniqueTrendingOrder(c.env.DB, is_trending, trending_order)
      if (!trendingOrderValidation.ok) {
        return c.json({ success: false, error: trendingOrderValidation.error }, 400)
      }
      await clearStaleTrendingOrderConflicts(c.env.DB, trendingOrderValidation)

      const result = await c.env.DB.prepare(`
        INSERT INTO products
          (name, description, price, original_price, category, brand, material, thumbnail, images, colors, sizes, stock, is_featured, is_trending, is_new_arrival, trending_order, storefront_visibility)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        name,
        description || '',
        basePricing.price,
        basePricing.originalPrice,
        category || 'unisex',
        brand || '',
        material || '',
        normalizedThumbnail,
        JSON.stringify(normalizedImages),
        JSON.stringify(normalizedColors),
        JSON.stringify(sizes || []),
        basePricing.stock,
        is_featured ? 1 : 0,
        is_trending ? 1 : 0,
        is_new_arrival ? 1 : 0,
        trendingOrderValidation.order,
        serializeStorefrontVisibility(storefront_visibility)
      ).run()

      const createdId = result.meta.last_row_id
      const productTypeSlug = normalizeProductTypeSlug(product_type)
      if (productTypeSlug) {
        const typeMap = await loadProductTypeMap(c.env.DB)
        typeMap[String(createdId)] = productTypeSlug
        await saveProductTypeMap(c.env.DB, typeMap)
      }
      const created = await c.env.DB.prepare(`SELECT * FROM products WHERE id = ?`).bind(createdId).first()
      if (created) await syncProductSkus(c.env.DB, { ...(created as any), product_skus })

      return c.json({ success: true, id: createdId })
    } catch (e: any) {
      return c.json({ success: false, error: e.message }, 500)
    }
  })

  app.put('/api/admin/products/:id', async (c) => {
    try {
      await deps.initDB(c.env.DB)
      await ensureStorefrontVisibilityColumn(c.env.DB)
      const id = c.req.param('id')
      const body = await c.req.json()
      const {
        name, description, price, original_price,
        category, product_type, brand, material, thumbnail,
        images, colors, sizes, stock, is_active, is_featured, is_trending, is_new_arrival, trending_order, storefront_visibility, product_skus
      } = body
      const basePricing = resolveProductBasePricing({ price, original_price, stock, product_skus })
      if (!name || !basePricing.price) {
        return c.json({ success: false, error: 'Name and price are required' }, 400)
      }

      const normalizedImages = normalizeImageList(images)
      const normalizedColors = normalizeColorOptionsInput(colors)
      const normalizedThumbnail = String(thumbnail || '').trim()
      if (!normalizedThumbnail && normalizedImages.length === 0) {
        return c.json({ success: false, error: 'Product image is required' }, 400)
      }
      const trendingOrderValidation = await validateUniqueTrendingOrder(c.env.DB, is_trending, trending_order, id)
      if (!trendingOrderValidation.ok) {
        return c.json({ success: false, error: trendingOrderValidation.error }, 400)
      }
      await clearStaleTrendingOrderConflicts(c.env.DB, trendingOrderValidation)

      await c.env.DB.prepare(`
        UPDATE products SET
          name=?, description=?, price=?, original_price=?,
          category=?, brand=?, material=?, thumbnail=?,
          images=?, colors=?, sizes=?, stock=?, is_active=?, is_featured=?, is_trending=?, is_new_arrival=?, trending_order=?, storefront_visibility=?,
          updated_at=CURRENT_TIMESTAMP
        WHERE id=?
      `).bind(
        name,
        description || '',
        basePricing.price,
        basePricing.originalPrice,
        category || 'unisex',
        brand || '',
        material || '',
        normalizedThumbnail,
        JSON.stringify(normalizedImages),
        JSON.stringify(normalizedColors),
        JSON.stringify(sizes || []),
        basePricing.stock,
        is_active !== undefined ? (is_active ? 1 : 0) : 1,
        is_featured ? 1 : 0,
        is_trending ? 1 : 0,
        is_new_arrival ? 1 : 0,
        trendingOrderValidation.order,
        serializeStorefrontVisibility(storefront_visibility),
        id
      ).run()

      const typeMap = await loadProductTypeMap(c.env.DB)
      const productTypeSlug = normalizeProductTypeSlug(product_type)
      if (productTypeSlug) typeMap[String(Number(id))] = productTypeSlug
      else delete typeMap[String(Number(id))]
      await saveProductTypeMap(c.env.DB, typeMap)

      const updated = await c.env.DB.prepare(`SELECT * FROM products WHERE id = ?`).bind(id).first()
      if (updated) await syncProductSkus(c.env.DB, { ...(updated as any), product_skus })

      return c.json({ success: true })
    } catch (e: any) {
      return c.json({ success: false, error: e.message }, 500)
    }
  })

  app.delete('/api/admin/products/:id', async (c) => {
    try {
      await deps.initDB(c.env.DB)
      const id = Number(c.req.param('id'))
      if (!Number.isInteger(id) || id <= 0) {
        return c.json({ success: false, error: 'Mã sản phẩm không hợp lệ' }, 400)
      }

      const product = await c.env.DB.prepare(`SELECT id FROM products WHERE id = ?`).bind(id).first()
      if (!product) {
        return c.json({ success: false, error: 'Không tìm thấy sản phẩm' }, 404)
      }

      const orderReference = await c.env.DB.prepare(`
        SELECT COUNT(*) AS count FROM orders WHERE product_id = ?
      `).bind(id).first<{ count: number }>()
      if (Number(orderReference?.count || 0) > 0) {
        return c.json({
          success: false,
          error: 'Sản phẩm đã có đơn hàng nên không thể xóa. Hãy ẩn sản phẩm để giữ nguyên lịch sử đơn hàng.'
        }, 409)
      }

      await c.env.DB.prepare(`DELETE FROM flash_sale_items WHERE product_id = ?`).bind(id).run()
      await c.env.DB.prepare(`DELETE FROM reviews WHERE product_id = ?`).bind(id).run()
      await c.env.DB.prepare(`DELETE FROM product_daily_viewers WHERE product_id = ?`).bind(id).run()
      await c.env.DB.prepare(`DELETE FROM product_daily_views WHERE product_id = ?`).bind(id).run()
      await c.env.DB.prepare(`DELETE FROM product_detail_views WHERE product_id = ?`).bind(id).run()
      await c.env.DB.prepare(`DELETE FROM product_skus WHERE product_id = ?`).bind(id).run()
      await c.env.DB.prepare(`UPDATE hero_banners SET product_id = NULL WHERE product_id = ?`).bind(id).run()
      await c.env.DB.prepare(`DELETE FROM products WHERE id = ?`).bind(id).run()
      const typeMap = await loadProductTypeMap(c.env.DB)
      delete typeMap[String(id)]
      await saveProductTypeMap(c.env.DB, typeMap)
      return c.json({ success: true })
    } catch (e: any) {
      return c.json({ success: false, error: e.message }, 500)
    }
  })

  app.patch('/api/admin/products/:id/toggle', async (c) => {
    try {
      const id = c.req.param('id')
      await c.env.DB.prepare(`
        UPDATE products SET is_active = CASE WHEN is_active=1 THEN 0 ELSE 1 END,
        updated_at=CURRENT_TIMESTAMP WHERE id=?
      `).bind(id).run()
      const updated = await c.env.DB.prepare(`SELECT * FROM products WHERE id = ?`).bind(id).first()
      if (updated) await syncProductSkus(c.env.DB, updated as any)
      return c.json({ success: true })
    } catch (e: any) {
      return c.json({ success: false, error: e.message }, 500)
    }
  })

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

  app.get('/api/featured-products', async (c) => {
    try {
      await deps.initDB(c.env.DB)
      await ensureStorefrontVisibilityColumn(c.env.DB)
      const storefrontWhere = buildStorefrontVisibilityWhere(c.req.query('storefront'), '')
      const res = await c.env.DB.prepare(
        `SELECT * FROM products WHERE is_active=1 AND is_featured=1${storefrontWhere.clause} ORDER BY display_order ASC, id DESC`
      ).bind(...storefrontWhere.binds).all()
      const data = await buildProductsWithSkus(c.env.DB, res.results || [])
      await maybeTrackFrontendProductVisit(c)
      return c.json({ success: true, data })
    } catch (e: any) {
      return c.json({ success: false, error: e.message }, 500)
    }
  })

  app.get('/api/trending-products', async (c) => {
    try {
      await deps.initDB(c.env.DB)
      await ensureStorefrontVisibilityColumn(c.env.DB)
      const storefrontWhere = buildStorefrontVisibilityWhere(c.req.query('storefront'), '')
      const res = await c.env.DB.prepare(
        `SELECT * FROM products WHERE is_active=1 AND is_trending=1${storefrontWhere.clause}
         ORDER BY
           CASE WHEN COALESCE(trending_order, 0) > 0 THEN 0 ELSE 1 END ASC,
           CASE WHEN COALESCE(trending_order, 0) > 0 THEN trending_order ELSE 999999 END ASC,
           datetime(updated_at) DESC,
           id DESC`
      ).bind(...storefrontWhere.binds).all()
      const data = await buildProductsWithSkus(c.env.DB, res.results || [])
      await maybeTrackFrontendProductVisit(c)
      return c.json({ success: true, data })
    } catch (e: any) {
      return c.json({ success: false, error: e.message }, 500)
    }
  })

  app.get('/api/new-arrival-products', async (c) => {
    try {
      await deps.initDB(c.env.DB)
      await ensureStorefrontVisibilityColumn(c.env.DB)
      const limit = Math.min(20, Math.max(1, Number(c.req.query('limit') || 10)))
      const storefrontWhere = buildStorefrontVisibilityWhere(c.req.query('storefront'), '')
      const res = await c.env.DB.prepare(
        `SELECT * FROM products WHERE is_active=1 AND is_new_arrival=1${storefrontWhere.clause}
         ORDER BY datetime(updated_at) DESC, datetime(created_at) DESC, id DESC
         LIMIT ?`
      ).bind(...storefrontWhere.binds, limit).all()
      const data = await buildProductsWithSkus(c.env.DB, res.results || [])
      await maybeTrackFrontendProductVisit(c)
      return c.json({ success: true, data })
    } catch (e: any) {
      return c.json({ success: false, error: e.message }, 500)
    }
  })

  app.get('/api/bestsellers', async (c) => {
    try {
      await deps.initDB(c.env.DB)
      await ensureStorefrontVisibilityColumn(c.env.DB)
      const limit = Math.min(20, Math.max(1, Number(c.req.query('limit') || 10)))
      const storefrontWhere = buildStorefrontVisibilityWhere(c.req.query('storefront'), 'p')
      // Sum quantity for orders with status: done/shipping/waiting_pickup (confirmed sold)
      const res = await c.env.DB.prepare(
        `SELECT p.*, COALESCE(s.total_sold, 0) as total_sold
         FROM products p
         LEFT JOIN (
           SELECT product_id, SUM(quantity) as total_sold
           FROM orders
           WHERE status IN ('done', 'shipping', 'waiting_pickup', 'pending')
           GROUP BY product_id
         ) s ON s.product_id = p.id
         WHERE p.is_active = 1${storefrontWhere.clause}
         ORDER BY COALESCE(s.total_sold, 0) DESC, p.id DESC
         LIMIT ?`
      ).bind(...storefrontWhere.binds, limit).all()
      const rows = res.results || []
      const shaped = await buildProductsWithSkus(c.env.DB, rows)
      // Attach total_sold from the raw rows since buildProductsWithSkus may not preserve it
      const result = shaped.map((item: any, idx: number) => ({
        ...item,
        total_sold: Number((rows[idx] as any).total_sold || 0)
      }))
      await maybeTrackFrontendProductVisit(c)
      return c.json({ success: true, data: result })
    } catch (e: any) {
      return c.json({ success: false, error: e.message }, 500)
    }
  })
}
