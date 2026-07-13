import { readFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'

const root = process.cwd()
const read = (file) => readFileSync(join(root, file), 'utf8')
const assert = (condition, message) => {
  if (!condition) {
    console.error('FAIL:', message)
    process.exit(1)
  }
}

assert(existsSync(join(root, 'migrations/0022_auto_vouchers.sql')), 'auto voucher migration is missing')

const helper = read('src/lib/autoVoucherHelpers.ts')
assert(helper.includes('ensureAutoVoucherSchema'), 'auto voucher schema helper is missing')
assert(helper.includes('applyAutoVouchersToProducts'), 'product auto voucher applier is missing')
assert(helper.includes('resolveAutoVoucherProductPrice'), 'order price resolver is missing')
assert(helper.includes('if (!voucher) return baseProduct'), 'auto voucher helper should keep voucher metadata decisions separate from voucher existence')
assert(helper.includes('if (baseProduct.has_flash_sale)'), 'auto voucher helper should handle flash sale products explicitly')
assert(helper.includes('has_auto_voucher: true') && helper.includes('display_auto_voucher_discount: discount'), 'flash sale products should keep auto voucher metadata so the storefront badge still renders')

const productRoutes = read('src/routes/productRoutes.ts')
assert(productRoutes.includes("from '../lib/autoVoucherHelpers.ts'"), 'product routes do not import auto voucher helper')
assert(productRoutes.includes('applyAutoVouchersToProducts(db, shaped)'), 'public product shaping does not apply auto vouchers')

const orderRoutes = read('src/routes/orderRoutes.ts')
assert(orderRoutes.includes('resolveAutoVoucherProductPrice'), 'order route does not resolve auto voucher price')
assert(orderRoutes.includes('const subtotal = productUnitPrice * qty'), 'order subtotal still bypasses resolved product price')
assert(orderRoutes.includes('productUnitPrice,'), 'order insert does not store resolved product price')

const voucherRoutes = read('src/routes/voucherStatsRoutes.ts')
assert(voucherRoutes.includes('/api/admin/auto-vouchers'), 'auto voucher admin endpoints are missing')
assert(voucherRoutes.includes('normalizeAutoVoucherInput'), 'auto voucher admin input normalization is missing')

const adminSections = read('src/pages/admin/sections.ts')
assert(adminSections.includes('Voucher tự động'), 'admin auto voucher section is missing')
assert(adminSections.includes('Mã khuyến mãi'), 'admin coupon label was not renamed')
assert(adminSections.includes('autoVoucherScope'), 'admin auto voucher scope selector is missing')

const adminScript = read('src/pages/admin/script.ts')
assert(adminScript.includes('createAutoVoucher'), 'admin create auto voucher handler is missing')
assert(adminScript.includes('loadAutoVouchers'), 'admin auto voucher list loader is missing')
assert(adminScript.includes('/api/admin/auto-vouchers'), 'admin script does not call auto voucher API')

const storefrontScript = read('src/pages/storefront/script.ts')
const storefrontTheme = read('src/pages/storefront/theme-refresh.ts')
assert(storefrontScript.includes('getProductDisplayPriceInfo'), 'storefront display price helper is missing')
assert(storefrontScript.includes('renderAutoVoucherMiniBadge'), 'storefront auto voucher badge is missing')
assert(storefrontScript.includes("const classes = ['product-commerce-meta']"), 'product commerce meta should not include utility classes that push badges away from the left edge')
assert(storefrontScript.includes('return \'<div class="product-perk-badges">\' + badges.join(\'\') + \'</div>\''), 'product perk badges should use the shared left-aligned badge container')
assert(/\.product-commerce-meta \{[\s\S]*align-items: flex-start;[\s\S]*justify-content: flex-start;[\s\S]*text-align: left;/m.test(storefrontTheme), 'product commerce meta should align all badge rows to the left')
assert(/\.product-perk-badges \{[\s\S]*justify-content: flex-start;[\s\S]*align-self: flex-start;/m.test(storefrontTheme), 'product perk badge groups should stay on the left in cards, hero, and modals')
assert(
  storefrontScript.includes('price: getProductDisplayPriceInfo(product).price')
    || (storefrontScript.includes('const priceInfo = getProductDisplayPriceInfo(product, sku)') && storefrontScript.includes('price: priceInfo.price')),
  'cart does not store display price'
)
assert(storefrontScript.includes('Mã khuyến mãi không còn hiệu lực'), 'checkout error copy is not updated')

console.log('PASS: auto voucher contract')
