import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { DatabaseSync } from 'node:sqlite'
import { Hono } from 'hono'
import { registerOrderRoutes } from '../src/routes/orderRoutes.ts'

class D1Statement {
  constructor(database, sql) {
    this.database = database
    this.sql = sql
    this.params = []
  }

  bind(...params) {
    this.params = params
    return this
  }

  async first() {
    return this.database.prepare(this.sql).get(...this.params) || null
  }

  async all() {
    return { results: this.database.prepare(this.sql).all(...this.params) }
  }

  async run() {
    const result = this.database.prepare(this.sql).run(...this.params)
    return {
      success: true,
      meta: {
        changes: Number(result.changes || 0),
        last_row_id: Number(result.lastInsertRowid || 0)
      }
    }
  }
}

class D1DatabaseMock {
  constructor() {
    this.database = new DatabaseSync(':memory:')
    this.database.exec(`
      PRAGMA foreign_keys = ON;
      CREATE TABLE app_settings (key TEXT PRIMARY KEY, value TEXT, updated_at TEXT);
      CREATE TABLE users (id INTEGER PRIMARY KEY, email TEXT UNIQUE NOT NULL, name TEXT, is_blocked INTEGER DEFAULT 0, blocked_reason TEXT, blocked_at TEXT);
      CREATE TABLE blocked_customers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        customer_phone TEXT,
        blocked_reason TEXT,
        blocked_by TEXT DEFAULT 'admin',
        blocked_at TEXT,
        unblocked_at TEXT,
        is_active INTEGER DEFAULT 1,
        UNIQUE(user_id, customer_phone)
      );
      CREATE TABLE daily_order_limit_overrides (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        customer_phone TEXT NOT NULL,
        override_date TEXT NOT NULL,
        expires_at TEXT NOT NULL,
        revoked_at TEXT,
        is_active INTEGER DEFAULT 1
      );
      CREATE TABLE auto_vouchers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        discount_amount REAL NOT NULL,
        scope TEXT NOT NULL DEFAULT 'all',
        product_ids TEXT NOT NULL DEFAULT '[]',
        show_badge INTEGER NOT NULL DEFAULT 1,
        is_active INTEGER NOT NULL DEFAULT 1,
        valid_from TEXT,
        valid_to TEXT,
        created_at TEXT,
        updated_at TEXT
      );
      CREATE TABLE admin_push_subscriptions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        admin_user_key TEXT NOT NULL DEFAULT 'admin',
        endpoint TEXT NOT NULL UNIQUE,
        p256dh TEXT NOT NULL,
        auth TEXT NOT NULL,
        user_agent TEXT DEFAULT '',
        is_active INTEGER NOT NULL DEFAULT 1,
        failed_count INTEGER NOT NULL DEFAULT 0,
        last_error TEXT DEFAULT '',
        created_at TEXT,
        updated_at TEXT
      );
      CREATE TABLE products (
        id INTEGER PRIMARY KEY,
        name TEXT NOT NULL,
        price REAL NOT NULL,
        original_price REAL,
        colors TEXT DEFAULT '[]',
        sizes TEXT DEFAULT '[]',
        stock INTEGER DEFAULT 0,
        is_active INTEGER DEFAULT 1,
        thumbnail TEXT DEFAULT '',
        updated_at TEXT
      );
      CREATE TABLE product_skus (
        id INTEGER PRIMARY KEY,
        product_id INTEGER NOT NULL,
        sku_code TEXT NOT NULL,
        color TEXT DEFAULT '',
        size TEXT DEFAULT '',
        image TEXT DEFAULT '',
        price REAL NOT NULL,
        original_price REAL,
        stock INTEGER DEFAULT 0,
        is_active INTEGER DEFAULT 1,
        created_at TEXT,
        updated_at TEXT
      );
      CREATE TABLE vouchers (
        id INTEGER PRIMARY KEY,
        code TEXT UNIQUE NOT NULL,
        discount_amount REAL NOT NULL,
        valid_from TEXT NOT NULL,
        valid_to TEXT NOT NULL,
        usage_limit INTEGER DEFAULT 0,
        used_count INTEGER DEFAULT 0,
        is_active INTEGER DEFAULT 1
      );
      CREATE TABLE orders (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        order_code TEXT UNIQUE NOT NULL,
        customer_name TEXT NOT NULL,
        customer_phone TEXT NOT NULL,
        customer_email TEXT,
        customer_address TEXT NOT NULL,
        customer_province_code TEXT,
        customer_commune_code TEXT,
        customer_address_effective_date TEXT,
        user_id INTEGER,
        client_ip_hash TEXT,
        customer_address_fingerprint TEXT,
        device_hash TEXT,
        product_id INTEGER NOT NULL,
        product_sku_id INTEGER,
        product_name TEXT NOT NULL,
        product_price REAL NOT NULL,
        color TEXT,
        selected_color_image TEXT DEFAULT '',
        size TEXT,
        quantity INTEGER DEFAULT 1,
        total_price REAL NOT NULL,
        voucher_code TEXT DEFAULT '',
        discount_amount REAL DEFAULT 0,
        note TEXT,
        payment_method TEXT DEFAULT 'COD',
        payment_status TEXT DEFAULT 'unpaid',
        status TEXT DEFAULT 'pending',
        return_status TEXT,
        cancelled_by TEXT,
        shipping_arranged INTEGER DEFAULT 0,
        shipping_tracking_code TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP
      );
    `)

    this.database.exec(readFileSync(new URL('../migrations/0031_order_integrity.sql', import.meta.url), 'utf8'))

    this.database.prepare(`
      INSERT INTO products (id, name, price, original_price, colors, sizes, stock, is_active, thumbnail)
      VALUES (1, 'Test shirt', 100000, 150000, '[{"name":"Blue","image":"/blue.jpg"}]', '["M"]', 5, 1, '/shirt.jpg')
    `).run()
    this.database.prepare(`
      INSERT INTO product_skus (id, product_id, sku_code, color, size, image, price, original_price, stock, is_active)
      VALUES (11, 1, 'SKU-1-BLUE-M', 'Blue', 'M', '/blue.jpg', 100000, 150000, 1, 1)
    `).run()
  }

