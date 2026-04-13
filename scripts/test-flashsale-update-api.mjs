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
    if (/FROM product_skus WHERE id IN \(/i.test(this.sql)) {
      return {
        results: this.db.productSkus.filter((row) => this.bound.map(Number).includes(Number(row.id)) && Number(row.is_active) === 1)
      }
    }
    if (/FROM flash_sale_items fsi/i.test(this.sql) || /FROM flash_sale_items\s+WHERE flash_sale_id = \?/i.test(this.sql)) {
      const id = Number(this.bound[0])
      return {
        results: this.db.flashSaleItems
          .filter((row) => row.flash_sale_id === id)
          .map((row) => ({
            ...row,
            product_name: `Product ${row.product_id}`,
            product_thumbnail: '',
            product_price: 199000,
            product_original_price: 199000
          }))
      }
    }
    return { results: [] }
  }
  async run() {
    if (/UPDATE flash_sales/i.test(this.sql)) {
      const [name, startAt, endAt, id] = this.bound
      const row = this.db.flashSales.find((item) => item.id === Number(id))
      if (row) {
        row.name = name
        row.start_at = startAt
        row.end_at = endAt
        row.is_active = 1
        row.updated_at = '2026-04-05T00:00:00Z'
      }
      return { success: true }
    }
    if (/DELETE FROM flash_sale_items/i.test(this.sql)) {
      const id = Number(this.bound[0])
      this.db.flashSaleItems = this.db.flashSaleItems.filter((row) => row.flash_sale_id !== id)
      return { success: true }
    }
    if (/INSERT INTO flash_sale_items/i.test(this.sql)) {
      const id = this.db.nextFlashSaleItemId++
      this.db.flashSaleItems.push({
        id,
        flash_sale_id: Number(this.bound[0]),
        product_id: Number(this.bound[1]),
        product_sku_id: Number(this.bound[2]),
        sale_price: this.bound[3],
        discount_percent: this.bound[4],
        purchase_limit: this.bound[5],
        is_enabled: this.bound[6],
        created_at: '2026-04-05T00:00:00Z',
        updated_at: '2026-04-05T00:00:00Z'
      })
      return { success: true, meta: { last_row_id: id } }
    }
    return { success: true }
  }
}

class FakeDB {
  constructor() {
    this.flashSales = [{
      id: 1,
      name: 'Flash sale cũ',
      start_at: '2026-04-05T10:00',
      end_at: '2026-04-05T12:00',
      is_active: 1,
      created_at: '2026-04-05T00:00:00Z',
      updated_at: '2026-04-05T00:00:00Z'
    }]
    this.flashSaleItems = [{
      id: 1,
      flash_sale_id: 1,
      product_id: 11,
      product_sku_id: 111,
      sale_price: 119000,
      discount_percent: null,
      purchase_limit: 0,
      is_enabled: 1,
      created_at: '2026-04-05T00:00:00Z',
      updated_at: '2026-04-05T00:00:00Z'
    }]
    this.productSkus = [
      { id: 121, product_id: 12, is_active: 1 },
      { id: 131, product_id: 13, is_active: 1 }
    ]
    this.nextFlashSaleItemId = 2
  }
  prepare(sql) {
    return new FakeQuery(this, sql)
  }
}

const app = new Hono()
const db = new FakeDB()

registerFlashSaleRoutes(app, {
  async initDB() {}
})

const res = await app.fetch(new Request('http://localhost/api/admin/flash-sales/1', {
  method: 'PUT',
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify({
    name: 'Flash sale mới',
    start_at: '2026-04-05T11:00',
    end_at: '2026-04-05T13:00',
    items: [
      { product_id: 12, product_sku_id: 121, sale_price: 99000, is_enabled: 1 },
      { product_id: 13, product_sku_id: 131, discount_percent: 30, purchase_limit: 2, is_enabled: 1 }
    ]
  })
}), { DB: db })

assert.equal(res.status, 200)
const body = await res.json()
assert.equal(body.success, true)
assert.equal(body.data.name, 'Flash sale mới')
assert.equal(body.data.product_count, 2)
assert.equal(db.flashSales[0].name, 'Flash sale mới')
assert.equal(db.flashSaleItems.length, 2)
assert.deepEqual(db.flashSaleItems.map((row) => row.product_id), [12, 13])
assert.deepEqual(db.flashSaleItems.map((row) => row.product_sku_id), [121, 131])

console.log('flash sale update API ok')
