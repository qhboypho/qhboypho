export type FlashSaleStatusKey = 'active' | 'upcoming' | 'ended' | 'disabled'

export type FlashSaleCampaignLike = {
  is_active?: number | string | boolean | null
  start_at?: string | number | Date | null
  end_at?: string | number | Date | null
}

export type FlashSaleStatus = {
  key: FlashSaleStatusKey
  label: string
  isActive: boolean
}

export type FlashSaleDisplayInput = {
  price?: number | string | null
  originalPrice?: number | string | null
  salePrice?: number | string | null
  discountPercent?: number | string | null
}

export type FlashSaleDisplay = {
  price: number
  originalPrice: number
  salePrice: number | null
  discountPercent: number | null
  hasFlashSale: boolean
  source: 'normal' | 'sale_price' | 'discount_percent'
}

function toNumber(value: unknown) {
  const num = typeof value === 'number' ? value : Number(String(value ?? '').trim())
  return Number.isFinite(num) ? num : null
}

function roundMoney(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100
}

function toTimestamp(value: FlashSaleCampaignLike['start_at'] | FlashSaleCampaignLike['end_at'] | number | string | Date | null | undefined) {
  if (value === null || value === undefined) return null
  if (value instanceof Date) {
    const ts = value.getTime()
    return Number.isFinite(ts) ? ts : null
  }
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : null
  }
  const raw = String(value).trim()
  if (!raw) return null
  if (/^\d+$/.test(raw)) {
    const numeric = Number(raw)
    return Number.isFinite(numeric) ? numeric : null
  }
  const normalized = raw.includes('T') ? raw : raw.replace(' ', 'T')
  const iso = /Z|[+-]\d{2}:?\d{2}$/.test(normalized) ? normalized : `${normalized}Z`
  const parsed = Date.parse(iso)
  if (Number.isFinite(parsed)) return parsed
  const fallback = Date.parse(raw)
  return Number.isFinite(fallback) ? fallback : null
}

function isEnabledFlag(value: FlashSaleCampaignLike['is_active']) {
  if (typeof value === 'boolean') return value
  const numeric = toNumber(value)
  if (numeric !== null) return numeric === 1
  const normalized = String(value ?? '').trim().toLowerCase()
  if (!normalized) return true
  return !['0', 'false', 'off', 'inactive', 'disabled', 'no'].includes(normalized)
}

function getStatusLabel(key: FlashSaleStatusKey) {
  switch (key) {
    case 'active':
      return 'Đang diễn ra'
    case 'upcoming':
      return 'Sắp tới'
    case 'ended':
      return 'Đã kết thúc'
    case 'disabled':
      return 'Đã vô hiệu hoá'
  }
}

export function isFlashSaleActive(campaign: FlashSaleCampaignLike | null | undefined, now: number | Date = Date.now()) {
  if (!campaign || !isEnabledFlag(campaign.is_active)) return false
  const nowTs = now instanceof Date ? now.getTime() : Number(now)
  if (!Number.isFinite(nowTs)) return false
  const startAt = toTimestamp(campaign.start_at)
  const endAt = toTimestamp(campaign.end_at)
  if (startAt === null || endAt === null) return false
  return nowTs >= startAt && nowTs < endAt
}

export function getFlashSaleStatus(campaign: FlashSaleCampaignLike | null | undefined, now: number | Date = Date.now()): FlashSaleStatus {
  if (!campaign || !isEnabledFlag(campaign.is_active)) {
    return { key: 'disabled', label: getStatusLabel('disabled'), isActive: false }
  }

  const nowTs = now instanceof Date ? now.getTime() : Number(now)
  const startAt = toTimestamp(campaign.start_at)
  const endAt = toTimestamp(campaign.end_at)

  if (!Number.isFinite(nowTs) || startAt === null || endAt === null) {
    return { key: 'disabled', label: getStatusLabel('disabled'), isActive: false }
  }

  if (nowTs >= startAt && nowTs < endAt) {
    return { key: 'active', label: getStatusLabel('active'), isActive: true }
  }

  if (nowTs < startAt) {
    return { key: 'upcoming', label: getStatusLabel('upcoming'), isActive: false }
  }

  return { key: 'ended', label: getStatusLabel('ended'), isActive: false }
}

export function resolveFlashSaleDisplay({ price, originalPrice, salePrice, discountPercent }: FlashSaleDisplayInput): FlashSaleDisplay {
  const basePrice = toNumber(originalPrice) ?? toNumber(price) ?? 0
  const normalizedOriginalPrice = basePrice > 0 ? roundMoney(basePrice) : 0
  const normalizedSalePrice = toNumber(salePrice)
  const normalizedDiscountPercent = toNumber(discountPercent)

  if (normalizedSalePrice !== null && normalizedSalePrice > 0) {
    return {
      price: roundMoney(normalizedSalePrice),
      originalPrice: normalizedOriginalPrice,
      salePrice: roundMoney(normalizedSalePrice),
      discountPercent: normalizedDiscountPercent !== null && normalizedDiscountPercent > 0 ? roundMoney(normalizedDiscountPercent) : null,
      hasFlashSale: true,
      source: 'sale_price'
    }
  }

  if (normalizedDiscountPercent !== null && normalizedDiscountPercent > 0) {
    const discount = Math.min(normalizedDiscountPercent, 100)
    const referencePrice = normalizedOriginalPrice > 0 ? normalizedOriginalPrice : roundMoney(toNumber(price) ?? 0)
    const derivedPrice = roundMoney(referencePrice * (1 - discount / 100))
    if (derivedPrice > 0) {
      return {
        price: derivedPrice,
        originalPrice: referencePrice,
        salePrice: null,
        discountPercent: roundMoney(discount),
        hasFlashSale: true,
        source: 'discount_percent'
      }
    }
  }

  const fallbackPrice = roundMoney(toNumber(price) ?? normalizedOriginalPrice)
  return {
    price: fallbackPrice > 0 ? fallbackPrice : 0,
    originalPrice: normalizedOriginalPrice > 0 ? normalizedOriginalPrice : fallbackPrice,
    salePrice: null,
    discountPercent: null,
    hasFlashSale: false,
    source: 'normal'
  }
}