  prepare(sql) {
    return new D1Statement(this.database, sql)
  }

  async batch(statements) {
    this.database.exec('BEGIN IMMEDIATE')
    try {
      const results = []
      for (const statement of statements) results.push(await statement.run())
      this.database.exec('COMMIT')
      return results
    } catch (error) {
      this.database.exec('ROLLBACK')
      throw error
    }
  }
}

function makeApp(db) {
  const app = new Hono()
  registerOrderRoutes(app, {
    async initDB() {},
    buildInternalTestOrderWhereSql: () => '1 = 0',
    resolveSelectedColorImage: (_colors, _color, fallback) => fallback || '',
    async ghtkCancelShipment() { return { ok: true } },
    async ghtkCreateShipment() { return { ok: true } },
    async ghtkFetchLabelPdf() { return new Uint8Array() },
    async spxCreateShipment() { return { ok: true } },
    async spxFetchLabelPdf() { return new Uint8Array() },
    async ghnCreateShipment() { return { ok: true } },
    async ghnFetchLabelPdf() { return new Uint8Array() },
    async ghnFetchLabelDocument() { return { bytes: new Uint8Array(), contentType: 'application/pdf' } },
    async getAvailableShippingCarriers() { return [] },
    async mergePdfBytes() { return new Uint8Array() }
  })
  return { app, env: { DB: db } }
}

let requestCounter = 0
async function postOrder(app, env, overrides = {}, headers = {}) {
  requestCounter += 1
  const body = {
    customer_name: 'Test customer',
    customer_phone: `090000${String(requestCounter).padStart(4, '0')}`,
    customer_address: `Address ${requestCounter}`,
    product_id: 1,
    product_sku_id: 11,
    color: 'Blue',
    size: 'M',
    quantity: 1,
    payment_method: 'COD',
    order_access_token: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
    ...overrides
  }
  return app.fetch(new Request('http://localhost/api/orders', {
    method: 'POST',
    headers: { 'content-type': 'application/json', ...headers },
    body: JSON.stringify(body)
  }), env, { waitUntil() {} })
}

{
  const db = new D1DatabaseMock()
  const { app, env } = makeApp(db)

  const invalidQuantity = await postOrder(app, env, { quantity: 0 })
  assert.equal(invalidQuantity.status, 400, 'quantity 0 must be rejected')
  assert.equal((await invalidQuantity.json()).error, 'INVALID_QUANTITY')

  const invalidSku = await postOrder(app, env, {
    product_sku_id: 999,
    color: 'Blue',
    size: 'M'
  })
  assert.equal(invalidSku.status, 400, 'unknown SKU must be rejected')
  assert.equal((await invalidSku.json()).error, 'INVALID_PRODUCT_VARIANT')
}

