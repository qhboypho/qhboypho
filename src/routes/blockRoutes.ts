import type { Hono } from 'hono'
import type { AppBindings } from '../types/app'
import { refreshCustomerAutoBlock } from '../lib/customerBlockHelpers'

type BlockRouteDeps = {
  initDB: (db: D1Database) => Promise<void>
}

function isBlockedValue(value: unknown) {
  return Number(value || 0) === 1
}

function normalizeBlockPhone(value: unknown) {
  let phone = String(value || '').trim().replace(/\s+/g, '').replace(/[^\d]/g, '')
  if (phone.startsWith('0084')) phone = '0' + phone.slice(4)
  else if (phone.startsWith('84') && phone.length >= 11) phone = '0' + phone.slice(2)
  return phone
}

function getBangkokOverrideWindow(now = new Date()) {
  const bangkokOffsetMs = 7 * 60 * 60 * 1000
  const bangkokNow = new Date(now.getTime() + bangkokOffsetMs)
  const year = bangkokNow.getUTCFullYear()
  const month = bangkokNow.getUTCMonth()
  const day = bangkokNow.getUTCDate()
  const dayStartUtcMs = Date.UTC(year, month, day, 0, 0, 0) - bangkokOffsetMs
  return {
    overrideDate: `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
    expiresAt: new Date(dayStartUtcMs + 24 * 60 * 60 * 1000).toISOString()
  }
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

      await refreshCustomerAutoBlock(c.env.DB, userId, phone)
      
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
          query += "REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(TRIM(customer_phone), ' ', ''), '-', ''), '.', ''), '(', ''), ')', ''), '+', '') = ?"
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

  // Admin: allow a customer to place more orders today despite the daily risk limit.
  app.post('/api/admin/customers/daily-limit-override', async (c) => {
    try {
      await deps.initDB(c.env.DB)

      const body = await c.req.json()
      const userId = body.user_id ? Number(body.user_id) : null
      const phone = body.customer_phone ? normalizeBlockPhone(body.customer_phone) : null
      const reason = String(body.reason || 'Admin cho phép đặt thêm trong ngày').trim().slice(0, 240)

      if (!phone) {
        return c.json({ success: false, error: 'customer_phone required' }, 400)
      }

      const { overrideDate, expiresAt } = getBangkokOverrideWindow()

      await c.env.DB.prepare(`
        INSERT INTO daily_order_limit_overrides (user_id, customer_phone, override_date, reason, granted_by, expires_at, is_active)
        VALUES (?, ?, ?, ?, 'admin', ?, 1)
        ON CONFLICT(customer_phone, override_date) DO UPDATE SET
          user_id = excluded.user_id,
          reason = excluded.reason,
          granted_by = 'admin',
          granted_at = CURRENT_TIMESTAMP,
          expires_at = excluded.expires_at,
          revoked_at = NULL,
          is_active = 1
      `).bind(userId, phone, overrideDate, reason, expiresAt).run()

      return c.json({
        success: true,
        message: 'Đã mở limit đặt đơn hôm nay cho khách hàng',
        data: {
          customer_phone: phone,
          override_date: overrideDate,
          expires_at: expiresAt
        }
      })
    } catch (e: any) {
      console.error('Grant daily order limit override error:', e)
      return c.json({ success: false, error: e.message }, 500)
    }
  })

  // Admin: revoke today's daily order limit override.
  app.post('/api/admin/customers/daily-limit-override/revoke', async (c) => {
    try {
      await deps.initDB(c.env.DB)

      const body = await c.req.json()
      const phone = body.customer_phone ? normalizeBlockPhone(body.customer_phone) : null

      if (!phone) {
        return c.json({ success: false, error: 'customer_phone required' }, 400)
      }

      const { overrideDate } = getBangkokOverrideWindow()

      await c.env.DB.prepare(`
        UPDATE daily_order_limit_overrides
        SET is_active = 0,
            revoked_at = CURRENT_TIMESTAMP
        WHERE customer_phone = ?
          AND override_date = ?
      `).bind(phone, overrideDate).run()

      return c.json({ success: true, message: 'Đã tắt mở limit đặt đơn hôm nay' })
    } catch (e: any) {
      console.error('Revoke daily order limit override error:', e)
      return c.json({ success: false, error: e.message }, 500)
    }
  })

  // Check and auto-block customers with 3+ customer-fault delivery failures
  app.post('/api/admin/customers/check-auto-block', async (c) => {
    try {
      await deps.initDB(c.env.DB)
      
      const body = await c.req.json()
      const userId = body.user_id ? Number(body.user_id) : null
      const phone = body.customer_phone ? normalizeBlockPhone(body.customer_phone) : null
      
      if (!userId && !phone) {
        return c.json({ success: false, error: 'user_id or customer_phone required' }, 400)
      }

      const result = await refreshCustomerAutoBlock(c.env.DB, userId, phone)
      if (result.autoBlocked) {
        
        return c.json({ 
          success: true, 
          auto_blocked: true,
          cancelled_count: result.cancelledCount,
          message: result.reason
        })
      }
      
      return c.json({ 
        success: true, 
        auto_blocked: false,
        cancelled_count: result.cancelledCount
      })
    } catch (e: any) {
      console.error('Check auto-block error:', e)
      return c.json({ success: false, error: e.message }, 500)
    }
  })
}
