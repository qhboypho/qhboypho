import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const routeSource = fs.readFileSync(path.join(root, 'src', 'routes', 'flashSaleRoutes.ts'), 'utf8')
const adminSource = fs.readFileSync(path.join(root, 'src', 'pages', 'adminPage.ts'), 'utf8')
const scriptSource = fs.readFileSync(path.join(root, 'src', 'pages', 'admin', 'script-flashsale.ts'), 'utf8')

assert.match(routeSource, /app\.put\('\/api\/admin\/flash-sales\/:id'/, 'flash sale routes should support updating a campaign')
assert.match(scriptSource, /let\s+flashSaleEditingId\s*=\s*null/, 'admin flashsale UI should track editing campaign id')
assert.match(scriptSource, /async function openFlashSaleEditModal\(/, 'admin flashsale UI should expose an edit loader')
assert.ok(scriptSource.includes("/api/admin/flash-sales/' + id") || /\/api\/admin\/flash-sales\/\$\{id\}/.test(scriptSource), 'admin flashsale edit modal should fetch campaign detail by id')
assert.match(scriptSource, /method:\s*flashSaleEditingId\s*\?\s*'PUT'\s*:\s*'POST'/, 'submit flow should switch between create and update')
assert.doesNotMatch(scriptSource, /Chức năng xem\/sửa flashsale sẽ làm ở Task 7/, 'placeholder flashsale edit toast should be removed')

const editModalFunction = scriptSource.match(/async function openFlashSaleEditModal\([\s\S]*?\n\}/)
assert.ok(editModalFunction, 'flashsale edit modal loader should exist in admin script')
assert.match(editModalFunction[0], /await\s+loadFlashSaleProductPickerProducts\(\)/, 'edit modal should wait for product picker products before applying campaign data')
assert.doesNotMatch(editModalFunction[0], /flashSaleSetCreateSubmitState\(true\)/, 'edit modal should not lock the form while loading campaign data')
assert.ok(
  editModalFunction[0].indexOf('await loadFlashSaleProductPickerProducts()') < editModalFunction[0].indexOf("axios.get('/api/admin/flash-sales/' + id)"),
  'edit modal should load picker products before fetching and applying detail data'
)

const duplicateModalFunction = scriptSource.match(/async function openFlashSaleDuplicateModal\([\s\S]*?\n\}/)
assert.ok(duplicateModalFunction, 'flashsale duplicate modal loader should exist in admin script')
assert.match(duplicateModalFunction[0], /await\s+loadFlashSaleProductPickerProducts\(\)/, 'duplicate modal should wait for product picker products before applying campaign data')
assert.doesNotMatch(duplicateModalFunction[0], /flashSaleSetCreateSubmitState\(true\)/, 'duplicate modal should not lock the form while loading campaign data')
assert.ok(
  duplicateModalFunction[0].indexOf('await loadFlashSaleProductPickerProducts()') < duplicateModalFunction[0].indexOf("axios.get('/api/admin/flash-sales/' + id)"),
  'duplicate modal should load picker products before fetching and applying detail data'
)

console.log('flash sale edit flow contract ok')
