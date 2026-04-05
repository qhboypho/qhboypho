import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const storefrontPagePath = path.join(root, 'src', 'pages', 'storefrontPage.ts')
const source = fs.readFileSync(storefrontPagePath, 'utf8')

assert.match(source, /async function showDetail\(/, 'showDetail should exist')
assert.match(source, /const flashMeta = getFlashSaleMeta\(p\)/, 'detail modal should derive flash sale metadata')
assert.match(source, /detailDisplayPrice/, 'detail modal should use flash sale-aware display price')
assert.match(source, /flash-sale-badge/, 'detail modal should include flash sale badge treatment')
assert.match(source, /flash-sale-countdown/, 'detail modal should include flash sale countdown treatment')
assert.match(source, /display_price|display_sale_price/, 'detail modal should reference flash sale display pricing')

console.log('flash sale detail modal contract ok')
