import assert from 'node:assert/strict'
import fs from 'node:fs'

const source = fs.readFileSync(new URL('../src/pages/adminPage.ts', import.meta.url), 'utf8')

assert.match(source, /id="createFlashSaleModal"/, 'flashsale create modal shell should exist')
assert.match(source, /id="openFlashSaleCreateModal"|openFlashSaleCreateModal\(/, 'flashsale create modal opener should exist')
assert.match(source, /id="closeFlashSaleCreateModal"|closeFlashSaleCreateModal\(/, 'flashsale create modal closer should exist')
assert.match(source, /Tên flashsale/i, 'flashsale modal should include campaign name field')
assert.match(source, /Thời gian bắt đầu/i, 'flashsale modal should include start time field')
assert.match(source, /Thời gian kết thúc/i, 'flashsale modal should include end time field')
assert.match(source, /Chọn sản phẩm/i, 'flashsale modal should include product selection area')

console.log('flashsale modal shell ok')
