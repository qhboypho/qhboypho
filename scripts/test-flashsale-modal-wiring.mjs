import assert from 'node:assert/strict'
import fs from 'node:fs'

const flashSaleSource = fs.readFileSync(new URL('../src/pages/admin/script-flashsale.ts', import.meta.url), 'utf8')
const adminScriptSource = fs.readFileSync(new URL('../src/pages/admin/script.ts', import.meta.url), 'utf8')

assert.match(flashSaleSource, /openFlashSaleProductPickerModal\(/, 'flashsale product picker opener should exist')
assert.match(flashSaleSource, /renderFlashSaleSelectedItems\(/, 'flashsale selected items renderer should exist')
assert.match(flashSaleSource, /submitFlashSaleCreateForm\(/, 'flashsale create submit handler should exist')
assert.match(flashSaleSource, /flashSaleCreateSelectedItems/i, 'flashsale selected item state should exist')
assert.match(flashSaleSource, /flashSaleProductPickerItems/i, 'flashsale product picker data state should exist')
assert.match(flashSaleSource, /function flashSaleCalculateSalePriceFromDiscount\(/, 'flashsale modal should calculate sale price from discount percent')
assert.match(flashSaleSource, /function flashSaleSyncSelectedItemRow\(/, 'flashsale modal should sync a single row without rebuilding the whole table')
assert.match(flashSaleSource, /data-flash-sale-field="sale_price"/, 'flashsale sale price input should expose a stable row field hook')
assert.match(flashSaleSource, /item\.sale_price = item\.discount_percent === null \? null : flashSaleCalculateSalePriceFromDiscount\(item\.product_price, item\.discount_percent\)/, 'discount input should derive sale price automatically')
const updateFieldFunction = flashSaleSource.match(/function updateFlashSaleSelectedItemField\([\s\S]*?\n\}/)
assert.ok(updateFieldFunction, 'flashsale item field updater should exist')
assert.match(updateFieldFunction[0], /flashSaleSyncSelectedItemRow\(productId\)/, 'typing in flashsale inputs should sync the current row in place')
assert.doesNotMatch(updateFieldFunction[0], /renderFlashSaleSelectedItems\(\)/, 'typing in flashsale inputs should not rebuild the entire table')
assert.match(flashSaleSource, /Tạo flashsale/i, 'flashsale modal should still expose the create action')
assert.match(adminScriptSource, /adminFlashSaleScript\(\)/, 'admin inline script should still compose flashsale script')

console.log('flashsale modal wiring ok')
