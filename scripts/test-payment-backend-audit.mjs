import assert from 'node:assert/strict'
import crypto from 'node:crypto'
import { DatabaseSync } from 'node:sqlite'
import { Hono } from 'hono'
import {
  buildManualVietQRPaymentData,
  payOSBuildDataString,
  payOSSignWithChecksum,
} from '../src/lib/paymentHelpers.ts'
import { registerPaymentRoutes } from '../src/routes/paymentRoutes.ts'

async function hashOrderAccessToken(token) {
  const digest = await crypto.webcrypto.subtle.digest('SHA-256', new TextEncoder().encode(`order-access:${token}`))
  return Array.from(new Uint8Array(digest)).map((byte) => byte.toString(16).padStart(2, '0')).join('')
}

class D1Statement {
  constructor(database, sql) {
    this.database = database
    this.sql = sql
    this.params = []
  }

  bind(...params) {
    this.params = params
    return this
  }

  async first() {
    return this.database.prepare(this.sql).get(...this.params) || null
  }

  async all() {
    return { results: this.database.prepare(this.sql).all(...this.params) }
  }

  async run() {
    const result = this.database.prepare(this.sql).run(...this.params)
    return {
      success: true,
      meta: {
        changes: Number(result.changes || 0),
        last_row_id: Number(result.lastInsertRowid || 0),
      },
    }
  }
}

class D1DatabaseMock {
  constructor() {
    this.database = new DatabaseSync(':memory:')
    this.database.exec(`
      PRAGMA foreign_keys = ON;
      CREATE TABLE app_settings (key TEXT PRIMARY KEY, value TEXT, updated_at TEXT);
      CREATE TABLE orders (
        id INTEGER PRIMARY KEY,
        user_id INTEGER,
        order_code TEXT UNIQUE NOT NULL,
        total_price REAL NOT NULL,
        customer_name TEXT NOT NULL,
        customer_phone TEXT NOT NULL,
        product_name TEXT NOT NULL,
        quantity INTEGER NOT NULL DEFAULT 1,
        payment_method TEXT NOT NULL DEFAULT 'BANK_TRANSFER',
        payment_status TEXT NOT NULL DEFAULT 'unpaid',
        payment_paid_at TEXT,
        payment_ref TEXT,
        payment_provider TEXT,
        payment_link_id TEXT,
        payment_checkout_url TEXT,
        payment_order_code INTEGER,
        payment_review_required INTEGER NOT NULL DEFAULT 0,
        payment_review_reason TEXT,
        order_access_token_hash TEXT,
        status TEXT NOT NULL DEFAULT 'pending',
        return_status TEXT,
        updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
      CREATE TABLE payment_attempts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        order_id INTEGER NOT NULL,
        provider TEXT NOT NULL,
        idempotency_key TEXT NOT NULL,
        provider_order_code INTEGER,
        status TEXT NOT NULL DEFAULT 'CREATING',
        payment_link_id TEXT,
        checkout_url TEXT,
        error_code TEXT,
        lease_expires_at TEXT,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(order_id, provider),
        FOREIGN KEY (order_id) REFERENCES orders(id)
      );
    `)
  }

  prepare(sql) {
    return new D1Statement(this.database, sql)
  }

  async batch(statements) {
    this.database.exec('BEGIN IMMEDIATE')
    try {
      const results = []
      for (const statement of statements) results.push(await statement.run())
      this.database.exec('COMMIT')
      return results
    } catch (error) {
      this.database.exec('ROLLBACK')
      throw error
    }
  }
}

const checksumKey = 'checksum-test-key'
const baseOrder = {
  id: 7,
  user_id: null,
  order_code: 'QH000007',
  total_price: 125000,
  customer_name: 'Guest Buyer',
  customer_phone: '0900000007',
  product_name: 'Test shirt',
  quantity: 1,
  payment_method: 'BANK_TRANSFER',
  payment_status: 'unpaid',
  payment_provider: 'PAYOS',
  payment_link_id: 'plink-7',
  payment_checkout_url: 'https://pay.payos.vn/web/plink-7',
  payment_order_code: 700007,
  order_access_token_hash: '',
  status: 'pending',
}

