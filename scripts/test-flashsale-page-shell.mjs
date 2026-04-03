import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const adminPagePath = path.join(root, 'src', 'pages', 'adminPage.ts')
const source = fs.readFileSync(adminPagePath, 'utf8')

assert.match(source, /id="page-flashsale"/, 'flashsale page shell should exist')
assert.match(source, /id="createFlashSaleBtn"/, 'flashsale create button placeholder should exist')
assert.match(source, /data-status="all"/, 'flashsale status tabs should exist')
assert.match(source, /async function loadFlashSaleAdmin\(\)/, 'flashsale loader should exist')
assert.match(source, /axios\.get\('\/api\/admin\/flash-sales'/, 'flashsale loader should fetch admin flash sales')
assert.match(source, /flashsaleAdminShell/, 'flashsale loader should render into shell')

console.log('flash sale page shell contract ok')
