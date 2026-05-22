import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const runtimeConfigSource = await readFile(new URL('../src/lib/runtimeConfigHelpers.ts', import.meta.url), 'utf8')
const appTypesSource = await readFile(new URL('../src/types/app.ts', import.meta.url), 'utf8')
const authRoutesSource = await readFile(new URL('../src/routes/authRoutes.ts', import.meta.url), 'utf8')
const adminLoginSource = await readFile(new URL('../src/pages/adminLoginPage.ts', import.meta.url), 'utf8')
const storefrontScriptSource = await readFile(new URL('../src/pages/storefront/script.ts', import.meta.url), 'utf8')

for (const key of ['TURNSTILE_SITE_KEY', 'TURNSTILE_SECRET_KEY']) {
  assert.match(runtimeConfigSource, new RegExp(`${key}:`), `runtime config should map ${key}`)
  assert.match(appTypesSource, new RegExp(`${key}\\?: string`), `bindings should expose ${key}`)
}

assert.match(authRoutesSource, /app\.get\('\/api\/auth\/turnstile-config'/, 'auth routes should expose a public Turnstile site-key config endpoint')
assert.doesNotMatch(authRoutesSource, /turnstile_secret_key[^]*return c\.json/, 'public Turnstile config must not expose the secret key')
assert.match(authRoutesSource, /function getTurnstileConfig[\s\S]*getRuntimeConfigValues\(c\.env\.DB,\s*c\.env,\s*\[[\s\S]*'TURNSTILE_SITE_KEY'[\s\S]*'TURNSTILE_SECRET_KEY'/, 'Turnstile config should resolve through DB/env runtime fallback')
assert.match(authRoutesSource, /function verifyTurnstileToken[\s\S]*https:\/\/challenges\.cloudflare\.com\/turnstile\/v0\/siteverify/, 'backend should validate Turnstile tokens with Cloudflare Siteverify')
assert.match(authRoutesSource, /secret[\s\S]*response[\s\S]*remoteip/, 'Siteverify payload should include secret, token response, and client IP when available')
assert.match(authRoutesSource, /app\.post\('\/api\/admin\/login'[\s\S]*enforceTurnstile\(c,\s*body,\s*'admin_login'\)/, 'admin login should enforce Turnstile before password verification')
assert.match(authRoutesSource, /app\.post\('\/api\/auth\/register'[\s\S]*enforceTurnstile\(c,\s*body,\s*'user_register'\)/, 'storefront registration should enforce Turnstile')
assert.match(authRoutesSource, /app\.post\('\/api\/auth\/login'[\s\S]*enforceTurnstile\(c,\s*body,\s*'user_login'\)/, 'storefront local login should enforce Turnstile')

assert.match(adminLoginSource, /\/api\/auth\/turnstile-config/, 'admin login page should load Turnstile public config')
assert.match(adminLoginSource, /https:\/\/challenges\.cloudflare\.com\/turnstile\/v0\/api\.js\?render=explicit/, 'admin login page should load Turnstile explicit renderer')
assert.match(adminLoginSource, /turnstile\.render\('adminTurnstileWidget'/, 'admin login should render the Turnstile widget')
assert.match(adminLoginSource, /turnstile_token: getAdminTurnstileToken\(\)/, 'admin login payload should include the Turnstile token')

assert.match(storefrontScriptSource, /function loadTurnstilePublicConfig\(/, 'storefront should load Turnstile public config lazily')
assert.match(storefrontScriptSource, /id="userAuthTurnstileWidget"/, 'storefront auth form should include a Turnstile widget slot')
assert.match(storefrontScriptSource, /turnstile_token: getUserAuthTurnstileToken\(\)/, 'storefront login/register payloads should include the Turnstile token')

console.log('turnstile auth contract passed')
