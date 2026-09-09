import { getRuntimeConfigValues, type RuntimeConfigEnv } from './runtimeConfigHelpers'

/**
 * The payment reconciliation worker only needs runtime payment credentials.
 * Keep this type small so a scheduled worker does not have to construct the
 * unrelated bindings used by the Pages application.
 */
export type PaymentRuntimeEnv = Partial<Pick<RuntimeConfigEnv,
  | 'BANK_TRANSFER_PROVIDER'
  | 'MANUAL_VIETQR_BANK_ID'
  | 'MANUAL_VIETQR_ACCOUNT_NO'
  | 'MANUAL_VIETQR_ACCOUNT_NAME'
  | 'MANUAL_VIETQR_TEMPLATE'
  | 'PAYOS_CLIENT_ID'
  | 'PAYOS_API_KEY'
  | 'PAYOS_CHECKSUM_KEY'
  | 'ZALOPAY_APP_ID'
  | 'ZALOPAY_KEY1'
  | 'ZALOPAY_KEY2'
  | 'ZALOPAY_CREATE_ENDPOINT'
  | 'ZALOPAY_QUERY_ENDPOINT'
  | 'ZALOPAY_CALLBACK_URL'
  | 'MOMO_PARTNER_CODE'
  | 'MOMO_ACCESS_KEY'
  | 'MOMO_SECRET_KEY'
  | 'MOMO_IPN_URL'
  | 'MOMO_CREATE_ENDPOINT'
  | 'MOMO_QUERY_ENDPOINT'
>> & { PAYOS_WEBHOOK_URL?: string }

export function payOSBuildDataString(input: Record<string, any>) {
  const normalize = (v: any) => {
    if (v === null || v === undefined) return ''
    if (typeof v === 'object') return JSON.stringify(v)
    return String(v)
  }
  return Object.keys(input)
    .sort()
    .map((k) => k + '=' + normalize(input[k]))
    .join('&')
}

export async function payOSSignWithChecksum(checksumKey: string, dataString: string) {
  const encoder = new TextEncoder()
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(checksumKey),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )
  const sigBuf = await crypto.subtle.sign('HMAC', key, encoder.encode(dataString))
  return Array.from(new Uint8Array(sigBuf)).map((b) => b.toString(16).padStart(2, '0')).join('')
}

export async function hashOrderAccessToken(token: string) {
  const normalized = String(token || '').trim()
  if (!normalized) return ''
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(`order-access:${normalized}`))
  return Array.from(new Uint8Array(digest)).map((byte) => byte.toString(16).padStart(2, '0')).join('')
}

export async function getPayOSConfig(db: D1Database, env: PaymentRuntimeEnv) {
  const config = await getRuntimeConfigValues(db, env, ['PAYOS_CLIENT_ID', 'PAYOS_API_KEY', 'PAYOS_CHECKSUM_KEY'])
  return {
    clientId: config.PAYOS_CLIENT_ID || '',
    apiKey: config.PAYOS_API_KEY || '',
    checksumKey: config.PAYOS_CHECKSUM_KEY || ''
  }
}

export type BankTransferProvider = 'PAYOS' | 'MANUAL_VIETQR'

function normalizeBankTransferProvider(value: any): BankTransferProvider {
  const provider = String(value || '').trim().toUpperCase()
  if (provider === 'MANUAL' || provider === 'MANUAL_VIETQR' || provider === 'VIETQR') return 'MANUAL_VIETQR'
  return 'PAYOS'
}

export async function getBankTransferProviderConfig(db: D1Database, env: PaymentRuntimeEnv) {
  const config = await getRuntimeConfigValues(db, env, [
    'BANK_TRANSFER_PROVIDER',
    'MANUAL_VIETQR_BANK_ID',
    'MANUAL_VIETQR_ACCOUNT_NO',
    'MANUAL_VIETQR_ACCOUNT_NAME',
    'MANUAL_VIETQR_TEMPLATE'
  ])
  const provider = normalizeBankTransferProvider(config.BANK_TRANSFER_PROVIDER)
  return {
    provider,
    manualVietQR: {
      bankId: String(config.MANUAL_VIETQR_BANK_ID || '').trim(),
      accountNo: String(config.MANUAL_VIETQR_ACCOUNT_NO || '').trim(),
      accountName: String(config.MANUAL_VIETQR_ACCOUNT_NAME || '').trim(),
      template: String(config.MANUAL_VIETQR_TEMPLATE || 'compact2').trim() || 'compact2'
    }
  }
}

