import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const authRoutes = fs.readFileSync(path.join(root, 'src', 'routes', 'authRoutes.ts'), 'utf8')
const adminScript = fs.readFileSync(path.join(root, 'src', 'pages', 'admin', 'script.ts'), 'utf8')

const authMeMatch = authRoutes.match(/app\.get\('\/api\/auth\/me'[\s\S]*?\n  \}\)/)
assert.ok(authMeMatch, 'Expected /api/auth/me route to exist')
const authMeSource = authMeMatch[0]

assert.doesNotMatch(authMeSource, /admin_token|admin_user_key|resolveAdminProfile|validateAdminSessionToken/, '/api/auth/me must not treat admin cookies as storefront login')
assert.match(authMeSource, /getUserSessionUserId\(c\)/, '/api/auth/me should resolve only the signed storefront user session')
assert.match(authMeSource, /error: 'UNAUTHORIZED'/, '/api/auth/me should return unauthorized when no storefront user session exists')
assert.match(adminScript, /axios\.get\('\/api\/admin\/profile'\)/, 'admin dashboard should validate admin state through /api/admin/profile')
assert.doesNotMatch(adminScript, /axios\.get\('\/api\/auth\/me'\)/, 'admin dashboard should not rely on storefront auth state')

console.log('admin/storefront session separation contract ok')
