import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import path from 'node:path'

const cwd = process.cwd()
const source = await fs.readFile(path.join(cwd, 'src/routes/authRoutes.ts'), 'utf8')

assert.doesNotMatch(source, /mock_google_code/, 'Google login must not create a mock OAuth code')
assert.doesNotMatch(source, /user@example\.com|Nguyen Van A \(Mock\)/, 'Google callback must not login a demo account')
assert.match(source, /GOOGLE_AUTH_NOT_CONFIGURED/, 'Missing Google OAuth credentials should return a clear auth configuration error')
assert.match(source, /GOOGLE_AUTH_CLIENT_ID_INVALID/, 'Invalid Google OAuth client IDs should return a clear auth configuration error')
assert.match(source, /function isGoogleOAuthClientId\(/, 'Google auth should validate OAuth client ID shape before redirecting to Google')
assert.match(
  source,
  /\.apps\\.googleusercontent\\.com/,
  'Google auth should require an OAuth client ID, not a Google API key'
)
assert.match(source, /function getGoogleRedirectUri\(/, 'Google auth should centralize redirect URI resolution')
assert.match(source, /'GOOGLE_REDIRECT_URI'/, 'Google auth should support configured redirect URI for real OAuth clients')
assert.match(source, /PRAGMA table_info\(users\)/, 'Google auth should inspect users schema before syncing OAuth users')
assert.match(source, /google_id/, 'Google auth should persist the provider id when the production users table requires google_id')
assert.match(
  source,
  /findGoogleAuthUser\(c\.env\.DB,\s*usersColumns,\s*googleId,\s*googleEmail\)/,
  'Google callback should find users by google_id when available before falling back to email'
)
assert.match(
  source,
  /INSERT INTO users \(google_id, email, name, avatar, balance\)/,
  'Google callback should insert google_id for production users schema'
)
assert.match(
  source,
  /new URLSearchParams\(\{[\s\S]*redirect_uri: redirectUri/,
  'Google auth URL should use the resolved redirect URI'
)
assert.match(
  source,
  /isLocalOAuthHostname\(request\.hostname\)[\s\S]*isLocalOAuthHostname\(configuredUrl\.hostname\)[\s\S]*request\.host !== configuredUrl\.host[\s\S]*return fallback/,
  'Local Google OAuth should fall back to the current request origin when the configured localhost port is different'
)
assert.match(
  source,
  /redirect_uri: redirectUri/,
  'Google token exchange should use the same resolved redirect URI'
)
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
assert.match(
  source,
  /if \(!isGoogleOAuthClientId\(clientId\)\)[\s\S]{0,220}GOOGLE_AUTH_CLIENT_ID_INVALID/,
  'Google routes should reject API keys before redirecting to Google OAuth'
)

console.log('google auth no mock contract ok')
