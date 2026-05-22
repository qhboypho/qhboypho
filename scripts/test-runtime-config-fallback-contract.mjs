import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const runtimeConfigSource = await readFile(new URL('../src/lib/runtimeConfigHelpers.ts', import.meta.url), 'utf8')
const paymentRoutesSource = await readFile(new URL('../src/routes/paymentRoutes.ts', import.meta.url), 'utf8')
const paymentHelpersSource = await readFile(new URL('../src/lib/paymentHelpers.ts', import.meta.url), 'utf8')
const authRoutesSource = await readFile(new URL('../src/routes/authRoutes.ts', import.meta.url), 'utf8')

for (const key of [
  'CASSO_SECURE_TOKEN',
  'PAYOS_CLIENT_ID',
  'PAYOS_API_KEY',
  'PAYOS_CHECKSUM_KEY',
  'ZALOPAY_APP_ID',
  'ZALOPAY_KEY1',
  'ZALOPAY_KEY2',
  'GOOGLE_CLIENT_ID',
  'GOOGLE_CLIENT_SECRET',
  'TURNSTILE_SITE_KEY',
  'TURNSTILE_SECRET_KEY',
  'GHTK_TOKEN',
  'GHTK_CLIENT_SOURCE',
  'SPX_USER_ID',
  'SPX_SECRET_KEY',
  'SPX_ACCOUNT_ID',
  'GHN_TOKEN',
  'GHN_SHOP_ID',
  'GHN_CLIENT_ID',
]) {
  assert.match(runtimeConfigSource, new RegExp(`${key}:`), `runtime config should map ${key}`)
}

assert.match(
  runtimeConfigSource,
  /INSERT INTO app_settings[\s\S]*ON CONFLICT\(key\) DO UPDATE[\s\S]*TRIM\(app_settings\.value\) = ''/,
  'runtime config should hydrate empty DB settings from env backup values without overwriting existing dashboard settings'
)

assert.match(
  paymentRoutesSource,
  /getRuntimeConfigValue\(c\.env\.DB,\s*c\.env,\s*'CASSO_SECURE_TOKEN'\)/,
  'Casso webhook should use DB/env runtime config fallback'
)

assert.match(
  paymentRoutesSource,
  /deps\.getPayOSConfig\(c\.env\.DB,\s*c\.env\)/,
  'PayOS routes should use DB/env runtime config fallback'
)

assert.match(
  paymentHelpersSource,
  /getRuntimeConfigValues\(db,\s*env,\s*\['PAYOS_CLIENT_ID',\s*'PAYOS_API_KEY',\s*'PAYOS_CHECKSUM_KEY'\]\)/,
  'PayOS helper should resolve credentials through runtime config'
)

assert.match(
  paymentHelpersSource,
  /getRuntimeConfigValues\(db,\s*env,\s*\[[\s\S]*'ZALOPAY_APP_ID'[\s\S]*'ZALOPAY_KEY1'[\s\S]*'ZALOPAY_KEY2'/,
  'ZaloPay helper should resolve credentials through runtime config'
)

assert.match(
  authRoutesSource,
  /getRuntimeConfigValues\(c\.env\.DB,\s*c\.env,\s*\[[\s\S]*'GOOGLE_CLIENT_ID'[\s\S]*'GOOGLE_CLIENT_SECRET'[\s\S]*'GOOGLE_REDIRECT_URI'/,
  'Google OAuth should resolve credentials through runtime config'
)

console.log('runtime config fallback contract passed')
