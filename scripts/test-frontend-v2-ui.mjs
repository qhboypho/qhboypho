import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8')
const sections = read('src/pages/storefront/sections.ts')
const modals = read('src/pages/storefront/modals.ts')
const theme = read('src/pages/storefront/theme-refresh.ts')
const script = read('src/pages/storefront/script.ts')

const checks = [
  ['storefront uses the frontend-v2 UI scope', /data-ui-variant="frontend-v2"/.test(sections)],
  ['hero keeps the stacked banner slider', /id="heroBannersCollapsed"/.test(sections)],
  ['hero keeps the auto-typing target', /id="heroTypedText"/.test(sections)],
  ['hero has an accessible heading relationship', /aria-labelledby="heroTitle"/.test(sections) && /id="heroTitle"/.test(sections)],
  ['order modal has dialog semantics', /id="orderOverlay"[^>]*role="dialog"/.test(modals) && /id="orderOverlay"[^>]*aria-modal="true"/.test(modals)],
  ['checkout modal has dialog semantics', /id="cartOverlay"[^>]*role="dialog"/.test(modals) && /id="cartOverlay"[^>]*aria-modal="true"/.test(modals)],
  ['nested checkout address sheet has dialog semantics', /id="checkoutAddressManagerOverlay"[^>]*role="dialog"/.test(modals) && /id="checkoutAddressManagerOverlay"[^>]*aria-labelledby="checkoutAddressManagerTitle"/.test(modals)],
  ['customer inputs expose labels and autocomplete', /for="orderName"/.test(modals) && /id="orderName"[^>]*autocomplete="name"/.test(modals) && /for="orderPhone"/.test(modals) && /autocomplete="tel"/.test(modals)],
  ['checkout inputs expose labels and autocomplete', /for="ckName"/.test(modals) && /id="ckName"[^>]*autocomplete="name"/.test(modals) && /for="ckPhone"/.test(modals) && /autocomplete="tel"/.test(modals)],
  ['quantity controls are explicit buttons', /id="qtyDisplay"/.test(modals) && /type="button" onclick="changeQty\(-1\)"/.test(modals) && /type="button" onclick="changeQty\(1\)"/.test(modals)],
  ['checkout price has an accessible live total', /id="orderTotal"[^>]*aria-live="polite"/.test(modals) && /id="cartTotalPrice"[^>]*aria-live="polite"/.test(modals)],
  ['frontend-v2 palette removes neon/glow treatment', /body\[data-ui-variant='frontend-v2'\]\[data-storefront-theme='dark'\][\s\S]*--qh-action-gradient:\s*#5b8def/.test(theme) && /body\[data-ui-variant='frontend-v2'\]\[data-storefront-theme='light'\][\s\S]*--qh-action-gradient:\s*#2563eb/.test(theme)],
  ['frontend-v2 includes a modal focus trap', /function setupStorefrontModalAccessibility\(/.test(script) && /storefrontModalFocusables/.test(script) && /event\.key !== 'Tab'/.test(script) && /event\.shiftKey/.test(script) && /event\.preventDefault\(\)/.test(script)],
  ['nested dialogs restore focus to their opener', /storefrontModalFocusStack/.test(script) && /lastIndexOf\(previous\)/.test(script) && /next\.contains\(restore\)/.test(script)],
  ['nested checkout address editor focuses its first field', /firstField = document\.getElementById\('orderName'\)/.test(script) && /firstField = document\.getElementById\('ckName'\)/.test(script)],
  ['Escape closes the topmost visible overlay', /function closeVisibleStorefrontOverlay\(\)[\s\S]*\.sort\(\(a, b\) => b\.zIndex - a\.zIndex/.test(script)],
  ['focusables ignore hidden, inert and zero-layout controls', /getClientRects\(\)\.length > 0/.test(script) && /closest\('\[inert\]'\)/.test(script) && /:disabled,\[tabindex="-1"\]/.test(script)],
  ['variant quantity wrapper does not clip touch target', /min-h-\[44px\] h-auto/.test(modals)],
  ['frontend-v2 touch targets are at least 44px', /body\[data-ui-variant='frontend-v2'\][\s\S]*min-width:\s*44px[\s\S]*min-height:\s*44px/.test(theme)],
]

const failed = checks.filter(([, passed]) => !passed).map(([label]) => label)
if (failed.length) {
  console.error('FAIL test:frontend-v2-ui')
  failed.forEach((label) => console.error(`- ${label}`))
  process.exit(1)
}

console.log(`OK test:frontend-v2-ui (${checks.length} contracts)`)
