import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { createHash } from 'node:crypto'
import { DatabaseSync } from 'node:sqlite'

// Read a private export into memory only. Never log customer rows or settings.
const backupPath = process.argv[2]
assert.ok(backupPath, 'Usage: node scripts/rehearse-release-migrations.mjs <private-backup.sql>')
const backup = fs.readFileSync(backupPath)
const db = new DatabaseSync(':memory:')
try {
  db.exec(backup.toString('utf8'))
  const beforeForeignKeys = db.prepare('PRAGMA foreign_key_check').all()
  const tables = ['orders', 'products', 'product_skus', 'vouchers', 'users']
  const counts = () => tables.map(table => db.prepare(`SELECT COUNT(*) AS count FROM ${table}`).get().count)
  const before = counts()
  const files = ['0031_order_integrity.sql', '0032_payment_reconciliation.sql', '0033_shipping_integrity.sql', '0034_admin_payment_reconciliation.sql']
  for (const file of files) {
    db.exec('BEGIN IMMEDIATE')
    try {
      db.exec(fs.readFileSync(path.join('migrations', file), 'utf8'))
      db.exec('COMMIT')
    } catch (error) {
      db.exec('ROLLBACK')
      throw new Error(`Migration rehearsal failed at ${file}`, { cause: error })
    }
  }
  assert.deepEqual(counts(), before, 'Migration must preserve existing business rows')
  assert.deepEqual(db.prepare('PRAGMA foreign_key_check').all(), beforeForeignKeys, 'Migration introduced broken references')
  assert.equal(db.prepare('PRAGMA integrity_check').get().integrity_check, 'ok')
  assert.equal(db.prepare('SELECT COUNT(*) AS count FROM orders WHERE inventory_reserved != 0 OR inventory_released != 0').get().count, 0, 'Legacy orders must not claim new reservations')
  console.log(JSON.stringify({ passed: true, migrations: files, backupSha256: createHash('sha256').update(backup).digest('hex'), historicalForeignKeyIssues: beforeForeignKeys.length }))
} finally {
  db.close()
}
