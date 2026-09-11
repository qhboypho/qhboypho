export type TextUiSettings = {
  quick_order_risk_note_text: string
  product_freeship_badge_enabled: boolean
  flash_sale_shop_section_enabled: boolean
  storefront_light_palette: StorefrontLightPalette
  storefront_dark_palette: StorefrontDarkPalette
  hero_badge_text: string
  hero_title_text: string
  hero_typed_text: string
  hero_description_text: string
  hero_mobile_subtitle_text: string
  hero_primary_cta_text: string
  hero_primary_cta_link: string
  hero_secondary_cta_text: string
  hero_secondary_cta_link: string
  hero_stat_1_value: string
  hero_stat_1_label: string
  hero_stat_2_value: string
  hero_stat_2_label: string
  hero_stat_3_value: string
  hero_stat_3_label: string
}

export type StorefrontLightPalette = 'blue-pop-light' | 'classic-light'
export type StorefrontDarkPalette = 'neon-cyber' | 'classic-dark'

export const DEFAULT_QUICK_ORDER_RISK_NOTE_TEXT =
  'Vui lòng kiểm tra kỹ thông tin trước khi đặt hàng để shop giao đúng và nhanh nhất. Với các đơn không nhận nhiều lần, hệ thống có thể tạm hạn chế đặt hàng để tránh phát sinh chi phí vận chuyển.'

export const DEFAULT_TEXT_UI_SETTINGS: TextUiSettings = {
  quick_order_risk_note_text: DEFAULT_QUICK_ORDER_RISK_NOTE_TEXT,
  product_freeship_badge_enabled: true,
  flash_sale_shop_section_enabled: true,
  storefront_light_palette: 'blue-pop-light',
  storefront_dark_palette: 'neon-cyber',
  hero_badge_text: 'Bộ sưu tập mới 2026',
  hero_title_text: 'Thời Trang Giới Trẻ',
  hero_typed_text: 'Cho Cả Nam Nữ|Phong Cách Boypho',
  hero_description_text: 'Khám phá bộ sưu tập thời trang cao cấp dành cho cả nam lẫn nữ. Chất lượng vải premium, thiết kế tinh tế - thể hiện cá tính của bạn.',
  hero_mobile_subtitle_text: 'Đây là những sản phẩm hot nhất và đang được đặt mua nhiều nhất ở thời điểm hiện tại.',
  hero_primary_cta_text: 'Khám phá sản phẩm',
  hero_primary_cta_link: '#products',
  hero_secondary_cta_text: 'Khám phá thêm',
  hero_secondary_cta_link: '#about',
  hero_stat_1_value: '500+',
  hero_stat_1_label: 'Sản phẩm',
  hero_stat_2_value: '10K+',
  hero_stat_2_label: 'Khách hàng',
  hero_stat_3_value: '4.9★',
  hero_stat_3_label: 'Đánh giá',
}

export const TEXT_UI_SETTING_KEYS = [
  'quick_order_risk_note_text',
  'product_freeship_badge_enabled',
  'flash_sale_shop_section_enabled',
  'storefront_light_palette',
  'storefront_dark_palette',
  'hero_badge_text',
  'hero_title_text',
  'hero_typed_text',
  'hero_description_text',
  'hero_mobile_subtitle_text',
  'hero_primary_cta_text',
  'hero_primary_cta_link',
  'hero_secondary_cta_text',
  'hero_secondary_cta_link',
  'hero_stat_1_value',
  'hero_stat_1_label',
  'hero_stat_2_value',
  'hero_stat_2_label',
  'hero_stat_3_value',
  'hero_stat_3_label',
] as const

export function sanitizeStorefrontLightPalette(value: unknown): StorefrontLightPalette {
  return String(value || '').trim() === 'classic-light' ? 'classic-light' : 'blue-pop-light'
}

export function sanitizeStorefrontDarkPalette(value: unknown): StorefrontDarkPalette {
  return String(value || '').trim() === 'classic-dark' ? 'classic-dark' : 'neon-cyber'
}

export function sanitizeTextUiSetting(value: unknown, maxLength = 800): string {
  return String(value || '')
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '')
    .trim()
    .slice(0, maxLength)
}

export function sanitizeHeroCtaLink(value: unknown, fallback = ''): string {
  const normalized = sanitizeTextUiSetting(value, 500)
  if (!normalized) return ''
  const lower = normalized.toLowerCase().replace(/\s+/g, '')
  if (lower.startsWith('javascript:') || lower.startsWith('data:') || lower.startsWith('vbscript:')) {
    return fallback
  }
  return normalized
}

function readBooleanSetting(value: unknown, fallback = true): boolean {
  const normalized = String(value ?? '').trim().toLowerCase()
  if (!normalized) return fallback
  if (['1', 'true', 'yes', 'on', 'enabled'].includes(normalized)) return true
  if (['0', 'false', 'no', 'off', 'disabled'].includes(normalized)) return false
  return fallback
}

export async function readTextUiSettings(db: D1Database): Promise<TextUiSettings> {
  const query = `SELECT key, value FROM app_settings WHERE key IN (${TEXT_UI_SETTING_KEYS.map(() => '?').join(',')})`
  const result = await db.prepare(query).bind(...TEXT_UI_SETTING_KEYS).all()
  const map = new Map<string, string>()
  for (const row of (result.results || []) as any[]) {
    map.set(String(row.key || ''), String(row.value || '').trim())
  }
  return TEXT_UI_SETTING_KEYS.reduce((settings, key) => {
    if (key === 'product_freeship_badge_enabled' || key === 'flash_sale_shop_section_enabled') {
      settings[key] = readBooleanSetting(map.get(key), DEFAULT_TEXT_UI_SETTINGS[key])
      return settings
    }
    if (key === 'storefront_light_palette') {
      settings[key] = sanitizeStorefrontLightPalette(map.get(key))
      return settings
    }
    if (key === 'storefront_dark_palette') {
      settings[key] = sanitizeStorefrontDarkPalette(map.get(key))
      return settings
    }
    if (key === 'hero_primary_cta_text' || key === 'hero_secondary_cta_text') {
      settings[key] = map.has(key)
        ? sanitizeTextUiSetting(map.get(key), 80)
        : DEFAULT_TEXT_UI_SETTINGS[key]
      return settings
    }
    if (key === 'hero_primary_cta_link' || key === 'hero_secondary_cta_link') {
      settings[key] = sanitizeHeroCtaLink(map.get(key), DEFAULT_TEXT_UI_SETTINGS[key]) || DEFAULT_TEXT_UI_SETTINGS[key]
      return settings
    }
    const maxLength = key === 'quick_order_risk_note_text' || key === 'hero_description_text' ? 800 : 220
    settings[key] = sanitizeTextUiSetting(map.get(key), maxLength) || DEFAULT_TEXT_UI_SETTINGS[key]
    return settings
  }, { ...DEFAULT_TEXT_UI_SETTINGS })
}
