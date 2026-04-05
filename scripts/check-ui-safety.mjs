import fs from 'node:fs/promises'
import path from 'node:path'
import { execFileSync } from 'node:child_process'
import vm from 'node:vm'

const DEFAULT_BASE_URL = process.env.CHECK_BASE_URL || 'http://127.0.0.1:5173'
const DEFAULT_ADMIN_TOKEN = process.env.CHECK_ADMIN_TOKEN || 'super_secret_admin_token'
const DEFAULT_ADMIN_USER_KEY = process.env.CHECK_ADMIN_USER_KEY || 'admin'
const DEFAULT_TARGETS = [
  { pathname: '/' },
  { pathname: '/admin' },
  { pathname: '/admin/login' },
  {
    pathname: '/admin/dashboard',
    headers: {
      cookie: `admin_token=${DEFAULT_ADMIN_TOKEN}; admin_user_key=${DEFAULT_ADMIN_USER_KEY}`,
    },
  },
]
const SOURCE_DIRS = ['src/pages', 'src/routes', 'src/lib']
const SOURCE_EXTENSIONS = new Set(['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs'])
const SUSPICIOUS_MOJIBAKE = [
  /Ã./,
  /Â./,
  /â€./,
  /â€¦/,
  /â€“/,
  /â€”/,
  /â€œ/,
  /â€/,
  /�/,
]

function cloneTarget(target, baseUrl) {
  return {
    url: new URL(target.pathname, baseUrl).toString(),
    headers: target.headers || {},
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

async function fetchHtml(target) {
  const res = await fetch(target.url, { headers: target.headers || {} })
  if (!res.ok) {
    throw new Error(`HTTP ${res.status} at ${target.url}`)
  }
  return res.text()
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
  let diff = ''
  try {
    diff = execFileSync('git', ['diff', '--unified=0', '--no-color', '--', ...SOURCE_DIRS], {
      cwd,
      encoding: 'utf8',
      maxBuffer: 10 * 1024 * 1024,
    })
  } catch {
    diff = ''
  }

  const lines = diff.split(/\r?\n/)
  let currentFile = null
  for (const line of lines) {
    if (line.startsWith('+++ b/')) {
      currentFile = line.slice(6)
      continue
    }
    if (!currentFile || line.startsWith('@@') || line.startsWith('diff --git') || line.startsWith('index ') || line.startsWith('--- ')) {
      continue
    }
    if (!line.startsWith('+')) continue
    const addedLine = line.slice(1)
    const suspect = findMojibake(addedLine)
    if (suspect) {
      findings.push(`${currentFile} added line contains suspicious text: ${JSON.stringify(suspect)}`)
    }
  }
  return findings
}

async function main() {
  const cwd = process.cwd()
  const targets = resolveTargetConfigs()
  const failures = []

  for (const target of targets) {
    const html = await fetchHtml(target)
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
