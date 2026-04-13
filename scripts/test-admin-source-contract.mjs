import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const adminPageSource = await readFile(new URL('../src/pages/adminPage.ts', import.meta.url), 'utf8')
const adminScriptSource = await readFile(new URL('../src/pages/admin/script.ts', import.meta.url), 'utf8')

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

console.log('admin source contract passed')
