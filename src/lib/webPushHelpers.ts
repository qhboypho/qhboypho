import {
  buildPushPayload,
  type PushMessage,
  type PushSubscription,
  type VapidKeys
} from '@block65/webcrypto-web-push'
import type { AppBindings } from '../types/app'

type AdminPushSubscriptionRow = {
  id: number
  endpoint: string
  p256dh: string
  auth: string
}

type AdminOrderPushPayload = {
  id?: number | string | null
  order_code?: string | null
  customer_name?: string | null
  customer_phone?: string | null
  total_price?: number | string | null
}

function trimEnv(value: unknown) {
  return String(value || '').trim()
}

export function getWebPushVapidPublicKey(env: AppBindings) {
  return trimEnv(env.WEB_PUSH_VAPID_PUBLIC_KEY)
}

export function hasWebPushVapidConfig(env: AppBindings) {
  return !!getWebPushVapidPublicKey(env) && !!trimEnv(env.WEB_PUSH_VAPID_PRIVATE_KEY)
}

function getWebPushVapidKeys(env: AppBindings): VapidKeys | null {
  const publicKey = getWebPushVapidPublicKey(env)
  const privateKey = trimEnv(env.WEB_PUSH_VAPID_PRIVATE_KEY)
  if (!publicKey || !privateKey) return null
  return {
    subject: trimEnv(env.WEB_PUSH_VAPID_SUBJECT) || 'mailto:admin@boypho.local',
    publicKey,
    privateKey
  }
}

function formatVnd(value: unknown) {
  const amount = Number(value || 0)
  if (!Number.isFinite(amount)) return '0đ'
  return Math.round(amount).toLocaleString('vi-VN') + 'đ'
}

function buildAdminOrderPushPayload(order: AdminOrderPushPayload) {
  const code = trimEnv(order.order_code) || ('#' + trimEnv(order.id))
  const name = trimEnv(order.customer_name) || 'Khách mới'
  const phone = trimEnv(order.customer_phone)
  const total = formatVnd(order.total_price)
  const body = name + (phone ? ' - ' + phone : '') + ' - ' + total
  return {
    type: 'new_order',
    title: 'Boypho có đơn mới ' + code,
    body,
    orderId: Number(order.id || 0) || 0,
    orderCode: code,
    url: '/admin/orders',
    icon: '/qh-logo.png',
    badge: '/qh-logo.png',
    tag: 'new-order-' + (Number(order.id || 0) || code)
  }
}

async function markPushSubscriptionFailure(db: D1Database, id: number, status: number, message = '') {
  const permanent = status === 404 || status === 410
  await db.prepare(`
    UPDATE admin_push_subscriptions
    SET failed_count = failed_count + 1,
        last_error = ?,
        is_active = CASE WHEN ? THEN 0 ELSE is_active END,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).bind(String(status || '') + (message ? ':' + message.slice(0, 160) : ''), permanent ? 1 : 0, id).run()
}

async function markPushSubscriptionSuccess(db: D1Database, id: number) {
  await db.prepare(`
    UPDATE admin_push_subscriptions
    SET failed_count = 0,
        last_error = '',
        updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).bind(id).run()
}

function copyPushBodyToArrayBuffer(body: Uint8Array): ArrayBuffer {
  const copy = new ArrayBuffer(body.byteLength)
  new Uint8Array(copy).set(body)
  return copy
}

export async function notifyAdminNewOrderPush(env: AppBindings, db: D1Database, order: AdminOrderPushPayload) {
  const vapid = getWebPushVapidKeys(env)
  if (!vapid) return { sent: 0, skipped: 'missing_vapid' }

  const rows = await db.prepare(`
    SELECT id, endpoint, p256dh, auth
    FROM admin_push_subscriptions
    WHERE is_active = 1
    ORDER BY updated_at DESC
    LIMIT 50
  `).all<AdminPushSubscriptionRow>()

  const subscriptions = rows.results || []
  if (!subscriptions.length) return { sent: 0, skipped: 'no_subscriptions' }

  const payload = buildAdminOrderPushPayload(order)
  const message: PushMessage = {
    data: payload,
    options: {
      ttl: 120,
      urgency: 'high',
      topic: 'boypho-new-order'
    }
  }

  let sent = 0
  await Promise.all(subscriptions.map(async (row) => {
    try {
      const subscription: PushSubscription = {
        endpoint: row.endpoint,
        expirationTime: null,
        keys: {
          auth: row.auth,
          p256dh: row.p256dh
        }
      }
      const request = await buildPushPayload(message, subscription, vapid)
      const response = await fetch(subscription.endpoint, {
        ...request,
        body: copyPushBodyToArrayBuffer(request.body),
      })
      if (response.ok) {
        sent += 1
        await markPushSubscriptionSuccess(db, row.id)
        return
      }
      await markPushSubscriptionFailure(db, row.id, response.status, response.statusText)
    } catch (error: any) {
      await markPushSubscriptionFailure(db, row.id, 0, error?.message || 'push_failed')
    }
  }))

  return { sent, skipped: '' }
}