export function getManualVietQRMissingConfigKeys(config: any) {
  const missing: string[] = []
  const bankId = String(config?.bankId || '').trim().toUpperCase()
  const accountNo = String(config?.accountNo || '').trim()
  const accountName = String(config?.accountName || '').trim()
  const template = String(config?.template || '').trim().toLowerCase()
  if (!/^[A-Z0-9][A-Z0-9._-]{1,19}$/.test(bankId)) missing.push('MANUAL_VIETQR_BANK_ID')
  if (!/^\d{4,30}$/.test(accountNo)) missing.push('MANUAL_VIETQR_ACCOUNT_NO')
  if (accountName.length < 2 || accountName.length > 100) missing.push('MANUAL_VIETQR_ACCOUNT_NAME')
  if (!/^(compact|compact2|qr_only|print)$/.test(template)) missing.push('MANUAL_VIETQR_TEMPLATE')
  return missing
}

function getManualOrderTransferContent(order: any) {
  const raw = String(order?.order_code || order?.id || '').replace(/[^a-zA-Z0-9]/g, '')
  return `DH${raw || Math.max(1, Number(order?.id || 0) || 1)}`.slice(0, 25)
}

export function buildManualVietQRPaymentData(order: any, config: Awaited<ReturnType<typeof getBankTransferProviderConfig>>['manualVietQR']) {
  const amount = Math.round(Number(order?.total_price || 0))
  const transferContent = getManualOrderTransferContent(order)
  const bankId = String(config?.bankId || '').trim()
  const accountNo = String(config?.accountNo || '').trim()
  const accountName = String(config?.accountName || '').trim()
  const template = String(config?.template || 'compact2').trim()
  const qrCode = `https://img.vietqr.io/image/${encodeURIComponent(bankId)}-${encodeURIComponent(accountNo)}-${encodeURIComponent(template)}.png?amount=${encodeURIComponent(String(amount))}&addInfo=${encodeURIComponent(transferContent)}&accountName=${encodeURIComponent(accountName)}`
  return {
    provider: 'MANUAL_VIETQR',
    checkoutUrl: '',
    paymentLinkId: '',
    qrCode,
    orderCode: order?.order_code || '',
    amount,
    transferContent,
    bankId,
    accountNo,
    accountName,
    template
  }
}

