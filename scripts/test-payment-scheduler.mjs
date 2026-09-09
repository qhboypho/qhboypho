import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import worker from '../src/paymentReconciliationWorker.ts'

const config = JSON.parse(await readFile('wrangler.payments.jsonc', 'utf8'))
assert.equal(config.workers_dev, false)
assert.equal(config.preview_urls, false)
assert.deepEqual(config.triggers.crons, ['*/5 * * * *'])
assert.equal(worker.fetch, undefined, 'scheduler must not expose a payment mutation HTTP endpoint')
let scanned = false
const db = {
  prepare(sql) {
    assert.match(sql, /FROM orders/)
    assert.match(sql, /payment_reconciliation_attempts/)
    return {
      bind(limit) {
        assert.equal(limit, 25, 'cron work must be bounded')
        return this
      },
      async all() {
        await Promise.resolve()
        scanned = true
        return { results: [] }
      },
    }
  },
}
await worker.scheduled({}, { DB: db }, {})
assert.equal(scanned, true, 'scheduled handler must await reconciliation')
await assert.rejects(
  worker.scheduled({}, { DB: { prepare() { throw new Error('SCHEMA_NOT_READY') } } }, {}),
  /SCHEMA_NOT_READY/,
  'database failures must fail the invocation rather than disappear',
)
console.log('payment scheduler configuration, bounded scan and failure propagation passed')
