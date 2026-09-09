import { DatabaseSync } from 'node:sqlite'
import fs from 'node:fs'
import path from 'node:path'

/**
 * Small D1-compatible facade backed by node:sqlite.
 *
 * The application only needs D1's prepare/bind/first/all/run surface for the
 * launch checks, but keeping batch/exec here makes the fixture useful for
 * other hermetic integration tests too. All methods are async to preserve the
 * same calling contract as Cloudflare D1 while the underlying SQLite calls are
 * deliberately synchronous and deterministic.
 */
export class MemoryD1 {
  #sqlite

  constructor(filename = ':memory:') {
    this.#sqlite = new DatabaseSync(filename)
    this.#sqlite.exec('PRAGMA foreign_keys = ON')
  }

  prepare(sql) {
    return new MemoryD1PreparedStatement(this.#sqlite, sql)
  }

  async exec(sql) {
    this.#sqlite.exec(String(sql || ''))
    return { count: 0, duration: 0 }
  }

  async batch(statements) {
    const prepared = Array.from(statements || [])
    this.#sqlite.exec('BEGIN')
    try {
      const results = []
      for (const statement of prepared) {
        if (!statement || typeof statement._batchSync !== 'function') {
          throw new TypeError('D1 batch expects prepared statements')
        }
        // Do not await inside the transaction. D1 batch is atomic; yielding
        // between statements would let another request interleave writes.
        results.push(statement._batchSync())
      }
      this.#sqlite.exec('COMMIT')
      return results
    } catch (error) {
      try { this.#sqlite.exec('ROLLBACK') } catch { /* preserve original error */ }
      throw error
    }
  }

  close() {
    this.#sqlite.close()
  }
}

function normalizeBindings(values) {
  return values.map((value) => value === undefined ? null : value)
}

function toNumber(value) {
  return typeof value === 'bigint' ? Number(value) : Number(value || 0)
}

class MemoryD1PreparedStatement {
  #statement
  #sql
  #bindings = []

  constructor(sqlite, sql) {
    this.#sql = String(sql || '')
    this.#statement = sqlite.prepare(this.#sql)
  }

  bind(...values) {
    this.#bindings = normalizeBindings(values)
    return this
  }

  async first(columnName) {
    const row = this._firstSync(columnName)
    return row
  }

  _firstSync(columnName) {
    const row = this.#statement.get(...this.#bindings)
    if (row == null) return null
    if (columnName !== undefined && columnName !== null) {
      return row[String(columnName)] ?? null
    }
    return row
  }

  async all() {
    return this._allSync()
  }

  _allSync() {
    const results = this.#statement.all(...this.#bindings)
    return {
      results,
      success: true,
      meta: {
        duration: 0,
        rows_read: results.length,
        rows_written: 0,
        changes: 0,
        last_row_id: 0
      }
    }
  }

  async raw() {
    return this.#statement.all(...this.#bindings).map((row) => Object.values(row))
  }

  async run() {
    return this._runSync()
  }

  _runSync() {
    const result = this.#statement.run(...this.#bindings)
    return {
      success: true,
      meta: {
        duration: 0,
        changes: toNumber(result.changes),
        last_row_id: toNumber(result.lastInsertRowid),
        rows_read: 0,
        rows_written: toNumber(result.changes)
      }
    }
  }

  _batchSync() {
    const normalizedSql = this.#sql.trim().toUpperCase()
    const isRowReturning = normalizedSql.startsWith('SELECT')
      || normalizedSql.startsWith('PRAGMA')
      || /\bRETURNING\b/.test(normalizedSql)
    return isRowReturning ? this._allSync() : this._runSync()
  }
}

export function migrationFiles(rootDir) {
  const migrationsDir = path.join(rootDir, 'migrations')
  return fs.readdirSync(migrationsDir)
    .filter((name) => name.endsWith('.sql'))
    .sort((a, b) => a.localeCompare(b))
    .map((name) => ({
      name,
      path: path.join(migrationsDir, name),
      sql: fs.readFileSync(path.join(migrationsDir, name), 'utf8')
    }))
}

/** Apply migrations exactly once, in the same lexical order Wrangler uses. */
export async function applyMigrations(db, rootDir) {
  const files = migrationFiles(rootDir)
  for (const migration of files) {
    await db.exec('BEGIN')
    try {
      await db.exec(migration.sql)
      await db.exec('COMMIT')
    } catch (error) {
      try { await db.exec('ROLLBACK') } catch { /* preserve original error */ }
      error.message = `${migration.name}: ${error.message}`
      throw error
    }
  }
  return files
}
