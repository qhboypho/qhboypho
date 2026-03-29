import { getCookie } from 'hono/cookie'
import type { Hono } from 'hono'
import type { AppBindings } from '../types/app'

type OrderRouteDeps = {
  initDB: (db: D1Database) => Promise<void>
  buildInternalTestOrderWhereSql: (alias?: string) => string
  resolveSelectedColorImage: (productColors: any, selectedColor: any, fallbackImage?: string) => string
  ghtkCancelShipment: (env: any, trackingOrder: string) => Promise<any>
  ghtkCreateShipment: (env: any, db: D1Database, order: any) => Promise<any>
  ghtkFetchLabelPdf: (env: any, trackingCode: string, original?: any, pageSize?: any) => Promise<Uint8Array>
  mergePdfBytes: (files: Uint8Array[]) => Promise<Uint8Array>
}

function generateNumericOrderSuffix6() {
  return Math.floor(Math.random() * 1000000).toString().padStart(6, '0')
}

async function generateUniqueOrderCode(db: D1Database) {
  for (let i = 0; i < 12; i++) {
    const code = 'QH' + generateNumericOrderSuffix6()
    const existing = await db.prepare(`SELECT id FROM orders WHERE order_code=? LIMIT 1`).bind(code).first()
    if (!existing) return code
  }
  const fallback = Date.now().toString().slice(-6).padStart(6, '0')
  return 'QH' + fallback
}

