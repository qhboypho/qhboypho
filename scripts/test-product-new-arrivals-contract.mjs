import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const modalSource = fs.readFileSync(path.join(root, 'src', 'pages', 'admin', 'modals.ts'), 'utf8')
const adminScript = fs.readFileSync(path.join(root, 'src', 'pages', 'admin', 'script.ts'), 'utf8')
const routeSource = fs.readFileSync(path.join(root, 'src', 'routes', 'productRoutes.ts'), 'utf8')
const storefrontScript = fs.readFileSync(path.join(root, 'src', 'pages', 'storefront', 'script.ts'), 'utf8')
const migrationSource = fs.readFileSync(path.join(root, 'migrations', '0025_product_new_arrivals.sql'), 'utf8')

assert.match(
  modalSource,
  /id="pNewArrival"[\s\S]{0,140}<span>Hàng mới về<\/span>/,
  'product modal should include Hàng mới về checkbox'
)

assert.match(
  adminScript,
  /document\.getElementById\('pNewArrival'\)\.checked = !!p\.is_new_arrival/,
  'edit product should hydrate Hàng mới về checkbox'
)

assert.match(
  adminScript,
  /is_new_arrival: document\.getElementById\('pNewArrival'\)\.checked/,
  'save product should submit is_new_arrival'
)

assert.match(
  routeSource,
  /ALTER TABLE products ADD COLUMN is_new_arrival INTEGER DEFAULT 0/,
  'runtime schema guard should add is_new_arrival column'
)

assert.match(
  routeSource,
  /p\.is_featured, p\.is_trending, p\.is_new_arrival,/,
  'admin product listing should select is_new_arrival'
)

assert.match(
  routeSource,
  /is_featured, is_trending, is_new_arrival, trending_order, storefront_visibility/,
  'admin product create/update should accept is_new_arrival'
)

assert.match(
  routeSource,
  /app\.get\('\/api\/new-arrival-products'/,
  'public API should expose storefront-scoped new arrival products'
)

assert.match(
  routeSource,
  /WHERE is_active=1 AND is_new_arrival=1\$\{storefrontWhere\.clause\}/,
  'new arrival endpoint should only return checked active products'
)

assert.match(
  storefrontScript,
  /axios\.get\('\/api\/new-arrival-products\?limit=10&storefront=' \+ encodeURIComponent\(getCurrentStorefrontKey\(\)\)\)/,
  'QH Clothes Hàng mới về should load from new-arrival endpoint'
)

assert.match(
  migrationSource,
  /ALTER TABLE products ADD COLUMN is_new_arrival INTEGER DEFAULT 0;/,
  'migration should add is_new_arrival column'
)

console.log('product new arrivals contract ok')
