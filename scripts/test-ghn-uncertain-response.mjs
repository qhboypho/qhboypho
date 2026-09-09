import assert from 'node:assert/strict'
import { MemoryD1 } from './helpers/sqlite-d1.mjs'
import { ghnCreateShipment, ghtkCreateShipment } from '../src/lib/shippingHelpers.ts'

const db = new MemoryD1()
await db.exec('CREATE TABLE app_settings (key TEXT PRIMARY KEY, value TEXT, updated_at TEXT)')
const originalFetch = globalThis.fetch
try {
  for (const scenario of [
    { name: 'server error', response: () => Response.json({ code: 500, message: 'internal error' }, { status: 500 }), uncertain: true },
    { name: 'malformed JSON', response: () => new Response('<html>gateway error</html>'), uncertain: true },
    { name: 'missing tracking', response: () => Response.json({ code: 200, data: {} }), uncertain: true },
    { name: 'explicit validation rejection', response: () => Response.json({ code: 400, message: 'invalid parcel' }, { status: 400 }), uncertain: false },
  ]) {
    let creates = 0
    globalThis.fetch = async (input) => {
      const url = String(input)
      if (url.includes('/address-kit/') && url.endsWith('/communes')) return Response.json({ communes: [{ code: '00001', name: 'Hàng Bạc', districtName: 'Hoàn Kiếm', provinceName: 'Hà Nội' }] })
      if (url.includes('/address-kit/')) return Response.json({ provinces: [{ code: '01', name: 'Hà Nội' }] })
      if (url.endsWith('/master-data/province')) return Response.json({ code: 200, data: [{ ProvinceID: 1, ProvinceName: 'Hà Nội' }] })
      if (url.endsWith('/master-data/district')) return Response.json({ code: 200, data: [{ DistrictID: 2, DistrictName: 'Hoàn Kiếm' }] })
      if (url.endsWith('/master-data/ward')) return Response.json({ code: 200, data: [{ WardCode: '3', WardName: 'Hàng Bạc' }] })
      if (url.endsWith('/v2/shipping-order/create')) { creates++; return scenario.response() }
      throw new Error('Unexpected mocked request: ' + url)
    }
    const result = await ghnCreateShipment({ GHN_TOKEN: 'synthetic-token', GHN_SHOP_ID: '123' }, db, {
      id: 1, order_code: 'LOCAL-GHN-1', customer_name: 'Local fixture', customer_phone: '0000000000',
      customer_address: '123 Test, Phường Hàng Bạc, Hà Nội', customer_commune_code: '00001',
      product_name: 'Fixture', quantity: 1, total_price: 100000, payment_method: 'COD',
    })
    assert.equal(creates, 1, scenario.name + ': must exercise creation: ' + JSON.stringify(result))
    assert.equal(result.ok, false)
    assert.equal(result.uncertain, scenario.uncertain, scenario.name)
  }
  for (const body of [{ success: true }, {}, { success: false, message: 'invalid parcel' }]) {
    globalThis.fetch = async () => Response.json(body)
    const result = await ghtkCreateShipment({
      GHTK_TOKEN: 'synthetic-token', GHTK_CLIENT_SOURCE: 'synthetic-source', GHTK_PICK_ADDRESS_ID: '1',
    }, db, { id: 2, order_code: 'LOCAL-GHTK-2', customer_address: '123 Test, Hàng Bạc, Hà Nội', total_price: 100000, quantity: 1, payment_method: 'COD' })
    assert.equal(result.ok, false)
    assert.equal(result.uncertain, body.success !== false, 'GHTK incomplete response must not permit blind retry')
  }
} finally { globalThis.fetch = originalFetch; db.close() }
console.log('GHN ambiguous response handling passed')