{
  const db = new D1DatabaseMock()
  const { app, env } = makeApp(db)
  const token = 'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb'
  const key = 'order-test-idempotency-0001'
  const stablePayload = { customer_phone: '0900001001', customer_address: 'Stable address', order_access_token: token }
  const first = await postOrder(app, env, stablePayload, { 'X-Idempotency-Key': key })
  assert.equal(first.status, 200)
  const firstBody = await first.json()
  assert.equal(firstBody.success, true)
  assert.equal(firstBody.order_access_token, token, 'initial response must return the client token')

  const duplicate = await postOrder(app, env, stablePayload, { 'X-Idempotency-Key': key })
  assert.equal(duplicate.status, 200, 'same idempotency request must be replayable')
  const duplicateBody = await duplicate.json()
  assert.equal(duplicateBody.duplicate, true)
  assert.equal(duplicateBody.id, firstBody.id)
  assert.equal(duplicateBody.order_code, firstBody.order_code)
  assert.equal(duplicateBody.total, firstBody.total)
  assert.equal(duplicateBody.order_access_token, token)

  const changedIdentity = await postOrder(app, env, {
    ...stablePayload,
    customer_phone: '0900001002',
    customer_address: 'A different address'
  }, { 'X-Idempotency-Key': key })
  assert.equal(changedIdentity.status, 409, 'same key and token with changed identity must not create another order')
  assert.equal((await changedIdentity.json()).error, 'IDEMPOTENCY_KEY_REUSE')

  const orderCount = db.database.prepare('SELECT COUNT(*) AS count FROM orders').get().count
  assert.equal(Number(orderCount), 1, 'idempotent retries must not create another order')
}

// The storefront currently sends the key in the JSON payload. Keep that
// compatibility path equivalent to the documented header contract.
{
  const db = new D1DatabaseMock()
  const { app, env } = makeApp(db)
  const token = 'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb'
  const key = 'body-idempotency-request-001'
  const first = await postOrder(app, env, {
    customer_phone: '0900002001',
    customer_address: 'Body key address',
    order_access_token: token,
    idempotency_key: key
  })
  assert.equal(first.status, 200)
  const firstBody = await first.json()
  const duplicate = await postOrder(app, env, {
    customer_phone: '0900002001',
    customer_address: 'Body key address',
    order_access_token: token,
    idempotency_key: key
  })
  assert.equal(duplicate.status, 200)
  assert.equal((await duplicate.json()).duplicate, true)
  assert.equal(Number(db.database.prepare('SELECT COUNT(*) AS count FROM orders').get().count), 1)
  assert.equal(Number(firstBody.id), Number(db.database.prepare('SELECT id FROM orders LIMIT 1').get().id))
}

{
  const db = new D1DatabaseMock()
  const { app, env } = makeApp(db)
  db.database.prepare(`
    INSERT INTO vouchers (id, code, discount_amount, valid_from, valid_to, usage_limit, used_count, is_active)
    VALUES (1, 'SAVE10', 10000, '2000-01-01T00:00:00.000Z', '2999-01-01T00:00:00.000Z', 1, 0, 1)
  `).run()
  const token = 'eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee'
  const first = await postOrder(app, env, {
    customer_phone: '0933333333',
    customer_address: 'Voucher address',
    order_access_token: token,
    voucher_code: 'save10'
  }, { 'X-Idempotency-Key': 'voucher-request-000001' })
  assert.equal(first.status, 200)
  assert.equal(Number(db.database.prepare('SELECT used_count FROM vouchers WHERE id = 1').get().used_count), 1)

  const replay = await postOrder(app, env, {
    customer_phone: '0933333333',
    customer_address: 'Voucher address',
    order_access_token: token,
    voucher_code: 'save10'
  }, { 'X-Idempotency-Key': 'voucher-request-000001' })
  assert.equal(replay.status, 200)
  assert.equal(Number(db.database.prepare('SELECT used_count FROM vouchers WHERE id = 1').get().used_count), 1, 'idempotent replay must not consume voucher twice')
}

{
  const db = new D1DatabaseMock()
  const { app, env } = makeApp(db)
  db.database.prepare(`
    INSERT INTO vouchers (id, code, discount_amount, valid_from, valid_to, usage_limit, used_count, is_active)
    VALUES (1, 'SAVE20', 20000, '2000-01-01T00:00:00.000Z', '2999-01-01T00:00:00.000Z', 5, 0, 1)
  `).run()
  db.database.prepare('UPDATE product_skus SET stock = 0 WHERE id = 11').run()
  const failed = await postOrder(app, env, {
    customer_phone: '0944444444',
    customer_address: 'Rollback address',
    order_access_token: 'ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff',
    voucher_code: 'SAVE20'
  }, { 'X-Idempotency-Key': 'voucher-rollback-request-0001' })
  assert.equal(failed.status, 409)
  assert.equal((await failed.json()).error, 'INSUFFICIENT_STOCK')
  assert.equal(Number(db.database.prepare('SELECT used_count FROM vouchers WHERE id = 1').get().used_count), 0, 'failed order must roll voucher usage back')
  assert.equal(Number(db.database.prepare('SELECT COUNT(*) AS count FROM orders').get().count), 0, 'failed order must not persist')
}

