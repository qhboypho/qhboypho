import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'

const ROOT = process.cwd()
const DEV_VARS = path.join(ROOT, '.dev.vars')
const BASE_URL = process.env.BASE_URL || 'http://localhost:5173'
const PRODUCT_ID = Number(process.env.PRODUCT_ID || 4)

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

function signPayload(data, checksumKey) {
  const dataStr = Object.keys(data)
    .sort()
    .map((k) => `${k}=${String(data[k] ?? '')}`)
    .join('&')
  return crypto.createHmac('sha256', checksumKey).update(dataStr).digest('hex')
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
  const checksum = env.PAYOS_CHECKSUM_KEY || process.env.PAYOS_CHECKSUM_KEY
  if (!checksum) {
    throw new Error('Missing PAYOS_CHECKSUM_KEY in .dev.vars or env')
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
    note: 'test:payos-local',
    payment_method: 'BANK_TRANSFER',
  })
  if (!createOrder.ok || !createOrder.json?.id) {
    throw new Error(`Create order failed: ${JSON.stringify(createOrder.json)}`)
  }

  const orderId = Number(createOrder.json.id)
  const orderCode = createOrder.json.order_code
  const orderTotal = Number(createOrder.json.total || 0)

  const payosLink = await postJson(`${BASE_URL}/api/orders/${orderId}/payos-link`, {
    origin: BASE_URL,
  })
  if (!payosLink.ok || !payosLink.json?.success) {
    throw new Error(`Create PayOS link failed: ${JSON.stringify(payosLink.json)}`)
  }

  const paymentLinkId = payosLink.json?.data?.paymentLinkId || ''
  const webhookData = {
    orderCode: orderId,
    amount: orderTotal,
    status: 'PAID',
    paymentLinkId,
    description: `DH${orderId}`,
  }
  const signature = signPayload(webhookData, checksum)
  const webhookBody = {
    code: '00',
    desc: 'success',
    success: true,
    data: webhookData,
    signature,
  }

  const webhook = await postJson(`${BASE_URL}/api/payments/payos/webhook`, webhookBody)
  if (!webhook.ok || !webhook.json?.success) {
    throw new Error(`Webhook failed: ${JSON.stringify(webhook.json)}`)
  }

  const paymentStatus = await getJson(`${BASE_URL}/api/orders/${encodeURIComponent(orderCode)}/payment-status`)
  if (!paymentStatus.ok || paymentStatus.json?.data?.payment_status !== 'paid') {
    throw new Error(`Payment status check failed: ${JSON.stringify(paymentStatus.json)}`)
  }

  console.log('OK test:payos-local')
  console.log(`orderCode=${orderCode}`)
  console.log(`paymentLinkId=${paymentLinkId}`)
  console.log(`checkoutUrl=${payosLink.json?.data?.checkoutUrl || ''}`)
}

main().catch((err) => {
  console.error('FAIL test:payos-local')
  console.error(err?.message || err)
  process.exit(1)
})

