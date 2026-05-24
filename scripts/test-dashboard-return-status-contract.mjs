import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const routeSource = await readFile(new URL('../src/routes/voucherStatsRoutes.ts', import.meta.url), 'utf8')
const adminSource = await readFile(new URL('../src/pages/admin/script.ts', import.meta.url), 'utf8')

assert.match(
  routeSource,
  /const customerFaultReturnSql = `\([\s\S]*return_status[\s\S]*delivery_failed[\s\S]*cancelled_by[\s\S]*customer[\s\S]*shipping_arranged[\s\S]*shipping_tracking_code[\s\S]*\)`/,
  'dashboard failed-return metric should only count delivery_failed or customer-fault shipped cancellations'
)

assert.match(
  routeSource,
  /const cancelledOrFailedFilterSql = `\$\{orderFilter\.sql\} AND \$\{customerFaultReturnSql\}`/,
  'dashboard cancelledOrFailedOrders should use the customer-fault return condition'
)

assert.match(
  routeSource,
  /WHEN \$\{customerFaultReturnSql\} THEN 'delivery_failed'/,
  'dashboard status breakdown should map customer-fault returns to delivery_failed'
)

assert.match(
  routeSource,
  /LOWER\(COALESCE\(status, ''\)\) = 'cancelled'[\s\S]*AND NOT \$\{customerFaultReturnSql\}/,
  'dashboard status breakdown should exclude normal pre-shipping cancellations'
)

assert.match(
  adminSource,
  /fa-percent/,
  'dashboard tax rate strip should use an available percent icon'
)

assert.match(
  adminSource,
  /Bom \/ trả về/,
  'dashboard UI should label customer-fault return orders clearly'
)

assert.match(
  adminSource,
  /delivery_failed:'Bom \/ trả về'/,
  'dashboard status label should support delivery_failed'
)

console.log('dashboard return status contract passed')
