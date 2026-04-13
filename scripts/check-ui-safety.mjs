import fs from 'node:fs/promises'
import path from 'node:path'
import vm from 'node:vm'

const DEFAULT_BASE_URL = process.env.CHECK_BASE_URL || 'http://127.0.0.1:3000'
const DEFAULT_ADMIN_USERNAME = process.env.CHECK_ADMIN_USERNAME || 'admin'
const DEFAULT_ADMIN_PASSWORD = process.env.CHECK_ADMIN_PASSWORD || 'Admin@1234'
const DEFAULT_TARGETS = [
  { pathname: '/' },
  {
    pathname: '/admin',
    allowedStatuses: [302],
    expectLocation: '/admin/dashboard',
  },
  { pathname: '/admin/login' },
  {
    pathname: '/admin/dashboard',
    auth: 'admin',
  },
]
const SOURCE_DIRS = ['src/pages', 'src/routes', 'src/lib']
const SOURCE_EXTENSIONS = new Set(['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs'])
const SUSPICIOUS_MOJIBAKE = [
  /Ã./,
  /Â./,
  /â€./,
  /â”./,
  /â†./,
  /âœ./,
  /â€¦/,
  /â€“/,
  /â€”/,
  /â€œ/,
  /â€/,
  /ðŸ./,
  /�/,
]

function cloneTarget(target, baseUrl) {
  return {
    url: new URL(target.pathname, baseUrl).toString(),
    headers: target.headers || {},
    auth: target.auth || null,
    allowedStatuses: target.allowedStatuses || [200],
    expectLocation: target.expectLocation || '',
  }
}

function resolveTargetConfigs() {
  const [, , ...args] = process.argv
  if (!args.length) return DEFAULT_TARGETS.map((target) => cloneTarget(target, DEFAULT_BASE_URL))
  const [first, ...rest] = args
  if (/^https?:\/\//i.test(first)) {
    const base = first.replace(/\/+$/, '') + '/'
    const pathArgs = rest.length ? rest : DEFAULT_TARGETS.map((target) => target.pathname)
    return pathArgs.map((pathname) => cloneTarget({ pathname }, base))
  }
  return args.map((pathname) => cloneTarget({ pathname }, DEFAULT_BASE_URL))
}

function getSetCookieHeaders(response) {
  if (typeof response.headers.getSetCookie === 'function') return response.headers.getSetCookie()
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

async function fetchAdminCookieHeader(baseUrl) {
  const loginUrl = new URL('/api/admin/login', baseUrl).toString()
  const res = await fetch(loginUrl, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      username: DEFAULT_ADMIN_USERNAME,
      password: DEFAULT_ADMIN_PASSWORD,
    }),
  })
  if (!res.ok) {
    throw new Error(`Admin login failed with HTTP ${res.status} at ${loginUrl}`)
  }
  const json = await res.json().catch(() => null)
  if (!json?.success) {
    throw new Error(`Admin login returned success=false at ${loginUrl}`)
  }
  const cookieHeader = buildCookieHeader(getSetCookieHeaders(res))
  if (!cookieHeader.includes('admin_token=') || !cookieHeader.includes('admin_user_key=')) {
    throw new Error(`Admin login did not return required auth cookies at ${loginUrl}`)
  }
  return cookieHeader
}

async function fetchPage(target, cookieHeader) {
  const headers = { ...(target.headers || {}) }
  if (target.auth === 'admin' && cookieHeader) headers.cookie = cookieHeader
  const res = await fetch(target.url, { headers, redirect: 'manual' })
  if (!target.allowedStatuses.includes(res.status)) {
    throw new Error(`HTTP ${res.status} at ${target.url}`)
  }
  const location = res.headers.get('location') || ''
  if (target.expectLocation && !location.includes(target.expectLocation)) {
    throw new Error(`HTTP ${res.status} at ${target.url} redirected to ${location || '<empty>'}, expected ${target.expectLocation}`)
  }
  return {
    status: res.status,
    location,
    html: await res.text(),
  }
}

function extractInlineScripts(html) {
  const matches = html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)
  return Array.from(matches, (match) => match[1] || '').filter((script) => script.trim())
}

function checkScriptSyntax(script, label) {
  try {
    new vm.Script(script, { filename: label })
    return null
  } catch (error) {
    return `${label}: ${error.message}`
  }
}

function stripTagsAndBlocks(html) {
  return html
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
}

function findMojibake(text) {
  for (const pattern of SUSPICIOUS_MOJIBAKE) {
    const match = text.match(pattern)
    if (match) return match[0]
  }
  return null
}

async function walkFiles(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true })
  const files = []
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      files.push(...await walkFiles(fullPath))
    } else if (SOURCE_EXTENSIONS.has(path.extname(entry.name))) {
      files.push(fullPath)
    }
  }
  return files
}

async function scanSourceMojibake(cwd) {
  const findings = []
  for (const dir of SOURCE_DIRS) {
    const fullDir = path.join(cwd, dir)
    let files = []
    try {
      files = await walkFiles(fullDir)
    } catch {
      continue
    }
    for (const filePath of files) {
      const content = await fs.readFile(filePath, 'utf8')
      const lines = content.split(/\r?\n/)
      lines.forEach((line, index) => {
        const suspect = findMojibake(line)
        if (suspect) {
          findings.push(`${path.relative(cwd, filePath)}:${index + 1} contains suspicious mojibake ${JSON.stringify(suspect)}`)
        }
      })
    }
  }
  return findings
}

async function main() {
  const cwd = process.cwd()
  const targets = resolveTargetConfigs()
  const failures = []
  let adminCookieHeader = ''

  if (targets.some((target) => target.auth === 'admin')) {
    adminCookieHeader = await fetchAdminCookieHeader(DEFAULT_BASE_URL)
  }

  for (const target of targets) {
    const page = await fetchPage(target, adminCookieHeader)
    if (page.status >= 300 && page.status < 400) continue
    const html = page.html
    const visibleText = stripTagsAndBlocks(html)
    const mojibakeHit = findMojibake(visibleText)
    if (mojibakeHit) {
      failures.push(`${target.url}: visible text contains suspicious mojibake ${JSON.stringify(mojibakeHit)}`)
    }
    const scripts = extractInlineScripts(html)
    scripts.forEach((script, index) => {
      const syntaxError = checkScriptSyntax(script, `${target.url} <script #${index}>`)
      if (syntaxError) failures.push(syntaxError)
    })
  }

  failures.push(...await scanSourceMojibake(cwd))

  if (failures.length) {
    console.error('UI safety check failed:')
    failures.forEach((failure) => console.error(`- ${failure}`))
    process.exit(1)
  }

  console.log(`UI safety check passed for ${targets.length} page(s).`)
}

main().catch((error) => {
  console.error(`UI safety check crashed: ${error instanceof Error ? error.message : String(error)}`)
  process.exit(1)
})
