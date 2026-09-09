import assert from 'node:assert/strict'
import { Hono } from 'hono'
import { MemoryD1 } from './helpers/sqlite-d1.mjs'
import {
  payOSBuildDataString,
  payOSSignWithChecksum,
  syncOrderPaymentWithPayOS,
} from '../src/lib/paymentHelpers.ts'
import { registerPaymentRoutes } from '../src/routes/paymentRoutes.ts'

// Independent payment-state race checks. The provider payload is synthetic and
// signed locally; no provider/network calls are made by this test.
const checksumKey = 'synthetic-payos-checksum-key'

async function createDb() {
  const db = new MemoryD1()
  await db.exec(`
    CREATE TABLE app_settings (key TEXT PRIMARY KEY, value TEXT, updated_at TEXT);
    CREATE TABLE orders (
      id INTEGER PRIMARY KEY,
      order_code TEXT NOT NULL,
      total_price INTEGER NOT NULL,
      payment_method TEXT NOT NULL DEFAULT 'BANK_TRANSFER',
      payment_status TEXT NOT NULL DEFAULT 'unpaid',
      status TEXT NOT NULL DEFAULT 'pending',
      payment_order_code INTEGER,
      payment_link_id TEXT,
      payment_provider TEXT,
      payment_review_required INTEGER NOT NULL DEFAULT 0,
      payment_review_reason TEXT,
      return_status TEXT,
      payment_paid_at TEXT,
      payment_ref TEXT,
      updated_at TEXT
    );
    INSERT INTO orders (
      id, order_code, total_price, payment_method, payment_status, status, payment_order_code,
      payment_link_id, payment_provider, updated_at
    ) VALUES (1, 'QH700007', 125000, 'BANK_TRANSFER', 'unpaid', 'pending', 700007, 'plink-7', 'PAYOS', CURRENT_TIMESTAMP);
  `)
  return db
}

function makeApp(db) {
  const app = new Hono()
  registerPaymentRoutes(app, {
    async initDB() {},
    async syncOrderPayment() { return { synced: false, paid: false } },
    async syncOrderPaymentWithPayOS() { return { synced: false, paid: false } },
    async syncOrderPaymentWithMoMo() { return { synced: false, paid: false } },
    async syncOrderPaymentWithZaloPay() { return { synced: false, paid: false } },
    async getPayOSConfig() { return { clientId: 'synthetic-client', apiKey: 'synthetic-api', checksumKey } },
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
    buildManualVietQRPaymentData() { return {} },
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
    async payOSGetPaymentInfo() { return null },
  })
  return { app, env: { DB: db } }
}

function makeWebhookData(overrides = {}) {
  return {
    amount: 125000,
    description: 'QH700007 Guest Buyer',
    reference: 'FT-700007',
    transactionDateTime: '2026-09-09 10:00:00',
    orderCode: 700007,
    currency: 'VND',
    paymentLinkId: 'plink-7',
    code: '00',
    desc: 'success',
    ...overrides,
  }
}

async function signedWebhook(data = makeWebhookData()) {
  return {
    code: '00',
    desc: 'success',
    success: true,
    data,
    signature: await payOSSignWithChecksum(checksumKey, payOSBuildDataString(data)),
  }
}

async function postWebhook(app, env, body) {
  return app.fetch(new Request('http://localhost/api/payments/payos/webhook', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  }), env)
}

async function installSelectUpdateRace(db, mutationSql) {
  const originalPrepare = db.prepare.bind(db)
  let mutated = false
  db.prepare = (sql) => {
    const statement = originalPrepare(sql)
    if (!mutated && /FROM\s+orders[\s\S]*payment_order_code/i.test(String(sql))) {
      const originalFirst = statement.first.bind(statement)
      statement.first = async (...args) => {
        const row = await originalFirst(...args)
        if (row && !mutated) {
          mutated = true
          await originalPrepare(mutationSql).run()
        }
        return row
      }
    }
    return statement
  }
}

// Control: a valid signed callback with unchanged state is accepted.
{
  const db = await createDb()
  try {
    const { app, env } = makeApp(db)
    const response = await postWebhook(app, env, await signedWebhook())
    assert.equal(response.status, 200, await response.clone().text())
    const row = await db.prepare('SELECT payment_status, payment_provider, payment_link_id, total_price FROM orders WHERE id=1').first()
    assert.equal(row.payment_status, 'paid')
    assert.equal(row.payment_provider, 'PAYOS')
    assert.equal(row.payment_link_id, 'plink-7')
    assert.equal(Number(row.total_price), 125000)
  } finally {
    db.close()
  }
}

for (const race of [
  {
    label: 'provider',
    mutation: "UPDATE orders SET payment_provider='MOMO' WHERE id=1",
    verify(row) { assert.equal(row.payment_provider, 'MOMO') },
  },
  {
    label: 'link',
    mutation: "UPDATE orders SET payment_link_id='plink-new' WHERE id=1",
    verify(row) { assert.equal(row.payment_link_id, 'plink-new') },
  },
  {
    label: 'amount',
    mutation: 'UPDATE orders SET total_price=99000 WHERE id=1',
    verify(row) { assert.equal(Number(row.total_price), 99000) },
  },
]) {
  const db = await createDb()
  try {
    await installSelectUpdateRace(db, race.mutation)
    const { app, env } = makeApp(db)
    const response = await postWebhook(app, env, await signedWebhook())
    assert.equal(response.status, 409, `${race.label} change between SELECT and UPDATE must be rejected`)
    assert.equal((await response.json()).error, 'PAYMENT_STATE_CHANGED')
    const row = await db.prepare(`
      SELECT payment_status, payment_provider, payment_link_id, total_price
      FROM orders WHERE id=1
    `).first()
    assert.equal(row.payment_status, 'unpaid', `${race.label} race must not mark the order paid`)
    race.verify(row)
  } finally {
    db.close()
  }
}

// A provider query may finish after another request cancels the order.
{
  const db = await createDb()
  const originalFetch = globalThis.fetch
  try {
    const snapshot = await db.prepare('SELECT * FROM orders WHERE id=1').first()
    globalThis.fetch = async () => {
      await db.prepare("UPDATE orders SET status='cancelled' WHERE id=1").run()
      return Response.json({ code: '00', data: { id: 'plink-7', orderCode: 700007, status: 'PAID', amountPaid: 125000 } })
    }
    const result = await syncOrderPaymentWithPayOS(db, {
      PAYOS_CLIENT_ID: 'synthetic-client', PAYOS_API_KEY: 'synthetic-api', PAYOS_CHECKSUM_KEY: checksumKey,
    }, snapshot)
    const row = await db.prepare('SELECT * FROM orders WHERE id=1').first()
    assert.equal(row.payment_status, 'paid')
    assert.equal(row.status, 'cancelled')
    assert.equal(row.payment_review_required, 1, 'query finishing after cancellation must flag review')
    assert.equal(result.reconciliationRequired, true)
  } finally { globalThis.fetch = originalFetch; db.close() }
}

console.log('PayOS signed callback and query state-race tests passed')
