import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const routeSource = fs.readFileSync(path.join(root, 'src', 'routes', 'flashSaleRoutes.ts'), 'utf8')
const adminSource = fs.readFileSync(path.join(root, 'src', 'pages', 'adminPage.ts'), 'utf8')

assert.match(routeSource, /app\.put\('\/api\/admin\/flash-sales\/:id'/, 'flash sale routes should support updating a campaign')
assert.match(adminSource, /let\s+flashSaleEditingId\s*=\s*null/, 'admin flashsale UI should track editing campaign id')
assert.match(adminSource, /async function openFlashSaleEditModal\(/, 'admin flashsale UI should expose an edit loader')
assert.ok(adminSource.includes("/api/admin/flash-sales/' + id") || /\/api\/admin\/flash-sales\/\$\{id\}/.test(adminSource), 'admin flashsale edit modal should fetch campaign detail by id')
assert.match(adminSource, /method:\s*flashSaleEditingId\s*\?\s*'PUT'\s*:\s*'POST'/, 'submit flow should switch between create and update')
assert.doesNotMatch(adminSource, /Chức năng xem\/sửa flashsale sẽ làm ở Task 7/, 'placeholder flashsale edit toast should be removed')

console.log('flash sale edit flow contract ok')
