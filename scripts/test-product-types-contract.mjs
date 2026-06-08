import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const [routes, adminModals, adminScript, adminSections, storefrontScript] = await Promise.all([
  readFile(new URL('../src/routes/productRoutes.ts', import.meta.url), 'utf8'),
  readFile(new URL('../src/pages/admin/modals.ts', import.meta.url), 'utf8'),
  readFile(new URL('../src/pages/admin/script.ts', import.meta.url), 'utf8'),
  readFile(new URL('../src/pages/admin/sections.ts', import.meta.url), 'utf8'),
  readFile(new URL('../src/pages/storefront/script.ts', import.meta.url), 'utf8'),
])

assert.match(routes, /PRODUCT_TYPES_SETTING_KEY/, 'product type definitions should be stored centrally')
assert.match(routes, /PRODUCT_TYPE_MAP_SETTING_KEY/, 'products should keep a product_id to product_type map')
assert.match(routes, /\/api\/product-types/, 'storefront should have a public product type endpoint')
assert.match(routes, /\/api\/admin\/product-types/, 'admin should have a product type management endpoint')
assert.match(adminModals, /id="pProductType"/, 'admin product form should let admins choose product type')
assert.match(adminSections, /id="productSubmenu"/, 'product area should expose a submenu')
assert.match(adminSections, /id="page-product-types"/, 'product type editor should live on a dedicated admin page')
assert.match(adminSections, /onclick="toggleProductTypesEditor\(\)"/, 'product type editor title should toggle collapse state')
assert.match(adminScript, /loadAdminProductTypes/, 'admin should load product types before rendering product controls')
assert.match(adminScript, /openProductTypesAdmin/, 'admin should navigate to product type submenu page')
assert.match(adminScript, /syncProductTypesEditorCollapse/, 'admin product type editor should support collapse state')
assert.match(adminScript, /product_type/, 'admin product save payload should include selected product type')
assert.match(storefrontScript, /loadProductTypes/, 'storefront should load dynamic product types')
assert.match(storefrontScript, /renderFilterModalTypeOptions/, 'storefront filter modal should render product type chips dynamically')
assert.doesNotMatch(
  storefrontScript,
  /activeProductType === 'tshirt'[\s\S]*activeProductType === 'set'/,
  'storefront product type filtering should not depend on hardcoded name heuristics as the primary path'
)

console.log('product types contract passed')
