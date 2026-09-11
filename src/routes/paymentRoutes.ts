import type { Hono } from 'hono'
import type { AppBindings } from '../types/app'
import { getCookie } from 'hono/cookie'
import { timingSafeStringEqual, validateAdminSessionToken } from '../lib/adminHelpers'
import { canAccessAdminRequest } from '../lib/adminPermissions'
import { getUserSessionUserId } from '../lib/userSessionHelpers'
import { getRuntimeConfigValue } from '../lib/runtimeConfigHelpers'
import { getManualVietQRMissingConfigKeys, hashOrderAccessToken } from '../lib/paymentHelpers'

type PaymentRouteDeps = {
  initDB: (db: D1Database) => Promise<void>
  syncOrderPayment: (db: D1Database, env: any, order: any) => Promise<any>
  syncOrderPaymentWithPayOS: (db: D1Database, env: any, order: any) => Promise<any>
  syncOrderPaymentWithMoMo: (db: D1Database, env: any, order: any) => Promise<any>
  syncOrderPaymentWithZaloPay: (db: D1Database, env: any, order: any) => Promise<any>
  getPayOSConfig: (db: D1Database, env: any) => Promise<any>
  getMoMoConfig: (db: D1Database, env: any) => Promise<any>
  getMoMoMissingConfigKeys: (config: any) => string[]
  getZaloPayConfig: (db: D1Database, env: any) => Promise<any>
  getZaloPayMissingConfigKeys: (config: any) => string[]
  getBankTransferProviderConfig: (db: D1Database, env: any) => Promise<any>
  buildManualVietQRPaymentData: (order: any, config: any) => any
  sanitizeAddressEffectiveDate: (value: string) => string
  addressKitCache: { provinces: Map<string, any[]>, communes: Map<string, any[]> }
  ADDRESS_KIT_BASE_URL: string
  buildMoMoOrderId: (orderId: number, nowMs?: number) => string
  buildZaloPayAppTransId: (orderId: number, nowMs?: number) => string
  payOSSignWithChecksum: (key: string, payload: string) => Promise<string>
  payOSBuildDataString: (input: Record<string, any>) => string
  parseJsonObject: (value: any) => Record<string, any>
  payOSGetPaymentInfo: (db: D1Database, env: any, paymentLinkIdOrOrderCode: string | number) => Promise<any>
}

function buildMoMoSignaturePayload(input: Record<string, unknown>) {
  return Object.keys(input)
    .sort()
    .map((key) => `${key}=${input[key] == null ? '' : String(input[key])}`)
    .join('&')
}

async function verifyOrderAccess(c: any, order: any): Promise<boolean> {
  const userId = await getUserSessionUserId(c)
  if (userId && order.user_id != null && String(order.user_id) === String(userId)) return true

  const orderAccessToken = String(c.req.header('x-order-access-token') || getCookie(c, 'order_access_token') || '').trim()
  const expectedTokenHash = String(order?.order_access_token_hash || '').trim().toLowerCase()
  if (orderAccessToken.length >= 32 && /^[a-f0-9]{64}$/i.test(expectedTokenHash)) {
    const providedTokenHash = await hashOrderAccessToken(orderAccessToken)
    if (timingSafeStringEqual(providedTokenHash, expectedTokenHash)) return true
  }

  const adminToken = getCookie(c, 'admin_token')
  const adminUserKey = getCookie(c, 'admin_user_key') || 'admin'
  if (adminToken) return validateAdminSessionToken(c.env.DB, adminUserKey, adminToken)
  return false
}

async function verifyPaymentSettingsAdmin(c: any): Promise<boolean> {
  const adminToken = String(getCookie(c, 'admin_token') || '').trim()
  if (!adminToken) return false
  const adminUserKey = getCookie(c, 'admin_user_key') || 'admin'
  if (!await validateAdminSessionToken(c.env.DB, adminUserKey, adminToken)) return false
  return canAccessAdminRequest(c.env.DB, adminUserKey, '/api/admin/settings/payment', 'POST')
}

function normalizeCanonicalWebhookUrl(raw: unknown) {
  try {
    const url = new URL(String(raw || '').trim())
    const isLocal = url.hostname === 'localhost' || url.hostname === '127.0.0.1' || url.hostname === '[::1]'
    if (url.protocol !== 'https:' && !(isLocal && url.protocol === 'http:')) return ''
    if (url.pathname !== '/api/payments/payos/webhook' || url.search || url.hash) return ''
    return url.toString().replace(/\/$/, '')
  } catch {
    return ''
  }
}

function getCanonicalPayOSWebhookUrl(c: any) {
  const configured = normalizeCanonicalWebhookUrl(c.env.PAYOS_WEBHOOK_URL)
  if (configured) return configured

  const allowedOrigins = String(c.env.CORS_ALLOWED_ORIGINS || '')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean)
  for (const origin of allowedOrigins) {
    const candidate = normalizeCanonicalWebhookUrl(`${origin.replace(/\/$/, '')}/api/payments/payos/webhook`)
    if (candidate && !candidate.includes('localhost') && !candidate.includes('127.0.0.1')) return candidate
  }

  const requestUrl = new URL(c.req.url)
  const isLocalRequest = requestUrl.hostname === 'localhost'
    || requestUrl.hostname === '127.0.0.1'
    || requestUrl.hostname === '[::1]'
  return isLocalRequest
    ? normalizeCanonicalWebhookUrl(`${requestUrl.origin}/api/payments/payos/webhook`)
    : ''
}

function buildPaymentAttemptKey(orderId: number) {
  const bytes = crypto.getRandomValues(new Uint8Array(16))
  const suffix = Array.from(bytes).map((byte) => byte.toString(16).padStart(2, '0')).join('')
  return `PAYOS-${orderId}-${suffix}`
}

async function acquirePayOSPaymentAttempt(db: D1Database, orderId: number) {
  const idempotencyKey = buildPaymentAttemptKey(orderId)
  let inserted = false
  for (let allocationAttempt = 0; allocationAttempt < 5 && !inserted; allocationAttempt++) {
    const candidateOrderCode = Math.floor(Date.now() * 1000 + Math.floor(Math.random() * 1000))
    try {
      await db.prepare(`
        INSERT INTO payment_attempts
          (order_id, provider, idempotency_key, provider_order_code, status, lease_expires_at, created_at, updated_at)
        VALUES (?, 'PAYOS', ?, ?, 'CREATING', datetime('now', '+2 minutes'), CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        ON CONFLICT(order_id, provider) DO UPDATE SET
          idempotency_key=excluded.idempotency_key,
          provider_order_code=CASE
            WHEN payment_attempts.status IN ('FAILED', 'EXPIRED') THEN excluded.provider_order_code
            ELSE payment_attempts.provider_order_code
          END,
          status='CREATING',
          lease_expires_at=excluded.lease_expires_at,
          error_code=NULL,
          updated_at=CURRENT_TIMESTAMP
        WHERE payment_attempts.status IN ('FAILED', 'EXPIRED')
      `).bind(orderId, idempotencyKey, candidateOrderCode).run()
      inserted = true
    } catch (error: any) {
      const message = String(error?.message || error || '').toLowerCase()
      if (!message.includes('unique') && !message.includes('constraint')) throw error
    }
  }
  if (!inserted) throw new Error('PAYMENT_ATTEMPT_ORDER_CODE_UNAVAILABLE')

  const row = await db.prepare(`
    SELECT id, order_id, provider, idempotency_key, provider_order_code, status,
           payment_link_id, checkout_url, lease_expires_at
    FROM payment_attempts
    WHERE order_id=? AND provider='PAYOS'
    LIMIT 1
  `).bind(orderId).first() as any
  if (!row) throw new Error('PAYMENT_ATTEMPT_NOT_AVAILABLE')

  const status = String(row.status || '').toUpperCase()
  if (status === 'READY' && (String(row.payment_link_id || '').trim() || String(row.checkout_url || '').trim())) {
    return { action: 'reuse' as const, row }
  }
  if (String(row.idempotency_key || '') !== idempotencyKey) {
    if (status === 'NEEDS_RECONCILIATION') return { action: 'stale' as const, row }
    const leaseExpiresAt = Date.parse(String(row.lease_expires_at || '').replace(' ', 'T') + 'Z')
    if (status === 'CREATING' && Number.isFinite(leaseExpiresAt) && leaseExpiresAt <= Date.now()) {
      return { action: 'stale' as const, row }
    }
    return { action: 'in_progress' as const, row }
  }
  return { action: 'acquired' as const, row }
}

