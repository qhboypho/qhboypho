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
  if (value === null || value === undefined) return null
  if (typeof value === 'number') return Number.isFinite(value) ? value : null
  const raw = String(value).trim()
  if (!raw) return null
  const num = Number(raw)
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
  const parsed = Date.parse(normalized)
  if (Number.isFinite(parsed)) return parsed
  const iso = /Z|[+-]\d{2}:?\d{2}$/.test(normalized) ? normalized : `${normalized}Z`
  const fallback = Date.parse(iso)
  return Number.isFinite(fallback) ? fallback : null
}
function toInclusiveEndTimestamp(value: FlashSaleCampaignLike['end_at'] | number | string | Date | null | undefined) {
  const parsed = toTimestamp(value)
  if (parsed === null) return null
  if (value instanceof Date || typeof value === 'number') return parsed
  const raw = String(value ?? '').trim()
  if (!raw) return parsed
  const normalized = raw.includes('T') ? raw : raw.replace(' ', 'T')
  const timeMatch = normalized.match(/T(\d{2}):(\d{2})(?::(\d{2})(?:\.\d{1,3})?)?/) 
  if (!timeMatch) {
    return parsed + (24 * 60 * 60 * 1000) - 1
  }
  const hours = Number(timeMatch[1])
  const minutes = Number(timeMatch[2])
  const seconds = Number(timeMatch[3] ?? '0')
  if (hours === 0 && minutes === 0 && seconds === 0) {
    return parsed + (24 * 60 * 60 * 1000) - 1
  }
  return parsed
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
  const endAt = toInclusiveEndTimestamp(campaign.end_at)
  if (startAt === null || endAt === null) return false
  return nowTs >= startAt && nowTs <= endAt
}

