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
const functionStart = generated.indexOf('async function toggleAddressDropdown')
const functionSource = generated.slice(functionStart, generated.indexOf('function bindAddressSearchableDropdowns'))
assert.notEqual(functionStart, -1, 'province dropdown recovery must be asynchronous')
let retries = 0
let communeRetries = 0
let renderedCount = -1
let renderedCommuneCount = -1
let menuHidden = true
const menu = { classList: { contains: () => menuHidden, remove() { menuHidden = false } } }
const provinceSelect = { value: '01' }
const context = vm.createContext({
  addressProvinceOptions: [], addressCommuneOptionsByProvince: {}, addressDropdownSearchState: {},
  getAddressDropdownIds: () => ({ menuId: 'menu', searchId: 'search', optionsId: 'options' }),
  getAddressScopeElements: () => ({ provinceId: 'province' }),
  document: { getElementById: id => id === 'menu' ? menu : id === 'search' ? { value: '', focus() {} } : id === 'province' ? provinceSelect : { innerHTML: '' } },
  closeAllAddressDropdowns() {}, setTimeout: fn => fn(),
  async ensureAddressKitReady() { retries++; context.addressProvinceOptions = [{ code: '01', name: 'Hà Nội' }] },
  async fetchAddressCommunesByProvince(code) { communeRetries++; context.addressCommuneOptionsByProvince[code] = [{ code: '00001', name: 'Phường thử' }] },
  renderProvinceOptionsForScope() { renderedCount = context.addressProvinceOptions.length },
  renderCommuneOptionsForScope() { renderedCommuneCount = context.addressCommuneOptionsByProvince['01']?.length || 0 }, showToast() {},
})
vm.runInContext(functionSource, context)
await vm.runInContext("toggleAddressDropdown('order','province')", context)
assert.equal(retries, 1, 'opening an empty province dropdown must retry loading data')
assert.equal(renderedCount, 1, 'recovered provinces must render in the open dropdown')
menuHidden = true
await vm.runInContext("toggleAddressDropdown('order','commune')", context)
assert.equal(communeRetries, 1, 'opening an empty commune dropdown must retry loading data for the selected province')
assert.equal(renderedCommuneCount, 1, 'recovered communes must render in the open dropdown')

console.log('address dropdown empty-response and retry recovery passed')
