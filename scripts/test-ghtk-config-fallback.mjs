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

console.log('ghtk config fallback contract passed')
