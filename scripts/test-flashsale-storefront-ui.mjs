import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const storefrontPagePath = path.join(root, 'src', 'pages', 'storefrontPage.ts')
const source = fs.readFileSync(storefrontPagePath, 'utf8')

assert.match(source, /id="flashSaleShopSection"/, 'flash sale storefront section should exist')
assert.match(source, /async function loadFlashSaleShop\(/, 'flash sale storefront loader should exist')
assert.match(source, /\/api\/flash-sales\/active-products/, 'flash sale storefront loader should fetch active products')
assert.match(source, /flash-sale-badge/, 'flash sale badge style should exist in storefront render')
assert.match(source, /flash-sale-countdown/, 'flash sale countdown treatment should exist in storefront render')
assert.match(source, /has_flash_sale/, 'storefront product cards should check flash sale state')
assert.match(source, /display_price|display_sale_price/, 'storefront flash sale display price should be rendered')

console.log('flash sale storefront UI contract ok')