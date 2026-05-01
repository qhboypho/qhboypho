import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const script = fs.readFileSync(path.join(root, 'src', 'pages', 'storefront', 'script.ts'), 'utf8')

assert.match(script, /function handleAuthReturnFlow\(/, 'storefront should handle auth callback query params')
assert.match(script, /params\.get\('login'\)/, 'auth return handler should read login query state')
assert.match(script, /GOOGLE_AUTH_NOT_CONFIGURED/, 'auth return handler should recognize missing Google OAuth config')
assert.match(script, /Đăng nhập Google chưa được cấu hình/, 'auth return handler should show a clear Google config error')
assert.match(script, /GOOGLE_AUTH_CLIENT_ID_INVALID/, 'auth return handler should recognize invalid Google OAuth client IDs')
assert.match(script, /OAuth Client ID Google không hợp lệ/, 'auth return handler should show a clear invalid Google client ID error')
assert.match(script, /window\.history\.replaceState\(\{\}, '', next\)/, 'auth return handler should clean login query params after showing feedback')
assert.match(script, /handleAuthReturnFlow\(\)[\s\S]{0,160}handlePaymentReturnFlow\(\)/, 'auth return handler should run during storefront init')

console.log('storefront auth return contract ok')
