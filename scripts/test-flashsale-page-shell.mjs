import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const adminPagePath = path.join(root, 'src', 'pages', 'adminPage.ts')
const sectionsPath = path.join(root, 'src', 'pages', 'admin', 'sections.ts')
const flashSaleScriptPath = path.join(root, 'src', 'pages', 'admin', 'script-flashsale.ts')
const adminPageSource = fs.readFileSync(adminPagePath, 'utf8')
const sectionsSource = fs.readFileSync(sectionsPath, 'utf8')
const flashSaleScriptSource = fs.readFileSync(flashSaleScriptPath, 'utf8')

assert.match(adminPageSource, /\$\{adminFlashSalePage\(\)\}/, 'admin page should compose the flashsale section via adminFlashSalePage()')
assert.match(adminPageSource, /\$\{adminFlashSaleScript\(\)\}/, 'admin page should compose the flashsale runtime module')
assert.match(sectionsSource, /id=\\"page-flashsale\\"/, 'flashsale page shell should exist')
assert.match(sectionsSource, /id=\\"createFlashSaleBtn\\"/, 'flashsale create button should exist')
assert.match(sectionsSource, /data-status=\\"all\\"/, 'flashsale status tabs should exist')
assert.match(sectionsSource, /flashsaleAdminShell/, 'flashsale loader shell should exist')
assert.match(flashSaleScriptSource, /async function loadFlashSaleAdmin\(\)/, 'flashsale loader should exist')
assert.match(flashSaleScriptSource, /axios\.get\('\/api\/admin\/flash-sales'/, 'flashsale loader should fetch admin flash sales')

console.log('flash sale page shell contract ok')