{
  const db = new D1DatabaseMock()
  const { app, env } = makeApp(db)
  const created = await postOrder(app, env, {
    customer_phone: '0955555555',
    customer_address: 'Cancel address',
    order_access_token: '9999999999999999999999999999999999999999999999999999999999999999'
  })
  assert.equal(created.status, 200)
  const orderId = Number((await created.json()).id)
  db.database.prepare("UPDATE orders SET status = 'cancelled' WHERE id = ?").run(orderId)
  assert.equal(Number(db.database.prepare('SELECT stock FROM product_skus WHERE id = 11').get().stock), 1, 'pre-shipment cancellation must release reserved stock')
  assert.equal(Number(db.database.prepare('SELECT inventory_released FROM orders WHERE id = ?').get(orderId).inventory_released), 1)
  db.database.prepare("UPDATE orders SET status = 'cancelled' WHERE id = ?").run(orderId)
  assert.equal(Number(db.database.prepare('SELECT stock FROM product_skus WHERE id = 11').get().stock), 1, 'releasing inventory must be idempotent')

  const shipped = await postOrder(app, env, {
    customer_phone: '0966666666',
    customer_address: 'Shipped cancel address',
    order_access_token: '1212121212121212121212121212121212121212121212121212121212121212'
  })
  assert.equal(shipped.status, 200)
  const shippedId = Number((await shipped.json()).id)
  db.database.prepare("UPDATE orders SET shipping_arranged = 1, shipping_tracking_code = 'TRACK-1', status = 'cancelled' WHERE id = ?").run(shippedId)
  assert.equal(Number(db.database.prepare('SELECT stock FROM product_skus WHERE id = 11').get().stock), 0, 'post-shipment cancellation must not auto-restock')
  assert.equal(Number(db.database.prepare('SELECT inventory_released FROM orders WHERE id = ?').get(shippedId).inventory_released), 0)
}

{
  const db = new D1DatabaseMock()
  const { app, env } = makeApp(db)
  const [first, second] = await Promise.all([
    postOrder(app, env, { customer_phone: '0911111111', customer_address: 'A', order_access_token: 'cccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc' }, { 'X-Idempotency-Key': 'stock-race-request-0001' }),
    postOrder(app, env, { customer_phone: '0922222222', customer_address: 'B', order_access_token: 'dddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddd' }, { 'X-Idempotency-Key': 'stock-race-request-0002' })
  ])
  const statuses = [first.status, second.status].sort()
  assert.deepEqual(statuses, [200, 409], 'only one concurrent order may reserve the last SKU')
  const remainingStock = db.database.prepare('SELECT stock FROM product_skus WHERE id = 11').get().stock
  assert.equal(Number(remainingStock), 0, 'successful order must atomically reserve SKU stock')
  const orderCount = db.database.prepare('SELECT COUNT(*) AS count FROM orders').get().count
  assert.equal(Number(orderCount), 1, 'failed stock reservation must not insert an order')
}

{
  const db = new D1DatabaseMock()
  const { app, env } = makeApp(db)
  db.database.prepare(`
    INSERT INTO vouchers (id, code, discount_amount, valid_from, valid_to, usage_limit, used_count, is_active)
    VALUES (1, 'RACE10', 10000, '2000-01-01T00:00:00.000Z', '2999-01-01T00:00:00.000Z', 1, 0, 1)
  `).run()
  db.database.prepare('UPDATE product_skus SET stock = 2 WHERE id = 11').run()
  const [first, second] = await Promise.all([
    postOrder(app, env, {
      customer_phone: '0977777771',
      customer_address: 'Voucher race A',
      order_access_token: 'abababababababababababababababababababababababababababababababab',
      voucher_code: 'RACE10'
    }, { 'X-Idempotency-Key': 'voucher-race-request-001' }),
    postOrder(app, env, {
      customer_phone: '0977777772',
      customer_address: 'Voucher race B',
      order_access_token: 'cdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcd',
      voucher_code: 'RACE10'
    }, { 'X-Idempotency-Key': 'voucher-race-request-002' })
  ])
  const statuses = [first.status, second.status].sort()
  assert.ok(statuses[0] === 200 && [400, 409].includes(statuses[1]), 'only one concurrent order may consume a limited voucher')
  const failedResponse = first.status !== 200 ? first : second
  assert.equal((await failedResponse.json()).error, 'VOUCHER_LIMIT')
  assert.equal(Number(db.database.prepare('SELECT used_count FROM vouchers WHERE id = 1').get().used_count), 1)
  assert.equal(Number(db.database.prepare('SELECT COUNT(*) AS count FROM orders').get().count), 1)
}

console.log('order creation database behavior tests passed')
