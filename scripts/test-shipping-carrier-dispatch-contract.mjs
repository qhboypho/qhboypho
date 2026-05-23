import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const orderRoutesSource = await readFile(new URL('../src/routes/orderRoutes.ts', import.meta.url), 'utf8')
const shippingHelpersSource = await readFile(new URL('../src/lib/shippingHelpers.ts', import.meta.url), 'utf8')
const adminOrdersSource = await readFile(new URL('../src/pages/admin/script-orders.ts', import.meta.url), 'utf8')
const adminSectionsSource = await readFile(new URL('../src/pages/admin/sections.ts', import.meta.url), 'utf8')
const adminModalsSource = await readFile(new URL('../src/pages/admin/modals.ts', import.meta.url), 'utf8')

assert.doesNotMatch(adminSectionsSource, /w-\[170px\] min-w-\[170px\]\">Đơn vị vận chuyển/, 'orders table should not reserve a per-row carrier column')
assert.match(adminSectionsSource, /id=\\"ordersCarrierColumnHeader\\"[\s\S]*>ĐVVC</, 'orders table template should include a compact shipping carrier column')
assert.match(adminOrdersSource, /ordersCarrierColumnHeader[\s\S]*textContent = 'ĐVVC'/, 'waiting shipment table should expose a compact shipping carrier column')
assert.match(adminOrdersSource, /let SHIPPING_CARRIERS[\s\S]*GHTK[\s\S]*SPX[\s\S]*GHN/, 'admin orders UI should include built-in selectable carriers')
assert.match(adminOrdersSource, /loadShippingCarrierOptions[\s\S]*\/api\/admin\/shipping\/carriers/, 'admin orders UI should load enabled carriers from the registry endpoint')
assert.match(adminOrdersSource, /function ensureOrdersCarrierBulkSelect/, 'admin orders UI should inject one bulk carrier selector near the view mode filter')
assert.match(adminOrdersSource, /id = 'ordersCarrierFilterSelect'/, 'waiting shipment tab should inject a separate carrier filter select')
assert.match(adminOrdersSource, /buildShippingCarrierOptionsHtml\('Tất cả ĐVVC'\)/, 'carrier filter should expose an all-carriers placeholder')
assert.match(adminOrdersSource, /function getActiveOrdersCarrierFilter[\s\S]*ordersViewMode !== 'waiting_ship'[\s\S]*ordersCarrierFilterSelect/, 'carrier filter should only apply in waiting shipment mode')
assert.match(adminOrdersSource, /const carrierFilter = getActiveOrdersCarrierFilter\(\)[\s\S]*getOrderShippingCarrier\(o\) === carrierFilter/, 'orders filtering should narrow waiting shipment rows by selected carrier')
assert.match(adminOrdersSource, /carrierFilterSelect\.classList\.toggle\('hidden', !showCarrierFilter\)/, 'carrier filter should only be visible on waiting shipment view')
assert.match(adminOrdersSource, /querySelectorAll\('thead th'\)[\s\S]*Đơn vị vận chuyển[\s\S]*th\.remove\(\)/, 'admin orders UI should remove the old per-row carrier column header at runtime')
assert.match(adminOrdersSource, /function getShippingCarrierLabel[\s\S]*SHIPPING_CARRIERS\.find/, 'carrier display label should resolve dynamically from the loaded carrier registry')
assert.match(adminOrdersSource, /ordersCarrierColumnHeader[\s\S]*classList\.toggle\('hidden',\s*ordersViewMode !== 'waiting_ship'\)/, 'carrier column should only show for waiting shipment orders')
assert.match(adminOrdersSource, /orders-carrier-cell[\s\S]*getShippingCarrierLabel\(o\.shipping_carrier \|\| o\.carrier \|\| 'GHTK'\)/, 'waiting shipment rows should render the selected carrier label')
assert.match(adminOrdersSource, /function handleBulkShippingCarrierChange[\s\S]*\/api\/admin\/orders\/'\s*\+\s*id\s*\+\s*'\/shipping-carrier/, 'bulk carrier selector should persist carrier for checked orders')
assert.doesNotMatch(adminOrdersSource, /function renderShippingCarrierSelect/, 'order rows should not render duplicate carrier selectors')
assert.doesNotMatch(adminOrdersSource, /carrierSelect\.disabled\s*=\s*!anySelectedVisible/, 'bulk carrier selector should not depend on whether visible rows are selected')
assert.match(adminOrdersSource, /carrierSelect\.classList\.toggle\('hidden',\s*ordersViewMode === 'waiting_ship'\)/, 'carrier selector should be hidden once orders are already waiting for shipment')
assert.match(adminOrdersSource, /carrierSelect\.disabled = ordersViewMode === 'waiting_ship'/, 'carrier selector should not be clickable in waiting shipment mode')
assert.match(adminOrdersSource, /if \(success\)[\s\S]*selectEl\.value = carrier/, 'bulk carrier selector should keep the selected carrier visible after a successful change')
assert.doesNotMatch(
  adminOrdersSource.match(/if \(!ids\.length\) \{[\s\S]*?\n  \}/)?.[0] || '',
  /selectEl\.value = ''/,
  'carrier selector should not reset when used as the next arrange default without checked rows'
)
assert.match(
  adminOrdersSource,
  /const rawCarrier = String\(selectEl\?\.value \|\| ''\)\.trim\(\)[\s\S]*if \(!rawCarrier\) return/,
  'carrier placeholder option should clear the override silently without showing a GHTK toast'
)
assert.match(adminOrdersSource, /function getActiveBulkShippingCarrier[\s\S]*ordersCarrierBulkSelect/, 'admin orders UI should expose the current carrier selector value')
assert.match(adminOrdersSource, /function buildCarrierMapForOrderIds[\s\S]*getActiveBulkShippingCarrier[\s\S]*activeCarrier \|\| getOrderShippingCarrier/, 'arrange payload should prefer the current carrier selector over the row default')
assert.match(adminOrdersSource, /axios\.post\('\/api\/admin\/orders\/arrange-shipping',\s*\{ ids,\s*carriers:/, 'bulk arrange should send selected carrier map')
assert.match(adminOrdersSource, /axios\.post\('\/api\/admin\/orders\/arrange-shipping',\s*\{ ids: \[orderId\],\s*carriers:/, 'single arrange should send selected carrier')
assert.match(adminOrdersSource, /\/api\/admin\/orders\/shipping\/print-labels/, 'print action should use generic carrier-dispatch label endpoint')
assert.match(adminModalsSource, /id="arrangeFailedTitle"[\s\S]*Đơn lỗi khi tạo vận đơn/, 'arrange modal should expose a dynamic failed-carrier title')
assert.match(adminOrdersSource, /function getFailedCarriersLabel[\s\S]*normalizeShippingCarrierValue/, 'arrange modal should derive failed carrier labels dynamically')
assert.doesNotMatch(adminModalsSource, /Đơn lỗi khi tạo vận đơn GHTK/, 'arrange modal should not hardcode GHTK in the failed title')
assert.match(adminOrdersSource, /Chưa sắp xếp được đơn nào/, 'arrange modal should not report success when all selected orders fail')

assert.match(orderRoutesSource, /SUPPORTED_BUILT_IN_SHIPPING_CARRIERS = new Set\(\['GHTK', 'SPX', 'GHN'\]\)/, 'backend should recognize GHTK, SPX and GHN carriers')
assert.match(orderRoutesSource, /app\.patch\('\/api\/admin\/orders\/:id\/shipping-carrier'/, 'backend should expose carrier persistence endpoint')
assert.match(orderRoutesSource, /const requestedCarriers[\s\S]*body\.carriers/, 'arrange endpoint should accept per-order carrier selection')
assert.match(orderRoutesSource, /createShipmentForCarrier[\s\S]*case 'SPX'/, 'arrange endpoint should dispatch SPX orders away from GHTK')
assert.match(orderRoutesSource, /createShipmentForCarrier[\s\S]*case 'GHN'/, 'arrange endpoint should dispatch GHN orders away from GHTK')
assert.match(orderRoutesSource, /shipping_carrier=\?/, 'arrange endpoint should persist selected carrier dynamically')
assert.match(orderRoutesSource, /app\.get\('\/api\/admin\/orders\/shipping\/print-labels'/, 'backend should expose generic carrier-dispatch print endpoint')
assert.match(orderRoutesSource, /fetchLabelPdfForCarrier[\s\S]*case 'SPX'/, 'print endpoint should dispatch SPX labels away from GHTK')
assert.match(orderRoutesSource, /fetchLabelPdfForCarrier[\s\S]*case 'GHN'/, 'print endpoint should dispatch GHN labels away from GHTK')
assert.match(orderRoutesSource, /fetchLabelDocumentForCarrier[\s\S]*case 'GHN'[\s\S]*ghnFetchLabelDocument/, 'generic print endpoint should dispatch GHN HTML labels through document fetch')
assert.match(orderRoutesSource, /htmlDocs\.length === docs\.length[\s\S]*new Response\(bytes/, 'generic print endpoint should return GHN HTML labels directly')

assert.match(shippingHelpersSource, /export async function spxCreateShipment/, 'SPX shipment helper should exist')
assert.match(shippingHelpersSource, /export async function spxFetchLabelPdf/, 'SPX label helper should exist')
assert.match(shippingHelpersSource, /SPX_CREATE_ORDER_ENDPOINT_NOT_CONFIGURED/, 'SPX helper should fail explicitly until create endpoint is configured')
assert.match(shippingHelpersSource, /SPX_LABEL_ENDPOINT_NOT_CONFIGURED/, 'SPX label helper should fail explicitly until label endpoint is configured')
assert.match(shippingHelpersSource, /export async function getGhnConfig/, 'GHN config helper should exist')
assert.match(shippingHelpersSource, /export async function ghnCreateShipment/, 'GHN shipment helper should exist')
assert.match(shippingHelpersSource, /export async function ghnFetchLabelPdf/, 'GHN label helper should exist')
assert.match(shippingHelpersSource, /export async function getAvailableShippingCarriers/, 'carrier registry should expose available shipping carriers')
assert.match(shippingHelpersSource, /if \(!raw\) return new Set\(BUILT_IN_SHIPPING_CARRIERS\.map/, 'fresh installs should default built-in carriers to enabled')
assert.match(shippingHelpersSource, /return new Set\(codes\)/, 'an explicitly empty enabled carrier list should keep every carrier unavailable')

console.log('shipping carrier dispatch contract passed')
