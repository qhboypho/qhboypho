import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const adminScript = fs.readFileSync(path.join(root, 'src', 'pages', 'admin', 'script.ts'), 'utf8')
const routeSource = fs.readFileSync(path.join(root, 'src', 'routes', 'productRoutes.ts'), 'utf8')

assert.match(
  adminScript,
  /function getTrendingOrderBuckets\(currentProductId = null\)/,
  'admin script should group explicit trending order positions before deciding which ones are valid'
)

assert.match(
  adminScript,
  /function getValidTrendingOrderOwnerMap\(currentProductId = null\)/,
  'admin script should only treat unique explicit trending order positions as occupied'
)

assert.match(
  adminScript,
  /if \(products\.length === 1\) owners\.set\(order, products\[0\]\)/,
  'duplicate stale trending positions should not disable rank options or render rank badges'
)

assert.match(
  adminScript,
  /function getUsedTrendingOrderMap\(currentProductId = null\)/,
  'admin script should calculate valid trending order positions used by other products'
)

assert.match(
  adminScript,
  /function syncTrendingOrderOptions\(currentProductId = null\)/,
  'admin script should keep trending order options in sync with the current modal state'
)

assert.match(
  adminScript,
  /option\.disabled = false/,
  'trending order options should stay selectable so a new product can replace the old owner'
)

assert.match(
  adminScript,
  /option\.textContent = String\(value\)/,
  'trending order options should stay compact and only show the position number'
)

assert.doesNotMatch(
  adminScript,
  /đã dùng:/,
  'trending order dropdown should not include occupied product names because it makes the select too wide'
)

assert.match(
  adminScript,
  /function isTrendingOrderTaken\(order, currentProductId = null\)/,
  'admin script should expose duplicate detection only for display helpers'
)

assert.match(
  adminScript,
  /const isTrendingChecked = document\.getElementById\('pTrending'\)\.checked/,
  'admin save should derive an explicit trending checked state'
)

assert.match(
  adminScript,
  /const selectedTrendingOrder = isTrendingChecked \? \(parseInt\(document\.getElementById\('pTrendingOrder'\)\.value\) \|\| 0\) : 0/,
  'admin save should clear trending_order to 0 when trending is off or auto'
)

assert.match(
  adminScript,
  /const trendingOrder = Number\(p\.trending_order \|\| 0\)/,
  'admin product card should normalize trending_order before rendering the rank badge'
)

assert.match(
  adminScript,
  /function shouldShowTrendingOrderBadge\(product\)/,
  'admin product card should use the same valid owner logic as the dropdown'
)

assert.match(
  adminScript,
  /const showTrendingOrderBadge = shouldShowTrendingOrderBadge\(p\)/,
  'admin product card should hide stale duplicate rank badges when no product uniquely owns that rank'
)

assert.match(
  adminScript,
  /\\\$\{showTrendingOrderBadge \? \\\`<span[\s\S]*>#\\\$\{trendingOrder\}<\/span>\\\` : ''\}/,
  'admin product card should only render rank badge for explicit positive trending_order'
)

assert.doesNotMatch(
  adminScript,
  /showAdminToast\('Vị trí thịnh hành này đã được dùng/,
  'admin save should not block selecting an occupied trending order because backend will move the old owner to auto'
)

assert.match(
  routeSource,
  /async function validateUniqueTrendingOrder\(/,
  'product routes should validate trending order uniqueness server-side'
)

assert.match(
  routeSource,
  /if \(!isTrending \|\| order <= 0\) return \{ ok: true, order: 0 \}/,
  'backend should clear trending_order when product is not trending or auto-ranked'
)

assert.match(
  routeSource,
  /const conflicts = Array\.isArray\(\(result as any\)\.results\)/,
  'backend should inspect all existing products using the same explicit trending order'
)

assert.match(
  routeSource,
  /if \(conflicts\.length > 0\) return \{ ok: true, order, staleConflictIds:/,
  'backend should treat any existing rank owner as replaceable so the latest save can reclaim that position'
)

assert.match(
  routeSource,
  /async function clearStaleTrendingOrderConflicts\(/,
  'backend should clear old rank owners before saving the new valid owner'
)

assert.doesNotMatch(
  routeSource,
  /Vị trí thịnh hành này đã được dùng/,
  'backend should not reject occupied trending positions; it should replace the old owner'
)

assert.match(
  routeSource,
  /const trendingOrderValidation = await validateUniqueTrendingOrder\(c\.env\.DB, is_trending, trending_order/,
  'create/update routes should normalize and reclaim explicit trending order positions'
)

console.log('product trending order uniqueness contract ok')
