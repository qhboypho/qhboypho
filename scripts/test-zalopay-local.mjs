import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'

const ROOT = process.cwd()
const DEV_VARS = path.join(ROOT, '.dev.vars')
const BASE_URL = process.env.BASE_URL || 'http://localhost:5173'
const PRODUCT_ID = Number(process.env.PRODUCT_ID || 4)
const FORCE_CREATE_LINK = process.env.ZALOPAY_TEST_CREATE_LINK === '1'

function parseDevVars(filePath) {
  if (!fs.existsSync(filePath)) return {}
  const out = {}
  const lines = fs.readFileSync(filePath, 'utf8').split(/\r?\n/)
  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const idx = trimmed.indexOf('=')
    if (idx < 0) continue
    const key = trimmed.slice(0, idx).trim()
    let value = trimmed.slice(idx + 1).trim()
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1)
    }
    out[key] = value
  }
  return out
}

function hmacSHA256Hex(key, data) {
  return crypto.createHmac('sha256', key).update(data).digest('hex')
}

function vietnamDateYYMMDD(ts = Date.now()) {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Ho_Chi_Minh',
    year: '2-digit',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date(ts))
  const yy = parts.find((p) => p.type === 'year')?.value || '00'
  const mm = parts.find((p) => p.type === 'month')?.value || '01'
  const dd = parts.find((p) => p.type === 'day')?.value || '01'
  return `${yy}${mm}${dd}`
}

function buildAppTransId(orderId, ts = Date.now()) {
  return `${vietnamDateYYMMDD(ts)}_${orderId}_${ts}`.slice(0, 40)
}

async function postJson(url, body) {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  })
  const text = await res.text()
  let json = null
  try { json = JSON.parse(text) } catch { json = { raw: text } }
  return { ok: res.ok, status: res.status, json }
}

async function getJson(url) {
  const res = await fetch(url)
  const text = await res.text()
  let json = null
  try { json = JSON.parse(text) } catch { json = { raw: text } }
  return { ok: res.ok, status: res.status, json }
}

async function main() {
  const env = parseDevVars(DEV_VARS)
  const key2 = env.ZALOPAY_KEY2 || process.env.ZALOPAY_KEY2
  const appId = env.ZALOPAY_APP_ID || process.env.ZALOPAY_APP_ID || '2553'
  const hasCreateLinkConfig = !!(env.ZALOPAY_APP_ID && env.ZALOPAY_KEY1 && env.ZALOPAY_KEY2)

  if (!key2) {
    throw new Error('Missing ZALOPAY_KEY2 in .dev.vars or env')
  }

  const createOrder = await postJson(`${BASE_URL}/api/orders`, {
    customer_name: 'Local Script Test',
    customer_phone: '0987654321',
    customer_address: 'HCM',
    product_id: PRODUCT_ID,
    color: 'Den',
    size: 'M',
    quantity: 1,
    voucher_code: '',
    note: 'test:zalopay-local',
    payment_method: 'ZALOPAY',
  })
  if (!createOrder.ok || !createOrder.json?.id) {
    throw new Error(`Create order failed: ${JSON.stringify(createOrder.json)}`)
  }

  const orderId = Number(createOrder.json.id)
  const orderCode = createOrder.json.order_code
  const orderTotal = Number(createOrder.json.total || 0)

  let appTransId = buildAppTransId(orderId)
  let orderUrl = ''

  if (FORCE_CREATE_LINK || hasCreateLinkConfig) {
    const createLink = await postJson(`${BASE_URL}/api/orders/${orderId}/zalopay-link`, {
      origin: BASE_URL,
    })
    if (createLink.ok && createLink.json?.success) {
      appTransId = String(createLink.json?.data?.appTransId || appTransId)
      orderUrl = String(createLink.json?.data?.orderUrl || '')
    } else if (FORCE_CREATE_LINK) {
      throw new Error(`Create ZaloPay link failed: ${JSON.stringify(createLink.json)}`)
    }
  }

  const callbackPayload = {
    app_id: Number(appId) || Number(String(appId).replace(/\D/g, '')) || 2553,
    app_trans_id: appTransId,
    app_time: Date.now(),
    app_user: 'local-script',
    amount: orderTotal,
    embed_data: JSON.stringify({ order_id: orderId, order_code: orderCode }),
    item: '[]',
    zp_trans_id: Number(`${Date.now()}`.slice(-12)),
    server_time: Date.now(),
    channel: 38,
  }
  const callbackData = JSON.stringify(callbackPayload)
  const callbackMac = hmacSHA256Hex(key2, callbackData)

  const callback = await postJson(`${BASE_URL}/api/payments/zalopay/callback`, {
    data: callbackData,
    mac: callbackMac,
    type: 1,
  })
  if (!callback.ok) {
    throw new Error(`Callback HTTP failed: ${JSON.stringify(callback.json)}`)
  }
  const returnCode = Number(callback.json?.return_code || 0)
  if (returnCode !== 1 && returnCode !== 2) {
    throw new Error(`Callback failed: ${JSON.stringify(callback.json)}`)
  }

  const paymentStatus = await getJson(`${BASE_URL}/api/orders/${encodeURIComponent(orderCode)}/payment-status`)
  if (!paymentStatus.ok || paymentStatus.json?.data?.payment_status !== 'paid') {
    throw new Error(`Payment status check failed: ${JSON.stringify(paymentStatus.json)}`)
  }

  console.log('OK test:zalopay-local')
  console.log(`orderCode=${orderCode}`)
  console.log(`appTransId=${appTransId}`)
  if (orderUrl) console.log(`orderUrl=${orderUrl}`)
}

main().catch((err) => {
  console.error('FAIL test:zalopay-local')
  console.error(err?.message || err)
  process.exit(1)
})
