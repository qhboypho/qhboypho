export type AdminPermissionKey =
  | 'dashboard'
  | 'products'
  | 'product-types'
  | 'orders'
  | 'returns'
  | 'customers'
  | 'marketplaces'
  | 'live-chat'
  | 'reviews'
  | 'backup'
  | 'vouchers'
  | 'featured'
  | 'flashsale'
  | 'settings-social'
  | 'settings-payment'
  | 'settings-text-ui'
  | 'settings-images'
  | 'settings-notifications'
  | 'settings-admin-ui'
  | 'settings-warehouse'

export type AdminPermissionEntry = {
  visible: boolean
  view: boolean
  edit: boolean
}

export type AdminPermissionMap = Record<AdminPermissionKey, AdminPermissionEntry>

type AppSettingRow = {
  value?: string | null
}

export const ADMIN_PERMISSION_ITEMS: Array<{ key: AdminPermissionKey, label: string, group: string }> = [
  { key: 'dashboard', label: 'Dashboard', group: 'Tổng quan' },
  { key: 'products', label: 'Sản phẩm', group: 'Sản phẩm' },
  { key: 'product-types', label: 'Loại sản phẩm', group: 'Sản phẩm' },
  { key: 'orders', label: 'Đơn hàng', group: 'Vận hành' },
  { key: 'returns', label: 'Hoàn trả', group: 'Vận hành' },
  { key: 'customers', label: 'Khách hàng', group: 'Vận hành' },
  { key: 'marketplaces', label: 'Sàn TMĐT', group: 'Vận hành' },
  { key: 'live-chat', label: 'Live chat', group: 'Vận hành' },
  { key: 'reviews', label: 'Đánh giá', group: 'Nội dung' },
  { key: 'backup', label: 'Dữ liệu', group: 'Hệ thống' },
  { key: 'vouchers', label: 'Khuyến mãi', group: 'Marketing' },
  { key: 'featured', label: 'Sản phẩm nổi bật', group: 'Marketing' },
  { key: 'flashsale', label: 'Flashsale', group: 'Marketing' },
  { key: 'settings-social', label: 'MXH', group: 'Setting' },
  { key: 'settings-payment', label: 'Thanh toán', group: 'Setting' },
  { key: 'settings-text-ui', label: 'Text UI', group: 'Setting' },
  { key: 'settings-images', label: 'Hình ảnh', group: 'Setting' },
  { key: 'settings-notifications', label: 'Thông báo', group: 'Setting' },
  { key: 'settings-admin-ui', label: 'Trang quản trị', group: 'Setting' },
  { key: 'settings-warehouse', label: 'Kho hàng', group: 'Setting' },
]

export function isSuperAdminKey(raw: unknown): boolean {
  return String(raw || '').trim().toLowerCase() === 'admin'
}

export function createFullAdminPermissionMap(): AdminPermissionMap {
  return ADMIN_PERMISSION_ITEMS.reduce((acc, item) => {
    acc[item.key] = { visible: true, view: true, edit: true }
    return acc
  }, {} as AdminPermissionMap)
}

export function createEmptyAdminPermissionMap(): AdminPermissionMap {
  return ADMIN_PERMISSION_ITEMS.reduce((acc, item) => {
    acc[item.key] = { visible: false, view: false, edit: false }
    return acc
  }, {} as AdminPermissionMap)
}

function coercePermissionEntry(value: any): AdminPermissionEntry {
  const visible = value?.visible === true || value?.visible === 1 || value?.visible === '1'
  const view = value?.view === true || value?.view === 1 || value?.view === '1'
  const edit = value?.edit === true || value?.edit === 1 || value?.edit === '1'
  return {
    visible: visible || view || edit,
    view: view || edit,
    edit,
  }
}

export function normalizeAdminPermissionMap(raw: unknown, fallbackFull = false): AdminPermissionMap {
  const fallback = fallbackFull ? createFullAdminPermissionMap() : createEmptyAdminPermissionMap()
  if (!raw) return fallback
  try {
    const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw
    const output = createEmptyAdminPermissionMap()
    for (const item of ADMIN_PERMISSION_ITEMS) {
      output[item.key] = coercePermissionEntry((parsed as any)?.[item.key])
    }
    return output
  } catch {
    return fallback
  }
}