export function registerOrderRoutes(app: Hono<{ Bindings: AppBindings }>, deps: OrderRouteDeps) {
  app.get('/api/user/orders', async (c) => {
    const userId = getCookie(c, 'user_id')
    const adminToken = getCookie(c, 'admin_token')
    if (!userId) {
      if (adminToken === 'super_secret_admin_token') {
        return c.json({ success: true, data: [] })
      }
      return c.json({ success: false, error: 'Unauthorized' }, 401)
    }
    const orders = await c.env.DB.prepare(`
      SELECT o.*,
             p.thumbnail AS product_thumbnail,
             CASE WHEN LOWER(COALESCE(o.payment_status, ''))='paid' THEN 0 ELSE o.total_price END AS amount_due
      FROM orders o
      LEFT JOIN products p ON p.id = o.product_id
      WHERE o.user_id=?
      ORDER BY o.created_at DESC
    `).bind(userId).all()
    return c.json({ success: true, data: orders.results || [] })
  })

  app.post('/api/orders', async (c) => {
    try {
      await deps.initDB(c.env.DB)
      const body = await c.req.json()
      const {
        customer_name, customer_phone, customer_address,
        product_id, color, selected_color_image, size, quantity, note, voucher_code, payment_method
      } = body

      if (!customer_name || !customer_phone || !customer_address || !product_id) {
        return c.json({ success: false, error: 'Missing required fields' }, 400)
      }

      const product = await c.env.DB.prepare(`SELECT * FROM products WHERE id=? AND is_active=1`).bind(product_id).first() as any
      if (!product) return c.json({ success: false, error: 'Product not found' }, 404)

      const qty = parseInt(quantity) || 1
      let discount = 0

      if (voucher_code && voucher_code.trim()) {
        const now = new Date().toISOString()
        const voucher = await c.env.DB.prepare(
          `SELECT * FROM vouchers WHERE code=? AND is_active=1 AND valid_from<=? AND valid_to>=?`
        ).bind(voucher_code.trim().toUpperCase(), now, now).first() as any

        if (!voucher) {
          return c.json({ success: false, error: 'INVALID_VOUCHER' }, 400)
        }
        if (voucher.usage_limit > 0 && voucher.used_count >= voucher.usage_limit) {
          return c.json({ success: false, error: 'VOUCHER_LIMIT' }, 400)
        }
        discount = voucher.discount_amount
        await c.env.DB.prepare(`UPDATE vouchers SET used_count=used_count+1 WHERE id=?`).bind(voucher.id).run()
      }

      const subtotal = product.price * qty
      const total = Math.max(0, subtotal - discount)
      const orderCode = await generateUniqueOrderCode(c.env.DB)
      const normalizedPaymentMethod = String(payment_method || '').toUpperCase()
      const paymentMethod = ['COD', 'ZALOPAY', 'MOMO', 'BANK_TRANSFER'].includes(normalizedPaymentMethod)
        ? normalizedPaymentMethod
        : 'COD'
      const selectedColorImage = String(selected_color_image || '').trim()
        || deps.resolveSelectedColorImage(product.colors, color, product.thumbnail || '')

      const result = await c.env.DB.prepare(`
        INSERT INTO orders 
          (user_id, order_code, customer_name, customer_phone, customer_address, product_id, product_name, product_price, color, selected_color_image, size, quantity, total_price, voucher_code, discount_amount, note, payment_method)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        getCookie(c, 'user_id') || null,
        orderCode,
        customer_name,
        customer_phone,
        customer_address,
        product_id,
        product.name,
        product.price,
        color || '',
        selectedColorImage || '',
        size || '',
        qty,
        total,
        voucher_code ? voucher_code.trim().toUpperCase() : '',
        discount,
        note || '',
        paymentMethod
      ).run()

      return c.json({ success: true, order_code: orderCode, id: result.meta.last_row_id, discount, total })
    } catch (e: any) {
      return c.json({ success: false, error: e.message }, 500)
    }
  })

  app.get('/api/admin/orders', async (c) => {
    try {
      await deps.initDB(c.env.DB)
      const status = c.req.query('status')
      const includeInternal = c.req.query('include_internal') === '1'
      const internalFilterSql = includeInternal ? '1=1' : `NOT ${deps.buildInternalTestOrderWhereSql('o')}`
      const shippingQueueOnly = c.req.query('shipping_queue') === '1'
      const shippingQueueSql = shippingQueueOnly
        ? `AND (
             UPPER(COALESCE(o.payment_method, '')) = 'COD'
             OR (
               UPPER(COALESCE(o.payment_method, '')) IN ('BANK_TRANSFER', 'ZALOPAY')
               AND LOWER(COALESCE(o.payment_status, '')) = 'paid'
             )
           )`
        : ''
      let query = `
        SELECT o.*,
               p.thumbnail AS product_thumbnail,
               CASE WHEN LOWER(COALESCE(o.payment_status, ''))='paid' THEN 0 ELSE o.total_price END AS amount_due
        FROM orders o
        LEFT JOIN products p ON p.id = o.product_id
        WHERE ${internalFilterSql}
        ${shippingQueueSql}
        ORDER BY o.created_at DESC
      `
      if (status && status !== 'all') {
        query = `
          SELECT o.*,
                 p.thumbnail AS product_thumbnail,
                 CASE WHEN LOWER(COALESCE(o.payment_status, ''))='paid' THEN 0 ELSE o.total_price END AS amount_due
          FROM orders o
          LEFT JOIN products p ON p.id = o.product_id
          WHERE o.status=? AND ${internalFilterSql}
          ${shippingQueueSql}
          ORDER BY o.created_at DESC
        `
      }
      const stmt = status && status !== 'all'
        ? c.env.DB.prepare(query).bind(status)
        : c.env.DB.prepare(query)
      const result = await stmt.all()
      return c.json({ success: true, data: result.results || [] })
    } catch (e: any) {
      return c.json({ success: false, error: e.message }, 500)
    }
  })

  app.patch('/api/admin/orders/:id/status', async (c) => {
    try {
      await deps.initDB(c.env.DB)
      const id = c.req.param('id')
      const { status } = await c.req.json()
      const nextStatus = String(status || '').trim().toLowerCase()
      const existing = await c.env.DB.prepare(`
        SELECT id, status, shipping_carrier, shipping_tracking_code, shipping_arranged
        FROM orders
        WHERE id=?
        LIMIT 1
      `).bind(id).first() as any
      if (!existing) return c.json({ success: false, error: 'ORDER_NOT_FOUND' }, 404)

      if (nextStatus === 'cancelled') {
        const carrier = String(existing.shipping_carrier || '').trim().toUpperCase()
        const trackingCode = String(existing.shipping_tracking_code || '').trim()
        if (carrier === 'GHTK' && trackingCode) {
          const cancelRes = await deps.ghtkCancelShipment(c.env, trackingCode)
          if (!cancelRes.ok) {
            return c.json({ success: false, error: cancelRes.message || 'GHTK_CANCEL_FAILED', detail: cancelRes.detail || null }, 400)
          }
        }
      }

      await c.env.DB.prepare(`
        UPDATE orders SET status=?, updated_at=CURRENT_TIMESTAMP WHERE id=?
      `).bind(nextStatus, id).run()
      return c.json({ success: true, status: nextStatus })
    } catch (e: any) {
      return c.json({ success: false, error: e.message }, 500)
    }
  })

  app.delete('/api/admin/orders/:id', async (c) => {
    try {
      const id = c.req.param('id')
      await c.env.DB.prepare(`DELETE FROM orders WHERE id = ?`).bind(id).run()
      return c.json({ success: true })
    } catch (e: any) {
      return c.json({ success: false, error: e.message }, 500)
    }
  })

  app.post('/api/admin/orders/arrange-shipping', async (c) => {
    try {
      await deps.initDB(c.env.DB)
      const body: any = await c.req.json().catch(() => ({}))
      const ids = Array.isArray(body.ids) ? body.ids.map((v: any) => Number(v)).filter((v: number) => Number.isFinite(v) && v > 0) : []
      if (!ids.length) return c.json({ success: false, error: 'NO_ORDER_IDS' }, 400)

      const orderQuery = `
        SELECT id, order_code, customer_name, customer_phone, customer_address, product_name,
               quantity, total_price, note, payment_status, status, shipping_tracking_code
        FROM orders
        WHERE id IN (${ids.map(() => '?').join(',')})
      `
      const orderResult = await c.env.DB.prepare(orderQuery).bind(...ids).all()
      const rows = (orderResult.results || []) as any[]
      const map = new Map<number, any>(rows.map((o) => [Number(o.id), o]))

      const updated: any[] = []
      const failed: any[] = []
      for (const id of ids) {
        const order = map.get(Number(id))
        if (!order) {
          failed.push({ id, error: 'ORDER_NOT_FOUND' })
          continue
        }
        const status = String(order.status || '').toLowerCase()
        if (status === 'done' || status === 'cancelled') {
          failed.push({ id, order_code: order.order_code, error: 'ORDER_CLOSED' })
          continue
        }

        let trackingCode = String(order.shipping_tracking_code || '').trim()
        let labelCode = ''
        let fee = 0
        if (!trackingCode) {
          const createRes: any = await deps.ghtkCreateShipment(c.env, c.env.DB, order)
          if (!createRes.ok) {
            failed.push({ id, order_code: order.order_code, error: createRes.message || 'GHTK_CREATE_ORDER_FAILED', detail: createRes.detail || null })
            continue
          }
          trackingCode = String(createRes.data?.label || createRes.data?.tracking_id || '').trim()
          labelCode = String(createRes.data?.label || '').trim()
          fee = Number(createRes.data?.fee || 0) || 0
          if (!trackingCode) {
            failed.push({ id, order_code: order.order_code, error: 'GHTK_TRACKING_EMPTY', detail: createRes.data || null })
            continue
          }
          updated.push({
            id,
            order_code: order.order_code,
            tracking_code: trackingCode,
            carrier: 'GHTK',
            used_fallback_address: !!createRes.usedFallbackAddress
          })
        } else {
          updated.push({ id, order_code: order.order_code, tracking_code: trackingCode, carrier: 'GHTK', reused_tracking: true })
        }

        await c.env.DB.prepare(`
          UPDATE orders
          SET shipping_arranged=1,
              shipping_arranged_at=COALESCE(shipping_arranged_at, CURRENT_TIMESTAMP),
              shipping_carrier='GHTK',
              shipping_tracking_code=COALESCE(NULLIF(?, ''), shipping_tracking_code),
              shipping_label=COALESCE(NULLIF(?, ''), shipping_label),
              shipping_fee=CASE WHEN ? > 0 THEN ? ELSE shipping_fee END,
              status=CASE WHEN status='pending' THEN 'confirmed' ELSE status END,
              updated_at=CURRENT_TIMESTAMP
          WHERE id=?
        `).bind(trackingCode, labelCode, fee, fee, id).run()
      }

      return c.json({
        success: failed.length === 0,
        updated_count: updated.length,
        failed_count: failed.length,
        updated,
        failed
      })
    } catch (e: any) {
      return c.json({ success: false, error: e.message }, 500)
    }
  })

  app.get('/api/admin/orders/ghtk/print-labels', async (c) => {
    try {
      await deps.initDB(c.env.DB)
      const ids = String(c.req.query('ids') || '')
        .split(',')
        .map((v) => Number(v.trim()))
        .filter((v) => Number.isFinite(v) && v > 0)
      if (!ids.length) return c.json({ success: false, error: 'NO_ORDER_IDS' }, 400)

      const ordersResult = await c.env.DB.prepare(`
        SELECT id, shipping_carrier, shipping_tracking_code
        FROM orders
        WHERE id IN (${ids.map(() => '?').join(',')})
      `).bind(...ids).all()
      const orders = (ordersResult.results || []) as any[]
      const selected = ids
        .map((id) => orders.find((o) => Number(o.id) === id))
        .filter(Boolean)
        .filter((o: any) => String(o.shipping_carrier || '').toUpperCase() === 'GHTK' && String(o.shipping_tracking_code || '').trim())
      if (!selected.length) return c.json({ success: false, error: 'NO_GHTK_TRACKING_FOUND' }, 400)

      const files: Uint8Array[] = []
      for (const row of selected) {
        files.push(await deps.ghtkFetchLabelPdf(c.env, String(row.shipping_tracking_code), c.req.query('original'), c.req.query('page_size')))
      }
      const merged = files.length === 1 ? files[0] : await deps.mergePdfBytes(files)
      const pdfBytes = new Uint8Array(merged)
      const pdfBlob = new Blob([pdfBytes], { type: 'application/pdf' })
      return new Response(pdfBlob, {
        status: 200,
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `inline; filename="ghtk-labels-${new Date().toISOString().slice(0, 10)}.pdf"`,
          'Cache-Control': 'no-store'
        }
      })
    } catch (e: any) {
      return c.json({ success: false, error: e.message }, 500)
    }
  })
}