export async function payOSGetPaymentInfo(db: D1Database, env: PaymentRuntimeEnv, id: string | number) {
  const { clientId, apiKey } = await getPayOSConfig(db, env)
  if (!clientId || !apiKey || !id) return null

  const resp = await fetch(`https://api-merchant.payos.vn/v2/payment-requests/${encodeURIComponent(String(id))}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'x-client-id': clientId,
      'x-api-key': apiKey
    },
    signal: AbortSignal.timeout(10_000)
  })
  const body: any = await resp.json().catch(() => ({}))
  if (!resp.ok || String(body?.code || '') !== '00' || !body?.data) return null
  return body.data
}

function getVietnamDatePrefixYYMMDD(ts = Date.now()) {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Ho_Chi_Minh',
    year: '2-digit',
    month: '2-digit',
    day: '2-digit'
  }).formatToParts(new Date(ts))
  const yy = parts.find((p) => p.type === 'year')?.value || '00'
  const mm = parts.find((p) => p.type === 'month')?.value || '01'
  const dd = parts.find((p) => p.type === 'day')?.value || '01'
  return `${yy}${mm}${dd}`
}

export function buildZaloPayAppTransId(orderId: number, ts = Date.now()) {
  const datePrefix = getVietnamDatePrefixYYMMDD(ts)
  const suffix = `${Math.max(1, Number(orderId) || 1)}_${ts}`
  const out = `${datePrefix}_${suffix}`
  return out.length <= 40 ? out : out.slice(0, 40)
}

export function parseJsonObject(input: any) {
  if (!input) return {}
  if (typeof input === 'object') return input
  if (typeof input !== 'string') return {}
  try {
    const parsed = JSON.parse(input)
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    return {}
  }
}

export async function getZaloPayConfig(db: D1Database, env: PaymentRuntimeEnv) {
  const config = await getRuntimeConfigValues(db, env, [
    'ZALOPAY_APP_ID',
    'ZALOPAY_KEY1',
    'ZALOPAY_KEY2',
    'ZALOPAY_CREATE_ENDPOINT',
    'ZALOPAY_QUERY_ENDPOINT',
    'ZALOPAY_CALLBACK_URL'
  ])
  const appIdRaw = String(config.ZALOPAY_APP_ID || '').trim()
  const appIdNum = Number(appIdRaw)
  const key1 = String(config.ZALOPAY_KEY1 || '').trim()
  const key2 = String(config.ZALOPAY_KEY2 || '').trim()
  const createEndpoint = String(config.ZALOPAY_CREATE_ENDPOINT || 'https://sb-openapi.zalopay.vn/v2/create').trim()
  const queryEndpoint = String(config.ZALOPAY_QUERY_ENDPOINT || 'https://sb-openapi.zalopay.vn/v2/query').trim()
  const callbackUrl = String(config.ZALOPAY_CALLBACK_URL || '').trim()
  return {
    appIdRaw,
    appIdNum,
    key1,
    key2,
    createEndpoint,
    queryEndpoint,
    callbackUrl
  }
}

export function getZaloPayMissingConfigKeys(config: Awaited<ReturnType<typeof getZaloPayConfig>>) {
  const missing: string[] = []
  if (!config.appIdRaw || !Number.isFinite(config.appIdNum) || config.appIdNum <= 0) missing.push('ZALOPAY_APP_ID')
  if (!config.key1) missing.push('ZALOPAY_KEY1')
  if (!config.key2) missing.push('ZALOPAY_KEY2')
  return missing
}

export async function getMoMoConfig(db: D1Database, env: PaymentRuntimeEnv) {
  const config = await getRuntimeConfigValues(db, env, [
    'MOMO_PARTNER_CODE',
    'MOMO_ACCESS_KEY',
    'MOMO_SECRET_KEY',
    'MOMO_IPN_URL',
    'MOMO_CREATE_ENDPOINT',
    'MOMO_QUERY_ENDPOINT'
  ])
  return {
    partnerCode: String(config.MOMO_PARTNER_CODE || '').trim(),
    accessKey: String(config.MOMO_ACCESS_KEY || '').trim(),
    secretKey: String(config.MOMO_SECRET_KEY || '').trim(),
    ipnUrl: String(config.MOMO_IPN_URL || '').trim(),
    createEndpoint: String(config.MOMO_CREATE_ENDPOINT || 'https://test-payment.momo.vn/v2/gateway/api/create').trim(),
    queryEndpoint: String(config.MOMO_QUERY_ENDPOINT || 'https://test-payment.momo.vn/v2/gateway/api/query').trim()
  }
}

export function getMoMoMissingConfigKeys(config: Awaited<ReturnType<typeof getMoMoConfig>>) {
  const missing: string[] = []
  if (!config.partnerCode) missing.push('MOMO_PARTNER_CODE')
  if (!config.accessKey) missing.push('MOMO_ACCESS_KEY')
  if (!config.secretKey) missing.push('MOMO_SECRET_KEY')
  if (!config.ipnUrl || !/^https:\/\//i.test(config.ipnUrl)) missing.push('MOMO_IPN_URL')
  return missing
}

export function buildMoMoOrderId(orderId: number, ts = Date.now()) {
  return `MOMO-${Math.max(1, Number(orderId) || 1)}-${ts}`
}

export function buildMoMoSignaturePayload(input: Record<string, unknown>) {
  return Object.keys(input)
    .sort()
    .map((key) => `${key}=${input[key] == null ? '' : String(input[key])}`)
    .join('&')
}

export const ADDRESS_KIT_BASE_URL = 'https://production.cas.so/address-kit'
export const addressKitCache = {
  provinces: new Map<string, any[]>(),
  communes: new Map<string, any[]>()
}

export function sanitizeAddressEffectiveDate(input: string) {
  const raw = String(input || '').trim()
  if (!raw) return 'latest'
  if (raw === 'latest') return raw
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw
  return 'latest'
}

export async function syncOrderPaymentWithPayOS(db: D1Database, env: PaymentRuntimeEnv, order: any) {
  const isBankTransfer = String(order?.payment_method || '').toUpperCase() === 'BANK_TRANSFER'
  const isPaid = String(order?.payment_status || '').toLowerCase() === 'paid'
  if (!isBankTransfer || isPaid) return { synced: false, paid: isPaid }

  const payOSId = String(order?.payment_link_id || '').trim()
  if (!payOSId) return { synced: false, paid: false }

  const paymentInfo = await payOSGetPaymentInfo(db, env, payOSId)
  if (!paymentInfo) return { synced: false, paid: false }

  const payStatus = String(paymentInfo.status || '').toUpperCase()
  const amountPaid = Number(paymentInfo.amountPaid || 0)
  const orderTotal = Number(order.total_price || 0)
  const orderPaymentLinkId = String(order?.payment_link_id || '').trim()
  const paymentLinkId = String(paymentInfo?.id || paymentInfo?.paymentLinkId || '').trim()
  const expectedOrderCode = Number(order?.payment_order_code || 0)
  const providerOrderCode = Number(paymentInfo?.orderCode || 0)
  // PayOS's payment-request query response is VND-only and, unlike its
  // webhook payload, does not include a currency field. Reject an explicit
  // non-VND value, while treating the omitted field according to that API
  // contract.
  const currency = String(paymentInfo?.currency || 'VND').trim().toUpperCase()
  const isBoundToOrder = !!orderPaymentLinkId
    && !!paymentLinkId
    && paymentLinkId === orderPaymentLinkId
    && Number.isSafeInteger(expectedOrderCode)
    && expectedOrderCode > 0
    && Number.isSafeInteger(providerOrderCode)
    && providerOrderCode === expectedOrderCode
  const isPayOSPaid = payStatus === 'PAID'
    && currency === 'VND'
    && orderTotal > 0
    && Number.isFinite(amountPaid)
    && amountPaid > 0
    && amountPaid === orderTotal
    && isBoundToOrder
  if (!isPayOSPaid) return { synced: false, paid: false, paymentInfo }

  const updateResult = await db.prepare(`
    UPDATE orders
    SET payment_status='paid',
        payment_paid_at=COALESCE(payment_paid_at, CURRENT_TIMESTAMP),
        payment_ref=COALESCE(NULLIF(payment_ref, ''), ?),
        payment_provider='PAYOS',
        payment_link_id=?,
        payment_order_code=?,
        payment_review_required=CASE WHEN LOWER(COALESCE(status, ''))='cancelled' OR LOWER(COALESCE(return_status, '')) IN ('cancelled', 'returned', 'refunded', 'rejected', 'delivery_failed') THEN 1 ELSE COALESCE(payment_review_required, 0) END,
        payment_review_reason=CASE WHEN LOWER(COALESCE(status, ''))='cancelled' OR LOWER(COALESCE(return_status, '')) IN ('cancelled', 'returned', 'refunded', 'rejected', 'delivery_failed') THEN 'PAID_AFTER_CANCELLATION' ELSE payment_review_reason END,
        status=CASE WHEN LOWER(COALESCE(status, ''))='pending' THEN 'confirmed' ELSE status END,
        updated_at=CURRENT_TIMESTAMP
    WHERE id=?
      AND LOWER(COALESCE(payment_status, '')) <> 'paid'
      AND UPPER(COALESCE(payment_method, ''))='BANK_TRANSFER'
      AND UPPER(COALESCE(NULLIF(payment_provider, ''), 'PAYOS'))='PAYOS'
      AND payment_link_id=?
      AND payment_order_code=?
      AND total_price=?
  `).bind(
    String(paymentInfo.reference || paymentInfo.id || payOSId),
    orderPaymentLinkId,
    expectedOrderCode,
    order.id,
    orderPaymentLinkId,
    expectedOrderCode,
    orderTotal,
  ).run()

  const latest = await db.prepare('SELECT payment_status, payment_review_required FROM orders WHERE id=? LIMIT 1').bind(order.id).first() as any
  const latestPaid = String(latest?.payment_status || '').toLowerCase() === 'paid'
  const reconciliationRequired = Number(latest?.payment_review_required || 0) === 1
  if (Number((updateResult as any)?.meta?.changes || 0) < 1) {
    return { synced: latestPaid, paid: latestPaid, paymentInfo, reconciliationRequired }
  }

  return { synced: true, paid: true, paymentInfo, reconciliationRequired }
}

export async function syncOrderPaymentWithZaloPay(db: D1Database, env: PaymentRuntimeEnv, order: any) {
  const isZaloPay = String(order?.payment_method || '').toUpperCase() === 'ZALOPAY'
  const isPaid = String(order?.payment_status || '').toLowerCase() === 'paid'
  if (!isZaloPay || isPaid) return { synced: false, paid: isPaid }

  const config = await getZaloPayConfig(db, env)
  if (!config.appIdRaw || !Number.isFinite(config.appIdNum) || config.appIdNum <= 0 || !config.key1) {
    return { synced: false, paid: false }
  }

  const appTransId = String(order?.payment_link_id || '').trim()
  if (!appTransId) return { synced: false, paid: false }

  const macData = `${config.appIdRaw}|${appTransId}|${config.key1}`
  const mac = await payOSSignWithChecksum(config.key1, macData)
  const form = new URLSearchParams()
  form.set('app_id', config.appIdRaw)
  form.set('app_trans_id', appTransId)
  form.set('mac', mac)

  const resp = await fetch(config.queryEndpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: form.toString()
  })
  const body: any = await resp.json().catch(() => ({}))
  const returnCode = Number(body?.return_code || 0)
  if (!resp.ok || returnCode !== 1) {
    return { synced: false, paid: false, paymentInfo: body }
  }

  const paidAmount = Number(body?.amount || 0)
  const orderTotal = Number(order?.total_price || 0)
  if (orderTotal <= 0 || !Number.isFinite(paidAmount) || paidAmount <= 0 || paidAmount !== orderTotal) {
    return { synced: false, paid: false, paymentInfo: body }
  }

  const zpTransIdNum = Number(body?.zp_trans_id || 0)
  const paymentRef = String(body?.zp_trans_id || appTransId || '')

  const updateResult = await db.prepare(`
    UPDATE orders
    SET payment_status='paid',
        payment_paid_at=COALESCE(payment_paid_at, CURRENT_TIMESTAMP),
        payment_ref=COALESCE(NULLIF(payment_ref, ''), ?),
        payment_provider='ZALOPAY',
        payment_link_id=COALESCE(payment_link_id, ?),
        payment_order_code=COALESCE(payment_order_code, ?),
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
    paymentRef || null,
    appTransId || null,
    Number.isFinite(zpTransIdNum) && zpTransIdNum > 0 ? zpTransIdNum : null,
    order.id,
    appTransId,
    orderTotal,
  ).run()

  const latest = await db.prepare('SELECT payment_status, payment_review_required FROM orders WHERE id=? LIMIT 1').bind(order.id).first() as any
  const latestPaid = String(latest?.payment_status || '').toLowerCase() === 'paid'
  const reconciliationRequired = Number(latest?.payment_review_required || 0) === 1
  if (Number((updateResult as any)?.meta?.changes || 0) < 1) {
    return { synced: latestPaid, paid: latestPaid, paymentInfo: body, reconciliationRequired }
  }

  return { synced: true, paid: true, paymentInfo: body, reconciliationRequired }
}

