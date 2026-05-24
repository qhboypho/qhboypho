import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const routeSource = await readFile(new URL('../src/routes/voucherStatsRoutes.ts', import.meta.url), 'utf8')
const adminSource = await readFile(new URL('../src/pages/admin/script.ts', import.meta.url), 'utf8')
const sectionsSource = await readFile(new URL('../src/pages/admin/sections.ts', import.meta.url), 'utf8')

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
  /WHEN \$\{actionableShippingSql\} AND COALESCE\(CAST\(shipping_arranged AS INTEGER\), 0\) != 1 THEN 'pending'/,
  'dashboard status breakdown pending row should mean orders waiting for shipping arrangement'
)

assert.match(
  routeSource,
  /WHEN \$\{actionableShippingSql\} AND COALESCE\(CAST\(shipping_arranged AS INTEGER\), 0\) = 1 THEN 'confirmed'/,
  'dashboard status breakdown confirmed row should mean arranged orders waiting for shipment'
)

assert.match(
  routeSource,
  /\$\{customerFaultReturnSql\}[\s\S]*OR \$\{actionableShippingSql\}[\s\S]*OR LOWER\(COALESCE\(status, ''\)\) IN \('shipping', 'done'\)/,
  'dashboard status breakdown should exclude unpaid or non-actionable pending orders'
)

assert.match(
  routeSource,
  /const statusBreakdownRes = await c\.env\.DB\.prepare\(`[\s\S]*WHERE \$\{allOrderFilter\.sql\}[\s\S]*`\)\.bind\(\.\.\.allOrderFilter\.params\)\.all\(\)/,
  'dashboard status breakdown should use the same all-time operational scope as the order count cards'
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

assert.match(
  adminSource,
  /const total = Math\.max\(1, normalized\.reduce\(\(sum, row\) => sum \+ Number\(row\.count \|\| 0\), 0\)\)/,
  'dashboard status breakdown percentages should use the selected-range breakdown total'
)

assert.doesNotMatch(
  adminSource,
  /normalized\.reduce\(\(sum, row\)[\s\S]*Number\(totalOrders \|\| 0\)/,
  'dashboard status breakdown must not use all-time totalOrders as its percentage denominator'
)

assert.match(
  sectionsSource,
  /Cùng logic với tổng đơn vận hành/,
  'dashboard status breakdown subtitle should match the operational all-time scope'
)

console.log('dashboard return status contract passed')
