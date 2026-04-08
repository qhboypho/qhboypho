import assert from 'node:assert/strict'
import { createInitDB } from '../src/lib/db.ts'

const initDB = createInitDB({
  resolveSelectedColorImage() {
    return ''
  }
})

let prepareCalls = 0
const fakeDb = {
  prepare() {
    prepareCalls += 1
    return {
      bind() { return this },
      run: async () => ({}),
      all: async () => ({ results: [] }),
      first: async () => null,
    }
  }
}

await initDB(fakeDb)

assert.equal(
  prepareCalls,
  0,
  `Expected runtime initDB to avoid db.prepare(), but it called prepare ${prepareCalls} time(s)`
)

console.log('initDB runtime no-op contract passed')