export async function syncOrderPaymentWithMoMo(db: D1Database, env: PaymentRuntimeEnv, order: any) {
  const isMoMo = String(order?.payment_method || '').toUpperCase() === 'MOMO'
  const isPaid = String(order?.payment_status || '').toLowerCase() === 'paid'
  if (!isMoMo || isPaid) return { synced: false, paid: isPaid }

  const config = await getMoMoConfig(db, env)
  if (!config.partnerCode || !config.accessKey || !config.secretKey) return { synced: false, paid: false }
  const orderId = String(order?.payment_link_id || '').trim()
  if (!orderId) return { synced: false, paid: false }

  const requestId = `query-${orderId}-${Date.now()}`.slice(0, 50)
  const signature = await payOSSignWithChecksum(config.secretKey, buildMoMoSignaturePayload({
    accessKey: config.accessKey,
    orderId,
    partnerCode: config.partnerCode,
    requestId
  }))
  const response = await fetch(config.queryEndpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json; charset=UTF-8' },
    body: JSON.stringify({ partnerCode: config.partnerCode, requestId, orderId, lang: 'vi', signature }),
    signal: AbortSignal.timeout(10_000)
  })
  const paymentInfo: any = await response.json().catch(() => ({}))
  if (!response.ok || Number(paymentInfo?.resultCode) !== 0) {
    return { synced: false, paid: false, paymentInfo }
  }
  const orderTotal = Math.round(Number(order?.total_price || 0))
  if (orderTotal <= 0 || Number(paymentInfo?.amount || 0) <= 0 || Number(paymentInfo?.amount || 0) !== orderTotal) {
    return { synced: false, paid: false, paymentInfo }
  }

  const updateResult = await db.prepare(`
    UPDATE orders
    SET payment_status='paid',
        payment_paid_at=COALESCE(payment_paid_at, CURRENT_TIMESTAMP),
        payment_ref=COALESCE(NULLIF(payment_ref, ''), ?),
        payment_provider='MOMO',
        payment_link_id=COALESCE(payment_link_id, ?),
        payment_review_required=CASE WHEN LOWER(COALESCE(status, ''))='cancelled' OR LOWER(COALESCE(return_status, '')) IN ('cancelled', 'returned', 'refunded', 'rejected', 'delivery_failed') THEN 1 ELSE COALESCE(payment_review_required, 0) END,
        payment_review_reason=CASE WHEN LOWER(COALESCE(status, ''))='cancelled' OR LOWER(COALESCE(return_status, '')) IN ('cancelled', 'returned', 'refunded', 'rejected', 'delivery_failed') THEN 'PAID_AFTER_CANCELLATION' ELSE payment_review_reason END,
        status=CASE WHEN LOWER(COALESCE(status, ''))='pending' THEN 'confirmed' ELSE status END,
        updated_at=CURRENT_TIMESTAMP
    WHERE id=?
      AND LOWER(COALESCE(payment_status, '')) <> 'paid'
      AND UPPER(COALESCE(payment_method, ''))='MOMO'
      AND UPPER(COALESCE(NULLIF(payment_provider, ''), 'MOMO'))='MOMO'
      AND payment_link_id=?
      AND total_price=?
  `).bind(
    String(paymentInfo?.transId || '') || null,
    orderId,
    order.id,
    orderId,
    orderTotal,
  ).run()

  const latest = await db.prepare('SELECT payment_status, payment_review_required FROM orders WHERE id=? LIMIT 1').bind(order.id).first() as any
  const latestPaid = String(latest?.payment_status || '').toLowerCase() === 'paid'
  const reconciliationRequired = Number(latest?.payment_review_required || 0) === 1
  if (Number((updateResult as any)?.meta?.changes || 0) < 1) {
    return { synced: latestPaid, paid: latestPaid, paymentInfo, reconciliationRequired }
  }

  return { synced: true, paid: true, paymentInfo, reconciliationRequired }
}

