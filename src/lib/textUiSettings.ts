export type TextUiSettings = {
  quick_order_risk_note_text: string
}

export const DEFAULT_QUICK_ORDER_RISK_NOTE_TEXT =
  'Hãy chắc bạn muốn mua và nhận được hàng trước khi đặt để tránh phát sinh phí hoàn và bị hệ thống ghi nhận lịch sử bom hàng. Bạn sẽ không thể đặt hàng nếu số lần không nhận được vượt quá 2 lần'

export const TEXT_UI_SETTING_KEYS = [
  'quick_order_risk_note_text',
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
  return {
    quick_order_risk_note_text: sanitizeTextUiSetting(map.get('quick_order_risk_note_text')) || DEFAULT_QUICK_ORDER_RISK_NOTE_TEXT,
  }
}
