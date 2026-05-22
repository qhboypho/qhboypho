import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const shippingHelpersSource = await readFile(new URL('../src/lib/shippingHelpers.ts', import.meta.url), 'utf8')
const adminUtilityRoutesSource = await readFile(new URL('../src/routes/adminUtilityRoutes.ts', import.meta.url), 'utf8')
const indexSource = await readFile(new URL('../src/index.tsx', import.meta.url), 'utf8')
const adminSettingsSource = await readFile(new URL('../src/pages/admin/script-featured-settings.ts', import.meta.url), 'utf8')
const adminWarehouseSource = await readFile(new URL('../src/pages/admin/script-flashsale.ts', import.meta.url), 'utf8')

assert.match(
  shippingHelpersSource,
  /export async function getSpxConfig\(db: D1Database,\s*env: AppBindings\)[\s\S]*getRuntimeConfigValues\(db,\s*env,\s*\[[\s\S]*'SPX_USER_ID'[\s\S]*'SPX_SECRET_KEY'[\s\S]*'SPX_ACCOUNT_ID'/,
  'SPX config should resolve credentials through DB/env runtime fallback'
)

assert.match(
  adminUtilityRoutesSource,
  /getSpxConfig: \(db: D1Database,\s*env: AppBindings\) => Promise<SpxConfig>/,
  'admin utility routes should receive getSpxConfig dependency'
)

assert.match(
  adminUtilityRoutesSource,
  /spx_user_id[\s\S]*spx_secret_key[\s\S]*spx_account_id/,
  'warehouse config endpoint should save SPX credentials'
)

assert.match(
  indexSource,
  /getSpxConfig[\s\S]*registerAdminUtilityRoutes[\s\S]*getSpxConfig/,
  'app bootstrap should wire SPX config into admin utility routes'
)

for (const id of ['spxUserId', 'spxSecretKey', 'spxAccountId', 'spxCredentialHint']) {
  assert.match(adminSettingsSource + adminWarehouseSource, new RegExp(id), `admin warehouse UI should include ${id}`)
}

assert.match(
  adminSettingsSource,
  /spx_user_id[\s\S]*spx_secret_key[\s\S]*spx_account_id/,
  'admin warehouse save action should post SPX credentials'
)

console.log('spx config contract passed')
