import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('../', import.meta.url))
const tests = [
  'test-order-creation-db.mjs',
  'test-payment-backend-audit.mjs',
  'test-shipping-integrity.mjs',
  'test-ghn-uncertain-response.mjs',
  'test-address-dropdown-recovery.mjs',
  'test-storefront-checkout-runtime.mjs',
  'test-storefront-search.mjs',
  'test-admin-payment-reconciliation-contract.mjs',
  'test-admin-payment-reconciliation-behavior.mjs',
  'test-payment-review-races.mjs',
  'test-payment-state-races.mjs',
  'test-payment-scheduler.mjs',
  'test-launch-integration.mjs',
]
const failed = []
for (const test of tests) {
  console.log(`\nLaunch check: ${test}`)
  const result = spawnSync(process.execPath, [
    '--experimental-strip-types', '--experimental-sqlite',
    '--loader', './scripts/ts-extension-loader.mjs', `scripts/${test}`,
  ], { cwd: root, stdio: 'inherit', timeout: 180_000 })
  if (result.error || result.status !== 0) {
    failed.push(test)
    if (result.error) console.error(result.error.message)
  }
}
if (failed.length) {
  console.error(`\nLaunch checks failed: ${failed.join(', ')}`)
  process.exitCode = 1
} else {
  console.log(`\nAll ${tests.length} launch checks passed. No live transactions or deployments were performed.`)
}