async function recoverStalePayOSAttempt(c: any, order: any, attempt: any, deps: PaymentRouteDeps) {
  const lookupKey = String(attempt?.payment_link_id || attempt?.provider_order_code || '').trim()
  if (!lookupKey) return false

  let paymentInfo: any = null
  try {
    paymentInfo = await deps.payOSGetPaymentInfo(c.env.DB, c.env, lookupKey)
  } catch {
    return false
  }

  const providerLinkId = String(paymentInfo?.id || paymentInfo?.paymentLinkId || '').trim()
  const providerOrderCode = Number(paymentInfo?.orderCode || 0)
  const expectedOrderCode = Number(attempt?.provider_order_code || 0)
  const checkoutUrl = String(paymentInfo?.checkoutUrl || (providerLinkId ? `https://pay.payos.vn/web/${encodeURIComponent(providerLinkId)}` : '')).trim()
  // The PayOS query endpoint is VND-only and omits currency in its response;
  // an explicit non-VND value is still rejected.
  const currency = String(paymentInfo?.currency || 'VND').trim().toUpperCase()
  const orderTotal = Number(order?.total_price || 0)
  const providerAmount = Number(paymentInfo?.amount || 0)
  const orderPaymentLinkId = String(order?.payment_link_id || '').trim()
  const orderPaymentCode = Number(order?.payment_order_code || 0)
  const isBound = !!providerLinkId
    && Number.isSafeInteger(expectedOrderCode)
    && expectedOrderCode > 0
    && Number.isSafeInteger(providerOrderCode)
    && providerOrderCode === expectedOrderCode
    && (!orderPaymentCode || providerOrderCode === orderPaymentCode)
    && currency === 'VND'
    && orderTotal > 0
    && Number.isFinite(providerAmount)
    && providerAmount > 0
    && providerAmount === orderTotal
    && (!orderPaymentLinkId || orderPaymentLinkId === providerLinkId)
  if (!isBound || !checkoutUrl) return false

  await c.env.DB.prepare(`
    UPDATE payment_attempts
    SET status='READY', payment_link_id=?, checkout_url=?, lease_expires_at=NULL,
        error_code=NULL, updated_at=CURRENT_TIMESTAMP
    WHERE id=? AND provider='PAYOS' AND status IN ('CREATING', 'NEEDS_RECONCILIATION')
  `).bind(providerLinkId, checkoutUrl, attempt.id).run()
  const orderUpdate = await c.env.DB.prepare(`
    UPDATE orders
    SET payment_provider='PAYOS',
        payment_link_id=COALESCE(NULLIF(payment_link_id, ''), ?),
        payment_checkout_url=COALESCE(NULLIF(payment_checkout_url, ''), ?),
        payment_order_code=COALESCE(payment_order_code, ?),
        updated_at=CURRENT_TIMESTAMP
    WHERE id=?
      AND LOWER(COALESCE(payment_status, '')) <> 'paid'
      AND UPPER(COALESCE(payment_method, ''))='BANK_TRANSFER'
      AND UPPER(COALESCE(NULLIF(payment_provider, ''), 'PAYOS'))='PAYOS'
      AND (NULLIF(TRIM(COALESCE(payment_link_id, '')), '') IS NULL OR payment_link_id=?)
      AND (payment_order_code IS NULL OR payment_order_code=?)
      AND total_price=?
  `).bind(providerLinkId, checkoutUrl, providerOrderCode, order.id, providerLinkId, providerOrderCode, orderTotal).run()
  if (Number((orderUpdate as any)?.meta?.changes || 0) < 1) {
    const latest = await c.env.DB.prepare('SELECT payment_status, payment_provider, payment_link_id, payment_order_code FROM orders WHERE id=? LIMIT 1').bind(order.id).first() as any
    const latestPaid = String(latest?.payment_status || '').toLowerCase() === 'paid'
    const latestProvider = String(latest?.payment_provider || '').trim().toUpperCase()
    const latestLink = String(latest?.payment_link_id || '').trim()
    const latestCode = Number(latest?.payment_order_code || 0)
    if (!latestPaid && (latestProvider && latestProvider !== 'PAYOS' || latestLink && latestLink !== providerLinkId || latestCode && latestCode !== providerOrderCode)) return false
  }
  return { paymentLinkId: providerLinkId, checkoutUrl }
}

async function isWalletTopupEnabled(db: D1Database): Promise<boolean> {
  const row = await db.prepare("SELECT value FROM app_settings WHERE key='wallet_topup_enabled' LIMIT 1").first<{ value?: string | null }>()
  return String(row?.value || '1') !== '0'
}

function normalizePayOSErrorText(input: any) {
  return JSON.stringify(input || {})
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
}

function isPayOSTransactionLimitError(status: number, body: any) {
  if (Number(status) === 429) return true
  const text = normalizePayOSErrorText(body)
  return /too many request|rate limit|quota|transaction limit|payment request limit|so luong giao dich|gioi han giao dich|vuot gioi han giao dich|het han muc|vuot han muc goi|goi thanh toan/.test(text)
}

