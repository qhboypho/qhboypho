import fs from 'node:fs'
import path from 'node:path'
import assert from 'node:assert/strict'

const sourcePath = path.resolve('src/routes/orderRoutes.ts')
const source = fs.readFileSync(sourcePath, 'utf8')

assert.match(
  source,
  /async function linkGuestOrdersToUser\(/,
  'orderRoutes.ts should define a conservative helper to link guest orders to the authenticated user'
)

assert.match(
  source,
  /UPDATE orders[\s\S]*SET user_id = \?[\s\S]*WHERE user_id IS NULL[\s\S]*customer_email/,
  'guest order linking must only update unclaimed orders and use authenticated user email as the proof key'
)

assert.match(
  source,
  /app\.get\('\/api\/user\/orders'[\s\S]*linkGuestOrdersToUser\(c\.env\.DB, user\)[\s\S]*WHERE o\.user_id=\?/,
  '/api/user/orders should reconcile safe guest orders before selecting by user_id'
)

assert.match(
  source,
  /SELECT id, email FROM users WHERE id = \? LIMIT 1/,
  'order history should validate the session user exists and load the session email before linking guest orders'
)

assert.match(
  source,
  /INSERT INTO orders[\s\S]*customer_email[\s\S]*normalizeOrderEmail\(user\?\.email\) \|\| null/,
  'new authenticated orders should persist the user email so future history repair does not depend only on phone'
)

const migration = fs.readFileSync(path.resolve('migrations/0019_orders_customer_email.sql'), 'utf8')
assert.match(
  migration,
  /ALTER TABLE orders ADD COLUMN customer_email TEXT/,
  'migration should add orders.customer_email for authenticated order history repair'
)

console.log('User order history linking contract passed')
