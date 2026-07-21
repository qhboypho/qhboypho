import type { AppBindings } from '../types/app'
import { getRuntimeConfigValues } from './runtimeConfigHelpers'

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

export async function getPayOSConfig(db: D1Database, env: AppBindings) {
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

export async function getBankTransferProviderConfig(db: D1Database, env: AppBindings) {
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
      bankId: String(config.MANUAL_VIETQR_BANK_ID || 'MB').trim() || 'MB',
      accountNo: String(config.MANUAL_VIETQR_ACCOUNT_NO || '0200100441441').trim() || '0200100441441',
      accountName: String(config.MANUAL_VIETQR_ACCOUNT_NAME || 'TRAN CONG HANH').trim() || 'TRAN CONG HANH',
      template: String(config.MANUAL_VIETQR_TEMPLATE || 'compact2').trim() || 'compact2'
    }
  }
}

function getManualOrderTransferContent(order: any) {
  const raw = String(order?.order_code || order?.id || '').replace(/[^a-zA-Z0-9]/g, '')
  return `DH${raw || Math.max(1, Number(order?.id || 0) || 1)}`.slice(0, 25)
}

export function buildManualVietQRPaymentData(order: any, config: Awaited<ReturnType<typeof getBankTransferProviderConfig>>['manualVietQR']) {
  const amount = Math.round(Number(order?.total_price || 0))
  const transferContent = getManualOrderTransferContent(order)
  const bankId = String(config?.bankId || 'MB').trim()
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

export async function payOSGetPaymentInfo(db: D1Database, env: AppBindings, id: string | number) {
  const { clientId, apiKey } = await getPayOSConfig(db, env)
  if (!clientId || !apiKey || !id) return null

  const resp = await fetch(`https://api-merchant.payos.vn/v2/payment-requests/${encodeURIComponent(String(id))}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'x-client-id': clientId,
      'x-api-key': apiKey
    }
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

export async function getZaloPayConfig(db: D1Database, env: AppBindings) {
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

export async function syncOrderPaymentWithPayOS(db: D1Database, env: any, order: any) {
  const isBankTransfer = String(order?.payment_method || '').toUpperCase() === 'BANK_TRANSFER'
  const isPaid = String(order?.payment_status || '').toLowerCase() === 'paid'
  if (!isBankTransfer || isPaid) return { synced: false, paid: isPaid }

  const payOSId = order?.payment_link_id || order?.payment_order_code || order?.id
  if (!payOSId) return { synced: false, paid: false }

  const paymentInfo = await payOSGetPaymentInfo(db, env, payOSId)
  if (!paymentInfo) return { synced: false, paid: false }

  const payStatus = String(paymentInfo.status || '').toUpperCase()
  const amountPaid = Number(paymentInfo.amountPaid || 0)
  const orderTotal = Number(order.total_price || 0)
  const isPayOSPaid = payStatus === 'PAID' && amountPaid >= orderTotal
  if (!isPayOSPaid) return { synced: false, paid: false, paymentInfo }

  await db.prepare(`
    UPDATE orders
    SET payment_status='paid',
        payment_paid_at=COALESCE(payment_paid_at, CURRENT_TIMESTAMP),
        payment_ref=COALESCE(payment_ref, ?),
        payment_provider='PAYOS',
        payment_link_id=COALESCE(payment_link_id, ?),
        payment_order_code=COALESCE(payment_order_code, ?),
        status=CASE WHEN status='pending' THEN 'confirmed' ELSE status END,
        updated_at=CURRENT_TIMESTAMP
    WHERE id=?
  `).bind(
    String(paymentInfo.reference || paymentInfo.id || payOSId),
    String(paymentInfo.id || order.payment_link_id || ''),
    Number(paymentInfo.orderCode || order.payment_order_code || order.id || 0),
    order.id
  ).run()

  return { synced: true, paid: true, paymentInfo }
}

export async function syncOrderPaymentWithZaloPay(db: D1Database, env: any, order: any) {
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
  if (paidAmount > 0 && orderTotal > 0 && paidAmount < orderTotal) {
    return { synced: false, paid: false, paymentInfo: body }
  }

  const zpTransIdNum = Number(body?.zp_trans_id || 0)
  const paymentRef = String(body?.zp_trans_id || appTransId || '')

  await db.prepare(`
    UPDATE orders
    SET payment_status='paid',
        payment_paid_at=COALESCE(payment_paid_at, CURRENT_TIMESTAMP),
        payment_ref=COALESCE(payment_ref, ?),
        payment_provider='ZALOPAY',
        payment_link_id=COALESCE(payment_link_id, ?),
        payment_order_code=COALESCE(payment_order_code, ?),
        status=CASE WHEN status='pending' THEN 'confirmed' ELSE status END,
        updated_at=CURRENT_TIMESTAMP
    WHERE id=?
  `).bind(
    paymentRef || null,
    appTransId || null,
    Number.isFinite(zpTransIdNum) && zpTransIdNum > 0 ? zpTransIdNum : null,
    order.id
  ).run()

  return { synced: true, paid: true, paymentInfo: body }
}

export async function syncOrderPayment(db: D1Database, env: any, order: any) {
  const method = String(order?.payment_method || '').toUpperCase()
  if (method === 'BANK_TRANSFER') {
    const { provider } = await getBankTransferProviderConfig(db, env)
    if (provider === 'MANUAL_VIETQR') return { synced: false, paid: false, provider }
    return syncOrderPaymentWithPayOS(db, env, order)
  }
  if (method === 'ZALOPAY') return syncOrderPaymentWithZaloPay(db, env, order)
  const isPaid = String(order?.payment_status || '').toLowerCase() === 'paid'
  return { synced: false, paid: isPaid }
}
