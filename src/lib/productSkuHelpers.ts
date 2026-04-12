export type ProductSkuLike = {
  id?: number | string | null
  product_id?: number | string | null
  sku_code?: string | null
  color?: string | null
  size?: string | null
  image?: string | null
  price?: number | string | null
  original_price?: number | string | null
  stock?: number | string | null
  is_active?: number | string | boolean | null
  created_at?: string | null
  updated_at?: string | null
}

type ProductColorOption = {
  name: string
  image: string
}

type ProductLike = {
  id?: number | string | null
  price?: number | string | null
  original_price?: number | string | null
  stock?: number | string | null
  is_active?: number | string | boolean | null
  thumbnail?: string | null
  colors?: unknown
  sizes?: unknown
}

export type ProductSkuDescriptor = {
  key: string
  color: string
  size: string
  image: string
  sku_code: string
  price: number
  original_price: number | null
  stock: number
  is_active: number
}

function normalizeNumber(value: unknown) {
  if (value === null || value === undefined) return null
  if (typeof value === 'number') return Number.isFinite(value) ? value : null
  const raw = String(value).trim()
  if (!raw) return null
  const num = Number(raw)
  return Number.isFinite(num) ? num : null
}

function normalizeBooleanFlag(value: unknown) {
  if (typeof value === 'boolean') return value
  const numeric = normalizeNumber(value)
  if (numeric !== null) return numeric === 1
  const normalized = String(value ?? '').trim().toLowerCase()
  if (!normalized) return true
  return !['0', 'false', 'off', 'inactive', 'disabled', 'no'].includes(normalized)
}

