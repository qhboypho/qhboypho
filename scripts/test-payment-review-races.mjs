import assert from 'node:assert/strict'
import { mkdir } from 'node:fs/promises'
import { pathToFileURL } from 'node:url'
import path from 'node:path'
import { build } from 'esbuild'
import { Hono } from 'hono'
import { MemoryD1 } from './helpers/sqlite-d1.mjs'

// Independent reviewer tests: real SQLite conditional writes, no provider calls.
const bundleDir = path.resolve('.wrangler/test-bundles')
await mkdir(bundleDir, { recursive: true })
const outfile = path.join(bundleDir, 'payment-review-races.mjs')
await build({
  entryPoints: ['src/routes/adminPaymentReconciliationRoutes.ts'],
  outfile, bundle: true, platform: 'node', format: 'esm', packages: 'external',
})
const { registerAdminPaymentReconciliationRoutes } = await import(pathToFileURL(outfile).href)
const db = new MemoryD1()
await db.exec(`
  CREATE TABLE orders (
    id INTEGER PRIMARY KEY, order_code TEXT, payment_method TEXT,
    payment_provider TEXT, payment_status TEXT, total_price INTEGER,
    status TEXT, return_status TEXT, payment_ref TEXT, payment_paid_at TEXT,
    payment_review_required INTEGER DEFAULT 0, payment_review_reason TEXT,
    shipping_arranged INTEGER DEFAULT 0, shipping_tracking_code TEXT,
    updated_at TEXT
  );
  INSERT INTO orders (id, order_code, payment_method, payment_provider, payment_status, total_price, status)
  VALUES (1, 'REVIEW-RACE-1', 'BANK_TRANSFER', 'MANUAL_VIETQR', 'unpaid', 100000, 'pending');
`)
const { readFile } = await import('node:fs/promises')
await db.exec(await readFile('migrations/0034_admin_payment_reconciliation.sql', 'utf8'))
const app = new Hono()
registerAdminPaymentReconciliationRoutes(app, { initDB: async () => {} })

const originalBatch = db.batch.bind(db)
db.batch = async (statements) => {
  // A different admin cancels between the handler's read and its transaction.
  await db.prepare("UPDATE orders SET status='cancelled' WHERE id=1").run()
  return originalBatch(statements)
}
try {
  const response = await app.request('/api/admin/payment-reconciliation/orders/1/confirm', {
    method: 'POST',
    headers: { 'content-type': 'application/json', cookie: 'admin_user_key=admin' },
    body: JSON.stringify({
      bank_reference: 'RACE-REF-001', verified_amount: 100000,
      idempotency_key: 'review-race-001', operator_confirmed: true,
    }),
  }, { DB: db })
  assert.equal(response.status, 409, 'cancellation race must reject confirmation')
  const order = await db.prepare('SELECT * FROM orders WHERE id=1').first()
  assert.equal(order.payment_status, 'unpaid', 'cancelled order must not be marked paid by stale operator request')
  const audit = await db.prepare('SELECT COUNT(*) AS count FROM admin_payment_reconciliation_audit').first()
  assert.equal(audit.count, 0, 'a rejected confirmation must not append successful payment evidence')
  console.log('independent manual payment cancellation race passed')
} finally {
  db.close()
}
