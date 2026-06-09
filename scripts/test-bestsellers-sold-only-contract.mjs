import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const routes = await readFile(new URL('../src/routes/productRoutes.ts', import.meta.url), 'utf8')

const bestsellersRoute = routes.match(/app\.get\('\/api\/bestsellers'[\s\S]*?\n  \}\)/)?.[0] || ''

const storefrontScript = await readFile(new URL('../src/pages/storefront/script.ts', import.meta.url), 'utf8')

assert.match(bestsellersRoute, /LEFT JOIN\s*\(/, 'bestsellers should still return active products when no sales exist')
assert.match(bestsellersRoute, /COALESCE\(s\.total_sold,\s*0\)\s+as\s+total_sold/i, 'bestsellers should expose zero sold counts')
assert.doesNotMatch(bestsellersRoute, /COALESCE\(s\.total_sold,\s*0\)\s*>\s*0/, 'bestsellers should not hide zero-sold products at API level')
assert.match(storefrontScript, /let soldRank = 0/, 'storefront should track ranking only for sold products')
assert.match(storefrontScript, /soldCount > 0 \? soldRank\+\+ : -1/, 'storefront should not assign rank to zero-sold products')
assert.match(storefrontScript, /rankIndex >= 0 \?/, 'storefront should render medal only when a sold rank exists')

console.log('bestsellers ranking visibility contract passed')
