import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const storefrontStylesSource = await readFile(new URL('../src/pages/storefront/styles.ts', import.meta.url), 'utf8')

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
  storefrontStylesSource,
  /@media \(max-width: 768px\) \{[\s\S]*#heroBannersWrapper \{[\s\S]*justify-content: center !important;[\s\S]*overflow: hidden !important;[\s\S]*#heroBannersCollapsed \{[\s\S]*place-items: center !important;[\s\S]*#heroBannersCollapsed \.hero-3d-carousel \{[\s\S]*width: min\(calc\(100vw - 4\.2rem\), 326px\) !important;[\s\S]*transform: none !important;/,
  'mobile hero carousel must use a centered fixed-width frame rather than translated offsets',
)

assert.match(
  storefrontStylesSource,
  /#heroBannersCollapsed \.hero-carousel-stage \{[\s\S]*left: 50% !important;[\s\S]*transform: translateX\(-50%\) !important;[\s\S]*#heroBannersCollapsed \.hero-carousel-card\[data-offset='1'\] \{[\s\S]*translate3d\(32%, 8px, -42px\)/,
  'mobile hero carousel active stage must be centered and side cards must stay near the frame center',
)

console.log('Storefront mobile modal layout contract passed.')
