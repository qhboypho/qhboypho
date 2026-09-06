import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const [modalsSource, orderFlowSource, helpersSource, routesSource, runtimeConfigSource, appTypesSource, orderRoutesSource] = await Promise.all([
  readFile(new URL('../src/pages/storefront/modals.ts', import.meta.url), 'utf8'),
  readFile(new URL('../src/pages/storefront/script-detail-order.ts', import.meta.url), 'utf8'),
  readFile(new URL('../src/lib/paymentHelpers.ts', import.meta.url), 'utf8'),
  readFile(new URL('../src/routes/paymentRoutes.ts', import.meta.url), 'utf8'),
  readFile(new URL('../src/lib/runtimeConfigHelpers.ts', import.meta.url), 'utf8'),
  readFile(new URL('../src/types/app.ts', import.meta.url), 'utf8'),
  readFile(new URL('../src/routes/orderRoutes.ts', import.meta.url), 'utf8'),
])

assert.match(modalsSource, /selectCheckoutPaymentMethod\('\$\{scope\}','MOMO', this\)/, 'checkout should offer MoMo')
assert.match(orderFlowSource, /paymentMethod === 'MOMO'/, 'checkout should launch the MoMo flow')
assert.match(orderFlowSource, /\/api\/orders\/' \+ orderId \+ '\/momo-link'/, 'checkout should create a MoMo payment session')

for (const key of ['MOMO_PARTNER_CODE', 'MOMO_ACCESS_KEY', 'MOMO_SECRET_KEY', 'MOMO_IPN_URL']) {
  assert.match(runtimeConfigSource, new RegExp(`${key}:`), `${key} should resolve from runtime config`)
  assert.match(appTypesSource, new RegExp(`${key}\\?: string`), `${key} should be a server-side binding`)
}

assert.match(helpersSource, /export async function getMoMoConfig/, 'MoMo config helper should exist')
assert.match(helpersSource, /export async function syncOrderPaymentWithMoMo/, 'MoMo reconciliation helper should exist')
assert.match(routesSource, /\/api\/orders\/:id\/momo-link/, 'MoMo checkout session endpoint should exist')
assert.match(routesSource, /\/api\/payments\/momo\/ipn/, 'MoMo IPN endpoint should exist')
assert.match(routesSource, /MOMO_INVALID_SIGNATURE/, 'MoMo IPN should reject an invalid signature')
assert.match(routesSource, /return c\.body\(null, 204\)/, 'MoMo IPN should acknowledge a valid notification with HTTP 204')
assert.match(orderRoutesSource, /'BANK_TRANSFER', 'ZALOPAY', 'MOMO'/, 'paid MoMo orders should enter the shipping queue')

console.log('MoMo integration source contract passed')
