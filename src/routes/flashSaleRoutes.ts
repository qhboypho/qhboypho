import type { Hono } from 'hono'
import type { AppBindings } from '../types/app'
import { getFlashSaleStatus } from '../lib/flashSaleHelpers'

type FlashSaleRouteDeps = {
  initDB: (db: D1Database) => Promise<void>
}

type FlashSaleListRow = {
  id: number
  name: string
  start_at: string
  end_at: string
  is_active: number
  created_at: string
  updated_at: string
  product_count: number
  item_count: number
  enabled_item_count: number
}

function parseStatusFilter(raw: unknown) {
  const value = String(raw ?? 'all').trim().toLowerCase()
  if (value === 'active' || value === 'upcoming' || value === 'all') return value
  return 'all'
}

function normalizeNumber(value: unknown) {
  const num = typeof value === 'number' ? value : Number(String(value ?? '').trim())
  return Number.isFinite(num) ? num : 0
}

function mapCampaignRow(row: FlashSaleListRow) {
  const status = getFlashSaleStatus({
    is_active: row.is_active,
    start_at: row.start_at,
    end_at: row.end_at
  })

  return {
    id: row.id,
    name: row.name,
    start_at: row.start_at,
    end_at: row.end_at,
    is_active: row.is_active,
    created_at: row.created_at,
    updated_at: row.updated_at,
    status,
    status_key: status.key,
    status_label: status.label,
    product_count: normalizeNumber(row.product_count),
    item_count: normalizeNumber(row.item_count),
    enabled_item_count: normalizeNumber(row.enabled_item_count)
  }
}

export function registerFlashSaleRoutes(app: Hono<{ Bindings: AppBindings }>, deps: FlashSaleRouteDeps) {
  app.get('/api/admin/flash-sales', async (c) => {
    try {
      await deps.initDB(c.env.DB)
      const statusFilter = parseStatusFilter(c.req.query('status'))
      const result = await c.env.DB.prepare(`
        SELECT
          fs.id,
          fs.name,
          fs.start_at,
          fs.end_at,
          fs.is_active,
          fs.created_at,
          fs.updated_at,
          COUNT(DISTINCT fsi.product_id) AS product_count,
          COUNT(fsi.id) AS item_count,
          COALESCE(SUM(CASE WHEN COALESCE(fsi.is_enabled, 1) = 1 THEN 1 ELSE 0 END), 0) AS enabled_item_count
        FROM flash_sales fs
        LEFT JOIN flash_sale_items fsi ON fsi.flash_sale_id = fs.id
        GROUP BY fs.id
        ORDER BY datetime(fs.created_at) DESC, fs.id DESC
      `).all() as { results?: FlashSaleListRow[] }

      const rows = (result.results || []).map(mapCampaignRow)
      const filteredRows = statusFilter === 'all'
        ? rows
        : rows.filter((row) => row.status.key === statusFilter)

      return c.json({
        success: true,
        data: filteredRows,
        meta: {
          status: statusFilter,
          total: filteredRows.length
        }
      })
    } catch (e: any) {
      return c.json({ success: false, error: e.message }, 500)
    }
  })

  app.get('/api/admin/flash-sales/:id', async (c) => {
    try {
      await deps.initDB(c.env.DB)
      const id = c.req.param('id')
      const campaign = await c.env.DB.prepare(`SELECT * FROM flash_sales WHERE id = ?`).bind(id).first() as any
      if (!campaign) {
        return c.json({ success: false, error: 'Không tìm thấy flashsale' }, 404)
      }

      const itemsResult = await c.env.DB.prepare(`
        SELECT
          fsi.id,
          fsi.flash_sale_id,
          fsi.product_id,
          fsi.sale_price,
          fsi.discount_percent,
          fsi.purchase_limit,
          fsi.is_enabled,
          fsi.created_at,
          fsi.updated_at,
          p.name AS product_name,
          p.thumbnail AS product_thumbnail,
          p.price AS product_price,
          p.original_price AS product_original_price
        FROM flash_sale_items fsi
        LEFT JOIN products p ON p.id = fsi.product_id
        WHERE fsi.flash_sale_id = ?
        ORDER BY fsi.id ASC
      `).bind(id).all()

      const status = getFlashSaleStatus(campaign)

      return c.json({
        success: true,
        data: {
          ...campaign,
          status,
          status_key: status.key,
          status_label: status.label,
          items: itemsResult.results || [],
          product_count: Array.isArray(itemsResult.results)
            ? new Set((itemsResult.results as any[]).map((item) => item.product_id).filter(Boolean)).size
            : 0
        }
      })
    } catch (e: any) {
      return c.json({ success: false, error: e.message }, 500)
    }
  })

  app.post('/api/admin/flash-sales', async (c) => {
    try {
      await deps.initDB(c.env.DB)
      const body = await c.req.json().catch(() => ({}))
      return c.json({ success: true, data: body, message: 'FLASH_SALE_CREATE_PLACEHOLDER' })
    } catch (e: any) {
      return c.json({ success: false, error: e.message }, 500)
    }
  })

  app.get('/api/flash-sales', async (c) => {
    try {
      await deps.initDB(c.env.DB)
      return c.json({ success: true, data: [] })
    } catch (e: any) {
      return c.json({ success: false, error: e.message }, 500)
    }
  })

  app.get('/api/flash-sales/active-products', async (c) => {
    try {
      await deps.initDB(c.env.DB)
      return c.json({ success: true, data: [] })
    } catch (e: any) {
      return c.json({ success: false, error: e.message }, 500)
    }
  })
}
