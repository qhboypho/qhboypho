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
  ghtk_token?: unknown
  ghtk_client_source?: unknown
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

type ImageSettingsInput = {
  home_trending_banner_image?: unknown
  home_trending_banner_subtitle?: unknown
  home_trending_banner_title?: unknown
}

const ALLOWED_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif'])
const MAX_R2_IMAGE_BYTES = 3 * 1024 * 1024

function normalizeAssetFolder(value: unknown): string {
  const folder = String(value || 'products').trim().toLowerCase()
  if (folder === 'product-colors') return 'product-colors'
  if (folder === 'product-gallery') return 'product-gallery'
  if (folder === 'reviews') return 'reviews'
  if (folder === 'settings') return 'settings'
  return 'products'
}

function extensionFromMime(type: string): string {
  if (type === 'image/png') return 'png'
  if (type === 'image/webp') return 'webp'
  if (type === 'image/gif') return 'gif'
  return 'jpg'
}

function buildPublicAssetUrl(c: any, key: string): string {
  const base = String(c.env.PRODUCT_IMAGES_PUBLIC_BASE_URL || '').trim().replace(/\/+$/, '')
  if (base) return `${base}/${key}`
  return `/media/${key}`
}

type AdminUtilityRouteDeps = {
  initDB: (db: D1Database) => Promise<void>
  getGhtkPickupConfig: (db: D1Database, env: AppBindings) => Promise<GhtkPickupConfig>
  upsertAppSettings: (db: D1Database, entries: AppSettingEntry[]) => Promise<void>
  ghtkFetchPickupAddresses: (env: AppBindings, db: D1Database) => Promise<GhtkPickupAddressFetchResult>
}

const SOCIAL_SETTING_KEYS = [
  'social_tiktok_handle',
  'social_shopee_handle',
  'social_facebook_handle',
  'social_threads_handle',
] as const

const IMAGE_SETTING_KEYS = [
  'home_trending_banner_image',
  'home_trending_banner_subtitle',
  'home_trending_banner_title',
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

async function readImageSettings(db: D1Database) {
  const query = `SELECT key, value FROM app_settings WHERE key IN (${IMAGE_SETTING_KEYS.map(() => '?').join(',')})`
  const result = await db.prepare(query).bind(...IMAGE_SETTING_KEYS).all()
  const map = new Map<string, string>()
  for (const row of (result.results || []) as any[]) {
    map.set(String(row.key || ''), String(row.value || '').trim())
  }
  return {
    home_trending_banner_image: String(map.get('home_trending_banner_image') || '').trim(),
    home_trending_banner_subtitle: String(map.get('home_trending_banner_subtitle') || '').trim(),
    home_trending_banner_title: String(map.get('home_trending_banner_title') || '').trim(),
  }
}

export function registerAdminUtilityRoutes(app: Hono<{ Bindings: AppBindings }>, deps: AdminUtilityRouteDeps) {
  app.get('/media/*', async (c) => {
    const bucket = c.env.PRODUCT_IMAGES
    if (!bucket) return c.notFound()
    const key = decodeURIComponent(c.req.path.replace(/^\/media\//, '')).replace(/^\/+/, '')
    if (!key || key.includes('..')) return c.notFound()
    const object = await bucket.get(key)
    if (!object) return c.notFound()
    const headers = new Headers()
    object.writeHttpMetadata(headers)
    headers.set('etag', object.httpEtag)
    headers.set('cache-control', 'public, max-age=31536000, immutable')
    return new Response(object.body, { headers })
  })

  app.post('/api/admin/assets/images', async (c) => {
    const bucket = c.env.PRODUCT_IMAGES
    if (!bucket) return c.json({ success: false, error: 'R2_NOT_CONFIGURED' }, 500)

    const form = await c.req.raw.formData()
    const file = form.get('file')
    if (!(file instanceof File)) return c.json({ success: false, error: 'MISSING_FILE' }, 400)

    const contentType = String(file.type || '').toLowerCase()
    if (!ALLOWED_IMAGE_TYPES.has(contentType)) {
      return c.json({ success: false, error: 'INVALID_IMAGE_TYPE' }, 400)
    }
    if (file.size <= 0 || file.size > MAX_R2_IMAGE_BYTES) {
      return c.json({ success: false, error: 'IMAGE_TOO_LARGE' }, 400)
    }

    const folder = normalizeAssetFolder(form.get('folder'))
    const ext = extensionFromMime(contentType)
    const key = `${folder}/${new Date().toISOString().slice(0, 10)}/${crypto.randomUUID()}.${ext}`
    await bucket.put(key, file.stream(), {
      httpMetadata: {
        contentType,
        cacheControl: 'public, max-age=31536000, immutable',
      },
    })
    return c.json({ success: true, key, url: buildPublicAssetUrl(c, key) })
  })

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
      const hasToken = !!String(c.env.GHTK_TOKEN || config.token || '').trim()
      const hasClientSource = !!String(c.env.GHTK_CLIENT_SOURCE || config.clientSource || '').trim()
      return c.json({
        success: true,
        data: config,
        has_ghtk_keys: hasToken && hasClientSource
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
        token: sanitize(body.ghtk_token, 500),
        clientSource: sanitize(body.ghtk_client_source, 120),
        pickAddressId: sanitize(body.pick_address_id, 80),
        pickName: sanitize(body.pick_name, 120),
        pickAddress: sanitize(body.pick_address, 220),
        pickProvince: sanitize(body.pick_province, 80),
        pickDistrict: sanitize(body.pick_district, 80),
        pickWard: sanitize(body.pick_ward, 80),
        pickTel: sanitize(body.pick_tel, 30)
      }
      await deps.upsertAppSettings(c.env.DB, [
        { key: 'ghtk_token', value: payload.token },
        { key: 'ghtk_client_source', value: payload.clientSource },
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
      const sync = await deps.ghtkFetchPickupAddresses(c.env, c.env.DB)
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

  app.get('/api/admin/settings/images', async (c) => {
    try {
      await deps.initDB(c.env.DB)
      const settings = await readImageSettings(c.env.DB)
      return c.json({ success: true, data: settings })
    } catch (e: any) {
      return c.json({ success: false, error: e.message }, 500)
    }
  })

  app.put('/api/admin/settings/images', async (c) => {
    try {
      await deps.initDB(c.env.DB)
      const body: ImageSettingsInput = await c.req.json<ImageSettingsInput>().catch(() => ({} as ImageSettingsInput))
      const sanitizeUrl = (value: unknown, max = 1000) => String(value || '').trim().slice(0, max)
      const payload = {
        home_trending_banner_image: sanitizeUrl(body.home_trending_banner_image),
        home_trending_banner_subtitle: sanitizeUrl(body.home_trending_banner_subtitle, 120),
        home_trending_banner_title: sanitizeUrl(body.home_trending_banner_title, 160),
      }
      await deps.upsertAppSettings(c.env.DB, [
        { key: 'home_trending_banner_image', value: payload.home_trending_banner_image },
        { key: 'home_trending_banner_subtitle', value: payload.home_trending_banner_subtitle },
        { key: 'home_trending_banner_title', value: payload.home_trending_banner_title },
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

  app.get('/api/public/image-settings', async (c) => {
    try {
      await deps.initDB(c.env.DB)
      const settings = await readImageSettings(c.env.DB)
      return c.json({ success: true, data: settings })
    } catch (e: any) {
      return c.json({ success: false, error: e.message }, 500)
    }
  })
}
