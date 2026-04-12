import assert from 'node:assert/strict'
import fs from 'node:fs'

const flashSaleSource = fs.readFileSync(new URL('../src/pages/admin/script-flashsale.ts', import.meta.url), 'utf8')

assert.match(flashSaleSource, /flashSaleProductExpandedState/i, 'flashsale modal should track expanded state for product groups')
assert.match(flashSaleSource, /product_skus/i, 'flashsale modal should read product skus from admin product payload')
assert.match(flashSaleSource, /flashSaleToggleProductExpanded/i, 'flashsale modal should allow expand\\/collapse per product')
assert.match(flashSaleSource, /flashSaleApplyGroupFieldsToCheckedSkus/i, 'flashsale modal should support apply-all from parent product row')
assert.match(flashSaleSource, /data-flash-sale-sku-checkbox/i, 'flashsale sku rows should expose checkbox hooks')
assert.match(flashSaleSource, /product_sku_id/i, 'flashsale modal payload should be sku-based')

console.log('flashsale sku modal contract ok')
