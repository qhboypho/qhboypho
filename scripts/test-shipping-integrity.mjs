import assert from 'node:assert/strict'
import { Hono } from 'hono'
import { registerOrderRoutes } from '../src/routes/orderRoutes.ts'
import {
  buildShippingIdempotencyKey,
  evaluateShippingPaymentEligibility,
  extractShippingTrackingCode,
  isTerminalReturnStatus,
  isValidOrderStatusTransition
} from '../src/lib/shippingStateHelpers.ts'

class FakeQuery {
  constructor(db, sql) {
    this.db = db
    this.sql = String(sql || '')
    this.bound = []
  }

  bind(...args) {
    this.bound = args
    return this
  }

  async first() {
    if (/FROM shipping_creation_attempts/i.test(this.sql)) {
      return this.db.attempts.get(Number(this.bound[0])) || null
    }
    if (/SELECT id, status/i.test(this.sql) && /FROM orders/i.test(this.sql)) {
      return this.db.orders.find((row) => Number(row.id) === Number(this.bound[0])) || null
    }
    if (/SELECT user_id, customer_phone FROM orders/i.test(this.sql)) {
      return this.db.orders.find((row) => Number(row.id) === Number(this.bound[0])) || null
    }
    return null
  }

  async all() {
    if (/FROM orders/i.test(this.sql) && /id IN/i.test(this.sql)) {
      const ids = this.bound.map(Number)
      return {
        results: this.db.orders
          .filter((row) => ids.includes(Number(row.id)))
          .map((row) => ({
            ...row,
            shipping_create_state: this.db.attempts.get(Number(row.id))?.state || null,
            shipping_create_attempt_id: this.db.attempts.get(Number(row.id))?.idempotency_key || null,
            shipping_create_last_error: this.db.attempts.get(Number(row.id))?.last_error || null
          }))
      }
    }
    return { results: [] }
  }

  async run() {
    if (/INSERT INTO shipping_creation_attempts/i.test(this.sql)) {
      const [orderId, carrier, idempotencyKey] = this.bound
      if (this.db.attempts.has(Number(orderId))) return { meta: { changes: 0 } }
      this.db.attempts.set(Number(orderId), {
        order_id: Number(orderId),
        carrier,
        idempotency_key: idempotencyKey,
        state: 'creating',
        tracking_code: null,
        last_error: null
      })
      return { meta: { changes: 1 } }
    }
    if (/UPDATE shipping_creation_attempts/i.test(this.sql)) {
      const id = Number(this.bound.find((value) => this.db.attempts.has(Number(value))))
      const attempt = this.db.attempts.get(id)
      if (!attempt) return { meta: { changes: 0 } }
      const state = /state\s*=\s*'created'/i.test(this.sql)
        ? 'created'
        : /state\s*=\s*'needs_reconciliation'/i.test(this.sql)
          ? 'needs_reconciliation'
          : /state\s*=\s*'failed'/i.test(this.sql)
            ? 'failed'
            : /state\s*=\s*'creating'/i.test(this.sql)
              ? 'creating'
              : attempt.state
      attempt.state = state
      if (/tracking_code\s*=\s*\?/i.test(this.sql)) {
        const trackingIndex = this.bound.findIndex((value) => typeof value === 'string' && value.startsWith('TRK-'))
        if (trackingIndex >= 0) attempt.tracking_code = this.bound[trackingIndex]
      }
      return { meta: { changes: 1 } }
    }
    if (/UPDATE orders/i.test(this.sql)) {
      const id = Number(this.bound.find((value) => this.db.orders.some((row) => Number(row.id) === Number(value))))
      const row = this.db.orders.find((item) => Number(item.id) === id)
      if (!row) return { meta: { changes: 0 } }
      if (this.db.failOrderUpdates) throw new Error('simulated order persistence failure')
      const tracking = this.bound.find((value) => typeof value === 'string' && value.startsWith('TRK-'))
      if (tracking && !String(row.shipping_tracking_code || '').trim()) row.shipping_tracking_code = tracking
      if (/shipping_arranged\s*=\s*1/i.test(this.sql)) row.shipping_arranged = 1
      if (/shipping_carrier\s*=\s*\?/i.test(this.sql)) {
        const carrier = this.bound.find((value) => ['GHTK', 'GHN', 'SPX'].includes(String(value)))
        if (carrier && !String(row.shipping_carrier || '').trim()) row.shipping_carrier = carrier
      }
      return { meta: { changes: 1 } }
    }
    return { meta: { changes: 1 } }
  }
}

class FakeDB {
  constructor(orders = []) {
    this.orders = orders
    this.attempts = new Map()
    this.failOrderUpdates = false
    this.batchCalls = 0
  }

  prepare(sql) {
    return new FakeQuery(this, sql)
  }

  async batch(queries) {
    this.batchCalls += 1
    if (this.failOrderUpdates) throw new Error('simulated batch persistence failure')
    const results = []
    for (const query of queries) results.push(await query.run())
    return results
  }
}

function baseOrder(overrides = {}) {
  return {
    id: 1,
    order_code: 'QH100001',
    customer_name: 'Test customer',
    customer_phone: '0900000000',
    customer_address: '1 Nguyen Hue, Quan 1, Ho Chi Minh',
    product_name: 'Ao thun',
    quantity: 1,
    total_price: 100000,
    note: '',
    payment_method: 'COD',
    payment_status: 'unpaid',
    status: 'pending',
    return_status: null,
    shipping_arranged: 0,
    shipping_carrier: '',
    shipping_tracking_code: '',
    shipping_label: '',
    shipping_fee: 0,
    shipping_delivery_confirmed_at: null,
    ...overrides
  }
}

