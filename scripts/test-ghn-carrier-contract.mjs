import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const shippingHelpersSource = await readFile(new URL('../src/lib/shippingHelpers.ts', import.meta.url), 'utf8')
const adminUtilityRoutesSource = await readFile(new URL('../src/routes/adminUtilityRoutes.ts', import.meta.url), 'utf8')
const indexSource = await readFile(new URL('../src/index.tsx', import.meta.url), 'utf8')
const adminSettingsSource = await readFile(new URL('../src/pages/admin/script-featured-settings.ts', import.meta.url), 'utf8')
const adminWarehouseSource = await readFile(new URL('../src/pages/admin/script-flashsale.ts', import.meta.url), 'utf8')

assert.match(
  shippingHelpersSource,
  /export async function getGhnConfig\(db: D1Database,\s*env: AppBindings\)[\s\S]*getRuntimeConfigValues\(db,\s*env,\s*\[[\s\S]*'GHN_TOKEN'[\s\S]*'GHN_SHOP_ID'[\s\S]*'GHN_CLIENT_ID'/,
  'GHN config should resolve credentials through DB/env runtime fallback'
)

assert.match(
  shippingHelpersSource,
  /shipping-order\/create[\s\S]*Token[\s\S]*ShopId/,
  'GHN shipment helper should call the GHN create-order API with Token and ShopId'
)

assert.match(
  shippingHelpersSource,
  /export function normalizeGhnAddressToken[\s\S]*huyen dao[\s\S]*dac khu/,
  'GHN address mapper should normalize Vietnamese administrative prefixes without changing the GHTK mapper'
)

assert.match(
  shippingHelpersSource,
  /getGhnAddressNames[\s\S]*NameExtension/,
  'GHN address mapper should match against GHN NameExtension aliases'
)

assert.doesNotMatch(
  shippingHelpersSource,
  /from_ward_name:\s*pickup\.pickWard|from_district_name:\s*pickup\.pickDistrict|from_province_name:\s*pickup\.pickProvince/,
  'GHN create payload should not reuse GHTK pickup place names'
)

assert.match(
  shippingHelpersSource,
  /GHN_UNSUPPORTED_DELIVERY_AREA/,
  'GHN helper should return a clear unsupported-area error before calling create order'
)

assert.doesNotMatch(
  shippingHelpersSource.match(/function isGhnUnsupportedArea[\s\S]*?\n\}/)?.[0] || '',
  /DeliverType|deliver_type/,
  'GHN unsupported-area precheck should not block deliverable wards from district DeliverType metadata'
)

assert.match(
  shippingHelpersSource,
  /v2\/a5\/gen-token/,
  'GHN label helper should generate a print token before fetching the A5 label'
)
assert.match(shippingHelpersSource, /printA5/, 'GHN label helper should fetch the A5 PDF URL')
assert.match(
  shippingHelpersSource,
  /export async function ghnFetchLabelDocument[\s\S]*contentType[\s\S]*text\/html/,
  'GHN label helper should preserve HTML labels returned by printA5 instead of forcing PDF'
)
assert.match(
  shippingHelpersSource,
  /GHN_LABEL_PRINT_FIX_STYLE[\s\S]*page-break-after:\s*auto[\s\S]*break-after:\s*auto[\s\S]*normalizeGhnLabelHtml/,
  'GHN HTML label helper should suppress the trailing blank print page'
)

assert.match(
  adminUtilityRoutesSource,
  /getGhnConfig: \(db: D1Database,\s*env: AppBindings\) => Promise<GhnConfig>/,
  'admin utility routes should receive getGhnConfig dependency'
)

assert.match(
  adminUtilityRoutesSource,
  /app\.get\('\/api\/admin\/shipping\/carriers'/,
  'admin utility routes should expose the carrier registry endpoint'
)

assert.match(
  adminUtilityRoutesSource,
  /ghn_token[\s\S]*ghn_shop_id[\s\S]*ghn_client_id/,
  'warehouse config endpoint should save GHN credentials'
)

assert.match(
  indexSource,
  /getGhnConfig[\s\S]*registerAdminUtilityRoutes[\s\S]*getGhnConfig/,
  'app bootstrap should wire GHN config into admin utility routes'
)

for (const id of ['ghnToken', 'ghnShopId', 'ghnClientId', 'ghnCredentialHint']) {
  assert.match(adminSettingsSource + adminWarehouseSource, new RegExp(id), `admin warehouse UI should include ${id}`)
}

assert.match(
  adminSettingsSource,
  /ghn_token[\s\S]*ghn_shop_id[\s\S]*ghn_client_id/,
  'admin warehouse save action should post GHN credentials'
)

console.log('ghn carrier contract passed')
