import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const source = [
  path.join(root, 'src', 'pages', 'storefrontPage.ts'),
  path.join(root, 'src', 'pages', 'storefront', 'sections.ts'),
  path.join(root, 'src', 'pages', 'storefront', 'script.ts'),
  path.join(root, 'src', 'pages', 'storefront', 'styles.ts')
].map((filePath) => fs.readFileSync(filePath, 'utf8')).join('\n')

assert.match(source, /id=(?:\\"|")flashSaleShopSection(?:\\"|")/, 'flash sale storefront section should exist')
assert.match(source, /async function loadFlashSaleShop\(/, 'flash sale storefront loader should exist')
assert.match(source, /\/api\/flash-sales\/active-products/, 'flash sale storefront loader should fetch active products')
assert.match(source, /flash-sale-badge/, 'flash sale badge style should exist in storefront render')
assert.match(source, /flash-sale-countdown/, 'flash sale countdown treatment should exist in storefront render')
assert.match(source, /has_flash_sale/, 'storefront product cards should check flash sale state')
assert.match(source, /display_price|display_sale_price/, 'storefront flash sale display price should be rendered')
assert.match(source, /flash-sale-mini-strip/, 'storefront product cards should render a compact flash sale strip under the price')
assert.match(source, /flash-sale-mini-label/, 'flash sale strip should include a left label like the reference image')
assert.match(source, /flash-sale-mini-timer/, 'flash sale strip should include a countdown timer segment')
assert.match(
  source,
  /text-gradient-price[\s\S]{0,420}renderFlashSaleMiniStrip\(flashMeta\)/,
  'flash sale strip should be rendered below the product card price'
)

const flashSaleShopLoader = source.match(/async function loadFlashSaleShop\([\s\S]*?\n\}/)
assert.ok(flashSaleShopLoader, 'flash sale shop loader should be present')
assert.doesNotMatch(
  flashSaleShopLoader[0],
  /absolute left-3 top-3[\s\S]*flash-sale-badge[\s\S]*flash-sale-countdown/,
  'flash sale shop cards should not overlay badge and countdown on product images'
)
assert.match(
  flashSaleShopLoader[0],
  /text-gradient-price[\s\S]{0,420}renderFlashSaleMiniStrip\(meta\)/,
  'flash sale shop cards should reuse the compact flash sale strip below the price'
)

console.log('flash sale storefront UI contract ok')