export async function syncOrderPayment(db: D1Database, env: any, order: any) {
  const method = String(order?.payment_method || '').toUpperCase()
  if (method === 'BANK_TRANSFER') {
    const orderProvider = String(order?.payment_provider || '').trim().toUpperCase()
    const provider = orderProvider === 'MANUAL_VIETQR' || orderProvider === 'PAYOS'
      ? orderProvider
      : (await getBankTransferProviderConfig(db, env)).provider
    if (provider === 'MANUAL_VIETQR') return { synced: false, paid: false, provider }
    return syncOrderPaymentWithPayOS(db, env, order)
  }
  if (method === 'ZALOPAY') return syncOrderPaymentWithZaloPay(db, env, order)
  if (method === 'MOMO') return syncOrderPaymentWithMoMo(db, env, order)
  const isPaid = String(order?.payment_status || '').toLowerCase() === 'paid'
  return { synced: false, paid: isPaid }
}

const MAX_PAYMENT_RECONCILIATION_BATCH = 100

export type PaymentReconciliationResult = {
  scanned: number
  paid: number
  pending: number
  failed: number
  results: Array<{ orderId: number, orderCode: string, paid: boolean, error?: string }>
}

/**
 * Reconcile a bounded, oldest-first batch of online payments. Failed checks
 * are delayed in the attempts table so an expired old payment cannot starve
 * newer pending orders on every scheduled run. Cancelled orders remain in the
 * scan because a late payment must be recorded and flagged for review.
 */
