export type TextUiSettings = {
  quick_order_risk_note_text: string
  hero_badge_text: string
  hero_title_text: string
  hero_typed_text: string
  hero_description_text: string
  hero_mobile_subtitle_text: string
  hero_stat_1_value: string
  hero_stat_1_label: string
  hero_stat_2_value: string
  hero_stat_2_label: string
  hero_stat_3_value: string
  hero_stat_3_label: string
}

export const DEFAULT_QUICK_ORDER_RISK_NOTE_TEXT =
  'Hãy chắc bạn muốn mua và nhận được hàng trước khi đặt để tránh phát sinh phí hoàn và bị hệ thống ghi nhận lịch sử bom hàng. Bạn sẽ không thể đặt hàng nếu số lần không nhận được vượt quá 2 lần'

export const DEFAULT_TEXT_UI_SETTINGS: TextUiSettings = {
  quick_order_risk_note_text: DEFAULT_QUICK_ORDER_RISK_NOTE_TEXT,
  hero_badge_text: 'Bộ sưu tập mới 2026',
  hero_title_text: 'Thời Trang Giới Trẻ',
  hero_typed_text: 'Cho Cả Nam Nữ|Phong Cách Boypho',
  hero_description_text: 'Khám phá bộ sưu tập thời trang cao cấp dành cho cả nam lẫn nữ. Chất lượng vải premium, thiết kế tinh tế - thể hiện cá tính của bạn.',
  hero_mobile_subtitle_text: 'Đây là những sản phẩm hot nhất và đang được đặt mua nhiều nhất ở thời điểm hiện tại.',
  hero_stat_1_value: '500+',
  hero_stat_1_label: 'Sản phẩm',
  hero_stat_2_value: '10K+',
  hero_stat_2_label: 'Khách hàng',
  hero_stat_3_value: '4.9★',
  hero_stat_3_label: 'Đánh giá',
}

export const TEXT_UI_SETTING_KEYS = [
  'quick_order_risk_note_text',
  'hero_badge_text',
  'hero_title_text',
  'hero_typed_text',
  'hero_description_text',
  'hero_mobile_subtitle_text',
  'hero_stat_1_value',
  'hero_stat_1_label',
  'hero_stat_2_value',
  'hero_stat_2_label',
  'hero_stat_3_value',
  'hero_stat_3_label',
] as const

export function sanitizeTextUiSetting(value: unknown, maxLength = 800): string {
  return String(value || '')
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '')
    .trim()
    .slice(0, maxLength)
}

export async function readTextUiSettings(db: D1Database): Promise<TextUiSettings> {
  const query = `SELECT key, value FROM app_settings WHERE key IN (${TEXT_UI_SETTING_KEYS.map(() => '?').join(',')})`
  const result = await db.prepare(query).bind(...TEXT_UI_SETTING_KEYS).all()
  const map = new Map<string, string>()
  for (const row of (result.results || []) as any[]) {
    map.set(String(row.key || ''), String(row.value || '').trim())
  }
  return TEXT_UI_SETTING_KEYS.reduce((settings, key) => {
    const maxLength = key === 'quick_order_risk_note_text' || key === 'hero_description_text' ? 800 : 220
    settings[key] = sanitizeTextUiSetting(map.get(key), maxLength) || DEFAULT_TEXT_UI_SETTINGS[key]
    return settings
  }, { ...DEFAULT_TEXT_UI_SETTINGS })
}
