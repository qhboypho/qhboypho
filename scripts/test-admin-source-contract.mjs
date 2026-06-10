import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const adminPageSource = await readFile(new URL('../src/pages/adminPage.ts', import.meta.url), 'utf8')
const adminScriptSource = await readFile(new URL('../src/pages/admin/script.ts', import.meta.url), 'utf8')
const adminSectionsSource = await readFile(new URL('../src/pages/admin/sections.ts', import.meta.url), 'utf8')

const expectedScriptEmbeds = [
  '${adminInlineScript()}',
  '${adminOrdersScript()}',
  '${adminFlashSaleScript()}',
  '${adminFeaturedSettingsScript()}',
  '${adminBootstrapScript()}',
]

expectedScriptEmbeds.forEach((snippet) => {
  assert.ok(adminPageSource.includes(snippet), `Expected adminPage.ts to include ${snippet}`)
})

const scriptTagCount = (adminPageSource.match(/<script>/g) || []).length
assert.ok(scriptTagCount >= 5, `Expected adminPage.ts to render split script tags, got ${scriptTagCount}`)

assert.match(adminScriptSource, /export function adminInlineScript\(\): string/, 'Expected adminInlineScript export')
assert.match(adminScriptSource, /export function adminBootstrapScript\(\): string/, 'Expected adminBootstrapScript export')
assert.doesNotMatch(adminScriptSource, /\$\{adminOrdersScript\(\)\}/, 'Expected adminOrdersScript to stay out of core script')
assert.doesNotMatch(adminScriptSource, /\$\{adminFlashSaleScript\(\)\}/, 'Expected adminFlashSaleScript to stay out of core script')
assert.doesNotMatch(adminScriptSource, /\$\{adminFeaturedSettingsScript\(\)\}/, 'Expected adminFeaturedSettingsScript to stay out of core script')
assert.match(adminScriptSource, /function bindAdminSidebarSwipeGestures\(\)/, 'Expected admin dashboard to bind mobile sidebar swipe gestures')
assert.match(adminScriptSource, /touchstart[\s\S]*touchmove[\s\S]*touchend/, 'Expected sidebar swipe gesture to track touch lifecycle')
assert.match(adminScriptSource, /if \(!startedOpen && dx > 0\) openMobileSidebar\(\)/, 'Expected edge swipe right to open mobile sidebar')
assert.match(adminScriptSource, /if \(startedOpen && dx < 0\) closeMobileSidebar\(\)/, 'Expected swipe left to close mobile sidebar')
assert.match(adminSectionsSource, /<header[\s\S]*id="menuToggle"[\s\S]*id="pageTitle"/, 'Expected mobile menu toggle to render inside the admin header before the page title')
assert.match(adminSectionsSource, /export function adminMobileMenuToggle\(\): string \{\s*return ""\s*\}/, 'Expected legacy mobile menu placeholder to avoid rendering a second fixed hamburger')

console.log('admin source contract passed')
