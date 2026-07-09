import type { Hono } from 'hono'
import { unzipSync, zipSync } from 'fflate'
import type { AppBindings } from '../types/app'
import type { AppSettingEntry } from '../types/admin'
import type { GhtkPickupConfig, GhtkPickupAddressFetchResult, GhnConfig, ShippingCarrierDefinition, SpxConfig } from '../lib/shippingHelpers'
import {
  buildPublicAssetUrl,
  getProductAssetBucket,
  isUnsafeProductAssetKey,
  normalizeProductAssetKey,
  productAssetKeyFromUrl,
  readProductAssetObject,
  writeProductAssetObject
} from '../lib/assetStorage'
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
  product_freeship_badge_enabled?: unknown
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
const SHOP_BACKUP_SCHEMA_VERSION = 1
const SHOP_BACKUP_TABLES = [
  'products',
  'product_skus',
  'hero_banners',
  'flash_sales',
  'flash_sale_items',
  'reviews',
  'vouchers',
  'app_settings',
] as const
const SHOP_BACKUP_SETTING_ALLOWLIST = new Set([
  'product_types',
  'product_type_map',
  'home_trending_banner_image',
  'home_trending_banner_subtitle',
  'home_trending_banner_title',
  'social_tiktok_handle',
  'social_shopee_handle',
  'social_facebook_handle',
  'social_threads_handle',
  'marquee_text',
  'marquee_speed_seconds',
  'notification_display_mode',
  'static_notification_text',
  'wallet_topup_enabled',
  'quick_order_risk_note_text',
  'product_freeship_badge_enabled',
  'hero_badge_text',
  'hero_title_text',
  'hero_typed_text',
  'hero_description_text',
  'hero_mobile_subtitle_text',
  'hero_stat_1_value',
  'hero_stat_1_label',
  'hero_stat_2_value',
  'hero_stat_2_label',
  'hero_stat_3_value',
  'hero_stat_3_label',
])
const SHOP_BACKUP_RESTORE_ORDER = [
  'flash_sale_items',
  'product_skus',
  'flash_sales',
  'hero_banners',
  'vouchers',
  'products',
  'app_settings',
] as const
const SHOP_BACKUP_INSERT_ORDER = [
  'products',
  'product_skus',
  'hero_banners',
  'flash_sales',
  'flash_sale_items',
  'vouchers',
  'app_settings',
] as const

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

function backupJsonResponse(data: unknown, filename: string) {
  return new Response(JSON.stringify(data, null, 2), {
    headers: {
      'content-type': 'application/json; charset=UTF-8',
      'content-disposition': `attachment; filename="${filename}"`,
      'cache-control': 'no-store',
    },
  })
}

function backupError(c: any, error: string, status = 400, extra?: Record<string, unknown>) {
  return c.json({ success: false, error, ...(extra || {}) }, status)
}

async function selectBackupRows(db: D1Database, table: string) {
  if (table === 'app_settings') {
    const keys = Array.from(SHOP_BACKUP_SETTING_ALLOWLIST)
    if (!keys.length) return []
    const placeholders = keys.map(() => '?').join(',')
    const result = await db.prepare(`SELECT * FROM app_settings WHERE key IN (${placeholders}) ORDER BY key ASC`)
      .bind(...keys)
      .all()
    return result.results || []
  }
  const orderBy = table === 'app_settings' ? 'key ASC' : 'id ASC'
  const result = await db.prepare(`SELECT * FROM ${table} ORDER BY ${orderBy}`).all()
  return result.results || []
}

async function buildShopBackupData(db: D1Database) {
  const data: Record<string, any[]> = {}
  for (const table of SHOP_BACKUP_TABLES) {
    data[table] = (await selectBackupRows(db, table)) as any[]
  }
  return data
}

