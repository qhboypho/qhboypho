import assert from 'node:assert/strict'
import { buildDesiredProductSkus, findProductSkuMatch } from '../src/lib/productSkuHelpers.ts'
import { attachSkuStateToProduct } from '../src/lib/productFlashSaleView.ts'

const product = {
  id: 88,
  price: 150000,
  original_price: 220000,
  stock: 99,
  is_active: 1,
  thumbnail: 'https://example.com/jacket.jpg',
  colors: JSON.stringify([
    { name: 'Loại A', image: 'https://example.com/a.jpg' },
    { name: 'Loại B', image: 'https://example.com/b.jpg' }
  ]),
  sizes: JSON.stringify(['M', 'L']),
  product_skus: [
    { color: 'Loại A', size: 'M', price: 150000, original_price: 220000, stock: 7, sku_code: 'A-M' },
    { color: 'Loại A', size: 'L', price: 150000, original_price: 220000, stock: 8, sku_code: 'A-L' },
    { color: 'Loại B', size: 'M', price: 190000, original_price: 260000, stock: 5, sku_code: 'B-M' },
    { color: 'Loại B', size: 'L', price: 190000, original_price: 260000, stock: 6, sku_code: 'B-L' }
  ]
}

const desired = buildDesiredProductSkus(product)
assert.equal(desired.length, 4, 'variant matrix should still be generated from option x size')

const shaped = attachSkuStateToProduct(product, product.product_skus, new Map())
assert.equal(shaped.price, 150000, 'product card should expose the lowest active SKU price')
assert.equal(shaped.original_price, 220000, 'original price should follow the lowest active SKU')
assert.equal(shaped.product_skus.length, 4, 'shaped product should keep all SKU rows')

const typeB = findProductSkuMatch(shaped.product_skus, 'loại b', 'm')
assert.equal(typeB?.sku_code, 'B-M', 'selected variant should resolve to the exact SKU')
assert.equal(Number(typeB?.price), 190000, 'selected variant should keep its own price')

console.log('advanced SKU pricing contract ok')
