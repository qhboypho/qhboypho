import assert from 'node:assert/strict'
import { createHmac } from 'node:crypto'
import { spawnSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { MemoryD1, applyMigrations, migrationFiles } from './helpers/sqlite-d1.mjs'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const BASE_URL = 'http://launch.integration.test'
const PAYOS_CHECKSUM_KEY = 'launch-integration-checksum-key'
const ADMIN_TOKEN = 'launch-integration-admin-token-'.padEnd(64, 'x')
const ADMIN_COOKIE = `admin_token=${ADMIN_TOKEN}; admin_user_key=admin`

function runBuild() {
  const command = process.platform === 'win32' ? 'npm.cmd' : 'npm'
  const result = spawnSync(command, ['run', 'build'], {
    cwd: ROOT,
    stdio: 'inherit',
    env: { ...process.env },
    shell: process.platform === 'win32'
  })
  if (result.error) throw result.error
  if (result.status !== 0) throw new Error(`npm run build exited with status ${result.status}`)
}

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' }
  })
}

function parseRequestBody(init = {}) {
  const raw = init.body
  if (raw == null || raw === '') return null
  if (typeof raw === 'string') {
    try { return JSON.parse(raw) } catch { return raw }
  }
  return raw
}

function signPayOSData(data) {
  const dataString = Object.keys(data)
    .sort()
    .map((key) => `${key}=${data[key] == null ? '' : typeof data[key] === 'object' ? JSON.stringify(data[key]) : String(data[key])}`)
    .join('&')
  return createHmac('sha256', PAYOS_CHECKSUM_KEY).update(dataString).digest('hex')
}

function assertStatus(result, status, message = '') {
  assert.equal(result.status, status, message || `Expected HTTP ${status}, got ${result.status}: ${result.text}`)
}

function assertSuccess(result, message = '') {
  assertStatus(result, 200, message)
  assert.equal(result.json?.success, true, message || `Expected success=true: ${result.text}`)
}

