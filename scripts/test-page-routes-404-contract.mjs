import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { readFileSync } from 'node:fs'

const source = readFileSync(new URL('../src/routes/pageRoutes.ts', import.meta.url), 'utf8')

describe('page route 404 contract', () => {
  it('does not render the storefront for every unknown path', () => {
    assert.doesNotMatch(source, /app\.get\(\s*['"`]\*['"`]\s*,\s*renderStorefront\s*\)/)
  })

  it('keeps explicit storefront and admin shell routes', () => {
    assert.match(source, /app\.get\(\s*['"`]\/['"`]\s*,\s*async\s*\(c\)/)
    assert.match(source, /app\.get\(\s*['"`]\/admin\/\*['"`]/)
  })

  it('serves a branded not found page with HTTP 404 status', () => {
    assert.match(source, /function\s+notFoundHTML\s*\(/)
    assert.match(source, /QH Boypho/)
    assert.match(source, /c\.html\(\s*notFoundHTML\(\)\s*,\s*404\s*\)/)
  })

  it('keeps the 404 page wide and balanced like the storefront shell', () => {
    assert.match(source, /not-found-shell/)
    assert.match(source, /width:\s*min\(100%,\s*72rem\)/)
    assert.match(source, /not-found-code[\s\S]*font-size:\s*clamp\(4\.8rem,\s*13vw,\s*8rem\)/)
    assert.match(source, /font-size:\s*clamp\(1\.05rem,\s*2\.5vw,\s*1\.55rem\)/)
    assert.doesNotMatch(source, /not-found-aside/)
    assert.doesNotMatch(source, /not-found-mini-card/)
    assert.doesNotMatch(source, /font-size:\s*clamp\(2\.25rem,\s*11vw,\s*4\.5rem\)/)
  })

  it('returns 404 for unknown storefront query params but keeps product and affiliate params', () => {
    assert.match(source, /function\s+hasOnlyKnownStorefrontQueryParams\s*\(/)
    assert.match(source, /knownKeys\.has\(key\)/)
    assert.match(source, /knownPrefixes\.some\(\(prefix\)\s*=>\s*key\.startsWith\(prefix\)\)/)
    assert.match(source, /return c\.html\(notFoundHTML\(\), 404\)/)
    assert.match(source, /'product'/)
    assert.match(source, /'ref'/)
    assert.match(source, /'aff'/)
    assert.match(source, /'utm_'/)
  })
})