function makeApp(db) {
  const app = new Hono()
  registerPaymentRoutes(app, {
    async initDB() {},
    async syncOrderPayment() { return { synced: false, paid: false } },
    async syncOrderPaymentWithPayOS() { return { synced: false, paid: false } },
    async syncOrderPaymentWithMoMo() { return { synced: false, paid: false } },
    async syncOrderPaymentWithZaloPay() { return { synced: false, paid: false } },
    async getPayOSConfig() { return { clientId: 'client', apiKey: 'api', checksumKey } },
    async getMoMoConfig() { return {} },
    getMoMoMissingConfigKeys() { return [] },
    async getZaloPayConfig() { return {} },
    getZaloPayMissingConfigKeys() { return [] },
    async getBankTransferProviderConfig() {
      return {
        provider: 'PAYOS',
        manualVietQR: { bankId: '', accountNo: '', accountName: '', template: 'compact2' },
      }
    },
    buildManualVietQRPaymentData,
    sanitizeAddressEffectiveDate(value) { return value || 'latest' },
    addressKitCache: { provinces: new Map(), communes: new Map() },
    ADDRESS_KIT_BASE_URL: 'https://address.test',
    buildMoMoOrderId(orderId, now = Date.now()) { return `MOMO-${orderId}-${now}` },
    buildZaloPayAppTransId(orderId, now = Date.now()) { return `260101_${orderId}_${now}` },
    payOSSignWithChecksum,
    payOSBuildDataString,
    parseJsonObject(value) {
      if (value && typeof value === 'object') return value
      try { return JSON.parse(String(value || '{}')) } catch { return {} }
    },
    payOSGetPaymentInfo: async () => null,
  })
  return { app, env: { DB: db, PAYOS_WEBHOOK_URL: 'https://shop.test/api/payments/payos/webhook' } }
}

function insertOrder(db, overrides = {}) {
  const order = { ...baseOrder, ...overrides }
  db.database.prepare(`
    INSERT INTO orders (
      id, user_id, order_code, total_price, customer_name, customer_phone, product_name,
      quantity, payment_method, payment_status, payment_provider, payment_link_id,
      payment_checkout_url, payment_order_code, payment_review_required, payment_review_reason,
      order_access_token_hash, status
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    order.id, order.user_id, order.order_code, order.total_price, order.customer_name,
    order.customer_phone, order.product_name, order.quantity, order.payment_method,
    order.payment_status, order.payment_provider, order.payment_link_id,
    order.payment_checkout_url, order.payment_order_code, order.payment_review_required || 0,
    order.payment_review_reason || null, order.order_access_token_hash || null, order.status,
  )
  return order
}

function makeOfficialWebhookData(overrides = {}) {
  return {
    accountNumber: '0123456789',
    amount: 125000,
    description: 'DH700007 Guest Buyer',
    reference: 'FT-700007',
    transactionDateTime: '2026-09-08 12:00:00',
    virtualAccountName: 'QHBOYPHO',
    counterAccountBankId: '970422',
    counterAccountBankName: 'MB',
    counterAccountName: 'GUEST BUYER',
    counterAccountNumber: '987654321',
    virtualAccountNumber: '',
    orderCode: 700007,
    currency: 'VND',
    paymentLinkId: 'plink-7',
    code: '00',
    desc: 'success',
    ...overrides,
  }
}

async function signedWebhook(data) {
  const signature = await payOSSignWithChecksum(checksumKey, payOSBuildDataString(data))
  return {
    code: '00',
    desc: 'success',
    success: true,
    data,
    signature,
  }
}

async function post(app, env, path, body, headers = {}) {
  return app.fetch(new Request(`http://localhost${path}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', ...headers },
    body: JSON.stringify(body),
  }), env)
}

