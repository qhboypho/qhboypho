import { getCookie } from 'hono/cookie'
import type { Hono } from 'hono'
import type { AppBindings } from '../types/app'
import { validateAdminSessionToken } from '../lib/adminHelpers'
import { refreshCustomerAutoBlock } from '../lib/customerBlockHelpers'
import { getUserSessionUserId } from '../lib/userSessionHelpers'
import { resolveAutoVoucherProductPrice } from '../lib/autoVoucherHelpers.ts'
import { notifyAdminNewOrderPush } from '../lib/webPushHelpers'
import { loadProductSkusByProductIds, type ProductSkuLike } from '../lib/productSkuHelpers.ts'
import {
  buildShippingIdempotencyKey,
  evaluateShippingPaymentEligibility,
  extractShippingTrackingCode,
  isTerminalReturnStatus,
  isUncertainShippingCreateResult,
  isValidOrderStatusTransition,
  normalizeShippingCreationState
} from '../lib/shippingStateHelpers'

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
const MAX_ORDER_QUANTITY = 99
const MAX_ORDER_NAME_LENGTH = 120
const MAX_ORDER_ADDRESS_LENGTH = 500
const MAX_ORDER_NOTE_LENGTH = 1000
const MAX_ORDER_VARIANT_LENGTH = 120
const MAX_ORDER_ACCESS_TOKEN_LENGTH = 256
const MAX_IDEMPOTENCY_KEY_LENGTH = 128

function normalizeShippingCarrier(value: unknown) {
  const carrier = String(value || '').trim().toUpperCase().replace(/[^A-Z0-9_]+/g, '_').replace(/^_+|_+$/g, '').slice(0, 24)
  return carrier || 'GHTK'
}

function normalizeOrderNumber(value: unknown) {
  const num = typeof value === 'number' ? value : Number(String(value ?? '').trim())
  return Number.isFinite(num) ? num : 0
}

function normalizePositiveInteger(value: unknown, max: number) {
  if (typeof value === 'boolean' || value === null || value === undefined) return null
  const raw = String(value).trim()
  if (!/^\d+$/.test(raw)) return null
  const parsed = Number(raw)
  if (!Number.isSafeInteger(parsed) || parsed <= 0 || parsed > max) return null
  return parsed
}

function normalizeRequiredOrderText(value: unknown, maxLength: number) {
  if (typeof value !== 'string' && typeof value !== 'number') return ''
  return String(value).trim().slice(0, maxLength)
}

function normalizeOptionalOrderText(value: unknown, maxLength: number) {
  if (value === null || value === undefined) return ''
  return String(value).trim().slice(0, maxLength)
}

function generateOrderAccessToken() {
  const bytes = new Uint8Array(32)
  crypto.getRandomValues(bytes)
  return toHex(bytes)
}

function normalizeOrderAccessToken(value: unknown) {
  const token = String(value ?? '').trim()
  if (!token) return ''
  if (token.length > MAX_ORDER_ACCESS_TOKEN_LENGTH || !/^[A-Za-z0-9_-]{32,256}$/.test(token)) return null
  return token
}

function normalizeIdempotencyKey(value: unknown) {
  const key = String(value ?? '').trim()
  if (!key) return ''
  if (key.length < 16 || key.length > MAX_IDEMPOTENCY_KEY_LENGTH || !/^[A-Za-z0-9._~:-]+$/.test(key)) return null
  return key
}

function normalizeSkuValue(value: unknown) {
  return String(value ?? '').trim().toLowerCase()
}

function isActiveSku(sku: ProductSkuLike) {
  return Number(sku.is_active ?? 1) === 1
}

function isExactSkuSelection(sku: ProductSkuLike, color: unknown, size: unknown) {
  return normalizeSkuValue(sku.color) === normalizeSkuValue(color)
    && normalizeSkuValue(sku.size) === normalizeSkuValue(size)
}

function buildOrderIdempotencyScope(userId: number | null, orderAccessTokenHash: string) {
  if (userId) return `user:${userId}`
  return `guest-token:${orderAccessTokenHash}`
}

function buildOrderIdempotencyPayload(input: {
  customerName: string
  customerPhone: string
  customerAddress: string
  customerProvinceCode: string
  customerCommuneCode: string
  customerAddressEffectiveDate: string
  productId: number
  productSkuId: number | null
  color: string
  size: string
  quantity: number
  voucherCode: string
  note: string
  paymentMethod: string
  deviceId: string
  orderAccessTokenHash: string
}) {
  return JSON.stringify(input)
}

function isUniqueConstraintError(error: unknown) {
  return /unique constraint|constraint failed/i.test(String((error as any)?.message || error || ''))
}

