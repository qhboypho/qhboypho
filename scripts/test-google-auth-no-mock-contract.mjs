import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import path from 'node:path'

const cwd = process.cwd()
const source = await fs.readFile(path.join(cwd, 'src/routes/authRoutes.ts'), 'utf8')

assert.doesNotMatch(source, /mock_google_code/, 'Google login must not create a mock OAuth code')
assert.doesNotMatch(source, /user@example\.com|Nguyen Van A \(Mock\)/, 'Google callback must not login a demo account')
assert.match(source, /GOOGLE_AUTH_NOT_CONFIGURED/, 'Missing Google OAuth credentials should return a clear auth configuration error')
assert.match(
  source,
  /if \(!clientId \|\| !clientSecret\)[\s\S]{0,180}buildGoogleAuthErrorRedirect\(c\.req\.url\)/,
  'Google login route should redirect to a storefront error when OAuth config is missing'
)
assert.match(
  source,
  /if \(!clientId \|\| !clientSecret\)[\s\S]{0,180}buildGoogleAuthErrorRedirect\(c\.req\.url\)/,
  'Google callback should reject missing OAuth credentials instead of falling back to a mock account'
)

console.log('google auth no mock contract ok')
