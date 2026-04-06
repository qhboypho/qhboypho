import fs from 'node:fs/promises'
import path from 'node:path'

const cwd = process.cwd()
const source = await fs.readFile(path.join(cwd, 'src/routes/authRoutes.ts'), 'utf8')

function assert(condition, message) {
  if (!condition) throw new Error(message)
}

assert(!source.includes('debug: { userToken, dbError }'), 'Expected /api/auth/me to stop leaking userToken and dbError to clients')
assert(!source.includes("details: tokenData"), 'Expected google auth callback to stop returning raw tokenData details to clients')
assert(source.includes("error: 'UNAUTHORIZED'"), 'Expected /api/auth/me unauthorized response to use a generic error code')
assert(source.includes("error: 'AUTH_PROVIDER_TOKEN_EXCHANGE_FAILED'"), 'Expected google token exchange failure to use a generic error code')
assert(source.includes("console.error('[auth] resolve current user failed'"), 'Expected authRoutes to keep server-side logging for current user lookup failures')
assert(source.includes("console.error('[auth] google token exchange failed'"), 'Expected authRoutes to keep server-side logging for google token exchange failures')

console.log('auth info leak contract ok')
