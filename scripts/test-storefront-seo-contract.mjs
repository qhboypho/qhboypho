import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { readFileSync } from 'node:fs'

const storefrontPage = readFileSync(new URL('../src/pages/storefrontPage.ts', import.meta.url), 'utf8')
const sections = readFileSync(new URL('../src/pages/storefront/sections.ts', import.meta.url), 'utf8')
const modals = readFileSync(new URL('../src/pages/storefront/modals.ts', import.meta.url), 'utf8')
const script = readFileSync(new URL('../src/pages/storefront/script.ts', import.meta.url), 'utf8')
const pageRoutes = readFileSync(new URL('../src/routes/pageRoutes.ts', import.meta.url), 'utf8')

describe('storefront SEO contract', () => {
  it('uses a concise storefront title aligned with visible content', () => {
    assert.match(storefrontPage, /const seoTitle = 'QH Boypho - Thời trang nam nữ hot trend'/)
    assert.doesNotMatch(storefrontPage, /Mua trực tiếp giá tốt hơn \| Thời trang nam nữ hot trend/)
  })

  it('adds a 301 canonical host redirect from www to non-www', () => {
    assert.match(pageRoutes, /redirectToCanonicalHost/)
    assert.match(pageRoutes, /hostname\.startsWith\('www\.'\)/)
    assert.match(pageRoutes, /c\.redirect\(url\.toString\(\), 301\)/)
  })

  it('keeps SEO support copy out of the hero UI', () => {
    assert.doesNotMatch(sections, /storefront-seo-copy/)
    assert.match(sections, /hero-desktop-desc/)
    assert.match(sections, /Mua trực tiếp tại QH Boypho/)
  })

  it('does not duplicate the checkout risk note text in initial HTML', () => {
    const count = (modals.match(/\$\{quickOrderRiskNoteText\}/g) || []).length
    assert.equal(count, 1)
    assert.doesNotMatch(modals, /<strong>Lưu ý:<\/strong>[\s\S]*<strong>Lưu ý:<\/strong>/)
  })

  it('provides alt text for storefront images emitted by static and dynamic templates', () => {
    const scanned = [sections, modals, script].join('\n')
    assert.doesNotMatch(scanned, /<img(?![^>]*\balt=)/)
  })
})
