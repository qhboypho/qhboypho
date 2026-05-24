import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const routeSource = await readFile(new URL('../src/routes/voucherStatsRoutes.ts', import.meta.url), 'utf8')
const adminSource = await readFile(new URL('../src/pages/admin/script.ts', import.meta.url), 'utf8')
const sectionsSource = await readFile(new URL('../src/pages/admin/sections.ts', import.meta.url), 'utf8')

assert.match(
  routeSource,
  /const customerFaultReturnSql = `LOWER\(COALESCE\(return_status, ''\)\) = 'delivery_failed'`/,
  'dashboard failed-return metric should only count explicit delivery_failed orders'
)

assert.doesNotMatch(
  routeSource,
  /const customerFaultReturnSql[\s\S]*cancelled_by/,
  'dashboard failed-return metric must not infer bom orders from legacy cancelled_by rows'
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
  /const shippedEvidenceSql = `\(COALESCE\(CAST\(shipping_arranged AS INTEGER\), 0\) = 1 OR TRIM\(COALESCE\(shipping_tracking_code, ''\)\) != ''\)`/,
  'dashboard shipping status should require arranged or tracking evidence'
)

assert.match(
  routeSource,
  /WHEN LOWER\(COALESCE\(status, ''\)\) = 'shipping' AND \$\{shippedEvidenceSql\} THEN 'shipping'/,
  'dashboard status breakdown should not count stale shipping rows without shipment evidence'
)

assert.match(
  routeSource,
  /\$\{customerFaultReturnSql\}[\s\S]*OR \$\{actionableShippingSql\}[\s\S]*OR \(LOWER\(COALESCE\(status, ''\)\) = 'shipping' AND \$\{shippedEvidenceSql\}\)[\s\S]*OR LOWER\(COALESCE\(status, ''\)\) = 'done'/,
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
