import assert from 'node:assert/strict'
import fs from 'node:fs'
import vm from 'node:vm'

const source = fs.readFileSync('src/pages/storefront/script-purchase-toast.ts', 'utf8')
const factory = source.replace('export function storefrontPurchaseToastScript(): string', 'function storefrontPurchaseToastScript()')
const script = vm.runInNewContext(factory + '\nstorefrontPurchaseToastScript()')
let scheduled = 0
vm.runInNewContext(script, {
  document: { body: { dataset: { uiVariant: 'frontend-v2' } } },
  window: { matchMedia: () => ({ matches: true }) },
  setTimeout: () => { scheduled++; return 1 },
})
assert.equal(scheduled, 0, 'frontend-v2 must not schedule fabricated purchase notifications')
console.log('frontend-v2 purchase toast runtime passed')
