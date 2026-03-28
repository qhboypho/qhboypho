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

export async function payOSGetPaymentInfo(env: any, id: string | number) {
  const clientId = String(env.PAYOS_CLIENT_ID || '')
  const apiKey = String(env.PAYOS_API_KEY || '')
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

export function getZaloPayConfig(env: any) {
  const appIdRaw = String(env.ZALOPAY_APP_ID || '').trim()
  const appIdNum = Number(appIdRaw)
  const key1 = String(env.ZALOPAY_KEY1 || '').trim()
  const key2 = String(env.ZALOPAY_KEY2 || '').trim()
  const createEndpoint = String(env.ZALOPAY_CREATE_ENDPOINT || 'https://sb-openapi.zalopay.vn/v2/create').trim()
  const queryEndpoint = String(env.ZALOPAY_QUERY_ENDPOINT || 'https://sb-openapi.zalopay.vn/v2/query').trim()
  return {
    appIdRaw,
    appIdNum,
    key1,
    key2,
    createEndpoint,
    queryEndpoint
  }
}

export function getZaloPayMissingConfigKeys(config: ReturnType<typeof getZaloPayConfig>) {
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

  const paymentInfo = await payOSGetPaymentInfo(env, payOSId)
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

  const config = getZaloPayConfig(env)
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
  if (method === 'BANK_TRANSFER') return syncOrderPaymentWithPayOS(db, env, order)
  if (method === 'ZALOPAY') return syncOrderPaymentWithZaloPay(db, env, order)
  const isPaid = String(order?.payment_status || '').toLowerCase() === 'paid'
  return { synced: false, paid: isPaid }
}
