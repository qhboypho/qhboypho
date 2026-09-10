import assert from 'node:assert/strict'
import { randomBytes } from 'node:crypto'

// Intentionally fixed targets: this test writes synthetic orders, never prod.
const base = 'https://qhclothes-release-staging.pages.dev'
const database = '03832596-0ded-4fea-993f-a9a65892d8b7'
const account = '4713c2b0ffcb83a2ee325b6cce8a0181'
const apiToken = process.env.CLOUDFLARE_API_TOKEN
assert.ok(apiToken, 'CLOUDFLARE_API_TOKEN is required; never print it')
const metadataResponse = await fetch(`https://api.cloudflare.com/client/v4/accounts/${account}/pages/projects/qhclothes-release-staging`, {
  headers: { Authorization: `Bearer ${apiToken}` }
})
const metadata = await metadataResponse.json()
assert.equal(metadata.success, true, 'Cannot verify staging isolation')
const deployment = metadata.result.deployment_configs.production
assert.equal(deployment.d1_databases.DB.id, database, 'Staging Pages must bind to the isolated DB')
assert.equal(Object.keys(deployment.env_vars || {}).some(key => /^(PAYOS_|GHTK_|GHN_|MOMO_|ZALOPAY_|TELEGRAM_|NHANH_)/.test(key)), false, 'Staging must have no external provider credentials')
const sql = async (query, params = []) => {
  const response = await fetch(`https://api.cloudflare.com/client/v4/accounts/${account}/d1/database/${database}/query`, {
    method: 'POST', headers: { Authorization: `Bearer ${apiToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ sql: query, params })
  })
  const result = await response.json()
  assert.equal(result.success, true, `Staging SQL failed: HTTP ${response.status}`)
  return result.result[0].results
}
const request = async (method, path, body, headers = {}) => {
  const response = await fetch(base + path, {
    method, headers: { Origin: base, 'Content-Type': 'application/json', ...headers },
    ...(body === undefined ? {} : { body: JSON.stringify(body) })
  })
  return { status: response.status, body: await response.json() }
}
const configured = await sql("SELECT key FROM app_settings WHERE (key LIKE 'payos_%' OR key LIKE 'ghtk_%' OR key LIKE 'ghn_%' OR key LIKE 'telegram_%') AND length(trim(value)) > 0")
assert.equal(configured.length, 0, 'Staging must not have live provider credentials/settings')
const session = randomBytes(32).toString('hex')
const cookie = `admin_token=${session}; admin_user_key=admin`
const sessionRows = await sql("SELECT key FROM app_settings WHERE key='admin_session_admin'")
assert.equal(sessionRows.length, 0, 'Do not replace an existing admin session')
await sql("INSERT INTO app_settings(key,value) VALUES('admin_session_admin',?)", [session])
try {
  // Use the existing, scoped test-customer exception so reruns do not disable
  // global anti-abuse rules. Always revoke it in finally.
  await sql("INSERT INTO daily_order_limit_overrides(customer_phone,override_date,reason,expires_at,is_active) VALUES('0900000099',date('now','+7 hours'),'isolated staging smoke',datetime('now','+10 minutes'),1) ON CONFLICT(customer_phone,override_date) DO UPDATE SET expires_at=excluded.expires_at,is_active=1,revoked_at=NULL WHERE daily_order_limit_overrides.reason='isolated staging smoke'")
  assert.equal((await request('GET', '/api/admin/orders')).status, 401)
  const sku = (await sql("SELECT id,stock FROM product_skus WHERE product_id=1 AND color='Đen' AND size='M' LIMIT 1"))[0]
  const suffix = randomBytes(8).toString('hex')
  const access = randomBytes(32).toString('hex')
  const order = {
    customer_name: 'STAGING TEST - DO NOT SHIP', customer_phone: '0900000099',
    customer_address: '1 Test Street, Phường Bến Nghé, Quận 1, Thành phố Hồ Chí Minh',
    product_id: 1, color: 'Đen', size: 'M', quantity: 1, payment_method: 'COD',
    order_access_token: access, idempotency_key: `staging-${suffix}`, device_id: `staging-${suffix}`
  }
  const created = await request('POST', '/api/orders', order)
  assert.equal(created.body.success, true, `COD rejected: ${created.body.error || created.status}`)
  const id = created.body.id
  const retry = await request('POST', '/api/orders', order)
  assert.equal(retry.body.id, id, 'Retry must reuse original order')
  assert.equal((await sql('SELECT stock FROM product_skus WHERE id=?', [sku.id]))[0].stock, sku.stock - 1)
  const admin = await request('GET', '/api/admin/orders', undefined, { Cookie: cookie })
  assert.equal(admin.status, 200)
  assert.ok(JSON.stringify(admin.body).includes('STAGING TEST - DO NOT SHIP'), 'Order must appear in admin')
  // Convert only this synthetic row to unpaid bank transfer to test the guard
  // without creating a merchant payment session or contacting a carrier.
  await sql("UPDATE orders SET payment_method='BANK_TRANSFER',payment_status='unpaid' WHERE id=?", [id])
  const denied = await request('POST', `/api/orders/${id}/bank-transfer-link`, {})
  assert.equal(denied.status, 403, 'Payment link needs the guest access token')
  const unconfigured = await request('POST', `/api/orders/${id}/bank-transfer-link`, {}, { 'X-Order-Access-Token': access })
  assert.equal(unconfigured.body.error, 'PAYOS_CONFIG_MISSING', 'Missing PayOS config must fail closed, not return a manual QR')
  const shipping = await request('POST', '/api/admin/orders/arrange-shipping', { ids: [id] }, { Cookie: cookie })
  assert.ok(shipping.body.failed?.some(item => item.id === id && item.error === 'SHIPPING_PAYMENT_REQUIRED'), 'Must reach the unpaid-order guard, not an unrelated input error')
  const final = (await sql('SELECT shipping_arranged,shipping_tracking_code FROM orders WHERE id=?', [id]))[0]
  assert.equal(final.shipping_arranged, 0)
  assert.ok(!final.shipping_tracking_code)
  assert.equal((await sql('SELECT COUNT(*) AS n FROM shipping_creation_attempts WHERE order_id=?', [id]))[0].n, 0)
  console.log(`Staging passed: COD order ${id}, retry idempotency, stock once, admin visibility, unpaid shipping blocked; no live provider calls`)
} finally {
  await sql("UPDATE daily_order_limit_overrides SET is_active=0,revoked_at=CURRENT_TIMESTAMP WHERE customer_phone='0900000099' AND reason='isolated staging smoke'")
  await sql("DELETE FROM app_settings WHERE key='admin_session_admin' AND value=?", [session])
}
