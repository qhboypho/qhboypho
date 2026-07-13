import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const pageSource = fs.readFileSync(path.join(root, 'src', 'pages', 'hottrendnuPage.ts'), 'utf8')
const scriptSource = fs.readFileSync(path.join(root, 'src', 'pages', 'storefront', 'script.ts'), 'utf8')

assert.match(
  pageSource,
  /<div id="flashSaleDealsRow" class="hidden/,
  'QH Clothes flashsale wrapper should start hidden so disabled campaigns do not reserve empty layout space'
)
assert.match(
  pageSource,
  /<div id="dealsGridRow" class="hottrendnu-deals-row hidden/,
  'QH Clothes deals row should start hidden until trending or new-arrival products load'
)
assert.match(
  pageSource,
  /<section id="flashSaleShopSection" class="hottrendnu-section hidden">/,
  'QH Clothes flash sale section should start hidden until active flashsale products load'
)
assert.match(
  pageSource,
  /<section id="bestsellersSection" class="hottrendnu-section hidden">/,
  'QH Clothes bestsellers section should start hidden until real products load'
)
assert.match(
  pageSource,
  /function hotTrendNuTrendingProducts\(\): string/,
  'QH Clothes should render a separate trending-products section to replace the flashsale column when no flashsale is active'
)
assert.match(
  pageSource,
  /<h2 class="qhher-mini-title">Sản phẩm thịnh hành<\/h2>/,
  'QH Clothes trending section should use the requested Vietnamese heading'
)
assert.match(
  pageSource,
  /#flashSaleShopGrid \.htn-deal-card,\s*body\.hottrendnu-page #trendingProductsTrack \.htn-rank-card,/,
  'QH Clothes trending cards should share the same compact card sizing as flashsale cards'
)
assert.match(
  pageSource,
  /#flashSaleShopGrid \.htn-deal-media,\s*body\.hottrendnu-page #trendingProductsTrack \.htn-rank-image,/,
  'QH Clothes trending images should share the same compact image ratio as flashsale cards'
)
assert.match(
  pageSource,
  /body\.hottrendnu-page #trendingProductsSection \{\s*padding: 0\.85rem 0\.9rem 0\.75rem !important;/,
  'QH Clothes trending section needs explicit padding so the title does not sit on the border'
)
assert.match(
  pageSource,
  /body\.hottrendnu-page \.qhher-mini-empty/,
  'QH Clothes should style a compact empty state for the trending section when no products are checked as trending'
)
assert.doesNotMatch(
  pageSource,
  /id="flashSaleShopGrid"[\s\S]{0,240}animate-pulse/,
  'QH Clothes flashsale grid should not ship placeholder cards that become empty boxes on no-data reload'
)
assert.match(
  scriptSource,
  /function syncHotTrendNuDealsRowState\(\)/,
  'storefront runtime should keep QH Clothes deals row visibility in sync with loaded trending/new-arrival sections'
)
assert.match(
  scriptSource,
  /function syncHotTrendNuFlashSaleRowState\(\)/,
  'storefront runtime should keep QH Clothes flashsale wrapper visibility separate from the deals row'
)
assert.match(
  scriptSource,
  /async function loadHotTrendNuTrendingProducts\(\)/,
  'QH Clothes should load products checked as trending'
)
assert.match(
  scriptSource,
  /axios\.get\('\/api\/trending-products' \+ getStorefrontQuerySuffix\(\)\)/,
  'QH Clothes trending products should use the storefront-scoped trending endpoint'
)
assert.match(
  scriptSource,
  /Đang cập nhật sản phẩm thịnh hành/,
  'QH Clothes should keep the left trending block present with an empty state instead of collapsing the row when no trending products exist'
)
assert.match(
  scriptSource,
  /row\.classList\.toggle\('has-trending', hasTrending\)/,
  'QH Clothes deals row should size columns from the trending section, not flashsale state'
)
assert.doesNotMatch(
  scriptSource,
  /row\.classList\.toggle\('has-flashsale'/,
  'QH Clothes deals row should no longer depend on flashsale state'
)
assert.match(
  scriptSource,
  /loadHotTrendNuTrendingProducts\(\)[\s\S]{0,80}loadBestSellers\(\)/,
  'QH Clothes should refresh bestsellers after products load so fallback products can populate the section'
)

console.log('hottrendnu deals empty state contract ok')