// RED: the current handler expects data.status=PAID, so an official PayOS
// webhook with data.code=00 is ignored instead of recording the payment.
{
  const db = new D1DatabaseMock()
  insertOrder(db, { order_access_token_hash: await hashOrderAccessToken('guest-token-7-aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa') })
  const { app, env } = makeApp(db)
  const response = await post(app, env, '/api/payments/payos/webhook', await signedWebhook(makeOfficialWebhookData()))
  const order = db.database.prepare('SELECT payment_status FROM orders WHERE id=7').get()
  assert.equal(response.status, 200)
  assert.equal(order.payment_status, 'paid', 'official PayOS success webhook must mark the order paid')
}

// A payment callback must be bound to the exact payment link and amount.
{
  for (const [name, data] of [
    ['zero amount', makeOfficialWebhookData({ amount: 0 })],
    ['wrong currency', makeOfficialWebhookData({ currency: 'USD' })],
    ['wrong link', makeOfficialWebhookData({ paymentLinkId: 'other-link' })],
  ]) {
    const db = new D1DatabaseMock()
    insertOrder(db)
    const { app, env } = makeApp(db)
    const response = await post(app, env, '/api/payments/payos/webhook', await signedWebhook(data))
    const order = db.database.prepare('SELECT payment_status FROM orders WHERE id=7').get()
    assert.notEqual(response.status, 200, `${name} callback must be rejected`)
    assert.equal(order.payment_status, 'unpaid', `${name} callback must not change the order`)
  }
}

// A guest can access only with the order-scoped token, and closed orders cannot
// create another bank-transfer payment link.
{
  const db = new D1DatabaseMock()
  const guestToken = 'guest-token-7-aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'
  insertOrder(db, {
    order_access_token_hash: await hashOrderAccessToken(guestToken),
    status: 'cancelled',
  })
  const { app, env } = makeApp(db)
  const statusResponse = await app.fetch(new Request('http://localhost/api/orders/QH000007/payment-status', {
    headers: { 'X-Order-Access-Token': guestToken },
  }), env)
  assert.equal(statusResponse.status, 200, 'guest order token must authorize payment status')
  const linkResponse = await post(app, env, '/api/orders/7/bank-transfer-link', { origin: 'https://shop.test' }, {
    'X-Order-Access-Token': guestToken,
  })
  assert.equal(linkResponse.status, 409, 'closed orders must not create payment links')
}

// Reconfiguring the PayOS webhook is an admin-only operation and must use the
// server-side canonical URL instead of an arbitrary URL from the request.
{
  const db = new D1DatabaseMock()
  const { app, env } = makeApp(db)
  globalThis.fetch = async () => new Response(JSON.stringify({ code: '00', data: {} }), { status: 200 })
  const response = await post(app, env, '/api/payments/payos/confirm-webhook', {
    webhookUrl: 'https://attacker.test/capture',
  })
  assert.equal(response.status, 401, 'webhook reconfiguration must require admin authentication')
}

// PayOS failures must remain visible to the caller; they must not silently
// switch an order to an unverified manual QR recipient.
{
  const db = new D1DatabaseMock()
  insertOrder(db, { payment_provider: null })
  const { app, env } = makeApp(db)
  globalThis.fetch = async () => new Response(JSON.stringify({ code: 'TOO_MANY_REQUEST' }), { status: 429 })
  const response = await post(app, env, '/api/orders/7/bank-transfer-link', { origin: 'https://shop.test' })
  const order = db.database.prepare('SELECT payment_provider FROM orders WHERE id=7').get()
  assert.notEqual(response.status, 200, 'PayOS failures must not return a manual payment success')
  assert.notEqual(order.payment_provider, 'MANUAL_VIETQR', 'PayOS failures must not switch provider')
}

