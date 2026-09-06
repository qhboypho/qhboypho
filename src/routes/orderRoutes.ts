import { getCookie } from 'hono/cookie'
import type { Hono } from 'hono'
import type { AppBindings } from '../types/app'
import { validateAdminSessionToken } from '../lib/adminHelpers'
import { refreshCustomerAutoBlock } from '../lib/customerBlockHelpers'
import { getUserSessionUserId } from '../lib/userSessionHelpers'
import { resolveAutoVoucherProductPrice } from '../lib/autoVoucherHelpers.ts'
import { notifyAdminNewOrderPush } from '../lib/webPushHelpers'
import { findProductSkuMatch, loadProductSkusByProductIds, type ProductSkuLike } from '../lib/productSkuHelpers.ts'

type OrderRouteDeps = {
  initDB: (db: D1Database) => Promise<void>
  buildInternalTestOrderWhereSql: (alias?: string) => string
  resolveSelectedColorImage: (productColors: any, selectedColor: any, fallbackImage?: string) => string
  ghtkCancelShipment: (env: any, db: D1Database, trackingOrder: string) => Promise<any>
  ghtkCreateShipment: (env: any, db: D1Database, order: any) => Promise<any>
  ghtkFetchLabelPdf: (env: any, db: D1Database, trackingCode: string, original?: any, pageSize?: any) => Promise<Uint8Array>
  spxCreateShipment: (env: any, db: D1Database, order: any) => Promise<any>
  spxFetchLabelPdf: (env: any, db: D1Database, trackingCode: string) => Promise<Uint8Array>
  ghnCreateShipment: (env: any, db: D1Database, order: any) => Promise<any>
  ghnFetchLabelPdf: (env: any, db: D1Database, trackingCode: string) => Promise<Uint8Array>
  ghnFetchLabelDocument: (env: any, db: D1Database, trackingCode: string) => Promise<{ bytes: Uint8Array; contentType: string }>
  getAvailableShippingCarriers: (db: D1Database) => Promise<Array<{ code: string; label: string }>>
  mergePdfBytes: (files: Uint8Array[]) => Promise<Uint8Array>
}

type OrderHistoryUser = {
  id: number | string
  email?: string | null
}

const NORMALIZED_CUSTOMER_PHONE_SQL = "REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(TRIM(COALESCE(customer_phone, '')), ' ', ''), '-', ''), '.', ''), '(', ''), ')', ''), '+', '')"
const SUPPORTED_BUILT_IN_SHIPPING_CARRIERS = new Set(['GHTK', 'SPX', 'GHN'])

function normalizeShippingCarrier(value: unknown) {
  const carrier = String(value || '').trim().toUpperCase().replace(/[^A-Z0-9_]+/g, '_').replace(/^_+|_+$/g, '').slice(0, 24)
  return carrier || 'GHTK'
}

function normalizeOrderNumber(value: unknown) {
  const num = typeof value === 'number' ? value : Number(String(value ?? '').trim())
  return Number.isFinite(num) ? num : 0
}

async function resolveOrderProductSku(
  db: D1Database,
  productId: unknown,
  productSkuId: unknown,
  color: unknown,
  size: unknown
): Promise<ProductSkuLike | null> {
  const skuMap = await loadProductSkusByProductIds(db, [productId])
  const skus = skuMap.get(Math.floor(normalizeOrderNumber(productId))) || []
  const requestedId = Math.floor(normalizeOrderNumber(productSkuId))
  if (requestedId > 0) {
    const byId = skus.find((sku) => Math.floor(normalizeOrderNumber(sku.id)) === requestedId)
    if (byId) return byId
  }
  return findProductSkuMatch(skus, color, size)
}

async function getAvailableCarrierCodeSet(db: D1Database, deps: OrderRouteDeps) {
  const carriers = await deps.getAvailableShippingCarriers(db)
  const codes = new Set((carriers || []).map((carrier) => normalizeShippingCarrier(carrier.code)))
  return codes
}

function buildRequestedCarrierMap(raw: unknown) {
  const result = new Map<number, string>()
  if (!raw || typeof raw !== 'object') return result
  for (const [key, value] of Object.entries(raw as Record<string, unknown>)) {
    const id = Number(key)
    if (Number.isFinite(id) && id > 0) result.set(id, normalizeShippingCarrier(value))
  }
  return result
}

