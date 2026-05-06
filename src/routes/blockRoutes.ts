import type { Hono } from 'hono'
import type { AppBindings } from '../types/app'

type BlockRouteDeps = {
  initDB: (db: D1Database) => Promise<void>
}

function isBlockedValue(value: unknown) {
  return Number(value || 0) === 1
}

function normalizeBlockPhone(value: unknown) {
  return String(value || '').trim().replace(/\s+/g, '')
}

export function registerBlockRoutes(app: Hono<{ Bindings: AppBindings }>, deps: BlockRouteDeps) {
  // Check if customer is blocked (for frontend checkout validation)
  app.get('/api/customers/block-status', async (c) => {
    try {
      await deps.initDB(c.env.DB)
      
      const userId = c.req.query('user_id')
      const phone = normalizeBlockPhone(c.req.query('phone'))
      
      if (!userId && !phone) {
        return c.json({ success: false, error: 'user_id or phone required' }, 400)
      }
      
      let isBlocked = false
      let reason = ''
      
      // Check users table if user_id provided
      if (userId) {
        const user = await c.env.DB.prepare(
          'SELECT is_blocked, blocked_reason FROM users WHERE id = ?'
        ).bind(userId).first() as any
        
        if (user && isBlockedValue(user.is_blocked)) {
          isBlocked = true
          reason = user.blocked_reason || 'Bạn đã bị cấm mua hàng tạm thời'
        }
      }
      
      // Check blocked_customers table
      if (!isBlocked) {
        let query = 'SELECT blocked_reason FROM blocked_customers WHERE is_active = 1 AND ('
        const params: any[] = []
        
        if (userId) {
          query += 'user_id = ?'
          params.push(userId)
        }
        
        if (phone) {
          if (userId) query += ' OR '
          query += 'customer_phone = ?'
          params.push(phone)
        }
        
        query += ')'
        
        const block = await c.env.DB.prepare(query).bind(...params).first() as any
        
        if (block) {
          isBlocked = true
          reason = block.blocked_reason || 'Bạn đã bị cấm mua hàng tạm thời'
        }
      }
      
      return c.json({ 
        success: true, 
        data: { 
          is_blocked: isBlocked,
          reason: reason
        } 
      })
    } catch (e: any) {
      console.error('Check block status error:', e)
      return c.json({ success: false, error: e.message }, 500)
    }
  })

  // Admin: Block customer
  app.post('/api/admin/customers/block', async (c) => {
    try {
      await deps.initDB(c.env.DB)
      
      const body = await c.req.json()
      const userId = body.user_id ? Number(body.user_id) : null
      const phone = body.customer_phone ? normalizeBlockPhone(body.customer_phone) : null
      const reason = body.reason || 'Bị chặn bởi quản trị viên'
      
      if (!userId && !phone) {
        return c.json({ success: false, error: 'user_id or customer_phone required' }, 400)
      }
      
      // Update users table if user_id provided
      if (userId) {
        await c.env.DB.prepare(`
          UPDATE users 
          SET is_blocked = 1, 
              blocked_reason = ?,
              blocked_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `).bind(reason, userId).run()
      }
      
      // Insert/update blocked_customers table
      // For users with user_id, use user_id as key
      // For guest checkout, use phone as key
      if (userId) {
        await c.env.DB.prepare(`
          INSERT INTO blocked_customers (user_id, customer_phone, blocked_reason, blocked_by, is_active)
          VALUES (?, ?, ?, 'admin', 1)
          ON CONFLICT(user_id, customer_phone) DO UPDATE SET
            is_active = 1,
            blocked_reason = excluded.blocked_reason,
            blocked_by = 'admin',
            blocked_at = CURRENT_TIMESTAMP,
            unblocked_at = NULL
        `).bind(userId, phone, reason).run()
      } else if (phone) {
        // Guest checkout - check if already exists
        const existing = await c.env.DB.prepare(
          'SELECT id FROM blocked_customers WHERE customer_phone = ? AND user_id IS NULL'
        ).bind(phone).first()
        
        if (existing) {
          await c.env.DB.prepare(`
            UPDATE blocked_customers 
            SET is_active = 1,
                blocked_reason = ?,
                blocked_by = 'admin',
                blocked_at = CURRENT_TIMESTAMP,
                unblocked_at = NULL
            WHERE customer_phone = ? AND user_id IS NULL
          `).bind(reason, phone).run()
        } else {
          await c.env.DB.prepare(`
            INSERT INTO blocked_customers (user_id, customer_phone, blocked_reason, blocked_by, is_active)
            VALUES (NULL, ?, ?, 'admin', 1)
          `).bind(phone, reason).run()
        }
      }
      
      return c.json({ success: true, message: 'Đã chặn khách hàng' })
    } catch (e: any) {
      console.error('Block customer error:', e)
      return c.json({ success: false, error: e.message }, 500)
    }
  })

  // Admin: Unblock customer
  app.post('/api/admin/customers/unblock', async (c) => {
    try {
      await deps.initDB(c.env.DB)
      
      const body = await c.req.json()
      const userId = body.user_id ? Number(body.user_id) : null
      const phone = body.customer_phone ? normalizeBlockPhone(body.customer_phone) : null
      
      if (!userId && !phone) {
        return c.json({ success: false, error: 'user_id or customer_phone required' }, 400)
      }
      
      // Update users table if user_id provided
      if (userId) {
        await c.env.DB.prepare(`
          UPDATE users 
          SET is_blocked = 0, 
              blocked_reason = NULL,
              blocked_at = NULL
          WHERE id = ?
        `).bind(userId).run()
      }
      
      // Update blocked_customers table
      if (userId && phone) {
        await c.env.DB.prepare(
          'UPDATE blocked_customers SET is_active = 0, unblocked_at = CURRENT_TIMESTAMP WHERE user_id = ? OR customer_phone = ?'
        ).bind(userId, phone).run()
      } else if (userId) {
        await c.env.DB.prepare(
          'UPDATE blocked_customers SET is_active = 0, unblocked_at = CURRENT_TIMESTAMP WHERE user_id = ?'
        ).bind(userId).run()
      } else if (phone) {
        await c.env.DB.prepare(
          'UPDATE blocked_customers SET is_active = 0, unblocked_at = CURRENT_TIMESTAMP WHERE customer_phone = ?'
        ).bind(phone).run()
      }
      
      return c.json({ success: true, message: 'Đã bỏ chặn khách hàng' })
    } catch (e: any) {
      console.error('Unblock customer error:', e)
      return c.json({ success: false, error: e.message }, 500)
    }
  })

  // Check and auto-block customers with 3+ cancelled orders
  app.post('/api/admin/customers/check-auto-block', async (c) => {
    try {
      await deps.initDB(c.env.DB)
      
      const body = await c.req.json()
      const userId = body.user_id ? Number(body.user_id) : null
      const phone = body.customer_phone ? normalizeBlockPhone(body.customer_phone) : null
      
      if (!userId && !phone) {
        return c.json({ success: false, error: 'user_id or customer_phone required' }, 400)
      }
      
      // Count cancelled orders
      let query = 'SELECT COUNT(*) as cancelled_count FROM orders WHERE status = ? AND ('
      const params: any[] = ['cancelled']
      
      if (userId) {
        query += 'user_id = ?'
        params.push(userId)
      }
      
      if (phone) {
        if (userId) query += ' OR '
        query += 'customer_phone = ?'
        params.push(phone)
      }
      
      query += ')'
      
      const result = await c.env.DB.prepare(query).bind(...params).first() as any
      const cancelledCount = Number(result?.cancelled_count || 0)
      
      if (cancelledCount >= 3) {
        // Auto-block this customer
        const reason = `Tự động chặn: Đã hủy ${cancelledCount} đơn hàng`
        
        if (userId) {
          await c.env.DB.prepare(`
            UPDATE users 
            SET is_blocked = 1, 
                blocked_reason = ?,
                blocked_at = CURRENT_TIMESTAMP
            WHERE id = ?
          `).bind(reason, userId).run()
        }
        
        await c.env.DB.prepare(`
          INSERT INTO blocked_customers (user_id, customer_phone, blocked_reason, blocked_by, is_active)
          VALUES (?, ?, ?, 'system', 1)
          ON CONFLICT(user_id, customer_phone) DO UPDATE SET
            is_active = 1,
            blocked_reason = excluded.blocked_reason,
            blocked_by = 'system',
            blocked_at = CURRENT_TIMESTAMP,
            unblocked_at = NULL
        `).bind(userId, phone, reason).run()
        
        return c.json({ 
          success: true, 
          auto_blocked: true,
          cancelled_count: cancelledCount,
          message: reason
        })
      }
      
      return c.json({ 
        success: true, 
        auto_blocked: false,
        cancelled_count: cancelledCount
      })
    } catch (e: any) {
      console.error('Check auto-block error:', e)
      return c.json({ success: false, error: e.message }, 500)
    }
  })
}
