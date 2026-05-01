import fs from 'node:fs/promises'
import path from 'node:path'

const cwd = process.cwd()
const filePath = path.join(cwd, 'src/routes/authRoutes.ts')
const source = await fs.readFile(filePath, 'utf8')

function assert(condition, message) {
  if (!condition) throw new Error(message)
}

assert(!source.includes('stack: err.stack'), 'Expected authRoutes to stop returning stack traces to clients')
assert(!source.includes('msg: err.message'), 'Expected authRoutes to stop returning raw auth error messages to clients')
assert(!source.includes("console.error('[auth] mock callback failed'"), 'Expected authRoutes to remove mock auth callback fallback')
assert(source.includes("console.error('[auth] google oauth config missing'"), 'Expected authRoutes to keep server-side logging for missing Google OAuth config')
assert(source.includes("'GOOGLE_AUTH_NOT_CONFIGURED'"), 'Expected authRoutes to return a generic Google OAuth config error code to clients')
assert(source.includes("'GOOGLE_AUTH_CLIENT_ID_INVALID'"), 'Expected authRoutes to return a generic invalid Google OAuth client ID code to clients')
assert(source.includes('AUTH_CALLBACK_FAILED'), 'Expected authRoutes to return a generic auth callback failure code to clients')

console.log('auth error leak contract ok')
