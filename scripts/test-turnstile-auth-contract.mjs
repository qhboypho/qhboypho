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
assert.match(authRoutesSource, /TURNSTILE_LOCAL_TEST_SITE_KEY = '1x00000000000000000000AA'/, 'local dev should use Cloudflare visible always-pass test sitekey')
assert.match(authRoutesSource, /TURNSTILE_LOCAL_TEST_SECRET_KEY = '1x0000000000000000000000000000000AA'/, 'local dev should use Cloudflare always-pass test secret')
assert.match(authRoutesSource, /function isLocalTurnstileRequest[\s\S]*localhost[\s\S]*127\.0\.0\.1/, 'Turnstile test keys should only be available for local requests')
assert.match(authRoutesSource, /if \(isLocalTurnstileRequest\(c\)\)/, 'local dev should always use Turnstile test keys so localhost auth does not depend on production hostnames')
assert.match(authRoutesSource, /function verifyTurnstileToken[\s\S]*https:\/\/challenges\.cloudflare\.com\/turnstile\/v0\/siteverify/, 'backend should validate Turnstile tokens with Cloudflare Siteverify')
assert.match(authRoutesSource, /secret[\s\S]*response[\s\S]*remoteip/, 'Siteverify payload should include secret, token response, and client IP when available')
assert.match(authRoutesSource, /isLocalTurnstileRequest\(c\)[\s\S]*config\.siteKey === TURNSTILE_LOCAL_TEST_SITE_KEY[\s\S]*return \{ ok: true \}/, 'local dev should not block auth when the Turnstile widget cannot produce a token')
assert.match(authRoutesSource, /app\.post\('\/api\/admin\/login'[\s\S]*enforceTurnstile\(c,\s*body,\s*'admin_login'\)/, 'admin login should enforce Turnstile before password verification')
assert.match(authRoutesSource, /app\.post\('\/api\/auth\/register'[\s\S]*enforceTurnstile\(c,\s*body,\s*'user_register'\)/, 'storefront registration should enforce Turnstile')
assert.match(authRoutesSource, /app\.post\('\/api\/auth\/login'[\s\S]*enforceTurnstile\(c,\s*body,\s*'user_login'\)/, 'storefront local login should enforce Turnstile')

assert.match(adminLoginSource, /\/api\/auth\/turnstile-config/, 'admin login page should load Turnstile public config')
assert.match(adminLoginSource, /https:\/\/challenges\.cloudflare\.com\/turnstile\/v0\/api\.js\?render=explicit/, 'admin login page should load Turnstile explicit renderer')
assert.match(adminLoginSource, /document\.getElementById\('adminTurnstileWidget'\)[\s\S]*turnstile\.render\(widget/, 'admin login should render the Turnstile widget from the resolved container element')
assert.match(adminLoginSource, /turnstile_token: getAdminTurnstileToken\(\)/, 'admin login payload should include the Turnstile token')
assert.match(adminLoginSource, /isAdminTurnstileLocalDev\(\)/, 'admin login should allow local test-key submit even if the widget token is empty')
assert.match(adminLoginSource, /if \(isAdminTurnstileLocalDev\(\)\)[\s\S]*wrap\.classList\.add\('hidden'\)[\s\S]*return/, 'admin login should not wait for the Cloudflare script when using local test keys')

assert.match(storefrontScriptSource, /function loadTurnstilePublicConfig\(/, 'storefront should load Turnstile public config lazily')
assert.match(storefrontScriptSource, /id="userAuthTurnstileWidget"/, 'storefront auth form should include a Turnstile widget slot')
assert.match(storefrontScriptSource, /turnstile_token: getUserAuthTurnstileToken\(\)/, 'storefront login/register payloads should include the Turnstile token')
assert.match(storefrontScriptSource, /isUserAuthTurnstileLocalDev\(\)/, 'storefront auth should allow local test-key submit even if the widget token is empty')
assert.match(storefrontScriptSource, /if \(isUserAuthTurnstileLocalDev\(\)\)[\s\S]*wrap\.classList\.add\('hidden'\)[\s\S]*return/, 'storefront auth should not wait for the Cloudflare script when using local test keys')

console.log('turnstile auth contract passed')
