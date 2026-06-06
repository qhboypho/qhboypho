import type { Hono } from 'hono'
import type { AppBindings } from '../types/app'
import type { AppSettingEntry } from '../types/admin'
import type { GhtkPickupConfig, GhtkPickupAddressFetchResult, GhnConfig, ShippingCarrierDefinition, SpxConfig } from '../lib/shippingHelpers'
import {
  DEFAULT_QUICK_ORDER_RISK_NOTE_TEXT,
  readTextUiSettings,
  sanitizeTextUiSetting
} from '../lib/textUiSettings'

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
  spx_user_id?: unknown
  spx_secret_key?: unknown
  spx_account_id?: unknown
  ghn_token?: unknown
  ghn_shop_id?: unknown
  ghn_client_id?: unknown
  shipping_carrier_enabled_codes?: unknown
  shipping_carrier_custom_definitions?: unknown
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

type NotificationSettingsInput = {
  marquee_text?: unknown
  marquee_speed_seconds?: unknown
  notification_display_mode?: unknown
  static_notification_text?: unknown
}

type PaymentSettingsInput = {
  wallet_topup_enabled?: unknown
}

type TextUiSettingsInput = {
  quick_order_risk_note_text?: unknown
  hero_badge_text?: unknown
  hero_title_text?: unknown
  hero_typed_text?: unknown
  hero_description_text?: unknown
  hero_mobile_subtitle_text?: unknown
  hero_stat_1_value?: unknown
  hero_stat_1_label?: unknown
  hero_stat_2_value?: unknown
  hero_stat_2_label?: unknown
  hero_stat_3_value?: unknown
  hero_stat_3_label?: unknown
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
  getSpxConfig: (db: D1Database, env: AppBindings) => Promise<SpxConfig>
  getGhnConfig: (db: D1Database, env: AppBindings) => Promise<GhnConfig>
  getAllShippingCarriers: (db: D1Database) => Promise<ShippingCarrierDefinition[]>
  getAvailableShippingCarriers: (db: D1Database) => Promise<ShippingCarrierDefinition[]>
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

const NOTIFICATION_SETTING_KEYS = [
  'marquee_text',
  'marquee_speed_seconds',
  'notification_display_mode',
  'static_notification_text',
] as const

const PAYMENT_SETTING_KEYS = [
  'wallet_topup_enabled',
] as const

const DEFAULT_MARQUEE_TEXT = 'Mua hàng tại đây không qua sàn thương mại nên giá thành sản phẩm sẽ rẻ hơn rất nhiều và bảo hành hoàn trả trong vòng 7 ngày nếu sản phẩm bị lỗi nên quý khách yên tâm mua sắm nhé.Bảo hành đổi trả nhắn qua trang facebook : QH Boypho. Chúc quý khách có trải nghiệm mua sắm tốt tại QH Clothes'
const DEFAULT_MARQUEE_SPEED_SECONDS = 48
const DEFAULT_NOTIFICATION_DISPLAY_MODE = 'marquee'

function normalizeNotificationDisplayMode(value: unknown): 'marquee' | 'static' {
  return String(value || '').trim() === 'static' ? 'static' : 'marquee'
}

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

async function readNotificationSettings(db: D1Database) {
  const query = `SELECT key, value FROM app_settings WHERE key IN (${NOTIFICATION_SETTING_KEYS.map(() => '?').join(',')})`
  const result = await db.prepare(query).bind(...NOTIFICATION_SETTING_KEYS).all()
  const map = new Map<string, string>()
  for (const row of (result.results || []) as any[]) {
    map.set(String(row.key || ''), String(row.value || '').trim())
  }
  const speed = Number(map.get('marquee_speed_seconds') || DEFAULT_MARQUEE_SPEED_SECONDS)
  const displayMode = normalizeNotificationDisplayMode(map.get('notification_display_mode') || DEFAULT_NOTIFICATION_DISPLAY_MODE)
  return {
    marquee_text: String(map.get('marquee_text') || DEFAULT_MARQUEE_TEXT).trim(),
    marquee_speed_seconds: Number.isFinite(speed) ? Math.min(120, Math.max(8, Math.round(speed))) : DEFAULT_MARQUEE_SPEED_SECONDS,
    notification_display_mode: displayMode,
    static_notification_text: String(map.get('static_notification_text') || '').trim(),
  }
}

async function readPaymentSettings(db: D1Database) {
  const query = `SELECT key, value FROM app_settings WHERE key IN (${PAYMENT_SETTING_KEYS.map(() => '?').join(',')})`
  const result = await db.prepare(query).bind(...PAYMENT_SETTING_KEYS).all()
  const map = new Map<string, string>()
  for (const row of (result.results || []) as any[]) {
    map.set(String(row.key || ''), String(row.value || '').trim())
  }
  return {
    wallet_topup_enabled: String(map.get('wallet_topup_enabled') || '1') !== '0',
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
    if (object.httpMetadata?.contentType) {
      headers.set('content-type', object.httpMetadata.contentType)
    }
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
    await bucket.put(key, await file.arrayBuffer(), {
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

  app.get('/api/admin/shipping/carriers', async (c) => {
    try {
      await deps.initDB(c.env.DB)
      const carriers = await deps.getAvailableShippingCarriers(c.env.DB)
      return c.json({ success: true, data: carriers })
    } catch (e: any) {
      return c.json({ success: false, error: e.message }, 500)
    }
  })

  app.get('/api/admin/ghtk/pickup-config', async (c) => {
    try {
      await deps.initDB(c.env.DB)
      const config = await deps.getGhtkPickupConfig(c.env.DB, c.env)
      const spxConfig = await deps.getSpxConfig(c.env.DB, c.env)
      const ghnConfig = await deps.getGhnConfig(c.env.DB, c.env)
      const shippingCarriers = await deps.getAllShippingCarriers(c.env.DB)
      const hasToken = !!String(c.env.GHTK_TOKEN || config.token || '').trim()
      const hasClientSource = !!String(c.env.GHTK_CLIENT_SOURCE || config.clientSource || '').trim()
      const hasSpxKeys = !!spxConfig.userId && !!spxConfig.secretKey && !!spxConfig.accountId
      const hasGhnKeys = !!ghnConfig.token && !!ghnConfig.shopId
      return c.json({
        success: true,
        data: {
          ...config,
          spx: spxConfig,
          ghn: ghnConfig,
          shipping_carriers: shippingCarriers
        },
        has_ghtk_keys: hasToken && hasClientSource,
        has_spx_keys: hasSpxKeys,
        has_ghn_keys: hasGhnKeys
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
      const sanitizeCarrierCodes = (value: unknown) => {
        const raw = Array.isArray(value) ? value : []
        const codes = raw.map((item) => String(item || '').trim().toUpperCase().replace(/[^A-Z0-9_]+/g, '_').replace(/^_+|_+$/g, '').slice(0, 24)).filter(Boolean)
        return JSON.stringify(Array.from(new Set(codes)))
      }
      const sanitizeCustomCarriers = (value: unknown) => {
        const raw = Array.isArray(value) ? value : []
        const items = raw.map((item: any) => {
          const code = String(item?.code || '').trim().toUpperCase().replace(/[^A-Z0-9_]+/g, '_').replace(/^_+|_+$/g, '').slice(0, 24)
          const label = sanitize(item?.label || code, 80)
          if (!code || ['GHTK', 'SPX', 'GHN'].includes(code)) return null
          return { code, label: label || code, enabled: item?.enabled !== false }
        }).filter(Boolean)
        return JSON.stringify(items)
      }
      const payload = {
        token: sanitize(body.ghtk_token, 500),
        clientSource: sanitize(body.ghtk_client_source, 120),
        spxUserId: sanitize(body.spx_user_id, 120),
        spxSecretKey: sanitize(body.spx_secret_key, 500),
        spxAccountId: sanitize(body.spx_account_id, 120),
        ghnToken: sanitize(body.ghn_token, 500),
        ghnShopId: sanitize(body.ghn_shop_id, 120),
        ghnClientId: sanitize(body.ghn_client_id, 120),
        enabledCarrierCodes: sanitizeCarrierCodes(body.shipping_carrier_enabled_codes),
        customCarrierDefinitions: sanitizeCustomCarriers(body.shipping_carrier_custom_definitions),
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
        { key: 'spx_user_id', value: payload.spxUserId },
        { key: 'spx_secret_key', value: payload.spxSecretKey },
        { key: 'spx_account_id', value: payload.spxAccountId },
        { key: 'ghn_token', value: payload.ghnToken },
        { key: 'ghn_shop_id', value: payload.ghnShopId },
        { key: 'ghn_client_id', value: payload.ghnClientId },
        { key: 'shipping_carrier_enabled_codes', value: payload.enabledCarrierCodes },
        { key: 'shipping_carrier_custom_definitions', value: payload.customCarrierDefinitions },
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

  app.get('/api/admin/settings/notifications', async (c) => {
    try {
      await deps.initDB(c.env.DB)
      const settings = await readNotificationSettings(c.env.DB)
      return c.json({ success: true, data: settings })
    } catch (e: any) {
      return c.json({ success: false, error: e.message }, 500)
    }
  })

  app.put('/api/admin/settings/notifications', async (c) => {
    try {
      await deps.initDB(c.env.DB)
      const body: NotificationSettingsInput = await c.req.json<NotificationSettingsInput>().catch(() => ({} as NotificationSettingsInput))
      const rawSpeed = Number(body.marquee_speed_seconds || DEFAULT_MARQUEE_SPEED_SECONDS)
      const payload = {
        marquee_text: String(body.marquee_text || '').trim().slice(0, 600),
        marquee_speed_seconds: String(Number.isFinite(rawSpeed) ? Math.min(120, Math.max(8, Math.round(rawSpeed))) : DEFAULT_MARQUEE_SPEED_SECONDS),
        notification_display_mode: normalizeNotificationDisplayMode(body.notification_display_mode),
        static_notification_text: String(body.static_notification_text || '').trim().slice(0, 600),
      }
      await deps.upsertAppSettings(c.env.DB, [
        { key: 'marquee_text', value: payload.marquee_text },
        { key: 'marquee_speed_seconds', value: payload.marquee_speed_seconds },
        { key: 'notification_display_mode', value: payload.notification_display_mode },
        { key: 'static_notification_text', value: payload.static_notification_text },
      ])
      return c.json({ success: true, data: payload })
    } catch (e: any) {
      return c.json({ success: false, error: e.message }, 500)
    }
  })

  app.get('/api/admin/settings/payment', async (c) => {
    try {
      await deps.initDB(c.env.DB)
      const settings = await readPaymentSettings(c.env.DB)
      return c.json({ success: true, data: settings })
    } catch (e: any) {
      return c.json({ success: false, error: e.message }, 500)
    }
  })

  app.put('/api/admin/settings/payment', async (c) => {
    try {
      await deps.initDB(c.env.DB)
      const body: PaymentSettingsInput = await c.req.json<PaymentSettingsInput>().catch(() => ({} as PaymentSettingsInput))
      const enabled = body.wallet_topup_enabled === true || body.wallet_topup_enabled === 1 || body.wallet_topup_enabled === '1'
      const payload = {
        wallet_topup_enabled: enabled,
      }
      await deps.upsertAppSettings(c.env.DB, [
        { key: 'wallet_topup_enabled', value: enabled ? '1' : '0' },
      ])
      return c.json({ success: true, data: payload })
    } catch (e: any) {
      return c.json({ success: false, error: e.message }, 500)
    }
  })

  app.get('/api/admin/settings/text-ui', async (c) => {
    try {
      await deps.initDB(c.env.DB)
      const settings = await readTextUiSettings(c.env.DB)
      return c.json({ success: true, data: settings })
    } catch (e: any) {
      return c.json({ success: false, error: e.message }, 500)
    }
  })

  app.put('/api/admin/settings/text-ui', async (c) => {
    try {
      await deps.initDB(c.env.DB)
      const body: TextUiSettingsInput = await c.req.json<TextUiSettingsInput>().catch(() => ({} as TextUiSettingsInput))
      const payload = {
        quick_order_risk_note_text: sanitizeTextUiSetting(body.quick_order_risk_note_text) || DEFAULT_QUICK_ORDER_RISK_NOTE_TEXT,
        hero_badge_text: sanitizeTextUiSetting(body.hero_badge_text, 220),
        hero_title_text: sanitizeTextUiSetting(body.hero_title_text, 220),
        hero_typed_text: sanitizeTextUiSetting(body.hero_typed_text, 220),
        hero_description_text: sanitizeTextUiSetting(body.hero_description_text, 800),
        hero_mobile_subtitle_text: sanitizeTextUiSetting(body.hero_mobile_subtitle_text, 220),
        hero_stat_1_value: sanitizeTextUiSetting(body.hero_stat_1_value, 80),
        hero_stat_1_label: sanitizeTextUiSetting(body.hero_stat_1_label, 80),
        hero_stat_2_value: sanitizeTextUiSetting(body.hero_stat_2_value, 80),
        hero_stat_2_label: sanitizeTextUiSetting(body.hero_stat_2_label, 80),
        hero_stat_3_value: sanitizeTextUiSetting(body.hero_stat_3_value, 80),
        hero_stat_3_label: sanitizeTextUiSetting(body.hero_stat_3_label, 80),
      }
      await deps.upsertAppSettings(c.env.DB, Object.entries(payload).map(([key, value]) => ({ key, value })))
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

  app.get('/api/public/notification-settings', async (c) => {
    try {
      await deps.initDB(c.env.DB)
      const settings = await readNotificationSettings(c.env.DB)
      return c.json({ success: true, data: settings })
    } catch (e: any) {
      return c.json({ success: false, error: e.message }, 500)
    }
  })

  app.get('/api/public/payment-settings', async (c) => {
    try {
      await deps.initDB(c.env.DB)
      const settings = await readPaymentSettings(c.env.DB)
      return c.json({ success: true, data: settings })
    } catch (e: any) {
      return c.json({ success: false, error: e.message }, 500)
    }
  })
}
