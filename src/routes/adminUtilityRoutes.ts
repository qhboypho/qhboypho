import type { Hono } from 'hono'
import type { AppBindings } from '../types/app'
import type { AppSettingEntry } from '../types/admin'
import type { GhtkPickupConfig, GhtkPickupAddressFetchResult } from '../lib/shippingHelpers'

type HeroBannerInput = {
  image_url?: unknown
  subtitle?: unknown
  title?: unknown
  price?: unknown
  product_id?: unknown
  display_order?: unknown
  is_active?: unknown
}

type PickupConfigInput = {
  pick_address_id?: unknown
  pick_name?: unknown
  pick_address?: unknown
  pick_province?: unknown
  pick_district?: unknown
  pick_ward?: unknown
  pick_tel?: unknown
}

type SocialSettingsInput = {
  tiktok_handle?: unknown
  shopee_handle?: unknown
  facebook_handle?: unknown
  threads_handle?: unknown
}

type AdminUtilityRouteDeps = {
  initDB: (db: D1Database) => Promise<void>
  getGhtkPickupConfig: (db: D1Database, env: AppBindings) => Promise<GhtkPickupConfig>
  upsertAppSettings: (db: D1Database, entries: AppSettingEntry[]) => Promise<void>
  ghtkFetchPickupAddresses: (env: AppBindings) => Promise<GhtkPickupAddressFetchResult>
}

const SOCIAL_SETTING_KEYS = [
  'social_tiktok_handle',
  'social_shopee_handle',
  'social_facebook_handle',
  'social_threads_handle',
] as const

async function readSocialHandles(db: D1Database) {
  const query = `SELECT key, value FROM app_settings WHERE key IN (${SOCIAL_SETTING_KEYS.map(() => '?').join(',')})`
  const result = await db.prepare(query).bind(...SOCIAL_SETTING_KEYS).all()
  const map = new Map<string, string>()
  for (const row of (result.results || []) as any[]) {
    map.set(String(row.key || ''), String(row.value || '').trim())
  }
  return {
    tiktok_handle: String(map.get('social_tiktok_handle') || '').trim(),
    shopee_handle: String(map.get('social_shopee_handle') || '').trim(),
    facebook_handle: String(map.get('social_facebook_handle') || '').trim(),
    threads_handle: String(map.get('social_threads_handle') || '').trim(),
  }
}

function buildSocialLinks(handles: Record<string, string>) {
  const makeLink = (handle: string, prefix: string, needsAt = false) => {
    const normalized = String(handle || '').trim().replace(/^@+/, '')
    if (!normalized) return ''
    return prefix + (needsAt ? '@' : '') + normalized
  }

  return {
    tiktok: {
      handle: String(handles.tiktok_handle || '').trim().replace(/^@+/, ''),
      url: makeLink(handles.tiktok_handle, 'https://www.tiktok.com/', true),
    },
    shopee: {
      handle: String(handles.shopee_handle || '').trim().replace(/^\/+|\/+$/g, ''),
      url: makeLink(String(handles.shopee_handle || '').trim().replace(/^\/+|\/+$/g, ''), 'https://shopee.vn/'),
    },
    facebook: {
      handle: String(handles.facebook_handle || '').trim().replace(/^@+/, ''),
      url: makeLink(handles.facebook_handle, 'https://www.facebook.com/'),
    },
    threads: {
      handle: String(handles.threads_handle || '').trim().replace(/^@+/, ''),
      url: makeLink(handles.threads_handle, 'https://www.threads.net/', true),
    },
  }
}

