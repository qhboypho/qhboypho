export type AutoVoucherScope = 'all' | 'products'

export type AutoVoucher = {
  id: number
  name: string
  discount_amount: number
  scope: AutoVoucherScope
  product_ids: number[]
  show_badge: number
  is_active: number
  valid_from: string
  valid_to: string
  created_at?: string
  updated_at?: string
}

function toNumber(value: unknown, fallback = 0) {
  const num = typeof value === 'number' ? value : Number(String(value ?? '').trim())
  return Number.isFinite(num) ? num : fallback
}

function roundMoney(value: number) {
  return Math.max(0, Math.round((value + Number.EPSILON) * 100) / 100)
}

function parseProductIds(raw: unknown): number[] {
  if (Array.isArray(raw)) {
    return raw.map((value) => Math.floor(toNumber(value, 0))).filter((value) => value > 0)
  }
  try {
    const parsed = JSON.parse(String(raw || '[]'))
    return parseProductIds(parsed)
  } catch {
    return []
  }
}

function normalizeScope(value: unknown): AutoVoucherScope {
  return String(value || '').trim().toLowerCase() === 'products' ? 'products' : 'all'
}

function normalizeAutoVoucher(row: any): AutoVoucher {
  return {
    id: Math.floor(toNumber(row?.id, 0)),
    name: String(row?.name || '').trim(),
    discount_amount: roundMoney(toNumber(row?.discount_amount, 0)),
    scope: normalizeScope(row?.scope),
    product_ids: parseProductIds(row?.product_ids),
    show_badge: toNumber(row?.show_badge, 1) === 0 ? 0 : 1,
    is_active: toNumber(row?.is_active, 0) === 1 ? 1 : 0,
    valid_from: String(row?.valid_from || '').trim(),
    valid_to: String(row?.valid_to || '').trim(),
    created_at: row?.created_at,
    updated_at: row?.updated_at
  }
}

function isWithinVoucherWindow(voucher: AutoVoucher, nowIso: string) {
  if (!voucher.valid_from || !voucher.valid_to) return true
  return voucher.valid_from <= nowIso && voucher.valid_to >= nowIso
}

export function normalizeAutoVoucherInput(input: any) {
  const name = String(input?.name || '').trim().slice(0, 120)
  const discountAmount = roundMoney(toNumber(input?.discount_amount, 0))
  const scope = normalizeScope(input?.scope)
  const productIds = scope === 'products' ? [...new Set(parseProductIds(input?.product_ids))] : []
  const showBadge = input?.show_badge === undefined ? 1 : (toNumber(input?.show_badge, 0) === 1 || input?.show_badge === true ? 1 : 0)
  const isActive = input?.is_active === undefined ? 1 : (toNumber(input?.is_active, 0) === 1 || input?.is_active === true ? 1 : 0)
  const validFrom = String(input?.valid_from || '').trim()
  const validTo = String(input?.valid_to || '').trim()
  return { name, discountAmount, scope, productIds, showBadge, isActive, validFrom, validTo }
}

export async function ensureAutoVoucherSchema(db: D1Database) {
  await db.prepare(`
    CREATE TABLE IF NOT EXISTS auto_vouchers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      discount_amount REAL NOT NULL,
      scope TEXT NOT NULL DEFAULT 'all',
      product_ids TEXT NOT NULL DEFAULT '[]',
      show_badge INTEGER NOT NULL DEFAULT 1,
      is_active INTEGER NOT NULL DEFAULT 1,
      valid_from DATETIME,
      valid_to DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `).run()
  const columns = await db.prepare(`PRAGMA table_info(auto_vouchers)`).all()
  const columnNames = new Set(((columns.results || []) as any[]).map((row) => String(row.name || '')))
  if (!columnNames.has('show_badge')) {
    await db.prepare(`ALTER TABLE auto_vouchers ADD COLUMN show_badge INTEGER NOT NULL DEFAULT 1`).run()
  }
  await db.prepare(`CREATE INDEX IF NOT EXISTS idx_auto_vouchers_active ON auto_vouchers(is_active)`).run()
  await db.prepare(`CREATE INDEX IF NOT EXISTS idx_auto_vouchers_scope ON auto_vouchers(scope)`).run()
}

