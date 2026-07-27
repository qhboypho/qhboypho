import { getCookie } from 'hono/cookie'
import type { Hono } from 'hono'
import { normalizeAdminUserKey } from '../lib/adminHelpers'
import { getUserSessionUserId } from '../lib/userSessionHelpers'
import type { AppBindings } from '../types/app'

type LiveChatRouteDeps = {
  initDB: (db: D1Database) => Promise<void>
}

type ProductContext = {
  product_id: number | null
  product_name: string
  product_thumbnail: string
  product_url: string
}

export const LIVE_CHAT_TTL_DAYS = 7

function normalizeGuestPhone(value: unknown) {
  let phone = String(value || '').trim().replace(/\s+/g, '').replace(/[^\d+]/g, '')
  if (phone.startsWith('+84')) phone = '0' + phone.slice(3)
  else if (phone.startsWith('0084')) phone = '0' + phone.slice(4)
  else if (phone.startsWith('84') && phone.length >= 11) phone = '0' + phone.slice(2)
  phone = phone.replace(/[^\d]/g, '')
  return phone
}

function normalizeText(value: unknown, max = 1200) {
  return String(value || '').replace(/\s+/g, ' ').trim().slice(0, max)
}

function normalizeMessageBody(value: unknown, max = 1600) {
  return String(value || '')
    .replace(/\r\n?/g, '\n')
    .split('\n')
    .map((line) => line.replace(/[ \t]+/g, ' ').trim())
    .join('\n')
    .replace(/\n{4,}/g, '\n\n\n')
    .trim()
    .slice(0, max)
}

function expiresAtSql(days = LIVE_CHAT_TTL_DAYS) {
  return `datetime('now', '+${days} days')`
}

function createChatId(prefix: string) {
  return `${prefix}_${crypto.randomUUID().replace(/-/g, '')}`
}

function createCustomerToken() {
  const bytes = new Uint8Array(24)
  crypto.getRandomValues(bytes)
  return Array.from(bytes).map((byte) => byte.toString(16).padStart(2, '0')).join('')
}

async function parseBody(c: any) {
  return await c.req.json().catch(() => ({}))
}

async function resolveProductContext(db: D1Database, productId: unknown): Promise<ProductContext | null> {
  const id = Number(productId)
  if (!Number.isFinite(id) || id <= 0) return null
  const product = await db.prepare(`
    SELECT id, name, thumbnail
    FROM products
    WHERE id = ? AND COALESCE(is_active, 1) = 1
    LIMIT 1
  `).bind(id).first<any>()
  if (!product) return null
  return {
    product_id: Number(product.id),
    product_name: normalizeText(product.name, 180),
    product_thumbnail: normalizeText(product.thumbnail, 2048),
    product_url: `/?product=${Number(product.id)}`,
  }
}

async function getConversationForCustomer(db: D1Database, conversationId: string, userId: string | null, token: string) {
  const row = await db.prepare(`
    SELECT *
    FROM live_chat_conversations
    WHERE id = ?
      AND status != 'deleted'
      AND datetime(expires_at) > datetime('now')
    LIMIT 1
  `).bind(conversationId).first<any>()
  if (!row) return null
  if (userId && String(row.user_id || '') === String(userId)) return row
  if (token && String(row.customer_token || '') === token) return row
  return null
}

function getRoom(env: AppBindings, conversationId: string) {
  const id = env.LIVE_CHAT_ROOM.idFromName(conversationId)
  return env.LIVE_CHAT_ROOM.get(id)
}

export async function notifyLiveChatRoom(env: AppBindings, conversationId: string, payload: Record<string, unknown>) {
  try {
    const room = getRoom(env, conversationId)
    await room.fetch('https://live-chat-room.local/broadcast', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload),
    })
  } catch (error) {
    console.error('notifyLiveChatRoom error', error)
  }
}

export async function cleanupExpiredLiveChat(db: D1Database) {
  const deletedMessages = await db.prepare(`
    DELETE FROM live_chat_messages
    WHERE datetime(expires_at) <= datetime('now')
       OR conversation_id IN (
         SELECT id FROM live_chat_conversations WHERE datetime(expires_at) <= datetime('now')
       )
  `).run()
  const deletedConversations = await db.prepare(`
    DELETE FROM live_chat_conversations
    WHERE datetime(expires_at) <= datetime('now')
  `).run()
  return {
    messages: deletedMessages.meta?.changes || 0,
    conversations: deletedConversations.meta?.changes || 0,
  }
}

