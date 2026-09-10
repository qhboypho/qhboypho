import assert from 'node:assert/strict'
import { Miniflare, convertV4MiniflareOptions } from 'miniflare'
const runtime = new Miniflare(convertV4MiniflareOptions({
  modules: true, scriptPath: 'ops/maintenance/_worker.js', compatibilityDate: '2026-09-09',
  outboundService: () => { throw new Error('Maintenance must not call external services') }
}))
try {
  for (const method of ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']) {
    for (const path of ['/', '/api/orders', '/api/payments/payos/webhook', '/api/admin/orders/arrange-shipping']) {
      const response = await runtime.dispatchFetch(`http://maintenance.test${path}`, { method })
      assert.equal(response.status, 503)
      assert.equal(response.headers.get('Retry-After'), '300')
      assert.equal(response.headers.get('Cache-Control'), 'no-store')
      assert.equal(response.headers.get('X-QH-Maintenance'), 'release')
    }
  }
  console.log('Maintenance fails closed on storefront, checkout, callbacks and admin writes without DB/network bindings')
} finally { await runtime.dispose() }
