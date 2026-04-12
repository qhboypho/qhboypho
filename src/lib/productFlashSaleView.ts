import {
  getFlashSaleStatus,
  resolveFlashSaleDisplay,
  type FlashSaleProductJoinRow,
  type FlashSaleStatusKey
} from './flashSaleHelpers.ts'
import type { ProductSkuLike } from './productSkuHelpers.ts'

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

function buildFlashSaleContext(row: FlashSaleProductJoinRow | null | undefined) {
  if (!row) return null
  return {
    id: row.flash_sale_id,
    name: row.flash_sale_name,
    start_at: row.flash_sale_start_at,
    end_at: row.flash_sale_end_at,
    is_active: row.flash_sale_is_active
  }
}

function buildFlashSaleItem(row: FlashSaleProductJoinRow | null | undefined) {
  if (!row) return null
  return {
    sale_price: row.flash_sale_sale_price,
    discount_percent: row.flash_sale_discount_percent,
    purchase_limit: row.flash_sale_purchase_limit,
    is_enabled: row.flash_sale_is_enabled
  }
}

function buildFlatFlashSale(row: FlashSaleProductJoinRow | null | undefined, hasFlashSale: boolean, status: { key: FlashSaleStatusKey; label: string; isActive: boolean }) {
  if (!row || !hasFlashSale) return null
  return {
    id: normalizeOptionalNumber(row.flash_sale_id),
    name: String(row.flash_sale_name || '').trim(),
    start_at: String(row.flash_sale_start_at || '').trim(),
    end_at: String(row.flash_sale_end_at || '').trim(),
    status,
    status_key: status.key,
    status_label: status.label,
    sale_price: normalizeOptionalNumber(row.flash_sale_sale_price),
    discount_percent: normalizeOptionalNumber(row.flash_sale_discount_percent),
    purchase_limit: Math.max(0, Math.floor(normalizeOptionalNumber(row.flash_sale_purchase_limit) ?? 0)),
    is_enabled: normalizeOptionalBoolean(row.flash_sale_is_enabled),
    has_flash_sale: true
  }
}

export function shapeSkuWithFlashSale(sku: ProductSkuLike, flashSaleRow?: FlashSaleProductJoinRow | null) {
  const campaign = buildFlashSaleContext(flashSaleRow)
  const item = buildFlashSaleItem(flashSaleRow)
  const status = campaign ? getFlashSaleStatus(campaign) : { key: 'disabled' as FlashSaleStatusKey, label: 'Đã vô hiệu hoá', isActive: false }
  const hasFlashSale = Boolean(campaign && item && status.isActive && normalizeOptionalBoolean(item.is_enabled))
  const display = resolveFlashSaleDisplay({
    price: sku.price,
    originalPrice: sku.original_price,
    salePrice: hasFlashSale ? item?.sale_price : null,
    discountPercent: hasFlashSale ? item?.discount_percent : null
  })

  const flatFlashSale = buildFlatFlashSale(flashSaleRow, hasFlashSale, status)
  return {
    ...sku,
    has_flash_sale: hasFlashSale,
    display_price: display.price,
    display_original_price: display.originalPrice,
    display_sale_price: display.salePrice,
    display_discount_percent: display.discountPercent,
    flash_sale: hasFlashSale
      ? {
          ...flatFlashSale,
          campaign,
          item: {
            ...item,
            sale_price: normalizeOptionalNumber(item?.sale_price),
            discount_percent: normalizeOptionalNumber(item?.discount_percent),
            purchase_limit: Math.max(0, Math.floor(normalizeOptionalNumber(item?.purchase_limit) ?? 0)),
            is_enabled: normalizeOptionalBoolean(item?.is_enabled)
          }
        }
      : null
  }
}

export function attachSkuStateToProduct(
  product: Record<string, any>,
  skuRows: ProductSkuLike[] | null | undefined,
  activeFlashSaleRows: Map<number, FlashSaleProductJoinRow>
) {
  const sourceRows = Array.isArray(skuRows) ? skuRows : []
  const skus = sourceRows.map((sku) => shapeSkuWithFlashSale(sku, activeFlashSaleRows.get(Number(sku.id))))
  const activeSkuSales = skus.filter((sku) => sku.has_flash_sale)
  const bestSkuSale = activeSkuSales.sort((left, right) => {
    const leftPrice = Number(left.display_price ?? left.price ?? 0)
    const rightPrice = Number(right.display_price ?? right.price ?? 0)
    return leftPrice - rightPrice
  })[0] || null

  if (!bestSkuSale) {
    return {
      ...product,
      skus,
      product_skus: skus
    }
  }

  return {
    ...product,
    has_flash_sale: true,
    display_price: Number(bestSkuSale.display_price ?? product.display_price ?? product.price ?? 0),
    display_original_price: Number(bestSkuSale.display_original_price ?? product.display_original_price ?? product.original_price ?? product.price ?? 0),
    display_sale_price: bestSkuSale.display_sale_price ?? null,
    display_discount_percent: bestSkuSale.display_discount_percent ?? null,
    flash_sale: bestSkuSale.flash_sale,
    skus,
    product_skus: skus
  }
}
