import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const routeSource = readFileSync('src/routes/productRoutes.ts', 'utf8')
const adminSource = readFileSync('src/pages/admin/script.ts', 'utf8')

const deleteRouteStart = routeSource.indexOf("app.delete('/api/admin/products/:id'")
const deleteRouteEnd = routeSource.indexOf("app.patch('/api/admin/products/:id/toggle'", deleteRouteStart)
const deleteRoute = routeSource.slice(deleteRouteStart, deleteRouteEnd)
assert.ok(deleteRoute, 'admin product delete route should exist')
assert.match(deleteRoute, /await deps\.initDB\(c\.env\.DB\)/, 'delete route should initialize the schema before querying dependencies')
assert.match(deleteRoute, /SELECT COUNT\(\*\) AS count FROM orders\s+WHERE product_id = \?/, 'delete route should preserve products referenced by orders')
assert.match(deleteRoute, /\}, 409\)/, 'delete route should return a conflict for products with order history')
assert.match(deleteRoute, /DELETE FROM product_skus WHERE product_id = \?/, 'delete route should remove dependent SKU rows first')
assert.match(deleteRoute, /DELETE FROM reviews WHERE product_id = \?/, 'delete route should remove dependent reviews first')
assert.match(deleteRoute, /DELETE FROM product_daily_views WHERE product_id = \?/, 'delete route should remove dependent view aggregates first')
assert.match(deleteRoute, /DELETE FROM product_detail_views WHERE product_id = \?/, 'delete route should remove dependent view logs first')
assert.match(deleteRoute, /DELETE FROM product_daily_viewers WHERE product_id = \?/, 'delete route should remove dependent unique-view rows first')
assert.match(deleteRoute, /DELETE FROM flash_sale_items WHERE product_id = \?/, 'delete route should remove flash-sale references first')
assert.match(deleteRoute, /DELETE FROM products WHERE id = \?/, 'delete route should delete the product after dependent cleanup')

const deleteUi = adminSource.match(/async function deleteProduct\(id\) \{[\s\S]*?\n\}/)?.[0] || ''
assert.match(deleteUi, /await axios\.delete/, 'admin delete action should call the delete API')
assert.match(deleteUi, /e\.response\?\.data\?\.error/, 'admin delete action should display the server error to the admin')

console.log('admin product delete contract ok')
