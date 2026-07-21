import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const orderRoutesSource = await readFile(new URL('../src/routes/orderRoutes.ts', import.meta.url), 'utf8')
const blockRoutesSource = await readFile(new URL('../src/routes/blockRoutes.ts', import.meta.url), 'utf8')
const adminCustomersScriptSource = await readFile(new URL('../src/pages/admin/script-customers.ts', import.meta.url), 'utf8')
const migrationSource = await readFile(new URL('../migrations/0026_daily_order_limit_overrides.sql', import.meta.url), 'utf8')

assert.match(
  migrationSource,
  /CREATE TABLE IF NOT EXISTS daily_order_limit_overrides/,
  'migration should create daily_order_limit_overrides'
)

assert.match(
  migrationSource,
  /override_date[\s\S]*expires_at[\s\S]*is_active/,
  'override table should store one-day expiry state'
)

assert.match(
  orderRoutesSource,
  /hasActiveDailyOrderLimitOverride/,
  'order route should check admin daily order limit overrides before enforcing the risk limit'
)

assert.match(
  orderRoutesSource,
  /daily_order_limit_overrides[\s\S]*override_date[\s\S]*customer_phone[\s\S]*datetime\(expires_at\) > datetime\('now'\)/,
  'override lookup should match by phone/date and require an active unexpired override'
)

assert.match(
  blockRoutesSource,
  /\/api\/admin\/customers\/daily-limit-override/,
  'admin routes should expose an endpoint to grant a daily order limit override'
)

assert.match(
  blockRoutesSource,
  /\/api\/admin\/customers\/daily-limit-override\/revoke/,
  'admin routes should expose an endpoint to revoke a daily order limit override'
)

assert.match(
  blockRoutesSource,
  /INSERT INTO daily_order_limit_overrides[\s\S]*ON CONFLICT\(customer_phone, override_date\) DO UPDATE/,
  'grant endpoint should upsert the customer/date override'
)

assert.match(
  adminCustomersScriptSource,
  /customerDailyLimitOverrideButton/,
  'admin customers UI should render a daily limit override button'
)

assert.match(
  adminCustomersScriptSource,
  /grantDailyOrderLimitOverride[\s\S]*\/api\/admin\/customers\/daily-limit-override/,
  'admin customers script should call the grant override API'
)

assert.match(
  adminCustomersScriptSource,
  /revokeDailyOrderLimitOverride[\s\S]*\/api\/admin\/customers\/daily-limit-override\/revoke/,
  'admin customers script should call the revoke override API'
)

console.log('daily order limit override contract passed')
