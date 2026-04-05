import fs from 'node:fs/promises'
import path from 'node:path'

const cwd = process.cwd()
const filePath = path.join(cwd, 'src/routes/authRoutes.ts')
const source = await fs.readFile(filePath, 'utf8')

function assert(condition, message) {
  if (!condition) throw new Error(message)
}

assert(!source.includes('stack: err.stack'), 'Expected authRoutes to stop returning stack traces to clients')
assert(!source.includes('msg: err.message'), 'Expected authRoutes to stop returning raw auth error messages to clients in mock callback fallback')
assert(source.includes("console.error('[auth] mock callback failed'"), 'Expected authRoutes to keep server-side logging for mock auth callback failures')
assert(source.includes("error: 'AUTH_CALLBACK_FAILED'"), 'Expected authRoutes to return a generic auth callback failure code to clients')

console.log('auth error leak contract ok')
