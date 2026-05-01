import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import path from 'node:path'

const cwd = process.cwd()

async function read(relativePath) {
  return fs.readFile(path.join(cwd, relativePath), 'utf8')
}

const [authRoutes, storefrontScript, storefrontModals, migrations] = await Promise.all([
  read('src/routes/authRoutes.ts'),
  read('src/pages/storefront/script.ts'),
  read('src/pages/storefront/modals.ts'),
  fs.readdir(path.join(cwd, 'migrations')).then(async (files) => {
    const chunks = await Promise.all(files.filter((file) => file.endsWith('.sql')).map((file) => read(path.join('migrations', file))))
    return chunks.join('\n')
  }),
])

assert.match(migrations, /ALTER TABLE users ADD COLUMN username TEXT/i, 'users table should support local usernames')
assert.match(migrations, /ALTER TABLE users ADD COLUMN password_hash TEXT/i, 'users table should store hashed local passwords')
assert.match(migrations, /ALTER TABLE users ADD COLUMN phone TEXT/i, 'users table should support optional phone numbers')
assert.match(migrations, /CREATE UNIQUE INDEX IF NOT EXISTS idx_users_username/i, 'local usernames should be unique')

assert.match(authRoutes, /hashPassword/, 'registration should hash passwords')
assert.match(authRoutes, /verifyPassword/, 'login should verify hashed passwords')
assert.match(authRoutes, /app\.post\('\/api\/auth\/register'/, 'authRoutes should expose a storefront register API')
assert.match(authRoutes, /app\.post\('\/api\/auth\/login'/, 'authRoutes should expose a storefront username login API')
assert.match(authRoutes, /normalizeStorefrontUsername/, 'authRoutes should normalize local usernames')
assert.match(authRoutes, /password_hash/, 'authRoutes should use password_hash instead of plaintext passwords')
assert.doesNotMatch(authRoutes, /INSERT INTO users[\s\S]{0,240}\bpassword\b(?!_hash)/, 'registration must not insert plaintext passwords')
assert.match(authRoutes, /INVALID_CREDENTIALS/, 'login should use a generic invalid credentials error')
assert.match(authRoutes, /setUserSessionCookie\(c, user\.id\)/, 'local login should create the same signed user session cookie as Google login')

assert.match(storefrontModals, /id="userAuthShell"/, 'guest account panel should include a dedicated auth shell')
assert.match(storefrontModals, /Đăng nhập bằng Google/, 'auth shell should keep Google login')
assert.match(storefrontScript, /function renderUserAuthForm\(mode = 'login'\)/, 'storefront should render login/register forms')
assert.match(storefrontScript, /submitUserLogin/, 'storefront should submit username login')
assert.match(storefrontScript, /submitUserRegister/, 'storefront should submit quick registration')
assert.match(storefrontScript, /\/api\/auth\/login/, 'storefront login form should call the local login API')
assert.match(storefrontScript, /\/api\/auth\/register/, 'storefront register form should call the local register API')
assert.match(storefrontScript, /authPhone/, 'register form should include an optional phone input')
assert.match(storefrontScript, /user\.username/, 'logged-in UI should display username-backed accounts cleanly')
assert.match(storefrontModals, /id="userMenuAuthedNav"/, 'guest account panel should wrap authenticated-only actions')
assert.match(storefrontScript, /userMenuAuthedNav/, 'storefront should toggle authenticated-only account actions')
assert.match(
  storefrontScript,
  /authedNav\.classList\.add\('hidden'\)/,
  'guest users should not see account, order history, or wallet actions before login'
)
assert.match(
  storefrontScript,
  /<span class="text-gray-500">'\s*\+\s*switchText\s*\+\s*'<\/span>/,
  'auth switch prompt should render as static text'
)
assert.match(
  storefrontScript,
  /<button type="button" onclick="renderUserAuthForm/,
  'only the auth switch action label should be clickable'
)
assert.match(storefrontScript, /function getUserAvatarInitial\(/, 'local users without an avatar should get an initial avatar')
assert.match(storefrontScript, /function getUserAvatarStyle\(/, 'initial avatars should get a deterministic colored background')
assert.match(storefrontScript, /function renderUserAvatarHtml\(/, 'storefront should render reusable user avatar HTML')
assert.match(storefrontModals, /id="userMenuAvatarSlot"/, 'account header should render avatar content in a slot')
assert.doesNotMatch(
  storefrontScript,
  /currentUser\.avatar \|\| '\/qh-logo\.png'/,
  'normal users without an avatar must not fall back to the shop logo'
)

console.log('user password auth contract ok')
