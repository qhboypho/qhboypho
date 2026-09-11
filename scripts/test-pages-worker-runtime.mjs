import assert from 'node:assert/strict'
import { Miniflare, convertV4MiniflareOptions } from 'miniflare'

// Uses the deployable bundle, no .dev.vars, no remote bindings or credentials.
const runtime = new Miniflare(convertV4MiniflareOptions({
  modules: true,
  scriptPath: 'dist/_worker.js',
  compatibilityDate: '2026-02-21',
  compatibilityFlags: ['nodejs_compat'],
  d1Databases: { DB: 'isolated-release-smoke' },
  outboundService: () => { throw new Error('Unexpected external request in release smoke') },
}))
try {
  for (const path of ['/', '/?search=Ao+premium&utm_source=test', '/hottrendnu?search=vay', '/admin/login']) {
    const response = await runtime.dispatchFetch(`http://release.local${path}`)
    assert.equal(response.status, 200, path)
    assert.match(response.headers.get('content-type'), /text\/html/)
    assert.ok((await response.text()).length > 100)
  }
  const orders = await runtime.dispatchFetch('http://release.local/api/admin/orders')
  assert.equal(orders.status, 401, 'Admin data must remain protected')
  console.log('Deployable Pages bundle starts in workerd; storefront/login render and admin authentication holds')
} finally {
  await runtime.dispose()
}
