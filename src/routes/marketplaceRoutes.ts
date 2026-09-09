import type { Hono } from 'hono'
import type { AppBindings } from '../types/app'
import { getRuntimeConfigValues } from '../lib/runtimeConfigHelpers'
import { upsertAppSettings } from '../lib/adminHelpers'

type MarketplaceRouteDeps = {
  initDB: (db: D1Database) => Promise<void>
}

type JsonObject = Record<string, unknown>

type NhanhResponseData = JsonObject & {
  paginator?: {
    next?: {
      id?: unknown
    }
  }
}

type NhanhConfig = {
  appId: string
  secretKey: string
  businessId: string
  accessToken: string
}

type MarketplaceOrder = {
  id: string
  code: string
  platform: 'tiktok' | 'shopee' | 'other'
  platformLabel: string
  bucket: 'active' | 'returns' | 'cancelled'
  statusCode: string
  statusText: string
  customerName: string
  customerMobile: string
  createdAt: string
  money: number
  codMoney: number
  productsText: string
  raw: Record<string, unknown>
}

const NHANH_ORDER_LIST_URL = 'https://pos.open.nhanh.vn/v3.0/order/list'
const NHANH_ECOM_SHOP_URL = 'https://pos.open.nhanh.vn/v3.0/ecom/shop'
const NHANH_ECOM_RETURN_URL = 'https://pos.open.nhanh.vn/v3.0/ecom/return'
const NHANH_ACCESS_TOKEN_URL = 'https://pos.open.nhanh.vn/v3.0/app/getaccesstoken'
const CONFIG_KEYS = ['NHANH_APP_ID', 'NHANH_SECRET_KEY', 'NHANH_BUSINESS_ID', 'NHANH_ACCESS_TOKEN'] as const
const MAX_PAGE_SIZE = 100
const NHANH_ECOM_PLATFORM_APP_IDS: Record<string, MarketplaceOrder['platform']> = {
  '8855': 'tiktok',
  '8195': 'shopee',
}
const NHANH_ORDER_STATUS_LABELS: Record<string, string> = {
  '40': 'Đã đóng gói',
  '42': 'Đang đóng gói',
  '43': 'Chờ thu gom',
  '54': 'Đơn mới',
  '55': 'Đang xác nhận',
  '56': 'Đã xác nhận',
  '57': 'Chờ khách xác nhận',
  '58': 'Hãng vận chuyển hủy đơn',
  '59': 'Đang chuyển',
  '60': 'Thành công',
  '61': 'Thất bại',
  '63': 'Khách hủy',
  '64': 'Hệ thống hủy',
  '68': 'Hết hàng',
  '71': 'Đang chuyển hoàn',
  '72': 'Đã chuyển hoàn',
  '73': 'Đổi kho xuất hàng',
  '74': 'Xác nhận hoàn',
}
const NHANH_CANCELLED_STATUS_CODES = new Set(['58', '61', '63', '64', '68'])
const NHANH_RETURN_STATUS_CODES = new Set(['71', '72', '74'])
const NHANH_STATUS_FILTER_GROUPS: Record<string, number[]> = {
  processing: [54, 55, 56, 57],
  arranging_shipping: [42, 40],
  awaiting_pickup: [43],
  shipping: [59],
  completed: [60],
  failed: [58, 61],
  cancelled: [63, 64, 68],
  returns: [71, 72, 74],
}
const NHANH_SALE_CHANNEL_FILTERS: Record<string, number[]> = {
  tiktok: [48],
  shopee: [42],
}
const MAX_NHANH_RANGE_DAYS = 31
const DEFAULT_MARKETPLACE_DAYS = 365
const VIETNAM_TIMEZONE_OFFSET = '+07:00'

type NhanhShopInfo = {
  platform: MarketplaceOrder['platform']
  name: string
  appId: string
}

function stringValue(value: unknown): string {
  return String(value ?? '').trim()
}

function toJsonObject(value: unknown): JsonObject {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? value as JsonObject
    : {}
}

