import { PDFDocument } from 'pdf-lib'
import type { AppBindings } from '../types/app'

export type GhtkPickupConfig = {
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

const GHTK_PICKUP_SETTING_KEYS = [
  'ghtk_pick_address_id',
  'ghtk_pick_name',
  'ghtk_pick_address',
  'ghtk_pick_province',
  'ghtk_pick_district',
  'ghtk_pick_ward',
  'ghtk_pick_tel'
] as const

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
  const query = `SELECT key, value FROM app_settings WHERE key IN (${GHTK_PICKUP_SETTING_KEYS.map(() => '?').join(',')})`
  const result = await db.prepare(query).bind(...GHTK_PICKUP_SETTING_KEYS).all()
  const map = new Map<string, string>()
  for (const row of (result.results || []) as any[]) {
    map.set(String(row.key || ''), String(row.value || ''))
  }
  const dbValue = (key: string) => String(map.get(key) || '').trim()
  return {
    pickAddressId: dbValue('ghtk_pick_address_id'),
    pickName: dbValue('ghtk_pick_name') || String(env.GHTK_PICK_NAME || '').trim(),
    pickAddress: dbValue('ghtk_pick_address') || String(env.GHTK_PICK_ADDRESS || '').trim(),
    pickProvince: dbValue('ghtk_pick_province') || String(env.GHTK_PICK_PROVINCE || '').trim(),
    pickDistrict: dbValue('ghtk_pick_district') || String(env.GHTK_PICK_DISTRICT || '').trim(),
    pickWard: dbValue('ghtk_pick_ward') || String(env.GHTK_PICK_WARD || '').trim(),
    pickTel: dbValue('ghtk_pick_tel') || String(env.GHTK_PICK_TEL || '').trim()
  }
}

export async function ghtkFetchPickupAddresses(env: AppBindings): Promise<GhtkPickupAddressFetchResult> {
  const token = String(env.GHTK_TOKEN || '').trim()
  const clientSource = String(env.GHTK_CLIENT_SOURCE || '').trim()
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
  const token = String(env.GHTK_TOKEN || '').trim()
  const clientSource = String(env.GHTK_CLIENT_SOURCE || '').trim()
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

export async function ghtkFetchLabelPdf(env: any, trackingCode: string, original?: string, pageSize?: string) {
  const token = String(env.GHTK_TOKEN || '').trim()
  const clientSource = String(env.GHTK_CLIENT_SOURCE || '').trim()
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

export async function ghtkCancelShipment(env: any, trackingOrder: string) {
  const token = String(env.GHTK_TOKEN || '').trim()
  const clientSource = String(env.GHTK_CLIENT_SOURCE || '').trim()
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

