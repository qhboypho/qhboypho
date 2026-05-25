import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const storefrontStylesSource = await readFile(new URL('../src/pages/storefront/styles.ts', import.meta.url), 'utf8')
const storefrontScriptSource = await readFile(new URL('../src/pages/storefront/script.ts', import.meta.url), 'utf8')

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
  /container\.style\.width = hasSettingBannerOnly \? \(mobileMode \? 'min\(100%, 320px\)' : '360px'\) : \(mobileMode \? 'min\(100%, 342px\)' : '430px'\)/,
  'mobile hero carousel should use a constrained centered container instead of full-width drift',
)

assert.doesNotMatch(
  storefrontStylesSource,
  /#heroBannersCollapsed \.hero-carousel-stage|#heroBannersCollapsed \.hero-carousel-card\[data-offset=/,
  'global storefront styles should not override hero carousel stage/card transforms',
)

console.log('Storefront mobile modal layout contract passed.')
