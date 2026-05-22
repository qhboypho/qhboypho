import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const orderRoutesSource = await readFile(new URL('../src/routes/orderRoutes.ts', import.meta.url), 'utf8')
const shippingHelpersSource = await readFile(new URL('../src/lib/shippingHelpers.ts', import.meta.url), 'utf8')
const storefrontSource = await readFile(new URL('../src/pages/storefront/script.ts', import.meta.url), 'utf8')
const storefrontDetailSource = await readFile(new URL('../src/pages/storefront/script-detail-order.ts', import.meta.url), 'utf8')
const migrationSource = await readFile(new URL('../migrations/0020_orders_address_metadata.sql', import.meta.url), 'utf8')

for (const column of ['customer_province_code', 'customer_commune_code', 'customer_address_effective_date']) {
  assert.match(migrationSource, new RegExp(`ADD COLUMN ${column} TEXT`), `migration should add ${column}`)
  assert.match(orderRoutesSource, new RegExp(column), `order routes should persist/select ${column}`)
}

assert.match(
  storefrontSource,
  /address_effective_date:\s*payload\.addressPayload\.effectiveDate/,
  'main storefront checkout should send address effective date metadata'
)

assert.match(
  storefrontSource,
  /customer_province_code:\s*payload\.addressPayload\.provinceCode[\s\S]*customer_commune_code:\s*payload\.addressPayload\.communeCode/,
  'main storefront checkout should send address province/commune codes'
)

assert.match(
  storefrontDetailSource,
  /customer_province_code:\s*payload\.addressPayload\.provinceCode[\s\S]*customer_commune_code:\s*payload\.addressPayload\.communeCode/,
  'detail-order checkout bundle should send address province/commune codes'
)

assert.match(
  shippingHelpersSource,
  /ADDRESS_KIT_LEGACY_EFFECTIVE_DATE = '2025-06-30'/,
  'GHN address conversion should use the pre-merge address-kit date'
)

assert.match(
  shippingHelpersSource,
  /resolveAddressKitLegacyCommuneByCode[\s\S]*customer_commune_code/,
  'GHN helper should convert new address metadata to legacy address-kit commune data'
)

assert.match(
  shippingHelpersSource,
  /resolveGhnRecipientAddress\(config: GhnConfig,\s*rawAddress: string,\s*order: any/,
  'GHN recipient resolver should receive order metadata'
)

console.log('address metadata GHN contract passed')
