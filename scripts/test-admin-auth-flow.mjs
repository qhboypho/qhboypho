import assert from 'node:assert/strict'

const baseUrl = process.env.BASE_URL || 'http://127.0.0.1:3000'
const username = process.env.ADMIN_USERNAME || 'admin'
const password = process.env.ADMIN_PASSWORD || 'Admin@1234'

function getSetCookieHeaders(response) {
  if (typeof response.headers.getSetCookie === 'function') {
    return response.headers.getSetCookie()
  }
  const single = response.headers.get('set-cookie')
  if (!single) return []
  return single.split(/,(?=\s*[^\s=;,]+=[^;,]+)/g)
}

function buildCookieHeader(setCookies) {
  return setCookies
    .map((value) => String(value || '').split(';')[0]?.trim())
    .filter(Boolean)
    .join('; ')
}

const loginPageRes = await fetch(`${baseUrl}/admin/login`)
assert.equal(loginPageRes.status, 200, `Expected /admin/login 200, got ${loginPageRes.status}`)
const loginPageHtml = await loginPageRes.text()
assert.match(loginPageHtml, /QH Clothes/i, 'Expected login page to include QH Clothes branding')
assert.match(loginPageHtml, /Đăng nhập Admin/i, 'Expected login page title text to be readable')
assert.match(loginPageHtml, /Đăng nhập quản trị/i, 'Expected login card heading to be readable')
assert.match(loginPageHtml, /sanitizeLoginSurface\(\)/, 'Expected admin login page to hard-reset stray overlays on load')
assert.match(loginPageHtml, /#sidebarOverlay, \.modal-overlay, \.mobile-overlay \{ display: none !important; pointer-events: none !important; \}/, 'Expected admin login page CSS to force-hide stray overlays')
assert.match(loginPageHtml, /body\.login-bg > \* \{ position: relative; z-index: 2147483646; \}/, 'Expected admin login shell to sit above stray full-screen overlays')
assert.match(loginPageHtml, /class="login-shell fade-up w-full max-w-md"/, 'Expected admin login markup to wrap the page content in a dedicated high z-index shell')

const protectedRes = await fetch(`${baseUrl}/admin/dashboard`, { redirect: 'manual' })
assert.equal(protectedRes.status, 302, `Expected unauthenticated /admin/dashboard redirect 302, got ${protectedRes.status}`)
assert.equal(protectedRes.headers.get('location'), '/admin/login', 'Expected unauthenticated dashboard redirect to /admin/login')

const loginRes = await fetch(`${baseUrl}/api/admin/login`, {
  method: 'POST',
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify({ username, password }),
})
assert.equal(loginRes.status, 200, `Expected admin login 200, got ${loginRes.status}`)
const loginJson = await loginRes.json()
assert.equal(loginJson?.success, true, 'Expected admin login success=true')

const cookieHeader = buildCookieHeader(getSetCookieHeaders(loginRes))
assert.ok(cookieHeader.includes('admin_token='), 'Expected admin_token cookie after login')
assert.ok(cookieHeader.includes('admin_user_key='), 'Expected admin_user_key cookie after login')

const dashboardRes = await fetch(`${baseUrl}/admin/dashboard`, {
  headers: { cookie: cookieHeader },
  redirect: 'manual',
})
assert.equal(dashboardRes.status, 200, `Expected authenticated /admin/dashboard 200, got ${dashboardRes.status}`)

console.log('admin auth flow contract passed')
