import assert from 'node:assert/strict'
import {
  buildDesiredProductSkus,
  findProductSkuMatch,
} from '../src/lib/productSkuHelpers.ts'

const product = {
  id: 25,
  price: 199000,
  original_price: 259000,
  stock: 12,
  is_active: 1,
  thumbnail: 'https://example.com/default.jpg',
  colors: JSON.stringify([
    { name: 'Đen', image: 'https://example.com/black.jpg' },
    { name: 'Trắng', image: 'https://example.com/white.jpg' }
  ]),
  sizes: JSON.stringify(['M', 'L'])
}

const skus = buildDesiredProductSkus(product)

assert.equal(skus.length, 4, 'should build a full color x size matrix')
assert.deepEqual(
  skus.map((sku) => ({ color: sku.color, size: sku.size })),
  [
    { color: 'Đen', size: 'M' },
    { color: 'Đen', size: 'L' },
    { color: 'Trắng', size: 'M' },
    { color: 'Trắng', size: 'L' },
  ],
  'sku combinations should preserve human-readable color and size values'
)
assert.equal(
  skus.find((sku) => sku.color === 'Đen' && sku.size === 'M')?.image,
  'https://example.com/black.jpg',
  'sku image should inherit the matching color image'
)
assert.ok(
  skus.every((sku) => sku.sku_code && sku.price === 199000 && sku.original_price === 259000),
  'generated skus should have deterministic sku codes and inherit product pricing'
)

const matched = findProductSkuMatch(
  [
    { id: 1, color: 'Đen', size: 'M', is_active: 1 },
    { id: 2, color: 'Đen', size: 'L', is_active: 1 },
    { id: 3, color: '', size: '', is_active: 1 }
  ],
  'đen',
  'l'
)

assert.equal(matched?.id, 2, 'sku lookup should match selected color/size case-insensitively')

console.log('product sku sync contract ok')
