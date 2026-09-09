import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import vm from 'node:vm'

const scriptSource = await readFile(new URL('../src/pages/storefront/script.ts', import.meta.url), 'utf8')
const detailSource = await readFile(new URL('../src/pages/storefront/script-detail-order.ts', import.meta.url), 'utf8')

function createStorage() {
  const values = new Map()
  return {
    getItem(key) { return values.has(String(key)) ? values.get(String(key)) : null },
    setItem(key, value) { values.set(String(key), String(value)) },
    removeItem(key) { values.delete(String(key)) },
    clear() { values.clear() },
  }
}

class FakeClassList {
  #items = new Set()
  add(...items) { items.filter(Boolean).forEach((item) => this.#items.add(item)) }
  remove(...items) { items.filter(Boolean).forEach((item) => this.#items.delete(item)) }
  contains(item) { return this.#items.has(item) }
  toggle(item, force) {
    const next = force === undefined ? !this.#items.has(item) : !!force
    if (next) this.#items.add(item)
    else this.#items.delete(item)
    return next
  }
}

class FakeElement {
  constructor(id = '') {
    this.id = id
    this.classList = new FakeClassList()
    if (id.toLowerCase().includes('overlay')) this.classList.add('hidden')
    this.style = {}
    this.dataset = {}
    this.value = ''
    this.textContent = ''
    this.innerHTML = ''
    this.innerText = ''
    this.disabled = false
    this.checked = false
    this.hidden = false
    this.options = []
    this.parentElement = null
    this.children = []
    this.listeners = new Map()
    this.attributes = new Map()
  }
  addEventListener(type, fn) {
    const list = this.listeners.get(type) || []
    list.push(fn)
    this.listeners.set(type, list)
  }
  removeEventListener() {}
  dispatchEvent(event) {
    for (const fn of this.listeners.get(event?.type) || []) fn(event)
  }
  querySelector() { return null }
  querySelectorAll() { return [] }
  closest() { return null }
  appendChild(child) { this.children.push(child); child.parentElement = this; return child }
  remove() { this.removed = true }
  setAttribute(name, value) { this.attributes.set(name, String(value)); this[name] = String(value) }
  getAttribute(name) { return this.attributes.get(name) ?? null }
  removeAttribute(name) { this.attributes.delete(name); delete this[name] }
  scrollIntoView() {}
  focus() { this.focused = true }
  select() { this.selected = true }
  getBoundingClientRect() { return { left: 0, top: 0, right: 100, bottom: 40, width: 100, height: 40 } }
}

async function createRuntime() {
  const elements = new Map()
  const document = {
    body: new FakeElement('body'),
    documentElement: new FakeElement('html'),
    cookie: '',
    getElementById(id) {
      if (!elements.has(id)) elements.set(id, new FakeElement(id))
      return elements.get(id)
    },
    createElement() { return new FakeElement() },
    querySelector() { return null },
    querySelectorAll() { return [] },
    addEventListener() {},
    removeEventListener() {},
  }
  const localStorage = createStorage()
  const timers = []
  const window = {
    document,
    localStorage,
    sessionStorage: createStorage(),
    innerWidth: 1280,
    innerHeight: 800,
    scrollY: 0,
    pageYOffset: 0,
    visualViewport: { width: 1280 },
    crypto: {
      randomUUID: () => '00000000-0000-4000-8000-000000000001',
      getRandomValues(target) { target.fill(7); return target },
    },
    location: {
      href: 'https://shop.test/',
      origin: 'https://shop.test',
      pathname: '/',
      search: '',
      hash: '',
      assign(url) { this.href = String(url) },
      replace(url) { this.assign(url) },
    },
    history: { replaceState() {} },
    matchMedia: () => ({ matches: false }),
    getComputedStyle: () => ({ display: 'block', visibility: 'visible', opacity: '1', overflowY: 'visible' }),
    addEventListener() {},
    removeEventListener() {},
    requestAnimationFrame: (fn) => fn(0),
    scrollTo() {},
    open: () => null,
  }
  const context = {
    window,
    document,
    localStorage,
    sessionStorage: window.sessionStorage,
    Element: FakeElement,
    HTMLElement: FakeElement,
    URL,
    URLSearchParams,
    Intl,
    Date,
    Math,
    JSON,
    Number,
    String,
    Boolean,
    Array,
    Object,
    Set,
    Map,
    RegExp,
    Error,
    TypeError,
    console: { ...console, error() {}, warn() {} },
    navigator: { clipboard: { writeText: async () => {} } },
    performance: { now: () => 0 },
    setTimeout(fn, delay = 0) { const timer = { fn, delay, cleared: false }; timers.push(timer); return timer },
    clearTimeout(timer) { if (timer) timer.cleared = true },
    setInterval(fn, delay = 0) { const timer = { fn, delay, interval: true, cleared: false }; timers.push(timer); return timer },
    clearInterval(timer) { if (timer) timer.cleared = true },
    requestAnimationFrame: window.requestAnimationFrame,
    axios: { get: async () => ({ data: { data: [] } }), post: async () => ({ data: {} }) },
    fetch: async () => ({ ok: true, json: async () => ({}) }),
  }
  window.setTimeout = context.setTimeout
  window.clearTimeout = context.clearTimeout
  window.setInterval = context.setInterval
  window.clearInterval = context.clearInterval
  window.axios = context.axios
  context.globalThis = context

  const detailModule = detailSource
    .replace('export function storefrontDetailOrderScript(): string {', 'function storefrontDetailOrderScript() {')
  vm.runInNewContext(detailModule, context, { filename: 'script-detail-order.ts' })
  const storefrontModule = scriptSource
    .replace(/^import\s+\{\s*storefrontDetailOrderScript\s*\}\s+from\s+'\.\/script-detail-order'\s*\r?\n/, '')
    .replace('export function storefrontInlineScript(): string {', 'function storefrontInlineScript() {')
  vm.runInNewContext(storefrontModule, context, { filename: 'script.ts' })
  const generated = vm.runInNewContext('storefrontInlineScript()', context)
  const initIndex = generated.indexOf('// Init')
  const userAuthIndex = generated.indexOf('// ── USER AUTH & MENU', initIndex)
  if (initIndex < 0 || userAuthIndex < 0) throw new Error('storefront runtime markers missing')
  // Keep every declaration (including payment-return handlers defined after the init block)
  // while omitting eager network/UI initialization that belongs to the browser page.
  const postInitDeclarations = generated.slice(userAuthIndex).replace(/\nsyncLiveChatLauncherExpansion\(\)\nsyncLiveChatUnreadBadges\(\)\n/, '\n')
  const runtime = generated.slice(0, initIndex) + postInitDeclarations
  try {
    vm.runInNewContext(runtime, context, { filename: 'storefront-inline-runtime.js' })
  } catch (error) {
    throw error
  }
  return { context, window, document, elements, timers }
}

function setLocation(window, url) {
  const parsed = new URL(url)
  window.location.href = parsed.href
  window.location.origin = parsed.origin
  window.location.pathname = parsed.pathname
  window.location.search = parsed.search
  window.location.hash = parsed.hash
}

function pendingError(status, error = 'FORBIDDEN') {
  const err = new Error(error)
  err.response = { status, data: { error } }
  return err
}

const runtime = await createRuntime()
const { context, window, document, timers } = runtime

assert.equal(vm.runInNewContext('typeof persistOrderAccessToken', context), 'function', 'guest order tokens should have a runtime persistence helper')
assert.equal(vm.runInNewContext('typeof getOrderRequestConfig', context), 'function', 'order requests should have a token-aware request config helper')

const guestAccessToken = 'a'.repeat(64)
vm.runInNewContext(`persistOrderAccessToken('ORD-100', 100, ${JSON.stringify(guestAccessToken)})`, context)
const requestConfig = vm.runInNewContext("getOrderRequestConfig('ORD-100', 100)", context)
assert.equal(requestConfig.headers['X-Order-Access-Token'], guestAccessToken, 'order-scoped requests should send the persisted guest token')
assert.equal(window.localStorage.getItem('qhclothes_order_access_tokens_v1').includes(guestAccessToken), true, 'guest token should be persisted outside the URL')

const paymentCalls = []
context.axios.get = async (url, config) => {
  paymentCalls.push({ url, config })
  return { data: { data: { order_code: 'ORD-100', payment_status: 'pending' } } }
}
setLocation(window, 'https://shop.test/?pay=success&order=ORD-100&provider=payos')
await vm.runInNewContext('handlePaymentReturnFlow()', context)
assert.equal(paymentCalls.length, 1, 'payment return should query the backend before claiming success')
assert.equal(paymentCalls[0].config.headers['X-Order-Access-Token'], guestAccessToken, 'payment-return verification should use the guest token')
assert.equal(document.getElementById('orderPaidNoticeOverlay').classList.contains('hidden'), true, 'an unverified payment return must not show the paid notice')
vm.runInNewContext('stopOrderPaymentPolling()', context)

let concurrentResolve
let concurrentCalls = 0
context.axios.get = () => {
  concurrentCalls += 1
  return new Promise((resolve) => { concurrentResolve = resolve })
}
vm.runInNewContext("startOrderPaymentPolling('ORD-100', { maxAttempts: 2, intervalMs: 1 })", context)
const firstPoll = timers.find((timer) => !timer.cleared && timer.delay === 0)
assert.ok(firstPoll, 'polling should schedule a first bounded attempt')
firstPoll.fn()
firstPoll.fn()
assert.equal(concurrentCalls, 1, 'polling must never run overlapping backend requests')
concurrentResolve({ data: { data: { payment_status: 'pending' } } })
await Promise.resolve()
await Promise.resolve()

let openedUrl = ''
window.location.assign = (url) => { openedUrl = String(url); window.location.href = openedUrl }
window.open = () => null
context.axios.post = async () => ({ data: { data: { provider: 'PAYOS', checkoutUrl: 'https://pay.payos.vn/web/abc', qrCode: '000201010212...' } } })
await vm.runInNewContext("continueOrderPaymentFlow({ orderCode: 'ORD-100', orderId: 100, orderTotal: 90000, paymentMethod: 'BANK_TRANSFER', payTabRef: null })", context)
assert.equal(openedUrl, 'https://pay.payos.vn/web/abc', 'PayOS popup failure should fall back to its hosted checkout in the same tab')
assert.equal(document.getElementById('orderBankTransferOverlay').classList.contains('hidden'), true, 'PayOS EMV qrCode must not be rendered as a manual QR image')

context.axios.post = async () => { throw pendingError(500, 'PAYOS_CREATE_LINK_FAILED') }
openedUrl = ''
await vm.runInNewContext("continueOrderPaymentFlow({ orderCode: 'ORD-101', orderId: 101, orderTotal: 90000, paymentMethod: 'BANK_TRANSFER', payTabRef: null })", context)
assert.equal(document.getElementById('orderBankTransferOverlay').classList.contains('hidden'), true, 'arbitrary payment API errors must not open a QR fallback')
assert.equal(openedUrl, '', 'arbitrary payment API errors must not navigate to an untrusted fallback URL')

let postCount = 0
const orderRequests = []
context.axios.post = async (url, body, config) => {
  postCount += 1
  orderRequests.push({ url, body, config })
  if (postCount === 1) {
    return { data: { order_code: 'ORD-200', id: 200, total: 100000, order_access_token: 'b'.repeat(64) } }
  }
  throw pendingError(400, 'PRODUCT_OUT_OF_STOCK')
}
context.axios.get = async () => ({ data: { data: { is_blocked: false } } })
context.cart = undefined
// The generated script keeps cart in a lexical binding; set it through the same VM realm.
vm.runInNewContext(`
  cart = [
    { cartId: 'a', productId: 1, name: 'A', sku: 'A', thumbnail: '', color: '', size: '', qty: 1, price: 100000, checked: true },
    { cartId: 'b', productId: 2, name: 'B', sku: 'B', thumbnail: '', color: '', size: '', qty: 1, price: 100000, checked: true }
  ]
  cartSelectedPaymentMethod = 'COD'
  document.getElementById('ckName').value = 'Guest'
  document.getElementById('ckPhone').value = '0901234567'
  document.getElementById('ckAddress').value = '123 Test'
  document.getElementById('ckProvince').value = '01'
  document.getElementById('ckCommune').value = '001'
  document.getElementById('ckAddressDetail').value = '123 Test'
`, context)
// The test intentionally expects the production implementation to add this helper before exercising the UI flow.
assert.equal(vm.runInNewContext('typeof getCartOrderIdempotencyKey', context), 'function', 'cart retries should retain a per-item idempotency key')
await vm.runInNewContext('submitCartOrder()', context)
const remainingCart = vm.runInNewContext('cart', context)
assert.equal(remainingCart.length, 1, 'partial cart success should remove only the successful item')
assert.equal(remainingCart[0].cartId, 'b', 'partial cart success should retain the failed item')
assert.equal(postCount, 2, 'partial cart submit should attempt each selected item once')
assert.match(orderRequests[0].body.order_access_token, /^[0-9a-f]{64}$/, 'quick/cart order creation should pre-generate a server-valid guest token')
assert.equal(orderRequests[0].config.headers['X-Order-Access-Token'], orderRequests[0].body.order_access_token, 'creation should bind the guest token in the request header')
assert.equal(orderRequests[0].config.headers['X-Idempotency-Key'], orderRequests[0].body.idempotency_key, 'creation should bind the idempotency key in the request header')
assert.match(orderRequests[0].body.idempotency_key, /^[A-Za-z0-9._~:-]{16,128}$/, 'creation should send a server-valid idempotency key')
assert.match(orderRequests[1].body.order_access_token, /^[0-9a-f]{64}$/, 'failed cart item should keep its guest token for a retry')
const retryAddress = JSON.stringify(orderRequests[1].body.customer_address)
const retryToken = vm.runInNewContext(`getCartOrderAccessToken(cart[0], { name: 'Guest', phone: '0901234567', address: ${retryAddress} }, '', 'COD', '')`, context)
assert.equal(retryToken, orderRequests[1].body.order_access_token, 'failed cart retry should reuse the persisted guest token')
assert.equal(vm.runInNewContext(`getCartOrderIdempotencyKey(cart[0], { name: 'Guest', phone: '0901234567', address: ${retryAddress} }, '', 'COD', '')`, context), orderRequests[1].body.idempotency_key, 'failed cart retry should reuse the persisted idempotency key')

console.log('storefront checkout runtime tests passed')
