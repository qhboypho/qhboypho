import assert from 'node:assert/strict'
import fs from 'node:fs'
import { DatabaseSync } from 'node:sqlite'
import { unstable_splitSqlQuery } from 'wrangler'

// Execute the same statement boundaries Wrangler sends to D1, rather than
// SQLite.exec on the entire file (which can hide deployment parser errors).
const db = new DatabaseSync(':memory:')
try {
  // Confirmed against remote D1: nested CASE ... END inside these triggers
  // fails with code 7500 although local SQLite and Wrangler's splitter pass.
  const reservationSql = fs.readFileSync('migrations/0031_order_integrity.sql', 'utf8')
  assert.doesNotMatch(reservationSql, /SELECT\s+CASE/i, 'D1 deployment must avoid nested CASE END in reservation triggers')
  for (const file of ['wrangler.chat.jsonc', 'wrangler.chat-staging.jsonc']) {
    const config = JSON.parse(fs.readFileSync(file, 'utf8'))
    assert.ok(config.compatibility_date <= new Date().toISOString().slice(0, 10), `${file}: compatibility date must not be in UTC future`)
  }
  const staging = JSON.parse(fs.readFileSync('wrangler.staging.jsonc', 'utf8'))
  const stagingChat = JSON.parse(fs.readFileSync('wrangler.chat-staging.jsonc', 'utf8'))
  assert.equal(staging.name, 'qhclothes-release-staging')
  assert.equal(staging.d1_databases[0].database_id, '03832596-0ded-4fea-993f-a9a65892d8b7')
  assert.equal(stagingChat.d1_databases[0].database_id, staging.d1_databases[0].database_id)
  assert.equal(staging.r2_buckets[0].bucket_name, 'qhclothes-release-staging-images')
  assert.equal(staging.durable_objects.bindings[0].script_name, stagingChat.name)
  assert.deepEqual(stagingChat.triggers.crons, [])
  for (const name of fs.readdirSync('migrations').filter(name => name.endsWith('.sql')).sort()) {
    for (const statement of unstable_splitSqlQuery(fs.readFileSync(`migrations/${name}`, 'utf8'))) {
      try { db.exec(statement) } catch (cause) {
        throw new Error(`Wrangler-split migration failed: ${name}`, { cause })
      }
    }
  }
  assert.equal(db.prepare('PRAGMA integrity_check').get().integrity_check, 'ok')
  console.log('All migrations execute at Wrangler deployment statement boundaries')
} finally {
  db.close()
}