async function insertMessage(db: D1Database, input: {
  conversationId: string
  senderType: 'customer' | 'admin' | 'system'
  senderId?: string
  senderName?: string
  body?: string
  messageType?: 'text' | 'product' | 'system'
  product?: ProductContext | null
}) {
  const id = createChatId('msg')
  const body = normalizeMessageBody(input.body, 1600)
  const product = input.product || null
  await db.prepare(`
    INSERT INTO live_chat_messages (
      id, conversation_id, sender_type, sender_id, sender_name, body, message_type,
      product_id, product_name, product_thumbnail, product_url, expires_at
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ${expiresAtSql()})
  `).bind(
    id,
    input.conversationId,
    input.senderType,
    input.senderId || '',
    normalizeText(input.senderName, 100),
    body,
    input.messageType || 'text',
    product?.product_id || null,
    product?.product_name || '',
    product?.product_thumbnail || '',
    product?.product_url || ''
  ).run()

  await db.prepare(`
    UPDATE live_chat_conversations
    SET last_message = ?,
        last_message_at = CURRENT_TIMESTAMP,
        updated_at = CURRENT_TIMESTAMP,
        admin_unread_count = admin_unread_count + CASE WHEN ? = 'customer' THEN 1 ELSE 0 END,
        customer_unread_count = customer_unread_count + CASE WHEN ? = 'admin' THEN 1 ELSE 0 END,
        expires_at = ${expiresAtSql()}
    WHERE id = ?
  `).bind(
    input.messageType === 'product' ? (product?.product_name || 'Sản phẩm') : body,
    input.senderType,
    input.senderType,
    input.conversationId
  ).run()

  return {
    id,
    conversation_id: input.conversationId,
    sender_type: input.senderType,
    sender_id: input.senderId || '',
    sender_name: normalizeText(input.senderName, 100),
    body,
    message_type: input.messageType || 'text',
    product_id: product?.product_id || null,
    product_name: product?.product_name || '',
    product_thumbnail: product?.product_thumbnail || '',
    product_url: product?.product_url || '',
    created_at: new Date().toISOString(),
  }
}

async function hasProductContextMessage(db: D1Database, conversationId: string, productId: number | null) {
  if (!productId) return false
  const row = await db.prepare(`
    SELECT id
    FROM live_chat_messages
    WHERE conversation_id = ?
      AND message_type = 'product'
      AND product_id = ?
      AND datetime(expires_at) > datetime('now')
    LIMIT 1
  `).bind(conversationId, productId).first()
  return !!row
}

