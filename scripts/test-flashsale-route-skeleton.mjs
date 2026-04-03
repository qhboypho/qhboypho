import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const routePath = path.join(root, 'src', 'routes', 'flashSaleRoutes.ts')
const indexPath = path.join(root, 'src', 'index.tsx')

assert.ok(fs.existsSync(routePath), 'flashSaleRoutes.ts should exist')

const routeSource = fs.readFileSync(routePath, 'utf8')
const indexSource = fs.readFileSync(indexPath, 'utf8')

assert.match(routeSource, /export function registerFlashSaleRoutes\(/, 'route module should export registerFlashSaleRoutes')
assert.match(routeSource, /\/api\/admin\/flash-sales/, 'route module should include admin flash sale route')
assert.match(routeSource, /\/api\/flash-sales/, 'route module should include storefront flash sale route')
assert.match(indexSource, /registerFlashSaleRoutes/, 'index should import and register flash sale routes')

console.log('flash sale route skeleton ok')
