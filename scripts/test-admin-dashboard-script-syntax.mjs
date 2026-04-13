import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const source = readFileSync(new URL('../src/pages/admin/script.ts', import.meta.url), 'utf8')
const start = source.indexOf('async function loadDashboard() {')
const end = source.indexOf('// â”€â”€ PRODUCTS', start)

assert.notEqual(start, -1, 'loadDashboard() not found')
assert.notEqual(end, -1, 'loadDashboard() end marker not found')

const loadDashboardBlock = source.slice(start, end).trim()

try {
  new Function(`${loadDashboardBlock}; return loadDashboard;`)
} catch (error) {
  assert.fail(`loadDashboard syntax error: ${error.message}`)
}

console.log('loadDashboard syntax contract passed')