export async function loadActiveAutoVouchers(db: D1Database, nowIso = new Date().toISOString()): Promise<AutoVoucher[]> {
  await ensureAutoVoucherSchema(db)
  const res = await db.prepare(`
    SELECT *
    FROM auto_vouchers
    WHERE is_active = 1
      AND (valid_from IS NULL OR valid_from = '' OR valid_from <= ?)
      AND (valid_to IS NULL OR valid_to = '' OR valid_to >= ?)
    ORDER BY discount_amount DESC, id DESC
  `).bind(nowIso, nowIso).all()
  return ((res.results || []) as any[])
    .map(normalizeAutoVoucher)
    .filter((voucher) => voucher.discount_amount > 0 && isWithinVoucherWindow(voucher, nowIso))
}

export function findBestAutoVoucherForProduct(productId: unknown, vouchers: AutoVoucher[]) {
  const id = Math.floor(toNumber(productId, 0))
  if (!id) return null
  return (Array.isArray(vouchers) ? vouchers : []).find((voucher) => {
    if (!voucher || voucher.discount_amount <= 0) return false
    if (voucher.scope === 'all') return true
    return voucher.product_ids.includes(id)
  }) || null
}

export function applyAutoVoucherToProduct(product: Record<string, any>, voucher: AutoVoucher | null | undefined) {
  const baseProduct = { ...product }
  if (!voucher || baseProduct.has_flash_sale) return baseProduct
  const price = roundMoney(toNumber(baseProduct.price, 0))
  if (price <= 0) return baseProduct
  const discount = Math.min(price, roundMoney(toNumber(voucher.discount_amount, 0)))
  if (discount <= 0) return baseProduct
  const finalPrice = roundMoney(price - discount)
  const originalPrice = roundMoney(toNumber(baseProduct.original_price, price))
  return {
    ...baseProduct,
    has_auto_voucher: true,
    display_price: finalPrice,
    display_original_price: originalPrice > 0 ? originalPrice : price,
    display_auto_voucher_discount: discount,
    auto_voucher: {
      id: voucher.id,
      name: voucher.name,
      discount_amount: discount,
      scope: voucher.scope,
      show_badge: voucher.show_badge
    }
  }
}

export async function applyAutoVouchersToProducts(db: D1Database, products: Record<string, any>[]) {
  const list = Array.isArray(products) ? products : []
  if (!list.length) return list
  const vouchers = await loadActiveAutoVouchers(db)
  if (!vouchers.length) return list.map((product) => ({ ...product }))
  return list.map((product) => applyAutoVoucherToProduct(product, findBestAutoVoucherForProduct(product?.id, vouchers)))
}

export async function resolveAutoVoucherProductPrice(db: D1Database, product: Record<string, any>, unitOverride?: Record<string, any>) {
  const base = unitOverride
    ? {
        ...product,
        price: unitOverride.price ?? product.price,
        original_price: unitOverride.original_price ?? product.original_price,
        has_flash_sale: unitOverride.has_flash_sale ?? product.has_flash_sale,
        display_price: unitOverride.display_price ?? unitOverride.price ?? product.display_price,
        display_original_price: unitOverride.display_original_price ?? unitOverride.original_price ?? product.display_original_price,
        display_sale_price: unitOverride.display_sale_price ?? product.display_sale_price,
        display_discount_percent: unitOverride.display_discount_percent ?? product.display_discount_percent,
        flash_sale: unitOverride.flash_sale ?? product.flash_sale
      }
    : product
  const [shaped] = await applyAutoVouchersToProducts(db, [base])
  return roundMoney(toNumber(shaped?.display_price ?? shaped?.price, 0))
}
