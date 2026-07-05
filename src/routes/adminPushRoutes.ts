import { getCookie } from 'hono/cookie'
import type { Hono } from 'hono'
import type { AppBindings } from '../types/app'
import { getWebPushVapidPublicKey, hasWebPushVapidConfig } from '../lib/webPushHelpers'
import { normalizeAdminUserKey } from '../lib/adminHelpers'

type AdminPushRouteDeps = {
  initDB: (db: D1Database) => Promise<void>
}

function cleanPushText(value: unknown, max = 4096) {
  return String(value || '').trim().slice(0, max)
}

function readSubscriptionPayload(body: any) {
  const subscription = body?.subscription || body || {}
  const endpoint = cleanPushText(subscription.endpoint, 4096)
  const keys = subscription.keys || {}
  const p256dh = cleanPushText(keys.p256dh, 512)
  const auth = cleanPushText(keys.auth, 256)
  return { endpoint, p256dh, auth }
}

function isLikelyPushEndpoint(endpoint: string) {
  if (!endpoint || endpoint.length > 4096) return false
  try {
    const url = new URL(endpoint)
    return url.protocol === 'https:'
  } catch {
    return false
  }
}

export function registerAdminPushRoutes(app: Hono<{ Bindings: AppBindings }>, deps: AdminPushRouteDeps) {
  app.get('/api/admin/push/vapid-public-key', async (c) => {
    await deps.initDB(c.env.DB)
    const publicKey = getWebPushVapidPublicKey(c.env)
    return c.json({
      success: true,
      data: {
        enabled: hasWebPushVapidConfig(c.env),
        publicKey
      }
    })
  })

  app.post('/api/admin/push/subscriptions', async (c) => {
    try {
      await deps.initDB(c.env.DB)
      const body: any = await c.req.json().catch(() => ({}))
      const { endpoint, p256dh, auth } = readSubscriptionPayload(body)
      if (!isLikelyPushEndpoint(endpoint) || !p256dh || !auth) {
        return c.json({ success: false, error: 'INVALID_PUSH_SUBSCRIPTION' }, 400)
      }

      const adminUserKey = normalizeAdminUserKey(getCookie(c, 'admin_user_key') || 'admin')
      const userAgent = cleanPushText(c.req.header('user-agent'), 512)
      await c.env.DB.prepare(`
        INSERT INTO admin_push_subscriptions
          (admin_user_key, endpoint, p256dh, auth, user_agent, is_active, failed_count, last_error, updated_at)
        VALUES (?, ?, ?, ?, ?, 1, 0, '', CURRENT_TIMESTAMP)
        ON CONFLICT(endpoint) DO UPDATE SET
          admin_user_key = excluded.admin_user_key,
          p256dh = excluded.p256dh,
          auth = excluded.auth,
          user_agent = excluded.user_agent,
          is_active = 1,
          failed_count = 0,
          last_error = '',
          updated_at = CURRENT_TIMESTAMP
      `).bind(adminUserKey, endpoint, p256dh, auth, userAgent).run()

      return c.json({ success: true })
    } catch (e: any) {
      return c.json({ success: false, error: e.message }, 500)
    }
  })

  app.delete('/api/admin/push/subscriptions', async (c) => {
    try {
      await deps.initDB(c.env.DB)
      const body: any = await c.req.json().catch(() => ({}))
      const endpoint = cleanPushText(body?.endpoint, 4096)
      if (!endpoint) return c.json({ success: false, error: 'MISSING_ENDPOINT' }, 400)
      await c.env.DB.prepare(`
        UPDATE admin_push_subscriptions
        SET is_active = 0, updated_at = CURRENT_TIMESTAMP
        WHERE endpoint = ?
      `).bind(endpoint).run()
      return c.json({ success: true })
    } catch (e: any) {
      return c.json({ success: false, error: e.message }, 500)
    }
  })
}
