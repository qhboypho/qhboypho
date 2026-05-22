import { PDFDocument } from 'pdf-lib'
import type { AppBindings } from '../types/app'
import { getRuntimeConfigValues } from './runtimeConfigHelpers'

export type GhtkPickupConfig = {
  token: string
  clientSource: string
  pickAddressId: string
  pickName: string
  pickAddress: string
  pickProvince: string
  pickDistrict: string
  pickWard: string
  pickTel: string
}

export type GhtkPickupAddress = {
  pick_address_id: string
  pick_name: string
  pick_tel: string
  full_address: string
  pick_address: string
  pick_ward: string
  pick_district: string
  pick_province: string
}

export type GhtkPickupAddressFetchResult =
  | { ok: true, data: GhtkPickupAddress[] }
  | { ok: false, message: string, data: GhtkPickupAddress[], detail?: unknown }

export type SpxConfig = {
  userId: string
  secretKey: string
  accountId: string
  createOrderEndpoint: string
  labelEndpoint: string
}

export type GhnConfig = {
  token: string
  shopId: string
  clientId: string
  defaultWeightGram: string
  defaultLengthCm: string
  defaultWidthCm: string
  defaultHeightCm: string
}

export type ShippingCarrierDefinition = {
  code: string
  label: string
  enabled: boolean
  builtIn: boolean
  adapter: boolean
}

const SHIPPING_CARRIER_ENABLED_CODES_KEY = 'shipping_carrier_enabled_codes'
const SHIPPING_CARRIER_CUSTOM_DEFINITIONS_KEY = 'shipping_carrier_custom_definitions'

const BUILT_IN_SHIPPING_CARRIERS: ShippingCarrierDefinition[] = [
  { code: 'GHTK', label: 'GHTK', enabled: true, builtIn: true, adapter: true },
  { code: 'SPX', label: 'SPX Express', enabled: true, builtIn: true, adapter: true },
  { code: 'GHN', label: 'GHN', enabled: true, builtIn: true, adapter: true }
]

export function normalizeShippingCarrierCode(value: unknown) {
  const code = String(value || '').trim().toUpperCase().replace(/[^A-Z0-9_]+/g, '_').replace(/^_+|_+$/g, '')
  return code.slice(0, 24) || 'GHTK'
}

