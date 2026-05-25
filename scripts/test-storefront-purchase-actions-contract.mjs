import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const storefrontScriptSource = await readFile(new URL('../src/pages/storefront/script.ts', import.meta.url), 'utf8')
const storefrontThemeRefreshSource = await readFile(new URL('../src/pages/storefront/theme-refresh.ts', import.meta.url), 'utf8')
const storefrontStylesSource = await readFile(new URL('../src/pages/storefront/styles.ts', import.meta.url), 'utf8')

assert.match(
  storefrontScriptSource,
  /flash-sale-shop-actions--blocked[\s\S]*flash-sale-shop-blocked-btn/,
  'blocked best-seller and flash-sale purchase controls should reuse the same action row wrapper',
)

assert.match(
  storefrontThemeRefreshSource,
  /--qh-action-radius[\s\S]*--qh-action-gradient[\s\S]*--qh-action-shadow/,
  'storefront purchase buttons should share action design tokens',
)

assert.match(
  storefrontThemeRefreshSource,
  /\.flash-sale-shop-actions--blocked \.blocked-order-btn[\s\S]*height: 2\.05rem[\s\S]*border-radius: var\(--qh-action-radius\)/,
  'blocked purchase button should match the best-seller action height and radius on desktop',
)

assert.match(
  storefrontThemeRefreshSource,
  /\.flash-sale-shop-actions--blocked \.blocked-order-btn[\s\S]*height: 1\.8rem !important/,
  'blocked purchase button should match the compact best-seller action height on mobile',
)

assert.match(
  storefrontThemeRefreshSource,
  /#orderPopupCard \.order-submit-btn,[\s\S]*#orderPopupCard \.order-cart-btn[\s\S]*background: var\(--qh-action-gradient\)/,
  'quick-order modal buttons should use the shared purchase action styling',
)

assert.match(
  storefrontThemeRefreshSource,
  /\.detail-action-bar \.btn-primary,[\s\S]*\.detail-action-bar \.add-to-cart-btn[\s\S]*background: var\(--qh-action-gradient\)/,
  'product detail modal buttons should use the shared purchase action styling',
)

assert.match(
  storefrontStylesSource,
  /#orderModalHeader \{[^}]*z-index: 120/,
  'quick-order modal header should stay above address dropdowns while scrolling',
)

assert.match(
  storefrontStylesSource,
  /#orderPopupCard #orderProvinceMenu,[\s\S]*#orderPopupCard #orderCommuneMenu,[\s\S]*#orderPopupCard #ckProvinceMenu,[\s\S]*#orderPopupCard #ckCommuneMenu \{[^}]*z-index: 40 !important/,
  'quick-order address dropdown menus should render below the sticky modal header',
)

assert.match(
  storefrontStylesSource,
  /\.bs-card \.flash-sale-shop-buy-btn \{[\s\S]*flex: auto !important[\s\S]*max-width: calc\(100% - 60px - 0\.5rem\) !important/,
  'bestseller quick-order button should take the remaining width like product list cards',
)

assert.match(
  storefrontStylesSource,
  /\.bs-card \.flash-sale-shop-cart-btn \{[\s\S]*flex: 0 0 60px !important[\s\S]*width: 60px !important/,
  'bestseller cart button should keep the same 60px width as product list cards',
)

console.log('storefront purchase actions contract passed')