// A successful PayOS create is durable and reused by a second browser click;
// no second remote payment link is created for the same order.
{
  const db = new D1DatabaseMock()
  const guestToken = 'guest-token-8-bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb'
  insertOrder(db, {
    id: 8,
    order_code: 'QH000008',
    payment_link_id: null,
    payment_checkout_url: null,
    payment_order_code: null,
    order_access_token_hash: await hashOrderAccessToken(guestToken),
  })
  const { app, env } = makeApp(db)
  let createCalls = 0
  globalThis.fetch = async () => {
    createCalls++
    return new Response(JSON.stringify({
      code: '00',
      data: { paymentLinkId: 'plink-8', checkoutUrl: 'https://pay.payos.vn/web/plink-8' },
    }), { status: 200 })
  }
  const headers = { 'X-Order-Access-Token': guestToken }
  const first = await post(app, env, '/api/orders/8/bank-transfer-link', { origin: 'https://shop.test' }, headers)
  assert.equal(first.status, 200, 'first PayOS link request must succeed')
  const second = await post(app, env, '/api/orders/8/bank-transfer-link', { origin: 'https://shop.test' }, headers)
  assert.equal(second.status, 200, 'repeat PayOS link request must reuse the durable attempt')
  assert.equal(createCalls, 1, 'repeat PayOS link request must not create a second remote link')
  const attempt = db.database.prepare("SELECT status, payment_link_id FROM payment_attempts WHERE order_id=8 AND provider='PAYOS'").get()
  assert.equal(attempt.status, 'READY')
  assert.equal(attempt.payment_link_id, 'plink-8')
}

// An expired CREATING lease represents an uncertain remote request. The
// handler must query the stable provider order code and stop for reconciliation
// when the provider cannot confirm it, never blindly POSTing a new link.
{
  const db = new D1DatabaseMock()
  const guestToken = 'guest-token-9-cccccccccccccccccccccccccccccccccccccccccccccccccccc'
  insertOrder(db, {
    id: 9,
    order_code: 'QH000009',
    payment_link_id: null,
    payment_checkout_url: null,
    payment_order_code: null,
    order_access_token_hash: await hashOrderAccessToken(guestToken),
  })
  db.database.prepare(`
    INSERT INTO payment_attempts
      (order_id, provider, idempotency_key, provider_order_code, status, lease_expires_at)
    VALUES (9, 'PAYOS', 'PAYOS-9-old', 900009, 'CREATING', '2000-01-01 00:00:00')
  `).run()
  const { app, env } = makeApp(db)
  let remoteCreateCalls = 0
  globalThis.fetch = async () => {
    remoteCreateCalls++
    throw new Error('unexpected blind PayOS create')
  }
  const response = await post(app, env, '/api/orders/9/bank-transfer-link', { origin: 'https://shop.test' }, {
    'X-Order-Access-Token': guestToken,
  })
  assert.equal(response.status, 409, 'expired uncertain PayOS attempt must require reconciliation')
  assert.equal(remoteCreateCalls, 0, 'expired uncertain PayOS attempt must not blindly create a new link')
  const attempt = db.database.prepare("SELECT status FROM payment_attempts WHERE order_id=9 AND provider='PAYOS'").get()
  assert.equal(attempt.status, 'NEEDS_RECONCILIATION')
}

const paymentHelpers = await import('../src/lib/paymentHelpers.ts')
assert.equal(typeof paymentHelpers.getManualVietQRMissingConfigKeys, 'function', 'manual VietQR validation helper must exist')
const missingManualConfig = paymentHelpers.getManualVietQRMissingConfigKeys({ bankId: '', accountNo: '', accountName: '', template: 'compact2' })
assert.deepEqual(missingManualConfig, [
  'MANUAL_VIETQR_BANK_ID',
  'MANUAL_VIETQR_ACCOUNT_NO',
  'MANUAL_VIETQR_ACCOUNT_NAME',
], 'manual VietQR must require an explicit recipient configuration')

console.log('payment backend audit behavior tests passed')