export async function readAdminPermissionMap(db: D1Database, adminUserKey: string): Promise<AdminPermissionMap> {
  if (isSuperAdminKey(adminUserKey)) return createFullAdminPermissionMap()
  const row = await db.prepare("SELECT value FROM app_settings WHERE key=? LIMIT 1")
    .bind(`admin_permissions_${adminUserKey}`)
    .first<AppSettingRow>()
  return normalizeAdminPermissionMap(row?.value || '', false)
}

export function serializeAdminPermissionMap(raw: unknown): string {
  return JSON.stringify(normalizeAdminPermissionMap(raw, false))
}

export function canUseAdminPermission(map: AdminPermissionMap, key: AdminPermissionKey, action: 'view' | 'edit'): boolean {
  const entry = map[key]
  if (!entry) return false
  if (action === 'edit') return !!entry.edit
  return !!entry.view || !!entry.edit
}

function getActionForMethod(method: string): 'view' | 'edit' {
  const normalized = String(method || 'GET').toUpperCase()
  return normalized === 'GET' || normalized === 'HEAD' ? 'view' : 'edit'
}

export function getAdminPermissionRequirement(path: string, method: string): { key: AdminPermissionKey, action: 'view' | 'edit' } | null {
  const p = String(path || '')
  const action = getActionForMethod(method)
  if (p === '/api/admin/profile' || p.startsWith('/api/admin/profile/') || p.startsWith('/api/admin/push/')) return null
  if (p.startsWith('/api/admin/members')) return { key: 'settings-admin-ui', action: 'edit' }
  if (p.startsWith('/api/admin/stats')) return { key: 'dashboard', action }
  if (p.startsWith('/api/admin/orders')) return { key: 'orders', action }
  if (p.startsWith('/api/admin/returns')) return { key: 'returns', action }
  if (p.startsWith('/api/admin/customers')) return { key: 'customers', action }
  if (p.startsWith('/api/admin/marketplaces')) return { key: 'marketplaces', action }
  if (p.startsWith('/api/admin/live-chat')) return { key: 'live-chat', action }
  if (p.startsWith('/api/admin/reviews')) return { key: 'reviews', action }
  if (p.startsWith('/api/admin/backup')) return { key: 'backup', action }
  if (p.startsWith('/api/admin/vouchers') || p.startsWith('/api/admin/auto-vouchers')) return { key: 'vouchers', action }
  if (p.startsWith('/api/admin/flash-sales')) return { key: 'flashsale', action }
  if (p.startsWith('/api/admin/product-types')) return { key: 'product-types', action }
  if (p.includes('/featured')) return { key: 'featured', action }
  if (p.startsWith('/api/admin/products') || p.startsWith('/api/admin/assets/images')) return { key: 'products', action }
  if (p.startsWith('/api/admin/settings/social')) return { key: 'settings-social', action }
  if (p.startsWith('/api/admin/settings/payment')) return { key: 'settings-payment', action }
  if (p.startsWith('/api/admin/settings/text-ui')) return { key: 'settings-text-ui', action }
  if (p.startsWith('/api/admin/settings/images')) return { key: 'settings-images', action }
  if (p.startsWith('/api/admin/settings/notifications')) return { key: 'settings-notifications', action }
  if (p.startsWith('/api/admin/settings/admin-ui')) return { key: 'settings-admin-ui', action }
  if (p.startsWith('/api/admin/ghtk') || p.startsWith('/api/admin/shipping')) return { key: 'settings-warehouse', action }
  if (p.startsWith('/api/admin/hero_banners')) return { key: 'settings-images', action }
  return null
}

export async function canAccessAdminRequest(db: D1Database, adminUserKey: string, path: string, method: string): Promise<boolean> {
  if (isSuperAdminKey(adminUserKey)) return true
  const requirement = getAdminPermissionRequirement(path, method)
  if (!requirement) return true
  const map = await readAdminPermissionMap(db, adminUserKey)
  return canUseAdminPermission(map, requirement.key, requirement.action)
}