async function main() {
  if (process.env.LAUNCH_INTEGRATION_SKIP_BUILD !== '1') runBuild()

  const files = migrationFiles(ROOT)
  assert.ok(files.length >= 29, `Expected all migrations, found ${files.length}`)

  const db = new MemoryD1()
  let worker
  const originalFetch = globalThis.fetch
  const network = {
    calls: [],
    payosCreates: [],
    ghtkCreates: [],
    ghtkCancels: []
  }

  let shipmentSequence = 0
  let loseNextShipmentResponse = false
  globalThis.fetch = async (input, init = {}) => {
    const url = typeof input === 'string' ? input : String(input?.url || input)
    const method = String(init?.method || input?.method || 'GET').toUpperCase()
    const body = parseRequestBody(init)
    network.calls.push({ url, method, body })

    if (url === 'https://api-merchant.payos.vn/v2/payment-requests' && method === 'POST') {
      const orderCode = Number(body?.orderCode || 0)
      const paymentLinkId = `plink-launch-${orderCode}`
      network.payosCreates.push({ orderCode, paymentLinkId, body })
      return jsonResponse({
        code: '00',
        desc: 'success',
        data: {
          paymentLinkId,
          checkoutUrl: `https://payos.invalid/checkout/${paymentLinkId}`,
          qrCode: 'data:image/png;base64,launch-test',
          orderCode
        }
      })
    }

    if (url.startsWith('https://api-merchant.payos.vn/v2/payment-requests/') && method === 'GET') {
      // A newly-created local order has no existing PayOS link. Returning a
      // provider-shaped 404 exercises the real idempotent link path without
      // contacting PayOS.
      return jsonResponse({ code: '404', desc: 'not found' }, 404)
    }

    if (url === 'https://services.giaohangtietkiem.vn/services/shipment/order/?ver=1.5' && method === 'POST') {
      await new Promise((resolve) => setTimeout(resolve, 4))
      shipmentSequence += 1
      const label = `GHTK-LAUNCH-${shipmentSequence}`
      network.ghtkCreates.push({ label, body })
      if (loseNextShipmentResponse) {
        loseNextShipmentResponse = false
        // Model a provider accepting the order and the Worker losing the
        // response. The route must persist needs_reconciliation and never
        // blindly submit a second remote order on retry.
        throw new Error('simulated carrier timeout after remote acceptance')
      }
      return jsonResponse({
        success: true,
        order: {
          label,
          tracking_id: label,
          fee: 18000
        }
      })
    }

    if (url.startsWith('https://services.giaohangtietkiem.vn/services/shipment/cancel/') && method === 'POST') {
      network.ghtkCancels.push({ url, body })
      return jsonResponse({ success: true, message: 'cancelled' })
    }

    throw new Error(`Blocked unexpected external request: ${method} ${url}`)
  }

  try {
    await applyMigrations(db, ROOT)

    const tableRows = (await db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all()).results
    const tableNames = new Set(tableRows.map((row) => String(row.name)))
    for (const table of [
      'products',
      'orders',
      'users',
      'app_settings',
      'product_skus',
      'blocked_customers',
      'daily_order_limit_overrides',
      'payment_attempts',
      'payment_reconciliation_attempts',
      'shipping_creation_attempts',
      'admin_payment_reconciliation_audit'
    ]) {
      assert.ok(tableNames.has(table), `Migration schema is missing ${table}`)
    }
    const orderColumns = new Set((await db.prepare('PRAGMA table_info(orders)').all()).results.map((row) => String(row.name)))
    for (const column of [
      'customer_email',
      'customer_province_code',
      'customer_commune_code',
      'customer_address_effective_date',
      'client_ip_hash',
      'customer_address_fingerprint',
      'device_hash',
      'product_sku_id',
      'return_status',
      'cancelled_by',
      'delivered_at',
      'inventory_reserved',
      'inventory_released',
      'order_access_token_hash',
      'idempotency_key_hash',
      'idempotency_payload_hash',
      'payment_review_required',
      'payment_review_reason',
      'shipping_delivery_confirmed_at',
      'shipping_delivery_source',
      'shipping_delivery_evidence_ref',
      'shipping_delivery_confirmed_by'
    ]) {
      assert.ok(orderColumns.has(column), `Migration schema is missing orders.${column}`)
    }
    const paymentAttemptColumns = new Set((await db.prepare('PRAGMA table_info(payment_attempts)').all()).results.map((row) => String(row.name)))
    for (const column of ['order_id', 'provider', 'idempotency_key', 'provider_order_code', 'status', 'payment_link_id', 'checkout_url', 'error_code', 'lease_expires_at']) {
      assert.ok(paymentAttemptColumns.has(column), `Migration schema is missing payment_attempts.${column}`)
    }
    const reconciliationAttemptColumns = new Set((await db.prepare('PRAGMA table_info(payment_reconciliation_attempts)').all()).results.map((row) => String(row.name)))
    for (const column of ['order_id', 'attempt_count', 'last_attempt_at', 'next_attempt_at', 'last_result']) {
      assert.ok(reconciliationAttemptColumns.has(column), `Migration schema is missing payment_reconciliation_attempts.${column}`)
    }
    const shippingAttemptColumns = new Set((await db.prepare('PRAGMA table_info(shipping_creation_attempts)').all()).results.map((row) => String(row.name)))
    for (const column of ['order_id', 'carrier', 'idempotency_key', 'state', 'tracking_code', 'label_code', 'shipping_fee', 'last_error']) {
      assert.ok(shippingAttemptColumns.has(column), `Migration schema is missing shipping_creation_attempts.${column}`)
    }
    const reconciliationAuditColumns = new Set((await db.prepare('PRAGMA table_info(admin_payment_reconciliation_audit)').all()).results.map((row) => String(row.name)))
    for (const column of ['order_id', 'payment_provider', 'bank_reference', 'verified_amount', 'order_amount', 'admin_user_key', 'idempotency_key']) {
      assert.ok(reconciliationAuditColumns.has(column), `Migration schema is missing admin_payment_reconciliation_audit.${column}`)
    }
    const seededProducts = await db.prepare('SELECT COUNT(*) AS count FROM products').first()
    assert.equal(Number(seededProducts?.count), 4, 'Expected 0002 seed products to be present')

    await db.prepare(`
      INSERT INTO app_settings (key, value, updated_at)
      VALUES ('admin_session_admin', ?, CURRENT_TIMESTAMP)
      ON CONFLICT(key) DO UPDATE SET value=excluded.value, updated_at=CURRENT_TIMESTAMP
    `).bind(ADMIN_TOKEN).run()

    const env = {
      CORS_ALLOWED_ORIGINS: BASE_URL,
      PAYOS_CLIENT_ID: 'launch-test-client-id',
      PAYOS_API_KEY: 'launch-test-api-key',
      PAYOS_CHECKSUM_KEY,
      GHTK_TOKEN: 'launch-test-ghtk-token',
      GHTK_CLIENT_SOURCE: 'launch-test-client-source',
      GHTK_PICK_ADDRESS_ID: 'launch-test-pickup',
      GHTK_PICK_NAME: 'QH launch test',
      GHTK_PICK_ADDRESS: '1 Test Street',
      GHTK_PICK_PROVINCE: 'Thành phố Hồ Chí Minh',
      GHTK_PICK_DISTRICT: 'Quận 1',
      GHTK_PICK_WARD: 'Phường Bến Nghé',
      GHTK_PICK_TEL: '0900000099',
      GHTK_DEFAULT_WEIGHT_KG: '0.5',
      // Keep the global checkout provider on PayOS.  These valid manual
      // values are used only after a test order is explicitly switched to
      // MANUAL_VIETQR, exercising strict config validation without a real
      // banking/QR dependency.
      MANUAL_VIETQR_BANK_ID: 'MB',
      MANUAL_VIETQR_ACCOUNT_NO: '0200100441441',
      MANUAL_VIETQR_ACCOUNT_NAME: 'QH Launch Test',
      MANUAL_VIETQR_TEMPLATE: 'compact2'
    }

    const workerPath = path.join(ROOT, 'dist', '_worker.js')
    assert.ok(fs.existsSync(workerPath), 'Build did not produce dist/_worker.js')
    const imported = await import(`${pathToFileURL(workerPath).href}?launchIntegration=${Date.now()}`)
    worker = imported.default
    assert.equal(typeof worker?.fetch, 'function', 'Expected bundled Worker fetch handler')

    const backgroundTasks = []
    function requestContext() {
      return {
        waitUntil(promise) {
          backgroundTasks.push(Promise.resolve(promise))
        }
      }
    }

    async function request(method, route, body, cookie = '', extraHeaders = {}) {
      const headers = new Headers(extraHeaders)
      headers.set('origin', BASE_URL)
      if (body !== undefined && !headers.has('content-type')) headers.set('content-type', 'application/json')
      if (cookie) headers.set('cookie', cookie)
      const requestBody = body === undefined ? undefined : JSON.stringify(body)
      const response = await worker.fetch(new Request(`${BASE_URL}${route}`, {
        method,
        headers,
        body: requestBody
      }), db && env ? { ...env, DB: db } : env, requestContext())
      const text = await response.text()
      let json = null
      try { json = JSON.parse(text) } catch { /* binary/non-JSON response */ }
      return { response, status: response.status, text, json }
    }

    let orderSequence = 0
    async function createGuestOrder(paymentMethod = 'COD') {
      orderSequence += 1
      const suffix = String(orderSequence).padStart(3, '0')
      const accessToken = `launch-guest-token-${suffix}`.padEnd(64, 'x')
      const idempotencyKey = `launch-order-idempotency-${suffix}`
      const requestBody = {
        customer_name: `Launch Guest ${suffix}`,
        customer_phone: `0901234${suffix}`,
        customer_address: `${10 + orderSequence} Nguyễn Huệ, Phường Bến Nghé, Quận 1, Thành phố Hồ Chí Minh`,
        product_id: 1,
        color: 'Đen',
        size: 'M',
        quantity: 1,
        payment_method: paymentMethod,
        note: `launch-integration-${suffix}`,
        device_id: `launch-device-${suffix}`,
        customer_province_code: '79',
        customer_commune_code: '00001',
        address_effective_date: 'latest',
        order_access_token: accessToken,
        idempotency_key: idempotencyKey
      }
      const skuBeforeRow = await db.prepare(`
        SELECT id, stock
        FROM product_skus
        WHERE product_id=1 AND TRIM(color)='Đen' AND TRIM(size)='M'
        LIMIT 1
      `).first()
      assert.ok(skuBeforeRow, 'Migration seed should provide the selected product SKU')
      const result = await request('POST', '/api/orders', requestBody, '', { 'X-Idempotency-Key': idempotencyKey })
      assertSuccess(result, 'Guest order creation failed')
      const id = Number(result.json.id)
      assert.ok(id > 0, 'Expected created guest order id')
      assert.equal(String(result.json.order_access_token), accessToken, 'Order creation must return the guest access token')
      const row = await db.prepare('SELECT * FROM orders WHERE id=?').bind(id).first()
      assert.equal(row?.user_id, null, 'Order should remain guest-owned without a user session')
      assert.equal(String(row?.customer_phone), `0901234${suffix}`)
      assert.equal(String(row?.payment_method), paymentMethod)
      assert.equal(String(row?.status), 'pending')
      assert.ok(Number(row?.product_sku_id) > 0, 'Expected order to capture the selected product SKU')
      assert.equal(String(row?.customer_province_code), '79')
      assert.equal(String(row?.customer_commune_code), '00001')
      assert.equal(Number(row?.inventory_reserved), 1, 'New order must reserve inventory atomically')
      assert.equal(Number(row?.inventory_released), 0)
      const skuAfterRow = await db.prepare('SELECT stock FROM product_skus WHERE id=?').bind(skuBeforeRow.id).first()
      assert.equal(Number(skuAfterRow?.stock), Number(skuBeforeRow.stock) - Number(row?.quantity || 0), 'SKU stock must be decremented by the reserved quantity')
      return {
        id,
        orderCode: String(result.json.order_code),
        row,
        accessToken,
        idempotencyKey,
        requestBody,
        skuId: Number(skuBeforeRow.id),
        skuStockBefore: Number(skuBeforeRow.stock)
      }
    }

    async function createPaymentLink(order) {
      const result = await request('POST', `/api/orders/${order.id}/bank-transfer-link`, { origin: BASE_URL }, '', {
        'X-Order-Access-Token': order.accessToken
      })
      assertSuccess(result, 'PayOS link creation failed')
      assert.equal(String(result.json?.data?.provider), 'PAYOS')
      const row = await db.prepare('SELECT * FROM orders WHERE id=?').bind(order.id).first()
      assert.equal(String(row?.payment_provider), 'PAYOS')
      assert.ok(String(row?.payment_link_id || '').length > 0)
      assert.ok(Number(row?.payment_order_code) > 0)
      return { ...order, row, paymentLinkId: String(row.payment_link_id), paymentOrderCode: Number(row.payment_order_code) }
    }

    async function sendSignedWebhook(order, overrides = {}) {
      const data = {
        orderCode: order.paymentOrderCode,
        amount: Number(order.row.total_price),
        code: '00',
        currency: 'VND',
        reference: `REF-${order.paymentLinkId}`,
        transactionDateTime: new Date().toISOString(),
        status: 'PAID',
        paymentLinkId: order.paymentLinkId,
        ...overrides
      }
      return request('POST', '/api/payments/payos/webhook', {
        code: '00',
        desc: 'success',
        success: true,
        data,
        signature: signPayOSData(data)
      })
    }

    async function createPaidBankOrder() {
      const created = await createGuestOrder('BANK_TRANSFER')
      const linked = await createPaymentLink(created)
      const webhook = await sendSignedWebhook(linked)
      assertSuccess(webhook, 'Initial signed payment webhook failed')
      const paidRow = await db.prepare('SELECT * FROM orders WHERE id=?').bind(linked.id).first()
      assert.equal(String(paidRow?.payment_status), 'paid')
      assert.equal(String(paidRow?.status), 'confirmed')
      return { ...linked, row: paidRow }
    }

    async function createManualVietQrOrder() {
      await db.prepare(`
        INSERT INTO app_settings (key, value, updated_at)
        VALUES ('bank_transfer_provider', 'MANUAL_VIETQR', CURRENT_TIMESTAMP)
        ON CONFLICT(key) DO UPDATE SET value=excluded.value, updated_at=CURRENT_TIMESTAMP
      `).run()
      const created = await createGuestOrder('BANK_TRANSFER')
      // Select the provider through the same runtime setting used by admin
      // checkout, then call the real registered Worker endpoint. This keeps
      // the manual QR fixture hermetic while covering provider selection,
      // strict config validation, and transfer-content persistence.
      const manualLink = await request('POST', `/api/orders/${created.id}/bank-transfer-link`, { origin: BASE_URL }, '', {
        'X-Order-Access-Token': created.accessToken
      })
      assertSuccess(manualLink, 'Manual VietQR checkout generation failed')
      assert.equal(String(manualLink.json?.data?.provider), 'MANUAL_VIETQR')
      assert.ok(String(manualLink.json?.data?.qrCode || '').includes('img.vietqr.io'), 'Manual provider must return a VietQR image URL')
      assert.ok(String(manualLink.json?.data?.transferContent || '').startsWith('DH'), 'Manual provider must return the transfer content')
      const transferContent = String(manualLink.json.data.transferContent)
      await db.prepare(`
        INSERT INTO app_settings (key, value, updated_at)
        VALUES ('bank_transfer_provider', 'PAYOS', CURRENT_TIMESTAMP)
        ON CONFLICT(key) DO UPDATE SET value=excluded.value, updated_at=CURRENT_TIMESTAMP
      `).run()
      const row = await db.prepare('SELECT * FROM orders WHERE id=?').bind(created.id).first()
      assert.equal(String(row?.payment_provider), 'MANUAL_VIETQR')
      assert.equal(String(row?.payment_status), 'unpaid')
      return { ...created, row, transferContent }
    }

    const guestOrder = await createGuestOrder('BANK_TRANSFER')
    const duplicateOrder = await request('POST', '/api/orders', guestOrder.requestBody, '', {
      'X-Idempotency-Key': guestOrder.idempotencyKey
    })
    assertSuccess(duplicateOrder, 'Idempotent guest order retry failed')
    assert.equal(duplicateOrder.json?.duplicate, true)
    assert.equal(Number(duplicateOrder.json?.id), guestOrder.id)
    assert.equal(String(duplicateOrder.json?.order_code), guestOrder.orderCode)
    assert.equal(String(duplicateOrder.json?.order_access_token), guestOrder.accessToken)
    const duplicateStockRow = await db.prepare('SELECT stock FROM product_skus WHERE id=?').bind(guestOrder.skuId).first()
    assert.equal(Number(duplicateStockRow?.stock), guestOrder.skuStockBefore - 1, 'Idempotent retry must not reserve inventory twice')
    const linkedOrder = await createPaymentLink(guestOrder)
    assert.equal(network.payosCreates.length, 1, 'Expected exactly one PayOS link request')

    const invalidWebhook = await request('POST', '/api/payments/payos/webhook', {
      code: '00',
      desc: 'success',
      success: true,
      data: {
        orderCode: linkedOrder.paymentOrderCode,
        amount: Number(linkedOrder.row.total_price),
        code: '00',
        currency: 'VND',
        reference: `REF-${linkedOrder.paymentLinkId}`,
        transactionDateTime: new Date().toISOString(),
        status: 'PAID',
        paymentLinkId: linkedOrder.paymentLinkId
      },
      signature: '00'.repeat(32)
    })
    assertStatus(invalidWebhook, 401, 'Invalid webhook signature must be rejected')
    const unpaidAfterInvalid = await db.prepare('SELECT payment_status, status FROM orders WHERE id=?').bind(linkedOrder.id).first()
    assert.equal(String(unpaidAfterInvalid?.payment_status), 'unpaid')
    assert.equal(String(unpaidAfterInvalid?.status), 'pending')

    const webhookResponses = await Promise.all([
      sendSignedWebhook(linkedOrder),
      sendSignedWebhook(linkedOrder)
    ])
    for (const webhook of webhookResponses) assertSuccess(webhook, 'Concurrent signed webhook failed')
    const paidRow = await db.prepare('SELECT * FROM orders WHERE id=?').bind(linkedOrder.id).first()
    assert.equal(String(paidRow?.payment_status), 'paid')
    assert.equal(String(paidRow?.payment_provider), 'PAYOS')
    assert.equal(String(paidRow?.payment_link_id), linkedOrder.paymentLinkId)
    assert.equal(Number(paidRow?.payment_order_code), linkedOrder.paymentOrderCode)
    assert.equal(String(paidRow?.status), 'confirmed')

    const paymentStatus = await request('GET', `/api/orders/${encodeURIComponent(linkedOrder.orderCode)}/payment-status`, undefined, '', {
      'X-Order-Access-Token': linkedOrder.accessToken
    })
    assertSuccess(paymentStatus, 'Payment status endpoint failed after webhook')
    assert.equal(String(paymentStatus.json?.data?.payment_status), 'paid')

    const underpaid = await createGuestOrder('BANK_TRANSFER')
    const underpaidLinked = await createPaymentLink(underpaid)
    const underpaidWebhook = await sendSignedWebhook(underpaidLinked, {
      amount: Math.max(1, Number(underpaidLinked.row.total_price) - 1)
    })
    assertStatus(underpaidWebhook, 400, 'Signed webhook with insufficient amount must be rejected')
    const underpaidRow = await db.prepare('SELECT payment_status, status FROM orders WHERE id=?').bind(underpaid.id).first()
    assert.equal(String(underpaidRow?.payment_status), 'unpaid')
    assert.equal(String(underpaidRow?.status), 'pending')

    // Exercise the registered admin reconciliation route against the same
    // in-memory Worker, including strict amount/reference/idempotency rules.
    // No external bank/QR call is made: the order is marked as the explicitly
    // selected MANUAL_VIETQR provider inside this isolated test database.
    const manualOrder = await createManualVietQrOrder()
    const waitingReconciliation = await request('GET', '/api/admin/payment-reconciliation?view=waiting_payment', undefined, ADMIN_COOKIE)
    assertSuccess(waitingReconciliation, 'Manual payment reconciliation queue failed')
    assert.ok(
      (waitingReconciliation.json?.data || []).some((order) => Number(order.id) === manualOrder.id),
      'Manual unpaid order must appear in reconciliation queue'
    )
    const manualConfirmBody = {
      bank_reference: ' MB-REF-LAUNCH-001 ',
      verified_amount: Number(manualOrder.row.total_price),
      operator_confirmed: true,
      idempotency_key: 'manual-reconcile-launch-001'
    }
    const manualConfirm = await request(
      'POST',
      `/api/admin/payment-reconciliation/orders/${manualOrder.id}/confirm`,
      manualConfirmBody,
      ADMIN_COOKIE
    )
    assertSuccess(manualConfirm, 'Manual VietQR payment confirmation failed')
    assert.equal(String(manualConfirm.json?.data?.payment_status), 'paid')
    assert.equal(String(manualConfirm.json?.data?.payment_provider), 'MANUAL_VIETQR')
    assert.equal(manualConfirm.json?.data?.shipping_eligible, true)
    const manualPaidRow = await db.prepare('SELECT payment_status, payment_provider, payment_ref, payment_review_required FROM orders WHERE id=?').bind(manualOrder.id).first()
    assert.equal(String(manualPaidRow?.payment_status), 'paid')
    assert.equal(String(manualPaidRow?.payment_provider), 'MANUAL_VIETQR')
    assert.equal(String(manualPaidRow?.payment_ref), 'MB-REF-LAUNCH-001')
    assert.equal(Number(manualPaidRow?.payment_review_required), 0)
    const manualAuditCount = await db.prepare('SELECT COUNT(*) AS count FROM admin_payment_reconciliation_audit WHERE order_id=?').bind(manualOrder.id).first()
    assert.equal(Number(manualAuditCount?.count), 1, 'Manual confirmation must write exactly one immutable audit row')

    const manualConfirmRetry = await request(
      'POST',
      `/api/admin/payment-reconciliation/orders/${manualOrder.id}/confirm`,
      manualConfirmBody,
      ADMIN_COOKIE
    )
    assertSuccess(manualConfirmRetry, 'Manual reconciliation retry should be idempotent')
    assert.equal(manualConfirmRetry.json?.data?.already_processed, true)
    const manualAuditCountAfterRetry = await db.prepare('SELECT COUNT(*) AS count FROM admin_payment_reconciliation_audit WHERE order_id=?').bind(manualOrder.id).first()
    assert.equal(Number(manualAuditCountAfterRetry?.count), 1, 'Idempotent retry must not duplicate reconciliation audit')

    const wrongAmountManualOrder = await createManualVietQrOrder()
    const wrongAmount = await request(
      'POST',
      `/api/admin/payment-reconciliation/orders/${wrongAmountManualOrder.id}/confirm`,
      {
        bank_reference: 'MB-REF-LAUNCH-WRONG',
        verified_amount: Number(wrongAmountManualOrder.row.total_price) + 1,
        operator_confirmed: true,
        idempotency_key: 'manual-reconcile-launch-wrong'
      },
      ADMIN_COOKIE
    )
    assertStatus(wrongAmount, 400, 'Manual reconciliation must reject an amount mismatch')
    assert.equal(wrongAmount.json?.error, 'VERIFIED_AMOUNT_MISMATCH')
    const wrongAmountRow = await db.prepare('SELECT payment_status FROM orders WHERE id=?').bind(wrongAmountManualOrder.id).first()
    assert.equal(String(wrongAmountRow?.payment_status), 'unpaid')

    const reusedReference = await request(
      'POST',
      `/api/admin/payment-reconciliation/orders/${wrongAmountManualOrder.id}/confirm`,
      {
        bank_reference: 'mb-ref-launch-001',
        verified_amount: Number(wrongAmountManualOrder.row.total_price),
        operator_confirmed: true,
        idempotency_key: 'manual-reconcile-launch-reused-reference'
      },
      ADMIN_COOKIE
    )
    assertStatus(reusedReference, 409, 'A bank reference may not confirm a second order')
    assert.equal(reusedReference.json?.error, 'BANK_REFERENCE_ALREADY_RECORDED')

    // A valid provider callback that arrives after shop cancellation must not
    // resurrect the fulfilment status. It is recorded as a payment review
    // case for an operator instead.
    const latePayment = await createGuestOrder('BANK_TRANSFER')
    const lateLinked = await createPaymentLink(latePayment)
    const lateCancelled = await request('PATCH', `/api/admin/orders/${latePayment.id}/status`, { status: 'cancelled' }, ADMIN_COOKIE)
    assertSuccess(lateCancelled, 'Pre-webhook cancellation for late-payment test failed')
    const lateWebhook = await sendSignedWebhook(lateLinked)
    assertSuccess(lateWebhook, 'Late PayOS webhook should be accepted for reconciliation')
    assert.equal(lateWebhook.json?.data?.reconciliation_required, true)
    const lateRow = await db.prepare('SELECT payment_status, status, payment_review_required, payment_review_reason, inventory_released FROM orders WHERE id=?').bind(latePayment.id).first()
    assert.equal(String(lateRow?.payment_status), 'paid')
    assert.equal(String(lateRow?.status), 'cancelled', 'Late payment must not reopen a cancelled order')
    assert.equal(Number(lateRow?.payment_review_required), 1)
    assert.equal(String(lateRow?.payment_review_reason), 'PAID_AFTER_CANCELLATION')
    assert.equal(Number(lateRow?.inventory_released), 1)

    const arrange = await request('POST', '/api/admin/orders/arrange-shipping', {
      ids: [linkedOrder.id],
      carriers: { [linkedOrder.id]: 'GHTK' }
    }, ADMIN_COOKIE)
    assertSuccess(arrange, 'Paid order shipping arrangement failed')
    assert.equal(Number(arrange.json.updated_count), 1)
    assert.equal(Number(arrange.json.failed_count), 0)
    const arrangedRow = await db.prepare('SELECT * FROM orders WHERE id=?').bind(linkedOrder.id).first()
    assert.equal(Number(arrangedRow?.shipping_arranged), 1)
    assert.equal(String(arrangedRow?.shipping_carrier), 'GHTK')
    assert.ok(String(arrangedRow?.shipping_tracking_code || '').length > 0)
    assert.equal(Number(arrangedRow?.shipping_fee), 18000)
    assert.equal(String(arrangedRow?.status), 'confirmed')
    const shipmentCall = network.ghtkCreates.at(-1)
    assert.equal(Number(shipmentCall?.body?.order?.pick_money), 0, 'Paid online order must have zero carrier COD amount')
    assert.equal(Number(shipmentCall?.body?.order?.value), Number(arrangedRow?.total_price))

    const repeatArrange = await request('POST', '/api/admin/orders/arrange-shipping', {
      ids: [linkedOrder.id],
      carriers: { [linkedOrder.id]: 'GHTK' }
    }, ADMIN_COOKIE)
    assertSuccess(repeatArrange, 'Repeated shipping arrangement failed')
    assert.equal(Number(repeatArrange.json.updated_count), 1)
    assert.equal(repeatArrange.json.updated?.[0]?.reused_tracking, true)
    assert.equal(network.ghtkCreates.length, 1, 'Repeated arrangement must not create a duplicate shipment')

    const markShipping = await request('PATCH', `/api/admin/orders/${linkedOrder.id}/status`, { status: 'shipping' }, ADMIN_COOKIE)
    assertSuccess(markShipping, 'Marking arranged order as shipping failed')
    const cancelShipped = await request('PATCH', `/api/admin/orders/${linkedOrder.id}/status`, { status: 'cancelled' }, ADMIN_COOKIE)
    assertStatus(cancelShipped, 400, 'An order already in shipping must not be cancelled')
    assert.equal(cancelShipped.json?.error, 'INVALID_STATUS_TRANSITION')
    assert.equal(network.ghtkCancels.length, 0, 'Shipping cancellation guard must not call the carrier')

    const doneWithoutEvidence = await request('PATCH', `/api/admin/orders/${linkedOrder.id}/status`, { status: 'done' }, ADMIN_COOKIE)
    assertStatus(doneWithoutEvidence, 400, 'An order without carrier delivery evidence must not be marked done')
    assert.equal(doneWithoutEvidence.json?.reason, 'CARRIER_DELIVERY_EVIDENCE_REQUIRED')
    const deliveryEvidence = await request('POST', `/api/admin/orders/${linkedOrder.id}/delivery-evidence`, {
      source: 'GHTK_OPERATOR',
      evidence_ref: 'ghtk-launch-proof-001',
      operator_confirmed: true
    }, ADMIN_COOKIE)
    assertSuccess(deliveryEvidence, 'Operator delivery evidence recording failed')
    const doneAfterEvidence = await request('PATCH', `/api/admin/orders/${linkedOrder.id}/status`, { status: 'done' }, ADMIN_COOKIE)
    assertSuccess(doneAfterEvidence, 'Carrier-verified order should be markable as done')

    const cancellable = await createGuestOrder('COD')
    const shippingTooEarly = await request('PATCH', `/api/admin/orders/${cancellable.id}/status`, { status: 'shipping' }, ADMIN_COOKIE)
    assertStatus(shippingTooEarly, 400)
    assert.equal(shippingTooEarly.json?.error, 'INVALID_STATUS_TRANSITION')
    const doneTooEarly = await request('PATCH', `/api/admin/orders/${cancellable.id}/status`, { status: 'done' }, ADMIN_COOKIE)
    assertStatus(doneTooEarly, 400)
    assert.equal(doneTooEarly.json?.error, 'INVALID_STATUS_TRANSITION')
    const cancelBeforeShipping = await request('PATCH', `/api/admin/orders/${cancellable.id}/status`, { status: 'cancelled' }, ADMIN_COOKIE)
    assertSuccess(cancelBeforeShipping, 'Unshipped order cancellation failed')
    const cancelledRow = await db.prepare('SELECT status, return_status, cancelled_by, inventory_released FROM orders WHERE id=?').bind(cancellable.id).first()
    assert.equal(String(cancelledRow?.status), 'cancelled')
    assert.equal(String(cancelledRow?.return_status), 'cancelled')
    assert.equal(String(cancelledRow?.cancelled_by), 'shop')
    assert.equal(Number(cancelledRow?.inventory_released), 1, 'Cancellation must release only this order inventory')
    const cancelledStockRow = await db.prepare('SELECT stock FROM product_skus WHERE id=?').bind(cancellable.skuId).first()
    assert.equal(Number(cancelledStockRow?.stock), cancellable.skuStockBefore, 'Cancellation must restore reserved SKU stock exactly once')
    assert.equal(network.ghtkCancels.length, 0, 'Unshipped cancellation must not call the carrier')
    const cancelAgain = await request('PATCH', `/api/admin/orders/${cancellable.id}/status`, { status: 'cancelled' }, ADMIN_COOKIE)
    assertStatus(cancelAgain, 400)
    assert.equal(cancelAgain.json?.error, 'ORDER_ALREADY_CLOSED')

    const raceOrder = await createPaidBankOrder()
    const raceStart = network.ghtkCreates.length
    const raceRequests = [1, 2].map(() => request('POST', '/api/admin/orders/arrange-shipping', {
      ids: [raceOrder.id],
      carriers: { [raceOrder.id]: 'GHTK' }
    }, ADMIN_COOKIE))
    const raceResults = await Promise.all(raceRequests)
    for (const result of raceResults) assertStatus(result, 200, 'Concurrent shipping arrangement request must return an HTTP result')
    assert.equal(raceResults.filter((result) => result.json?.success === true).length, 1, 'Exactly one concurrent arranger may claim shipment creation')
    const raceBlocked = raceResults.find((result) => result.json?.success === false)
    assert.equal(raceBlocked?.json?.failed?.[0]?.error, 'SHIPPING_RECONCILIATION_REQUIRED', 'The losing arranger must receive a durable reconciliation response')
    const raceCreated = network.ghtkCreates.slice(raceStart)
    assert.equal(raceCreated.length, 1, 'Concurrent arrangement must create one carrier shipment')
    const raceRow = await db.prepare('SELECT shipping_tracking_code FROM orders WHERE id=?').bind(raceOrder.id).first()
    assert.ok(String(raceRow?.shipping_tracking_code || '').length > 0)

    // A carrier can accept a shipment while the local request is paused. If
    // another committed write cancels the order before local persistence, the
    // stale arrange request must not attach tracking to the cancelled order.
    // Inject that competitor write immediately before the atomic persistence
    // batch to exercise the real conditional UPDATE against SQLite.
    const shippingCancelRaceOrder = await createPaidBankOrder()
    const originalBatch = db.batch.bind(db)
    let shippingCancelRaceInjected = false
    db.batch = async (statements) => {
      if (!shippingCancelRaceInjected) {
        shippingCancelRaceInjected = true
        const cancelled = await db.prepare(`
          UPDATE orders
          SET status='cancelled', return_status='cancelled', cancelled_by='shop', updated_at=CURRENT_TIMESTAMP
          WHERE id=? AND status='confirmed' AND shipping_arranged=0 AND TRIM(COALESCE(shipping_tracking_code, ''))=''
        `).bind(shippingCancelRaceOrder.id).run()
        assert.equal(Number(cancelled.meta?.changes), 1, 'Injected cancellation must commit before stale shipping persistence')
      }
      return originalBatch(statements)
    }
    const shippingCancelRaceStart = network.ghtkCreates.length
    let shippingCancelRaceResult
    try {
      shippingCancelRaceResult = await request('POST', '/api/admin/orders/arrange-shipping', {
        ids: [shippingCancelRaceOrder.id],
        carriers: { [shippingCancelRaceOrder.id]: 'GHTK' }
      }, ADMIN_COOKIE)
    } finally {
      db.batch = originalBatch
    }
    assertStatus(shippingCancelRaceResult, 200, 'Shipping/cancel race must return an explicit reconciliation result')
    assert.equal(shippingCancelRaceResult.json?.success, false)
    assert.equal(shippingCancelRaceResult.json?.failed?.[0]?.error, 'SHIPPING_RECONCILIATION_REQUIRED')
    assert.equal(network.ghtkCreates.length, shippingCancelRaceStart + 1, 'The stale request may have one orphaned remote create, never a second one')
    const shippingCancelRaceRow = await db.prepare(`
      SELECT status, shipping_arranged, shipping_tracking_code, inventory_released
      FROM orders WHERE id=?
    `).bind(shippingCancelRaceOrder.id).first()
    assert.equal(String(shippingCancelRaceRow?.status), 'cancelled')
    assert.equal(Number(shippingCancelRaceRow?.shipping_arranged), 0, 'Cancelled order must not be marked arranged by stale persistence')
    assert.equal(String(shippingCancelRaceRow?.shipping_tracking_code || ''), '')
    assert.equal(Number(shippingCancelRaceRow?.inventory_released), 1)
    const shippingCancelRaceAttempt = await db.prepare('SELECT state, last_error FROM shipping_creation_attempts WHERE order_id=?').bind(shippingCancelRaceOrder.id).first()
    assert.equal(String(shippingCancelRaceAttempt?.state), 'needs_reconciliation')

    // Once the carrier response is lost after acceptance, the durable
    // needs_reconciliation state must suppress every blind retry.
    const lostRemoteOrder = await createPaidBankOrder()
    const lostRemoteStart = network.ghtkCreates.length
    loseNextShipmentResponse = true
    const lostRemoteFirst = await request('POST', '/api/admin/orders/arrange-shipping', {
      ids: [lostRemoteOrder.id],
      carriers: { [lostRemoteOrder.id]: 'GHTK' }
    }, ADMIN_COOKIE)
    assertStatus(lostRemoteFirst, 200)
    assert.equal(lostRemoteFirst.json?.success, false)
    assert.equal(lostRemoteFirst.json?.failed?.[0]?.error, 'SHIPPING_RECONCILIATION_REQUIRED')
    assert.equal(network.ghtkCreates.length, lostRemoteStart + 1, 'The simulated accepted remote shipment must be observed once')
    const lostRemoteAttempt = await db.prepare('SELECT state, tracking_code, last_error FROM shipping_creation_attempts WHERE order_id=?').bind(lostRemoteOrder.id).first()
    assert.equal(String(lostRemoteAttempt?.state), 'needs_reconciliation')
    assert.equal(String(lostRemoteAttempt?.tracking_code || ''), '')
    const lostRemoteRetry = await request('POST', '/api/admin/orders/arrange-shipping', {
      ids: [lostRemoteOrder.id],
      carriers: { [lostRemoteOrder.id]: 'GHTK' }
    }, ADMIN_COOKIE)
    assertStatus(lostRemoteRetry, 200)
    assert.equal(lostRemoteRetry.json?.success, false)
    assert.equal(lostRemoteRetry.json?.failed?.[0]?.error, 'SHIPPING_RECONCILIATION_REQUIRED')
    assert.equal(network.ghtkCreates.length, lostRemoteStart + 1, 'Retry after a lost carrier response must not create a duplicate shipment')

    // Deletion has the same stale-read hazard as payment confirmation. A
    // cancelled, unpaid order may look deletable, but if a late payment write
    // commits before the conditional DELETE, the order must survive.
    const deleteLatePaidOrder = await createGuestOrder('BANK_TRANSFER')
    const deleteLatePaidCancel = await request('PATCH', `/api/admin/orders/${deleteLatePaidOrder.id}/status`, { status: 'cancelled' }, ADMIN_COOKIE)
    assertSuccess(deleteLatePaidCancel, 'Preparing delete/late-payment race failed')
    const originalPrepare = db.prepare.bind(db)
    let deleteLatePaidInjected = false
    db.prepare = (sql) => {
      const statement = originalPrepare(sql)
      if (!deleteLatePaidInjected && /^\s*DELETE\s+FROM\s+orders\b/i.test(String(sql))) {
        const originalRun = statement.run.bind(statement)
        statement.run = async (...args) => {
          deleteLatePaidInjected = true
          const latePayment = await originalPrepare(`
            UPDATE orders
            SET payment_status='paid', payment_provider='PAYOS', payment_ref='LATE-RACE',
                payment_paid_at=CURRENT_TIMESTAMP, updated_at=CURRENT_TIMESTAMP
            WHERE id=? AND payment_status='unpaid'
          `).bind(deleteLatePaidOrder.id).run()
          assert.equal(Number(latePayment.meta?.changes), 1, 'Injected late payment must commit before stale DELETE')
          return originalRun(...args)
        }
      }
      return statement
    }
    let deleteLatePaidResult
    try {
      deleteLatePaidResult = await request('DELETE', `/api/admin/orders/${deleteLatePaidOrder.id}`, undefined, ADMIN_COOKIE)
    } finally {
      db.prepare = originalPrepare
    }
    assertStatus(deleteLatePaidResult, 409, 'Stale delete must reject a concurrent late-paid order')
    assert.equal(deleteLatePaidResult.json?.error, 'ORDER_STATE_CHANGED')
    const deleteLatePaidRow = await db.prepare('SELECT status, payment_status, payment_ref, inventory_released FROM orders WHERE id=?').bind(deleteLatePaidOrder.id).first()
    assert.ok(deleteLatePaidRow, 'Late-paid order must not be deleted')
    assert.equal(String(deleteLatePaidRow?.status), 'cancelled')
    assert.equal(String(deleteLatePaidRow?.payment_status), 'paid')
    assert.equal(String(deleteLatePaidRow?.payment_ref), 'LATE-RACE')
    assert.equal(Number(deleteLatePaidRow?.inventory_released), 1)

    // Inventory is a launch-critical boundary as well. Use a distinct SKU
    // with one unit left so two real Worker requests must serialize through
    // the migration trigger: one succeeds and the other rolls back entirely.
    const stockRaceSku = await db.prepare(`
      SELECT id, stock
      FROM product_skus
      WHERE product_id=1 AND TRIM(color)='Trắng' AND TRIM(size)='XS'
      LIMIT 1
    `).first()
    assert.ok(stockRaceSku, 'Expected a second seeded SKU for inventory race coverage')
    await db.prepare('UPDATE product_skus SET stock=1 WHERE id=?').bind(stockRaceSku.id).run()
    const stockRaceStart = orderSequence + 1
    const stockRaceRequests = [0, 1].map((offset) => {
      const suffix = String(stockRaceStart + offset).padStart(3, '0')
      const accessToken = `launch-stock-token-${suffix}`.padEnd(64, 'x')
      const idempotencyKey = `launch-stock-idempotency-${suffix}`
      const body = {
        customer_name: `Launch Stock ${suffix}`,
        customer_phone: `0909876${suffix}`,
        customer_address: `${200 + offset} Nguyễn Huệ, Phường Bến Nghé, Quận 1, Thành phố Hồ Chí Minh`,
        product_id: 1,
        product_sku_id: Number(stockRaceSku.id),
        color: 'Trắng',
        size: 'XS',
        quantity: 1,
        payment_method: 'COD',
        note: `launch-stock-race-${suffix}`,
        device_id: `launch-stock-device-${suffix}`,
        order_access_token: accessToken,
        idempotency_key: idempotencyKey
      }
      return request('POST', '/api/orders', body, '', { 'X-Idempotency-Key': idempotencyKey })
    })
    const stockRaceResults = await Promise.all(stockRaceRequests)
    assert.deepEqual(
      stockRaceResults.map((result) => result.status).sort((a, b) => a - b),
      [200, 409],
      'Only one concurrent order may reserve the last SKU'
    )
    const stockAfterRace = await db.prepare('SELECT stock FROM product_skus WHERE id=?').bind(stockRaceSku.id).first()
    assert.equal(Number(stockAfterRace?.stock), 0, 'Successful order must atomically reserve the last SKU')
    const stockRaceOrderCount = await db.prepare(`
      SELECT COUNT(*) AS count
      FROM orders
      WHERE product_sku_id=? AND note LIKE 'launch-stock-race-%'
    `).bind(stockRaceSku.id).first()
    assert.equal(Number(stockRaceOrderCount?.count), 1, 'Failed stock reservation must not insert an order')

    if (backgroundTasks.length) await Promise.allSettled(backgroundTasks)
    console.log(`launch integration passed: ${files.length} migrations, guest PayOS webhook race, GHTK shipping/cancel guards, and carrier concurrency`)
    console.log(`external calls observed only in hermetic mock: ${network.calls.length}`)
  } finally {
    globalThis.fetch = originalFetch
    db.close()
  }
}

main().catch((error) => {
  console.error('launch integration FAILED')
  console.error(error?.stack || error?.message || error)
  process.exitCode = 1
})