function collectStringValues(value: unknown, out: Set<string>) {
  if (typeof value === 'string') {
    const text = value.trim()
    if (!text) return
    if (/^(https?:\/\/|\/media\/)/i.test(text) && /\.(png|jpe?g|webp|gif)(\?|#|$)/i.test(text)) out.add(text)
    if ((text.startsWith('[') || text.startsWith('{')) && text.length < 200000) {
      try {
        collectStringValues(JSON.parse(text), out)
      } catch {
        // not JSON
      }
    }
    return
  }
  if (Array.isArray(value)) {
    value.forEach((item) => collectStringValues(item, out))
    return
  }
  if (value && typeof value === 'object') {
    Object.values(value as Record<string, unknown>).forEach((item) => collectStringValues(item, out))
  }
}

function collectBackupImageUrls(data: Record<string, any[]>): string[] {
  const urls = new Set<string>()
  Object.values(data).forEach((rows) => rows.forEach((row) => collectStringValues(row, urls)))
  return Array.from(urls)
}

function getImageExtensionFromContentType(contentType: string, fallback = 'jpg') {
  const type = contentType.toLowerCase()
  if (type.includes('png')) return 'png'
  if (type.includes('webp')) return 'webp'
  if (type.includes('gif')) return 'gif'
  if (type.includes('jpeg') || type.includes('jpg')) return 'jpg'
  return fallback
}

function safeBackupImageName(index: number, url: string, contentType = '') {
  const fromUrl = (() => {
    try {
      const pathname = new URL(url, 'https://backup.local').pathname
      const extMatch = pathname.match(/\.([a-z0-9]{2,5})$/i)
      return extMatch ? extMatch[1].toLowerCase() : ''
    } catch {
      return ''
    }
  })()
  const ext = ['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(fromUrl)
    ? (fromUrl === 'jpeg' ? 'jpg' : fromUrl)
    : getImageExtensionFromContentType(contentType)
  return `images/${String(index + 1).padStart(4, '0')}.${ext}`
}

async function readBackupImageBytes(env: AppBindings, url: string): Promise<{ bytes: Uint8Array; contentType: string } | null> {
  const key = productAssetKeyFromUrl(url)
  if (key) {
    const object = await readProductAssetObject(env, key)
    if (object) {
      const contentType = String(object.httpMetadata?.contentType || 'application/octet-stream')
      return { bytes: new Uint8Array(await object.arrayBuffer()), contentType }
    }
  }
  if (!/^https?:\/\//i.test(url)) return null
  try {
    const response = await fetch(url)
    if (!response.ok) return null
    const contentType = String(response.headers.get('content-type') || 'application/octet-stream')
    if (!contentType.toLowerCase().startsWith('image/')) return null
    const bytes = new Uint8Array(await response.arrayBuffer())
    if (!bytes.length || bytes.length > MAX_R2_IMAGE_BYTES) return null
    return { bytes, contentType }
  } catch {
    return null
  }
}

function encodeUtf8(value: unknown): Uint8Array {
  return new TextEncoder().encode(typeof value === 'string' ? value : JSON.stringify(value, null, 2))
}

function decodeUtf8(value: Uint8Array): string {
  return new TextDecoder().decode(value)
}

async function buildShopBackupZip(env: AppBindings, data: Record<string, any[]>) {
  const exportedAt = new Date().toISOString()
  const imageUrls = collectBackupImageUrls(data)
  const imageManifest: Array<{ url: string; path: string; contentType: string; included: boolean; reason?: string }> = []
  const files: Record<string, Uint8Array> = {}
  for (const table of SHOP_BACKUP_TABLES) {
    files[`data/${table}.json`] = encodeUtf8(data[table] || [])
  }
  for (let index = 0; index < imageUrls.length; index += 1) {
    const url = imageUrls[index]
    const image = await readBackupImageBytes(env, url)
    if (!image) {
      imageManifest.push({ url, path: '', contentType: '', included: false, reason: 'IMAGE_NOT_AVAILABLE' })
      continue
    }
    const path = safeBackupImageName(index, url, image.contentType)
    files[path] = image.bytes
    imageManifest.push({ url, path, contentType: image.contentType, included: true })
  }
  const manifest = {
    schemaVersion: SHOP_BACKUP_SCHEMA_VERSION,
    exportedAt,
    app: 'qhclothes',
    tables: SHOP_BACKUP_TABLES,
    counts: Object.fromEntries(SHOP_BACKUP_TABLES.map((table) => [table, data[table]?.length || 0])),
    images: imageManifest,
  }
  files['manifest.json'] = encodeUtf8(manifest)
  return { bytes: zipSync(files, { level: 6 }), manifest }
}

function normalizeBackupPayload(raw: any) {
  const payload = raw && typeof raw === 'object' ? raw : {}
  const data = payload.data && typeof payload.data === 'object' ? payload.data : payload
  const out: Record<string, any[]> = {}
  for (const table of SHOP_BACKUP_TABLES) {
    out[table] = Array.isArray(data[table]) ? data[table] : []
  }
  return {
    manifest: payload.manifest || {
      schemaVersion: Number(payload.schemaVersion || SHOP_BACKUP_SCHEMA_VERSION),
      exportedAt: payload.exportedAt || '',
      images: payload.images || [],
    },
    data: out,
  }
}

function parseBackupJsonBytes(bytes: Uint8Array) {
  const text = decodeUtf8(bytes).trim()
  if (!text) throw new Error('EMPTY_BACKUP_FILE')
  return normalizeBackupPayload(JSON.parse(text))
}

function parseBackupZipBytes(bytes: Uint8Array) {
  const files = unzipSync(bytes)
  const manifest = files['manifest.json'] ? JSON.parse(decodeUtf8(files['manifest.json'])) : {}
  const data: Record<string, any[]> = {}
  for (const table of SHOP_BACKUP_TABLES) {
    const file = files[`data/${table}.json`]
    data[table] = file ? JSON.parse(decodeUtf8(file)) : []
  }
  return { manifest, data: normalizeBackupPayload({ data, manifest }).data, files }
}

function summarizeBackupData(data: Record<string, any[]>, imageCount = 0) {
  return {
    products: data.products?.length || 0,
    product_skus: data.product_skus?.length || 0,
    hero_banners: data.hero_banners?.length || 0,
    flash_sales: data.flash_sales?.length || 0,
    flash_sale_items: data.flash_sale_items?.length || 0,
    reviews: data.reviews?.length || 0,
    vouchers: data.vouchers?.length || 0,
    app_settings: data.app_settings?.length || 0,
    images: imageCount,
  }
}

function buildBackupEnvelope(data: Record<string, any[]>) {
  const exportedAt = new Date().toISOString()
  return {
    schemaVersion: SHOP_BACKUP_SCHEMA_VERSION,
    exportedAt,
    app: 'qhclothes',
    notes: [
      'Backup chứa sản phẩm, SKU, banner, flashsale, voucher và setting hiển thị.',
      'Không export token, session, khách hàng hoặc đơn hàng.',
      'Reviews được export để tham chiếu, nhưng import mặc định không khôi phục reviews vì có thể phụ thuộc users/orders.',
    ],
    counts: summarizeBackupData(data, collectBackupImageUrls(data).length),
    data,
  }
}

function rewriteStringValue(value: string, urlMap: Map<string, string>): string {
  let next = value
  urlMap.forEach((newUrl, oldUrl) => {
    if (!oldUrl || !newUrl || oldUrl === newUrl) return
    next = next.split(oldUrl).join(newUrl)
  })
  return next
}

function rewriteBackupUrls(data: Record<string, any[]>, urlMap: Map<string, string>) {
  if (!urlMap.size) return data
  const rewrite = (value: any): any => {
    if (typeof value === 'string') return rewriteStringValue(value, urlMap)
    if (Array.isArray(value)) return value.map(rewrite)
    if (value && typeof value === 'object') {
      const out: Record<string, any> = {}
      Object.entries(value).forEach(([key, item]) => { out[key] = rewrite(item) })
      return out
    }
    return value
  }
  return rewrite(data)
}

async function uploadBackupImagesFromZip(env: AppBindings, manifest: any, files: Record<string, Uint8Array>) {
  const bucket = getProductAssetBucket(env)
  const urlMap = new Map<string, string>()
  const imageEntries = Array.isArray(manifest?.images) ? manifest.images : []
  if (!bucket || !imageEntries.length) return { urlMap, uploaded: 0, skipped: imageEntries.length }
  let uploaded = 0
  let skipped = 0
  for (const entry of imageEntries) {
    const oldUrl = String(entry?.url || '').trim()
    const path = String(entry?.path || '').trim()
    const bytes = files[path]
    if (!oldUrl || !path || !bytes?.length) {
      skipped += 1
      continue
    }
    const contentType = String(entry?.contentType || 'application/octet-stream')
    const ext = getImageExtensionFromContentType(contentType)
    const key = `restored/${new Date().toISOString().slice(0, 10)}/${crypto.randomUUID()}.${ext}`
    await writeProductAssetObject(env, key, bytes, {
      httpMetadata: {
        contentType,
        cacheControl: 'public, max-age=31536000, immutable',
      },
    })
    urlMap.set(oldUrl, buildPublicAssetUrl(env, key))
    uploaded += 1
  }
  return { urlMap, uploaded, skipped }
}

function sanitizeBackupRow(row: any, table: string) {
  const out: Record<string, any> = {}
  if (!row || typeof row !== 'object') return out
  Object.entries(row).forEach(([key, value]) => {
    if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(key)) return
    if (table === 'app_settings' && key === 'key' && !SHOP_BACKUP_SETTING_ALLOWLIST.has(String(value || ''))) return
    out[key] = value
  })
  return out
}

async function insertBackupRows(db: D1Database, table: string, rows: any[]) {
  for (const rawRow of rows || []) {
    const row = sanitizeBackupRow(rawRow, table)
    const keys = Object.keys(row)
    if (!keys.length) continue
    const placeholders = keys.map(() => '?').join(',')
    const cols = keys.map((key) => `"${key}"`).join(',')
    const sql = `INSERT OR REPLACE INTO ${table} (${cols}) VALUES (${placeholders})`
    await db.prepare(sql).bind(...keys.map((key) => row[key])).run()
  }
}

async function restoreShopBackupData(db: D1Database, data: Record<string, any[]>, options: { replaceExisting: boolean }) {
  if (options.replaceExisting) {
    for (const table of SHOP_BACKUP_RESTORE_ORDER) {
      if (table === 'app_settings') {
        const keys = Array.from(SHOP_BACKUP_SETTING_ALLOWLIST)
        if (keys.length) {
          await db.prepare(`DELETE FROM app_settings WHERE key IN (${keys.map(() => '?').join(',')})`).bind(...keys).run()
        }
      } else {
        await db.prepare(`DELETE FROM ${table}`).run()
      }
    }
  }
  for (const table of SHOP_BACKUP_INSERT_ORDER) {
    await insertBackupRows(db, table, data[table] || [])
  }
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

const DEFAULT_MARQUEE_TEXT = 'Mua hàng tại đây không qua sàn thương mại nên giá thành sản phẩm sẽ rẻ hơn rất nhiều và bảo hành hoàn trả trong vòng 7 ngày nếu sản phẩm bị lỗi nên quý khách yên tâm mua sắm nhé.Bảo hành đổi trả nhắn qua trang facebook : QH Boypho. Chúc quý khách có trải nghiệm mua sắm tốt tại QH Boypho'
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
    const key = normalizeProductAssetKey(decodeURIComponent(c.req.path.replace(/^\/media\//, '')))
    if (isUnsafeProductAssetKey(key)) return c.notFound()
    const object = await readProductAssetObject(c.env, key)
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
    if (!getProductAssetBucket(c.env)) return c.json({ success: false, error: 'R2_NOT_CONFIGURED' }, 500)

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
    await writeProductAssetObject(c.env, key, await file.arrayBuffer(), {
      httpMetadata: {
        contentType,
        cacheControl: 'public, max-age=31536000, immutable',
      },
    })
    return c.json({ success: true, key, url: buildPublicAssetUrl(c.env, key) })
  })

  app.get('/api/admin/backup/export', async (c) => {
    try {
      await deps.initDB(c.env.DB)
      const format = String(c.req.query('format') || 'zip').toLowerCase()
      const data = await buildShopBackupData(c.env.DB)
      const stamp = new Date().toISOString().slice(0, 10)
      if (format === 'json') {
        return backupJsonResponse(buildBackupEnvelope(data), `qhclothes-backup-${stamp}.json`)
      }
      const backup = await buildShopBackupZip(c.env, data)
      return new Response(backup.bytes, {
        headers: {
          'content-type': 'application/zip',
          'content-disposition': `attachment; filename="qhclothes-backup-${stamp}.zip"`,
          'cache-control': 'no-store',
        },
      })
    } catch (e: any) {
      return backupError(c, e?.message || 'BACKUP_EXPORT_FAILED', 500)
    }
  })

  app.post('/api/admin/backup/import', async (c) => {
    try {
      await deps.initDB(c.env.DB)
      const form = await c.req.raw.formData()
      const file = form.get('file')
      if (!(file instanceof File)) return backupError(c, 'MISSING_BACKUP_FILE', 400)
      if (file.size <= 0 || file.size > 80 * 1024 * 1024) return backupError(c, 'BACKUP_FILE_TOO_LARGE', 400)

      const previewOnly = String(form.get('preview_only') || '1') !== '0'
      const replaceExisting = String(form.get('replace_existing') || '1') !== '0'
      const bytes = new Uint8Array(await file.arrayBuffer())
      const name = String(file.name || '').toLowerCase()
      const isZip = name.endsWith('.zip') || String(file.type || '').includes('zip')
      const parsed = isZip ? parseBackupZipBytes(bytes) : { ...parseBackupJsonBytes(bytes), files: {} as Record<string, Uint8Array> }
      const imageEntries = Array.isArray(parsed.manifest?.images) ? parsed.manifest.images : []
      const imageCount = imageEntries.filter((entry: any) => entry?.included !== false && entry?.path).length
      const summary = summarizeBackupData(parsed.data, imageCount)
      const warnings = [
        'Import không khôi phục reviews để tránh lỗi phụ thuộc users/orders trên host mới.',
        replaceExisting ? 'Chế độ import sẽ xoá dữ liệu sản phẩm/marketing hiện tại trước khi ghi backup.' : 'Chế độ import sẽ ghi đè các bản ghi trùng id, không xoá dữ liệu cũ.',
      ]

      if (previewOnly) {
        return c.json({
          success: true,
          preview: true,
          replace_existing: replaceExisting,
          summary,
          warnings,
        })
      }

      const upload = isZip
        ? await uploadBackupImagesFromZip(c.env, parsed.manifest, parsed.files)
        : { urlMap: new Map<string, string>(), uploaded: 0, skipped: 0 }
      const restoredData = rewriteBackupUrls(parsed.data, upload.urlMap)
      await restoreShopBackupData(c.env.DB, restoredData, { replaceExisting })
      return c.json({
        success: true,
        preview: false,
        replace_existing: replaceExisting,
        summary,
        images_uploaded: upload.uploaded,
        images_skipped: upload.skipped,
        warnings,
      })
    } catch (e: any) {
      return backupError(c, e?.message || 'BACKUP_IMPORT_FAILED', 500)
    }
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
      const freeshipBadgeEnabled = body.product_freeship_badge_enabled === undefined
        ? true
        : body.product_freeship_badge_enabled === true || body.product_freeship_badge_enabled === 1 || body.product_freeship_badge_enabled === '1'
      const payload = {
        quick_order_risk_note_text: sanitizeTextUiSetting(body.quick_order_risk_note_text) || DEFAULT_QUICK_ORDER_RISK_NOTE_TEXT,
        product_freeship_badge_enabled: freeshipBadgeEnabled ? '1' : '0',
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