function safeJsonArray(input: unknown) {
  if (Array.isArray(input)) return input
  try {
    const parsed = JSON.parse(String(input ?? '[]'))
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function normalizeToken(value: unknown) {
  return String(value ?? '').trim()
}

function normalizeKeyToken(value: unknown) {
  return normalizeToken(value).toLowerCase()
}

export function parseProductColorOptions(raw: unknown): ProductColorOption[] {
  return safeJsonArray(raw)
    .map((item) => {
      if (typeof item === 'string') {
        return { name: normalizeToken(item), image: '' }
      }
      if (item && typeof item === 'object') {
        return {
          name: normalizeToken((item as any).name ?? (item as any).label),
          image: normalizeToken((item as any).image ?? (item as any).image_url)
        }
      }
      return { name: '', image: '' }
    })
    .filter((item) => item.name)
}

export function parseProductSizes(raw: unknown): string[] {
  return safeJsonArray(raw)
    .map((item) => normalizeToken(item))
    .filter(Boolean)
}

function makeSkuDescriptorKey(color: string, size: string) {
  return normalizeKeyToken(color) + '::' + normalizeKeyToken(size)
}

function slugifyToken(value: string, fallback: string) {
  const normalized = value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toUpperCase()
  return normalized || fallback
}

export function buildDesiredProductSkus(product: ProductLike): ProductSkuDescriptor[] {
  const colors = parseProductColorOptions(product?.colors)
  const sizes = parseProductSizes(product?.sizes)
  const price = normalizeNumber(product?.price) ?? 0
  const originalPrice = normalizeNumber(product?.original_price)
  const stock = Math.max(0, Math.floor(normalizeNumber(product?.stock) ?? 0))
  const isActive = normalizeBooleanFlag(product?.is_active) ? 1 : 0
  const fallbackImage = normalizeToken(product?.thumbnail)
  const productId = Math.max(0, Math.floor(normalizeNumber(product?.id) ?? 0))

  const colorOptions = colors.length
    ? colors.map((color) => ({ color: color.name, image: color.image || fallbackImage }))
    : [{ color: '', image: fallbackImage }]
  const sizeOptions = sizes.length ? sizes : ['']

  const seenCodes = new Set<string>()
  const descriptors: ProductSkuDescriptor[] = []

  for (const colorOption of colorOptions) {
    for (const size of sizeOptions) {
      const color = normalizeToken(colorOption.color)
      const normalizedSize = normalizeToken(size)
      const baseCode = [
        'SKU',
        productId > 0 ? String(productId) : 'NEW',
        slugifyToken(color, 'DEFAULT'),
        slugifyToken(normalizedSize, 'ONE')
      ].join('-')
      let skuCode = baseCode
      let dedupe = 2
      while (seenCodes.has(skuCode)) {
        skuCode = baseCode + '-' + dedupe
        dedupe += 1
      }
      seenCodes.add(skuCode)
      descriptors.push({
        key: makeSkuDescriptorKey(color, normalizedSize),
        color,
        size: normalizedSize,
        image: normalizeToken(colorOption.image) || fallbackImage,
        sku_code: skuCode,
        price,
        original_price: originalPrice,
        stock,
        is_active: isActive
      })
    }
  }

  return descriptors.length
    ? descriptors
    : [{
        key: makeSkuDescriptorKey('', ''),
        color: '',
        size: '',
        image: fallbackImage,
        sku_code: ['SKU', productId > 0 ? String(productId) : 'NEW', 'DEFAULT', 'ONE'].join('-'),
        price,
        original_price: originalPrice,
        stock,
        is_active: isActive
      }]
}

export async function syncProductSkus(db: D1Database, product: ProductLike) {
  const productId = Math.max(0, Math.floor(normalizeNumber(product?.id) ?? 0))
  if (!productId) return []

  const desired = buildDesiredProductSkus({ ...product, id: productId })
  const desiredByKey = new Map(desired.map((sku) => [sku.key, sku]))
  const existingResult = await db.prepare(`
    SELECT id, product_id, sku_code, color, size, image, price, original_price, stock, is_active
    FROM product_skus
    WHERE product_id = ?
    ORDER BY id ASC
  `).bind(productId).all() as { results?: ProductSkuLike[] }
  const existingRows = existingResult.results || []
  const existingByKey = new Map(existingRows.map((row) => [makeSkuDescriptorKey(String(row.color || ''), String(row.size || '')), row]))

  for (const sku of desired) {
    const existing = existingByKey.get(sku.key)
    if (existing?.id) {
      await db.prepare(`
        UPDATE product_skus
        SET sku_code = ?, image = ?, price = ?, original_price = ?, stock = ?, is_active = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).bind(
        sku.sku_code,
        sku.image,
        sku.price,
        sku.original_price,
        sku.stock,
        sku.is_active,
        existing.id
      ).run()
      continue
    }

    await db.prepare(`
      INSERT INTO product_skus (product_id, sku_code, color, size, image, price, original_price, stock, is_active)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      productId,
      sku.sku_code,
      sku.color,
      sku.size,
      sku.image,
      sku.price,
      sku.original_price,
      sku.stock,
      sku.is_active
    ).run()
  }

  for (const existing of existingRows) {
    const key = makeSkuDescriptorKey(String(existing.color || ''), String(existing.size || ''))
    if (desiredByKey.has(key)) continue
    await db.prepare(`
      UPDATE product_skus
      SET is_active = 0, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).bind(existing.id).run()
  }

  const synced = await db.prepare(`
    SELECT id, product_id, sku_code, color, size, image, price, original_price, stock, is_active, created_at, updated_at
    FROM product_skus
    WHERE product_id = ?
    ORDER BY color ASC, size ASC, id ASC
  `).bind(productId).all() as { results?: ProductSkuLike[] }
  return synced.results || []
}

export async function loadProductSkusByProductIds(
  db: D1Database,
  productIds: Array<number | string | null | undefined>,
  options?: { includeInactive?: boolean }
) {
  const normalizedIds = [...new Set(productIds.map((value) => Math.floor(normalizeNumber(value) ?? 0)).filter((value) => value > 0))]
  const map = new Map<number, ProductSkuLike[]>()
  if (!normalizedIds.length) return map

  const placeholders = normalizedIds.map(() => '?').join(', ')
  const includeInactive = options?.includeInactive === true
  const result = await db.prepare(`
    SELECT id, product_id, sku_code, color, size, image, price, original_price, stock, is_active, created_at, updated_at
    FROM product_skus
    WHERE product_id IN (${placeholders})
    ${includeInactive ? '' : 'AND is_active = 1'}
    ORDER BY product_id ASC, color ASC, size ASC, id ASC
  `).bind(...normalizedIds).all() as { results?: ProductSkuLike[] }

  for (const row of result.results || []) {
    const productId = Math.floor(normalizeNumber(row.product_id) ?? 0)
    if (!map.has(productId)) map.set(productId, [])
    map.get(productId)?.push(row)
  }
  return map
}

export function findProductSkuMatch(
  skus: ProductSkuLike[] | null | undefined,
  color: unknown,
  size: unknown
) {
  const rows = Array.isArray(skus) ? skus : []
  if (!rows.length) return null

  const targetColor = normalizeKeyToken(color)
  const targetSize = normalizeKeyToken(size)
  const activeRows = rows.filter((row) => normalizeBooleanFlag(row.is_active))

  const exact = activeRows.find((row) => makeSkuDescriptorKey(row.color, row.size) === makeSkuDescriptorKey(targetColor, targetSize))
  if (exact) return exact

  if (targetColor) {
    const colorOnly = activeRows.find((row) => normalizeKeyToken(row.color) === targetColor && !normalizeToken(row.size))
    if (colorOnly) return colorOnly
  }

  if (targetSize) {
    const sizeOnly = activeRows.find((row) => normalizeKeyToken(row.size) === targetSize && !normalizeToken(row.color))
    if (sizeOnly) return sizeOnly
  }

  return activeRows[0] || rows[0] || null
}
