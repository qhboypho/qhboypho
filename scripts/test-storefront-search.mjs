import assert from 'node:assert/strict'
import fs from 'node:fs'
import vm from 'node:vm'

const source = fs.readFileSync('src/pages/storefront/script.ts', 'utf8')
  .replace(/^import .*\r?\n/, '')
  .replace('export function storefrontInlineScript(): string {', 'function storefrontInlineScript() {')
const generated = vm.runInNewContext(source + '\nstorefrontInlineScript()', { storefrontDetailOrderScript: () => '' })
function load(name, context) {
  const start = generated.indexOf('function ' + name + '(')
  assert.ok(start >= 0, name + ' exists')
  const end = generated.indexOf('\n}', start) + 2
  vm.runInContext(generated.slice(start, end), context)
}
const input = { value: 'Áo ', focus() {}, classList: { toggle() {} } }
const context = vm.createContext({
  URL, URLSearchParams, activeProductSearch: '', activeProductSort: 'newest', productSortExplicit: false,
  activeProductCategory: 'all', activeProductType: 'all', activeProductColor: 'all', activeProductSize: 'all', activeProductPrice: 'all',
  document: { activeElement: input, querySelectorAll: () => [input], getElementById: () => null },
  window: { location: { href: 'https://shop.test/?utm_source=test#products', search: '?search=ao%20nam&utm_source=test' }, history: { replaceState(_a, _b, url) { context.savedUrl = url } } },
  isHotTrendWomenContext: () => false, applyProductsFilters() {}, inferStorefrontProductType: () => '',
})
for (const name of ['syncStorefrontSearchInputs', 'updateStorefrontSearchUrl', 'searchProducts', 'normalizeProductFilterText', 'getStorefrontSearchMatches', 'hydrateProductSearchFromUrl']) load(name, context)
context.searchProducts(input.value)
assert.equal(input.value, 'Áo ', 'typing must preserve case and trailing spaces')
assert.match(context.savedUrl, /search=/, 'Boypho search must persist in URL')
assert.match(context.savedUrl, /utm_source=test/, 'preserve unrelated URL parameters')
assert.match(context.savedUrl, /#products$/, 'preserve hash')
context.allProducts = [
  { id: 1, name: 'Áo thun nam màu đen', sku: 'SH-01' },
  { id: 2, name: 'Quần jeans', description: 'áo nam đen' },
  { id: 3, name: 'Áo nữ trắng' },
]
load('getProductSearchScore', context)
assert.deepEqual(Array.from(context.getStorefrontSearchMatches('  AO   đen nam ', 6), p => p.id), [1, 2])
assert.deepEqual(Array.from(context.getStorefrontSearchMatches('SH-01', 6), p => p.id), [1])
assert.equal(context.getStorefrontSearchMatches('không tồn tại', 6).length, 0)
context.hydrateProductSearchFromUrl()
assert.equal(context.activeProductSearch, 'ao nam')
context.searchProducts('')
assert.ok(!context.savedUrl.includes('search='), 'clearing removes only search param')
assert.ok(context.savedUrl.includes('utm_source=test'))
console.log('Storefront search: input, Vietnamese multiword matching, ranking and URL passed')
