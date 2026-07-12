import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const script = fs.readFileSync(path.join(root, 'src/pages/storefront/script.ts'), 'utf8')
const page = fs.readFileSync(path.join(root, 'src/pages/hottrendnuPage.ts'), 'utf8')

function assert(condition, message) {
  if (!condition) {
    console.error('FAIL:', message)
    process.exit(1)
  }
}

assert(script.includes('const HOT_TREND_NU_TYPE_FILTERS'), 'QH Clothes must use grouped product type filters')
assert(script.includes("{ slug: 'tops', name: 'Áo', members: ['tshirt', 'polo'] }"), 'Áo group must include tshirt and polo')
assert(script.includes("{ slug: 'pants', name: 'Quần', members: ['pants', 'jeans'] }"), 'Quần group must include pants and jeans')
assert(script.includes("{ slug: 'outerwear', name: 'Áo khoác', members: ['jacket', 'hoodie'] }"), 'Áo khoác group must include jacket and hoodie')
assert(script.includes('function productMatchesTypeFilter(product)'), 'filtering must use a dedicated product type matcher')
assert(script.includes('const matchType = productMatchesTypeFilter(p)'), 'product list must call productMatchesTypeFilter')
assert(script.includes('const searchHaystack = normalizeProductFilterText'), 'product search must normalize Vietnamese text')
assert(script.includes('window.refreshUiSelects'), 'dynamic filter options must refresh custom selects')

assert(page.includes('data-type="tops"'), 'QH Clothes desktop chips must expose the Áo group')
assert(page.includes("filterProductType('tops'"), 'QH Clothes entry points must select the Áo group')
assert(page.includes('data-type="outerwear"'), 'QH Clothes desktop chips must expose the Áo khoác group')
assert(page.includes("filterProductType('outerwear'"), 'QH Clothes entry points must select the Áo khoác group')
assert(!page.includes("filterProductType('tshirt'"), 'QH Clothes should not filter Áo by tshirt only')
assert(!page.includes("filterProductType('jacket'"), 'QH Clothes should not filter Áo khoác by jacket only')

console.log('PASS hottrendnu product filters contract')