export function registerLiveChatRoutes(app: Hono<{ Bindings: AppBindings }>, deps: LiveChatRouteDeps) {
  app.post('/api/live-chat/start', async (c) => {
    try {
      await deps.initDB(c.env.DB)
      const body = await parseBody(c)
      const userId = await getUserSessionUserId(c)
      const guest_phone = normalizeGuestPhone(body.guest_phone)
      if (!userId && guest_phone.length < 9) {
        return c.json({ success: false, error: 'GUEST_PHONE_REQUIRED' }, 400)
      }

      const customer = userId
        ? await c.env.DB.prepare('SELECT id, name, phone, email FROM users WHERE id=? LIMIT 1').bind(userId).first<any>()
        : null
      const customerName = normalizeText(customer?.name || body.customer_name || (guest_phone ? `Khách ${guest_phone}` : 'Khách hàng'), 100)
      const product = await resolveProductContext(c.env.DB, body.product_id)

      const existing = userId
        ? await c.env.DB.prepare(`
          SELECT * FROM live_chat_conversations
          WHERE user_id = ? AND status = 'open' AND datetime(expires_at) > datetime('now')
          ORDER BY datetime(updated_at) DESC LIMIT 1
        `).bind(userId).first<any>()
        : await c.env.DB.prepare(`
          SELECT * FROM live_chat_conversations
          WHERE guest_phone = ? AND status = 'open' AND datetime(expires_at) > datetime('now')
          ORDER BY datetime(updated_at) DESC LIMIT 1
        `).bind(guest_phone).first<any>()

      const conversationId = existing?.id || createChatId('chat')
      const token = existing?.customer_token || createCustomerToken()
      if (!existing) {
        await c.env.DB.prepare(`
          INSERT INTO live_chat_conversations (
            id, user_id, guest_phone, customer_token, customer_name,
            product_id, product_name, product_thumbnail, product_url, expires_at
          )
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ${expiresAtSql()})
        `).bind(
          conversationId,
          userId ? Number(userId) : null,
          userId ? normalizeGuestPhone(customer?.phone) : guest_phone,
          token,
          customerName,
          product?.product_id || null,
          product?.product_name || '',
          product?.product_thumbnail || '',
          product?.product_url || ''
        ).run()
      }

      if (product && !(await hasProductContextMessage(c.env.DB, conversationId, product.product_id))) {
        const message = await insertMessage(c.env.DB, {
          conversationId,
          senderType: 'customer',
          senderId: userId || guest_phone,
          senderName: customerName,
          body: 'Khách đang hỏi về sản phẩm này',
          messageType: 'product',
          product,
        })
        await notifyLiveChatRoom(c.env, conversationId, { conversation_id: conversationId, message })
      }

      return c.json({
        success: true,
        data: {
          conversation_id: conversationId,
          customer_token: token,
          customer_name: customerName,
        },
      })
    } catch (error: any) {
      console.error('live chat start error', error)
      return c.json({ success: false, error: error?.message || 'LIVE_CHAT_START_FAILED' }, 500)
    }
  })

  app.get('/api/live-chat/product-context', async (c) => {
    await deps.initDB(c.env.DB)
    const product = await resolveProductContext(c.env.DB, c.req.query('product_id'))
    if (!product) return c.json({ success: false, error: 'PRODUCT_NOT_FOUND' }, 404)
    return c.json({ success: true, data: product })
  })

  app.get('/api/live-chat/:conversationId/messages', async (c) => {
    await deps.initDB(c.env.DB)
    const userId = await getUserSessionUserId(c)
    const token = String(c.req.query('token') || c.req.header('x-live-chat-token') || '')
    const conversationId = c.req.param('conversationId')
    const conversation = await getConversationForCustomer(c.env.DB, conversationId, userId, token)
    if (!conversation) return c.json({ success: false, error: 'Unauthorized' }, 401)
    const messages = await c.env.DB.prepare(`
      SELECT *
      FROM live_chat_messages
      WHERE conversation_id = ? AND datetime(expires_at) > datetime('now')
      ORDER BY datetime(created_at) ASC
      LIMIT 200
    `).bind(conversationId).all()
    await c.env.DB.prepare('UPDATE live_chat_conversations SET customer_unread_count = 0 WHERE id = ?').bind(conversationId).run()
    return c.json({ success: true, data: { conversation, messages: messages.results || [] } })
  })

  app.post('/api/live-chat/:conversationId/messages', async (c) => {
    await deps.initDB(c.env.DB)
    const body = await parseBody(c)
    const userId = await getUserSessionUserId(c)
    const token = String(body.token || c.req.header('x-live-chat-token') || '')
    const conversationId = c.req.param('conversationId')
    const conversation = await getConversationForCustomer(c.env.DB, conversationId, userId, token)
    if (!conversation) return c.json({ success: false, error: 'Unauthorized' }, 401)
    const product = body.message_type === 'product' ? await resolveProductContext(c.env.DB, body.product_id) : null
    const text = normalizeMessageBody(body.body, 1600)
    if (!text && !product) return c.json({ success: false, error: 'MESSAGE_REQUIRED' }, 400)
    const message = await insertMessage(c.env.DB, {
      conversationId,
      senderType: 'customer',
      senderId: userId || conversation.guest_phone || '',
      senderName: conversation.customer_name || 'Khách hàng',
      body: product ? (text || 'Khách gửi sản phẩm') : text,
      messageType: product ? 'product' : 'text',
      product,
    })
    await notifyLiveChatRoom(c.env, conversationId, { conversation_id: conversationId, message })
    return c.json({ success: true, data: message })
  })

  app.get('/api/live-chat/:conversationId/ws', async (c) => {
    await deps.initDB(c.env.DB)
    const userId = await getUserSessionUserId(c)
    const token = String(c.req.query('token') || '')
    const conversationId = c.req.param('conversationId')
    const conversation = await getConversationForCustomer(c.env.DB, conversationId, userId, token)
    if (!conversation) return new Response('Unauthorized', { status: 401 })
    const room = getRoom(c.env, conversationId)
    return room.fetch(`https://live-chat-room.local/ws?role=customer&conversationId=${encodeURIComponent(conversationId)}`, c.req.raw)
  })

  app.get('/api/admin/live-chat/conversations', async (c) => {
    await deps.initDB(c.env.DB)
    const rows = await c.env.DB.prepare(`
      SELECT lcc.*, COALESCE(u.avatar, '') AS customer_avatar
      FROM live_chat_conversations lcc
      LEFT JOIN users u ON u.id = lcc.user_id
      WHERE lcc.status != 'deleted' AND datetime(lcc.expires_at) > datetime('now')
      ORDER BY datetime(lcc.updated_at) DESC
      LIMIT 80
    `).all()
    return c.json({ success: true, data: rows.results || [] })
  })

  app.get('/api/admin/live-chat/:conversationId/messages', async (c) => {
    await deps.initDB(c.env.DB)
    const conversationId = c.req.param('conversationId')
    const conversation = await c.env.DB.prepare(`
      SELECT lcc.*, COALESCE(u.avatar, '') AS customer_avatar
      FROM live_chat_conversations lcc
      LEFT JOIN users u ON u.id = lcc.user_id
      WHERE lcc.id = ? AND lcc.status != 'deleted' AND datetime(lcc.expires_at) > datetime('now')
      LIMIT 1
    `).bind(conversationId).first<any>()
    if (!conversation) return c.json({ success: false, error: 'NOT_FOUND' }, 404)
    const messages = await c.env.DB.prepare(`
      SELECT *
      FROM live_chat_messages
      WHERE conversation_id = ? AND datetime(expires_at) > datetime('now')
      ORDER BY datetime(created_at) ASC
      LIMIT 300
    `).bind(conversationId).all()
    await c.env.DB.prepare('UPDATE live_chat_conversations SET admin_unread_count = 0 WHERE id = ?').bind(conversationId).run()
    return c.json({ success: true, data: { conversation, messages: messages.results || [] } })
  })

  app.post('/api/admin/live-chat/:conversationId/messages', async (c) => {
    await deps.initDB(c.env.DB)
    const body = await parseBody(c)
    const conversationId = c.req.param('conversationId')
    const conversation = await c.env.DB.prepare(`
      SELECT * FROM live_chat_conversations
      WHERE id = ? AND status != 'deleted' AND datetime(expires_at) > datetime('now')
      LIMIT 1
    `).bind(conversationId).first<any>()
    if (!conversation) return c.json({ success: false, error: 'NOT_FOUND' }, 404)
    const adminKey = normalizeAdminUserKey(getCookie(c, 'admin_user_key') || 'admin')
    const text = normalizeMessageBody(body.body, 1600)
    if (!text) return c.json({ success: false, error: 'MESSAGE_REQUIRED' }, 400)
    const message = await insertMessage(c.env.DB, {
      conversationId,
      senderType: 'admin',
      senderId: adminKey,
      senderName: adminKey === 'admin' ? 'Admin' : adminKey,
      body: text,
      messageType: 'text',
    })
    await notifyLiveChatRoom(c.env, conversationId, { conversation_id: conversationId, message })
    return c.json({ success: true, data: message })
  })

  app.get('/api/admin/live-chat/:conversationId/ws', async (c) => {
    const conversationId = c.req.param('conversationId')
    const room = getRoom(c.env, conversationId)
    return room.fetch(`https://live-chat-room.local/ws?role=admin&conversationId=${encodeURIComponent(conversationId)}`, c.req.raw)
  })

  app.post('/api/admin/live-chat/cleanup', async (c) => {
    await deps.initDB(c.env.DB)
    const result = await cleanupExpiredLiveChat(c.env.DB)
    return c.json({ success: true, data: result })
  })
}
