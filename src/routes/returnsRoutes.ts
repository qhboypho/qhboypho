import type { Hono } from 'hono'
import type { AppBindings } from '../types/app'

type ReturnsRouteDeps = {
  initDB: (db: D1Database) => Promise<void>
}

export function registerReturnsRoutes(app: Hono<{ Bindings: AppBindings }>, deps: ReturnsRouteDeps) {
  // Get all returns (returned and cancelled orders)
  app.get('/api/admin/returns', async (c) => {
    try {
      await deps.initDB(c.env.DB)
      
      // Query orders with return_status field
      // Đơn hoàn: return_status = 'returned' (khách nhận nhưng hoàn hàng)
      // Đơn huỷ: return_status = 'cancelled' (khách không nhận - bom hàng)
      const query = `
        SELECT o.*,
               p.thumbnail AS product_thumbnail
        FROM orders o
        LEFT JOIN products p ON p.id = o.product_id
        WHERE o.return_status IN ('returned', 'cancelled')
        ORDER BY o.created_at DESC
      `
      
      const result = await c.env.DB.prepare(query).all()
      return c.json({ success: true, data: result.results || [] })
    } catch (e: any) {
      return c.json({ success: false, error: e.message }, 500)
    }
  })

  // Sync returns from GHTK
  app.post('/api/admin/returns/sync-ghtk', async (c) => {
    try {
      await deps.initDB(c.env.DB)
      
      const token = String(c.env.GHTK_TOKEN || '').trim()
      const clientSource = String(c.env.GHTK_CLIENT_SOURCE || '').trim()
      
      if (!token || !clientSource) {
        return c.json({ success: false, error: 'MISSING_GHTK_KEYS' }, 400)
      }

      // Get all orders with shipping tracking codes
      const ordersResult = await c.env.DB.prepare(`
        SELECT id, order_code, shipping_tracking_code, return_status
        FROM orders
        WHERE shipping_tracking_code IS NOT NULL 
          AND shipping_tracking_code != ''
          AND shipping_carrier = 'GHTK'
      `).all()
      
      const orders = (ordersResult.results || []) as any[]
      let syncedCount = 0
      let updatedOrders: any[] = []

      // Check status for each order from GHTK
      for (const order of orders) {
        const trackingCode = String(order.shipping_tracking_code || '').trim()
        if (!trackingCode) continue

        try {
          // Call GHTK API to get order status
          const resp = await fetch(`https://services.giaohangtietkiem.vn/services/shipment/v2/${encodeURIComponent(trackingCode)}`, {
            method: 'GET',
            headers: {
              'Token': token,
              'X-Client-Source': clientSource
            }
          })

          if (!resp.ok) continue

          const body: any = await resp.json().catch(() => ({}))
          if (!body?.order) continue

          const ghtkStatus = String(body.order.status_id || '').toLowerCase()
          const ghtkStatusText = String(body.order.status || '').toLowerCase()
          
          // Map GHTK status to return_status
          // Status 9: Đã huỷ (cancelled)
          // Status 10: Đã hoàn (returned)
          let returnStatus: string | null = null
          
          if (ghtkStatus === '9' || ghtkStatusText.includes('hủy') || ghtkStatusText.includes('huy')) {
            returnStatus = 'cancelled'
          } else if (ghtkStatus === '10' || ghtkStatusText.includes('hoàn') || ghtkStatusText.includes('hoan')) {
            returnStatus = 'returned'
          }

          // Update if status changed
          if (returnStatus && order.return_status !== returnStatus) {
            await c.env.DB.prepare(`
              UPDATE orders 
              SET return_status = ?,
                  updated_at = CURRENT_TIMESTAMP
              WHERE id = ?
            `).bind(returnStatus, order.id).run()
            
            syncedCount++
            updatedOrders.push({
              order_code: order.order_code,
              old_status: order.return_status,
              new_status: returnStatus
            })
          }
        } catch (err) {
          console.error(`Error syncing order ${order.order_code}:`, err)
          continue
        }
      }

      return c.json({ 
        success: true, 
        synced_count: syncedCount,
        total_checked: orders.length,
        updated_orders: updatedOrders
      })
    } catch (e: any) {
      return c.json({ success: false, error: e.message }, 500)
    }
  })

  // Update return status manually
  app.patch('/api/admin/returns/:id/status', async (c) => {
    try {
      await deps.initDB(c.env.DB)
      const id = c.req.param('id')
      const { return_status } = await c.req.json()
      
      const allowedStatuses = ['returned', 'cancelled', null]
      if (!allowedStatuses.includes(return_status)) {
        return c.json({ success: false, error: 'INVALID_RETURN_STATUS' }, 400)
      }

      await c.env.DB.prepare(`
        UPDATE orders 
        SET return_status = ?,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).bind(return_status, id).run()

      return c.json({ success: true, return_status })
    } catch (e: any) {
      return c.json({ success: false, error: e.message }, 500)
    }
  })
}
