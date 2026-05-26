import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const storefrontStylesSource = await readFile(new URL('../src/pages/storefront/styles.ts', import.meta.url), 'utf8')
const storefrontScriptSource = await readFile(new URL('../src/pages/storefront/script.ts', import.meta.url), 'utf8')
const storefrontThemeRefreshSource = await readFile(new URL('../src/pages/storefront/theme-refresh.ts', import.meta.url), 'utf8')

assert.match(
  storefrontStylesSource,
  /#detailOverlay \.sticky \{[\s\S]*z-index: 40 !important;[\s\S]*background: #fff !important;/,
  'product detail modal header must stay above scrolled price/content in light mode',
)

assert.match(
  storefrontStylesSource,
  /body\[data-storefront-theme='dark'\] #detailOverlay \.sticky \{[\s\S]*background: #071426 !important;/,
  'product detail modal header must keep an opaque dark background in dark mode',
)

assert.match(
  storefrontScriptSource,
  /wrapper\.style\.justifyContent = mobileMode \? 'center' : 'flex-end'/,
  'mobile hero carousel wrapper should be centered by the render function',
)

assert.match(
  storefrontScriptSource,
  /container\.style\.width = hasSettingBannerOnly \? \(mobileMode \? 'min\(100%, 320px\)' : '360px'\) : \(mobileMode \? '100%' : '430px'\)/,
  'mobile hero carousel should use the fluid hero column width instead of a device-specific fixed width',
)

assert.match(
  storefrontScriptSource,
  /\.hero-carousel-stage\{width:min\(52vw,214px\);height:326px\}/,
  'mobile hero carousel stage should stay naturally centered without a device-specific translate compensation',
)

assert.doesNotMatch(
  storefrontScriptSource,
  /hero-carousel-stage\{[^}]*translateX\(/,
  'mobile hero carousel must not use fixed translateX offsets to fake centering',
)

assert.match(
  storefrontThemeRefreshSource,
  /#hero \.hero-layout \{[\s\S]*width: 100% !important;[\s\S]*max-width: 100% !important;[\s\S]*min-width: 0 !important;[\s\S]*box-sizing: border-box !important;/,
  'mobile hero layout must fill its own section instead of expanding past the card edge',
)

assert.match(
  storefrontThemeRefreshSource,
  /#hero \.hero-copy-block,\s*#heroBannersWrapper \{[\s\S]*width: 100% !important;[\s\S]*min-width: 0 !important;/,
  'mobile hero copy and carousel wrapper should share the same fluid column width',
)

assert.doesNotMatch(
  storefrontStylesSource,
  /#heroBannersCollapsed \.hero-carousel-stage|#heroBannersCollapsed \.hero-carousel-card\[data-offset=/,
  'global storefront styles should not override hero carousel stage/card transforms',
)

console.log('Storefront mobile modal layout contract passed.')
