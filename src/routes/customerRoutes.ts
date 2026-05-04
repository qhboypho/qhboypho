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
      
      // Query to get unique customers with their order count and first product
      const query = `
        WITH customer_orders AS (
          SELECT 
            o.customer_name,
            o.customer_phone,
            o.customer_address,
            o.user_id,
            u.name AS user_name,
            COUNT(DISTINCT o.id) AS order_count,
            MIN(o.id) AS first_order_id,
            MIN(o.created_at) AS first_order_date
          FROM orders o
          LEFT JOIN users u ON u.id = o.user_id
          GROUP BY 
            CASE 
              WHEN o.user_id IS NOT NULL THEN 'user_' || o.user_id
              ELSE 'phone_' || o.customer_phone
            END,
            o.customer_name,
            o.customer_phone,
            o.customer_address,
            o.user_id,
            u.name
        ),
        first_products AS (
          SELECT 
            co.customer_phone,
            co.user_id,
            o.product_name,
            p.thumbnail AS product_thumbnail
          FROM customer_orders co
          INNER JOIN orders o ON o.id = co.first_order_id
          LEFT JOIN products p ON p.id = o.product_id
        )
        SELECT 
          co.*,
          fp.product_name AS first_product_name,
          fp.product_thumbnail AS first_product_thumbnail
        FROM customer_orders co
        LEFT JOIN first_products fp ON 
          (co.user_id IS NOT NULL AND fp.user_id = co.user_id) OR
          (co.user_id IS NULL AND fp.customer_phone = co.customer_phone)
        ORDER BY co.first_order_date DESC
      `
      
      const result = await c.env.DB.prepare(query).all()
      return c.json({ success: true, data: result.results || [] })
    } catch (e: any) {
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