function generateNumericOrderSuffix6() {
  const array = new Uint32Array(1)
  crypto.getRandomValues(array)
  const num = array[0] % 1000000
  return num.toString().padStart(6, '0')
}

function isBlockedValue(value: unknown) {
  return Number(value || 0) === 1
}

function normalizeOrderPhone(value: unknown) {
  return String(value || '').trim().replace(/\s+/g, '').replace(/[^\d]/g, '')
}

function normalizeOrderEmail(value: unknown) {
  return String(value || '').trim().toLowerCase()
}

function normalizeOrderUserId(value: unknown) {
  const parsed = Number.parseInt(String(value || ''), 10)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null
}

function normalizeRiskAddress(value: unknown) {
  return String(value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ')
}

function normalizeDeviceId(value: unknown) {
  return String(value || '').trim().replace(/[^a-zA-Z0-9._:-]/g, '').slice(0, 120)
}

function normalizeAddressCode(value: unknown) {
  return String(value || '').trim().replace(/[^0-9A-Za-z._-]/g, '').slice(0, 32)
}

function normalizeAddressEffectiveDate(value: unknown) {
  const raw = String(value || '').trim()
  if (raw === 'latest') return raw
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw
  return 'latest'
}

function toHex(bytes: Uint8Array): string {
  return Array.from(bytes).map((byte) => byte.toString(16).padStart(2, '0')).join('')
}

async function sha256Hex(value: string) {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value))
  return toHex(new Uint8Array(digest))
}

function getClientIp(c: any) {
  const cfIp = String(c.req.header('cf-connecting-ip') || '').trim()
  if (cfIp) return cfIp
  const realIp = String(c.req.header('x-real-ip') || '').trim()
  if (realIp) return realIp
  const forwarded = String(c.req.header('x-forwarded-for') || '').split(',')[0]?.trim()
  return forwarded || ''
}

async function buildOrderRiskIdentity(c: any, address: unknown) {
  const ip = getClientIp(c)
  const normalizedAddress = normalizeRiskAddress(address)
  return {
    ipHash: ip ? await sha256Hex(`order-ip:${ip}`) : '',
    addressFingerprint: normalizedAddress ? await sha256Hex(`order-address:${normalizedAddress}`) : ''
  }
}

function getBangkokDayWindow(now = new Date()) {
  const bangkokOffsetMs = 7 * 60 * 60 * 1000
  const bangkokNow = new Date(now.getTime() + bangkokOffsetMs)
  const dayStartUtcMs = Date.UTC(
    bangkokNow.getUTCFullYear(),
    bangkokNow.getUTCMonth(),
    bangkokNow.getUTCDate(),
    0,
    0,
    0
  ) - bangkokOffsetMs
  return {
    startIso: new Date(dayStartUtcMs).toISOString(),
    endIso: new Date(dayStartUtcMs + 24 * 60 * 60 * 1000).toISOString()
  }
}

