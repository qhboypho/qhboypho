import assert from 'node:assert/strict'
import { Hono } from 'hono'
import { registerOrderRoutes } from '../src/routes/orderRoutes.ts'

const html = '<html><body>Local shipping label</body></html>'
const encoded = new TextEncoder().encode(html)
const backing = new SharedArrayBuffer(encoded.byteLength + 8)
new Uint8Array(backing).fill(88)
const view = new Uint8Array(backing, 4, encoded.byteLength)
view.set(encoded)
const app = new Hono()
registerOrderRoutes(app, {
  initDB: async () => {},
  ghnFetchLabelDocument: async () => ({ bytes: view, contentType: 'text/html' }),
})
const db = {
  prepare: () => ({ bind: () => ({ all: async () => ({ results: [{ id: 1, shipping_carrier: 'GHN', shipping_tracking_code: 'LOCAL-1' }] }) }) }),
}
const response = await app.request('/api/admin/orders/shipping/print-labels?ids=1', {}, { DB: db })
assert.equal(response.status, 200)
assert.equal(await response.text(), html, 'Return only the view bytes, not unrelated bytes in the backing buffer')
assert.equal(response.headers.get('cache-control'), 'no-store')
console.log('Shipping HTML label preserves byte boundaries for shared-buffer views')
