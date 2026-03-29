import fs from 'node:fs/promises'
import path from 'node:path'
import vm from 'node:vm'

const DEFAULT_BASE_URL = process.env.CHECK_BASE_URL || 'http://127.0.0.1:5173'
const DEFAULT_PATHS = ['/', '/admin', '/admin/login']
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

function resolveTargetUrls() {
  const [, , ...args] = process.argv
  if (!args.length) return DEFAULT_PATHS.map((pathname) => new URL(pathname, DEFAULT_BASE_URL).toString())
  const [first, ...rest] = args
  if (/^https?:\/\//i.test(first)) {
    const base = first.replace(/\/+$/, '')
    const paths = rest.length ? rest : DEFAULT_PATHS
    return paths.map((pathname) => new URL(pathname, `${base}/`).toString())
  }
  return args.map((pathname) => new URL(pathname, DEFAULT_BASE_URL).toString())
}

async function fetchHtml(url) {
  const res = await fetch(url)
  if (!res.ok) {
    throw new Error(`HTTP ${res.status} at ${url}`)
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
  for (const relativeDir of SOURCE_DIRS) {
    const fullDir = path.join(cwd, relativeDir)
    const files = await walkFiles(fullDir)
    for (const filePath of files) {
      const content = await fs.readFile(filePath, 'utf8')
      const suspect = findMojibake(content)
      if (suspect) {
        findings.push(`${path.relative(cwd, filePath)} contains suspicious text: ${JSON.stringify(suspect)}`)
      }
    }
  }
  return findings
}

async function main() {
  const cwd = process.cwd()
  const urls = resolveTargetUrls()
  const failures = []

  for (const url of urls) {
    const html = await fetchHtml(url)
    const visibleText = stripTagsAndBlocks(html)
    const mojibakeHit = findMojibake(visibleText)
    if (mojibakeHit) {
      failures.push(`${url}: visible text contains suspicious mojibake ${JSON.stringify(mojibakeHit)}`)
    }
    const scripts = extractInlineScripts(html)
    scripts.forEach((script, index) => {
      const syntaxError = checkScriptSyntax(script, `${url} <script #${index}>`)
      if (syntaxError) failures.push(syntaxError)
    })
  }

  failures.push(...await scanSourceMojibake(cwd))

  if (failures.length) {
    console.error('UI safety check failed:')
    failures.forEach((failure) => console.error(`- ${failure}`))
    process.exit(1)
  }

  console.log(`UI safety check passed for ${urls.length} page(s).`)
}

main().catch((error) => {
  console.error(`UI safety check crashed: ${error instanceof Error ? error.message : String(error)}`)
  process.exit(1)
})