function parseJsonArray(value: unknown): any[] {
  try {
    const parsed = JSON.parse(String(value || '[]'))
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function normalizeEnabledCarrierCodes(value: unknown) {
  const raw = String(value || '').trim()
  if (!raw) return new Set(BUILT_IN_SHIPPING_CARRIERS.map((item) => item.code))
  const codes = parseJsonArray(raw).map(normalizeShippingCarrierCode).filter(Boolean)
  return new Set(codes)
}

function normalizeCustomShippingCarriers(value: unknown): ShippingCarrierDefinition[] {
  return parseJsonArray(value)
    .map((item) => {
      const code = normalizeShippingCarrierCode(item?.code)
      const label = String(item?.label || code).trim().slice(0, 80)
      if (!code || BUILT_IN_SHIPPING_CARRIERS.some((carrier) => carrier.code === code)) return null
      return {
        code,
        label: label || code,
        enabled: item?.enabled !== false,
        builtIn: false,
        adapter: false
      }
    })
    .filter(Boolean) as ShippingCarrierDefinition[]
}

async function getShippingCarrierSettings(db: D1Database) {
  const rows = await db.prepare(`
    SELECT key, value
    FROM app_settings
    WHERE key IN (?, ?)
  `).bind(SHIPPING_CARRIER_ENABLED_CODES_KEY, SHIPPING_CARRIER_CUSTOM_DEFINITIONS_KEY).all()
  const map = new Map<string, string>()
  for (const row of (rows.results || []) as any[]) {
    map.set(String(row.key || ''), String(row.value || '').trim())
  }
  return {
    enabledCodes: normalizeEnabledCarrierCodes(map.get(SHIPPING_CARRIER_ENABLED_CODES_KEY)),
    customCarriers: normalizeCustomShippingCarriers(map.get(SHIPPING_CARRIER_CUSTOM_DEFINITIONS_KEY))
  }
}

export async function getAllShippingCarriers(db: D1Database): Promise<ShippingCarrierDefinition[]> {
  const settings = await getShippingCarrierSettings(db)
  const builtIns = BUILT_IN_SHIPPING_CARRIERS.map((carrier) => ({
    ...carrier,
    enabled: settings.enabledCodes.has(carrier.code)
  }))
  const custom = settings.customCarriers.map((carrier) => ({
    ...carrier,
    enabled: carrier.enabled && settings.enabledCodes.has(carrier.code)
  }))
  return [...builtIns, ...custom]
}

export async function getAvailableShippingCarriers(db: D1Database): Promise<ShippingCarrierDefinition[]> {
  return (await getAllShippingCarriers(db)).filter((carrier) => carrier.enabled)
}

export async function getGhtkApiCredentials(db: D1Database, env: AppBindings) {
  const config = await getRuntimeConfigValues(db, env, ['GHTK_TOKEN', 'GHTK_CLIENT_SOURCE'])
  return {
    token: config.GHTK_TOKEN || '',
    clientSource: config.GHTK_CLIENT_SOURCE || ''
  }
}

export async function getSpxConfig(db: D1Database, env: AppBindings): Promise<SpxConfig> {
  const config = await getRuntimeConfigValues(db, env, [
    'SPX_USER_ID',
    'SPX_SECRET_KEY',
    'SPX_ACCOUNT_ID',
    'SPX_CREATE_ORDER_ENDPOINT',
    'SPX_LABEL_ENDPOINT'
  ])
  return {
    userId: config.SPX_USER_ID || '',
    secretKey: config.SPX_SECRET_KEY || '',
    accountId: config.SPX_ACCOUNT_ID || '',
    createOrderEndpoint: config.SPX_CREATE_ORDER_ENDPOINT || '',
    labelEndpoint: config.SPX_LABEL_ENDPOINT || ''
  }
}

export async function getGhnConfig(db: D1Database, env: AppBindings): Promise<GhnConfig> {
  const config = await getRuntimeConfigValues(db, env, [
    'GHN_TOKEN',
    'GHN_SHOP_ID',
    'GHN_CLIENT_ID',
    'GHN_DEFAULT_WEIGHT_GRAM',
    'GHN_DEFAULT_LENGTH_CM',
    'GHN_DEFAULT_WIDTH_CM',
    'GHN_DEFAULT_HEIGHT_CM'
  ])
  return {
    token: config.GHN_TOKEN || '',
    shopId: config.GHN_SHOP_ID || '',
    clientId: config.GHN_CLIENT_ID || '',
    defaultWeightGram: config.GHN_DEFAULT_WEIGHT_GRAM || '500',
    defaultLengthCm: config.GHN_DEFAULT_LENGTH_CM || '20',
    defaultWidthCm: config.GHN_DEFAULT_WIDTH_CM || '15',
    defaultHeightCm: config.GHN_DEFAULT_HEIGHT_CM || '5'
  }
}

export async function spxCreateShipment(env: AppBindings, db: D1Database, order: any) {
  const config = await getSpxConfig(db, env)
  if (!config.userId || !config.secretKey || !config.accountId) {
    return { ok: false, message: 'MISSING_SPX_KEYS' }
  }
  if (!config.createOrderEndpoint) {
    return { ok: false, message: 'SPX_CREATE_ORDER_ENDPOINT_NOT_CONFIGURED' }
  }
  return {
    ok: false,
    message: 'SPX_CREATE_ORDER_NOT_IMPLEMENTED',
    detail: {
      endpoint: config.createOrderEndpoint,
      order_code: String(order?.order_code || '')
    }
  }
}

export async function spxFetchLabelPdf(env: AppBindings, db: D1Database, trackingCode: string): Promise<Uint8Array> {
  const config = await getSpxConfig(db, env)
  if (!config.userId || !config.secretKey || !config.accountId) {
    throw new Error('MISSING_SPX_KEYS')
  }
  if (!config.labelEndpoint) {
    throw new Error('SPX_LABEL_ENDPOINT_NOT_CONFIGURED')
  }
  throw new Error('SPX_LABEL_FETCH_NOT_IMPLEMENTED:' + String(trackingCode || '').trim())
}

const GHN_API_BASE_URL = 'https://online-gateway.ghn.vn/shiip/public-api'
const GHN_PRINT_A5_URL = 'https://online-gateway.ghn.vn/a5/public-api/printA5'
const ADDRESS_KIT_BASE_URL = 'https://production.cas.so/address-kit'
const ADDRESS_KIT_LEGACY_EFFECTIVE_DATE = '2025-06-30'
const addressKitProvinceCache = new Map<string, any[]>()
const addressKitCommuneCache = new Map<string, any[]>()
const addressKitLegacyCommuneByCodeCache = new Map<string, any | null>()
const addressKitLatestCommuneByNameCache = new Map<string, any | null>()

function numberOrDefault(value: unknown, fallback: number) {
  const n = Number(value)
  return Number.isFinite(n) && n > 0 ? n : fallback
}

async function ghnFetchJson(path: string, config: GhnConfig, body?: Record<string, unknown>) {
  const resp = await fetch(GHN_API_BASE_URL + path, {
    method: body ? 'POST' : 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Token': config.token,
      'ShopId': config.shopId
    },
    body: body ? JSON.stringify(body) : undefined
  })
  const data: any = await resp.json().catch(() => ({}))
  if (!resp.ok || Number(data?.code || 0) >= 300) {
    throw new Error(String(data?.message || data?.code_message_value || 'GHN_API_FAILED'))
  }
  return data
}

function findGhnAddressMatch<T extends Record<string, any>>(rows: T[], fields: string[], target: string) {
  const normalizedTarget = normalizeGhnAddressToken(target)
  if (!normalizedTarget) return null
  return rows.find((row) => getGhnAddressNames(row, fields).some((name) => normalizeGhnAddressToken(name) === normalizedTarget))
    || rows.find((row) => getGhnAddressNames(row, fields).some((name) => {
      const source = normalizeGhnAddressToken(name)
      return source && (source.includes(normalizedTarget) || normalizedTarget.includes(source))
    }))
    || null
}

function getGhnAddressNames(row: Record<string, any>, fields: string[]) {
  const names = fields.map((field) => String(row?.[field] || '')).filter(Boolean)
  const extensions = Array.isArray(row?.NameExtension) ? row.NameExtension.map((name: unknown) => String(name || '')).filter(Boolean) : []
  return [...names, ...extensions]
}

function isGhnUnsupportedArea(row: Record<string, any>) {
  const supportType = Number(row?.SupportType ?? row?.support_type ?? 1)
  const status = Number(row?.Status ?? row?.status ?? 1)
  const isEnable = Number(row?.IsEnable ?? row?.is_enable ?? 1)
  return supportType === 0 || status === 2 || isEnable === 0
}

export function normalizeGhnAddressToken(value: string) {
  return String(value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/[.,]/g, ' ')
    .replace(/\b(thanh pho|tp|tinh|quan|q|huyen dao|huyen|h|dac khu|thi xa|thi tran|phuong|p|xa|x)\b/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

async function addressKitFetchJson(path: string) {
  const resp = await fetch(ADDRESS_KIT_BASE_URL + path, {
    headers: { accept: 'application/json' }
  })
  const data: any = await resp.json().catch(() => ({}))
  if (!resp.ok) {
    throw new Error(String(data?.message || data?.error || 'ADDRESS_KIT_LOOKUP_FAILED'))
  }
  return data
}

async function getAddressKitProvinces(effectiveDate: string) {
  const key = String(effectiveDate || 'latest').trim() || 'latest'
  if (addressKitProvinceCache.has(key)) return addressKitProvinceCache.get(key) || []
  const json = await addressKitFetchJson('/' + encodeURIComponent(key) + '/provinces')
  const provinces = Array.isArray(json?.provinces) ? json.provinces : []
  addressKitProvinceCache.set(key, provinces)
  return provinces
}

async function getAddressKitCommunes(effectiveDate: string, provinceCode: string) {
  const date = String(effectiveDate || 'latest').trim() || 'latest'
  const code = String(provinceCode || '').trim()
  if (!code) return []
  const key = date + ':' + code
  if (addressKitCommuneCache.has(key)) return addressKitCommuneCache.get(key) || []
  const json = await addressKitFetchJson('/' + encodeURIComponent(date) + '/provinces/' + encodeURIComponent(code) + '/communes')
  const communes = Array.isArray(json?.communes) ? json.communes : []
  addressKitCommuneCache.set(key, communes)
  return communes
}

async function resolveAddressKitLatestCommuneByNames(provinceName: unknown, communeName: unknown) {
  const provinceTarget = normalizeGhnAddressToken(String(provinceName || ''))
  const communeTarget = normalizeGhnAddressToken(String(communeName || ''))
  if (!provinceTarget || !communeTarget) return null
  const cacheKey = provinceTarget + ':' + communeTarget
  if (addressKitLatestCommuneByNameCache.has(cacheKey)) return addressKitLatestCommuneByNameCache.get(cacheKey)

  const provinces = await getAddressKitProvinces('latest')
  const province = provinces.find((item: any) => normalizeGhnAddressToken(String(item?.name || '')) === provinceTarget)
    || provinces.find((item: any) => {
      const source = normalizeGhnAddressToken(String(item?.name || ''))
      return source && (source.includes(provinceTarget) || provinceTarget.includes(source))
    })
  const provinceCode = String(province?.code || '').trim()
  if (!provinceCode) {
    addressKitLatestCommuneByNameCache.set(cacheKey, null)
    return null
  }

  const communes = await getAddressKitCommunes('latest', provinceCode)
  const commune = communes.find((item: any) => normalizeGhnAddressToken(String(item?.name || '')) === communeTarget)
    || communes.find((item: any) => {
      const source = normalizeGhnAddressToken(String(item?.name || ''))
      return source && (source.includes(communeTarget) || communeTarget.includes(source))
    })
    || null
  addressKitLatestCommuneByNameCache.set(cacheKey, commune)
  return commune
}

async function resolveAddressKitLegacyCommuneByCode(communeCode: unknown) {
  const code = String(communeCode || '').trim()
  if (!code) return null
  const cacheKey = ADDRESS_KIT_LEGACY_EFFECTIVE_DATE + ':' + code
  if (addressKitLegacyCommuneByCodeCache.has(cacheKey)) return addressKitLegacyCommuneByCodeCache.get(cacheKey)

  const provinces = await getAddressKitProvinces(ADDRESS_KIT_LEGACY_EFFECTIVE_DATE)
  for (const province of provinces) {
    const provinceCode = String(province?.code || '').trim()
    if (!provinceCode) continue
    const communes = await getAddressKitCommunes(ADDRESS_KIT_LEGACY_EFFECTIVE_DATE, provinceCode)
    const commune = communes.find((item: any) => String(item?.code || '').trim() === code)
    if (commune) {
      addressKitLegacyCommuneByCodeCache.set(cacheKey, commune)
      return commune
    }
  }

  addressKitLegacyCommuneByCodeCache.set(cacheKey, null)
  return null
}

async function resolveGhnRecipientAddress(config: GhnConfig, rawAddress: string, order: any) {
  const parsed = parseVietnamAddress(rawAddress)
  if (!parsed) return null
  const latestCommune = order?.customer_commune_code
    ? null
    : await resolveAddressKitLatestCommuneByNames(parsed.province, parsed.ward).catch(() => null)
  const legacyCommune = await resolveAddressKitLegacyCommuneByCode(order?.customer_commune_code || latestCommune?.code).catch(() => null)
  const addressForGhn = legacyCommune?.districtName && legacyCommune?.provinceName
    ? {
        ...parsed,
        ward: String(legacyCommune.name || parsed.ward),
        district: String(legacyCommune.districtName || parsed.district),
        province: String(legacyCommune.provinceName || parsed.province),
        usedLegacyAddress: true
      }
    : parsed

  const provinces = await ghnFetchJson('/master-data/province', config)
  const provinceRows = Array.isArray(provinces?.data) ? provinces.data : []
  const province = findGhnAddressMatch(provinceRows, ['ProvinceName', 'Name'], addressForGhn.province)
  const provinceId = Number(province?.ProvinceID || province?.ProvinceId || province?.ID || 0)
  if (!provinceId) return null

  const districts = await ghnFetchJson('/master-data/district', config, { province_id: provinceId })
  const districtRows = Array.isArray(districts?.data) ? districts.data : []
  const district = findGhnAddressMatch(districtRows, ['DistrictName', 'Name'], addressForGhn.district)
  const districtId = Number(district?.DistrictID || district?.DistrictId || district?.ID || 0)
  if (!districtId) return null

  const wards = await ghnFetchJson('/master-data/ward', config, { district_id: districtId })
  const wardRows = Array.isArray(wards?.data) ? wards.data : []
  const ward = findGhnAddressMatch(wardRows, ['WardName', 'Name'], addressForGhn.ward)
  const wardCode = String(ward?.WardCode || ward?.Code || '').trim()
  if (!wardCode) return null
  if (isGhnUnsupportedArea(district) || isGhnUnsupportedArea(ward)) {
    return {
      ...addressForGhn,
      to_district_id: districtId,
      to_ward_code: wardCode,
      unsupported: true,
      unsupported_area: [ward?.WardName || addressForGhn.ward, district?.DistrictName || addressForGhn.district, province?.ProvinceName || addressForGhn.province].filter(Boolean).join(', ')
    }
  }

  return {
    ...addressForGhn,
    to_district_id: districtId,
    to_ward_code: wardCode,
    to_ward_name: String(ward?.WardName || addressForGhn.ward),
    to_district_name: String(district?.DistrictName || addressForGhn.district),
    to_province_name: String(province?.ProvinceName || addressForGhn.province)
  }
}

export async function ghnCreateShipment(env: AppBindings, db: D1Database, order: any) {
  const config = await getGhnConfig(db, env)
  if (!config.token || !config.shopId) return { ok: false, message: 'MISSING_GHN_KEYS' }

  let recipientAddress: any
  try {
    recipientAddress = await resolveGhnRecipientAddress(config, String(order?.customer_address || ''), order)
  } catch (e: any) {
    return { ok: false, message: 'GHN_ADDRESS_LOOKUP_FAILED', detail: e?.message || e }
  }
  if (!recipientAddress) return { ok: false, message: 'GHN_ADDRESS_LOOKUP_FAILED' }
  if (recipientAddress.unsupported) {
    return { ok: false, message: 'GHN_UNSUPPORTED_DELIVERY_AREA', detail: recipientAddress.unsupported_area || null }
  }

  const amountDue = Math.max(0, Math.round(getOrderAmountDueServer(order)))
  const productName = String(order?.product_name || 'San pham').slice(0, 120)
  const quantity = Math.max(1, Number(order?.quantity || 1) || 1)
  const payload = {
    payment_type_id: 2,
    required_note: 'CHOXEMHANGKHONGTHU',
    to_name: String(order?.customer_name || '').slice(0, 120),
    to_phone: String(order?.customer_phone || ''),
    to_address: recipientAddress.detail,
    to_ward_code: recipientAddress.to_ward_code,
    to_district_id: recipientAddress.to_district_id,
    to_ward_name: recipientAddress.to_ward_name,
    to_district_name: recipientAddress.to_district_name,
    to_province_name: recipientAddress.to_province_name,
    cod_amount: amountDue,
    content: productName,
    weight: numberOrDefault(config.defaultWeightGram, 500),
    length: numberOrDefault(config.defaultLengthCm, 20),
    width: numberOrDefault(config.defaultWidthCm, 15),
    height: numberOrDefault(config.defaultHeightCm, 5),
    service_type_id: 2,
    items: [
      {
        name: productName,
        quantity,
        price: Math.max(0, Math.round(Number(order?.total_price || 0))),
        weight: numberOrDefault(config.defaultWeightGram, 500)
      }
    ],
    note: String(order?.note || '').slice(0, 500)
  }

  try {
    const body = await ghnFetchJson('/v2/shipping-order/create', config, payload)
    const data = body?.data || {}
    const orderCode = String(data.order_code || data.tracking_code || '').trim()
    if (!orderCode) return { ok: false, message: 'GHN_TRACKING_EMPTY', detail: data }
    return {
      ok: true,
      data: {
        ...data,
        label: orderCode,
        tracking_id: orderCode,
        fee: Number(data.total_fee || data.fee || 0) || 0
      }
    }
  } catch (e: any) {
    return { ok: false, message: String(e?.message || 'GHN_CREATE_ORDER_FAILED') }
  }
}

export async function ghnFetchLabelPdf(env: AppBindings, db: D1Database, trackingCode: string): Promise<Uint8Array> {
  const config = await getGhnConfig(db, env)
  if (!config.token || !config.shopId) throw new Error('MISSING_GHN_KEYS')
  const code = String(trackingCode || '').trim()
  if (!code) throw new Error('MISSING_GHN_TRACKING_CODE')

  const tokenRes = await ghnFetchJson('/v2/a5/gen-token', config, { order_codes: [code] })
  const token = String(tokenRes?.data?.token || '').trim()
  if (!token) throw new Error('GHN_PRINT_TOKEN_EMPTY')

  const resp = await fetch(GHN_PRINT_A5_URL + '?token=' + encodeURIComponent(token), {
    method: 'GET',
    headers: {
      'Token': config.token,
      'ShopId': config.shopId
    }
  })
  const contentType = String(resp.headers.get('content-type') || '').toLowerCase()
  if (!resp.ok || contentType.indexOf('application/pdf') < 0) {
    const detail = await resp.text().catch(() => '')
    throw new Error('GHN_LABEL_FETCH_FAILED:' + detail)
  }
  return new Uint8Array(await resp.arrayBuffer())
}

export function normalizeGHTKOriginal(v: any) {
  const value = String(v || '').toLowerCase()
  return value === 'landscape' ? 'landscape' : 'portrait'
}

export function normalizeGHTKPageSize(v: any) {
  const value = String(v || '').toUpperCase()
  return value === 'A5' ? 'A5' : 'A6'
}

export function parseVietnamAddress(address: string) {
  const parts = String(address || '').split(',').map((s) => s.trim()).filter(Boolean)
  if (parts.length < 3) return null
  const province = parts[parts.length - 1]
  const ward = parts[parts.length - 2]
  const detail = parts.slice(0, parts.length - 2).join(', ')
  const district = parts.length >= 4 ? parts[parts.length - 3] : ward
  if (!detail || !province || !district || !ward) return null
  return { detail, ward, district, province }
}

export function resolveRecipientAddressForGHTK(env: any, rawAddress: string) {
  const parsed = parseVietnamAddress(rawAddress)
  if (parsed) return { ...parsed, usedFallback: false }
  const fallbackProvince = String(env.GHTK_FALLBACK_PROVINCE || env.GHTK_PICK_PROVINCE || '').trim()
  const fallbackDistrict = String(env.GHTK_FALLBACK_DISTRICT || env.GHTK_PICK_DISTRICT || '').trim()
  const fallbackWard = String(env.GHTK_FALLBACK_WARD || env.GHTK_PICK_WARD || '').trim()
  const detail = String(rawAddress || '').trim()
  if (!detail || !fallbackProvince || !fallbackDistrict || !fallbackWard) return null
  return {
    detail,
    ward: fallbackWard,
    district: fallbackDistrict,
    province: fallbackProvince,
    usedFallback: true
  }
}

export function normalizeAddressToken(value: string) {
  return String(value || '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .replace(/[.,]/g, '')
    .trim()
}

export function normalizeRecipientAddressForGHTK(input: { detail: string, ward: string, district: string, province: string, usedFallback?: boolean }) {
  const ward = String(input.ward || '').trim()
  const province = String(input.province || '').trim()
  let district = String(input.district || '').trim()
  const detailParts = String(input.detail || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)

  const wardNorm = normalizeAddressToken(ward)
  const districtNorm = normalizeAddressToken(district)
  const provinceNorm = normalizeAddressToken(province)

  if (districtNorm && wardNorm && districtNorm === wardNorm && detailParts.length > 1) {
    const candidate = detailParts[detailParts.length - 1]
    const candidateNorm = normalizeAddressToken(candidate)
    if (candidateNorm && candidateNorm !== wardNorm && candidateNorm !== provinceNorm) {
      district = candidate
    }
  }

  while (detailParts.length > 0) {
    const lastNorm = normalizeAddressToken(detailParts[detailParts.length - 1])
    const districtNowNorm = normalizeAddressToken(district)
    if (!lastNorm) {
      detailParts.pop()
      continue
    }
    if (lastNorm === wardNorm || lastNorm === districtNowNorm || lastNorm === provinceNorm) {
      detailParts.pop()
      continue
    }
    break
  }

  return {
    detail: detailParts.join(', ').trim(),
    ward,
    district,
    province,
    usedFallback: !!input.usedFallback
  }
}

export function getOrderAmountDueServer(order: any) {
  return String(order?.payment_status || '').toLowerCase() === 'paid'
    ? 0
    : Number(order?.total_price || 0)
}

export function buildInternalTestOrderWhereSql(alias = '') {
  const p = alias ? `${alias}.` : ''
  return `(
    LOWER(TRIM(COALESCE(${p}customer_name, '')))='local script test'
    OR LOWER(TRIM(COALESCE(${p}note, '')))='test:payos-local'
    OR LOWER(TRIM(COALESCE(${p}note, '')))='test:zalopay-local'
  )`
}

export async function getGhtkPickupConfig(db: D1Database, env: AppBindings): Promise<GhtkPickupConfig> {
  const config = await getRuntimeConfigValues(db, env, [
    'GHTK_TOKEN',
    'GHTK_CLIENT_SOURCE',
    'GHTK_PICK_ADDRESS_ID',
    'GHTK_PICK_NAME',
    'GHTK_PICK_ADDRESS',
    'GHTK_PICK_PROVINCE',
    'GHTK_PICK_DISTRICT',
    'GHTK_PICK_WARD',
    'GHTK_PICK_TEL'
  ])
  return {
    token: config.GHTK_TOKEN || '',
    clientSource: config.GHTK_CLIENT_SOURCE || '',
    pickAddressId: config.GHTK_PICK_ADDRESS_ID || '',
    pickName: config.GHTK_PICK_NAME || '',
    pickAddress: config.GHTK_PICK_ADDRESS || '',
    pickProvince: config.GHTK_PICK_PROVINCE || '',
    pickDistrict: config.GHTK_PICK_DISTRICT || '',
    pickWard: config.GHTK_PICK_WARD || '',
    pickTel: config.GHTK_PICK_TEL || ''
  }
}

export async function ghtkFetchPickupAddresses(env: AppBindings, db: D1Database): Promise<GhtkPickupAddressFetchResult> {
  const { token, clientSource } = await getGhtkApiCredentials(db, env)
  if (!token || !clientSource) return { ok: false, message: 'MISSING_GHTK_KEYS', data: [] }

  const resp = await fetch('https://services.giaohangtietkiem.vn/services/shipment/list_pick_add', {
    method: 'GET',
    headers: {
      'Token': token,
      'X-Client-Source': clientSource
    }
  })
  const body: any = await resp.json().catch(() => ({}))
  if (!resp.ok || !body?.success) {
    return { ok: false, message: String(body?.message || 'GHTK_FETCH_PICKUP_ADDRESSES_FAILED'), data: [] as any[], detail: body }
  }
  const raw = Array.isArray(body?.data) ? body.data : []
  const data: GhtkPickupAddress[] = raw.map((row: any) => {
    const id = String(row?.pick_address_id || row?.address_id || row?.id || '').trim()
    const name = String(row?.pick_name || row?.name || row?.contact_name || '').trim()
    const tel = String(row?.pick_tel || row?.phone || row?.tel || '').trim()
    const fullAddress = String(row?.address || row?.pick_address || row?.full_address || '').trim()
    const parsed = parseVietnamAddress(fullAddress)
    return {
      pick_address_id: id,
      pick_name: name,
      pick_tel: tel,
      full_address: fullAddress,
      pick_address: parsed?.detail || fullAddress,
      pick_ward: parsed?.ward || '',
      pick_district: parsed?.district || '',
      pick_province: parsed?.province || ''
    }
  }).filter((v: GhtkPickupAddress) => v.pick_address_id || v.full_address)

  return { ok: true, data }
}

export async function ghtkCreateShipment(env: any, db: D1Database, order: any) {
  const { token, clientSource } = await getGhtkApiCredentials(db, env)
  if (!token || !clientSource) return { ok: false, message: 'MISSING_GHTK_KEYS' }

  const pickup = await getGhtkPickupConfig(db, env)
  if (!pickup.pickAddressId && (!pickup.pickName || !pickup.pickAddress || !pickup.pickProvince || !pickup.pickDistrict || !pickup.pickWard || !pickup.pickTel)) {
    return { ok: false, message: 'MISSING_GHTK_PICKUP_CONFIG' }
  }

  const parsedAddress = resolveRecipientAddressForGHTK(env, String(order?.customer_address || ''))
  if (!parsedAddress) return { ok: false, message: 'INVALID_CUSTOMER_ADDRESS_FORMAT' }
  const recipientAddress = normalizeRecipientAddressForGHTK(parsedAddress)
  if (!recipientAddress.detail || !recipientAddress.ward || !recipientAddress.district || !recipientAddress.province) {
    return { ok: false, message: 'INVALID_CUSTOMER_ADDRESS_FORMAT' }
  }

  const weight = Number(env.GHTK_DEFAULT_WEIGHT_KG || 0.5)
  const payload = {
    products: [
      {
        name: String(order?.product_name || 'San pham'),
        weight: Number.isFinite(weight) && weight > 0 ? weight : 0.5,
        quantity: Number(order?.quantity || 1) || 1,
        product_code: ''
      }
    ],
    order: {
      id: String(order?.order_code || order?.id || ''),
      pick_name: pickup.pickName,
      pick_address: pickup.pickAddress,
      pick_province: pickup.pickProvince,
      pick_district: pickup.pickDistrict,
      pick_ward: pickup.pickWard,
      pick_tel: pickup.pickTel,
      pick_address_id: pickup.pickAddressId || undefined,
      name: String(order?.customer_name || ''),
      address: recipientAddress.detail,
      province: recipientAddress.province,
      district: recipientAddress.district,
      ward: recipientAddress.ward,
      hamlet: 'Khac',
      tel: String(order?.customer_phone || ''),
      pick_money: Math.max(0, Math.round(getOrderAmountDueServer(order))),
      value: Math.max(0, Math.round(Number(order?.total_price || 0))),
      pick_option: 'cod',
      transport: 'road',
      note: String(order?.note || '').slice(0, 120)
    }
  }

  const resp = await fetch('https://services.giaohangtietkiem.vn/services/shipment/order/?ver=1.5', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Token': token,
      'X-Client-Source': clientSource
    },
    body: JSON.stringify(payload)
  })
  const body: any = await resp.json().catch(() => ({}))
  if (resp.ok && body?.success && body?.order) return { ok: true, data: body.order, usedFallbackAddress: !!recipientAddress.usedFallback }
  return { ok: false, message: String(body?.message || 'GHTK_CREATE_ORDER_FAILED'), detail: body }
}

export async function ghtkFetchLabelPdf(env: any, db: D1Database, trackingCode: string, original?: string, pageSize?: string) {
  const { token, clientSource } = await getGhtkApiCredentials(db, env)
  if (!token || !clientSource) throw new Error('MISSING_GHTK_KEYS')

  const url = 'https://services.giaohangtietkiem.vn/services/label/'
    + encodeURIComponent(String(trackingCode || '').trim())
    + '?original=' + encodeURIComponent(normalizeGHTKOriginal(original || env.GHTK_LABEL_ORIGINAL))
    + '&page_size=' + encodeURIComponent(normalizeGHTKPageSize(pageSize || env.GHTK_LABEL_PAGE_SIZE))

  const resp = await fetch(url, {
    method: 'GET',
    headers: {
      'Token': token,
      'X-Client-Source': clientSource
    }
  })
  const contentType = String(resp.headers.get('content-type') || '').toLowerCase()
  if (!resp.ok || contentType.indexOf('application/pdf') < 0) {
    const detail = await resp.text().catch(() => '')
    throw new Error('GHTK_LABEL_FETCH_FAILED:' + detail)
  }
  return new Uint8Array(await resp.arrayBuffer())
}

export async function ghtkCancelShipment(env: any, db: D1Database, trackingOrder: string) {
  const { token, clientSource } = await getGhtkApiCredentials(db, env)
  if (!token || !clientSource) throw new Error('MISSING_GHTK_KEYS')

  const code = String(trackingOrder || '').trim()
  if (!code) throw new Error('MISSING_GHTK_TRACKING_CODE')

  const resp = await fetch('https://services.giaohangtietkiem.vn/services/shipment/cancel/' + encodeURIComponent(code), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Token': token,
      'X-Client-Source': clientSource
    }
  })
  const body: any = await resp.json().catch(() => ({}))
  const message = String(body?.message || '').trim()
  const alreadyCancelled = /hủy|huy/i.test(message) && /đã|da/i.test(message)
  if (resp.ok && body?.success) return { ok: true, alreadyCancelled: false, detail: body }
  if (alreadyCancelled) return { ok: true, alreadyCancelled: true, detail: body }
  return { ok: false, message: message || 'GHTK_CANCEL_FAILED', detail: body }
}

export async function mergePdfBytes(files: Uint8Array[]) {
  const merged = await PDFDocument.create()
  for (const file of files) {
    const src = await PDFDocument.load(file)
    const pages = await merged.copyPages(src, src.getPageIndices())
    for (const p of pages) merged.addPage(p)
  }
  return await merged.save()
}

