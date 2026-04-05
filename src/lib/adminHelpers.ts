import { getCookie } from 'hono/cookie'
import type { AdminProfile, AppContext, AppSettingEntry } from '../types/admin'
import { getUserSessionUserId } from './userSessionHelpers'

type AppSettingRow = {
  value?: string | null
}

type AdminUserRow = {
  id?: number | string | null
  email?: string | null
  name?: string | null
  avatar?: string | null
  balance?: number | string | null
  is_admin?: number | string | null
}

export async function upsertAppSettings(db: D1Database, entries: AppSettingEntry[]) {
  for (const entry of entries) {
    await db.prepare(`
      INSERT INTO app_settings (key, value, updated_at)
      VALUES (?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(key) DO UPDATE SET value=excluded.value, updated_at=CURRENT_TIMESTAMP
    `).bind(entry.key, entry.value).run()
  }
}

export async function getAppSettingValue(db: D1Database, key: string) {
  const row = await db.prepare("SELECT value FROM app_settings WHERE key=? LIMIT 1").bind(key).first<AppSettingRow>()
  return String(row?.value || '')
}

export function normalizeAdminUserKey(raw: unknown) {
  const key = String(raw || 'admin').trim().toLowerCase().replace(/[^a-z0-9._-]+/g, '')
  return key || 'admin'
}

export async function resolveAdminProfile(db: D1Database, c: AppContext): Promise<AdminProfile> {
  const adminUserKey = normalizeAdminUserKey(getCookie(c, 'admin_user_key') || 'admin')
  const userToken = await getUserSessionUserId(c)
  if (userToken) {
    const uid = Number.parseInt(userToken, 10)
    if (Number.isFinite(uid) && uid > 0) {
      const user = await db.prepare("SELECT id, email, name, avatar, balance, is_admin FROM users WHERE id=? LIMIT 1").bind(uid).first<AdminUserRow>()
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

export function generateSecureToken(length = 48): string {
  const bytes = new Uint8Array(length)
  crypto.getRandomValues(bytes)
  return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('')
}

export async function storeAdminSessionToken(db: D1Database, adminUserKey: string, token: string): Promise<void> {
  const key = `admin_session_${normalizeAdminUserKey(adminUserKey)}`
  await upsertAppSettings(db, [{ key, value: token }])
}

export async function validateAdminSessionToken(db: D1Database, adminUserKey: string, token: string): Promise<boolean> {
  if (!token || token.length < 32) return false
  try {
    const key = `admin_session_${normalizeAdminUserKey(adminUserKey)}`
    const row = await db.prepare(
      "SELECT value FROM app_settings WHERE key = ? LIMIT 1"
    ).bind(key).first() as { value?: string } | null
    return !!row && row.value === token
  } catch {
    return false
  }
}

const PBKDF2_ITERATIONS = 50000
const PBKDF2_HASH = 'SHA-256'
const PBKDF2_KEY_LENGTH = 256

function toHex(bytes: Uint8Array): string {
  return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('')
}

function fromHex(hex: string): Uint8Array {
  const matches = hex.match(/.{2}/g)
  if (!matches) return new Uint8Array(0)
  return new Uint8Array(matches.map(byte => parseInt(byte, 16)))
}

async function deriveKey(password: string, salt: Uint8Array): Promise<string> {
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(password),
    'PBKDF2',
    false,
    ['deriveBits']
  )
  const derivedBits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt: salt as BufferSource, iterations: PBKDF2_ITERATIONS, hash: PBKDF2_HASH },
    keyMaterial,
    PBKDF2_KEY_LENGTH
  )
  return toHex(new Uint8Array(derivedBits))
}

export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16))
  const hash = await deriveKey(password, salt)
  return `pbkdf2:${toHex(salt)}:${hash}`
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  if (!stored) return false
  if (!stored.startsWith('pbkdf2:')) {
    return password === stored
  }
  const parts = stored.split(':')
  if (parts.length !== 3) return false
  const salt = fromHex(parts[1])
  const expectedHash = parts[2]
  const hash = await deriveKey(password, salt)
  return hash === expectedHash
}
