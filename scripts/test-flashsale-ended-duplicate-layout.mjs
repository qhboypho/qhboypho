import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const scriptSource = fs.readFileSync(path.join(root, 'src', 'pages', 'admin', 'script-flashsale.ts'), 'utf8')
const sectionsSource = fs.readFileSync(path.join(root, 'src', 'pages', 'admin', 'sections.ts'), 'utf8')

assert.match(scriptSource, /let\s+flashSaleDuplicatingFromId\s*=\s*null/, 'flash sale admin script should track duplicate mode')
assert.match(scriptSource, /async function openFlashSaleDuplicateModal\(/, 'ended flash sales should be duplicable from admin list')
assert.match(scriptSource, /actionText = isEnded \? 'Sao chép' : 'Xem\/Sửa'/, 'ended flash sales should show duplicate CTA instead of edit')
assert.match(scriptSource, /actionMode = isEnded \? 'duplicate' : 'edit'/, 'ended flash sales should bind duplicate action mode')
assert.match(scriptSource, /flashSaleApplyCampaignToForm\(campaign, \{ asCopy: true \}\)/, 'duplicate action should preload previous campaign as a new draft')
assert.match(scriptSource, /return raw\.includes\('Bản sao'\) \? raw : \('Bản sao - ' \+ raw\)/, 'duplicate flow should generate copied campaign name')

assert.match(sectionsSource, /xl:grid-cols-\[minmax\(0,1fr\)_240px\]/, 'flash sale modal should prioritize product area with a narrow preview column')
assert.match(sectionsSource, /min-w-\[160px\].*Giá gốc/, 'product table should widen base price column')
assert.match(sectionsSource, /min-w-\[180px\].*Giá flashsale/, 'product table should widen flash sale price column')
assert.match(sectionsSource, /Giá xem trước/, 'preview should still expose flash sale price label')
assert.doesNotMatch(sectionsSource, /199\.000đ/, 'preview should no longer show placeholder original price')

console.log('flash sale ended duplicate and modal layout contract ok')