export function getFlashSaleStatus(campaign: FlashSaleCampaignLike | null | undefined, now: number | Date = Date.now()): FlashSaleStatus {
  if (!campaign || !isEnabledFlag(campaign.is_active)) {
    return { key: 'disabled', label: getStatusLabel('disabled'), isActive: false }
  }

  const nowTs = now instanceof Date ? now.getTime() : Number(now)
  const startAt = toTimestamp(campaign.start_at)
  const endAt = toInclusiveEndTimestamp(campaign.end_at)

  if (!Number.isFinite(nowTs) || startAt === null || endAt === null) {
    return { key: 'disabled', label: getStatusLabel('disabled'), isActive: false }
  }

  if (nowTs >= startAt && nowTs <= endAt) {
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

type FlashSaleProductShapeInput = {
  product: Record<string, any>
  campaign?: FlashSaleCampaignLike & { id?: number | string | null; name?: string | null }
  item?: {
    sale_price?: number | string | null
    discount_percent?: number | string | null
    purchase_limit?: number | string | null
    is_enabled?: number | string | boolean | null
  } | null
}

export type FlashSaleProductJoinRow = {
  id?: number | string | null
  name?: string | null
  description?: string | null
  price?: number | string | null
  original_price?: number | string | null
  category?: string | null
  brand?: string | null
  material?: string | null
  thumbnail?: string | null
  images?: string | null
  colors?: string | null
  sizes?: string | null
  stock?: number | string | null
  is_active?: number | string | boolean | null
  is_featured?: number | string | boolean | null
  is_trending?: number | string | boolean | null
  trending_order?: number | string | null
  display_order?: number | string | null
  created_at?: string | null
  updated_at?: string | null
  product_id?: number | string | null
  product_name?: string | null
  product_description?: string | null
  product_price?: number | string | null
  product_original_price?: number | string | null
  product_category?: string | null
  product_brand?: string | null
  product_material?: string | null
  product_thumbnail?: string | null
  product_images?: string | null
  product_colors?: string | null
  product_sizes?: string | null
  product_stock?: number | string | null
  product_is_active?: number | string | boolean | null
  product_is_featured?: number | string | boolean | null
  product_is_trending?: number | string | boolean | null
  product_trending_order?: number | string | null
  product_display_order?: number | string | null
  product_created_at?: string | null
  product_updated_at?: string | null
  product_sku_id?: number | string | null
  product_sku_code?: string | null
  product_sku_color?: string | null
  product_sku_size?: string | null
  product_sku_image?: string | null
  product_sku_price?: number | string | null
  product_sku_original_price?: number | string | null
  product_sku_stock?: number | string | null
  product_sku_is_active?: number | string | boolean | null
  flash_sale_id?: number | string | null
  flash_sale_name?: string | null
  flash_sale_start_at?: string | null
  flash_sale_end_at?: string | null
  flash_sale_is_active?: number | string | boolean | null
  flash_sale_sale_price?: number | string | null
  flash_sale_discount_percent?: number | string | null
  flash_sale_purchase_limit?: number | string | null
  flash_sale_is_enabled?: number | string | boolean | null
}

function normalizeOptionalNumber(value: unknown) {
  if (value === null || value === undefined) return null
  const num = typeof value === 'number' ? value : Number(String(value).trim())
  return Number.isFinite(num) ? num : null
}

function normalizeOptionalBoolean(value: unknown) {
  if (typeof value === 'boolean') return value
  const numeric = normalizeOptionalNumber(value)
  if (numeric !== null) return numeric === 1
  const normalized = String(value ?? '').trim().toLowerCase()
  if (!normalized) return true
  return !['0', 'false', 'off', 'inactive', 'disabled', 'no'].includes(normalized)
}

export function shapeFlashSaleProduct(input: FlashSaleProductShapeInput) {
  const product = input?.product || {}
  const campaign = input?.campaign || null
  const item = input?.item || null
  const campaignStatus = campaign ? getFlashSaleStatus(campaign) : { key: 'disabled' as FlashSaleStatusKey, label: 'Đã vô hiệu hoá', isActive: false }
  const hasFlashSale = Boolean(campaign && item && campaignStatus.isActive)
  const display = resolveFlashSaleDisplay({
    price: product.price,
    originalPrice: product.original_price,
    salePrice: hasFlashSale ? item?.sale_price : null,
    discountPercent: hasFlashSale ? item?.discount_percent : null
  })
  const flashSale = hasFlashSale
    ? {
        id: normalizeOptionalNumber(campaign?.id),
        name: String(campaign?.name || '').trim(),
        start_at: String(campaign?.start_at || '').trim(),
        end_at: String(campaign?.end_at || '').trim(),
        status: campaignStatus,
        status_key: campaignStatus.key,
        status_label: campaignStatus.label,
        sale_price: normalizeOptionalNumber(item?.sale_price),
        discount_percent: normalizeOptionalNumber(item?.discount_percent),
        purchase_limit: Math.max(0, Math.floor(normalizeOptionalNumber(item?.purchase_limit) ?? 0)),
        is_enabled: normalizeOptionalBoolean(item?.is_enabled),
        has_flash_sale: hasFlashSale
      }
    : null

  return {
    ...product,
    has_flash_sale: hasFlashSale,
    display_price: display.price,
    display_original_price: display.originalPrice,
    display_sale_price: display.salePrice,
    display_discount_percent: display.discountPercent,
    flash_sale: flashSale
  }
}

export function shapeFlashSaleProductRow(row: FlashSaleProductJoinRow) {
  const product = {
    id: normalizeOptionalNumber(row.product_id ?? row.id),
    name: String(row.product_name ?? row.name ?? '').trim(),
    description: row.product_description ?? row.description ?? '',
    price: row.product_price ?? row.price,
    original_price: row.product_original_price ?? row.original_price,
    category: row.product_category ?? row.category ?? 'unisex',
    brand: row.product_brand ?? row.brand ?? '',
    material: row.product_material ?? row.material ?? '',
    thumbnail: row.product_thumbnail ?? row.thumbnail ?? '',
    images: row.product_images ?? row.images ?? '[]',
    colors: row.product_colors ?? row.colors ?? '[]',
    sizes: row.product_sizes ?? row.sizes ?? '[]',
    stock: row.product_stock ?? row.stock ?? 0,
    is_active: row.product_is_active ?? row.is_active ?? 0,
    is_featured: row.product_is_featured ?? row.is_featured ?? 0,
    is_trending: row.product_is_trending ?? row.is_trending ?? 0,
    trending_order: row.product_trending_order ?? row.trending_order ?? 0,
    display_order: row.product_display_order ?? row.display_order ?? 0,
    created_at: row.product_created_at ?? row.created_at ?? null,
    updated_at: row.product_updated_at ?? row.updated_at ?? null
  }

  const campaign = row.flash_sale_id === null || row.flash_sale_id === undefined
    ? null
    : {
        id: row.flash_sale_id,
        name: row.flash_sale_name,
        start_at: row.flash_sale_start_at,
        end_at: row.flash_sale_end_at,
        is_active: row.flash_sale_is_active
      }

  const item = row.flash_sale_id === null || row.flash_sale_id === undefined
    ? null
    : {
        sale_price: row.flash_sale_sale_price,
        discount_percent: row.flash_sale_discount_percent,
        purchase_limit: row.flash_sale_purchase_limit,
        is_enabled: row.flash_sale_is_enabled
      }

  return shapeFlashSaleProduct({ product, campaign, item })
}

export async function loadActiveFlashSaleProductMap(db: D1Database, productIds: Array<number | string | null | undefined>) {
  const normalizedIds = [...new Set(productIds.map(normalizeOptionalNumber).filter((value): value is number => value !== null))]
  if (normalizedIds.length === 0) return new Map<number, FlashSaleProductJoinRow>()

  const placeholders = normalizedIds.map(() => '?').join(', ')
  const result = await db.prepare(`
    SELECT
      p.id AS product_id,
      p.name AS product_name,
      p.description AS product_description,
      p.price AS product_price,
      p.original_price AS product_original_price,
      p.category AS product_category,
      p.brand AS product_brand,
      p.material AS product_material,
      p.thumbnail AS product_thumbnail,
      p.images AS product_images,
      p.colors AS product_colors,
      p.sizes AS product_sizes,
      p.stock AS product_stock,
      p.is_active AS product_is_active,
      p.is_featured AS product_is_featured,
      p.is_trending AS product_is_trending,
      p.trending_order AS product_trending_order,
      p.display_order AS product_display_order,
      p.created_at AS product_created_at,
      p.updated_at AS product_updated_at,
      ps.id AS product_sku_id,
      ps.sku_code AS product_sku_code,
      ps.color AS product_sku_color,
      ps.size AS product_sku_size,
      ps.image AS product_sku_image,
      ps.price AS product_sku_price,
      ps.original_price AS product_sku_original_price,
      ps.stock AS product_sku_stock,
      ps.is_active AS product_sku_is_active,
      fs.id AS flash_sale_id,
      fs.name AS flash_sale_name,
      fs.start_at AS flash_sale_start_at,
      fs.end_at AS flash_sale_end_at,
      fs.is_active AS flash_sale_is_active,
      fsi.sale_price AS flash_sale_sale_price,
      fsi.discount_percent AS flash_sale_discount_percent,
      fsi.purchase_limit AS flash_sale_purchase_limit,
      fsi.is_enabled AS flash_sale_is_enabled
    FROM flash_sale_items fsi
    JOIN flash_sales fs ON fs.id = fsi.flash_sale_id
    JOIN product_skus ps ON ps.id = fsi.product_sku_id
    JOIN products p ON p.id = ps.product_id
    WHERE p.id IN (${placeholders})
    ORDER BY datetime(fs.start_at) DESC, fs.id DESC, fsi.id DESC
  `).bind(...normalizedIds).all() as { results?: FlashSaleProductJoinRow[] }

  const map = new Map<number, FlashSaleProductJoinRow>()
  for (const row of result.results || []) {
    const productSkuId = normalizeOptionalNumber(row.product_sku_id)
    if (productSkuId === null || map.has(productSkuId)) continue
    const status = getFlashSaleStatus({
      is_active: row.flash_sale_is_active,
      start_at: row.flash_sale_start_at,
      end_at: row.flash_sale_end_at
    })
    if (!status.isActive) continue
    if (!normalizeOptionalBoolean(row.flash_sale_is_enabled)) continue
    map.set(productSkuId, row)
  }
  return map
}
