import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const orderRoutesSource = await readFile(new URL('../src/routes/orderRoutes.ts', import.meta.url), 'utf8')
const shippingHelpersSource = await readFile(new URL('../src/lib/shippingHelpers.ts', import.meta.url), 'utf8')
const adminOrdersSource = await readFile(new URL('../src/pages/admin/script-orders.ts', import.meta.url), 'utf8')
const adminSectionsSource = await readFile(new URL('../src/pages/admin/sections.ts', import.meta.url), 'utf8')
const adminModalsSource = await readFile(new URL('../src/pages/admin/modals.ts', import.meta.url), 'utf8')

assert.doesNotMatch(adminSectionsSource, /w-\[170px\] min-w-\[170px\]\">Đơn vị vận chuyển/, 'orders table should not reserve a per-row carrier column')
assert.match(adminOrdersSource, /const SHIPPING_CARRIERS[\s\S]*GHTK[\s\S]*SPX/, 'admin orders UI should list selectable carriers')
assert.match(adminOrdersSource, /function ensureOrdersCarrierBulkSelect/, 'admin orders UI should inject one bulk carrier selector near the view mode filter')
assert.match(adminOrdersSource, /querySelectorAll\('thead th'\)[\s\S]*Đơn vị vận chuyển[\s\S]*th\.remove\(\)/, 'admin orders UI should remove the old per-row carrier column header at runtime')
assert.match(adminOrdersSource, /function handleBulkShippingCarrierChange[\s\S]*\/api\/admin\/orders\/'\s*\+\s*id\s*\+\s*'\/shipping-carrier/, 'bulk carrier selector should persist carrier for checked orders')
assert.doesNotMatch(adminOrdersSource, /function renderShippingCarrierSelect/, 'order rows should not render duplicate carrier selectors')
assert.doesNotMatch(adminOrdersSource, /carrierSelect\.disabled\s*=\s*!anySelectedVisible/, 'bulk carrier selector should stay clickable and show a warning when no order is selected')
assert.match(adminOrdersSource, /if \(success\)[\s\S]*selectEl\.value = carrier/, 'bulk carrier selector should keep the selected carrier visible after a successful change')
assert.match(adminOrdersSource, /axios\.post\('\/api\/admin\/orders\/arrange-shipping',\s*\{ ids,\s*carriers:/, 'bulk arrange should send selected carrier map')
assert.match(adminOrdersSource, /axios\.post\('\/api\/admin\/orders\/arrange-shipping',\s*\{ ids: \[orderId\],\s*carriers:/, 'single arrange should send selected carrier')
assert.match(adminOrdersSource, /\/api\/admin\/orders\/shipping\/print-labels/, 'print action should use generic carrier-dispatch label endpoint')
assert.match(adminModalsSource, /id="arrangeFailedTitle"[\s\S]*Đơn lỗi khi tạo vận đơn/, 'arrange modal should expose a dynamic failed-carrier title')
assert.match(adminOrdersSource, /function getFailedCarriersLabel[\s\S]*normalizeShippingCarrierValue/, 'arrange modal should derive failed carrier labels dynamically')
assert.doesNotMatch(adminModalsSource, /Đơn lỗi khi tạo vận đơn GHTK/, 'arrange modal should not hardcode GHTK in the failed title')
assert.match(adminOrdersSource, /Chưa sắp xếp được đơn nào/, 'arrange modal should not report success when all selected orders fail')

assert.match(orderRoutesSource, /const SHIPPING_CARRIERS = new Set\(\['GHTK', 'SPX'\]\)/, 'backend should validate supported shipping carriers')
assert.match(orderRoutesSource, /app\.patch\('\/api\/admin\/orders\/:id\/shipping-carrier'/, 'backend should expose carrier persistence endpoint')
assert.match(orderRoutesSource, /const requestedCarriers[\s\S]*body\.carriers/, 'arrange endpoint should accept per-order carrier selection')
assert.match(orderRoutesSource, /createShipmentForCarrier[\s\S]*case 'SPX'/, 'arrange endpoint should dispatch SPX orders away from GHTK')
assert.match(orderRoutesSource, /shipping_carrier=\?/, 'arrange endpoint should persist selected carrier dynamically')
assert.match(orderRoutesSource, /app\.get\('\/api\/admin\/orders\/shipping\/print-labels'/, 'backend should expose generic carrier-dispatch print endpoint')
assert.match(orderRoutesSource, /fetchLabelPdfForCarrier[\s\S]*case 'SPX'/, 'print endpoint should dispatch SPX labels away from GHTK')

assert.match(shippingHelpersSource, /export async function spxCreateShipment/, 'SPX shipment helper should exist')
assert.match(shippingHelpersSource, /export async function spxFetchLabelPdf/, 'SPX label helper should exist')
assert.match(shippingHelpersSource, /SPX_CREATE_ORDER_ENDPOINT_NOT_CONFIGURED/, 'SPX helper should fail explicitly until create endpoint is configured')
assert.match(shippingHelpersSource, /SPX_LABEL_ENDPOINT_NOT_CONFIGURED/, 'SPX label helper should fail explicitly until label endpoint is configured')

console.log('shipping carrier dispatch contract passed')
