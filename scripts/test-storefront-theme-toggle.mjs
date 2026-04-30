import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const sections = fs.readFileSync(path.join(root, 'src', 'pages', 'storefront', 'sections.ts'), 'utf8')
const script = fs.readFileSync(path.join(root, 'src', 'pages', 'storefront', 'script.ts'), 'utf8')
const styles = fs.readFileSync(path.join(root, 'src', 'pages', 'storefront', 'styles.ts'), 'utf8')

assert.match(sections, /data-storefront-theme=\\"light\\"/, 'storefront body should expose an initial light theme state')
assert.match(sections, /id=\\"storefrontThemeToggle\\"/, 'navbar should include a storefront theme toggle button')
assert.match(sections, /onclick=\\"toggleStorefrontTheme\(\)\\"/, 'theme toggle button should call toggleStorefrontTheme')
assert.match(sections, /id=\\"storefrontThemeIcon\\"[\s\S]*fa-moon/, 'theme button should start with a moon icon')
assert.match(
  sections,
  /onclick=\\"toggleMobileMenu\(\)\\"[\s\S]{0,300}id=\\"storefrontThemeToggle\\"/,
  'theme toggle should be the rightmost control in the top-right navbar'
)

assert.match(script, /const STOREFRONT_THEME_KEY = 'qhclothes_storefront_theme'/, 'script should persist storefront theme in localStorage')
assert.match(script, /function applyStorefrontTheme\(/, 'script should expose applyStorefrontTheme')
assert.match(script, /function toggleStorefrontTheme\(/, 'script should expose toggleStorefrontTheme')
assert.match(script, /document\.body\.dataset\.storefrontTheme = theme/, 'theme application should update body dataset')
assert.match(script, /localStorage\.setItem\(STOREFRONT_THEME_KEY, theme\)/, 'theme toggle should persist the selected theme')
assert.match(script, /applyStorefrontTheme\(loadStorefrontThemePreference\(\)\)/, 'storefront should apply saved theme during init')

assert.match(styles, /body\[data-storefront-theme='dark'\]/, 'styles should include dark storefront theme overrides')
assert.match(styles, /body\[data-storefront-theme='dark'\] \.navbar-blur/, 'dark theme should restyle navbar')
assert.match(styles, /body\[data-storefront-theme='dark'\] #filterBar/, 'dark theme should restyle filter bar')
assert.match(styles, /body\[data-storefront-theme='dark'\] \.product-card/, 'dark theme should restyle product cards')
assert.match(styles, /body\[data-storefront-theme='dark'\] \.flash-sale-shop-card/, 'dark theme should restyle flash sale shop cards')
assert.match(styles, /body\[data-storefront-theme='dark'\] \.theme-toggle-btn/, 'dark theme should restyle the toggle button')

console.log('storefront theme toggle contract passed')
