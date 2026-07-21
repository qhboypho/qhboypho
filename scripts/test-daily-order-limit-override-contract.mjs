import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const orderRoutesSource = await readFile(new URL('../src/routes/orderRoutes.ts', import.meta.url), 'utf8')
const blockRoutesSource = await readFile(new URL('../src/routes/blockRoutes.ts', import.meta.url), 'utf8')
const adminCustomersScriptSource = await readFile(new URL('../src/pages/admin/script-customers.ts', import.meta.url), 'utf8')
const adminSectionsSource = await readFile(new URL('../src/pages/admin/sections.ts', import.meta.url), 'utf8')
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

assert.match(
  adminSectionsSource,
  /dailyLimitOverridePhone[\s\S]*grantDailyOrderLimitOverrideByPhone\(this\)/,
  'admin customers page should expose a phone-based override control for guest customers and pass the clicked button'
)

assert.match(
  adminCustomersScriptSource,
  /grantDailyOrderLimitOverrideByPhone[\s\S]*closest[\s\S]*normalizeCustomerPhoneInput[\s\S]*grantDailyOrderLimitOverride\(null, phone\)/,
  'guest override control should grant an override by normalized phone without requiring a user account'
)

assert.match(
  adminCustomersScriptSource,
  /startsWith\('84'\)[\s\S]*'0' \+ phone\.slice\(2\)/,
  'admin customers script should normalize Vietnamese +84 phone numbers to the stored 0-prefix format'
)

assert.match(
  adminCustomersScriptSource,
  /replace\(\/\\\\s\+\/g[\s\S]*replace\(\/\[\^\\\\d\]\/g/,
  'admin customers script should preserve phone-normalization regex escapes inside the generated browser script'
)

assert.match(
  blockRoutesSource,
  /startsWith\('84'\)[\s\S]*'0' \+ phone\.slice\(2\)/,
  'admin override API should normalize Vietnamese +84 phone numbers before storing overrides'
)

console.log('daily order limit override contract passed')