async function resolveOrderProductSku(
  db: D1Database,
  productId: unknown,
  productSkuId: unknown,
  color: unknown,
  size: unknown
): Promise<ProductSkuLike | null> {
  const normalizedProductId = Math.floor(normalizeOrderNumber(productId))
  const skuMap = await loadProductSkusByProductIds(db, [normalizedProductId], { includeInactive: true })
  const skus = skuMap.get(normalizedProductId) || []
  const requestedId = Math.floor(normalizeOrderNumber(productSkuId))
  if (requestedId > 0) {
    const byId = skus.find((sku) => Math.floor(normalizeOrderNumber(sku.id)) === requestedId)
    if (!byId || !isActiveSku(byId)) return null
    if ((String(color ?? '').trim() || String(size ?? '').trim()) && !isExactSkuSelection(byId, color, size)) return null
    return byId
  }
  return skus.find((sku) => isActiveSku(sku) && isExactSkuSelection(sku, color, size)) || null
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

type IdempotentOrderRow = {
  id?: number | string | null
  order_code?: string | null
  total_price?: number | string | null
  discount_amount?: number | string | null
  order_access_token_hash?: string | null
  idempotency_payload_hash?: string | null
}

async function findIdempotentOrder(db: D1Database, idempotencyKeyHash: string) {
  if (!idempotencyKeyHash) return null
  return db.prepare(`
    SELECT id, order_code, total_price, discount_amount,
           order_access_token_hash, idempotency_payload_hash
    FROM orders
    WHERE idempotency_key_hash = ?
    LIMIT 1
  `).bind(idempotencyKeyHash).first<IdempotentOrderRow>()
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
      const body = await c.req.json().catch(() => null)
      if (!body || typeof body !== 'object' || Array.isArray(body)) {
        return c.json({ success: false, error: 'INVALID_JSON' }, 400)
      }

      const {
        customer_name, customer_phone, customer_address,
        product_id, product_sku_id, color, selected_color_image, size, quantity, note, voucher_code, payment_method, device_id,
        customer_province_code, customer_commune_code, address_effective_date
      } = body as Record<string, unknown>

      const customerName = normalizeRequiredOrderText(customer_name, MAX_ORDER_NAME_LENGTH)
      const normalizedCustomerPhone = normalizeOrderPhone(customer_phone)
      const customerAddress = normalizeRequiredOrderText(customer_address, MAX_ORDER_ADDRESS_LENGTH)
      const productId = normalizePositiveInteger(product_id, Number.MAX_SAFE_INTEGER)
      const qty = normalizePositiveInteger(quantity, MAX_ORDER_QUANTITY)
      const normalizedColor = normalizeOptionalOrderText(color, MAX_ORDER_VARIANT_LENGTH)
      const normalizedSize = normalizeOptionalOrderText(size, MAX_ORDER_VARIANT_LENGTH)
      const normalizedNote = normalizeOptionalOrderText(note, MAX_ORDER_NOTE_LENGTH)
      const normalizedDeviceId = normalizeDeviceId(device_id)
      const productSkuId = product_sku_id === null || product_sku_id === undefined || String(product_sku_id).trim() === ''
        ? null
        : normalizePositiveInteger(product_sku_id, Number.MAX_SAFE_INTEGER)
      const customerProvinceCode = normalizeAddressCode(customer_province_code)
      const customerCommuneCode = normalizeAddressCode(customer_commune_code)
      const customerAddressEffectiveDate = normalizeAddressEffectiveDate(address_effective_date)
      const normalizedPaymentMethod = String(payment_method || '').trim().toUpperCase()
      const paymentMethod = ['COD', 'ZALOPAY', 'MOMO', 'BANK_TRANSFER'].includes(normalizedPaymentMethod)
        ? normalizedPaymentMethod
        : 'COD'
      const normalizedVoucherCode = normalizeOptionalOrderText(voucher_code, 64).toUpperCase()

      if (!customerName || !normalizedCustomerPhone || !customerAddress || !productId) {
        return c.json({ success: false, error: 'Missing required fields' }, 400)
      }
      if (normalizedCustomerPhone.length < 7 || normalizedCustomerPhone.length > 15) {
        return c.json({ success: false, error: 'INVALID_CUSTOMER_PHONE' }, 400)
      }
      if (!qty) return c.json({ success: false, error: 'INVALID_QUANTITY' }, 400)
      if (product_sku_id !== null && product_sku_id !== undefined && String(product_sku_id).trim() !== '' && !productSkuId) {
        return c.json({ success: false, error: 'INVALID_PRODUCT_VARIANT' }, 400)
      }

      const bodyAccessToken = normalizeOrderAccessToken((body as any).order_access_token)
      const headerAccessToken = normalizeOrderAccessToken(c.req.header('X-Order-Access-Token'))
      if (bodyAccessToken === null || headerAccessToken === null) {
        return c.json({ success: false, error: 'INVALID_ORDER_ACCESS_TOKEN' }, 400)
      }
      if (bodyAccessToken && headerAccessToken && bodyAccessToken !== headerAccessToken) {
        return c.json({ success: false, error: 'ORDER_ACCESS_TOKEN_MISMATCH' }, 400)
      }
      const orderAccessToken = bodyAccessToken || headerAccessToken || generateOrderAccessToken()
      const orderAccessTokenHash = await sha256Hex(`order-access:${orderAccessToken}`)

      const headerIdempotencyKey = c.req.header('X-Idempotency-Key') || ''
      const bodyIdempotencyKey = (body as any).idempotency_key
      const normalizedHeaderIdempotencyKey = normalizeIdempotencyKey(headerIdempotencyKey)
      const normalizedBodyIdempotencyKey = normalizeIdempotencyKey(bodyIdempotencyKey)
      if (normalizedHeaderIdempotencyKey === null || normalizedBodyIdempotencyKey === null) {
        return c.json({ success: false, error: 'INVALID_IDEMPOTENCY_KEY' }, 400)
      }
      if (normalizedHeaderIdempotencyKey && normalizedBodyIdempotencyKey
        && normalizedHeaderIdempotencyKey !== normalizedBodyIdempotencyKey) {
        return c.json({ success: false, error: 'IDEMPOTENCY_KEY_MISMATCH' }, 400)
      }
      const idempotencyKey = normalizedHeaderIdempotencyKey || normalizedBodyIdempotencyKey
      if (idempotencyKey && !bodyAccessToken && !headerAccessToken) {
        return c.json({ success: false, error: 'ORDER_ACCESS_TOKEN_REQUIRED' }, 400)
      }

      const sessionUserId = await getUserSessionUserId(c)
      const user = sessionUserId ? await getOrderHistoryUser(c.env.DB, sessionUserId) : null
      const userId = normalizeOrderUserId(user?.id)
      const riskIdentity = await buildOrderRiskIdentity(c, customerAddress)
      const deviceHash = normalizedDeviceId ? await sha256Hex(`order-device:${normalizedDeviceId}`) : ''
      const idempotencyKeyHash = idempotencyKey
        ? await sha256Hex(`order-idempotency:${buildOrderIdempotencyScope(userId, orderAccessTokenHash)}:${idempotencyKey}`)
        : ''
      const idempotencyPayloadHash = idempotencyKey
        ? await sha256Hex(buildOrderIdempotencyPayload({
            customerName,
            customerPhone: normalizedCustomerPhone,
            customerAddress,
            customerProvinceCode,
            customerCommuneCode,
            customerAddressEffectiveDate,
            productId,
            productSkuId,
            color: normalizeSkuValue(normalizedColor),
            size: normalizeSkuValue(normalizedSize),
            quantity: qty,
            voucherCode: normalizedVoucherCode,
            note: normalizedNote,
            paymentMethod,
            deviceId: normalizedDeviceId,
            orderAccessTokenHash
          }))
        : ''

      if (idempotencyKeyHash) {
        const existing = await findIdempotentOrder(c.env.DB, idempotencyKeyHash)
        if (existing) {
          if (existing.idempotency_payload_hash !== idempotencyPayloadHash
            || existing.order_access_token_hash !== orderAccessTokenHash) {
            return c.json({ success: false, error: 'IDEMPOTENCY_KEY_REUSE' }, 409)
          }
          return c.json({
            success: true,
            duplicate: true,
            order_code: existing.order_code,
            id: Number(existing.id || 0),
            discount: Number(existing.discount_amount || 0),
            total: Number(existing.total_price || 0),
            order_access_token: orderAccessToken
          })
        }
      }

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

      const product = await c.env.DB.prepare(`SELECT * FROM products WHERE id=? AND is_active=1`).bind(productId).first() as any
      if (!product) return c.json({ success: false, error: 'Product not found' }, 404)
      const selectedSku = await resolveOrderProductSku(c.env.DB, productId, productSkuId, normalizedColor, normalizedSize)
      const skuRows = await c.env.DB.prepare(`SELECT id FROM product_skus WHERE product_id = ? LIMIT 1`).bind(productId).all()
      const hasSkuRows = (skuRows.results || []).length > 0
      const hasVariantIntent = productSkuId !== null || !!normalizedColor || !!normalizedSize
      if ((hasSkuRows || hasVariantIntent) && !selectedSku) {
        return c.json({ success: false, error: 'INVALID_PRODUCT_VARIANT' }, 400)
      }

      const productUnitPrice = await resolveAutoVoucherProductPrice(c.env.DB, product, selectedSku || undefined)
      if (!Number.isFinite(productUnitPrice) || productUnitPrice <= 0) {
        return c.json({ success: false, error: 'PRODUCT_PRICE_UNAVAILABLE' }, 409)
      }
      const subtotal = productUnitPrice * qty
      let discount = 0

      if (normalizedVoucherCode) {
        const now = new Date().toISOString()
        const voucher = await c.env.DB.prepare(
          `SELECT * FROM vouchers WHERE code=? AND is_active=1 AND valid_from<=? AND valid_to>=?`
        ).bind(normalizedVoucherCode, now, now).first() as any

        if (!voucher) {
          return c.json({ success: false, error: 'INVALID_VOUCHER' }, 400)
        }
        if (Number(voucher.usage_limit || 0) > 0 && Number(voucher.used_count || 0) >= Number(voucher.usage_limit || 0)) {
          return c.json({ success: false, error: 'VOUCHER_LIMIT' }, 400)
        }
        discount = Math.min(subtotal, Math.max(0, Number(voucher.discount_amount || 0)))
      }

      const total = Math.max(0, subtotal - discount)
      const resolvedColor = String(selectedSku?.color ?? normalizedColor).trim()
      const resolvedSize = String(selectedSku?.size ?? normalizedSize).trim()
      const selectedColorImage = String(selectedSku?.image || '').trim()
        || deps.resolveSelectedColorImage(product.colors, resolvedColor, product.thumbnail || '')
      const inventoryReserved = 1

      let result: any = null
      let orderCode = ''
      let lastInsertError: unknown = null
      for (let attempt = 0; attempt < 5; attempt++) {
        orderCode = await generateUniqueOrderCode(c.env.DB)
        const insert = c.env.DB.prepare(`
          INSERT INTO orders
            (user_id, order_code, customer_name, customer_phone, customer_email, customer_address, customer_province_code, customer_commune_code, customer_address_effective_date, client_ip_hash, customer_address_fingerprint, device_hash, product_id, product_sku_id, product_name, product_price, color, selected_color_image, size, quantity, total_price, voucher_code, discount_amount, note, payment_method, inventory_reserved, inventory_released, order_access_token_hash, idempotency_key_hash, idempotency_payload_hash)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).bind(
          userId,
          orderCode,
          customerName,
          normalizedCustomerPhone,
          normalizeOrderEmail(user?.email) || null,
          customerAddress,
          customerProvinceCode || null,
          customerCommuneCode || null,
          customerAddressEffectiveDate,
          riskIdentity.ipHash || null,
          riskIdentity.addressFingerprint || null,
          deviceHash || null,
          productId,
          selectedSku?.id || null,
          product.name,
          productUnitPrice,
          resolvedColor,
          selectedColorImage || '',
          resolvedSize,
          qty,
          total,
          normalizedVoucherCode,
          discount,
          normalizedNote,
          paymentMethod,
          inventoryReserved,
          0,
          orderAccessTokenHash,
          idempotencyKeyHash || null,
          idempotencyPayloadHash || null
        )

        try {
          const batchResult = await c.env.DB.batch([insert])
          result = batchResult[0]
          lastInsertError = null
          break
        } catch (error) {
          lastInsertError = error
          if (idempotencyKeyHash) {
            const existing = await findIdempotentOrder(c.env.DB, idempotencyKeyHash)
            if (existing) {
              if (existing.idempotency_payload_hash !== idempotencyPayloadHash
                || existing.order_access_token_hash !== orderAccessTokenHash) {
                return c.json({ success: false, error: 'IDEMPOTENCY_KEY_REUSE' }, 409)
              }
              return c.json({
                success: true,
                duplicate: true,
                order_code: existing.order_code,
                id: Number(existing.id || 0),
                discount: Number(existing.discount_amount || 0),
                total: Number(existing.total_price || 0),
                order_access_token: orderAccessToken
              })
            }
          }
          if (!isUniqueConstraintError(error)) break
        }
      }

      if (!result) {
        const message = String((lastInsertError as any)?.message || lastInsertError || '')
        if (/INSUFFICIENT_STOCK/i.test(message)) {
          return c.json({ success: false, error: 'INSUFFICIENT_STOCK' }, 409)
        }
        if (/INVALID_VOUCHER/i.test(message)) {
          return c.json({ success: false, error: 'VOUCHER_LIMIT' }, 409)
        }
        return c.json({ success: false, error: 'ORDER_CREATION_FAILED' }, 500)
      }

      const createdOrderForPush = {
        id: result.meta.last_row_id,
        order_code: orderCode,
        customer_name: customerName,
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

      return c.json({
        success: true,
        order_code: orderCode,
        id: result.meta.last_row_id,
        discount,
        total,
        order_access_token: orderAccessToken
      })
    } catch (e: any) {
      return c.json({ success: false, error: 'ORDER_CREATION_FAILED' }, 500)
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

  const getShippingCreationAttempt = async (db: D1Database, orderId: number) => {
    return await db.prepare(`
      SELECT order_id, carrier, idempotency_key, state, tracking_code, label_code,
             shipping_fee, last_error, created_at, updated_at
      FROM shipping_creation_attempts
      WHERE order_id=?
      LIMIT 1
    `).bind(orderId).first() as any
  }

  const dbChanges = (result: any) => {
    const changes = Number(result?.meta?.changes)
    return Number.isFinite(changes) ? changes : null
  }

  const updateShippingCreationAttempt = async (
    db: D1Database,
    orderId: number,
    state: 'creating' | 'created' | 'failed' | 'needs_reconciliation',
    options: { trackingCode?: string, labelCode?: string, fee?: number, error?: string } = {}
  ) => {
    try {
      const result = await db.prepare(`
        UPDATE shipping_creation_attempts
        SET state=?,
            tracking_code=COALESCE(NULLIF(?, ''), tracking_code),
            label_code=COALESCE(NULLIF(?, ''), label_code),
            shipping_fee=CASE WHEN ? > 0 THEN ? ELSE shipping_fee END,
            last_error=?,
            updated_at=CURRENT_TIMESTAMP
        WHERE order_id=?
          AND state IN ('creating', 'failed', 'needs_reconciliation')
      `).bind(
        state,
        String(options.trackingCode || '').trim(),
        String(options.labelCode || '').trim(),
        Number(options.fee || 0) > 0 ? Number(options.fee || 0) : 0,
        Number(options.fee || 0) > 0 ? Number(options.fee || 0) : 0,
        String(options.error || '').slice(0, 500) || null,
        orderId
      ).run()
      return dbChanges(result) === 1
    } catch {
      return false
    }
  }

  const reconciliationFailure = (order: any, carrier: string, attempt: any, detail?: unknown) => ({
    id: Number(order?.id),
    order_code: String(order?.order_code || ''),
    carrier,
    error: 'SHIPPING_RECONCILIATION_REQUIRED',
    reconciliation_required: true,
    idempotency_key: String(attempt?.idempotency_key || '').trim() || null,
    attempt_state: String(attempt?.state || '').trim() || 'creating',
    action: 'Kiểm tra trạng thái trên hệ thống hãng vận chuyển theo mã đơn/idempotency key, ghi nhận mã vận đơn vào đơn rồi mới thử lại.',
    detail: detail || null
  })

  const acquireShippingCreationAttempt = async (db: D1Database, order: any, carrier: string) => {
    const orderId = Number(order?.id)
    const existing = await getShippingCreationAttempt(db, orderId)
    if (existing) {
      const existingCarrier = normalizeShippingCarrier(existing.carrier)
      if (existingCarrier !== carrier) {
        return { acquired: false, blocked: true, attempt: existing, reason: 'SHIPPING_RECONCILIATION_REQUIRED' }
      }
      const state = normalizeShippingCreationState(existing.state)
      if (state === 'failed') {
        try {
          const reset = await db.prepare(`
            UPDATE shipping_creation_attempts
            SET state='creating', last_error=NULL, updated_at=CURRENT_TIMESTAMP
            WHERE order_id=?
              AND state='failed'
              AND EXISTS (
                SELECT 1
                FROM orders o
                WHERE o.id=shipping_creation_attempts.order_id
                  AND LOWER(COALESCE(o.status, '')) IN ('pending', 'confirmed')
                  AND COALESCE(o.shipping_arranged, 0)=0
                  AND TRIM(COALESCE(o.shipping_tracking_code, ''))=''
                  AND LOWER(COALESCE(o.return_status, '')) NOT IN ('returned', 'cancelled', 'delivery_failed')
                  AND (
                    UPPER(COALESCE(o.payment_method, ''))='COD'
                    OR (
                      UPPER(COALESCE(o.payment_method, '')) IN ('BANK_TRANSFER', 'ZALOPAY', 'MOMO')
                      AND LOWER(COALESCE(o.payment_status, ''))='paid'
                    )
                  )
              )
          `).bind(orderId).run()
          if (dbChanges(reset) === 1) {
            return {
              acquired: true,
              blocked: false,
              attempt: { ...existing, state: 'creating' }
            }
          }
        } catch {
          // Treat a failed lock transition as unknown. Never call the carrier.
        }
      }
      return { acquired: false, blocked: true, attempt: existing, reason: 'SHIPPING_RECONCILIATION_REQUIRED' }
    }

    const idempotencyKey = buildShippingIdempotencyKey(order, carrier)
    try {
      const inserted = await db.prepare(`
        INSERT INTO shipping_creation_attempts
          (order_id, carrier, idempotency_key, state, created_at, updated_at)
        SELECT ?, ?, ?, 'creating', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
        FROM orders o
        WHERE o.id=?
          AND LOWER(COALESCE(o.status, '')) IN ('pending', 'confirmed')
          AND COALESCE(o.shipping_arranged, 0)=0
          AND TRIM(COALESCE(o.shipping_tracking_code, ''))=''
          AND LOWER(COALESCE(o.return_status, '')) NOT IN ('returned', 'cancelled', 'delivery_failed')
          AND (
            UPPER(COALESCE(o.payment_method, ''))='COD'
            OR (
              UPPER(COALESCE(o.payment_method, '')) IN ('BANK_TRANSFER', 'ZALOPAY', 'MOMO')
              AND LOWER(COALESCE(o.payment_status, ''))='paid'
            )
          )
        ON CONFLICT(order_id) DO NOTHING
      `).bind(orderId, carrier, idempotencyKey, orderId).run()
      if (dbChanges(inserted) === 1) {
        return {
          acquired: true,
          blocked: false,
          attempt: { order_id: orderId, carrier, idempotency_key: idempotencyKey, state: 'creating' }
        }
      }
    } catch {
      return { acquired: false, blocked: true, attempt: null, reason: 'SHIPPING_RECONCILIATION_REQUIRED' }
    }

    const raced = await getShippingCreationAttempt(db, orderId)
    return { acquired: false, blocked: true, attempt: raced, reason: 'SHIPPING_RECONCILIATION_REQUIRED' }
  }

  const persistCreatedShipment = async (
    db: D1Database,
    order: any,
    carrier: string,
    trackingCode: string,
    labelCode: string,
    fee: number
  ) => {
    const id = Number(order?.id)
    const safeTrackingCode = String(trackingCode || '').trim()
    if (!safeTrackingCode) return { ok: false, reason: 'SHIPPING_TRACKING_EMPTY' }
    try {
      const results = await db.batch([
        db.prepare(`
          UPDATE orders
          SET shipping_arranged=1,
              shipping_arranged_at=COALESCE(shipping_arranged_at, CURRENT_TIMESTAMP),
              shipping_carrier=CASE
                WHEN TRIM(COALESCE(shipping_tracking_code, ''))='' THEN ?
                ELSE shipping_carrier
              END,
              shipping_tracking_code=CASE
                WHEN TRIM(COALESCE(shipping_tracking_code, ''))='' THEN ?
                ELSE shipping_tracking_code
              END,
              shipping_label=CASE
                WHEN TRIM(COALESCE(shipping_label, ''))='' THEN ?
                ELSE shipping_label
              END,
              shipping_fee=CASE
                WHEN COALESCE(shipping_fee, 0)<=0 AND ? > 0 THEN ?
                ELSE shipping_fee
              END,
              status=CASE WHEN LOWER(COALESCE(status, ''))='pending' THEN 'confirmed' ELSE status END,
              updated_at=CURRENT_TIMESTAMP
          WHERE id=?
            AND LOWER(COALESCE(status, '')) NOT IN ('done', 'cancelled')
            AND LOWER(COALESCE(return_status, '')) NOT IN ('returned', 'cancelled', 'delivery_failed')
            AND (
              TRIM(COALESCE(shipping_tracking_code, ''))=''
              OR TRIM(shipping_tracking_code)=?
            )
        `).bind(carrier, safeTrackingCode, String(labelCode || '').trim(), fee > 0 ? fee : 0, fee > 0 ? fee : 0, id, safeTrackingCode),
          db.prepare(`
          UPDATE shipping_creation_attempts
          SET state='created',
              tracking_code=?,
              label_code=COALESCE(NULLIF(?, ''), label_code),
              shipping_fee=CASE WHEN ? > 0 THEN ? ELSE shipping_fee END,
              last_error=NULL,
              updated_at=CURRENT_TIMESTAMP
          WHERE order_id=?
            AND state='creating'
            AND changes()=1
            AND EXISTS (
              SELECT 1
              FROM orders o
              WHERE o.id=shipping_creation_attempts.order_id
                AND TRIM(COALESCE(o.shipping_tracking_code, ''))=?
            )
        `).bind(safeTrackingCode, String(labelCode || '').trim(), fee > 0 ? fee : 0, fee > 0 ? fee : 0, id, safeTrackingCode)
      ])
      const orderPersisted = dbChanges(results?.[0]) === 1
      const attemptPersisted = dbChanges(results?.[1]) === 1
      if (orderPersisted && attemptPersisted) return { ok: true }

      await updateShippingCreationAttempt(db, id, 'needs_reconciliation', {
        trackingCode: safeTrackingCode,
        labelCode,
        fee,
        error: 'REMOTE_SHIPMENT_CREATED_BUT_LOCAL_PERSISTENCE_INCOMPLETE'
      })
      return { ok: false, reason: 'SHIPPING_RECONCILIATION_REQUIRED' }
    } catch (error: any) {
      await updateShippingCreationAttempt(db, id, 'needs_reconciliation', {
        trackingCode: safeTrackingCode,
        labelCode,
        fee,
        error: 'REMOTE_SHIPMENT_CREATED_BUT_LOCAL_PERSISTENCE_FAILED'
      })
      return { ok: false, reason: 'SHIPPING_RECONCILIATION_REQUIRED', detail: String(error?.message || error) }
    }
  }

  const persistReusedShipment = async (db: D1Database, order: any, carrier: string, trackingCode: string) => {
    const id = Number(order?.id)
    const safeTrackingCode = String(trackingCode || '').trim()
    try {
      const result = await db.prepare(`
        UPDATE orders
        SET shipping_arranged=1,
            shipping_arranged_at=COALESCE(shipping_arranged_at, CURRENT_TIMESTAMP),
            shipping_carrier=CASE
              WHEN TRIM(COALESCE(shipping_carrier, ''))='' THEN ?
              ELSE shipping_carrier
            END,
            shipping_tracking_code=CASE
              WHEN TRIM(COALESCE(shipping_tracking_code, ''))='' THEN ?
              ELSE shipping_tracking_code
            END,
            status=CASE WHEN LOWER(COALESCE(status, ''))='pending' THEN 'confirmed' ELSE status END,
            updated_at=CURRENT_TIMESTAMP
        WHERE id=?
          AND LOWER(COALESCE(status, '')) NOT IN ('done', 'cancelled')
          AND LOWER(COALESCE(return_status, '')) NOT IN ('returned', 'cancelled', 'delivery_failed')
          AND (
            TRIM(COALESCE(shipping_tracking_code, ''))=''
            OR TRIM(shipping_tracking_code)=?
          )
      `).bind(carrier, safeTrackingCode, id, safeTrackingCode).run()
      if (dbChanges(result) === 1) return { ok: true }
      const latest = await db.prepare('SELECT shipping_carrier, shipping_tracking_code FROM orders WHERE id=? LIMIT 1').bind(id).first() as any
      const latestTracking = String(latest?.shipping_tracking_code || '').trim()
      const latestCarrier = String(latest?.shipping_carrier || '').trim().toUpperCase()
      return {
        ok: latestTracking === safeTrackingCode && latestCarrier === normalizeShippingCarrier(carrier),
        reason: 'SHIPPING_RECONCILIATION_REQUIRED'
      }
    } catch (error: any) {
      return { ok: false, reason: 'SHIPPING_RECONCILIATION_REQUIRED', detail: String(error?.message || error) }
    }
  }

  app.patch('/api/admin/orders/:id/status', async (c) => {
    try {
      await deps.initDB(c.env.DB)
      const id = Number(c.req.param('id'))
      if (!Number.isFinite(id) || id <= 0) return c.json({ success: false, error: 'INVALID_ORDER_ID' }, 400)
      const body = await c.req.json().catch(() => ({} as any))
      const nextStatus = String(body?.status || '').trim().toLowerCase()
      if (!new Set(['pending', 'confirmed', 'shipping', 'done', 'cancelled']).has(nextStatus)) {
        return c.json({ success: false, error: 'INVALID_STATUS' }, 400)
      }
      const existing = await c.env.DB.prepare(`
        SELECT id, status, return_status, payment_method, payment_status,
               shipping_carrier, shipping_tracking_code, shipping_arranged,
               shipping_delivery_confirmed_at
        FROM orders
        WHERE id=?
        LIMIT 1
      `).bind(id).first() as any
      if (!existing) return c.json({ success: false, error: 'ORDER_NOT_FOUND' }, 404)

      const currentStatus = String(existing.status || '').trim().toLowerCase()
      const trackingCode = String(existing.shipping_tracking_code || '').trim()
      const currentCarrier = String(existing.shipping_carrier || '').trim().toUpperCase()
      if (currentStatus === 'cancelled' || currentStatus === 'done') {
        return c.json({ success: false, error: 'ORDER_ALREADY_CLOSED' }, 400)
      }
      if (isTerminalReturnStatus(existing.return_status)) {
        return c.json({ success: false, error: 'ORDER_RETURN_TERMINAL', return_status: String(existing.return_status).toLowerCase() }, 400)
      }
      if (!isValidOrderStatusTransition(currentStatus, nextStatus)) {
        return c.json({ success: false, error: 'INVALID_STATUS_TRANSITION', from: currentStatus, to: nextStatus }, 400)
      }

      if (nextStatus === 'shipping' || nextStatus === 'done') {
        const payment = evaluateShippingPaymentEligibility(existing.payment_method, existing.payment_status)
        if (!payment.allowed) {
          return c.json({
            success: false,
            error: 'SHIPPING_PAYMENT_REQUIRED',
            payment_method: payment.method,
            payment_status: payment.paymentStatus
          }, 400)
        }
        if (!trackingCode || !currentCarrier) {
          return c.json({ success: false, error: 'SHIPPING_NOT_READY' }, 400)
        }
      }

      if (nextStatus === 'done') {
        if (currentStatus !== 'shipping') {
          return c.json({ success: false, error: 'ORDER_NOT_DELIVERED' }, 400)
        }
        if (!String(existing.shipping_delivery_confirmed_at || '').trim()) {
          return c.json({
            success: false,
            error: 'ORDER_NOT_DELIVERED',
            reason: 'CARRIER_DELIVERY_EVIDENCE_REQUIRED'
          }, 400)
        }
      }

      if (nextStatus === 'cancelled') {
        if (currentStatus === 'shipping') {
          return c.json({ success: false, error: 'ORDER_ALREADY_IN_SHIPPING' }, 400)
        }
        if (Number(existing.shipping_arranged || 0) === 1 && !trackingCode) {
          return c.json({
            success: false,
            error: 'SHIPPING_RECONCILIATION_REQUIRED',
            action: 'Đơn có cờ đã sắp xếp nhưng thiếu mã vận đơn; đối soát với hãng trước khi hủy.'
          }, 409)
        }
        if (trackingCode) {
          if (currentCarrier !== 'GHTK') {
            return c.json({
              success: false,
              error: 'SHIPPING_CANCEL_REQUIRES_CARRIER_RECONCILIATION',
              carrier: currentCarrier || null,
              tracking_code: trackingCode,
              action: 'Hủy trên hệ thống hãng vận chuyển hoặc đối soát trạng thái trước; hệ thống không tự hủy cục bộ.'
            }, 409)
          }
          let cancelRes: any
          try {
            cancelRes = await deps.ghtkCancelShipment(c.env, c.env.DB, trackingCode)
          } catch (error: any) {
            return c.json({
              success: false,
              error: 'SHIPPING_CANCEL_UNCERTAIN',
              carrier: currentCarrier,
              tracking_code: trackingCode,
              action: 'Không rõ kết quả hủy từ GHTK; kiểm tra GHTK trước khi thử lại.',
              detail: String(error?.message || error)
            }, 409)
          }
          if (!cancelRes?.ok) {
            return c.json({
              success: false,
              error: 'SHIPPING_CANCEL_REQUIRES_CARRIER_RECONCILIATION',
              carrier: currentCarrier,
              tracking_code: trackingCode,
              action: 'GHTK chưa xác nhận hủy; đối soát trên GHTK trước khi cập nhật đơn.',
              detail: cancelRes?.detail || cancelRes?.message || null
            }, 409)
          }
        }

        const result = await c.env.DB.prepare(`
          UPDATE orders
          SET status='cancelled',
              return_status='cancelled',
              cancelled_by='shop',
              updated_at=CURRENT_TIMESTAMP
          WHERE id=?
            AND status=?
            AND NOT EXISTS (
              SELECT 1
              FROM shipping_creation_attempts a
              WHERE a.order_id=orders.id
                AND a.state IN ('creating', 'needs_reconciliation')
            )
        `).bind(id, currentStatus).run()
        if (dbChanges(result) !== 1) {
          return c.json({ success: false, error: 'ORDER_STATE_CHANGED', action: 'Tải lại đơn và đối soát trước khi thử lại.' }, 409)
        }
        const order = await c.env.DB.prepare('SELECT user_id, customer_phone FROM orders WHERE id=? LIMIT 1').bind(id).first() as any
        if (order) await refreshCustomerAutoBlock(c.env.DB, order.user_id, order.customer_phone)
        return c.json({ success: true, status: nextStatus, cancelled_by: 'shop' })
      }

      const result = nextStatus === 'done'
        ? await c.env.DB.prepare(`
            UPDATE orders
            SET status='done',
                delivered_at=COALESCE(delivered_at, CURRENT_TIMESTAMP),
                updated_at=CURRENT_TIMESTAMP
            WHERE id=? AND status='shipping'
          `).bind(id).run()
        : await c.env.DB.prepare(`
            UPDATE orders SET status=?, updated_at=CURRENT_TIMESTAMP WHERE id=? AND status=?
          `).bind(nextStatus, id, currentStatus).run()
      if (dbChanges(result) !== 1) {
        return c.json({ success: false, error: 'ORDER_STATE_CHANGED' }, 409)
      }
      return c.json({ success: true, status: nextStatus })
    } catch (e: any) {
      return c.json({ success: false, error: e.message }, 500)
    }
  })

  // GHN/SPX do not expose a delivery-status adapter in this Worker. An
  // operator may record carrier-verified proof through this endpoint, but
  // only with an explicit confirmation and a reference that can be audited.
  // This endpoint never marks an order delivered by itself.
  app.post('/api/admin/orders/:id/delivery-evidence', async (c) => {
    try {
      await deps.initDB(c.env.DB)
      const id = Number(c.req.param('id'))
      if (!Number.isFinite(id) || id <= 0) return c.json({ success: false, error: 'INVALID_ORDER_ID' }, 400)
      const body = await c.req.json().catch(() => null as any)
      if (!body || typeof body !== 'object' || Array.isArray(body)) {
        return c.json({ success: false, error: 'INVALID_JSON' }, 400)
      }
      if (body.operator_confirmed !== true) {
        return c.json({
          success: false,
          error: 'DELIVERY_EVIDENCE_CONFIRMATION_REQUIRED',
          action: 'Xác nhận rằng bằng chứng đã được kiểm tra trên hệ thống hãng trước khi ghi nhận.'
        }, 400)
      }

      const evidenceRef = String(body.evidence_ref ?? '').trim()
      if (!evidenceRef || evidenceRef.length > 256 || /[\u0000-\u001f\u007f]/.test(evidenceRef)) {
        return c.json({ success: false, error: 'INVALID_DELIVERY_EVIDENCE_REF' }, 400)
      }

      const requestedSource = String(body.source ?? '').trim().toUpperCase()
      const sourceSet = new Set(['GHTK_OPERATOR', 'GHN_OPERATOR', 'SPX_OPERATOR', 'CARRIER_PORTAL'])
      if (!sourceSet.has(requestedSource)) {
        return c.json({ success: false, error: 'INVALID_DELIVERY_EVIDENCE_SOURCE' }, 400)
      }

      const existing = await c.env.DB.prepare(`
        SELECT id, status, return_status, shipping_carrier, shipping_tracking_code,
               shipping_delivery_confirmed_at, shipping_delivery_source,
               shipping_delivery_evidence_ref, shipping_delivery_confirmed_by
        FROM orders
        WHERE id=?
        LIMIT 1
      `).bind(id).first() as any
      if (!existing) return c.json({ success: false, error: 'ORDER_NOT_FOUND' }, 404)

      const status = String(existing.status || '').trim().toLowerCase()
      if (!['shipping', 'done'].includes(status)) {
        return c.json({ success: false, error: 'DELIVERY_EVIDENCE_REQUIRES_SHIPPING_STATUS' }, 409)
      }
      if (isTerminalReturnStatus(existing.return_status) || status === 'cancelled') {
        return c.json({ success: false, error: 'ORDER_CLOSED' }, 409)
      }

      const carrier = String(existing.shipping_carrier || '').trim().toUpperCase()
      const trackingCode = String(existing.shipping_tracking_code || '').trim()
      if (!carrier || !trackingCode) {
        return c.json({ success: false, error: 'SHIPPING_NOT_READY' }, 400)
      }
      if (requestedSource !== 'CARRIER_PORTAL' && requestedSource !== `${carrier}_OPERATOR`) {
        return c.json({
          success: false,
          error: 'DELIVERY_EVIDENCE_SOURCE_CARRIER_MISMATCH',
          carrier,
          source: requestedSource
        }, 400)
      }

      const existingEvidenceRef = String(existing.shipping_delivery_evidence_ref || '').trim()
      if (String(existing.shipping_delivery_confirmed_at || '').trim()) {
        if (existingEvidenceRef === evidenceRef && String(existing.shipping_delivery_source || '').trim().toUpperCase() === requestedSource) {
          return c.json({
            success: true,
            already_confirmed: true,
            delivery_evidence: {
              source: String(existing.shipping_delivery_source || '').trim(),
              evidence_ref: existingEvidenceRef,
              confirmed_by: existing.shipping_delivery_confirmed_by || null
            }
          })
        }
        return c.json({
          success: false,
          error: 'DELIVERY_EVIDENCE_ALREADY_RECORDED',
          action: 'Đơn đã có bằng chứng giao hàng; không ghi đè bằng chứng hiện hữu.'
        }, 409)
      }

      const confirmedBy = String(getCookie(c, 'admin_user_key') || 'admin').trim().slice(0, 64) || 'admin'
      const result = await c.env.DB.prepare(`
        UPDATE orders
        SET shipping_delivery_confirmed_at=CURRENT_TIMESTAMP,
            shipping_delivery_source=?,
            shipping_delivery_evidence_ref=?,
            shipping_delivery_confirmed_by=?,
            updated_at=CURRENT_TIMESTAMP
        WHERE id=?
          AND status IN ('shipping', 'done')
          AND TRIM(COALESCE(shipping_carrier, ''))=?
          AND TRIM(COALESCE(shipping_tracking_code, ''))=?
          AND (shipping_delivery_confirmed_at IS NULL OR TRIM(shipping_delivery_confirmed_at)='')
          AND LOWER(COALESCE(return_status, '')) NOT IN ('returned', 'cancelled', 'delivery_failed')
      `).bind(requestedSource, evidenceRef, confirmedBy, id, carrier, trackingCode).run()
      if (dbChanges(result) !== 1) {
        return c.json({
          success: false,
          error: 'DELIVERY_EVIDENCE_STATE_CHANGED',
          action: 'Tải lại đơn; bằng chứng có thể đã được ghi nhận bởi thao tác khác.'
        }, 409)
      }
      return c.json({
        success: true,
        delivery_evidence: {
          source: requestedSource,
          evidence_ref: evidenceRef,
          confirmed_by: confirmedBy
        }
      })
    } catch (e: any) {
      return c.json({ success: false, error: e.message }, 500)
    }
  })

  app.delete('/api/admin/orders/:id', async (c) => {
    try {
      await deps.initDB(c.env.DB)
      const id = Number(c.req.param('id'))
      if (!Number.isFinite(id) || id <= 0) return c.json({ success: false, error: 'INVALID_ORDER_ID' }, 400)
      const existing = await c.env.DB.prepare('SELECT * FROM orders WHERE id=? LIMIT 1').bind(id).first() as any
      if (!existing) return c.json({ success: false, error: 'ORDER_NOT_FOUND' }, 404)
      const status = String(existing.status || '').trim().toLowerCase()
      const trackingCode = String(existing.shipping_tracking_code || '').trim()
      if (status === 'done' || status === 'shipping' || trackingCode || Number(existing.shipping_arranged || 0) === 1) {
        return c.json({ success: false, error: 'ORDER_HAS_SHIPPING_HISTORY' }, 409)
      }
      const paymentStatus = String(existing.payment_status || '').trim().toLowerCase()
      if (paymentStatus === 'paid') {
        return c.json({ success: false, error: 'ORDER_PAID_CANNOT_DELETE' }, 409)
      }
      const hasPaymentAttempt = [
        existing.payment_link_id,
        existing.payment_order_code,
        existing.payment_ref,
        existing.payment_checkout_url
      ].some((value) => String(value ?? '').trim() !== '')
      if (hasPaymentAttempt) {
        return c.json({ success: false, error: 'ORDER_PAYMENT_ATTEMPT_EXISTS' }, 409)
      }
      const reserved = Number(existing.inventory_reserved || 0) === 1
      const released = Number(existing.inventory_released || 0) === 1
      if (reserved && !released) {
        return c.json({ success: false, error: 'ORDER_STOCK_RESERVED', action: 'Hủy đơn để giải phóng tồn kho trước khi xóa.' }, 409)
      }
      if (!['pending', 'cancelled'].includes(status)) {
        return c.json({ success: false, error: 'ORDER_NOT_DELETABLE' }, 409)
      }
      const result = await c.env.DB.prepare(`
        DELETE FROM orders
        WHERE id=?
          AND status=?
          AND LOWER(COALESCE(payment_status, ''))!='paid'
          AND TRIM(COALESCE(shipping_tracking_code, ''))=''
          AND COALESCE(shipping_arranged, 0)=0
          AND TRIM(COALESCE(payment_link_id, ''))=''
          AND TRIM(COALESCE(payment_order_code, ''))=''
          AND TRIM(COALESCE(payment_ref, ''))=''
          AND TRIM(COALESCE(payment_checkout_url, ''))=''
          AND (COALESCE(inventory_reserved, 0)=0 OR COALESCE(inventory_released, 0)=1)
          AND NOT EXISTS (
            SELECT 1
            FROM shipping_creation_attempts a
            WHERE a.order_id=orders.id
              AND a.state IN ('creating', 'needs_reconciliation', 'created')
          )
      `).bind(id, status).run()
      if (dbChanges(result) !== 1) return c.json({ success: false, error: 'ORDER_STATE_CHANGED' }, 409)
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
        SELECT id, status, return_status, shipping_tracking_code, shipping_carrier
        FROM orders
        WHERE id=?
        LIMIT 1
      `).bind(id).first() as any
      if (!existing) return c.json({ success: false, error: 'ORDER_NOT_FOUND' }, 404)
      const tracking = String(existing.shipping_tracking_code || '').trim()
      const storedCarrier = String(existing.shipping_carrier || '').trim()
      if (tracking && !storedCarrier) {
        return c.json({
          success: false,
          error: 'SHIPPING_TRACKING_CARRIER_MISSING',
          tracking_code: tracking,
          action: 'Đối soát hãng vận chuyển của mã vận đơn trước khi cập nhật; hệ thống không tự suy đoán hãng.'
        }, 409)
      }
      const currentCarrier = normalizeShippingCarrier(storedCarrier)
      if (isTerminalReturnStatus(existing.return_status) || ['done', 'cancelled'].includes(String(existing.status || '').trim().toLowerCase())) {
        return c.json({ success: false, error: 'ORDER_CLOSED' }, 409)
      }
      if (tracking && currentCarrier !== carrier) {
        return c.json({ success: false, error: 'ORDER_ALREADY_HAS_TRACKING' }, 400)
      }
      const result = await c.env.DB.prepare(`
        UPDATE orders
        SET shipping_carrier=?, updated_at=CURRENT_TIMESTAMP
        WHERE id=?
          AND TRIM(COALESCE(shipping_tracking_code, ''))=''
          AND NOT EXISTS (
            SELECT 1
            FROM shipping_creation_attempts a
            WHERE a.order_id=orders.id
          )
      `).bind(carrier, id).run()
      if (tracking && currentCarrier === carrier) return c.json({ success: true, carrier, reused_tracking: true })
      if (dbChanges(result) !== 1) {
        return c.json({ success: false, error: 'ORDER_SHIPPING_STATE_CHANGED', action: 'Đơn đã có mã vận đơn hoặc đang đối soát; tải lại trước khi đổi hãng.' }, 409)
      }
      return c.json({ success: true, carrier })
    } catch (e: any) {
      return c.json({ success: false, error: e.message }, 500)
    }
  })

  app.post('/api/admin/orders/arrange-shipping', async (c) => {
    try {
      await deps.initDB(c.env.DB)
      const body: any = await c.req.json().catch(() => ({}))
      const rawIds = Array.isArray(body.ids)
        ? body.ids.map((v: any) => Number(v)).filter((v: number) => Number.isFinite(v) && v > 0)
        : []
      const ids = Array.from(new Set<number>(rawIds as number[]))
      const requestedCarriers = buildRequestedCarrierMap(body.carriers)
      if (!ids.length) return c.json({ success: false, error: 'NO_ORDER_IDS' }, 400)
      if (ids.length > 100) return c.json({ success: false, error: 'TOO_MANY_ORDER_IDS' }, 400)
      const availableCarrierCodes = await getAvailableCarrierCodeSet(c.env.DB, deps)

      const orderQuery = `
        SELECT o.id, o.order_code, o.customer_name, o.customer_phone, o.customer_address, o.product_name,
               o.customer_province_code, o.customer_commune_code, o.customer_address_effective_date,
               o.quantity, o.total_price, o.note, o.payment_method, o.payment_status,
               o.status, o.return_status, o.shipping_arranged, o.shipping_carrier,
               o.shipping_tracking_code, o.shipping_label, o.shipping_fee,
               a.state AS shipping_create_state,
               a.idempotency_key AS shipping_create_attempt_id,
               a.last_error AS shipping_create_last_error
        FROM orders o
        LEFT JOIN shipping_creation_attempts a ON a.order_id=o.id
        WHERE o.id IN (${ids.map(() => '?').join(',')})
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
        const status = String(order.status || '').trim().toLowerCase()
        if (status === 'done' || status === 'cancelled') {
          failed.push({ id, order_code: order.order_code, error: 'ORDER_CLOSED' })
          continue
        }
        if (!['pending', 'confirmed'].includes(status)) {
          failed.push({ id, order_code: order.order_code, error: 'INVALID_STATUS_TRANSITION', detail: { status } })
          continue
        }
        if (isTerminalReturnStatus(order.return_status)) {
          failed.push({ id, order_code: order.order_code, error: 'ORDER_RETURN_TERMINAL', return_status: String(order.return_status).toLowerCase() })
          continue
        }
        const payment = evaluateShippingPaymentEligibility(order.payment_method, order.payment_status)
        if (!payment.allowed) {
          failed.push({
            id,
            order_code: order.order_code,
            error: 'SHIPPING_PAYMENT_REQUIRED',
            payment_method: payment.method,
            payment_status: payment.paymentStatus
          })
          continue
        }

        const trackingCode = String(order.shipping_tracking_code || '').trim()
        const storedCarrier = String(order.shipping_carrier || '').trim()
        if (trackingCode && !storedCarrier) {
          failed.push(reconciliationFailure(order, 'UNKNOWN', {
            state: 'needs_reconciliation',
            idempotency_key: order.shipping_create_attempt_id
          }, 'Existing tracking has no persisted carrier; carrier must be identified before reuse.'))
          continue
        }
        const targetCarrier = normalizeShippingCarrier(requestedCarriers.get(id) || storedCarrier || 'GHTK')
        if (!availableCarrierCodes.has(targetCarrier)) {
          failed.push({ id, order_code: order.order_code, carrier: targetCarrier, error: 'SHIPPING_CARRIER_NOT_AVAILABLE' })
          continue
        }
        const existingCarrier = trackingCode ? normalizeShippingCarrier(storedCarrier) : targetCarrier
        if (trackingCode && existingCarrier !== targetCarrier) {
          failed.push({ id, order_code: order.order_code, carrier: targetCarrier, error: 'ORDER_ALREADY_HAS_DIFFERENT_CARRIER_TRACKING' })
          continue
        }

        if (trackingCode) {
          const reused = await persistReusedShipment(c.env.DB, order, existingCarrier, trackingCode)
          if (!reused.ok) {
            failed.push(reconciliationFailure(order, existingCarrier, {
              state: 'needs_reconciliation',
              idempotency_key: order.shipping_create_attempt_id
            }, reused.reason || reused.detail || null))
            continue
          }
          updated.push({ id, order_code: order.order_code, tracking_code: trackingCode, carrier: existingCarrier, reused_tracking: true })
          continue
        }

        if (Number(order.shipping_arranged || 0) === 1 || status === 'confirmed' && String(order.shipping_create_state || '').trim().toLowerCase() === 'needs_reconciliation') {
          failed.push(reconciliationFailure(order, targetCarrier, {
            state: order.shipping_create_state || 'needs_reconciliation',
            idempotency_key: order.shipping_create_attempt_id
          }, 'Order is marked as arranged without a reusable tracking code.'))
          continue
        }

        const lock = await acquireShippingCreationAttempt(c.env.DB, order, targetCarrier)
        if (!lock.acquired) {
          failed.push(reconciliationFailure(order, targetCarrier, lock.attempt, String(lock.reason || 'SHIPPING_RECONCILIATION_REQUIRED')))
          continue
        }
        const attempt = lock.attempt
        let createRes: any
        try {
          createRes = await createShipmentForCarrier(targetCarrier, c.env, c.env.DB, {
            ...order,
            shipping_attempt_id: attempt?.idempotency_key || null,
            shipping_idempotency_key: attempt?.idempotency_key || null
          })
        } catch (error: any) {
          const errorMessage = String(error?.message || error || `${targetCarrier}_CREATE_ORDER_UNCERTAIN`).slice(0, 500)
          await updateShippingCreationAttempt(c.env.DB, id, 'needs_reconciliation', { error: errorMessage })
          failed.push(reconciliationFailure(order, targetCarrier, attempt, {
            reason: 'REMOTE_CREATE_RESULT_UNKNOWN',
            message: errorMessage
          }))
          continue
        }

        const remoteTracking = extractShippingTrackingCode(createRes)
        const remoteData = createRes?.data || {}
        const labelCode = String(remoteData?.label || remoteData?.label_id || remoteTracking || '').trim()
        const fee = Number(remoteData?.fee || remoteData?.total_fee || 0) || 0
        if (!createRes?.ok && !remoteTracking) {
          const message = String(createRes?.message || `${targetCarrier}_CREATE_ORDER_FAILED`).slice(0, 500)
          if (isUncertainShippingCreateResult(createRes)) {
            await updateShippingCreationAttempt(c.env.DB, id, 'needs_reconciliation', { error: message })
            failed.push(reconciliationFailure(order, targetCarrier, attempt, createRes?.detail || message))
          } else {
            const markedFailed = await updateShippingCreationAttempt(c.env.DB, id, 'failed', { error: message })
            if (!markedFailed) {
              failed.push(reconciliationFailure(order, targetCarrier, attempt, { reason: 'CREATE_FAILED_STATE_PERSISTENCE_UNKNOWN', message }))
            } else {
              failed.push({ id, order_code: order.order_code, carrier: targetCarrier, error: message, detail: createRes?.detail || null })
            }
          }
          continue
        }
        if (!remoteTracking) {
          await updateShippingCreationAttempt(c.env.DB, id, 'needs_reconciliation', { error: `${targetCarrier}_TRACKING_EMPTY` })
          failed.push(reconciliationFailure(order, targetCarrier, attempt, createRes?.data || null))
          continue
        }

        const persisted = await persistCreatedShipment(c.env.DB, order, targetCarrier, remoteTracking, labelCode, fee)
        if (!persisted.ok) {
          failed.push(reconciliationFailure(order, targetCarrier, attempt, {
            reason: persisted.reason,
            remote_tracking_code: remoteTracking,
            detail: persisted.detail || null
          }))
          continue
        }
        updated.push({
          id,
          order_code: order.order_code,
          tracking_code: remoteTracking,
          carrier: targetCarrier,
          used_fallback_address: !!createRes?.usedFallbackAddress
        })
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
