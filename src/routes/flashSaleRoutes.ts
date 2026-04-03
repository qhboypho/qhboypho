import type { Hono } from 'hono'
import type { AppBindings } from '../types/app'
import { getFlashSaleStatus } from '../lib/flashSaleHelpers.ts'

type FlashSaleRouteDeps = {
  initDB: (db: D1Database) => Promise<void>
}

type FlashSaleCreateItemInput = {
  product_id?: number | string | null
  sale_price?: number | string | null
  discount_percent?: number | string | null
  purchase_limit?: number | string | null
  is_enabled?: number | string | boolean | null
}

type FlashSaleCreateBody = {
  name?: string
  start_at?: string
  end_at?: string
  items?: FlashSaleCreateItemInput[]
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

function normalizeMaybeNumber(value: unknown) {
  if (value === null || value === undefined) return null
  if (typeof value === 'number') return Number.isFinite(value) ? value : null
  const raw = String(value).trim()
  if (!raw) return null
  const num = Number(raw)
  return Number.isFinite(num) ? num : null
}

function normalizeDateTime(value: unknown) {
  const raw = String(value ?? '').trim()
  if (!raw) return null
  const parsed = Date.parse(raw.includes('T') ? raw : raw.replace(' ', 'T'))
  return Number.isFinite(parsed) ? raw : null
}

function normalizeBooleanFlag(value: unknown) {
  if (typeof value === 'boolean') return value ? 1 : 0
  const numeric = normalizeMaybeNumber(value)
  if (numeric !== null) return numeric === 1 ? 1 : 0
  const normalized = String(value ?? '').trim().toLowerCase()
  if (!normalized) return 1
  return ['0', 'false', 'off', 'inactive', 'disabled', 'no'].includes(normalized) ? 0 : 1
}

function normalizeCreateItems(items: FlashSaleCreateItemInput[] | undefined) {
  if (!Array.isArray(items)) return []
  return items
    .map((item) => ({
      product_id: normalizeMaybeNumber(item.product_id),
      sale_price: normalizeMaybeNumber(item.sale_price),
      discount_percent: normalizeMaybeNumber(item.discount_percent),
      purchase_limit: Math.max(0, Math.floor(normalizeMaybeNumber(item.purchase_limit) ?? 0)),
      is_enabled: normalizeBooleanFlag(item.is_enabled)
    }))
    .filter((item) => item.product_id !== null)
}

function buildCampaignSummary(campaign: FlashSaleListRow & { id: number }, itemRows: Array<{ product_id: number }>, status = getFlashSaleStatus(campaign)) {
  const productCount = new Set(itemRows.map((item) => item.product_id).filter((value) => value !== null && value !== undefined)).size
  return {
    id: campaign.id,
    name: campaign.name,
    start_at: campaign.start_at,
    end_at: campaign.end_at,
    is_active: campaign.is_active,
    created_at: campaign.created_at,
    updated_at: campaign.updated_at,
    status,
    status_key: status.key,
    status_label: status.label,
    product_count: productCount,
    item_count: itemRows.length,
    enabled_item_count: itemRows.filter((item: any) => normalizeBooleanFlag(item.is_enabled) === 1).length
  }
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
      const body = await c.req.json().catch(() => ({})) as FlashSaleCreateBody
      const name = String(body?.name ?? '').trim()
      const startAt = normalizeDateTime(body?.start_at)
      const endAt = normalizeDateTime(body?.end_at)
      const items = normalizeCreateItems(body?.items)

      if (!name) {
        return c.json({ success: false, error: 'Tên flashsale là bắt buộc' }, 400)
      }
      if (!startAt || !endAt) {
        return c.json({ success: false, error: 'Thời gian bắt đầu/kết thúc không hợp lệ' }, 400)
      }
      if (Date.parse(endAt) <= Date.parse(startAt)) {
        return c.json({ success: false, error: 'Thời gian kết thúc phải sau thời gian bắt đầu' }, 400)
      }
      if (items.length === 0) {
        return c.json({ success: false, error: 'Vui lòng chọn ít nhất 1 sản phẩm' }, 400)
      }

      for (const item of items) {
        if (item.sale_price === null && item.discount_percent === null) {
          return c.json({ success: false, error: 'Mỗi sản phẩm phải có giá flashsale hoặc % giảm' }, 400)
        }
        if (item.sale_price !== null && item.sale_price <= 0) {
          return c.json({ success: false, error: 'Giá flashsale phải lớn hơn 0' }, 400)
        }
        if (item.discount_percent !== null && (item.discount_percent <= 0 || item.discount_percent >= 100)) {
          return c.json({ success: false, error: 'Phần trăm giảm phải nằm trong khoảng 1-99' }, 400)
        }
      }

      const uniqueProductIds = [...new Set(items.map((item) => item.product_id).filter((value): value is number => typeof value === 'number'))]
      if (uniqueProductIds.length !== items.length) {
        return c.json({ success: false, error: 'Sản phẩm trong flashsale không được trùng nhau' }, 400)
      }

      const placeholders = uniqueProductIds.map(() => '?').join(', ')
      const productRows = await c.env.DB.prepare(
        `SELECT id FROM products WHERE id IN (${placeholders}) AND is_active = 1`
      ).bind(...uniqueProductIds).all() as { results?: Array<{ id: number }> }

      const existingIds = new Set((productRows.results || []).map((row) => row.id))
      const missingIds = uniqueProductIds.filter((id) => !existingIds.has(id))
      if (missingIds.length > 0) {
        return c.json({ success: false, error: `Sản phẩm không hợp lệ: ${missingIds.join(', ')}` }, 400)
      }

      const campaignInsert = await c.env.DB.prepare(`
        INSERT INTO flash_sales (name, start_at, end_at, is_active)
        VALUES (?, ?, ?, ?)
      `).bind(name, startAt, endAt, 1).run()

      const campaignId = Number(campaignInsert?.meta?.last_row_id)
      for (const item of items) {
        await c.env.DB.prepare(`
          INSERT INTO flash_sale_items (flash_sale_id, product_id, sale_price, discount_percent, purchase_limit, is_enabled)
          VALUES (?, ?, ?, ?, ?, ?)
        `).bind(
          campaignId,
          item.product_id,
          item.sale_price,
          item.discount_percent,
          item.purchase_limit,
          item.is_enabled
        ).run()
      }

      const createdCampaign = await c.env.DB.prepare(`SELECT * FROM flash_sales WHERE id = ?`).bind(campaignId).first() as any
      const createdItems = await c.env.DB.prepare(`
        SELECT id, flash_sale_id, product_id, sale_price, discount_percent, purchase_limit, is_enabled
        FROM flash_sale_items
        WHERE flash_sale_id = ?
        ORDER BY id ASC
      `).bind(campaignId).all() as { results?: Array<{ product_id: number; is_enabled?: number | string }> }

      const summaryBase = createdCampaign || {
        id: campaignId,
        name,
        start_at: startAt,
        end_at: endAt,
        is_active: 1,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
      const summary = buildCampaignSummary(summaryBase, createdItems.results || [])

      return c.json({
        success: true,
        data: {
          ...summary,
          items: createdItems.results || []
        }
      }, 201)
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
