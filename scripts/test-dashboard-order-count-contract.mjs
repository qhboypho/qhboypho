import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const source = await readFile(new URL('../src/routes/voucherStatsRoutes.ts', import.meta.url), 'utf8')

assert.match(
  source,
  /totalOrders:\s*sidebarUndeliveredOrders\?\.count\s*\|\|\s*0/,
  'dashboard total order card should use the same actionable order count as the sidebar badge'
)

assert.match(
  source,
  /pendingOrders:\s*shippingQueueOrders\?\.count\s*\|\|\s*0/,
  'dashboard pending card should show only orders waiting for shipping arrangement'
)

assert.match(
  source,
  /const shippingQueueOrders[\s\S]*WHERE \$\{allOrderFilter\.sql\}[\s\S]*COALESCE\(CAST\(shipping_arranged AS INTEGER\), 0\) != 1/,
  'shippingQueueOrders should be all-time to-arrange orders, not ranged status=pending orders'
)

assert.doesNotMatch(
  source,
  /const pendingOrders\s*=\s*await[\s\S]*status='pending'/,
  'dashboard pending card must not use raw status=pending anymore'
)

console.log('dashboard order count contract passed')
