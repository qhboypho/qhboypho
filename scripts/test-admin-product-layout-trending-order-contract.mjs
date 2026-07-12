import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const modalSource = fs.readFileSync(path.join(root, 'src', 'pages', 'admin', 'modals.ts'), 'utf8')
const storefrontScript = fs.readFileSync(path.join(root, 'src', 'pages', 'storefront', 'script.ts'), 'utf8')
const routeSource = fs.readFileSync(path.join(root, 'src', 'routes', 'productRoutes.ts'), 'utf8')

assert.match(
  modalSource,
  /<div class="md:col-span-2 pt-4">\s*<div class="max-w-\[180px\] min-w-0">[\s\S]*id="pStock"/,
  'product modal should place stock on its own full-width row'
)

assert.match(
  modalSource,
  /<div class="md:col-span-2 rounded-2xl border border-gray-100 bg-gray-50 px-3 py-2\.5">[\s\S]*id="pFeatured"[\s\S]*id="pTrending"[\s\S]*id="pNewArrival"[\s\S]*id="pActive"[\s\S]*id="pTrendingOrder"/,
  'product modal should place feature checkboxes and trending order on their own full-width row'
)

assert.doesNotMatch(
  storefrontScript,
  /if \(configuredTrendingImage\) \{[\s\S]{0,900}renderCollapsedBanners\(heroBannersData\)\s*return/,
  'hero slider should not return early when a configured banner exists, otherwise trending_order products cannot appear first'
)

assert.match(
  storefrontScript,
  /const settingBannerCards = configuredTrendingImage \? \[/,
  'hero slider should keep configured banner as a card that can be merged with trending products'
)

assert.match(
  storefrontScript,
  /heroBannersData = sortHeroCards\(\[\.\.\.mapTrendingProductsToHeroCards\(trendingProducts\.length \? trendingProducts : fallbackProducts\), \.\.\.settingBannerCards\]\)/,
  'hero slider should sort merged trending products and configured banner cards together'
)

assert.match(
  routeSource,
  /CASE WHEN COALESCE\(trending_order, 0\) > 0 THEN trending_order ELSE 999999 END ASC/,
  'trending endpoint should keep explicit trending_order before automatic items'
)

console.log('admin product layout and trending order contract ok')
