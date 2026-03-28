import type { Hono } from 'hono'

type VoucherStatsRouteDeps = {
  initDB: (db: D1Database) => Promise<void>
  buildInternalTestOrderWhereSql: (alias?: string) => string
}

export function registerVoucherStatsRoutes(app: Hono<any>, deps: VoucherStatsRouteDeps) {
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
      const internalFilterSql = includeInternal ? '1=1' : `NOT ${deps.buildInternalTestOrderWhereSql()}`
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
}