export function registerPaymentRoutes(app: Hono<{ Bindings: AppBindings }>, deps: PaymentRouteDeps) {
  app.post('/api/webhooks/casso', async (c) => {
    try {
      await deps.initDB(c.env.DB)
      const configuredToken = await getRuntimeConfigValue(c.env.DB, c.env, 'CASSO_SECURE_TOKEN')
      if (!configuredToken) {
        console.error('[payments] Casso webhook token is not configured')
        return c.json({ error: 'Webhook not configured' }, 503)
      }
      const secureToken = String(c.req.header('secure-token') || '').trim()
      if (secureToken !== configuredToken) {
        return c.json({ error: 'Invalid token' }, 401)
      }

      const body = await c.req.json()
      if (body.error !== 0) return c.json({ success: false })

      const transactions = body.data || []

      let count = 0
      for (const tx of transactions) {
        const exists = await c.env.DB.prepare("SELECT id FROM transactions WHERE tid=?").bind(tx.tid).first()
        if (exists) continue

        const desc = (tx.description || '').toUpperCase()
        const match = desc.match(/QHVN90(\d+)/)

        if (match) {
          const walletTopupEnabled = await isWalletTopupEnabled(c.env.DB)
          if (!walletTopupEnabled) {
            await c.env.DB.prepare("INSERT INTO transactions (tid, amount, description) VALUES (?, ?, ?)").bind(tx.tid, tx.amount, tx.description).run()
            continue
          }
          const userId = match[1]
          const amount = tx.amount
          await c.env.DB.prepare("UPDATE users SET balance = balance + ? WHERE id = ?").bind(amount, userId).run()
          await c.env.DB.prepare("INSERT INTO transactions (tid, amount, description, user_id) VALUES (?, ?, ?, ?)").bind(tx.tid, amount, tx.description, userId).run()
          count++
        } else {
          await c.env.DB.prepare("INSERT INTO transactions (tid, amount, description) VALUES (?, ?, ?)").bind(tx.tid, tx.amount, tx.description).run()
        }
      }

      return c.json({ success: true, processed: count })
    } catch (e: any) {
      return c.json({ success: false, error: e.message }, 500)
    }
  })

  app.get('/api/orders/:orderCode/payment-status', async (c) => {
    try {
      await deps.initDB(c.env.DB)
      const orderCode = String(c.req.param('orderCode') || '').trim().toUpperCase()
      if (!orderCode) return c.json({ success: false, error: 'MISSING_ORDER_CODE' }, 400)
      const order = await c.env.DB.prepare(`
        SELECT id, user_id, order_code, payment_status, payment_paid_at, status, return_status, payment_method, payment_provider, payment_link_id, payment_order_code, total_price, order_access_token_hash
        FROM orders
        WHERE order_code=?
      `).bind(orderCode).first() as any
      if (!order) return c.json({ success: false, error: 'ORDER_NOT_FOUND' }, 404)
      if (!await verifyOrderAccess(c, order)) return c.json({ success: false, error: 'FORBIDDEN' }, 403)
      await deps.syncOrderPayment(c.env.DB, c.env, order)
      const latest = await c.env.DB.prepare(`SELECT order_code, payment_status, payment_paid_at, status FROM orders WHERE id=?`).bind(order.id).first() as any
      return c.json({ success: true, data: latest || order })
    } catch (e: any) {
      return c.json({ success: false, error: e.message }, 500)
    }
  })

  app.post('/api/orders/:id/payos-sync', async (c) => {
    try {
      await deps.initDB(c.env.DB)
      const id = Number(c.req.param('id') || 0)
      if (!id) return c.json({ success: false, error: 'INVALID_ORDER_ID' }, 400)
      const order = await c.env.DB.prepare(`
        SELECT id, user_id, order_code, payment_status, payment_paid_at, status, return_status, payment_method, payment_provider, payment_link_id, payment_order_code, total_price, order_access_token_hash
        FROM orders
        WHERE id=?
      `).bind(id).first() as any
      if (!order) return c.json({ success: false, error: 'ORDER_NOT_FOUND' }, 404)
      if (!await verifyOrderAccess(c, order)) return c.json({ success: false, error: 'FORBIDDEN' }, 403)
      const sync = await deps.syncOrderPaymentWithPayOS(c.env.DB, c.env, order)
      const latest = await c.env.DB.prepare(`SELECT order_code, payment_status, payment_paid_at, status FROM orders WHERE id=?`).bind(id).first() as any
      return c.json({ success: true, data: latest || order, synced: !!sync.synced })
    } catch (e: any) {
      return c.json({ success: false, error: e.message }, 500)
    }
  })

  app.post('/api/orders/:id/zalopay-sync', async (c) => {
    try {
      await deps.initDB(c.env.DB)
      const id = Number(c.req.param('id') || 0)
      if (!id) return c.json({ success: false, error: 'INVALID_ORDER_ID' }, 400)
      const order = await c.env.DB.prepare(`
        SELECT id, user_id, order_code, payment_status, payment_paid_at, status, return_status, payment_method, payment_provider, payment_link_id, payment_order_code, total_price, order_access_token_hash
        FROM orders
        WHERE id=?
      `).bind(id).first() as any
      if (!order) return c.json({ success: false, error: 'ORDER_NOT_FOUND' }, 404)
      if (!await verifyOrderAccess(c, order)) return c.json({ success: false, error: 'FORBIDDEN' }, 403)
      const sync = await deps.syncOrderPaymentWithZaloPay(c.env.DB, c.env, order)
      const latest = await c.env.DB.prepare(`SELECT order_code, payment_status, payment_paid_at, status FROM orders WHERE id=?`).bind(id).first() as any
      return c.json({ success: true, data: latest || order, synced: !!sync.synced })
    } catch (e: any) {
      return c.json({ success: false, error: e.message }, 500)
    }
  })

  app.get('/api/payments/zalopay/config', async (c) => {
    await deps.initDB(c.env.DB)
    const config = await deps.getZaloPayConfig(c.env.DB, c.env)
    const missing = deps.getZaloPayMissingConfigKeys(config)
    return c.json({
      success: true,
      data: {
        ready: missing.length === 0,
        missing
      }
    })
  })

  app.get('/api/payments/momo/config', async (c) => {
    await deps.initDB(c.env.DB)
    const config = await deps.getMoMoConfig(c.env.DB, c.env)
    const missing = deps.getMoMoMissingConfigKeys(config)
    return c.json({ success: true, data: { ready: missing.length === 0, missing } })
  })

  app.get('/api/address/provinces', async (c) => {
    try {
      const effectiveDate = deps.sanitizeAddressEffectiveDate(c.req.query('effectiveDate') || 'latest')
      const cachedProvinces = deps.addressKitCache.provinces.get(effectiveDate) || []
      if (cachedProvinces.length) {
        return c.json({ success: true, data: cachedProvinces })
      }
      deps.addressKitCache.provinces.delete(effectiveDate)

      const url = `${deps.ADDRESS_KIT_BASE_URL}/${effectiveDate}/provinces`
      const res = await fetch(url, { headers: { accept: 'application/json' } })
      if (!res.ok) return c.json({ success: false, error: 'ADDRESSKIT_UPSTREAM_FAILED' }, 502)

      const json: any = await res.json().catch(() => ({}))
      const provinces = Array.isArray(json?.provinces) ? json.provinces : []
      const normalized = provinces
        .map((p: any) => ({
          code: String(p?.code || '').trim(),
          name: String(p?.name || '').trim(),
          administrativeLevel: String(p?.administrativeLevel || '').trim()
        }))
        .filter((p: any) => p.code && p.name)
        .sort((a: any, b: any) => a.name.localeCompare(b.name, 'vi'))

      if (!normalized.length) {
        return c.json({ success: false, error: 'ADDRESSKIT_EMPTY_RESPONSE' }, 502)
      }

      deps.addressKitCache.provinces.set(effectiveDate, normalized)
      return c.json({ success: true, data: normalized })
    } catch (e: any) {
      return c.json({ success: false, error: e?.message || 'ADDRESSKIT_FETCH_FAILED' }, 500)
    }
  })

  app.get('/api/address/provinces/:provinceCode/communes', async (c) => {
    try {
      const effectiveDate = deps.sanitizeAddressEffectiveDate(c.req.query('effectiveDate') || 'latest')
      const provinceCode = String(c.req.param('provinceCode') || '').trim()
      if (!provinceCode) return c.json({ success: false, error: 'INVALID_PROVINCE_CODE' }, 400)
      const cacheKey = `${effectiveDate}:${provinceCode}`
      const cachedCommunes = deps.addressKitCache.communes.get(cacheKey) || []
      if (cachedCommunes.length) {
        return c.json({ success: true, data: cachedCommunes })
      }
      deps.addressKitCache.communes.delete(cacheKey)

      const encodedProvinceCode = encodeURIComponent(provinceCode)
      const url = `${deps.ADDRESS_KIT_BASE_URL}/${effectiveDate}/provinces/${encodedProvinceCode}/communes`
      const res = await fetch(url, { headers: { accept: 'application/json' } })
      if (!res.ok) return c.json({ success: false, error: 'ADDRESSKIT_UPSTREAM_FAILED' }, 502)

      const json: any = await res.json().catch(() => ({}))
      const communes = Array.isArray(json?.communes) ? json.communes : []
      const normalized = communes
        .map((p: any) => ({
          code: String(p?.code || '').trim(),
          name: String(p?.name || '').trim(),
          administrativeLevel: String(p?.administrativeLevel || '').trim(),
          provinceCode: String(p?.provinceCode || '').trim(),
          provinceName: String(p?.provinceName || '').trim()
        }))
        .filter((p: any) => p.code && p.name)
        .sort((a: any, b: any) => a.name.localeCompare(b.name, 'vi'))

      if (!normalized.length) {
        return c.json({ success: false, error: 'ADDRESSKIT_EMPTY_RESPONSE' }, 502)
      }

      deps.addressKitCache.communes.set(cacheKey, normalized)
      return c.json({ success: true, data: normalized })
    } catch (e: any) {
      return c.json({ success: false, error: e?.message || 'ADDRESSKIT_FETCH_FAILED' }, 500)
    }
  })

  app.post('/api/orders/:id/zalopay-link', async (c) => {
    try {
      await deps.initDB(c.env.DB)
      const id = Number(c.req.param('id') || 0)
      if (!id) return c.json({ success: false, error: 'INVALID_ORDER_ID' }, 400)
      const body: any = await c.req.json().catch(() => ({}))
      const origin = String(body.origin || c.req.header('origin') || '').trim()
      if (!origin) return c.json({ success: false, error: 'MISSING_ORIGIN' }, 400)

      const order = await c.env.DB.prepare(`
        SELECT id, user_id, order_code, total_price, customer_name, customer_phone, product_name, quantity, payment_method, payment_status, payment_provider, payment_link_id, payment_checkout_url, payment_order_code, order_access_token_hash, status
        FROM orders WHERE id=?
      `).bind(id).first() as any
      if (!order) return c.json({ success: false, error: 'ORDER_NOT_FOUND' }, 404)
      if (!await verifyOrderAccess(c, order)) return c.json({ success: false, error: 'FORBIDDEN' }, 403)
      if (['cancelled', 'done'].includes(String(order.status || '').trim().toLowerCase())) {
        return c.json({ success: false, error: 'ORDER_CLOSED' }, 409)
      }
      if (String(order.payment_method || '').toUpperCase() !== 'ZALOPAY') {
        return c.json({ success: false, error: 'PAYMENT_METHOD_NOT_ZALOPAY' }, 400)
      }
      if (String(order.payment_status || '').toLowerCase() === 'paid') {
        return c.json({ success: true, data: { alreadyPaid: true, orderCode: order.order_code } })
      }

      const sync = await deps.syncOrderPaymentWithZaloPay(c.env.DB, c.env, order)
      if (sync.paid) {
        return c.json({ success: true, data: { alreadyPaid: true, orderCode: order.order_code } })
      }

      const config = await deps.getZaloPayConfig(c.env.DB, c.env)
      const missingConfig = deps.getZaloPayMissingConfigKeys(config)
      if (missingConfig.length) {
        return c.json({ success: false, error: 'ZALOPAY_CONFIG_MISSING', missing: missingConfig }, 500)
      }

      const amount = Math.round(Number(order.total_price || 0))
      if (amount <= 0) return c.json({ success: false, error: 'INVALID_ORDER_AMOUNT' }, 400)

      const nowMs = Date.now()
      const appTransId = deps.buildZaloPayAppTransId(Number(order.id || 0), nowMs)
      const successUrl = `${origin}/?order=${encodeURIComponent(order.order_code)}&pay=success&provider=zalopay&closeTab=1`
      const cancelUrl = `${origin}/?order=${encodeURIComponent(order.order_code)}&pay=cancel&provider=zalopay`
      const embedData = JSON.stringify({
        order_id: Number(order.id || 0),
        order_code: String(order.order_code || ''),
        redirecturl: successUrl,
        cancelurl: cancelUrl
      })
      const item = JSON.stringify([
        {
          itemid: String(order.id || ''),
          itemname: String(order.product_name || 'Don hang'),
          itemprice: amount,
          itemquantity: Number(order.quantity || 1) || 1
        }
      ])
      const appUser = String(order.customer_phone || order.customer_name || `user_${order.id}`).slice(0, 50)
      const description = `QHBoypho - Thanh toan don hang #${order.order_code}`.slice(0, 256)
      const callbackUrl = config.callbackUrl || ''

      const macInput = `${config.appIdRaw}|${appTransId}|${appUser}|${amount}|${nowMs}|${embedData}|${item}`
      const mac = await deps.payOSSignWithChecksum(config.key1, macInput)

      const form = new URLSearchParams()
      form.set('app_id', config.appIdRaw)
      form.set('app_user', appUser)
      form.set('app_time', String(nowMs))
      form.set('amount', String(amount))
      form.set('app_trans_id', appTransId)
      form.set('embed_data', embedData)
      form.set('item', item)
      form.set('description', description)
      form.set('expire_duration_seconds', '900')
      form.set('mac', mac)
      if (callbackUrl) form.set('callback_url', callbackUrl)

      const resp = await fetch(config.createEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: form.toString()
      })
      const zaloRes: any = await resp.json().catch(() => ({}))
      const returnCode = Number(zaloRes?.return_code || 0)
      if (!resp.ok || returnCode !== 1 || !zaloRes?.order_url) {
        return c.json({ success: false, error: 'ZALOPAY_CREATE_LINK_FAILED', detail: zaloRes }, 400)
      }

      const orderUpdate = await c.env.DB.prepare(`
        UPDATE orders
        SET payment_provider='ZALOPAY',
            payment_link_id=?,
            updated_at=CURRENT_TIMESTAMP
        WHERE id=?
          AND LOWER(COALESCE(payment_status, '')) <> 'paid'
          AND UPPER(COALESCE(payment_method, ''))='ZALOPAY'
          AND UPPER(COALESCE(NULLIF(payment_provider, ''), 'ZALOPAY'))='ZALOPAY'
          AND (NULLIF(TRIM(COALESCE(payment_link_id, '')), '') IS NULL OR payment_link_id=?)
          AND LOWER(COALESCE(status, '')) NOT IN ('cancelled', 'done')
      `).bind(appTransId, id, appTransId).run()
      if (Number((orderUpdate as any)?.meta?.changes || 0) < 1) {
        return c.json({ success: false, error: 'PAYMENT_ORDER_STATE_CHANGED' }, 409)
      }

      return c.json({
        success: true,
        data: {
          appTransId,
          orderUrl: zaloRes.order_url,
          qrCode: zaloRes.qr_code || '',
          zpTransToken: zaloRes.zp_trans_token || '',
          orderToken: zaloRes.order_token || '',
          orderCode: order.order_code
        }
      })
    } catch (e: any) {
      return c.json({ success: false, error: e.message }, 500)
    }
  })

  app.post('/api/orders/:id/momo-link', async (c) => {
    try {
      await deps.initDB(c.env.DB)
      const id = Number(c.req.param('id') || 0)
      if (!id) return c.json({ success: false, error: 'INVALID_ORDER_ID' }, 400)
      const body: any = await c.req.json().catch(() => ({}))
      const rawOrigin = String(body.origin || c.req.header('origin') || '').trim()
      let origin = ''
      try { origin = new URL(rawOrigin).origin } catch { return c.json({ success: false, error: 'INVALID_ORIGIN' }, 400) }

      const order = await c.env.DB.prepare(`
        SELECT id, user_id, order_code, total_price, product_name, quantity, payment_method, payment_status, payment_provider, payment_link_id, order_access_token_hash, status
        FROM orders WHERE id=?
      `).bind(id).first() as any
      if (!order) return c.json({ success: false, error: 'ORDER_NOT_FOUND' }, 404)
      if (!await verifyOrderAccess(c, order)) return c.json({ success: false, error: 'FORBIDDEN' }, 403)
      if (['cancelled', 'done'].includes(String(order.status || '').trim().toLowerCase())) {
        return c.json({ success: false, error: 'ORDER_CLOSED' }, 409)
      }
      if (String(order.payment_method || '').toUpperCase() !== 'MOMO') {
        return c.json({ success: false, error: 'PAYMENT_METHOD_NOT_MOMO' }, 400)
      }
      if (String(order.payment_status || '').toLowerCase() === 'paid') {
        return c.json({ success: true, data: { alreadyPaid: true, orderCode: order.order_code } })
      }

      const sync = await deps.syncOrderPaymentWithMoMo(c.env.DB, c.env, order)
      if (sync.paid) return c.json({ success: true, data: { alreadyPaid: true, orderCode: order.order_code } })

      const config = await deps.getMoMoConfig(c.env.DB, c.env)
      const missing = deps.getMoMoMissingConfigKeys(config)
      if (missing.length) return c.json({ success: false, error: 'MOMO_CONFIG_MISSING', missing }, 503)

      const amount = Math.round(Number(order.total_price || 0))
      if (amount < 1000) return c.json({ success: false, error: 'MOMO_AMOUNT_BELOW_MINIMUM' }, 400)
      const now = Date.now()
      const momoOrderId = String(order.payment_link_id || '').trim() || deps.buildMoMoOrderId(id, now)
      const requestId = `RQ-${id}-${now}`
      const orderInfo = `QHBoypho - Thanh toan don hang ${order.order_code}`.slice(0, 255)
      const redirectUrl = `${origin}/?order=${encodeURIComponent(order.order_code)}&pay=success&provider=momo&closeTab=1`
      const extraData = btoa(JSON.stringify({ order_id: id, order_code: String(order.order_code || '') }))
      const signature = await deps.payOSSignWithChecksum(config.secretKey, buildMoMoSignaturePayload({
        accessKey: config.accessKey,
        amount,
        extraData,
        ipnUrl: config.ipnUrl,
        orderId: momoOrderId,
        orderInfo,
        partnerCode: config.partnerCode,
        redirectUrl,
        requestId,
        requestType: 'captureWallet'
      }))
      const response = await fetch(config.createEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json; charset=UTF-8' },
        body: JSON.stringify({
          partnerCode: config.partnerCode,
          requestId,
          amount,
          orderId: momoOrderId,
          orderInfo,
          redirectUrl,
          ipnUrl: config.ipnUrl,
          requestType: 'captureWallet',
          extraData,
          lang: 'vi',
          signature
        })
      })
      const momoResponse: any = await response.json().catch(() => ({}))
      if (!response.ok || Number(momoResponse?.resultCode) !== 0 || !momoResponse?.payUrl) {
        return c.json({ success: false, error: 'MOMO_CREATE_LINK_FAILED', detail: momoResponse }, 400)
      }

      const orderUpdate = await c.env.DB.prepare(`
        UPDATE orders
        SET payment_provider='MOMO', payment_link_id=?, payment_checkout_url=?, updated_at=CURRENT_TIMESTAMP
        WHERE id=?
          AND LOWER(COALESCE(payment_status, '')) <> 'paid'
          AND UPPER(COALESCE(payment_method, ''))='MOMO'
          AND UPPER(COALESCE(NULLIF(payment_provider, ''), 'MOMO'))='MOMO'
          AND (NULLIF(TRIM(COALESCE(payment_link_id, '')), '') IS NULL OR payment_link_id=?)
          AND LOWER(COALESCE(status, '')) NOT IN ('cancelled', 'done')
      `).bind(momoOrderId, String(momoResponse.payUrl), id, momoOrderId).run()
      if (Number((orderUpdate as any)?.meta?.changes || 0) < 1) {
        return c.json({ success: false, error: 'PAYMENT_ORDER_STATE_CHANGED' }, 409)
      }
      return c.json({ success: true, data: { orderId: momoOrderId, payUrl: momoResponse.payUrl, qrCodeUrl: momoResponse.qrCodeUrl || '', orderCode: order.order_code } })
    } catch (e: any) {
      return c.json({ success: false, error: e?.message || 'MOMO_CREATE_LINK_FAILED' }, 500)
    }
  })

  const createBankTransferLink = async (c: any) => {
    try {
      await deps.initDB(c.env.DB)
      const id = Number(c.req.param('id') || 0)
      if (!id) return c.json({ success: false, error: 'INVALID_ORDER_ID' }, 400)
      const body: any = await c.req.json().catch(() => ({}))
      const origin = String(body.origin || c.req.header('origin') || '').trim()
      if (!origin) return c.json({ success: false, error: 'MISSING_ORIGIN' }, 400)

      const order = await c.env.DB.prepare(`
        SELECT id, user_id, order_code, total_price, customer_name, customer_phone, product_name, quantity,
               payment_method, payment_status, payment_provider, payment_link_id, payment_checkout_url,
               payment_order_code, order_access_token_hash, status
        FROM orders WHERE id=?
      `).bind(id).first() as any
      if (!order) return c.json({ success: false, error: 'ORDER_NOT_FOUND' }, 404)
      if (!await verifyOrderAccess(c, order)) return c.json({ success: false, error: 'FORBIDDEN' }, 403)
      if (['cancelled', 'done'].includes(String(order.status || '').trim().toLowerCase())) {
        return c.json({ success: false, error: 'ORDER_CLOSED' }, 409)
      }
      if (String(order.payment_method || '').toUpperCase() !== 'BANK_TRANSFER') {
        return c.json({ success: false, error: 'PAYMENT_METHOD_NOT_BANK_TRANSFER' }, 400)
      }
      if (String(order.payment_status || '').toLowerCase() === 'paid') {
        return c.json({ success: true, data: { alreadyPaid: true, orderCode: order.order_code } })
      }

      const bankTransferConfig = await deps.getBankTransferProviderConfig(c.env.DB, c.env)
      const orderProvider = String(order.payment_provider || '').trim().toUpperCase()
      const configuredProvider = String(bankTransferConfig.provider || 'PAYOS').toUpperCase()
      const hasExistingPaymentReference = Boolean(
        String(order.payment_link_id || '').trim()
        || String(order.payment_checkout_url || '').trim()
        || Number(order.payment_order_code || 0)
      )
      const activeProvider = ['PAYOS', 'MANUAL_VIETQR'].includes(orderProvider)
        ? orderProvider
        : (hasExistingPaymentReference ? 'PAYOS' : configuredProvider)
      if (activeProvider === 'MANUAL_VIETQR') {
        const missingManualConfig = getManualVietQRMissingConfigKeys(bankTransferConfig.manualVietQR)
        if (missingManualConfig.length) {
          return c.json({ success: false, error: 'MANUAL_VIETQR_CONFIG_MISSING', missing: missingManualConfig }, 503)
        }
        const manualPayment = deps.buildManualVietQRPaymentData(order, bankTransferConfig.manualVietQR)
        if (orderProvider !== 'MANUAL_VIETQR' || String(order.payment_link_id || '') !== String(manualPayment.transferContent || '')) {
          const orderUpdate = await c.env.DB.prepare(`
            UPDATE orders
            SET payment_provider='MANUAL_VIETQR',
                payment_link_id=?,
                payment_checkout_url=NULL,
                updated_at=CURRENT_TIMESTAMP
            WHERE id=?
              AND LOWER(COALESCE(payment_status, '')) <> 'paid'
              AND UPPER(COALESCE(payment_method, ''))='BANK_TRANSFER'
              AND UPPER(COALESCE(NULLIF(payment_provider, ''), 'MANUAL_VIETQR'))='MANUAL_VIETQR'
              AND LOWER(COALESCE(status, '')) NOT IN ('cancelled', 'done')
              AND (NULLIF(TRIM(COALESCE(payment_link_id, '')), '') IS NULL OR payment_link_id=?)
          `).bind(manualPayment.transferContent || null, id, manualPayment.transferContent || '').run()
          if (Number((orderUpdate as any)?.meta?.changes || 0) < 1) {
            return c.json({ success: false, error: 'PAYMENT_ORDER_STATE_CHANGED' }, 409)
          }
        }
        return c.json({ success: true, data: manualPayment })
      }

      if (activeProvider !== 'PAYOS') {
        return c.json({ success: false, error: 'UNSUPPORTED_BANK_TRANSFER_PROVIDER' }, 503)
      }

      const amount = Math.round(Number(order.total_price || 0))
      if (amount <= 0) return c.json({ success: false, error: 'INVALID_ORDER_AMOUNT' }, 400)

      const sync = await deps.syncOrderPaymentWithPayOS(c.env.DB, c.env, order)
      if (sync.paid) {
        return c.json({ success: true, data: { alreadyPaid: true, orderCode: order.order_code } })
      }

      const existingLinkId = String(order.payment_link_id || '').trim()
      const existingCheckoutUrl = String(order.payment_checkout_url || '').trim()
      const existingPayment = (existingLinkId || order.payment_order_code)
        ? await deps.payOSGetPaymentInfo(c.env.DB, c.env, existingLinkId || order.payment_order_code)
        : null
      if (existingPayment) {
        const existingPaymentStatus = String(existingPayment.status || '').trim().toUpperCase()
        const existingPaymentLinkId = String(existingPayment.id || existingPayment.paymentLinkId || '').trim()
        const existingPaymentOrderCode = Number(existingPayment.orderCode || 0)
        const existingPaymentAmount = Number(existingPayment.amount || existingPayment.amountPaid || 0)
        const existingPaymentCurrency = String(existingPayment.currency || 'VND').trim().toUpperCase()
        const expectedPaymentOrderCode = Number(order.payment_order_code || 0)
        const isExistingPaymentBound = !!existingPaymentLinkId
          && (!existingLinkId || existingPaymentLinkId === existingLinkId)
          && Number.isSafeInteger(existingPaymentOrderCode)
          && existingPaymentOrderCode > 0
          && (!expectedPaymentOrderCode || existingPaymentOrderCode === expectedPaymentOrderCode)
          && existingPaymentCurrency === 'VND'
          && Number.isFinite(existingPaymentAmount)
          && existingPaymentAmount > 0
          && existingPaymentAmount === amount
        if (!isExistingPaymentBound) {
          return c.json({ success: false, error: 'PAYMENT_LINK_MISMATCH' }, 409)
        }
        const existingPaymentCheckoutUrl = String(existingCheckoutUrl || existingPayment.checkoutUrl || (existingPaymentLinkId ? `https://pay.payos.vn/web/${encodeURIComponent(existingPaymentLinkId)}` : '')).trim()
        if (existingPaymentStatus === 'PENDING' && (existingPaymentLinkId || existingPaymentCheckoutUrl)) {
          const orderUpdate = await c.env.DB.prepare(`
            UPDATE orders
            SET payment_link_id=COALESCE(NULLIF(?, ''), payment_link_id),
                payment_checkout_url=COALESCE(NULLIF(?, ''), payment_checkout_url),
                payment_order_code=COALESCE(NULLIF(?, 0), payment_order_code),
                payment_provider='PAYOS',
                updated_at=CURRENT_TIMESTAMP
            WHERE id=?
              AND LOWER(COALESCE(payment_status, '')) <> 'paid'
              AND UPPER(COALESCE(payment_method, ''))='BANK_TRANSFER'
              AND UPPER(COALESCE(NULLIF(payment_provider, ''), 'PAYOS'))='PAYOS'
              AND LOWER(COALESCE(status, '')) NOT IN ('cancelled', 'done')
              AND (NULLIF(TRIM(COALESCE(payment_link_id, '')), '') IS NULL OR payment_link_id=?)
              AND (payment_order_code IS NULL OR payment_order_code=0 OR payment_order_code=?)
              AND total_price=?
          `).bind(
            existingPaymentLinkId || null,
            existingPaymentCheckoutUrl || null,
            existingPaymentOrderCode,
            id,
            existingPaymentLinkId,
            existingPaymentOrderCode,
            amount,
          ).run()
          if (Number((orderUpdate as any)?.meta?.changes || 0) < 1) {
            const latest = await c.env.DB.prepare('SELECT payment_status FROM orders WHERE id=? LIMIT 1').bind(id).first() as any
            if (String(latest?.payment_status || '').toLowerCase() === 'paid') {
              return c.json({ success: true, data: { alreadyPaid: true, orderCode: order.order_code } })
            }
            return c.json({ success: false, error: 'PAYMENT_ORDER_STATE_CHANGED' }, 409)
          }
          return c.json({
            success: true,
            data: {
              paymentLinkId: existingPaymentLinkId || existingPayment.id || '',
              checkoutUrl: existingPaymentCheckoutUrl || '',
              orderCode: order.order_code
            }
          })
        }
      }

      const { clientId, apiKey, checksumKey } = await deps.getPayOSConfig(c.env.DB, c.env)
      if (!clientId || !apiKey || !checksumKey) {
        return c.json({ success: false, error: 'PAYOS_CONFIG_MISSING' }, 500)
      }

      const paymentAttempt = await acquirePayOSPaymentAttempt(c.env.DB, id)
      if (paymentAttempt.action === 'reuse') {
        return c.json({
          success: true,
          data: {
            provider: 'PAYOS',
            paymentLinkId: paymentAttempt.row.payment_link_id || '',
            checkoutUrl: paymentAttempt.row.checkout_url || '',
            orderCode: order.order_code,
          },
        })
      }
      if (paymentAttempt.action === 'stale') {
        const recovered = await recoverStalePayOSAttempt(c, order, paymentAttempt.row, deps)
        if (recovered) {
          return c.json({
            success: true,
            data: {
              provider: 'PAYOS',
              paymentLinkId: recovered.paymentLinkId,
              checkoutUrl: recovered.checkoutUrl,
              orderCode: order.order_code,
              recovered: true,
            },
          })
        }
        await c.env.DB.prepare(`
          UPDATE payment_attempts
          SET status='NEEDS_RECONCILIATION', error_code='PAYOS_ATTEMPT_STALE',
              lease_expires_at=NULL, updated_at=CURRENT_TIMESTAMP
          WHERE id=? AND status='CREATING'
        `).bind(paymentAttempt.row.id).run()
        return c.json({ success: false, error: 'PAYMENT_LINK_REQUIRES_RECONCILIATION' }, 409)
      }
      if (paymentAttempt.action === 'in_progress') {
        return c.json({ success: false, error: 'PAYMENT_LINK_IN_PROGRESS' }, 409)
      }

      const attemptId = Number(paymentAttempt.row.id || 0)
      const orderCodeNum = Number(paymentAttempt.row.provider_order_code || 0)
      if (!Number.isSafeInteger(orderCodeNum) || orderCodeNum <= 0) {
        await c.env.DB.prepare(`UPDATE payment_attempts SET status='FAILED', error_code='INVALID_PROVIDER_ORDER_CODE', lease_expires_at=NULL, updated_at=CURRENT_TIMESTAMP WHERE id=?`).bind(attemptId).run()
        return c.json({ success: false, error: 'INVALID_PROVIDER_ORDER_CODE' }, 500)
      }
      const description = `DH${orderCodeNum}`.slice(0, 25)
      const returnUrl = `${origin}/?order=${encodeURIComponent(order.order_code)}&pay=success&provider=payos&closeTab=1`
      const cancelUrl = `${origin}/?order=${encodeURIComponent(order.order_code)}&pay=cancel&provider=payos`
      const signPayload = { amount, cancelUrl, description, orderCode: orderCodeNum, returnUrl }
      const signature = await deps.payOSSignWithChecksum(checksumKey, deps.payOSBuildDataString(signPayload))
      const reqPayload = {
        orderCode: orderCodeNum,
        amount,
        description,
        buyerName: order.customer_name || '',
        buyerPhone: order.customer_phone || '',
        items: [{ name: order.product_name || 'Don hang', quantity: Number(order.quantity || 1), price: amount }],
        cancelUrl,
        returnUrl,
        signature
      }

      const resp = await fetch('https://api-merchant.payos.vn/v2/payment-requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-client-id': clientId,
          'x-api-key': apiKey
        },
        body: JSON.stringify(reqPayload)
      })
      const payosRes: any = await resp.json().catch(() => ({}))
      if (!resp.ok || String(payosRes.code || '') !== '00' || !payosRes.data) {
        await c.env.DB.prepare(`
          UPDATE payment_attempts
          SET status='FAILED', error_code=?, lease_expires_at=NULL, updated_at=CURRENT_TIMESTAMP
          WHERE id=?
        `).bind(isPayOSTransactionLimitError(resp.status, payosRes) ? 'PAYOS_TRANSACTION_LIMIT' : 'PAYOS_CREATE_LINK_FAILED', attemptId).run()
        return c.json({ success: false, error: 'PAYOS_CREATE_LINK_FAILED', detail: payosRes }, 400)
      }

      const paymentLinkId = String(payosRes.data.paymentLinkId || '').trim()
      const checkoutUrl = String(payosRes.data.checkoutUrl || '').trim()
      if (!paymentLinkId || !checkoutUrl) {
        await c.env.DB.prepare(`
          UPDATE payment_attempts
          SET status='FAILED', error_code='PAYOS_RESPONSE_INCOMPLETE', lease_expires_at=NULL, updated_at=CURRENT_TIMESTAMP
          WHERE id=?
        `).bind(attemptId).run()
        return c.json({ success: false, error: 'PAYOS_RESPONSE_INCOMPLETE' }, 502)
      }

      await c.env.DB.prepare(`
        UPDATE payment_attempts
        SET status='READY', payment_link_id=?, checkout_url=?, provider_order_code=?,
            lease_expires_at=NULL, error_code=NULL, updated_at=CURRENT_TIMESTAMP
        WHERE id=? AND idempotency_key=?
      `).bind(paymentLinkId, checkoutUrl, orderCodeNum, attemptId, paymentAttempt.row.idempotency_key).run()

      const orderUpdate = await c.env.DB.prepare(`
        UPDATE orders
        SET payment_provider='PAYOS',
            payment_link_id=COALESCE(NULLIF(payment_link_id, ''), ?),
            payment_checkout_url=COALESCE(NULLIF(payment_checkout_url, ''), ?),
            payment_order_code=COALESCE(NULLIF(payment_order_code, 0), ?),
            updated_at=CURRENT_TIMESTAMP
        WHERE id=?
          AND LOWER(COALESCE(payment_status, '')) <> 'paid'
          AND UPPER(COALESCE(payment_method, ''))='BANK_TRANSFER'
          AND UPPER(COALESCE(NULLIF(payment_provider, ''), 'PAYOS'))='PAYOS'
          AND (NULLIF(TRIM(COALESCE(payment_link_id, '')), '') IS NULL OR payment_link_id=?)
          AND (NULLIF(TRIM(COALESCE(payment_checkout_url, '')), '') IS NULL OR payment_checkout_url=?)
          AND (payment_order_code IS NULL OR payment_order_code=0 OR payment_order_code=?)
          AND total_price=?
      `).bind(
        paymentLinkId,
        checkoutUrl,
        orderCodeNum,
        id,
        paymentLinkId,
        checkoutUrl,
        orderCodeNum,
        amount,
      ).run()

      if (Number((orderUpdate as any)?.meta?.changes || 0) < 1) {
        const latest = await c.env.DB.prepare('SELECT payment_status, payment_provider, payment_link_id, payment_order_code FROM orders WHERE id=? LIMIT 1').bind(id).first() as any
        const latestPaid = String(latest?.payment_status || '').toLowerCase() === 'paid'
        if (latestPaid) return c.json({ success: true, data: { alreadyPaid: true, orderCode: order.order_code } })
        await c.env.DB.prepare(`
          UPDATE payment_attempts
          SET status='NEEDS_RECONCILIATION', error_code='PAYMENT_ORDER_STATE_CHANGED',
              lease_expires_at=NULL, updated_at=CURRENT_TIMESTAMP
          WHERE id=? AND idempotency_key=?
        `).bind(attemptId, paymentAttempt.row.idempotency_key).run()
        return c.json({ success: false, error: 'PAYMENT_ORDER_STATE_CHANGED' }, 409)
      }

      return c.json({
        success: true,
        data: {
          provider: 'PAYOS',
          paymentLinkId,
          checkoutUrl,
          qrCode: payosRes.data.qrCode,
          orderCode: order.order_code
        }
      })
    } catch (e: any) {
      return c.json({ success: false, error: e.message }, 500)
    }
  }

  app.post('/api/orders/:id/bank-transfer-link', createBankTransferLink)
  app.post('/api/orders/:id/payos-link', (c) => createBankTransferLink(c)) // Legacy alias for /api/orders/:id/bank-transfer-link

  app.post('/api/payments/zalopay/callback', async (c) => {
    try {
      await deps.initDB(c.env.DB)
      const body: any = await c.req.json().catch(() => ({}))
      const cbDataStr = String(body?.data || '')
      const providedMac = String(body?.mac || '').toLowerCase()
      const config = await deps.getZaloPayConfig(c.env.DB, c.env)
      if (!config.key2) {
        return c.json({ return_code: 0, return_message: 'ZALOPAY_CONFIG_MISSING' })
      }
      if (!cbDataStr || !providedMac) {
        return c.json({ return_code: -1, return_message: 'missing_data_or_mac' })
      }

      const expectedMac = await deps.payOSSignWithChecksum(config.key2, cbDataStr)
      if (!timingSafeStringEqual(expectedMac, providedMac)) {
        return c.json({ return_code: -1, return_message: 'mac not equal' })
      }

      const data = deps.parseJsonObject(cbDataStr)
      const appTransId = String(data?.app_trans_id || '').trim()
      const paidAmount = Number(data?.amount || 0)
      const zpTransIdNum = Number(data?.zp_trans_id || 0)
      const embedData = deps.parseJsonObject(data?.embed_data)
      const orderId = Number(embedData?.order_id || 0)
      const orderCode = String(embedData?.order_code || '').trim().toUpperCase()

      let order: any = null
      if (orderId > 0) {
        order = await c.env.DB.prepare(`
          SELECT id, order_code, total_price, payment_status, payment_link_id, payment_provider, payment_method, status, return_status
          FROM orders
          WHERE id=?
          LIMIT 1
        `).bind(orderId).first() as any
      }
      if (!order && orderCode) {
        order = await c.env.DB.prepare(`
          SELECT id, order_code, total_price, payment_status, payment_link_id, payment_provider, payment_method, status, return_status
          FROM orders
          WHERE order_code=?
          LIMIT 1
        `).bind(orderCode).first() as any
      }
      if (!order && appTransId) {
        order = await c.env.DB.prepare(`
          SELECT id, order_code, total_price, payment_status, payment_link_id, payment_provider, payment_method, status, return_status
          FROM orders
          WHERE payment_link_id=?
          LIMIT 1
        `).bind(appTransId).first() as any
      }
      if (!order) {
        return c.json({ return_code: 1, return_message: 'ignored_order_not_found' })
      }
      if (String(order.payment_status || '').toLowerCase() === 'paid') {
        return c.json({ return_code: 2, return_message: 'already_paid' })
      }

      if (String(order.payment_method || '').toUpperCase() !== 'ZALOPAY'
        || !appTransId
        || String(order.payment_link_id || '').trim() !== appTransId) {
        return c.json({ return_code: 1, return_message: 'ignored_order_mismatch' })
      }

      const orderTotal = Number(order.total_price || 0)
      if (orderTotal <= 0 || !Number.isFinite(paidAmount) || paidAmount <= 0 || paidAmount !== orderTotal) {
        return c.json({ return_code: 1, return_message: 'ignored_amount_mismatch' })
      }

      await c.env.DB.prepare(`
        UPDATE orders
        SET payment_status='paid',
            payment_paid_at=COALESCE(payment_paid_at, CURRENT_TIMESTAMP),
            payment_ref=COALESCE(NULLIF(payment_ref, ''), ?),
            payment_provider='ZALOPAY',
            payment_link_id=COALESCE(?, payment_link_id),
            payment_order_code=COALESCE(?, payment_order_code),
            payment_review_required=CASE WHEN LOWER(COALESCE(status, ''))='cancelled' OR LOWER(COALESCE(return_status, '')) IN ('cancelled', 'returned', 'refunded', 'rejected', 'delivery_failed') THEN 1 ELSE COALESCE(payment_review_required, 0) END,
            payment_review_reason=CASE WHEN LOWER(COALESCE(status, ''))='cancelled' OR LOWER(COALESCE(return_status, '')) IN ('cancelled', 'returned', 'refunded', 'rejected', 'delivery_failed') THEN 'PAID_AFTER_CANCELLATION' ELSE payment_review_reason END,
            status=CASE WHEN LOWER(COALESCE(status, ''))='pending' THEN 'confirmed' ELSE status END,
            updated_at=CURRENT_TIMESTAMP
        WHERE id=?
          AND LOWER(COALESCE(payment_status, '')) <> 'paid'
          AND UPPER(COALESCE(payment_method, ''))='ZALOPAY'
          AND UPPER(COALESCE(NULLIF(payment_provider, ''), 'ZALOPAY'))='ZALOPAY'
          AND payment_link_id=?
          AND total_price=?
      `).bind(
        String(data?.zp_trans_id || appTransId || ''),
        appTransId || null,
        Number.isFinite(zpTransIdNum) && zpTransIdNum > 0 ? zpTransIdNum : null,
        order.id,
        appTransId,
        orderTotal,
      ).run()

      return c.json({ return_code: 1, return_message: 'success' })
    } catch (e: any) {
      return c.json({ return_code: 0, return_message: String(e?.message || 'UNKNOWN_ERROR') })
    }
  })

  app.post('/api/payments/momo/ipn', async (c) => {
    try {
      await deps.initDB(c.env.DB)
      const body: any = await c.req.json().catch(() => ({}))
      const config = await deps.getMoMoConfig(c.env.DB, c.env)
      if (!config.partnerCode || !config.accessKey || !config.secretKey) return c.body(null, 503)
      const expectedSignature = await deps.payOSSignWithChecksum(config.secretKey, buildMoMoSignaturePayload({
        accessKey: config.accessKey,
        amount: body?.amount,
        extraData: body?.extraData,
        message: body?.message,
        orderId: body?.orderId,
        orderInfo: body?.orderInfo,
        orderType: body?.orderType,
        partnerCode: body?.partnerCode,
        payType: body?.payType,
        requestId: body?.requestId,
        responseTime: body?.responseTime,
        resultCode: body?.resultCode,
        transId: body?.transId
      }))
      if (!timingSafeStringEqual(String(body?.signature || '').toLowerCase(), expectedSignature)
        || String(body?.partnerCode || '') !== config.partnerCode) {
        return c.json({ success: false, error: 'MOMO_INVALID_SIGNATURE' }, 401)
      }
      if (Number(body?.resultCode) !== 0) return c.body(null, 204)

      const momoOrderId = String(body?.orderId || '').trim()
      const order = await c.env.DB.prepare(`
        SELECT id, order_code, total_price, payment_status, payment_link_id, payment_provider, payment_method, status, return_status
        FROM orders WHERE payment_link_id=? AND UPPER(COALESCE(payment_method, ''))='MOMO' LIMIT 1
      `).bind(momoOrderId).first() as any
      const momoAmount = Number(body?.amount || 0)
      const momoOrderTotal = Math.round(Number(order?.total_price || 0))
      if (!order || momoOrderTotal <= 0 || !Number.isFinite(momoAmount) || momoAmount <= 0 || momoAmount !== momoOrderTotal) {
        return c.json({ success: false, error: 'MOMO_ORDER_MISMATCH' }, 400)
      }
      if (String(order.payment_status || '').toLowerCase() !== 'paid') {
        await c.env.DB.prepare(`
          UPDATE orders
          SET payment_status='paid', payment_paid_at=COALESCE(payment_paid_at, CURRENT_TIMESTAMP), payment_ref=COALESCE(NULLIF(payment_ref, ''), ?), payment_provider='MOMO',
            payment_review_required=CASE WHEN LOWER(COALESCE(status, ''))='cancelled' OR LOWER(COALESCE(return_status, '')) IN ('cancelled', 'returned', 'refunded', 'rejected', 'delivery_failed') THEN 1 ELSE COALESCE(payment_review_required, 0) END,
            payment_review_reason=CASE WHEN LOWER(COALESCE(status, ''))='cancelled' OR LOWER(COALESCE(return_status, '')) IN ('cancelled', 'returned', 'refunded', 'rejected', 'delivery_failed') THEN 'PAID_AFTER_CANCELLATION' ELSE payment_review_reason END,
              status=CASE WHEN LOWER(COALESCE(status, ''))='pending' THEN 'confirmed' ELSE status END, updated_at=CURRENT_TIMESTAMP
          WHERE id=?
            AND LOWER(COALESCE(payment_status, '')) <> 'paid'
            AND UPPER(COALESCE(payment_method, ''))='MOMO'
            AND UPPER(COALESCE(NULLIF(payment_provider, ''), 'MOMO'))='MOMO'
            AND payment_link_id=?
            AND total_price=?
        `).bind(String(body?.transId || '') || null, order.id, momoOrderId, momoOrderTotal).run()
      }
      return c.body(null, 204)
    } catch {
      return c.body(null, 500)
    }
  })

  app.post('/api/payments/payos/webhook', async (c) => {
    try {
      await deps.initDB(c.env.DB)
      const body: any = await c.req.json()
      const { checksumKey } = await deps.getPayOSConfig(c.env.DB, c.env)
      if (!checksumKey) return c.json({ success: false, error: 'PAYOS_CONFIG_MISSING' }, 500)

      if (String(body?.code || '') !== '00' || body?.success !== true) {
        return c.json({ success: true, data: { ignored: true, reason: 'PAYOS_WEBHOOK_NOT_SUCCESS' } })
      }

      const data = body?.data || {}
      const providedSignature = String(body?.signature || '').toLowerCase()
      if (!providedSignature) {
        return c.json({ success: false, error: 'MISSING_SIGNATURE' }, 400)
      }
      const verifyString = deps.payOSBuildDataString(data)
      const expectedSignature = await deps.payOSSignWithChecksum(checksumKey, verifyString)
      if (!timingSafeStringEqual(providedSignature, expectedSignature)) {
        return c.json({ success: false, error: 'INVALID_PAYOS_SIGNATURE' }, 401)
      }

      const payosOrderCode = Number(data?.orderCode || 0)
      if (!Number.isSafeInteger(payosOrderCode) || payosOrderCode <= 0) {
        return c.json({ success: false, error: 'MISSING_ORDER_CODE' }, 400)
      }

      if (String(data?.code || '') !== '00') {
        return c.json({ success: true, data: { ignored: true, reason: 'PAYOS_PAYMENT_NOT_SUCCESS' } })
      }

      const order = await c.env.DB.prepare(`
        SELECT id, order_code, total_price, payment_status, status, payment_order_code,
               payment_link_id, payment_provider, payment_review_required, payment_review_reason, return_status
        FROM orders
        WHERE payment_order_code=?
          AND UPPER(COALESCE(payment_method, ''))='BANK_TRANSFER'
          AND UPPER(COALESCE(NULLIF(payment_provider, ''), 'PAYOS'))='PAYOS'
        LIMIT 1
      `).bind(payosOrderCode).first() as any
      if (!order) {
        return c.json({ success: true, data: { ignored: true, reason: 'ORDER_NOT_FOUND', payosOrderCode } })
      }

      if (String(order.payment_status || '').toLowerCase() === 'paid') {
        return c.json({ success: true, data: { order_code: order.order_code, already_paid: true } })
      }

      if (String(data?.currency || '').trim().toUpperCase() !== 'VND') {
        return c.json({ success: false, error: 'INVALID_CURRENCY' }, 400)
      }

      const paymentLinkId = String(data?.paymentLinkId || '').trim()
      const expectedPaymentLinkId = String(order.payment_link_id || '').trim()
      if (!paymentLinkId || !expectedPaymentLinkId || paymentLinkId !== expectedPaymentLinkId) {
        return c.json({ success: false, error: 'PAYMENT_LINK_MISMATCH' }, 409)
      }

      const totalAmount = Number(order.total_price || 0)
      const paidAmount = Number(data?.amount || 0)
      if (totalAmount <= 0 || !Number.isFinite(totalAmount) || !Number.isFinite(paidAmount) || paidAmount <= 0 || paidAmount !== totalAmount) {
        return c.json({ success: false, error: 'PAYMENT_AMOUNT_MISMATCH' }, 400)
      }

      const paymentRef = String(data?.reference || paymentLinkId).trim()
      const updateResult = await c.env.DB.prepare(`
        UPDATE orders
        SET payment_status='paid',
            payment_paid_at=COALESCE(payment_paid_at, CURRENT_TIMESTAMP),
            payment_ref=COALESCE(NULLIF(payment_ref, ''), ?),
            payment_provider='PAYOS',
            payment_order_code=?,
            payment_link_id=?,
            payment_review_required=CASE WHEN LOWER(COALESCE(status, ''))='cancelled' OR LOWER(COALESCE(return_status, '')) IN ('cancelled', 'returned', 'refunded', 'rejected', 'delivery_failed') THEN 1 ELSE COALESCE(payment_review_required, 0) END,
            payment_review_reason=CASE WHEN LOWER(COALESCE(status, ''))='cancelled' OR LOWER(COALESCE(return_status, '')) IN ('cancelled', 'returned', 'refunded', 'rejected', 'delivery_failed') THEN 'PAID_AFTER_CANCELLATION' ELSE payment_review_reason END,
            status=CASE WHEN LOWER(COALESCE(status, ''))='pending' THEN 'confirmed' ELSE status END,
            updated_at=CURRENT_TIMESTAMP
        WHERE id=?
          AND LOWER(COALESCE(payment_status, '')) <> 'paid'
          AND UPPER(COALESCE(payment_method, ''))='BANK_TRANSFER'
          AND UPPER(COALESCE(NULLIF(payment_provider, ''), 'PAYOS'))='PAYOS'
          AND payment_order_code=?
          AND payment_link_id=?
          AND total_price=?
      `).bind(
        paymentRef || null,
        payosOrderCode,
        paymentLinkId,
        order.id,
        payosOrderCode,
        paymentLinkId,
        totalAmount,
      ).run()

      if (Number((updateResult as any)?.meta?.changes || 0) < 1) {
        const latest = await c.env.DB.prepare('SELECT payment_status, order_code FROM orders WHERE id=? LIMIT 1').bind(order.id).first() as any
        if (String(latest?.payment_status || '').toLowerCase() === 'paid') {
          return c.json({ success: true, data: { order_code: latest.order_code || order.order_code, already_paid: true } })
        }
        return c.json({ success: false, error: 'PAYMENT_STATE_CHANGED' }, 409)
      }

      const lateCancelled = String(order.status || '').toLowerCase() === 'cancelled'
        || ['cancelled', 'returned', 'refunded', 'rejected', 'delivery_failed'].includes(String(order.return_status || '').toLowerCase())
      return c.json({ success: true, data: { order_code: order.order_code, payment_status: 'paid', reconciliation_required: lateCancelled } })
    } catch (e: any) {
      return c.json({ success: false, error: e.message }, 500)
    }
  })

  app.post('/api/payments/payos/confirm-webhook', async (c) => {
    try {
      await deps.initDB(c.env.DB)
      if (!await verifyPaymentSettingsAdmin(c)) {
        return c.json({ success: false, error: 'ADMIN_AUTH_REQUIRED' }, 401)
      }

      const body: any = await c.req.json().catch(() => ({}))
      const canonicalWebhookUrl = getCanonicalPayOSWebhookUrl(c)
      if (!canonicalWebhookUrl) {
        return c.json({ success: false, error: 'PAYOS_WEBHOOK_URL_NOT_CONFIGURED' }, 503)
      }
      const requestedWebhookUrl = String(body.webhookUrl || '').trim()
      if (requestedWebhookUrl && normalizeCanonicalWebhookUrl(requestedWebhookUrl) !== canonicalWebhookUrl) {
        return c.json({ success: false, error: 'INVALID_WEBHOOK_URL' }, 400)
      }

      const { clientId, apiKey } = await deps.getPayOSConfig(c.env.DB, c.env)
      if (!clientId || !apiKey) {
        return c.json({ success: false, error: 'PAYOS_CONFIG_MISSING' }, 500)
      }

      const resp = await fetch('https://api-merchant.payos.vn/confirm-webhook', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-client-id': clientId,
          'x-api-key': apiKey
        },
        body: JSON.stringify({ webhookUrl: canonicalWebhookUrl })
      })
      const data: any = await resp.json().catch(() => ({}))
      if (!resp.ok || String(data.code || '') !== '00') {
        return c.json({ success: false, error: 'PAYOS_CONFIRM_WEBHOOK_FAILED', detail: data }, 400)
      }
      return c.json({ success: true, data })
    } catch (e: any) {
      return c.json({ success: false, error: e.message }, 500)
    }
  })
}
