import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const orderRoutesSource = await readFile(new URL('../src/routes/orderRoutes.ts', import.meta.url), 'utf8')
const shippingHelpersSource = await readFile(new URL('../src/lib/shippingHelpers.ts', import.meta.url), 'utf8')
const adminOrdersSource = await readFile(new URL('../src/pages/admin/script-orders.ts', import.meta.url), 'utf8')
const adminSectionsSource = await readFile(new URL('../src/pages/admin/sections.ts', import.meta.url), 'utf8')

assert.match(adminSectionsSource, /Đơn vị vận chuyển/, 'orders table should include a carrier column header')
assert.match(adminOrdersSource, /const SHIPPING_CARRIERS[\s\S]*GHTK[\s\S]*SPX/, 'admin orders UI should list selectable carriers')
assert.match(adminOrdersSource, /function renderShippingCarrierSelect/, 'each order row should render carrier selector')
assert.match(adminOrdersSource, /function handleOrderCarrierChange[\s\S]*\/api\/admin\/orders\/'\s*\+\s*id\s*\+\s*'\/shipping-carrier/, 'carrier selector should persist per order')
assert.match(adminOrdersSource, /axios\.post\('\/api\/admin\/orders\/arrange-shipping',\s*\{ ids,\s*carriers:/, 'bulk arrange should send selected carrier map')
assert.match(adminOrdersSource, /axios\.post\('\/api\/admin\/orders\/arrange-shipping',\s*\{ ids: \[orderId\],\s*carriers:/, 'single arrange should send selected carrier')
assert.match(adminOrdersSource, /\/api\/admin\/orders\/shipping\/print-labels/, 'print action should use generic carrier-dispatch label endpoint')

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
