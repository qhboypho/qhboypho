import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const orderRoutesSource = await readFile(new URL('../src/routes/orderRoutes.ts', import.meta.url), 'utf8')
const blockRoutesSource = await readFile(new URL('../src/routes/blockRoutes.ts', import.meta.url), 'utf8')
const customerBlockHelpersSource = await readFile(new URL('../src/lib/customerBlockHelpers.ts', import.meta.url), 'utf8')

for (const [label, source] of [
  ['order routes auto-block helper', orderRoutesSource],
  ['admin check-auto-block route', blockRoutesSource]
]) {
  assert.match(
    source,
    /refreshCustomerAutoBlock/,
    `${label} should use the shared auto-block refresh helper`
  )
}

assert.match(
  customerBlockHelpersSource,
  /countCustomerFaultCancelledOrders/,
  'shared helper should expose a customer-fault cancellation counter'
)

assert.match(
  customerBlockHelpersSource,
  /cancelled_by[\s\S]*customer/,
  'shared customer block helper should understand customer-caused cancellations'
)

assert.match(
  customerBlockHelpersSource,
  /return_status[\s\S]*delivery_failed/,
  'shared customer block helper should count delivery-failed/not-received orders'
)

assert.match(
  customerBlockHelpersSource,
  /shipping_arranged[\s\S]*shipping_tracking_code/,
  'shared customer block helper should require shipping evidence before auto-blocking cancellation history'
)

assert.doesNotMatch(
  orderRoutesSource + blockRoutesSource + customerBlockHelpersSource,
  /SELECT COUNT\(\*\) as cancelled_count FROM orders WHERE status = \?/,
  'auto-block code must not count every cancelled order as customer fault'
)

assert.match(
  customerBlockHelpersSource,
  /blocked_by = 'system'/,
  'auto-block should still be written as a system block, distinct from admin/manual blocks'
)

assert.match(
  orderRoutesSource,
  /currentStatus === 'shipping'[\s\S]*ORDER_ALREADY_IN_SHIPPING/,
  'admin cancellation should not be allowed once an order is already in shipping'
)

assert.match(
  customerBlockHelpersSource,
  /blocked_by\s*=\s*'system'[\s\S]*unblocked_at = CURRENT_TIMESTAMP/,
  'admin check-auto-block should be able to clear stale system auto-blocks without touching manual admin blocks'
)

console.log('customer auto-block contract passed')
