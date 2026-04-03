import type { Hono } from 'hono'
import type { AppBindings } from '../types/app'

type FlashSaleRouteDeps = {
  initDB: (db: D1Database) => Promise<void>
}

export function registerFlashSaleRoutes(app: Hono<{ Bindings: AppBindings }>, deps: FlashSaleRouteDeps) {
  app.get('/api/admin/flash-sales', async (c) => {
    try {
      await deps.initDB(c.env.DB)
      return c.json({ success: true, data: [], meta: { status: 'all' } })
    } catch (e: any) {
      return c.json({ success: false, error: e.message }, 500)
    }
  })

  app.post('/api/admin/flash-sales', async (c) => {
    try {
      await deps.initDB(c.env.DB)
      const body = await c.req.json().catch(() => ({}))
      return c.json({ success: true, data: body, message: 'FLASH_SALE_CREATE_PLACEHOLDER' })
    } catch (e: any) {
      return c.json({ success: false, error: e.message }, 500)
    }
  })

  app.get('/api/flash-sales', async (c) => {
    try {
      await deps.initDB(c.env.DB)
      return c.json({ success: true, data: [] })
    } catch (e: any) {
      return c.json({ success: false, error: e.message }, 500)
    }
  })
}