function makeApp(db, adapter) {
  const app = new Hono()
  registerOrderRoutes(app, {
    async initDB() {},
    buildInternalTestOrderWhereSql: () => '1=0',
    resolveSelectedColorImage: () => '',
    ghtkCancelShipment: async () => ({ ok: true }),
    ghtkCreateShipment: adapter,
    ghtkFetchLabelPdf: async () => new Uint8Array(),
    spxCreateShipment: async () => ({ ok: false, message: 'SPX_CREATE_ORDER_NOT_IMPLEMENTED' }),
    spxFetchLabelPdf: async () => new Uint8Array(),
    ghnCreateShipment: async () => ({ ok: false, message: 'GHN_CREATE_ORDER_FAILED' }),
    ghnFetchLabelPdf: async () => new Uint8Array(),
    ghnFetchLabelDocument: async () => ({ bytes: new Uint8Array(), contentType: 'application/pdf' }),
    getAvailableShippingCarriers: async () => [
      { code: 'GHTK', label: 'GHTK' },
      { code: 'GHN', label: 'GHN' },
      { code: 'SPX', label: 'SPX' }
    ],
    mergePdfBytes: async () => new Uint8Array()
  })
  return app
}

function arrangeRequest(ids, carriers = {}) {
  return new Request('http://localhost/api/admin/orders/arrange-shipping', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ ids, carriers })
  })
}

assert.equal(evaluateShippingPaymentEligibility('COD', 'unpaid').allowed, true)
assert.equal(evaluateShippingPaymentEligibility('BANK_TRANSFER', 'unpaid').allowed, false)
assert.equal(evaluateShippingPaymentEligibility('BANK_TRANSFER', 'paid').allowed, true)
assert.equal(isTerminalReturnStatus('returned'), true)
assert.equal(isTerminalReturnStatus('delivery_failed'), true)
assert.equal(isTerminalReturnStatus(null), false)
assert.equal(isValidOrderStatusTransition('pending', 'confirmed'), true)
assert.equal(isValidOrderStatusTransition('shipping', 'pending'), false)
assert.equal(isValidOrderStatusTransition('shipping', 'done'), true)
assert.match(buildShippingIdempotencyKey(baseOrder(), 'GHTK'), /QH100001/)
assert.equal(extractShippingTrackingCode({ ok: true, data: { label: 'TRK-1' } }), 'TRK-1')
assert.equal(extractShippingTrackingCode({ ok: false, detail: { error: { ghtk_label: 'TRK-2' } } }), 'TRK-2')

{
  let calls = 0
  const db = new FakeDB([baseOrder()])
  const app = makeApp(db, async () => {
    calls += 1
    return { ok: true, data: { label: 'TRK-1', fee: 12000 } }
  })
  const response = await app.fetch(arrangeRequest([1, 1, 1]), { DB: db })
  const body = await response.json()
  assert.equal(calls, 1, 'duplicate ids must not create duplicate remote shipments')
  assert.equal(body.updated_count, 1)
  assert.equal(body.failed_count, 0)
  assert.equal(db.batchCalls, 1, 'remote success must persist order and attempt atomically')
}

{
  let calls = 0
  const db = new FakeDB([baseOrder({ payment_method: 'BANK_TRANSFER', payment_status: 'unpaid' })])
  const app = makeApp(db, async () => {
    calls += 1
    return { ok: true, data: { label: 'TRK-BANK' } }
  })
  const response = await app.fetch(arrangeRequest([1]), { DB: db })
  const body = await response.json()
  assert.equal(calls, 0, 'unpaid bank transfer must never call the carrier')
  assert.equal(body.failed[0].error, 'SHIPPING_PAYMENT_REQUIRED')
}

{
  let calls = 0
  const db = new FakeDB([baseOrder()])
  db.attempts.set(1, {
    order_id: 1,
    carrier: 'GHTK',
    idempotency_key: 'QH-SHIP-1',
    state: 'creating',
    tracking_code: null,
    last_error: null
  })
  const app = makeApp(db, async () => {
    calls += 1
    return { ok: true, data: { label: 'TRK-RACE' } }
  })
  const response = await app.fetch(arrangeRequest([1]), { DB: db })
  const body = await response.json()
  assert.equal(calls, 0, 'a durable creating attempt must block blind retry')
  assert.equal(body.failed[0].error, 'SHIPPING_RECONCILIATION_REQUIRED')
}

{
  let calls = 0
  const db = new FakeDB([baseOrder({ shipping_carrier: 'GHN', shipping_tracking_code: 'GHN-1', shipping_arranged: 1 })])
  const app = makeApp(db, async () => {
    calls += 1
    return { ok: true, data: { label: 'TRK-WRONG' } }
  })
  const response = await app.fetch(arrangeRequest([1], { 1: 'GHTK' }), { DB: db })
  const body = await response.json()
  assert.equal(calls, 0, 'existing tracking must be reused and its carrier cannot be overwritten')
  assert.equal(body.failed[0].error, 'ORDER_ALREADY_HAS_DIFFERENT_CARRIER_TRACKING')
  assert.equal(db.orders[0].shipping_carrier, 'GHN')
}

{
  const db = new FakeDB([baseOrder({ status: 'confirmed', shipping_carrier: 'GHN', shipping_tracking_code: 'GHN-2', shipping_arranged: 1 })])
  const app = makeApp(db, async () => ({ ok: true, data: { label: 'TRK-WRONG' } }))
  const response = await app.fetch(new Request('http://localhost/api/admin/orders/1/status', {
    method: 'PATCH',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ status: 'cancelled' })
  }), { DB: db })
  const body = await response.json()
  assert.equal(response.status, 409)
  assert.equal(body.error, 'SHIPPING_CANCEL_REQUIRES_CARRIER_RECONCILIATION')
}

console.log('shipping integrity tests passed')
