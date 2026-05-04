import type { Hono } from 'hono'
import type { AppBindings } from '../types/app'

type CustomerRouteDeps = {
  initDB: (db: D1Database) => Promise<void>
}

export function registerCustomerRoutes(app: Hono<{ Bindings: AppBindings }>, deps: CustomerRouteDeps) {
  // Get all customers (unique by phone or user_id)
  app.get('/api/admin/customers', async (c) => {
    try {
      await deps.initDB(c.env.DB)
      
      // Simplified query - get all orders with customer info
      const query = `
        SELECT 
          o.customer_name,
          o.customer_phone,
          o.customer_address,
          o.user_id,
          u.name AS user_name,
          o.product_name,
          p.thumbnail AS product_thumbnail,
          o.created_at,
          o.id AS order_id
        FROM orders o
        LEFT JOIN users u ON u.id = o.user_id
        LEFT JOIN products p ON p.id = o.product_id
        ORDER BY o.created_at DESC
      `
      
      const result = await c.env.DB.prepare(query).all()
      const orders = result.results || []
      
      // Group by customer (user_id or phone)
      const customerMap = new Map()
      
      for (const order of orders) {
        const key = order.user_id ? `user_${order.user_id}` : `phone_${order.customer_phone}`
        
        if (!customerMap.has(key)) {
          customerMap.set(key, {
            customer_name: order.customer_name,
            customer_phone: order.customer_phone,
            customer_address: order.customer_address,
            user_id: order.user_id,
            user_name: order.user_name,
            order_count: 0,
            first_product_name: order.product_name,
            first_product_thumbnail: order.product_thumbnail,
            first_order_date: order.created_at
          })
        }
        
        const customer = customerMap.get(key)
        customer.order_count++
      }
      
      // Convert map to array and sort by first order date
      const customers = Array.from(customerMap.values()).sort((a, b) => {
        return new Date(b.first_order_date).getTime() - new Date(a.first_order_date).getTime()
      })
      
      return c.json({ success: true, data: customers })
    } catch (e: any) {
      console.error('Customer API error:', e)
      return c.json({ success: false, error: e.message }, 500)
    }
  })

  // Get customer order history by phone or user_id
  app.get('/api/admin/customers/:identifier/orders', async (c) => {
    try {
      await deps.initDB(c.env.DB)
      
      const identifier = c.req.param('identifier')
      const type = c.req.query('type') // 'phone' or 'user_id'
      
      let query = ''
      let stmt: D1PreparedStatement
      
      if (type === 'user_id') {
        query = `
          SELECT o.*,
                 p.thumbnail AS product_thumbnail,
                 CASE WHEN LOWER(COALESCE(o.payment_status, ''))='paid' THEN 0 ELSE o.total_price END AS amount_due
          FROM orders o
          LEFT JOIN products p ON p.id = o.product_id
          WHERE o.user_id = ?
          ORDER BY o.created_at DESC
        `
        stmt = c.env.DB.prepare(query).bind(identifier)
      } else {
        query = `
          SELECT o.*,
                 p.thumbnail AS product_thumbnail,
                 CASE WHEN LOWER(COALESCE(o.payment_status, ''))='paid' THEN 0 ELSE o.total_price END AS amount_due
          FROM orders o
          LEFT JOIN products p ON p.id = o.product_id
          WHERE o.customer_phone = ?
          ORDER BY o.created_at DESC
        `
        stmt = c.env.DB.prepare(query).bind(identifier)
      }
      
      const result = await stmt.all()
      return c.json({ success: true, data: result.results || [] })
    } catch (e: any) {
      return c.json({ success: false, error: e.message }, 500)
    }
  })
}
