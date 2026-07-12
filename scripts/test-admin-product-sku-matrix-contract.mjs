import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const modalSource = readFileSync('src/pages/admin/modals.ts', 'utf8')
const scriptSource = readFileSync('src/pages/admin/script.ts', 'utf8')

assert.match(modalSource, /id="pSkuPricingEnabled"/, 'product modal should expose SKU pricing toggle')
assert.match(modalSource, /id="skuMatrixBody"/, 'product modal should expose SKU matrix table body')
assert.match(modalSource, /id="skuBulkPrice"/, 'product modal should expose bulk sale price input')
assert.match(modalSource, /id="skuBulkOriginalPrice"/, 'product modal should expose bulk original price input')
assert.match(modalSource, /onclick="applySkuBulkValues\(\)"/, 'product modal should wire bulk apply button')
assert.match(modalSource, /Định giá theo từng SKU/, 'product modal should explain per-SKU pricing')
assert.match(modalSource, /Giá bán mặc định \(VNĐ\)/, 'base product price should be labeled as default price')
assert.doesNotMatch(modalSource, /id="pPrice" required/, 'base product price should not be browser-required when SKU pricing is used')

assert.match(scriptSource, /let skuPricingEnabled = false/, 'admin script should track SKU pricing mode')
assert.match(scriptSource, /function renderProductSkuMatrix\(\)/, 'admin script should render SKU matrix')
assert.match(scriptSource, /function collectProductSkuRows\(\)/, 'admin script should collect SKU matrix payload')
assert.match(scriptSource, /function applySkuBulkValues\(\)/, 'admin script should apply bulk SKU values')
assert.match(scriptSource, /function getSkuFallbackPricing\(rows\)/, 'admin script should derive base product price from SKU rows')
assert.match(scriptSource, /skuPrefix \+ '-' \+ String\(index \+ 1\)\.padStart\(2, '0'\)/, 'bulk SKU prefix should generate deterministic per-row codes')
assert.match(scriptSource, /const skuRows = collectProductSkuRows\(\)/, 'product save should collect SKU matrix rows before building payload')
assert.match(scriptSource, /const skuFallback = getSkuFallbackPricing\(skuRows\)/, 'product save should derive fallback price from SKU rows')
assert.match(scriptSource, /product_skus: skuRows/, 'product save payload should include collected product_skus')
assert.match(scriptSource, /shouldEnableSkuPricingForProduct\(p\)/, 'edit mode should auto-enable SKU matrix when existing SKU rows differ')

console.log('admin product SKU matrix contract ok')