function getBangkokDateKey(now = new Date()) {
  const bangkokOffsetMs = 7 * 60 * 60 * 1000
  const bangkokNow = new Date(now.getTime() + bangkokOffsetMs)
  const year = bangkokNow.getUTCFullYear()
  const month = String(bangkokNow.getUTCMonth() + 1).padStart(2, '0')
  const day = String(bangkokNow.getUTCDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

async function hasActiveDailyOrderLimitOverride(
  db: D1Database,
  input: {
    phone: string
  }
) {
  const phone = normalizeOrderPhone(input.phone)
  if (!phone) return false

  try {
    const row = await db.prepare(`
      SELECT id
      FROM daily_order_limit_overrides
      WHERE override_date = ?
        AND REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(TRIM(COALESCE(customer_phone, '')), ' ', ''), '-', ''), '.', ''), '(', ''), ')', ''), '+', '') = ?
        AND datetime(expires_at) > datetime('now')
        AND is_active = 1
        AND revoked_at IS NULL
      LIMIT 1
    `).bind(getBangkokDateKey(), phone).first<{ id?: number }>()

    return !!row
  } catch (e: any) {
    if (String(e?.message || '').includes('no such table: daily_order_limit_overrides')) return false
    throw e
  }
}

async function countOrdersForRiskKey(db: D1Database, whereSql: string, params: any[], startIso: string, endIso: string) {
  const row = await db.prepare(`
    SELECT COUNT(*) AS total
    FROM orders
    WHERE ${whereSql}
      AND datetime(created_at) >= datetime(?)
      AND datetime(created_at) < datetime(?)
  `).bind(...params, startIso, endIso).first<{ total?: number }>()
  return Number(row?.total || 0)
}

async function enforceDailyOrderRiskLimit(
  db: D1Database,
  input: {
    userId: number | null
    phone: string
    ipHash: string
    addressFingerprint: string
    deviceHash: string
  }
) {
  const limit = 2
  const { startIso, endIso } = getBangkokDayWindow()
  const checks: Array<{ label: string; whereSql: string; params: any[]; reason: string }> = []

  if (input.userId) {
    checks.push({
      label: 'user',
      whereSql: 'user_id = ?',
      params: [input.userId],
      reason: 'Tài khoản này đã đặt tối đa 2 đơn trong hôm nay. Vui lòng quay lại vào ngày mai hoặc liên hệ shop để được hỗ trợ.'
    })
  }
  if (input.phone) {
    checks.push({
      label: 'phone',
      whereSql: 'customer_phone = ?',
      params: [input.phone],
      reason: 'Số điện thoại này đã đặt tối đa 2 đơn trong hôm nay. Vui lòng quay lại vào ngày mai hoặc liên hệ shop để được hỗ trợ.'
    })
  }
  if (input.addressFingerprint) {
    checks.push({
      label: 'address',
      whereSql: 'customer_address_fingerprint = ?',
      params: [input.addressFingerprint],
      reason: 'Địa chỉ nhận hàng này đã đặt tối đa 2 đơn trong hôm nay. Vui lòng liên hệ shop nếu cần đặt thêm.'
    })
  }
  if (input.ipHash) {
    checks.push({
      label: 'ip',
      whereSql: 'client_ip_hash = ?',
      params: [input.ipHash],
      reason: 'Thiết bị hoặc mạng này đã đặt tối đa 2 đơn trong hôm nay. Vui lòng quay lại vào ngày mai hoặc liên hệ shop để được hỗ trợ.'
    })
  }
  if (input.deviceHash) {
    checks.push({
      label: 'device',
      whereSql: 'device_hash = ?',
      params: [input.deviceHash],
      reason: 'Thiết bị này đã đặt tối đa 2 đơn trong hôm nay. Vui lòng quay lại vào ngày mai hoặc liên hệ shop để được hỗ trợ.'
    })
  }

  for (const check of checks) {
    const count = await countOrdersForRiskKey(db, check.whereSql, check.params, startIso, endIso)
    if (count >= limit) {
      return {
        allowed: false,
        error: 'ORDER_DAILY_LIMIT_REACHED',
        reason: check.reason,
        matched: check.label,
        limit,
        count
      }
    }
  }

  return { allowed: true, error: '', reason: '', matched: '', limit, count: 0 }
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

async function getOrderHistoryUser(db: D1Database, userId: unknown) {
  const normalizedUserId = normalizeOrderUserId(userId)
  if (!normalizedUserId) return null

  return db.prepare('SELECT id, email FROM users WHERE id = ? LIMIT 1')
    .bind(normalizedUserId)
    .first<OrderHistoryUser>()
}

async function linkGuestOrdersToUser(db: D1Database, user: OrderHistoryUser | null) {
  const userId = normalizeOrderUserId(user?.id)
  if (!userId) return

  const email = normalizeOrderEmail(user?.email)
  if (!email) return

  await db.prepare(`
    UPDATE orders
    SET user_id = ?
    WHERE user_id IS NULL
      AND LOWER(TRIM(COALESCE(customer_email, ''))) = ?
  `).bind(userId, email).run()
}

export function registerOrderRoutes(app: Hono<{ Bindings: AppBindings }>, deps: OrderRouteDeps) {
  const createShipmentForCarrier = async (carrier: string, env: any, db: D1Database, order: any) => {
    switch (normalizeShippingCarrier(carrier)) {
      case 'SPX':
        return deps.spxCreateShipment(env, db, order)
      case 'GHN':
        return deps.ghnCreateShipment(env, db, order)
      case 'GHTK':
      default:
        if (SUPPORTED_BUILT_IN_SHIPPING_CARRIERS.has(normalizeShippingCarrier(carrier))) {
          return deps.ghtkCreateShipment(env, db, order)
        }
        return { ok: false, message: 'SHIPPING_CARRIER_NOT_IMPLEMENTED' }
    }
  }

  const fetchLabelPdfForCarrier = async (carrier: string, env: any, db: D1Database, trackingCode: string, original?: any, pageSize?: any) => {
    switch (normalizeShippingCarrier(carrier)) {
      case 'SPX':
        return deps.spxFetchLabelPdf(env, db, trackingCode)
      case 'GHN':
        return deps.ghnFetchLabelPdf(env, db, trackingCode)
      case 'GHTK':
      default:
        if (SUPPORTED_BUILT_IN_SHIPPING_CARRIERS.has(normalizeShippingCarrier(carrier))) {
          return deps.ghtkFetchLabelPdf(env, db, trackingCode, original, pageSize)
        }
        throw new Error('SHIPPING_CARRIER_NOT_IMPLEMENTED:' + normalizeShippingCarrier(carrier))
    }
  }

  const fetchLabelDocumentForCarrier = async (carrier: string, env: any, db: D1Database, trackingCode: string, original?: any, pageSize?: any) => {
    switch (normalizeShippingCarrier(carrier)) {
      case 'GHN':
        return deps.ghnFetchLabelDocument(env, db, trackingCode)
      case 'SPX':
      case 'GHTK':
      default:
        return {
          bytes: await fetchLabelPdfForCarrier(carrier, env, db, trackingCode, original, pageSize),
          contentType: 'application/pdf'
        }
    }
  }

  app.get('/api/user/orders', async (c) => {
    await deps.initDB(c.env.DB)
    const userId = await getUserSessionUserId(c)
    const adminToken = getCookie(c, 'admin_token')
    if (!userId) {
      const adminUserKey = getCookie(c, 'admin_user_key') || 'admin'
      const isAdmin = await validateAdminSessionToken(c.env.DB, adminUserKey, adminToken || '')
      if (isAdmin) {
        return c.json({ success: true, data: [] })
      }
      return c.json({ success: false, error: 'Unauthorized' }, 401)
    }
    const user = await getOrderHistoryUser(c.env.DB, userId)
    if (!user) {
      return c.json({ success: false, error: 'Unauthorized' }, 401)
    }

    await linkGuestOrdersToUser(c.env.DB, user)

    const orders = await c.env.DB.prepare(`
      SELECT o.*,
             p.thumbnail AS product_thumbnail,
             EXISTS(SELECT 1 FROM reviews r WHERE r.order_id = o.id) AS has_review,
             CASE WHEN LOWER(COALESCE(o.payment_status, ''))='paid' THEN 0 ELSE o.total_price END AS amount_due
      FROM orders o
      LEFT JOIN products p ON p.id = o.product_id
      WHERE o.user_id=?
      ORDER BY o.created_at DESC
    `).bind(normalizeOrderUserId(user.id)).all()
    return c.json({ success: true, data: orders.results || [] })
  })

  app.post('/api/orders', async (c) => {
    try {
      await deps.initDB(c.env.DB)
      const body = await c.req.json()
      const {
        customer_name, customer_phone, customer_address,
        product_id, product_sku_id, color, selected_color_image, size, quantity, note, voucher_code, payment_method, device_id,
        customer_province_code, customer_commune_code, address_effective_date
      } = body

      const normalizedCustomerPhone = normalizeOrderPhone(customer_phone)
      const normalizedDeviceId = normalizeDeviceId(device_id)

      if (!customer_name || !normalizedCustomerPhone || !customer_address || !product_id) {
        return c.json({ success: false, error: 'Missing required fields' }, 400)
      }

      const sessionUserId = await getUserSessionUserId(c)
      const user = sessionUserId ? await getOrderHistoryUser(c.env.DB, sessionUserId) : null
      const userId = normalizeOrderUserId(user?.id)

      await refreshCustomerAutoBlock(c.env.DB, userId, normalizedCustomerPhone)

      // Check if customer is blocked
      let isBlocked = false
      let blockReason = ''
      
      if (userId) {
        const user = await c.env.DB.prepare(
          'SELECT is_blocked, blocked_reason FROM users WHERE id = ?'
        ).bind(userId).first() as any
        
        if (user && isBlockedValue(user.is_blocked)) {
          isBlocked = true
          blockReason = user.blocked_reason || 'Bạn đã bị cấm mua hàng tạm thời'
        }
      }
      
      if (!isBlocked) {
        let query = 'SELECT blocked_reason FROM blocked_customers WHERE is_active = 1 AND ('
        const params: any[] = []
        
        if (userId) {
          query += 'user_id = ?'
          params.push(userId)
        }
        
        if (normalizedCustomerPhone) {
          if (userId) query += ' OR '
          query += `${NORMALIZED_CUSTOMER_PHONE_SQL} = ?`
          params.push(normalizedCustomerPhone)
        }
        
        query += ')'
        
        const block = await c.env.DB.prepare(query).bind(...params).first() as any
        
        if (block) {
          isBlocked = true
          blockReason = block.blocked_reason || 'Bạn đã bị cấm mua hàng tạm thời'
        }
      }
      
      if (isBlocked) {
        return c.json({ 
          success: false, 
          error: 'CUSTOMER_BLOCKED',
          reason: blockReason
        }, 403)
      }

      const riskIdentity = await buildOrderRiskIdentity(c, customer_address)
      const deviceHash = normalizedDeviceId ? await sha256Hex(`order-device:${normalizedDeviceId}`) : ''
      const hasDailyOverride = await hasActiveDailyOrderLimitOverride(c.env.DB, {
        phone: normalizedCustomerPhone
      })
      if (!hasDailyOverride) {
        const riskLimit = await enforceDailyOrderRiskLimit(c.env.DB, {
          userId,
          phone: normalizedCustomerPhone,
          ipHash: riskIdentity.ipHash,
          addressFingerprint: riskIdentity.addressFingerprint,
          deviceHash
        })
        if (!riskLimit.allowed) {
          return c.json({
            success: false,
            error: riskLimit.error,
            reason: riskLimit.reason,
            matched: riskLimit.matched,
            limit: riskLimit.limit
          }, 429)
        }
      }

      const product = await c.env.DB.prepare(`SELECT * FROM products WHERE id=? AND is_active=1`).bind(product_id).first() as any
      if (!product) return c.json({ success: false, error: 'Product not found' }, 404)
      const selectedSku = await resolveOrderProductSku(c.env.DB, product_id, product_sku_id, color, size)

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

      const productUnitPrice = await resolveAutoVoucherProductPrice(c.env.DB, product, selectedSku || undefined)
      const subtotal = productUnitPrice * qty
      const total = Math.max(0, subtotal - discount)
      const orderCode = await generateUniqueOrderCode(c.env.DB)
      const normalizedPaymentMethod = String(payment_method || '').toUpperCase()
      const paymentMethod = ['COD', 'ZALOPAY', 'MOMO', 'BANK_TRANSFER'].includes(normalizedPaymentMethod)
        ? normalizedPaymentMethod
        : 'COD'
      const selectedColorImage = String(selected_color_image || '').trim()
        || String(selectedSku?.image || '').trim()
        || deps.resolveSelectedColorImage(product.colors, color, product.thumbnail || '')
      const customerProvinceCode = normalizeAddressCode(customer_province_code)
      const customerCommuneCode = normalizeAddressCode(customer_commune_code)
      const customerAddressEffectiveDate = normalizeAddressEffectiveDate(address_effective_date)

      const result = await c.env.DB.prepare(`
        INSERT INTO orders 
          (user_id, order_code, customer_name, customer_phone, customer_email, customer_address, customer_province_code, customer_commune_code, customer_address_effective_date, client_ip_hash, customer_address_fingerprint, device_hash, product_id, product_sku_id, product_name, product_price, color, selected_color_image, size, quantity, total_price, voucher_code, discount_amount, note, payment_method)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        userId,
        orderCode,
        customer_name,
        normalizedCustomerPhone,
        normalizeOrderEmail(user?.email) || null,
        customer_address,
        customerProvinceCode || null,
        customerCommuneCode || null,
        customerAddressEffectiveDate,
        riskIdentity.ipHash || null,
        riskIdentity.addressFingerprint || null,
        deviceHash || null,
        product_id,
        selectedSku?.id || null,
        product.name,
        productUnitPrice,
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

      const createdOrderForPush = {
        id: result.meta.last_row_id,
        order_code: orderCode,
        customer_name,
        customer_phone: normalizedCustomerPhone,
        total_price: total
      }
      const pushTask = notifyAdminNewOrderPush(c.env, c.env.DB, createdOrderForPush)
        .catch((error) => console.error('[web-push] failed to notify new order', error))
      const executionCtx = (c as any).executionCtx
      if (executionCtx && typeof executionCtx.waitUntil === 'function') {
        executionCtx.waitUntil(pushTask)
      } else {
        void pushTask
      }

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
               UPPER(COALESCE(o.payment_method, '')) IN ('BANK_TRANSFER', 'ZALOPAY', 'MOMO')
               AND LOWER(COALESCE(o.payment_status, '')) = 'paid'
             )
           )`
        : ''
      let query = `
        SELECT o.*,
               p.thumbnail AS product_thumbnail,
               u.name AS user_name,
               CASE WHEN LOWER(COALESCE(o.payment_status, ''))='paid' THEN 0 ELSE o.total_price END AS amount_due
        FROM orders o
        LEFT JOIN products p ON p.id = o.product_id
        LEFT JOIN users u ON u.id = o.user_id
        WHERE ${internalFilterSql}
        ${shippingQueueSql}
        ORDER BY o.created_at DESC
      `
      if (status && status !== 'all') {
        query = `
          SELECT o.*,
                 p.thumbnail AS product_thumbnail,
                 u.name AS user_name,
                 CASE WHEN LOWER(COALESCE(o.payment_status, ''))='paid' THEN 0 ELSE o.total_price END AS amount_due
          FROM orders o
          LEFT JOIN products p ON p.id = o.product_id
          LEFT JOIN users u ON u.id = o.user_id
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

  app.get('/api/admin/orders/latest', async (c) => {
    try {
      await deps.initDB(c.env.DB)
      const internalFilterSql = `NOT ${deps.buildInternalTestOrderWhereSql('o')}`
      const latestOrder = await c.env.DB.prepare(`
        SELECT
          o.id,
          o.order_code,
          o.customer_name,
          o.customer_phone,
          o.total_price,
          o.status,
          o.created_at
        FROM orders o
        WHERE ${internalFilterSql}
        ORDER BY datetime(o.created_at) DESC, o.id DESC
        LIMIT 1
      `).first()

      return c.json({ success: true, data: { latestOrder: latestOrder || null } })
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
      const allowedStatuses = new Set(['pending', 'confirmed', 'shipping', 'done', 'cancelled'])
      if (!allowedStatuses.has(nextStatus)) {
        return c.json({ success: false, error: 'INVALID_STATUS' }, 400)
      }
      const existing = await c.env.DB.prepare(`
        SELECT id, status, shipping_carrier, shipping_tracking_code, shipping_arranged
        FROM orders
        WHERE id=?
        LIMIT 1
      `).bind(id).first() as any
      if (!existing) return c.json({ success: false, error: 'ORDER_NOT_FOUND' }, 404)

      const currentStatus = String(existing.status || '').trim().toLowerCase()
      const hasShippingEvidence = Number(existing.shipping_arranged || 0) === 1 || !!String(existing.shipping_tracking_code || '').trim()

      if (currentStatus === 'cancelled' || currentStatus === 'done') {
        return c.json({ success: false, error: 'ORDER_ALREADY_CLOSED' }, 400)
      }

      if (nextStatus === 'shipping' && !hasShippingEvidence) {
        return c.json({ success: false, error: 'SHIPPING_NOT_READY' }, 400)
      }

      if (nextStatus === 'done') {
        if (currentStatus !== 'shipping' || !hasShippingEvidence) {
          return c.json({ success: false, error: 'ORDER_NOT_DELIVERED' }, 400)
        }
      }

      if (nextStatus === 'cancelled') {
        if (currentStatus === 'shipping') {
          return c.json({ success: false, error: 'ORDER_ALREADY_IN_SHIPPING' }, 400)
        }

        const carrier = String(existing.shipping_carrier || '').trim().toUpperCase()
        const trackingCode = String(existing.shipping_tracking_code || '').trim()
        if (carrier === 'GHTK' && trackingCode) {
          const cancelRes = await deps.ghtkCancelShipment(c.env, c.env.DB, trackingCode)
          if (!cancelRes.ok) {
            return c.json({ success: false, error: cancelRes.message || 'GHTK_CANCEL_FAILED', detail: cancelRes.detail || null }, 400)
          }
        }
        
        // Set cancelled_by = 'shop' when admin cancels the order
        // Also set return_status = 'cancelled' for returns management
        await c.env.DB.prepare(`
          UPDATE orders 
          SET status = ?, 
              return_status = 'cancelled',
              cancelled_by = 'shop',
              updated_at = CURRENT_TIMESTAMP 
          WHERE id = ?
        `).bind(nextStatus, id).run()
        
        // Check for auto-block after cancellation
        const order = await c.env.DB.prepare('SELECT user_id, customer_phone FROM orders WHERE id = ?').bind(id).first() as any
        if (order) {
          await refreshCustomerAutoBlock(c.env.DB, order.user_id, order.customer_phone)
        }
        
        return c.json({ success: true, status: nextStatus, cancelled_by: 'shop' })
      }

      if (nextStatus === 'done') {
        await c.env.DB.prepare(`
          UPDATE orders
          SET status=?,
              delivered_at=COALESCE(delivered_at, CURRENT_TIMESTAMP),
              updated_at=CURRENT_TIMESTAMP
          WHERE id=?
        `).bind(nextStatus, id).run()
      } else {
        await c.env.DB.prepare(`
          UPDATE orders SET status=?, updated_at=CURRENT_TIMESTAMP WHERE id=?
        `).bind(nextStatus, id).run()
      }
      
      // Check for auto-block after any status change to cancelled
      if (nextStatus === 'cancelled') {
        const order = await c.env.DB.prepare('SELECT user_id, customer_phone FROM orders WHERE id = ?').bind(id).first() as any
        if (order) {
          await refreshCustomerAutoBlock(c.env.DB, order.user_id, order.customer_phone)
        }
      }
      
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

  app.patch('/api/admin/orders/:id/shipping-carrier', async (c) => {
    try {
      await deps.initDB(c.env.DB)
      const id = Number(c.req.param('id'))
      if (!Number.isFinite(id) || id <= 0) return c.json({ success: false, error: 'INVALID_ORDER_ID' }, 400)
      const body = await c.req.json().catch(() => ({} as any))
      const carrier = normalizeShippingCarrier(body?.carrier)
      const availableCarrierCodes = await getAvailableCarrierCodeSet(c.env.DB, deps)
      if (!availableCarrierCodes.has(carrier)) {
        return c.json({ success: false, error: 'SHIPPING_CARRIER_NOT_AVAILABLE' }, 400)
      }
      const existing = await c.env.DB.prepare(`
        SELECT id, shipping_tracking_code, shipping_carrier
        FROM orders
        WHERE id=?
        LIMIT 1
      `).bind(id).first() as any
      if (!existing) return c.json({ success: false, error: 'ORDER_NOT_FOUND' }, 404)
      const tracking = String(existing.shipping_tracking_code || '').trim()
      const currentCarrier = normalizeShippingCarrier(existing.shipping_carrier || 'GHTK')
      if (tracking && currentCarrier !== carrier) {
        return c.json({ success: false, error: 'ORDER_ALREADY_HAS_TRACKING' }, 400)
      }
      await c.env.DB.prepare(`
        UPDATE orders
        SET shipping_carrier=?, updated_at=CURRENT_TIMESTAMP
        WHERE id=?
      `).bind(carrier, id).run()
      return c.json({ success: true, carrier })
    } catch (e: any) {
      return c.json({ success: false, error: e.message }, 500)
    }
  })

  app.post('/api/admin/orders/arrange-shipping', async (c) => {
    try {
      await deps.initDB(c.env.DB)
      const body: any = await c.req.json().catch(() => ({}))
      const ids = Array.isArray(body.ids) ? body.ids.map((v: any) => Number(v)).filter((v: number) => Number.isFinite(v) && v > 0) : []
      const requestedCarriers = buildRequestedCarrierMap(body.carriers)
      if (!ids.length) return c.json({ success: false, error: 'NO_ORDER_IDS' }, 400)
      const availableCarrierCodes = await getAvailableCarrierCodeSet(c.env.DB, deps)

      const orderQuery = `
        SELECT id, order_code, customer_name, customer_phone, customer_address, product_name,
               customer_province_code, customer_commune_code, customer_address_effective_date,
               quantity, total_price, note, payment_status, status, shipping_carrier, shipping_tracking_code
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
        const targetCarrier = normalizeShippingCarrier(requestedCarriers.get(id) || order.shipping_carrier || 'GHTK')
        if (!availableCarrierCodes.has(targetCarrier)) {
          failed.push({ id, order_code: order.order_code, carrier: targetCarrier, error: 'SHIPPING_CARRIER_NOT_AVAILABLE' })
          continue
        }

        let trackingCode = String(order.shipping_tracking_code || '').trim()
        const existingCarrier = normalizeShippingCarrier(order.shipping_carrier || targetCarrier)
        if (trackingCode && existingCarrier !== targetCarrier) {
          failed.push({ id, order_code: order.order_code, error: 'ORDER_ALREADY_HAS_DIFFERENT_CARRIER_TRACKING' })
          continue
        }
        let labelCode = ''
        let fee = 0
        if (!trackingCode) {
          const createRes: any = await createShipmentForCarrier(targetCarrier, c.env, c.env.DB, order)
          if (!createRes.ok) {
            failed.push({ id, order_code: order.order_code, carrier: targetCarrier, error: createRes.message || `${targetCarrier}_CREATE_ORDER_FAILED`, detail: createRes.detail || null })
            continue
          }
          trackingCode = String(createRes.data?.label || createRes.data?.tracking_id || '').trim()
          labelCode = String(createRes.data?.label || '').trim()
          fee = Number(createRes.data?.fee || 0) || 0
          if (!trackingCode) {
            failed.push({ id, order_code: order.order_code, carrier: targetCarrier, error: `${targetCarrier}_TRACKING_EMPTY`, detail: createRes.data || null })
            continue
          }
          updated.push({
            id,
            order_code: order.order_code,
            tracking_code: trackingCode,
            carrier: targetCarrier,
            used_fallback_address: !!createRes.usedFallbackAddress
          })
        } else {
          updated.push({ id, order_code: order.order_code, tracking_code: trackingCode, carrier: targetCarrier, reused_tracking: true })
        }

        await c.env.DB.prepare(`
          UPDATE orders
          SET shipping_arranged=1,
              shipping_arranged_at=COALESCE(shipping_arranged_at, CURRENT_TIMESTAMP),
              shipping_carrier=?,
              shipping_tracking_code=COALESCE(NULLIF(?, ''), shipping_tracking_code),
              shipping_label=COALESCE(NULLIF(?, ''), shipping_label),
              shipping_fee=CASE WHEN ? > 0 THEN ? ELSE shipping_fee END,
              status=CASE WHEN status='pending' THEN 'confirmed' ELSE status END,
              updated_at=CURRENT_TIMESTAMP
          WHERE id=?
        `).bind(targetCarrier, trackingCode, labelCode, fee, fee, id).run()
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

  app.get('/api/admin/orders/shipping/print-labels', async (c) => {
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
        .filter((o: any) => String(o.shipping_tracking_code || '').trim())
      if (!selected.length) return c.json({ success: false, error: 'NO_SHIPPING_TRACKING_FOUND' }, 400)

      const docs: Array<{ bytes: Uint8Array; contentType: string }> = []
      for (const row of selected) {
        const carrier = normalizeShippingCarrier(row.shipping_carrier || 'GHTK')
        docs.push(await fetchLabelDocumentForCarrier(carrier, c.env, c.env.DB, String(row.shipping_tracking_code), c.req.query('original'), c.req.query('page_size')))
      }
      const htmlDocs = docs.filter((doc) => String(doc.contentType || '').toLowerCase().includes('text/html'))
      if (htmlDocs.length === docs.length) {
        const bytes = htmlDocs.length === 1
          ? htmlDocs[0].bytes
          : new TextEncoder().encode(htmlDocs.map((doc) => new TextDecoder().decode(doc.bytes)).join('\n<div style="break-after: page; page-break-after: always;"></div>\n'))
        return new Response(bytes, {
          status: 200,
          headers: {
            'Content-Type': 'text/html; charset=UTF-8',
            'Content-Disposition': `inline; filename="shipping-labels-${new Date().toISOString().slice(0, 10)}.html"`,
            'Cache-Control': 'no-store'
          }
        })
      }
      const nonPdf = docs.find((doc) => !String(doc.contentType || '').toLowerCase().includes('application/pdf'))
      if (nonPdf) return c.json({ success: false, error: 'MIXED_SHIPPING_LABEL_FORMATS' }, 400)
      const files = docs.map((doc) => doc.bytes)
      const merged = files.length === 1 ? files[0] : await deps.mergePdfBytes(files)
      const pdfBytes = new Uint8Array(merged)
      const pdfBlob = new Blob([pdfBytes], { type: 'application/pdf' })
      return new Response(pdfBlob, {
        status: 200,
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `inline; filename="shipping-labels-${new Date().toISOString().slice(0, 10)}.pdf"`,
          'Cache-Control': 'no-store'
        }
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
        files.push(await deps.ghtkFetchLabelPdf(c.env, c.env.DB, String(row.shipping_tracking_code), c.req.query('original'), c.req.query('page_size')))
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
