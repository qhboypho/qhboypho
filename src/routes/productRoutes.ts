import { getCookie } from 'hono/cookie'
import type { Hono } from 'hono'
import type { AppBindings } from '../types/app'
import { validateAdminSessionToken } from '../lib/adminHelpers'
import { getVietnamDateKey, isLikelyHumanBrowser, recordFrontendProductVisit } from '../lib/frontendVisitorHelpers'
import { shapeFlashSaleProduct, loadActiveFlashSaleProductMap } from '../lib/flashSaleHelpers.ts'
import { attachSkuStateToProduct } from '../lib/productFlashSaleView.ts'
import { loadProductSkusByProductIds, syncProductSkus } from '../lib/productSkuHelpers.ts'

type ProductRouteDeps = {
  initDB: (db: D1Database) => Promise<void>
}

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
  const skuMap = await loadProductSkusByProductIds(
    db,
    rows.map((row: any) => row.id),
    options?.includeInactiveSkus ? { includeInactive: true } : undefined
  )
  const activeFlashSaleRows = await loadActiveFlashSaleProductMap(db, rows.map((row: any) => row.id))
  return rows.map((row: any) => attachSkuStateToProduct(
    shapeFlashSaleProduct({ product: row }),
    skuMap.get(Number(row.id)) || [],
    activeFlashSaleRows
  ))
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

  await c.env.DB.prepare(`
    INSERT INTO product_daily_views (product_id, view_date, view_count, updated_at)
    VALUES (?, ?, 1, CURRENT_TIMESTAMP)
    ON CONFLICT(product_id, view_date) DO UPDATE SET
      view_count = view_count + 1,
      updated_at = CURRENT_TIMESTAMP
  `).bind(
    productId,
    getVietnamDateKey()
  ).run()
  return true
}

export function registerProductRoutes(app: Hono<{ Bindings: AppBindings }>, deps: ProductRouteDeps) {
  app.get('/api/products', async (c) => {
    try {
      await deps.initDB(c.env.DB)
      const result = await c.env.DB.prepare(
        `SELECT * FROM products WHERE is_active = 1 ORDER BY created_at DESC`
      ).all()
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
      const id = c.req.param('id')
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
          ...row,
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
      const result = await c.env.DB.prepare(
        `SELECT p.id, p.name, p.description, p.price, p.original_price, p.category, p.brand, p.material,
                p.thumbnail, p.colors, p.sizes, p.stock, p.is_active, p.is_featured, p.is_trending,
                p.trending_order, p.created_at, p.updated_at, p.display_order,
                COALESCE(v.view_count, 0) AS view_count
         FROM products p
         LEFT JOIN (
           SELECT product_id, SUM(view_count) AS view_count
           FROM product_daily_views
           GROUP BY product_id
         ) v ON v.product_id = p.id
         ORDER BY p.created_at DESC`
      ).all()
      const rows = result.results || []
      const skuMap = await loadProductSkusByProductIds(c.env.DB, rows.map((row: any) => row.id), { includeInactive: true })
      return c.json({
        success: true,
        data: rows.map((row: any) => ({
          ...row,
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

      const createdId = result.meta.last_row_id
      const created = await c.env.DB.prepare(`SELECT * FROM products WHERE id = ?`).bind(createdId).first()
      if (created) await syncProductSkus(c.env.DB, created as any)

      return c.json({ success: true, id: createdId })
    } catch (e: any) {
      return c.json({ success: false, error: e.message }, 500)
    }
  })

  app.put('/api/admin/products/:id', async (c) => {
    try {
      await deps.initDB(c.env.DB)
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

      const updated = await c.env.DB.prepare(`SELECT * FROM products WHERE id = ?`).bind(id).first()
      if (updated) await syncProductSkus(c.env.DB, updated as any)

      return c.json({ success: true })
    } catch (e: any) {
      return c.json({ success: false, error: e.message }, 500)
    }
  })

  app.delete('/api/admin/products/:id', async (c) => {
    try {
      const id = c.req.param('id')
      await c.env.DB.prepare(`DELETE FROM products WHERE id = ?`).bind(id).run()
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
      const res = await c.env.DB.prepare(
        `SELECT * FROM products WHERE is_active=1 AND is_featured=1 ORDER BY display_order ASC, id DESC`
      ).all()
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
      const res = await c.env.DB.prepare(
        `SELECT * FROM products WHERE is_active=1 AND is_trending=1
         ORDER BY
           CASE WHEN COALESCE(trending_order, 0) > 0 THEN 0 ELSE 1 END ASC,
           CASE WHEN COALESCE(trending_order, 0) > 0 THEN trending_order ELSE 999999 END ASC,
           datetime(updated_at) DESC,
           id DESC`
      ).all()
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
      const limit = Math.min(20, Math.max(1, Number(c.req.query('limit') || 10)))
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
         WHERE p.is_active = 1
         ORDER BY COALESCE(s.total_sold, 0) DESC, p.id DESC
         LIMIT ?`
      ).bind(limit).all()
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
