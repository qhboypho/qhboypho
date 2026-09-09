import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const routeSource = await readFile(new URL('../src/routes/adminPaymentReconciliationRoutes.ts', import.meta.url), 'utf8')
const migrationSource = await readFile(new URL('../migrations/0034_admin_payment_reconciliation.sql', import.meta.url), 'utf8')
const ordersSource = await readFile(new URL('../src/pages/admin/script-orders.ts', import.meta.url), 'utf8')
const sectionsSource = await readFile(new URL('../src/pages/admin/sections.ts', import.meta.url), 'utf8')
const statsSource = await readFile(new URL('../src/routes/voucherStatsRoutes.ts', import.meta.url), 'utf8')

assert.match(routeSource, /app\.get\('\/api\/admin\/payment-reconciliation'/, 'admin reconciliation list route should exist')
assert.match(routeSource, /app\.post\('\/api\/admin\/payment-reconciliation\/orders\/:id\/confirm'/, 'manual confirmation route should exist')
assert.match(routeSource, /MANUAL_VIETQR/, 'manual confirmation must be restricted to VietQR provider')
assert.match(routeSource, /payment_method.*BANK_TRANSFER|BANK_TRANSFER.*payment_method/, 'manual confirmation must be restricted to bank-transfer orders')
assert.match(routeSource, /bank_reference|payment_ref/, 'manual confirmation should require a bank reference')
assert.match(routeSource, /idempotency/i, 'manual confirmation should be idempotent')
assert.match(routeSource, /batch\(/, 'payment status and audit insert should use an atomic D1 batch')
assert.match(routeSource, /payment_review_required/, 'manual confirmation should account for payment review state')
assert.match(migrationSource, /UNIQUE\s*\(\s*payment_provider\s*,\s*bank_reference\s*\)/i, 'bank references should be unique per provider')
assert.match(migrationSource, /idempotency_key\s+TEXT\s+NOT\s+NULL/i, 'audit rows should persist an idempotency key')
assert.match(ordersSource, /waiting_payment/, 'orders UI should expose a waiting-payment view')
assert.match(ordersSource, /requires_review/, 'orders UI should expose a requires-review view')
assert.match(ordersSource, /payment-reconciliation\/orders/, 'orders UI should call manual reconciliation confirmation')
assert.match(sectionsSource, /ordersViewModeWaitingPaymentOption/, 'orders page should render waiting-payment option')
assert.match(sectionsSource, /ordersViewModeRequiresReviewOption/, 'orders page should render requires-review option')
assert.match(statsSource, /placedOrders/, 'dashboard stats should expose placed order count separately')
assert.match(statsSource, /readyToShipOrders/, 'dashboard stats should expose ready-to-ship count separately')

console.log('admin payment reconciliation contract passed')
