import assert from 'node:assert/strict'
import fs from 'node:fs'

const source = fs.readFileSync(new URL('../src/pages/adminPage.ts', import.meta.url), 'utf8')

assert.match(source, /openFlashSaleProductPickerModal\(/, 'flashsale product picker opener should exist')
assert.match(source, /renderFlashSaleSelectedItems\(/, 'flashsale selected items renderer should exist')
assert.match(source, /submitFlashSaleCreateForm\(/, 'flashsale create submit handler should exist')
assert.match(source, /flashSaleCreateSelectedItems/i, 'flashsale selected item state should exist')
assert.match(source, /flashSaleProductPickerItems/i, 'flashsale product picker data state should exist')
assert.match(source, /T?o flashsale/i, 'flashsale modal should still expose the create action')

console.log('flashsale modal wiring ok')
