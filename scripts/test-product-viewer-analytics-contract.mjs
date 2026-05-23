import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const productRoutesSource = await readFile(new URL('../src/routes/productRoutes.ts', import.meta.url), 'utf8')
const voucherStatsRoutesSource = await readFile(new URL('../src/routes/voucherStatsRoutes.ts', import.meta.url), 'utf8')
const migrationSource = await readFile(new URL('../migrations/0021_product_daily_viewers.sql', import.meta.url), 'utf8')

assert.match(
  migrationSource,
  /CREATE TABLE IF NOT EXISTS product_daily_viewers/,
  'migration should create product_daily_viewers'
)

assert.match(
  migrationSource,
  /PRIMARY KEY\s*\(\s*product_id\s*,\s*visitor_id\s*,\s*view_date\s*\)/,
  'product viewer table should be unique per product, visitor, and day'
)

assert.match(
  productRoutesSource,
  /ensureFrontendVisitorId/,
  'product detail view tracking should use the signed frontend visitor id'
)

assert.match(
  productRoutesSource,
  /INSERT OR IGNORE INTO product_daily_viewers/,
  'product detail view tracking should insert unique product viewers first'
)

assert.match(
  productRoutesSource,
  /meta\?\.changes[\s\S]*view_count = view_count \+ 1/,
  'aggregate product_daily_views should increment only when the unique viewer insert changed rows'
)

assert.match(
  productRoutesSource,
  /const counted = Number\(inserted\?\.meta\?\.changes \|\| 0\) > 0[\s\S]*if \(!counted\)[\s\S]*return false[\s\S]*INSERT INTO product_daily_views/,
  'product detail view tracking should stop before incrementing aggregate when the viewer was already counted'
)

assert.match(
  voucherStatsRoutesSource,
  /FROM product_daily_viewers/,
  'dashboard product viewers should come from product_daily_viewers'
)

assert.match(
  voucherStatsRoutesSource,
  /COUNT\(DISTINCT visitor_id\)/,
  'dashboard product viewers should count unique visitors, not product-view pairs'
)

console.log('product viewer analytics contract passed')
