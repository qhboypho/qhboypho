import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const purchaseToastSource = await readFile(new URL('../src/pages/storefront/script-purchase-toast.ts', import.meta.url), 'utf8')
const ordersSource = await readFile(new URL('../src/pages/admin/script-orders.ts', import.meta.url), 'utf8')
const storefrontModalsSource = await readFile(new URL('../src/pages/storefront/modals.ts', import.meta.url), 'utf8')
const storefrontSectionsSource = await readFile(new URL('../src/pages/storefront/sections.ts', import.meta.url), 'utf8')
const storefrontStylesSource = await readFile(new URL('../src/pages/storefront/styles.ts', import.meta.url), 'utf8')
const storefrontScriptSource = await readFile(new URL('../src/pages/storefront/script.ts', import.meta.url), 'utf8')
const adminSectionsSource = await readFile(new URL('../src/pages/admin/sections.ts', import.meta.url), 'utf8')

assert.match(
  purchaseToastSource,
  /Vừa mua xong/,
  'purchase toast should use the accented "Vừa mua xong" label',
)
assert.match(
  purchaseToastSource,
  /Khách/,
  'purchase toast should use the accented "Khách" label',
)
assert.doesNotMatch(
  purchaseToastSource,
  /Vua mua xong|Khach/,
  'purchase toast should not regress to the non-accented labels',
)
assert.doesNotMatch(
  purchaseToastSource,
  /#6366f1/i,
  'purchase toast should not keep the indigo accent that clashes with the storefront brand palette',
)

assert.match(
  ordersSource,
  /Hành động này không thể hoàn tác/,
  'bulk delete should warn that deleting selected orders cannot be undone',
)

assert.doesNotMatch(
  storefrontModalsSource,
  /Trường này là bắt buộc/,
  'payment method should not render the required-field error before user interaction',
)
assert.match(
  storefrontModalsSource,
  /ckFieldPaymentMethod/,
  'cart checkout step should render a payment method selector field',
)

assert.doesNotMatch(
  storefrontSectionsSource,
  /Quản trị/,
  'public storefront footer should not expose the admin link',
)
assert.match(
  storefrontSectionsSource,
  /grid grid-cols-2 md:grid-cols-4 gap-8 text-center/,
  'features section should use two columns on mobile instead of stacking into a single column',
)

assert.doesNotMatch(
  storefrontStylesSource,
  /\.add-to-cart-btn \{ background: #16a34a !important; \}/,
  'add-to-cart button should not keep the green background that clashes with the storefront palette',
)
assert.doesNotMatch(
  storefrontStylesSource,
  /border-left:4px solid #6366f1|rgba\(99,102,241,0\.08\)/i,
  'shared purchase toast styles should not keep the indigo brand mismatch',
)

assert.doesNotMatch(
  storefrontScriptSource,
  /payment_method:\s*'COD'/,
  'cart checkout should no longer hardcode COD as the only payment method',
)

assert.doesNotMatch(
  adminSectionsSource,
  /<!-- FLASH SALE PAGE -->|Giai đoạn đầu|Phase 1|Task 8|sẽ được phát triển thêm sau/i,
  'admin flash sale page should not ship developer comments or temporary implementation notes in production HTML',
)

console.log('Critical UI contract passed.')