export function registerAdminUtilityRoutes(app: Hono<{ Bindings: AppBindings }>, deps: AdminUtilityRouteDeps) {
  app.get('/api/hero_banners', async (c) => {
    await deps.initDB(c.env.DB)
    const result = await c.env.DB.prepare("SELECT * FROM hero_banners WHERE is_active=1 ORDER BY display_order ASC").all()
    return c.json({ success: true, data: result.results || [] })
  })

  app.get('/api/admin/hero_banners', async (c) => {
    await deps.initDB(c.env.DB)
    const result = await c.env.DB.prepare("SELECT * FROM hero_banners ORDER BY display_order ASC, created_at DESC").all()
    return c.json({ success: true, data: result.results || [] })
  })

  app.post('/api/admin/hero_banners', async (c) => {
    await deps.initDB(c.env.DB)
    const body = await c.req.json<HeroBannerInput>()
    const { image_url, subtitle, title, price, product_id, display_order, is_active } = body
    const res = await c.env.DB.prepare("INSERT INTO hero_banners (image_url, subtitle, title, price, product_id, display_order, is_active) VALUES (?, ?, ?, ?, ?, ?, ?)").bind(
      String(image_url || '').trim(), String(subtitle || ''), String(title || ''), String(price || ''), product_id ? parseInt(String(product_id), 10) : null, Number(display_order || 0) || 0, is_active !== undefined ? Number(Boolean(is_active)) : 1
    ).run()
    return c.json({ success: true, id: res.meta.last_row_id })
  })

  app.put('/api/admin/hero_banners/:id', async (c) => {
    await deps.initDB(c.env.DB)
    const id = c.req.param('id')
    const body = await c.req.json<HeroBannerInput>()
    const { image_url, subtitle, title, price, product_id, display_order, is_active } = body
    await c.env.DB.prepare("UPDATE hero_banners SET image_url=?, subtitle=?, title=?, price=?, product_id=?, display_order=?, is_active=? WHERE id=?").bind(
      String(image_url || '').trim(), String(subtitle || ''), String(title || ''), String(price || ''), product_id ? parseInt(String(product_id), 10) : null, Number(display_order || 0) || 0, is_active !== undefined ? Number(Boolean(is_active)) : 1, id
    ).run()
    return c.json({ success: true })
  })

  app.delete('/api/admin/hero_banners/:id', async (c) => {
    await deps.initDB(c.env.DB)
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
      const body: PickupConfigInput = await c.req.json<PickupConfigInput>().catch(() => ({} as PickupConfigInput))
      const sanitize = (value: unknown, max = 200) => String(value || '').trim().slice(0, max)
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

  app.get('/api/admin/settings/social', async (c) => {
    try {
      await deps.initDB(c.env.DB)
      const handles = await readSocialHandles(c.env.DB)
      return c.json({ success: true, data: handles })
    } catch (e: any) {
      return c.json({ success: false, error: e.message }, 500)
    }
  })

  app.put('/api/admin/settings/social', async (c) => {
    try {
      await deps.initDB(c.env.DB)
      const body: SocialSettingsInput = await c.req.json<SocialSettingsInput>().catch(() => ({} as SocialSettingsInput))
      const sanitize = (value: unknown, max = 80) => String(value || '').trim().replace(/^@+/, '').slice(0, max)
      const payload = {
        tiktok: sanitize(body.tiktok_handle, 80),
        shopee: sanitize(body.shopee_handle, 120).replace(/^\/+|\/+$/g, ''),
        facebook: sanitize(body.facebook_handle, 120),
        threads: sanitize(body.threads_handle, 80),
      }
      await deps.upsertAppSettings(c.env.DB, [
        { key: 'social_tiktok_handle', value: payload.tiktok },
        { key: 'social_shopee_handle', value: payload.shopee },
        { key: 'social_facebook_handle', value: payload.facebook },
        { key: 'social_threads_handle', value: payload.threads },
      ])
      return c.json({ success: true, data: payload })
    } catch (e: any) {
      return c.json({ success: false, error: e.message }, 500)
    }
  })

  app.get('/api/public/social-links', async (c) => {
    try {
      await deps.initDB(c.env.DB)
      const handles = await readSocialHandles(c.env.DB)
      return c.json({ success: true, data: buildSocialLinks(handles) })
    } catch (e: any) {
      return c.json({ success: false, error: e.message }, 500)
    }
  })
}
