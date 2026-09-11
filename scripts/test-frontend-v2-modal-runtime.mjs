import assert from 'node:assert/strict'
import fs from 'node:fs'
import vm from 'node:vm'

const source = fs.readFileSync('src/pages/storefront/script.ts', 'utf8')
const code = source.slice(source.indexOf('let storefrontModalActive ='), source.indexOf('// Auto clear error on input'))
const events = {}
const frames = []
const dialogs = []
const document = { activeElement: null, querySelectorAll: () => dialogs, addEventListener: (name, fn) => { events[name] = fn } }
class Element {
  constructor(id, parent = null, z = 0) {
    this.id = id; this.parent = parent; this.z = z; this.isConnected = true; this.attributes = {}; this.children = []; this.hidden = false
    if (parent) parent.children.push(this)
    this.classList = { contains: () => this.hidden }
  }
  closest(selector) {
    if (selector === '[inert]') return null
    if (selector === '.hidden') return this.hidden ? this : this.parent?.closest(selector)
    return dialogs.includes(this) ? this : this.parent?.closest(selector)
  }
  querySelectorAll() { return this.children }
  setAttribute(k, v) { this.attributes[k] = v }
  getAttribute(k) { return this.attributes[k] ?? null }
  getClientRects() { return this.hidden ? [] : [{}] }
  matches() { return this.disabled || this.getAttribute('tabindex') === '-1' }
  contains(e) { return this === e || this.children.some(c => c.contains(e)) }
  focus() { document.activeElement = this }
}
const context = vm.createContext({ document, HTMLElement: Element, window: {
  getComputedStyle: e => ({ display: e.hidden ? 'none' : 'block', visibility: 'visible', zIndex: String(e.z) }),
  requestAnimationFrame: fn => frames.push(fn), setTimeout: fn => fn(),
} })
const run = s => vm.runInContext(s, context)
const sync = () => { run('syncStorefrontModalAccessibility()'); while (frames.length) frames.shift()() }
const opener = new Element('buy')
const order = new Element('order', null, 1006)
const first = new Element('close', order)
const noteOpener = new Element('note', order)
const note = new Element('noteSheet', null, 10020)
const noteInput = new Element('noteInput', note)
order.hidden = true; note.hidden = true; dialogs.push(order, note); opener.focus()
run(code)
order.hidden = false; sync(); assert.equal(document.activeElement, first)
noteOpener.focus(); note.hidden = false; sync(); assert.equal(document.activeElement, noteInput)
note.hidden = true; sync(); assert.equal(document.activeElement, noteOpener, 'closing nested sheet restores its opener')
let prevented = false
events.keydown({ key: 'Tab', shiftKey: false, preventDefault() { prevented = true } })
assert.equal(prevented, true); assert.equal(document.activeElement, first)
events.keydown({ key: 'Tab', shiftKey: true, preventDefault() {} })
assert.equal(document.activeElement, noteOpener)
noteOpener.setAttribute('tabindex', '-1')
context.order = order
assert.equal(run('storefrontModalFocusables(order).length'), 1)
order.hidden = true; sync(); assert.equal(document.activeElement, opener)
console.log('frontend-v2 nested modal focus, Tab and restore runtime passed')
