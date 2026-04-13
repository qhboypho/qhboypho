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

function extractInlineScripts(html) {
  return Array.from(html.matchAll(/<script>([\s\S]*?)<\/script>/gi)).map((match) => match[1] || '')
}

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

const dashboardRes = await fetch(`${baseUrl}/admin/dashboard`, {
  headers: { cookie: cookieHeader },
})
assert.equal(dashboardRes.status, 200, `Expected /admin/dashboard 200, got ${dashboardRes.status}`)

const dashboardHtml = await dashboardRes.text()
assert.match(dashboardHtml, /Dashboard/i, 'Expected dashboard HTML to include Dashboard heading')

const scripts = extractInlineScripts(dashboardHtml)
assert.ok(scripts.length > 0, 'Expected dashboard HTML to contain inline scripts')

const longestScript = scripts.sort((a, b) => b.length - a.length)[0]
assert.ok(longestScript.length > 1000, 'Expected main admin inline script to be present')

try {
  new Function(longestScript)
} catch (error) {
  assert.fail(`Admin dashboard inline script syntax error: ${error.message}`)
}

const statsRes = await fetch(`${baseUrl}/api/admin/stats`, {
  headers: { cookie: cookieHeader },
})
assert.equal(statsRes.status, 200, `Expected /api/admin/stats 200, got ${statsRes.status}`)

const statsJson = await statsRes.json()
assert.equal(statsJson?.success, true, 'Expected /api/admin/stats success=true')
assert.ok(statsJson?.data && typeof statsJson.data === 'object', 'Expected stats payload object')

console.log('admin dashboard local contract passed')
