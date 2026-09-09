import assert from 'node:assert/strict'
import { mkdir, readFile } from 'node:fs/promises'
import { pathToFileURL } from 'node:url'
import path from 'node:path'
import { build } from 'esbuild'
import { Hono } from 'hono'
import { MemoryD1 } from './helpers/sqlite-d1.mjs'

const bundleDir = path.resolve('.wrangler/test-bundles')
await mkdir(bundleDir, { recursive: true })
const outfile = path.join(bundleDir, 'admin-payment-reconciliation-behavior.mjs')
await build({
  entryPoints: ['src/routes/adminPaymentReconciliationRoutes.ts'],
  outfile,
  bundle: true,
  platform: 'node',
  format: 'esm',
  packages: 'external',
})
const { registerAdminPaymentReconciliationRoutes } = await import(pathToFileURL(outfile).href)

const db = new MemoryD1()
await db.exec(`
  CREATE TABLE products (id INTEGER PRIMARY KEY, thumbnail TEXT);
  CREATE TABLE orders (
    id INTEGER PRIMARY KEY, order_code TEXT, product_id INTEGER, customer_name TEXT,
    payment_method TEXT, payment_provider TEXT, payment_status TEXT,
    payment_paid_at TEXT, payment_ref TEXT, payment_review_required INTEGER DEFAULT 0,
    payment_review_reason TEXT, total_price INTEGER, status TEXT, return_status TEXT,
    shipping_arranged INTEGER DEFAULT 0, created_at TEXT, updated_at TEXT
  );
  INSERT INTO products (id, thumbnail) VALUES (1, 'thumb');
  INSERT INTO orders (id, order_code, product_id, customer_name, payment_method, payment_provider, payment_status, total_price, status, created_at)
    VALUES
      (1, 'MANUAL-001', 1, 'Manual buyer', 'BANK_TRANSFER', 'MANUAL_VIETQR', 'unpaid', 100000, 'pending', CURRENT_TIMESTAMP),
      (2, 'PAYOS-001', 1, 'PayOS buyer', 'BANK_TRANSFER', 'PAYOS', 'unpaid', 200000, 'pending', CURRENT_TIMESTAMP),
      (3, 'CANCELLED-UNPAID', 1, 'Cancelled buyer', 'BANK_TRANSFER', 'PAYOS', 'unpaid', 300000, 'cancelled', CURRENT_TIMESTAMP),
      (4, 'CANCELLED-PAID', 1, 'Late buyer', 'BANK_TRANSFER', 'PAYOS', 'paid', 400000, 'cancelled', CURRENT_TIMESTAMP);
  UPDATE orders SET payment_review_required=1, payment_review_reason='PAID_AFTER_CANCELLATION' WHERE id=4;
`)
await db.exec(await readFile('migrations/0034_admin_payment_reconciliation.sql', 'utf8'))

const app = new Hono()
registerAdminPaymentReconciliationRoutes(app, { initDB: async () => {} })

async function request(pathname, method = 'GET', body) {
  const init = {
    method,
    headers: { cookie: 'admin_user_key=admin' },
  }
  if (body !== undefined) {
    init.headers['content-type'] = 'application/json'
    init.body = JSON.stringify(body)
  }
  return app.request(pathname, init, { DB: db })
}

const missingConfirmation = await request('/api/admin/payment-reconciliation/orders/1/confirm', 'POST', {
  bank_reference: 'MANUAL-REF-001', verified_amount: 100000,
  idempotency_key: 'manual-001', operator_confirmed: false,
})
assert.equal(missingConfirmation.status, 400)
assert.equal((await db.prepare('SELECT payment_status FROM orders WHERE id=1').first()).payment_status, 'unpaid')

const confirmed = await request('/api/admin/payment-reconciliation/orders/1/confirm', 'POST', {
  bank_reference: 'MANUAL-REF-001', verified_amount: 100000,
  idempotency_key: 'manual-001', operator_confirmed: true,
})
assert.equal(confirmed.status, 200)
const confirmedJson = await confirmed.json()
assert.equal(confirmedJson.data.payment_status, 'paid')
assert.equal(confirmedJson.data.shipping_eligible, true)
assert.equal((await db.prepare('SELECT COUNT(*) AS count FROM admin_payment_reconciliation_audit').first()).count, 1)

const sameRetry = await request('/api/admin/payment-reconciliation/orders/1/confirm', 'POST', {
  bank_reference: 'manual-ref-001', verified_amount: 100000,
  idempotency_key: 'manual-001', operator_confirmed: true,
})
assert.equal(sameRetry.status, 200)
assert.equal((await sameRetry.json()).data.already_processed, true)

const reusedKey = await request('/api/admin/payment-reconciliation/orders/1/confirm', 'POST', {
  bank_reference: 'DIFFERENT-REF', verified_amount: 100000,
  idempotency_key: 'manual-001', operator_confirmed: true,
})
assert.equal(reusedKey.status, 409)

const nonManual = await request('/api/admin/payment-reconciliation/orders/2/confirm', 'POST', {
  bank_reference: 'PAYOS-REF', verified_amount: 200000,
  idempotency_key: 'payos-001', operator_confirmed: true,
})
assert.equal(nonManual.status, 400)

const waiting = await request('/api/admin/payment-reconciliation?view=waiting_payment')
assert.equal(waiting.status, 200)
const waitingJson = await waiting.json()
assert.deepEqual(waitingJson.data.map((order) => order.id), [2])
assert.equal(waitingJson.counts.waiting_payment, 1)

const review = await request('/api/admin/payment-reconciliation?view=requires_review')
assert.equal(review.status, 200)
const reviewJson = await review.json()
assert.deepEqual(reviewJson.data.map((order) => order.id), [4])
assert.equal(reviewJson.data[0].shipping_eligible, false)

console.log('admin payment reconciliation behavior passed')
db.close()
