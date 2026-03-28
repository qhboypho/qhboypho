import { getCookie } from 'hono/cookie'

export async function upsertAppSettings(db: D1Database, entries: Array<{ key: string, value: string }>) {
  for (const entry of entries) {
    await db.prepare(`
      INSERT INTO app_settings (key, value, updated_at)
      VALUES (?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(key) DO UPDATE SET value=excluded.value, updated_at=CURRENT_TIMESTAMP
    `).bind(entry.key, entry.value).run()
  }
}

export async function getAppSettingValue(db: D1Database, key: string) {
  const row = await db.prepare("SELECT value FROM app_settings WHERE key=? LIMIT 1").bind(key).first() as any
  return String(row?.value || '')
}

export function normalizeAdminUserKey(raw: any) {
  const key = String(raw || 'admin').trim().toLowerCase().replace(/[^a-z0-9._-]+/g, '')
  return key || 'admin'
}

export async function resolveAdminProfile(db: D1Database, c: any) {
  const adminUserKey = normalizeAdminUserKey(getCookie(c, 'admin_user_key') || 'admin')
  const userToken = String(getCookie(c, 'user_id') || '').trim()
  if (userToken) {
    const uid = Number.parseInt(userToken, 10)
    if (Number.isFinite(uid) && uid > 0) {
      const user = await db.prepare("SELECT id, email, name, avatar, balance, is_admin FROM users WHERE id=? LIMIT 1").bind(uid).first() as any
      if (user && Number(user.is_admin || 0) === 1) {
        return {
          scope: 'db-user',
          adminUserKey,
          userId: Number(user.id),
          email: String(user.email || ''),
          name: String(user.name || 'Admin'),
          avatar: String(user.avatar || ''),
          balance: Number(user.balance || 0),
          is_admin: 1
        }
      }
    }
  }
  const avatar = await getAppSettingValue(db, `admin_avatar_${adminUserKey}`)
  const fallbackName = adminUserKey === 'admin'
    ? 'Admin'
    : adminUserKey.split(/[._-]/).filter(Boolean).map((s) => s.charAt(0).toUpperCase() + s.slice(1)).join(' ')
  return {
    scope: 'legacy-admin',
    adminUserKey,
    userId: 0,
    email: `${adminUserKey}@qhclothes.local`,
    name: fallbackName || 'Admin',
    avatar,
    balance: 0,
    is_admin: 1
  }
}
