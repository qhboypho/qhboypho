import assert from 'node:assert/strict'
import fs from 'node:fs'
import vm from 'node:vm'
import { Hono } from 'hono'
import { registerPaymentRoutes } from '../src/routes/paymentRoutes.ts'

const deps = {
  async initDB() {}, async syncOrderPayment() {}, async syncOrderPaymentWithPayOS() {},
  async syncOrderPaymentWithMoMo() {}, async syncOrderPaymentWithZaloPay() {},
  async getPayOSConfig() { return {} }, async getMoMoConfig() { return {} }, getMoMoMissingConfigKeys() { return [] },
  async getZaloPayConfig() { return {} }, getZaloPayMissingConfigKeys() { return [] },
  async getBankTransferProviderConfig() { return {} }, buildManualVietQRPaymentData() { return {} },
  sanitizeAddressEffectiveDate(value) { return value || 'latest' },
  addressKitCache: { provinces: new Map(), communes: new Map() }, ADDRESS_KIT_BASE_URL: 'https://address.test',
  buildMoMoOrderId() { return '' }, buildZaloPayAppTransId() { return '' }, payOSSignWithChecksum() { return '' },
  payOSBuildDataString() { return '' }, parseJsonObject() { return {} }, async payOSGetPaymentInfo() { return null },
}
const app = new Hono()
registerPaymentRoutes(app, deps)
let upstreamCalls = 0
globalThis.fetch = async () => {
  upstreamCalls++
  if (upstreamCalls === 1) return Response.json({ provinces: [] })
  return Response.json({ provinces: [{ code: '01', name: 'Thành phố Hà Nội' }] })
}
const first = await app.request('http://shop.test/api/address/provinces?effectiveDate=latest', {}, { DB: {} })
assert.equal(first.status, 502, 'an empty upstream province payload must be retryable, not cached as success')
const second = await app.request('http://shop.test/api/address/provinces?effectiveDate=latest', {}, { DB: {} })
assert.equal(second.status, 200)
assert.equal((await second.json()).data.length, 1)
assert.equal(upstreamCalls, 2, 'a later request must recover by calling the upstream again')

const moduleSource = fs.readFileSync('src/pages/storefront/script.ts', 'utf8')
  .replace(/^import\s+\{\s*storefrontDetailOrderScript\s*\}\s+from\s+'\.\/script-detail-order'\s*\r?\n/, '')
  .replace('export function storefrontInlineScript(): string {', 'function storefrontInlineScript() {')
const generated = vm.runInNewContext(moduleSource + '\nstorefrontInlineScript()', { storefrontDetailOrderScript: () => '' })
const functionSource = generated.slice(generated.indexOf('function toggleAddressDropdown'), generated.indexOf('function bindAddressSearchableDropdowns'))
let retries = 0
let renderedCount = -1
const menu = { classList: { contains: () => true, remove() {} } }
const context = vm.createContext({
  addressProvinceOptions: [], addressDropdownSearchState: {},
  getAddressDropdownIds: () => ({ menuId: 'menu', searchId: 'search', optionsId: 'options' }),
  document: { getElementById: id => id === 'menu' ? menu : id === 'search' ? { value: '', focus() {} } : { innerHTML: '' } },
  closeAllAddressDropdowns() {}, setTimeout: fn => fn(),
  async ensureAddressKitReady() { retries++; context.addressProvinceOptions = [{ code: '01', name: 'Hà Nội' }] },
  renderProvinceOptionsForScope() { renderedCount = context.addressProvinceOptions.length },
  renderCommuneOptionsForScope() {}, showToast() {},
})
vm.runInContext(functionSource, context)
await vm.runInContext("toggleAddressDropdown('order','province')", context)
assert.equal(retries, 1, 'opening an empty province dropdown must retry loading data')
assert.equal(renderedCount, 1, 'recovered provinces must render in the open dropdown')

console.log('address dropdown empty-response and retry recovery passed')