function toNhanhResponseData(value: unknown): NhanhResponseData {
  const data = toJsonObject(value)
  const paginator = toJsonObject(data.paginator)
  const next = toJsonObject(paginator.next)
  return {
    ...data,
    paginator: {
      ...paginator,
      next: { ...next },
    },
  }
}

function numberValue(value: unknown): number {
  const parsed = Number(String(value ?? '').replace(/[^\d.-]/g, ''))
  return Number.isFinite(parsed) ? parsed : 0
}

function clampNumber(value: unknown, fallback: number, min: number, max: number): number {
  const parsed = Number(value)
  if (!Number.isFinite(parsed)) return fallback
  return Math.min(Math.max(Math.floor(parsed), min), max)
}

function unixSeconds(value: Date): number {
  return Math.floor(value.getTime() / 1000)
}

function addDays(value: Date, days: number): Date {
  const next = new Date(value)
  next.setUTCDate(next.getUTCDate() + days)
  return next
}

function todayVietnamDate(): string {
  return new Date(Date.now() + 7 * 60 * 60 * 1000).toISOString().slice(0, 10)
}

function parseVietnamDayRange(value: unknown) {
  const raw = stringValue(value) || todayVietnamDate()
  const date = /^[0-9]{4}-[0-9]{2}-[0-9]{2}$/.test(raw) ? raw : todayVietnamDate()
  return {
    date,
    from: new Date(`${date}T00:00:00${VIETNAM_TIMEZONE_OFFSET}`),
    to: new Date(`${date}T23:59:59${VIETNAM_TIMEZONE_OFFSET}`),
  }
}

function parseNhanhStatusFilter(value: unknown): number[] {
  const status = lower(value || 'all')
  if (!status || status === 'all') return []
  if (NHANH_STATUS_FILTER_GROUPS[status]) return NHANH_STATUS_FILTER_GROUPS[status]
  const code = Number(status)
  if (Number.isInteger(code) && NHANH_ORDER_STATUS_LABELS[String(code)]) return [code]
  return []
}

function parseNhanhSaleChannelFilter(value: unknown): number[] {
  return NHANH_SALE_CHANNEL_FILTERS[lower(value)] || []
}

function lower(value: unknown): string {
  return stringValue(value).toLowerCase()
}

function maskSecret(value: string): string {
  const text = stringValue(value)
  if (!text) return ''
  if (text.length <= 8) return '*'.repeat(text.length)
  return `${text.slice(0, 3)}...${text.slice(-4)}`
}

