import assert from 'node:assert/strict'
import fs from 'node:fs'

const sectionsSource = fs.readFileSync(new URL('../src/pages/admin/sections.ts', import.meta.url), 'utf8')
const flashSaleScriptSource = fs.readFileSync(new URL('../src/pages/admin/script-flashsale.ts', import.meta.url), 'utf8')

assert.match(sectionsSource, /id=\\"createFlashSaleModal\\"/, 'flashsale create modal shell should exist')
assert.match(sectionsSource, /id=\\"flashSaleNameInput\\"/, 'flashsale modal should include campaign name field')
assert.match(sectionsSource, /id=\\"flashSaleStartInput\\"/, 'flashsale modal should include start time field')
assert.match(sectionsSource, /id=\\"flashSaleEndInput\\"/, 'flashsale modal should include end time field')
assert.match(sectionsSource, /id=\\"flashSaleProductPickerModal\\"/, 'flashsale modal should include product selection area')
assert.match(flashSaleScriptSource, /function openFlashSaleCreateModal\(/, 'flashsale create modal opener should exist')
assert.match(flashSaleScriptSource, /function closeFlashSaleCreateModal\(/, 'flashsale create modal closer should exist')

console.log('flashsale modal shell ok')