export async function reconcilePendingPayments(
  db: D1Database,
  env: PaymentRuntimeEnv,
  limit = 25,
): Promise<PaymentReconciliationResult> {
  const requestedLimit = Number.isFinite(Number(limit)) ? Math.floor(Number(limit)) : 25
  const safeLimit = Math.min(MAX_PAYMENT_RECONCILIATION_BATCH, Math.max(1, requestedLimit))
  const rowsResult = await db.prepare(`
    SELECT
      o.id, o.order_code, o.total_price, o.payment_method, o.payment_status,
      o.payment_provider, o.payment_link_id, o.payment_order_code, o.status,
      o.created_at
    FROM orders o
    LEFT JOIN payment_reconciliation_attempts a ON a.order_id=o.id
    WHERE LOWER(COALESCE(o.payment_status, 'unpaid')) <> 'paid'
      AND UPPER(COALESCE(o.payment_method, '')) IN ('BANK_TRANSFER', 'ZALOPAY', 'MOMO')
      AND (NULLIF(TRIM(COALESCE(o.payment_link_id, '')), '') IS NOT NULL OR o.payment_order_code IS NOT NULL)
      AND (a.next_attempt_at IS NULL OR a.next_attempt_at <= CURRENT_TIMESTAMP)
    ORDER BY datetime(COALESCE(a.next_attempt_at, o.created_at)) ASC,
             datetime(o.created_at) ASC,
             o.id ASC
    LIMIT ?
  `).bind(safeLimit).all()

  const rows = (rowsResult.results || []) as any[]
  const output: PaymentReconciliationResult = {
    scanned: rows.length,
    paid: 0,
    pending: 0,
    failed: 0,
    results: [],
  }

  for (const order of rows) {
    const orderId = Number(order.id || 0)
    const orderCode = String(order.order_code || '')
    try {
      const sync = await syncOrderPayment(db, env, order)
      if (sync?.paid) {
        output.paid++
        output.results.push({ orderId, orderCode, paid: true })
        await db.prepare('DELETE FROM payment_reconciliation_attempts WHERE order_id=?').bind(orderId).run()
        continue
      }

      output.pending++
      output.results.push({ orderId, orderCode, paid: false })
      await db.prepare(`
        INSERT INTO payment_reconciliation_attempts
          (order_id, attempt_count, last_attempt_at, next_attempt_at, last_result, updated_at)
        VALUES (?, 1, CURRENT_TIMESTAMP, datetime('now', '+10 minutes'), 'PENDING', CURRENT_TIMESTAMP)
        ON CONFLICT(order_id) DO UPDATE SET
          attempt_count=payment_reconciliation_attempts.attempt_count + 1,
          last_attempt_at=CURRENT_TIMESTAMP,
          next_attempt_at=datetime('now', '+10 minutes'),
          last_result='PENDING',
          updated_at=CURRENT_TIMESTAMP
      `).bind(orderId).run()
    } catch (error: any) {
      const errorCode = String(error?.code || error?.message || 'RECONCILIATION_FAILED').slice(0, 160)
      output.failed++
      output.results.push({ orderId, orderCode, paid: false, error: errorCode })
      await db.prepare(`
        INSERT INTO payment_reconciliation_attempts
          (order_id, attempt_count, last_attempt_at, next_attempt_at, last_result, updated_at)
        VALUES (?, 1, CURRENT_TIMESTAMP, datetime('now', '+10 minutes'), ?, CURRENT_TIMESTAMP)
        ON CONFLICT(order_id) DO UPDATE SET
          attempt_count=payment_reconciliation_attempts.attempt_count + 1,
          last_attempt_at=CURRENT_TIMESTAMP,
          next_attempt_at=datetime('now', '+10 minutes'),
          last_result=excluded.last_result,
          updated_at=CURRENT_TIMESTAMP
      `).bind(orderId, errorCode).run()
    }
  }

  return output
}