function escapeHtml(value: unknown): string {
  return String(value ?? '').replace(/[&<>"']/g, (ch) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  }[ch] || ch))
}

async function readNhanhConfig(db: D1Database, env: AppBindings): Promise<NhanhConfig> {
  const values = await getRuntimeConfigValues(db, env, [...CONFIG_KEYS])
  return {
    appId: stringValue(values.NHANH_APP_ID),
    secretKey: stringValue(values.NHANH_SECRET_KEY),
    businessId: stringValue(values.NHANH_BUSINESS_ID),
    accessToken: stringValue(values.NHANH_ACCESS_TOKEN),
  }
}

function maskNhanhConfig(config: NhanhConfig) {
  return {
    appId: config.appId,
    businessId: config.businessId,
    hasSecretKey: !!config.secretKey,
    hasAccessToken: !!config.accessToken,
    secretKeyMasked: maskSecret(config.secretKey),
    accessTokenMasked: maskSecret(config.accessToken),
    oauthUrl: config.appId
      ? `https://nhanh.vn/oauth?version=v3.0&appId=${encodeURIComponent(config.appId)}&returnLink=${encodeURIComponent('https://qhclothes.pages.dev/api/nhanh/oauth/callback')}`
      : '',
  }
}

async function saveNhanhConfig(db: D1Database, input: Partial<NhanhConfig>) {
  const entries = [
    ['nhanh_app_id', input.appId],
    ['nhanh_secret_key', input.secretKey],
    ['nhanh_business_id', input.businessId],
    ['nhanh_access_token', input.accessToken],
  ]
    .filter((entry): entry is [string, string] => typeof entry[1] === 'string')
    .map(([key, value]) => ({ key, value: stringValue(value) }))
  if (entries.length) await upsertAppSettings(db, entries)
}

function collectValues(raw: any, keys: string[]): string {
  for (const key of keys) {
    const value = raw?.[key]
    if (value !== undefined && value !== null && stringValue(value)) return stringValue(value)
  }
  return ''
}

function collectNumber(raw: any, keys: string[]): number {
  for (const key of keys) {
    const value = raw?.[key]
    const parsed = numberValue(value)
    if (parsed) return parsed
  }
  return 0
}

function stringifyProductNames(raw: any): string {
  const candidates = [raw?.products, raw?.items, raw?.orderDetails, raw?.detail, raw?.product]
  for (const candidate of candidates) {
    if (Array.isArray(candidate)) {
      const names = candidate
        .map((item) => collectValues(item, ['name', 'productName', 'product_name', 'title']))
        .filter(Boolean)
      if (names.length) return names.join(', ')
    }
    if (candidate && typeof candidate === 'object') {
      const values = Object.values(candidate)
        .map((item: any) => collectValues(item, ['name', 'productName', 'product_name', 'title']))
        .filter(Boolean)
      if (values.length) return values.join(', ')
    }
    if (typeof candidate === 'string' && candidate.trim()) return candidate.trim()
  }
  return collectValues(raw, ['productName', 'product_name', 'product'])
}

function platformFromAppId(value: unknown): MarketplaceOrder['platform'] | null {
  const appId = stringValue(value)
  return NHANH_ECOM_PLATFORM_APP_IDS[appId] || null
}

function platformFromText(value: unknown): MarketplaceOrder['platform'] | null {
  const text = lower(value)
  if (text.includes('tiktok') || text.includes('tik tok')) return 'tiktok'
  if (text.includes('shopee') || text.includes('shoppe')) return 'shopee'
  return null
}

function detectPlatform(raw: any, shops = new Map<string, NhanhShopInfo>()): MarketplaceOrder['platform'] {
  const channel = raw?.channel || {}
  const shop = shops.get(stringValue(channel?.shopId || raw?.shopId || raw?.shop?.id))
  if (shop) return shop.platform
  const appPlatform = platformFromAppId(channel?.appId || raw?.appId)
  if (appPlatform) return appPlatform
  const haystack = [
    channel?.shopId,
    channel?.shopName,
    channel?.appName,
    raw?.saleChannel,
    raw?.saleChannelName,
    raw?.channel,
    raw?.channelName,
    raw?.source,
    raw?.sourceName,
    raw?.ecommerce,
    raw?.marketplace,
    raw?.shop,
    raw?.shopName,
  ].map(lower).join(' ')
  return platformFromText(haystack) || 'other'
}

function detectBucket(raw: any, statusText: string): MarketplaceOrder['bucket'] {
  const statusCode = stringValue(raw?.info?.status || raw?.statusCode || raw?.status_code || raw?.status)
  if (NHANH_RETURN_STATUS_CODES.has(statusCode)) return 'returns'
  if (NHANH_CANCELLED_STATUS_CODES.has(statusCode)) return 'cancelled'
  const haystack = [
    statusText,
    raw?.info?.status,
    raw?.statusName,
    raw?.status,
    raw?.statusCode,
    raw?.returnStatus,
    raw?.return_status,
    raw?.reason,
  ].map(lower).join(' ')
  if (haystack.includes('hủy') || haystack.includes('huy') || haystack.includes('cancel')) return 'cancelled'
  if (haystack.includes('hoàn') || haystack.includes('tra hang') || haystack.includes('trả') || haystack.includes('return')) return 'returns'
  return 'active'
}

function sumProductsMoney(products: any[]): number {
  return products.reduce((total, item) => {
    const price = collectNumber(item, ['priceAfterVAT', 'price', 'displaySalePrice', 'originalPrice'])
    const quantity = collectNumber(item, ['quantity', 'originalQuantity']) || 1
    return total + (price * quantity)
  }, 0)
}

function getNhanhStatusText(raw: any): string {
  const statusCode = stringValue(raw?.info?.status || raw?.statusCode || raw?.status_code || raw?.status)
  return collectValues(raw, ['statusName', 'status_name', 'statusText', 'status_text'])
    || NHANH_ORDER_STATUS_LABELS[statusCode]
    || (statusCode ? `Trạng thái ${statusCode}` : 'Chưa rõ')
}

function normalizeOrder(raw: any, shops = new Map<string, NhanhShopInfo>()): MarketplaceOrder {
  const info = raw?.info || {}
  const channel = raw?.channel || {}
  const payment = raw?.payment || {}
  const shippingAddress = raw?.shippingAddress || raw?.customer || raw?.buyer || {}
  const products = Array.isArray(raw?.products) ? raw.products : []
  const platform = detectPlatform(raw, shops)
  const statusText = getNhanhStatusText(raw)
  const statusCode = stringValue(info?.status || raw?.statusCode || raw?.status_code || raw?.status)
  const bucket = detectBucket(raw, statusText)
  const customer = raw?.customer || raw?.buyer || {}
  const internalCode = collectValues(info, ['id', 'code', 'privateId', 'private_id']) || collectValues(raw, ['id', 'code', 'orderCode', 'order_code', 'privateId', 'private_id'])
  const platformOrderCode = collectValues(channel, ['appOrderId', 'app_order_id', 'ecomOrderId', 'ecom_order_id', 'orderId', 'order_id'])
    || collectValues(raw, ['appOrderId', 'app_order_id', 'ecomOrderId', 'ecom_order_id', 'originalEcomOrderId'])
  const returnOrderCode = collectValues(raw, ['returnId', 'return_id', 'returnCode', 'return_code', 'returnIdOrReturnTrackingNumber'])
    || collectValues(info, ['idReturn'])
  return {
    id: collectValues(info, ['id', 'orderId', 'order_id']) || collectValues(raw, ['id', 'orderId', 'order_id']) || collectValues(raw, ['code', 'orderCode', 'order_code']),
    code: (bucket === 'returns' ? returnOrderCode : '') || platformOrderCode || internalCode || collectValues(info, ['id']) || collectValues(raw, ['id', 'orderId', 'order_id']),
    platform,
    platformLabel: platform === 'tiktok' ? 'TikTok' : platform === 'shopee' ? 'Shopee' : 'Khác',
    bucket,
    statusCode,
    statusText,
    customerName: collectValues(raw, ['customerName', 'customer_name', 'receiverName', 'receiver_name']) || collectValues(shippingAddress, ['name', 'fullName', 'fullname']) || collectValues(customer, ['name', 'fullName', 'fullname']),
    customerMobile: collectValues(raw, ['customerMobile', 'customer_mobile', 'receiverMobile', 'receiver_mobile', 'mobile', 'phone']) || collectValues(shippingAddress, ['mobile', 'phone']) || collectValues(customer, ['mobile', 'phone']),
    createdAt: collectValues(info, ['createdAt', 'created_at', 'createdDateTime', 'createdDate']) || collectValues(raw, ['createdDateTime', 'createdDate', 'created_at', 'createdAt', 'date']),
    money: collectNumber(payment, ['businessPayment', 'codAmount', 'transfer', 'deposit']) || collectNumber(raw, ['money', 'totalMoney', 'total_money', 'amount', 'total', 'price']) || sumProductsMoney(products),
    codMoney: collectNumber(payment, ['codAmount']) || collectNumber(raw, ['codMoney', 'cod_money', 'codAmount', 'cod_amount']),
    productsText: stringifyProductNames(raw),
    raw,
  }
}

function normalizeReturn(raw: any, shops = new Map<string, NhanhShopInfo>()): MarketplaceOrder {
  const normalized = normalizeOrder(raw, shops)
  const returnCode = collectValues(raw, ['returnId', 'return_id', 'returnCode', 'return_code', 'returnIdOrReturnTrackingNumber'])
    || collectValues(raw, ['id'])
  return {
    ...normalized,
    id: normalized.id || returnCode,
    code: returnCode || normalized.code || collectValues(raw, ['originalEcomOrderId', 'code', 'id']),
    bucket: 'returns',
    statusText: collectValues(raw, ['statusName', 'status_name', 'returnStatus', 'return_status', 'status']) || 'Yêu cầu hoàn tiền',
  }
}

function extractOrders(payload: any): any[] {
  const candidates = [
    payload?.data?.orders,
    payload?.data?.items,
    payload?.data?.data,
    payload?.orders,
    payload?.items,
    payload?.data,
  ]
  for (const candidate of candidates) {
    if (Array.isArray(candidate)) return candidate
    if (candidate && typeof candidate === 'object') {
      const values = Object.values(candidate)
      if (values.length && values.every((item) => item && typeof item === 'object')) return values
    }
  }
  return []
}

function buildStats(orders: MarketplaceOrder[]) {
  return orders.reduce((acc, order) => {
    acc.total += 1
    acc[order.platform] += 1
    acc[order.bucket] += 1
    const statusKey = order.statusCode || 'unknown'
    acc.statuses[statusKey] = (acc.statuses[statusKey] || 0) + 1
    return acc
  }, { total: 0, tiktok: 0, shopee: 0, other: 0, active: 0, returns: 0, cancelled: 0, statuses: {} as Record<string, number> })
}

async function fetchNhanhPost(url: string, config: NhanhConfig, body: Record<string, unknown>) {
  const response = await fetch(`${url}?appId=${encodeURIComponent(config.appId)}&businessId=${encodeURIComponent(config.businessId)}`, {
    method: 'POST',
    headers: {
      Authorization: config.accessToken,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })
  const data = toNhanhResponseData(await response.json().catch(() => ({})))
  return { ok: response.ok && Number(data?.code || 1) !== 0, status: response.status, data }
}

async function fetchNhanhOrderPage(config: NhanhConfig, filters: Record<string, unknown>, pageSize: number, nextId = '') {
  const paginator: Record<string, unknown> = {
    size: Math.min(Math.max(pageSize, 1), MAX_PAGE_SIZE),
  }
  if (nextId) paginator.next = { id: Number(nextId) || nextId }
  return fetchNhanhPost(NHANH_ORDER_LIST_URL, config, { filters, paginator })
}

async function fetchNhanhOrdersByRange(config: NhanhConfig, pageSize: number, days: number, statusCodes: number[] = [], saleChannels: number[] = [], dateValue = '') {
  const missing = [
    !config.appId && 'NHANH_APP_ID',
    !config.businessId && 'NHANH_BUSINESS_ID',
    !config.accessToken && 'NHANH_ACCESS_TOKEN',
  ].filter(Boolean)
  if (missing.length) {
    return { ok: false, status: 400, data: { success: false, error: `Thiếu cấu hình: ${missing.join(', ')}` } }
  }

  const fixedDateRange = dateValue ? parseVietnamDayRange(dateValue) : null
  const end = fixedDateRange?.to || new Date()
  const start = fixedDateRange?.from || addDays(end, -Math.max(days, 1))
  const rows: any[] = []
  const seen = new Set<string>()
  const messages: unknown[] = []
  let cursorStart = new Date(start)

  while (cursorStart.getTime() < end.getTime()) {
    const cursorEnd = new Date(Math.min(addDays(cursorStart, MAX_NHANH_RANGE_DAYS).getTime(), end.getTime()))
    const filters = {
      createdAtFrom: unixSeconds(cursorStart),
      createdAtTo: unixSeconds(cursorEnd),
      ...(statusCodes.length ? { statuses: statusCodes } : {}),
      ...(saleChannels.length ? { saleChannels } : {}),
    }
    let nextId = ''
    let guard = 0
    do {
      const page = await fetchNhanhOrderPage(config, filters, pageSize, nextId)
      if (!page.ok) return page
      const pageRows = extractOrders(page.data)
      for (const row of pageRows) {
        const id = stringValue(row?.info?.id || row?.id || row?.orderId)
        const key = id || JSON.stringify(row).slice(0, 120)
        if (seen.has(key)) continue
        seen.add(key)
        rows.push(row)
      }
      if (page.data.messages) messages.push(page.data.messages)
      nextId = stringValue(page.data?.paginator?.next?.id)
      guard += 1
    } while (nextId && guard < 25)
    cursorStart = cursorEnd
  }

  rows.sort((a, b) => numberValue(b?.info?.createdAt || b?.createdAt) - numberValue(a?.info?.createdAt || a?.createdAt))
  return {
    ok: true,
    status: 200,
    data: {
      code: 1,
      data: rows,
      messages,
      paginator: {},
    },
  }
}

async function fetchNhanhShops(config: NhanhConfig) {
  const result = await fetchNhanhPost(NHANH_ECOM_SHOP_URL, config, {
    filters: {},
    paginator: { size: MAX_PAGE_SIZE },
  })
  if (!result.ok) return new Map<string, NhanhShopInfo>()
  const map = new Map<string, NhanhShopInfo>()
  for (const item of extractOrders(result.data)) {
    const appId = stringValue(item?.appId)
    const shopId = stringValue(item?.shop?.id || item?.shopId)
    if (!shopId) continue
    const platform = platformFromAppId(appId) || platformFromText(item?.shop?.name || item?.name) || 'other'
    map.set(shopId, {
      appId,
      platform,
      name: stringValue(item?.shop?.name || item?.name),
    })
  }
  return map
}

async function fetchNhanhReturns(config: NhanhConfig, pageSize: number) {
  return fetchNhanhPost(NHANH_ECOM_RETURN_URL, config, {
    filters: {},
    paginator: { size: Math.min(Math.max(pageSize, 1), MAX_PAGE_SIZE) },
  })
}

async function exchangeNhanhAccessCode(config: NhanhConfig, accessCode: string) {
  const response = await fetch(`${NHANH_ACCESS_TOKEN_URL}?appId=${encodeURIComponent(config.appId)}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      accessCode,
      secretKey: config.secretKey,
    }),
  })
  const data = toNhanhResponseData(await response.json().catch(() => ({})))
  const nestedData = toJsonObject(data.data)
  if (!response.ok || data?.code || data?.error) {
    const message = stringValue(data?.message || data?.error || data?.errorMessage || `Nhanh token HTTP ${response.status}`)
    throw new Error(message)
  }
  const token = stringValue(nestedData.accessToken || data.accessToken)
  const businessId = stringValue(nestedData.businessId || data.businessId || config.businessId)
  if (!token) throw new Error('Nhanh không trả về accessToken')
  return { accessToken: token, businessId, raw: data }
}

export function registerMarketplaceRoutes(app: Hono<{ Bindings: AppBindings }>, deps: MarketplaceRouteDeps) {
  app.get('/api/nhanh/oauth/callback', async (c) => {
    try {
      await deps.initDB(c.env.DB)
      const accessCode = stringValue(c.req.query('accessCode') || c.req.query('code'))
      if (!accessCode) {
        return c.html('<!doctype html><html lang="vi"><body><h1>Thiếu accessCode từ Nhanh</h1></body></html>', 400)
      }
      const config = await readNhanhConfig(c.env.DB, c.env)
      if (!config.appId || !config.secretKey) {
        return c.html(`<!doctype html><html lang="vi"><body><h1>Đã nhận accessCode</h1><p>Vào admin Sàn TMĐT để lưu App ID và Secret key trước khi đổi token.</p><p>Mã: <code>${escapeHtml(accessCode)}</code></p></body></html>`, 200)
      }
      const result = await exchangeNhanhAccessCode(config, accessCode)
      await saveNhanhConfig(c.env.DB, { accessToken: result.accessToken, businessId: result.businessId })
      return c.html('<!doctype html><html lang="vi"><body><h1>Kết nối Nhanh thành công</h1><p>Bạn có thể quay lại admin để tải đơn từ sàn.</p></body></html>', 200)
    } catch (error: any) {
      return c.html(`<!doctype html><html lang="vi"><body><h1>Kết nối Nhanh lỗi</h1><p>${escapeHtml(error?.message || error)}</p></body></html>`, 500)
    }
  })

  app.get('/api/admin/marketplaces/config', async (c) => {
    try {
      await deps.initDB(c.env.DB)
      const config = await readNhanhConfig(c.env.DB, c.env)
      return c.json({ success: true, data: maskNhanhConfig(config) })
    } catch (error: any) {
      return c.json({ success: false, error: error?.message || String(error) }, 500)
    }
  })

  app.put('/api/admin/marketplaces/config', async (c) => {
    try {
      await deps.initDB(c.env.DB)
      const body = await c.req.json().catch(() => ({}))
      await saveNhanhConfig(c.env.DB, {
        appId: body.appId,
        secretKey: body.secretKey,
        businessId: body.businessId,
        accessToken: body.accessToken,
      })
      const config = await readNhanhConfig(c.env.DB, c.env)
      return c.json({ success: true, data: maskNhanhConfig(config) })
    } catch (error: any) {
      return c.json({ success: false, error: error?.message || String(error) }, 500)
    }
  })

  app.post('/api/admin/marketplaces/nhanh/exchange-token', async (c) => {
    try {
      await deps.initDB(c.env.DB)
      const body = await c.req.json().catch(() => ({}))
      const accessCode = stringValue(body.accessCode)
      if (!accessCode) return c.json({ success: false, error: 'Thiếu accessCode' }, 400)
      const config = await readNhanhConfig(c.env.DB, c.env)
      if (!config.appId || !config.secretKey) return c.json({ success: false, error: 'Thiếu App ID hoặc Secret key Nhanh' }, 400)
      const result = await exchangeNhanhAccessCode(config, accessCode)
      await saveNhanhConfig(c.env.DB, { accessToken: result.accessToken, businessId: result.businessId })
      const nextConfig = await readNhanhConfig(c.env.DB, c.env)
      return c.json({ success: true, data: maskNhanhConfig(nextConfig) })
    } catch (error: any) {
      return c.json({ success: false, error: error?.message || String(error) }, 500)
    }
  })

  app.get('/api/admin/marketplaces/orders', async (c) => {
    try {
      await deps.initDB(c.env.DB)
      const channel = lower(c.req.query('channel') || 'all')
      const status = lower(c.req.query('status') || 'all')
      const pageSize = Math.min(Math.max(Number(c.req.query('pageSize') || 100), 1), MAX_PAGE_SIZE)
      const days = clampNumber(c.req.query('days'), DEFAULT_MARKETPLACE_DAYS, 1, 365)
      const dateFilter = stringValue(c.req.query('date'))
      const dateRange = dateFilter ? parseVietnamDayRange(dateFilter) : null
      const statusCodes = parseNhanhStatusFilter(status)
      const saleChannels = parseNhanhSaleChannelFilter(channel)
      const config = await readNhanhConfig(c.env.DB, c.env)
      const result = await fetchNhanhOrdersByRange(config, pageSize, days, statusCodes, saleChannels, dateFilter)
      if (!result.ok) return c.json(result.data, result.status as any)
      const shops = await fetchNhanhShops(config)
      const allOrders = [
        ...extractOrders(result.data).map((row) => normalizeOrder(row, shops)),
      ]
      const filtered = allOrders.filter((order) => {
        const channelOk = channel === 'all' || order.platform === channel
        const statusOk = status === 'all'
          || (statusCodes.length ? statusCodes.includes(Number(order.statusCode)) : order.bucket === status)
        return channelOk && statusOk
      })
      return c.json({
        success: true,
        data: {
          orders: filtered,
          stats: buildStats(allOrders),
          totalFetched: allOrders.length,
          date: dateRange?.date || '',
          days,
          statusCodes,
          saleChannels,
          rawCode: result.data?.code || '',
          rawMessage: result.data?.message || '',
        },
      })
    } catch (error: any) {
      return c.json({ success: false, error: error?.message || String(error) }, 500)
    }
  })
}
