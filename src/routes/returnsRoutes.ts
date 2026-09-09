import type { Hono } from 'hono'
import type { AppBindings } from '../types/app'
import { getGhtkApiCredentials } from '../lib/shippingHelpers'
import { isTerminalReturnStatus } from '../lib/shippingStateHelpers'

type ReturnsRouteDeps = {
  initDB: (db: D1Database) => Promise<void>
}

export function registerReturnsRoutes(app: Hono<{ Bindings: AppBindings }>, deps: ReturnsRouteDeps) {
  // Get all returns (returned, cancelled, and delivery_failed orders)
  app.get('/api/admin/returns', async (c) => {
    try {
      await deps.initDB(c.env.DB)
      
      // Query orders with return_status field
      // Đơn hoàn: return_status = 'returned' (khách nhận nhưng hoàn hàng)
      // Đơn huỷ: return_status = 'cancelled' (khách không nhận - bom hàng, hoặc shop tự huỷ)
      // Giao không thành công: return_status = 'delivery_failed' (đã giao đi nhưng thất bại)
      const query = `
        SELECT o.*,
               p.thumbnail AS product_thumbnail
        FROM orders o
        LEFT JOIN products p ON p.id = o.product_id
        WHERE o.return_status IN ('returned', 'cancelled', 'delivery_failed')
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
      
      const { token, clientSource } = await getGhtkApiCredentials(c.env.DB, c.env)
      
      if (!token || !clientSource) {
        return c.json({ success: false, error: 'MISSING_GHTK_KEYS' }, 400)
      }

      // Get all orders with shipping tracking codes
      const ordersResult = await c.env.DB.prepare(`
        SELECT id, order_code, shipping_tracking_code, return_status,
               shipping_delivery_confirmed_at
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

          const statusValue = body.order.status_id ?? body.order.status_code ?? body.order.status
          const rawStatusValue = String(statusValue ?? '').trim()
          const parsedStatusId = /^-?\d+$/.test(rawStatusValue) ? Number(rawStatusValue) : null
          const ghtkStatusText = String(body.order.status_text || body.order.status || '').trim().toLowerCase()

          // GHTK's official status IDs are not interchangeable:
          // -1 = cancelled, 9 = failed to deliver, 21 = returned.
          // 5 = delivered and 6 = reconciled after a successful delivery.
          // 7/8/10 are pickup/delivery operational states and are not terminal
          // return evidence. Never infer the customer/shop actor from tracking.
          let returnStatus: string | null = null
          if (parsedStatusId === -1) {
            returnStatus = 'cancelled'
          } else if (parsedStatusId === 9) {
            returnStatus = 'delivery_failed'
          } else if (parsedStatusId === 21) {
            returnStatus = 'returned'
          } else if (parsedStatusId === null && /(đã\s*trả\s*hàng|da\s*tra\s*hang|returned\b)/i.test(ghtkStatusText)) {
            returnStatus = 'returned'
          } else if (parsedStatusId === null && /(không\s*giao\s*được|khong\s*giao\s*duoc|failed\s*to\s*deliver)/i.test(ghtkStatusText)) {
            returnStatus = 'delivery_failed'
          } else if (parsedStatusId === null && /(hủy\s*đơn|huy\s*don|canceled\s*order)/i.test(ghtkStatusText)) {
            returnStatus = 'cancelled'
          }

          // Do not downgrade a terminal return state from a later/stale carrier
          // response. A failed delivery may progress to returned, but a
          // cancelled/returned order is never guessed to be a customer fault.
          const currentReturnStatus = String(order.return_status || '').trim().toLowerCase()
          const returnStatusCanAdvance = returnStatus
            && (!isTerminalReturnStatus(currentReturnStatus)
              || currentReturnStatus === returnStatus
              || (currentReturnStatus === 'delivery_failed' && returnStatus === 'returned'))
          if (returnStatusCanAdvance && returnStatus !== currentReturnStatus) {
            const returnUpdate = await c.env.DB.prepare(`
              UPDATE orders
              SET return_status = ?,
                  updated_at = CURRENT_TIMESTAMP
              WHERE id = ?
                AND LOWER(COALESCE(return_status, '')) = ?
            `).bind(returnStatus, order.id, currentReturnStatus).run()
            
            if (Number(returnUpdate?.meta?.changes) === 1) {
              syncedCount++
              updatedOrders.push({
                order_code: order.order_code,
                old_status: order.return_status,
                new_status: returnStatus
              })
            }
          }

          // Only a carrier-confirmed delivered/reconciled status is delivery
          // evidence. This is intentionally separate from the admin status
          // field; the latter cannot be used to manufacture proof of delivery.
          if ((parsedStatusId === 5 || parsedStatusId === 6) && !String(order.shipping_delivery_confirmed_at || '').trim()) {
            await c.env.DB.prepare(`
              UPDATE orders
              SET shipping_delivery_confirmed_at=COALESCE(shipping_delivery_confirmed_at, CURRENT_TIMESTAMP),
                  shipping_delivery_source=COALESCE(NULLIF(shipping_delivery_source, ''), 'GHTK_STATUS'),
                  updated_at=CURRENT_TIMESTAMP
              WHERE id=?
            `).bind(order.id).run()
            syncedCount++
            updatedOrders.push({
              order_code: order.order_code,
              delivery_evidence: true,
              source: 'GHTK_STATUS',
              status_id: parsedStatusId
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
      
      const allowedStatuses = ['returned', 'cancelled', 'delivery_failed', null]
      if (!allowedStatuses.includes(return_status)) {
        return c.json({ success: false, error: 'INVALID_RETURN_STATUS' }, 400)
      }

      const existing = await c.env.DB.prepare(`
        SELECT status, return_status, shipping_tracking_code
        FROM orders
        WHERE id=?
        LIMIT 1
      `).bind(id).first() as any
      if (!existing) return c.json({ success: false, error: 'ORDER_NOT_FOUND' }, 404)
      const currentReturnStatus = String(existing.return_status || '').trim().toLowerCase()
      const nextReturnStatus = String(return_status || '').trim().toLowerCase()
      if (isTerminalReturnStatus(currentReturnStatus) && nextReturnStatus !== currentReturnStatus) {
        return c.json({ success: false, error: 'RETURN_STATUS_TERMINAL' }, 409)
      }
      if ((nextReturnStatus === 'returned' || nextReturnStatus === 'delivery_failed')
        && !String(existing.shipping_tracking_code || '').trim()) {
        return c.json({ success: false, error: 'RETURN_STATUS_REQUIRES_TRACKING' }, 400)
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
