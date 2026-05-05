import type { Hono } from 'hono'
import type { AppBindings } from '../types/app'

type CustomerRouteDeps = {
  initDB: (db: D1Database) => Promise<void>
}

const MAX_CUSTOMER_LIST_THUMBNAIL_LENGTH = 2048

function normalizeCustomerListThumbnail(value: unknown): string {
  const thumbnail = typeof value === 'string' ? value.trim() : ''
  if (!thumbnail) return ''
  if (/^data:/i.test(thumbnail)) return ''
  if (thumbnail.length > MAX_CUSTOMER_LIST_THUMBNAIL_LENGTH) return ''
  return thumbnail
}

export function registerCustomerRoutes(app: Hono<{ Bindings: AppBindings }>, deps: CustomerRouteDeps) {
  // Get all customers (unique by phone or user_id)
  app.get('/api/admin/customers', async (c) => {
    try {
      await deps.initDB(c.env.DB)

      // Check if is_blocked column exists
      let hasBlockedColumn = false
      try {
        await c.env.DB.prepare('SELECT is_blocked FROM users LIMIT 1').all()
        hasBlockedColumn = true
      } catch (e) {
        hasBlockedColumn = false
      }

      const isBlockedSelect = hasBlockedColumn ? 'u.is_blocked' : '0 AS is_blocked'

      const query = `
        WITH normalized_orders AS (
          SELECT
            CASE
              WHEN o.user_id IS NOT NULL THEN 'user_' || CAST(o.user_id AS TEXT)
              ELSE 'phone_' || TRIM(COALESCE(o.customer_phone, ''))
            END AS customer_key,
            o.customer_name,
            o.customer_phone,
            o.customer_address,
            o.user_id,
            u.name AS user_name,
            ${isBlockedSelect},
            o.product_name,
            NULLIF(TRIM(p.thumbnail), '') AS product_thumbnail,
            o.total_price,
            o.created_at,
            o.id AS order_id,
            CASE WHEN o.status = 'cancelled' THEN 1 ELSE 0 END AS is_cancelled
          FROM orders o
          LEFT JOIN users u ON u.id = o.user_id
          LEFT JOIN products p ON p.id = o.product_id
          WHERE o.user_id IS NOT NULL OR TRIM(COALESCE(o.customer_phone, '')) != ''
        ),
        ranked_orders AS (
          SELECT
            *,
            ROW_NUMBER() OVER (
              PARTITION BY customer_key
              ORDER BY datetime(created_at) DESC, order_id DESC
            ) AS rn
          FROM normalized_orders
        )
        SELECT
          customer_key,
          COALESCE(
            MAX(CASE WHEN rn = 1 THEN customer_name END),
            MAX(customer_name),
            ''
          ) AS customer_name,
          COALESCE(
            MAX(CASE WHEN rn = 1 THEN customer_phone END),
            MAX(customer_phone),
            ''
          ) AS customer_phone,
          COALESCE(
            MAX(CASE WHEN rn = 1 THEN customer_address END),
            MAX(customer_address),
            ''
          ) AS customer_address,
          MAX(user_id) AS user_id,
          COALESCE(MAX(user_name), '') AS user_name,
          COALESCE(MAX(is_blocked), 0) AS is_blocked,
          COUNT(*) AS order_count,
          SUM(is_cancelled) AS cancelled_count,
          COALESCE(SUM(COALESCE(total_price, 0)), 0) AS total_spent,
          COALESCE(
            MAX(CASE WHEN rn = 1 THEN product_name END),
            MAX(product_name),
            ''
          ) AS first_product_name,
          COALESCE(
            MAX(CASE WHEN rn = 1 THEN product_thumbnail END),
            MAX(product_thumbnail),
            ''
          ) AS first_product_thumbnail,
          MIN(created_at) AS first_order_date,
          MAX(created_at) AS latest_order_date
        FROM ranked_orders
        GROUP BY customer_key
        ORDER BY datetime(latest_order_date) DESC
      `
      
      const result = await c.env.DB.prepare(query).all()
      const customers = (result.results || []).map((customer: any) => ({
        ...customer,
        first_product_thumbnail: normalizeCustomerListThumbnail(customer.first_product_thumbnail),
      }))
      
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
