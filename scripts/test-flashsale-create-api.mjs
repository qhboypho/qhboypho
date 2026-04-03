import assert from 'node:assert/strict'
import { Hono } from 'hono'
import { registerFlashSaleRoutes } from '../src/routes/flashSaleRoutes.ts'

class FakeQuery {
  constructor(db, sql) {
    this.db = db
    this.sql = sql
    this.bound = []
  }
  bind(...args) {
    this.bound = args
    return this
  }
  async first() {
    if (/FROM flash_sales WHERE id = \?/i.test(this.sql)) {
      const id = Number(this.bound[0])
      return this.db.flashSales.find((row) => row.id === id) || null
    }
    return null
  }
  async all() {
    if (/FROM products WHERE id IN \(/i.test(this.sql)) {
      return {
        results: this.bound.map((id) => ({ id: Number(id) }))
      }
    }
    if (/FROM flash_sale_items/i.test(this.sql)) {
      return { results: this.db.flashSaleItems.filter((row) => row.flash_sale_id === Number(this.bound[0])) }
    }
    return { results: [] }
  }
  async run() {
    if (/INSERT INTO flash_sales/i.test(this.sql)) {
      const id = this.db.nextFlashSaleId++
      this.db.flashSales.push({
        id,
        name: this.bound[0],
        start_at: this.bound[1],
        end_at: this.bound[2],
        is_active: this.bound[3],
        created_at: '2026-04-03T00:00:00Z',
        updated_at: '2026-04-03T00:00:00Z'
      })
      return { success: true, meta: { last_row_id: id } }
    }

    if (/INSERT INTO flash_sale_items/i.test(this.sql)) {
      const id = this.db.nextFlashSaleItemId++
      this.db.flashSaleItems.push({
        id,
        flash_sale_id: this.bound[0],
        product_id: this.bound[1],
        sale_price: this.bound[2],
        discount_percent: this.bound[3],
        purchase_limit: this.bound[4],
        is_enabled: this.bound[5],
        created_at: '2026-04-03T00:00:00Z',
        updated_at: '2026-04-03T00:00:00Z'
      })
      return { success: true, meta: { last_row_id: id } }
    }

    return { success: true, meta: { last_row_id: 1 } }
  }
}

class FakeDB {
  constructor() {
    this.flashSales = []
    this.flashSaleItems = []
    this.nextFlashSaleId = 1
    this.nextFlashSaleItemId = 1
    this.prepares = []
  }
  prepare(sql) {
    this.prepares.push(sql)
    return new FakeQuery(this, sql)
  }
}

const app = new Hono()
const initCalls = []
const db = new FakeDB()

registerFlashSaleRoutes(app, {
  async initDB() {
    initCalls.push('initDB')
  }
})

const res = await app.fetch(new Request('http://localhost/api/admin/flash-sales', {
  method: 'POST',
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify({
    name: 'Flash sale T1',
    start_at: '2026-04-03T10:00:00+07:00',
    end_at: '2026-04-03T12:00:00+07:00',
    items: [
      { product_id: 11, sale_price: 119000 },
      { product_id: 12, discount_percent: 20 }
    ]
  })
}), { DB: db })

assert.equal(res.status, 201, 'create API should return 201 for a valid campaign')
const body = await res.json()
assert.equal(body.success, true)
assert.equal(body.data.name, 'Flash sale T1')
assert.equal(body.data.item_count, 2)
assert.equal(body.data.product_count, 2)
assert.equal(db.flashSales.length, 1)
assert.equal(db.flashSaleItems.length, 2)
assert.equal(initCalls.length, 1)
assert.match(db.prepares.join('\n'), /INSERT INTO flash_sales/i)
assert.match(db.prepares.join('\n'), /INSERT INTO flash_sale_items/i)

console.log('flash sale create API red-green test ok')
