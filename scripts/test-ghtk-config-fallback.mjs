import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

import { getGhtkApiCredentials } from '../src/lib/shippingHelpers.ts'

function mockSettingsDb(rows) {
  return {
    prepare() {
      return {
        bind(...keys) {
          return {
            async all() {
              return {
                results: rows.filter((row) => keys.includes(row.key)),
              }
            },
          }
        },
      }
    },
  }
}

const db = mockSettingsDb([
  { key: 'ghtk_token', value: ' db-token ' },
  { key: 'ghtk_client_source', value: ' db-source ' },
])

const fromDb = await getGhtkApiCredentials(db, {})
assert.deepEqual(fromDb, { token: 'db-token', clientSource: 'db-source' })

const fromEnv = await getGhtkApiCredentials(db, {
  GHTK_TOKEN: ' env-token ',
  GHTK_CLIENT_SOURCE: ' env-source ',
})
assert.deepEqual(fromEnv, { token: 'env-token', clientSource: 'env-source' })

const returnsRouteSource = await readFile(new URL('../src/routes/returnsRoutes.ts', import.meta.url), 'utf8')
const orderRoutesSource = await readFile(new URL('../src/routes/orderRoutes.ts', import.meta.url), 'utf8')
const shippingHelpersSource = await readFile(new URL('../src/lib/shippingHelpers.ts', import.meta.url), 'utf8')

assert.match(
  returnsRouteSource,
  /getGhtkApiCredentials\(c\.env\.DB,\s*c\.env\)/,
  'returns sync should resolve GHTK credentials from DB-backed helper'
)
assert.doesNotMatch(
  returnsRouteSource,
  /const token = String\(c\.env\.GHTK_TOKEN \|\| ''\)\.trim\(\)[\s\S]*const clientSource = String\(c\.env\.GHTK_CLIENT_SOURCE \|\| ''\)\.trim\(\)/,
  'returns sync should not read GHTK credentials only from env'
)

assert.match(
  orderRoutesSource,
  /ghtkCancelShipment\(c\.env,\s*c\.env\.DB,\s*trackingCode\)/,
  'GHTK cancel flow should pass DB to resolve dashboard-saved credentials'
)

assert.match(
  orderRoutesSource,
  /ghtkFetchLabelPdf\(c\.env,\s*c\.env\.DB,\s*String\(row\.shipping_tracking_code\)/,
  'GHTK print labels flow should pass DB to resolve dashboard-saved credentials'
)

assert.doesNotMatch(
  shippingHelpersSource,
  /export async function ghtkFetchLabelPdf[\s\S]*?const token = String\(env\.GHTK_TOKEN \|\| ''\)\.trim\(\)[\s\S]*?const clientSource = String\(env\.GHTK_CLIENT_SOURCE \|\| ''\)\.trim\(\)/,
  'GHTK label helper should not read credentials only from env'
)

assert.doesNotMatch(
  shippingHelpersSource,
  /export async function ghtkCancelShipment[\s\S]*?const token = String\(env\.GHTK_TOKEN \|\| ''\)\.trim\(\)[\s\S]*?const clientSource = String\(env\.GHTK_CLIENT_SOURCE \|\| ''\)\.trim\(\)/,
  'GHTK cancel helper should not read credentials only from env'
)

console.log('ghtk config fallback contract passed')
