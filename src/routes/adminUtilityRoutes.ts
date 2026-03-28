import { getCookie } from 'hono/cookie'
import type { Hono } from 'hono'
import type { AppBindings } from '../types/app'

type AdminUtilityRouteDeps = {
  initDB: (db: D1Database) => Promise<void>
  getGhtkPickupConfig: (db: D1Database, env: any) => Promise<any>
  upsertAppSettings: (db: D1Database, entries: Array<{ key: string, value: string }>) => Promise<void>
  ghtkFetchPickupAddresses: (env: any) => Promise<any>
}

export function registerAdminUtilityRoutes(app: Hono<{ Bindings: AppBindings }>, deps: AdminUtilityRouteDeps) {
  app.get('/api/hero_banners', async (c) => {
    await deps.initDB(c.env.DB)
    const result = await c.env.DB.prepare("SELECT * FROM hero_banners WHERE is_active=1 ORDER BY display_order ASC").all()
    return c.json({ success: true, data: result.results || [] })
  })

  app.get('/api/admin/hero_banners', async (c) => {
    await deps.initDB(c.env.DB)
    const adminToken = getCookie(c, 'admin_token')
    if (adminToken !== 'super_secret_admin_token') return c.json({ success: false, error: 'Unauthorized' }, 401)
    const result = await c.env.DB.prepare("SELECT * FROM hero_banners ORDER BY display_order ASC, created_at DESC").all()
    return c.json({ success: true, data: result.results || [] })
  })

  app.post('/api/admin/hero_banners', async (c) => {
    await deps.initDB(c.env.DB)
    const adminToken = getCookie(c, 'admin_token')
    if (adminToken !== 'super_secret_admin_token') return c.json({ success: false, error: 'Unauthorized' }, 401)
    const body = await c.req.json()
    const { image_url, subtitle, title, price, product_id, display_order, is_active } = body
    const res = await c.env.DB.prepare("INSERT INTO hero_banners (image_url, subtitle, title, price, product_id, display_order, is_active) VALUES (?, ?, ?, ?, ?, ?, ?)").bind(
      image_url, subtitle || '', title || '', price || '', product_id ? parseInt(product_id) : null, display_order || 0, is_active !== undefined ? is_active : 1
    ).run()
    return c.json({ success: true, id: res.meta.last_row_id })
  })

  app.put('/api/admin/hero_banners/:id', async (c) => {
    await deps.initDB(c.env.DB)
    const adminToken = getCookie(c, 'admin_token')
    if (adminToken !== 'super_secret_admin_token') return c.json({ success: false, error: 'Unauthorized' }, 401)
    const id = c.req.param('id')
    const body = await c.req.json()
    const { image_url, subtitle, title, price, product_id, display_order, is_active } = body
    await c.env.DB.prepare("UPDATE hero_banners SET image_url=?, subtitle=?, title=?, price=?, product_id=?, display_order=?, is_active=? WHERE id=?").bind(
      image_url, subtitle || '', title || '', price || '', product_id ? parseInt(product_id) : null, display_order || 0, is_active !== undefined ? is_active : 1, id
    ).run()
    return c.json({ success: true })
  })

  app.delete('/api/admin/hero_banners/:id', async (c) => {
    await deps.initDB(c.env.DB)
    const adminToken = getCookie(c, 'admin_token')
    if (adminToken !== 'super_secret_admin_token') return c.json({ success: false, error: 'Unauthorized' }, 401)
    const id = c.req.param('id')
    await c.env.DB.prepare("DELETE FROM hero_banners WHERE id=?").bind(id).run()
    return c.json({ success: true })
  })

  app.get('/api/admin/ghtk/pickup-config', async (c) => {
    try {
      await deps.initDB(c.env.DB)
      const config = await deps.getGhtkPickupConfig(c.env.DB, c.env)
      return c.json({
        success: true,
        data: config,
        has_ghtk_keys: !!String(c.env.GHTK_TOKEN || '').trim() && !!String(c.env.GHTK_CLIENT_SOURCE || '').trim()
      })
    } catch (e: any) {
      return c.json({ success: false, error: e.message }, 500)
    }
  })

  app.put('/api/admin/ghtk/pickup-config', async (c) => {
    try {
      await deps.initDB(c.env.DB)
      const body: any = await c.req.json().catch(() => ({}))
      const sanitize = (value: any, max = 200) => String(value || '').trim().slice(0, max)
      const payload = {
        pickAddressId: sanitize(body.pick_address_id, 80),
        pickName: sanitize(body.pick_name, 120),
        pickAddress: sanitize(body.pick_address, 220),
        pickProvince: sanitize(body.pick_province, 80),
        pickDistrict: sanitize(body.pick_district, 80),
        pickWard: sanitize(body.pick_ward, 80),
        pickTel: sanitize(body.pick_tel, 30)
      }
      await deps.upsertAppSettings(c.env.DB, [
        { key: 'ghtk_pick_address_id', value: payload.pickAddressId },
        { key: 'ghtk_pick_name', value: payload.pickName },
        { key: 'ghtk_pick_address', value: payload.pickAddress },
        { key: 'ghtk_pick_province', value: payload.pickProvince },
        { key: 'ghtk_pick_district', value: payload.pickDistrict },
        { key: 'ghtk_pick_ward', value: payload.pickWard },
        { key: 'ghtk_pick_tel', value: payload.pickTel }
      ])
      return c.json({ success: true })
    } catch (e: any) {
      return c.json({ success: false, error: e.message }, 500)
    }
  })

  app.get('/api/admin/ghtk/pickup-addresses', async (c) => {
    try {
      await deps.initDB(c.env.DB)
      const sync = await deps.ghtkFetchPickupAddresses(c.env)
      if (!sync.ok) {
        return c.json({ success: false, error: sync.message, detail: sync.detail || null }, 400)
      }
      return c.json({ success: true, data: sync.data || [] })
    } catch (e: any) {
      return c.json({ success: false, error: e.message }, 500)
    }
  })
}
