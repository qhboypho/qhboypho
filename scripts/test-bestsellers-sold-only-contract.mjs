import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const routes = await readFile(new URL('../src/routes/productRoutes.ts', import.meta.url), 'utf8')

const bestsellersRoute = routes.match(/app\.get\('\/api\/bestsellers'[\s\S]*?\n  \}\)/)?.[0] || ''

assert.match(bestsellersRoute, /INNER JOIN\s*\(/, 'bestsellers should only join products with sold quantities')
assert.match(bestsellersRoute, /COALESCE\(s\.total_sold,\s*0\)\s*>\s*0/, 'bestsellers should hide products with zero sold count')
assert.doesNotMatch(bestsellersRoute, /LEFT JOIN\s*\(/, 'bestsellers should not include zero-sold products via LEFT JOIN')

console.log('bestsellers sold-only contract passed')
