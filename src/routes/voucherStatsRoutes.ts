import type { Hono } from 'hono'
import type { AppBindings } from '../types/app'

type VoucherStatsRouteDeps = {
  initDB: (db: D1Database) => Promise<void>
  buildInternalTestOrderWhereSql: (alias?: string) => string
}

type DashboardStatsRange = {
  mode: 'all' | 'day' | 'month' | 'custom'
  from?: string
  to?: string
  fromDate?: string
  toDate?: string
  label: string
}

const VIETNAM_TZ_OFFSET = '+07:00'

function isDateOnly(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value)
}

function isMonthOnly(value: string): boolean {
  return /^\d{4}-\d{2}$/.test(value)
}

function toSqlDateTime(value: Date): string {
  return value.toISOString().replace('T', ' ').replace(/\.\d{3}Z$/, '')
}

function toVietnamDateKey(value: Date): string {
  const shifted = new Date(value.getTime() + (7 * 60 * 60 * 1000))
  const year = shifted.getUTCFullYear()
  const month = String(shifted.getUTCMonth() + 1).padStart(2, '0')
  const day = String(shifted.getUTCDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function parseVietnamDateStart(date: string): Date {
  return new Date(`${date}T00:00:00${VIETNAM_TZ_OFFSET}`)
}

function addDays(value: Date, days: number): Date {
  const next = new Date(value)
  next.setUTCDate(next.getUTCDate() + days)
  return next
}

function getNextMonthStartDateKey(month: string): string {
  const [yearRaw, monthRaw] = month.split('-')
  const year = Number(yearRaw)
  const monthIndex = Number(monthRaw)
  if (!Number.isFinite(year) || !Number.isFinite(monthIndex)) return `${month}-01`
  const nextYear = monthIndex >= 12 ? year + 1 : year
  const nextMonth = monthIndex >= 12 ? 1 : monthIndex + 1
  return `${String(nextYear).padStart(4, '0')}-${String(nextMonth).padStart(2, '0')}-01`
}

function getMonthEndDateKey(month: string): string {
  const [yearRaw, monthRaw] = month.split('-')
  const year = Number(yearRaw)
  const monthIndex = Number(monthRaw)
  if (!Number.isFinite(year) || !Number.isFinite(monthIndex)) return `${month}-01`
  return toVietnamDateKey(new Date(Date.UTC(year, monthIndex, 0)))
}

function resolveDashboardStatsRange(query: (name: string) => string | undefined): DashboardStatsRange {
  const mode = String(query('mode') || '').trim().toLowerCase()
  const date = String(query('date') || '').trim()
  const month = String(query('month') || '').trim()
  const from = String(query('from') || '').trim()
  const to = String(query('to') || '').trim()

  if (mode === 'day' && isDateOnly(date)) {
    const start = parseVietnamDateStart(date)
    return {
      mode: 'day',
      from: toSqlDateTime(start),
      to: toSqlDateTime(addDays(start, 1)),
      fromDate: date,
      toDate: date,
      label: date,
    }
  }

  if (mode === 'month' && isMonthOnly(month)) {
    const start = parseVietnamDateStart(`${month}-01`)
    const nextMonthStart = parseVietnamDateStart(getNextMonthStartDateKey(month))
    return {
      mode: 'month',
      from: toSqlDateTime(start),
      to: toSqlDateTime(nextMonthStart),
      fromDate: `${month}-01`,
      toDate: getMonthEndDateKey(month),
      label: month,
    }
  }

  if (mode === 'custom' && isDateOnly(from) && isDateOnly(to)) {
    const start = parseVietnamDateStart(from)
    return {
      mode: 'custom',
      from: toSqlDateTime(start),
      to: toSqlDateTime(addDays(parseVietnamDateStart(to), 1)),
      fromDate: from,
      toDate: to,
      label: `${from} - ${to}`,
    }
  }

  return { mode: 'all', label: 'Tất cả thời gian' }
}

function buildDashboardVisitorWhereSql(range: DashboardStatsRange): { sql: string; params: string[] } {
  const clauses: string[] = []
  const params: string[] = []

  if (range.fromDate && range.toDate) {
    clauses.push('visit_date >= ?')
    clauses.push('visit_date <= ?')
    params.push(range.fromDate, range.toDate)
  }

  return {
    sql: clauses.length ? clauses.join(' AND ') : '1=1',
    params,
  }
}

function buildDashboardOrderWhereSql(
  deps: VoucherStatsRouteDeps,
  range: DashboardStatsRange,
  includeInternal: boolean,
  alias = ''
): { sql: string; params: string[] } {
  const prefix = alias ? `${alias}.` : ''
  const clauses = [
    includeInternal ? '1=1' : `NOT ${deps.buildInternalTestOrderWhereSql(alias || undefined)}`,
  ]
  const params: string[] = []

  if (range.from && range.to) {
    clauses.push(`datetime(${prefix}created_at) >= datetime(?)`)
    clauses.push(`datetime(${prefix}created_at) < datetime(?)`)
    params.push(range.from, range.to)
  }

  return { sql: clauses.join(' AND '), params }
}

export function registerVoucherStatsRoutes(app: Hono<{ Bindings: AppBindings }>, deps: VoucherStatsRouteDeps) {
  app.post('/api/vouchers/validate', async (c) => {
    try {
      await deps.initDB(c.env.DB)
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

  app.get('/api/admin/vouchers', async (c) => {
    try {
      await deps.initDB(c.env.DB)
      const result = await c.env.DB.prepare(`SELECT * FROM vouchers ORDER BY created_at DESC`).all()
      return c.json({ success: true, data: result.results || [] })
    } catch (e: any) {
      return c.json({ success: false, error: e.message }, 500)
    }
  })

  app.post('/api/admin/vouchers', async (c) => {
    try {
      await deps.initDB(c.env.DB)
      const body = await c.req.json()
      const { discount_amount, valid_from, valid_to, usage_limit, custom_code } = body

      if (!discount_amount || !valid_from || !valid_to) {
        return c.json({ success: false, error: 'Missing required fields' }, 400)
      }

      let code = custom_code
        ? custom_code.trim().toUpperCase()
        : 'FASHION' + Math.random().toString(36).substring(2, 7).toUpperCase()

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

  app.delete('/api/admin/vouchers/:id', async (c) => {
    try {
      const id = c.req.param('id')
      await c.env.DB.prepare(`DELETE FROM vouchers WHERE id=?`).bind(id).run()
      return c.json({ success: true })
    } catch (e: any) {
      return c.json({ success: false, error: e.message }, 500)
    }
  })

  app.get('/api/admin/stats', async (c) => {
    try {
      await deps.initDB(c.env.DB)
      const includeInternal = c.req.query('include_internal') === '1'
      const range = resolveDashboardStatsRange((name) => c.req.query(name))
      const orderFilter = buildDashboardOrderWhereSql(deps, range, includeInternal)
      const orderFilterAlias = buildDashboardOrderWhereSql(deps, range, includeInternal, 'o')
      const allOrderFilter = buildDashboardOrderWhereSql(deps, { mode: 'all', label: 'Tất cả thời gian' }, includeInternal)
      const activeOrderFilterSql = `${orderFilter.sql} AND LOWER(COALESCE(status, '')) != 'cancelled'`
      const undeliveredOrderFilterSql = `${orderFilter.sql} AND LOWER(COALESCE(status, '')) NOT IN ('done', 'cancelled')`
      const deliveredOrderFilterSql = `${orderFilter.sql}
        AND LOWER(COALESCE(status, '')) = 'done'
        AND LOWER(COALESCE(return_status, '')) NOT IN ('returned', 'cancelled', 'delivery_failed')`
      const returnedOrderFilterSql = `${orderFilter.sql} AND LOWER(COALESCE(return_status, '')) = 'returned'`
      const cancelledOrFailedFilterSql = `${orderFilter.sql}
        AND (
          LOWER(COALESCE(status, '')) = 'cancelled'
          OR LOWER(COALESCE(return_status, '')) IN ('cancelled', 'delivery_failed')
        )`
      const recentOrderFilterSql = `${orderFilterAlias.sql} AND LOWER(COALESCE(o.status, '')) != 'cancelled'`
      const goodsVatRate = 0.01
      const goodsPitRate = 0.005
      const totalProducts = await c.env.DB.prepare(`SELECT COUNT(*) as count FROM products WHERE is_active=1`).first() as any
      const totalOrders = await c.env.DB.prepare(`SELECT COUNT(*) as count FROM orders WHERE ${activeOrderFilterSql}`).bind(...orderFilter.params).first() as any
      const pendingOrders = await c.env.DB.prepare(`SELECT COUNT(*) as count FROM orders WHERE status='pending' AND ${activeOrderFilterSql}`).bind(...orderFilter.params).first() as any
      const undeliveredOrders = await c.env.DB.prepare(`SELECT COUNT(*) as count FROM orders WHERE ${undeliveredOrderFilterSql}`).bind(...orderFilter.params).first() as any
      const sidebarUndeliveredOrders = await c.env.DB.prepare(`
        SELECT COUNT(*) as count
        FROM orders
        WHERE ${allOrderFilter.sql}
          AND LOWER(COALESCE(status, '')) NOT IN ('shipping', 'done', 'cancelled')
          AND (
            UPPER(COALESCE(payment_method, '')) = 'COD'
            OR (
              UPPER(COALESCE(payment_method, '')) IN ('BANK_TRANSFER', 'ZALOPAY')
              AND LOWER(COALESCE(payment_status, '')) = 'paid'
            )
          )
      `).bind(...allOrderFilter.params).first() as any
      const shippingQueueOrders = await c.env.DB.prepare(`
        SELECT COUNT(*) as count
        FROM orders
        WHERE ${activeOrderFilterSql}
          AND status NOT IN ('shipping', 'done', 'cancelled')
          AND (
            UPPER(COALESCE(payment_method, '')) = 'COD'
            OR (
              UPPER(COALESCE(payment_method, '')) IN ('BANK_TRANSFER', 'ZALOPAY')
              AND LOWER(COALESCE(payment_status, '')) = 'paid'
            )
          )
      `).bind(...orderFilter.params).first() as any
      const revenue = await c.env.DB.prepare(`
        SELECT SUM(COALESCE(total_price, 0)) as total
        FROM orders
        WHERE ${deliveredOrderFilterSql}
      `).bind(...orderFilter.params).first() as any
      const deliveredOrders = await c.env.DB.prepare(`
        SELECT COUNT(*) as count
        FROM orders
        WHERE ${deliveredOrderFilterSql}
      `).bind(...orderFilter.params).first() as any
      const returnedOrders = await c.env.DB.prepare(`
        SELECT COUNT(*) as count
        FROM orders
        WHERE ${returnedOrderFilterSql}
      `).bind(...orderFilter.params).first() as any
      const cancelledOrFailedOrders = await c.env.DB.prepare(`
        SELECT COUNT(*) as count
        FROM orders
        WHERE ${cancelledOrFailedFilterSql}
      `).bind(...orderFilter.params).first() as any
      const frontendVisitorFilter = buildDashboardVisitorWhereSql(range)
      const frontendVisitors = await c.env.DB.prepare(`
        SELECT COUNT(DISTINCT visitor_id) as count
        FROM frontend_product_visits
        WHERE ${frontendVisitorFilter.sql}
      `).bind(...frontendVisitorFilter.params).first() as any
      const completedOrders = await c.env.DB.prepare(`SELECT COUNT(*) as count FROM orders WHERE status='done' AND ${orderFilter.sql}`).bind(...orderFilter.params).first() as any
      const unpaidOrders = await c.env.DB.prepare(`
        SELECT COUNT(*) as count
        FROM orders
        WHERE ${activeOrderFilterSql}
          AND LOWER(COALESCE(payment_status, '')) != 'paid'
      `).bind(...orderFilter.params).first() as any
      const statusBreakdownRes = await c.env.DB.prepare(`
        SELECT LOWER(COALESCE(status, 'pending')) as status, COUNT(*) as count
        FROM orders
        WHERE ${orderFilter.sql}
        GROUP BY LOWER(COALESCE(status, 'pending'))
      `).bind(...orderFilter.params).all()
      const recentOrdersRes = await c.env.DB.prepare(`
        SELECT o.*,
               p.thumbnail AS product_thumbnail,
               p.images AS product_images,
               p.colors AS product_colors,
               CASE WHEN LOWER(COALESCE(o.payment_status, ''))='paid' THEN 0 ELSE o.total_price END AS amount_due
        FROM orders o
        LEFT JOIN products p ON p.id = o.product_id
        WHERE ${recentOrderFilterSql}
        ORDER BY o.created_at DESC
        LIMIT 5
      `).bind(...orderFilterAlias.params).all()
      const recentOrders = recentOrdersRes
      const deliveredRevenue = Number(revenue?.total || 0)
      const vatTax = Math.round(deliveredRevenue * goodsVatRate)
      const pitTax = Math.round(deliveredRevenue * goodsPitRate)
      const totalTax = vatTax + pitTax
      const netRevenue = Math.max(0, deliveredRevenue - totalTax)

      return c.json({
        success: true,
        data: {
          range,
          totalProducts: totalProducts?.count || 0,
          totalOrders: totalOrders?.count || 0,
          pendingOrders: pendingOrders?.count || 0,
          undeliveredOrders: undeliveredOrders?.count || 0,
          sidebarUndeliveredOrders: sidebarUndeliveredOrders?.count || 0,
          shippingQueueOrders: shippingQueueOrders?.count || 0,
          completedOrders: completedOrders?.count || 0,
          deliveredOrders: deliveredOrders?.count || 0,
          returnedOrders: returnedOrders?.count || 0,
          cancelledOrFailedOrders: cancelledOrFailedOrders?.count || 0,
          unpaidOrders: unpaidOrders?.count || 0,
          frontendVisitors: frontendVisitors?.count || 0,
          avgOrderValue: Number(deliveredOrders?.count || 0) > 0 ? deliveredRevenue / Number(deliveredOrders?.count || 1) : 0,
          statusBreakdown: statusBreakdownRes.results || [],
          revenue: deliveredRevenue,
          vatTax,
          pitTax,
          totalTax,
          netRevenue,
          taxBaseRevenue: deliveredRevenue,
          taxProfile: {
            category: 'Phân phối, cung cấp hàng hóa',
            vatRate: goodsVatRate,
            pitRate: goodsPitRate,
            totalRate: goodsVatRate + goodsPitRate,
          },
          recentOrders: recentOrders.results || []
        }
      })
    } catch (e: any) {
      return c.json({ success: false, error: e.message }, 500)
    }
  })
}
