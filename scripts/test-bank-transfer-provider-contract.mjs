import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const runtimeConfigSource = await readFile(new URL('../src/lib/runtimeConfigHelpers.ts', import.meta.url), 'utf8')
const appTypesSource = await readFile(new URL('../src/types/app.ts', import.meta.url), 'utf8')
const paymentHelpersSource = await readFile(new URL('../src/lib/paymentHelpers.ts', import.meta.url), 'utf8')
const paymentRoutesSource = await readFile(new URL('../src/routes/paymentRoutes.ts', import.meta.url), 'utf8')
const storefrontScriptSource = await readFile(new URL('../src/pages/storefront/script.ts', import.meta.url), 'utf8')
const detailOrderScriptSource = await readFile(new URL('../src/pages/storefront/script-detail-order.ts', import.meta.url), 'utf8')

for (const key of [
  'BANK_TRANSFER_PROVIDER',
  'MANUAL_VIETQR_BANK_ID',
  'MANUAL_VIETQR_ACCOUNT_NO',
  'MANUAL_VIETQR_ACCOUNT_NAME',
  'MANUAL_VIETQR_TEMPLATE',
]) {
  assert.match(runtimeConfigSource, new RegExp(`${key}:`), `runtime config should map ${key}`)
  assert.match(appTypesSource, new RegExp(`${key}\\?: string`), `AppBindings should expose ${key}`)
}

assert.match(
  paymentHelpersSource,
  /export async function getBankTransferProviderConfig/,
  'payment helpers should resolve the active BANK_TRANSFER provider'
)

assert.match(
  paymentHelpersSource,
  /export function buildManualVietQRPaymentData/,
  'payment helpers should build a manual VietQR payload'
)

assert.match(
  paymentHelpersSource,
  /provider: 'MANUAL_VIETQR'/,
  'manual VietQR payload should identify its provider'
)

assert.match(
  paymentHelpersSource,
  /img\.vietqr\.io\/image/,
  'manual VietQR payload should include a VietQR image URL'
)

assert.match(
  paymentHelpersSource,
  /method === 'BANK_TRANSFER'[\s\S]*provider === 'MANUAL_VIETQR'[\s\S]*return \{ synced: false, paid: false, provider \}/,
  'BANK_TRANSFER sync should not call PayOS when manual VietQR is active'
)

assert.match(
  paymentRoutesSource,
  /app\.post\('\/api\/orders\/:id\/bank-transfer-link'/,
  'payment routes should expose a provider-neutral bank-transfer link endpoint'
)

assert.match(
  paymentRoutesSource,
  /activeProvider === 'MANUAL_VIETQR'[\s\S]*buildManualVietQRPaymentData/,
  'bank-transfer endpoint should return manual VietQR data when configured'
)

assert.match(
  paymentRoutesSource,
  /app\.post\('\/api\/orders\/:id\/payos-link'[\s\S]*bank-transfer-link/,
  'legacy payos-link endpoint should remain as an alias'
)

assert.doesNotMatch(
  storefrontScriptSource,
  /\/api\/orders\/' \+ orderId \+ '\/payos-link'/,
  'storefront resume flow should not hardcode payos-link'
)

assert.doesNotMatch(
  detailOrderScriptSource,
  /\/api\/orders\/' \+ orderId \+ '\/payos-link'/,
  'detail order flow should not hardcode payos-link'
)

assert.match(
  detailOrderScriptSource,
  /paymentData\?\.provider[\s\S]*MANUAL_VIETQR/,
  'detail order flow should understand manual VietQR provider responses'
)

console.log('bank transfer provider contract passed')
