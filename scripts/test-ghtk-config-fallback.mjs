import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const returnsRouteSource = await readFile(new URL('../src/routes/returnsRoutes.ts', import.meta.url), 'utf8')
const orderRoutesSource = await readFile(new URL('../src/routes/orderRoutes.ts', import.meta.url), 'utf8')
const shippingHelpersSource = await readFile(new URL('../src/lib/shippingHelpers.ts', import.meta.url), 'utf8')

assert.match(
  returnsRouteSource,
  /getGhtkApiCredentials\(c\.env\.DB,\s*c\.env\)/,
  'returns sync should resolve GHTK credentials from DB-backed helper'
)
assert.doesNotMatch(
  returnsRouteSource,
  /const token = String\(c\.env\.GHTK_TOKEN \|\| ''\)\.trim\(\)[\s\S]*const clientSource = String\(c\.env\.GHTK_CLIENT_SOURCE \|\| ''\)\.trim\(\)/,
  'returns sync should not read GHTK credentials only from env'
)

assert.match(
  orderRoutesSource,
  /ghtkCancelShipment\(c\.env,\s*c\.env\.DB,\s*trackingCode\)/,
  'GHTK cancel flow should pass DB to resolve dashboard-saved credentials'
)

assert.match(
  orderRoutesSource,
  /ghtkFetchLabelPdf\(c\.env,\s*c\.env\.DB,\s*String\(row\.shipping_tracking_code\)/,
  'GHTK print labels flow should pass DB to resolve dashboard-saved credentials'
)

assert.doesNotMatch(
  shippingHelpersSource,
  /export async function ghtkFetchLabelPdf[\s\S]*?const token = String\(env\.GHTK_TOKEN \|\| ''\)\.trim\(\)[\s\S]*?const clientSource = String\(env\.GHTK_CLIENT_SOURCE \|\| ''\)\.trim\(\)/,
  'GHTK label helper should not read credentials only from env'
)

assert.doesNotMatch(
  shippingHelpersSource,
  /export async function ghtkCancelShipment[\s\S]*?const token = String\(env\.GHTK_TOKEN \|\| ''\)\.trim\(\)[\s\S]*?const clientSource = String\(env\.GHTK_CLIENT_SOURCE \|\| ''\)\.trim\(\)/,
  'GHTK cancel helper should not read credentials only from env'
)

assert.match(
  shippingHelpersSource,
  /getRuntimeConfigValues\(db,\s*env,\s*\['GHTK_TOKEN',\s*'GHTK_CLIENT_SOURCE'\]\)/,
  'GHTK helper should use the shared runtime config fallback layer'
)

assert.match(
  shippingHelpersSource,
  /GHTK_PICK_ADDRESS_ID[\s\S]*GHTK_PICK_NAME[\s\S]*GHTK_PICK_TEL/,
  'GHTK pickup config should use the same runtime config fallback layer for warehouse settings'
)

console.log('ghtk config fallback contract passed')
