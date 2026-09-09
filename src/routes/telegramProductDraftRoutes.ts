import type { Hono } from 'hono'
import type { AppBindings } from '../types/app'
import { buildPublicAssetUrl, getProductAssetBucket, writeProductAssetObject } from '../lib/assetStorage.ts'

type TelegramProductDraftDeps = {
  initDB: (db: D1Database) => Promise<void>
}

type JsonObject = Record<string, unknown>

type TelegramMessage = {
  chat?: { id?: number | string }
  message_id?: number
  media_group_id?: string
  text?: string
  caption?: string
  photo?: Array<{ file_id?: string; width?: number; height?: number; file_size?: number }>
  document?: { file_id?: string; mime_type?: string; file_name?: string; file_size?: number }
}

type TelegramFileDownload = {
  bytes: ArrayBuffer
  contentType: string
  filePath: string
}

const MAX_TELEGRAM_PRODUCT_IMAGE_BYTES = 6 * 1024 * 1024
const TELEGRAM_ALBUM_SETTLE_MS = 3500
const DEFAULT_GEMINI_MODEL = 'gemini-2.5-flash'
const ALLOWED_IMAGE_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp'])
let telegramDraftTablesReady = false

function cleanText(value: unknown, max = 1200) {
  return String(value || '').replace(/\r\n?/g, '\n').trim().slice(0, max)
}

function toJsonObject(value: unknown): JsonObject {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? value as JsonObject
    : {}
}

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8' },
  })
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function getTelegramMessage(update: any): TelegramMessage | null {
  return update?.message || update?.edited_message || update?.channel_post || null
}

function getTelegramChatId(message: TelegramMessage | null): string {
  return String(message?.chat?.id || '').trim()
}

function isChatAllowed(chatId: string, allowedChatIds: string) {
  const list = String(allowedChatIds || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
  return list.length === 0 || list.includes(chatId)
}

function extensionFromMime(contentType: string) {
  const type = inferImageMimeType(contentType, '')
  if (type === 'image/png') return 'png'
  if (type === 'image/webp') return 'webp'
  return 'jpg'
}

function sanitizeGeminiDescription(value: unknown) {
  return cleanText(value, 1400)
    .replace(/^```(?:\w+)?\s*/i, '')
    .replace(/```$/i, '')
    .trim()
}

export function normalizeTelegramProductTitle(message: TelegramMessage | null): string {
  const source = cleanText(message?.caption || message?.text || '', 220)
    .replace(/^\/(?:draft|product|sanpham|sp)(?:@\w+)?\s*/i, '')
    .split('\n')
    .map((line) => line.trim())
    .find((line) => line && !line.startsWith('#')) || ''
  return source.slice(0, 160)
}

export function getTelegramMediaGroupId(message: TelegramMessage | null): string {
  return String(message?.media_group_id || '').trim()
}

export function getTelegramMessageSortKey(message: TelegramMessage | null): number {
  const id = Number(message?.message_id || 0)
  return Number.isFinite(id) && id > 0 ? id : 0
}

export function getTelegramImageFileId(message: TelegramMessage | null): string {
  const photos = Array.isArray(message?.photo) ? message?.photo || [] : []
  const bestPhoto = photos
    .filter((item) => item?.file_id)
    .sort((a, b) => Number((b.width || 0) * (b.height || 0)) - Number((a.width || 0) * (a.height || 0)))[0]
  if (bestPhoto?.file_id) return String(bestPhoto.file_id)

  const doc = message?.document
  const mime = String(doc?.mime_type || '').toLowerCase()
  const name = String(doc?.file_name || '').toLowerCase()
  if (doc?.file_id && (mime.startsWith('image/') || /\.(jpe?g|png|webp)$/i.test(name))) {
    return String(doc.file_id)
  }
  return ''
}

export function inferImageMimeType(contentType: string, filePath: string): string {
  const normalized = String(contentType || '').split(';')[0].trim().toLowerCase()
  if (ALLOWED_IMAGE_MIME_TYPES.has(normalized)) return normalized
  const lowerPath = String(filePath || '').toLowerCase()
  if (lowerPath.endsWith('.png')) return 'image/png'
  if (lowerPath.endsWith('.webp')) return 'image/webp'
  return 'image/jpeg'
}

export function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer)
  let binary = ''
  const chunkSize = 0x8000
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize))
  }
  return btoa(binary)
}

export function buildGeminiDescriptionPrompt(title: string): string {
  return [
    'Viết mô tả sản phẩm thời trang bằng tiếng Việt cho shop online QH Boypho.',
    `Tên sản phẩm: ${title}`,
    'Yêu cầu:',
    '- 3 đến 5 câu ngắn, tự nhiên, dễ bán hàng.',
    '- Không bịa giá, size, màu, chất liệu nếu ảnh/tiêu đề không thể hiện rõ.',
    '- Không dùng markdown tiêu đề, không hashtag, không emoji.',
    '- Giọng văn gọn, sang, phù hợp sản phẩm thời trang.',
  ].join('\n')
}

export function readGeminiDescription(data: unknown): string {
  const root = toJsonObject(data)
  const candidates = Array.isArray(root.candidates) ? root.candidates : []
  const firstCandidate = toJsonObject(candidates[0])
  const content = toJsonObject(firstCandidate.content)
  const parts = Array.isArray(content.parts)
    ? content.parts
    : []
  const text = parts.map((part) => String(toJsonObject(part).text || '')).filter(Boolean).join('\n')
  return sanitizeGeminiDescription(text)
}

export async function generateGeminiProductDescription(input: {
  title: string
  image: TelegramFileDownload
  env: AppBindings
  fetchImpl?: typeof fetch
}): Promise<{ description: string; usedGemini: boolean; error?: string }> {
  const key = String(input.env.GEMINI_API_KEY || '').trim()
  if (!key) {
    return {
      description: `Sản phẩm ${input.title}. Mô tả AI sẽ được bổ sung khi cấu hình GEMINI_API_KEY.`,
      usedGemini: false,
      error: 'MISSING_GEMINI_API_KEY',
    }
  }
  const fetcher = input.fetchImpl || fetch
  const model = String(input.env.GEMINI_MODEL || DEFAULT_GEMINI_MODEL).trim() || DEFAULT_GEMINI_MODEL
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(key)}`
  const res = await fetcher(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      contents: [{
        role: 'user',
        parts: [
          { text: buildGeminiDescriptionPrompt(input.title) },
          {
            inline_data: {
              mime_type: inferImageMimeType(input.image.contentType, input.image.filePath),
              data: arrayBufferToBase64(input.image.bytes),
            },
          },
        ],
      }],
      generationConfig: {
        temperature: 0.65,
        maxOutputTokens: 420,
      },
    }),
  })
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    return {
      description: `Sản phẩm ${input.title}. Mô tả AI chưa tạo được, vui lòng kiểm tra lại Gemini key.`,
      usedGemini: false,
      error: `GEMINI_${res.status}${text ? `: ${text.slice(0, 240)}` : ''}`,
    }
  }
  const data = await res.json().catch(() => ({}))
  const description = readGeminiDescription(data)
  return {
    description: description || `Sản phẩm ${input.title}.`,
    usedGemini: !!description,
  }
}

export async function createTelegramProductDraft(db: D1Database, input: {
  title: string
  description: string
  imageUrl?: string
  imageUrls?: string[]
  storefrontVisibility?: string[]
}) {
  const visibility = Array.isArray(input.storefrontVisibility) && input.storefrontVisibility.length
    ? input.storefrontVisibility
    : ['boypho']
  const imageUrls = (Array.isArray(input.imageUrls) ? input.imageUrls : [input.imageUrl])
    .map((item) => String(item || '').trim())
    .filter(Boolean)
  const thumbnail = imageUrls[0] || ''
  const result = await db.prepare(`
    INSERT INTO products
      (name, description, price, original_price, category, brand, material, thumbnail, images, colors, sizes, stock,
       is_active, is_featured, is_trending, is_new_arrival, trending_order, storefront_visibility)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    input.title,
    input.description,
    0,
    null,
    'unisex',
    '',
    '',
    thumbnail,
    JSON.stringify(imageUrls),
    JSON.stringify([]),
    JSON.stringify([]),
    0,
    0,
    0,
    0,
    0,
    0,
    JSON.stringify(visibility)
  ).run()
  return { id: result.meta?.last_row_id || 0 }
}

async function ensureTelegramProductDraftTables(db: D1Database) {
  if (telegramDraftTablesReady) return
  await db.prepare(`
    CREATE TABLE IF NOT EXISTS telegram_product_draft_media_groups (
      media_group_id TEXT PRIMARY KEY,
      chat_id TEXT NOT NULL,
      title TEXT DEFAULT '',
      status TEXT DEFAULT 'pending',
      product_id INTEGER,
      error TEXT DEFAULT '',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      processed_at DATETIME
    )
  `).run()
  await db.prepare(`
    CREATE TABLE IF NOT EXISTS telegram_product_draft_media_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      media_group_id TEXT NOT NULL,
      chat_id TEXT NOT NULL,
      message_id INTEGER DEFAULT 0,
      file_id TEXT NOT NULL,
      caption TEXT DEFAULT '',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(media_group_id, file_id)
    )
  `).run()
  await db.prepare(`
    CREATE INDEX IF NOT EXISTS idx_telegram_product_draft_groups_status
      ON telegram_product_draft_media_groups(status, updated_at)
  `).run()
  await db.prepare(`
    CREATE INDEX IF NOT EXISTS idx_telegram_product_draft_items_group_order
      ON telegram_product_draft_media_items(media_group_id, message_id, id)
  `).run()
  telegramDraftTablesReady = true
}

async function saveTelegramMediaGroupItem(db: D1Database, input: {
  mediaGroupId: string
  chatId: string
  messageId: number
  fileId: string
  title: string
}) {
  await ensureTelegramProductDraftTables(db)
  await db.prepare(`
    INSERT OR IGNORE INTO telegram_product_draft_media_groups (media_group_id, chat_id, title, status)
    VALUES (?, ?, ?, 'pending')
  `).bind(input.mediaGroupId, input.chatId, input.title,).run()
  if (input.title) {
    await db.prepare(`
      UPDATE telegram_product_draft_media_groups
      SET title = CASE WHEN TRIM(COALESCE(title, '')) = '' THEN ? ELSE title END,
          updated_at = CURRENT_TIMESTAMP
      WHERE media_group_id = ?
    `).bind(input.title, input.mediaGroupId).run()
  }
  await db.prepare(`
    INSERT OR IGNORE INTO telegram_product_draft_media_items (media_group_id, chat_id, message_id, file_id, caption)
    VALUES (?, ?, ?, ?, ?)
  `).bind(input.mediaGroupId, input.chatId, input.messageId, input.fileId, input.title).run()
}

async function claimTelegramMediaGroup(db: D1Database, mediaGroupId: string) {
  await ensureTelegramProductDraftTables(db)
  const result = await db.prepare(`
    UPDATE telegram_product_draft_media_groups
    SET status = 'processing', updated_at = CURRENT_TIMESTAMP
    WHERE media_group_id = ? AND status = 'pending'
  `).bind(mediaGroupId).run()
  return Number(result.meta?.changes || 0) > 0
}

async function readTelegramMediaGroup(db: D1Database, mediaGroupId: string) {
  await ensureTelegramProductDraftTables(db)
  const group = await db.prepare(`
    SELECT *
    FROM telegram_product_draft_media_groups
    WHERE media_group_id = ?
    LIMIT 1
  `).bind(mediaGroupId).first<any>()
  const items = await db.prepare(`
    SELECT *
    FROM telegram_product_draft_media_items
    WHERE media_group_id = ?
    ORDER BY message_id ASC, id ASC
  `).bind(mediaGroupId).all()
  return { group, items: (items.results || []) as any[] }
}

async function finishTelegramMediaGroup(db: D1Database, mediaGroupId: string, status: 'completed' | 'failed', productId = 0, error = '') {
  await db.prepare(`
    UPDATE telegram_product_draft_media_groups
    SET status = ?, product_id = ?, error = ?, processed_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
    WHERE media_group_id = ?
  `).bind(status, productId || null, error.slice(0, 500), mediaGroupId).run()
}

async function downloadTelegramFile(fileId: string, token: string, fetchImpl: typeof fetch = fetch): Promise<TelegramFileDownload> {
  const infoRes = await fetchImpl(`https://api.telegram.org/bot${token}/getFile?file_id=${encodeURIComponent(fileId)}`)
  if (!infoRes.ok) throw new Error(`TELEGRAM_GET_FILE_FAILED_${infoRes.status}`)
  const info = toJsonObject(await infoRes.json().catch(() => ({})))
  const result = toJsonObject(info.result)
  const filePath = String(result.file_path || '')
  const fileSize = Number(result.file_size || 0)
  if (!filePath) throw new Error('TELEGRAM_FILE_PATH_MISSING')
  if (fileSize > MAX_TELEGRAM_PRODUCT_IMAGE_BYTES) throw new Error('TELEGRAM_IMAGE_TOO_LARGE')

  const fileRes = await fetchImpl(`https://api.telegram.org/file/bot${token}/${filePath}`)
  if (!fileRes.ok) throw new Error(`TELEGRAM_DOWNLOAD_FAILED_${fileRes.status}`)
  const bytes = await fileRes.arrayBuffer()
  if (!bytes.byteLength || bytes.byteLength > MAX_TELEGRAM_PRODUCT_IMAGE_BYTES) throw new Error('TELEGRAM_IMAGE_TOO_LARGE')
  const contentType = inferImageMimeType(fileRes.headers.get('content-type') || '', filePath)
  return { bytes, contentType, filePath }
}

async function uploadTelegramProductImage(env: AppBindings, image: TelegramFileDownload) {
  if (!getProductAssetBucket(env)) throw new Error('R2_NOT_CONFIGURED')
  const ext = extensionFromMime(image.contentType)
  const key = `telegram-products/${new Date().toISOString().slice(0, 10)}/${crypto.randomUUID()}.${ext}`
  await writeProductAssetObject(env, key, image.bytes, {
    httpMetadata: {
      contentType: inferImageMimeType(image.contentType, image.filePath),
      cacheControl: 'public, max-age=31536000, immutable',
    },
  })
  return buildPublicAssetUrl(env, key)
}

async function sendTelegramMessage(chatId: string, text: string, token: string) {
  if (!chatId || !token) return
  await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      disable_web_page_preview: true,
    }),
  }).catch(() => undefined)
}

async function createDraftFromTelegramFiles(input: {
  db: D1Database
  env: AppBindings
  token: string
  chatId: string
  title: string
  fileIds: string[]
}) {
  const downloads: TelegramFileDownload[] = []
  const imageUrls: string[] = []
  for (const fileId of input.fileIds) {
    const image = await downloadTelegramFile(fileId, input.token)
    downloads.push(image)
    imageUrls.push(await uploadTelegramProductImage(input.env, image))
  }
  const firstImage = downloads[0]
  if (!firstImage || imageUrls.length === 0) throw new Error('TELEGRAM_IMAGE_REQUIRED')
  const ai = await generateGeminiProductDescription({ title: input.title, image: firstImage, env: input.env })
  const draft = await createTelegramProductDraft(input.db, {
    title: input.title,
    description: ai.description,
    imageUrls,
    storefrontVisibility: ['boypho'],
  })
  await sendTelegramMessage(
    input.chatId,
    [
      `Đã tạo draft sản phẩm #${draft.id}`,
      `Tên: ${input.title}`,
      `Ảnh: ${imageUrls.length} ảnh${imageUrls.length > 1 ? ' (ảnh đầu làm ảnh chính)' : ''}.`,
      ai.usedGemini ? 'Mô tả: Gemini đã tự viết.' : `Mô tả: dùng fallback (${ai.error || 'Gemini chưa sẵn sàng'}).`,
      'Trạng thái: đang ẩn, vào admin bổ sung giá/size/màu rồi bật mắt để public.',
    ].join('\n'),
    input.token
  )
  return { draft, imageUrls, ai }
}

async function processTelegramMediaGroupAfterDelay(input: {
  mediaGroupId: string
  env: AppBindings
  token: string
}) {
  await delay(TELEGRAM_ALBUM_SETTLE_MS)
  const claimed = await claimTelegramMediaGroup(input.env.DB, input.mediaGroupId)
  if (!claimed) return
  const { group, items } = await readTelegramMediaGroup(input.env.DB, input.mediaGroupId)
  const chatId = String(group?.chat_id || '')
  const title = cleanText(group?.title || '', 180)
  try {
    const fileIds = items.map((item) => String(item?.file_id || '').trim()).filter(Boolean)
    if (!chatId || !title || fileIds.length === 0) {
      await sendTelegramMessage(chatId, 'Album cần có caption là tên sản phẩm ở ảnh đầu tiên nhé. Gửi lại album giúp shop.', input.token)
      await finishTelegramMediaGroup(input.env.DB, input.mediaGroupId, 'failed', 0, 'ALBUM_TITLE_OR_IMAGE_REQUIRED')
      return
    }
    const result = await createDraftFromTelegramFiles({
      db: input.env.DB,
      env: input.env,
      token: input.token,
      chatId,
      title,
      fileIds,
    })
    await finishTelegramMediaGroup(input.env.DB, input.mediaGroupId, 'completed', Number(result.draft.id || 0), '')
  } catch (error: any) {
    const msg = String(error?.message || 'TELEGRAM_ALBUM_DRAFT_FAILED')
    await sendTelegramMessage(chatId, `Không tạo được draft album: ${msg}`, input.token)
    await finishTelegramMediaGroup(input.env.DB, input.mediaGroupId, 'failed', 0, msg)
  }
}

function validateTelegramWebhookRequest(c: any) {
  const secret = String(c.env.TELEGRAM_WEBHOOK_SECRET || '').trim()
  if (!secret) return { ok: false, status: 500, error: 'TELEGRAM_WEBHOOK_SECRET_REQUIRED' }
  const header = String(c.req.header('x-telegram-bot-api-secret-token') || '').trim()
  if (header !== secret) return { ok: false, status: 401, error: 'INVALID_TELEGRAM_SECRET' }
  return { ok: true, status: 200, error: '' }
}

export function registerTelegramProductDraftRoutes(app: Hono<{ Bindings: AppBindings }>, deps: TelegramProductDraftDeps) {
  app.post('/api/telegram/product-draft/webhook', async (c) => {
    const validation = validateTelegramWebhookRequest(c)
    if (!validation.ok) return c.json({ success: false, error: validation.error }, validation.status as any)

    const token = String(c.env.TELEGRAM_BOT_TOKEN || '').trim()
    if (!token) return c.json({ success: false, error: 'TELEGRAM_BOT_TOKEN_REQUIRED' }, 500)

    const update = await c.req.json().catch(() => ({}))
    const message = getTelegramMessage(update)
    const chatId = getTelegramChatId(message)
    if (!isChatAllowed(chatId, String(c.env.TELEGRAM_ALLOWED_CHAT_IDS || ''))) {
      return c.json({ success: false, error: 'TELEGRAM_CHAT_NOT_ALLOWED' }, 403)
    }

    const title = normalizeTelegramProductTitle(message)
    const fileId = getTelegramImageFileId(message)
    const mediaGroupId = getTelegramMediaGroupId(message)
    if (mediaGroupId && fileId) {
      await deps.initDB(c.env.DB)
      await saveTelegramMediaGroupItem(c.env.DB, {
        mediaGroupId,
        chatId,
        messageId: getTelegramMessageSortKey(message),
        fileId,
        title,
      })
      const task = processTelegramMediaGroupAfterDelay({ mediaGroupId, env: c.env, token })
      if ((c as any).executionCtx?.waitUntil) (c as any).executionCtx.waitUntil(task)
      else void task
      return c.json({ success: true, queued: true, media_group_id: mediaGroupId })
    }

    if (!title || !fileId) {
      await sendTelegramMessage(chatId, 'Gửi 1 ảnh hoặc 1 album sản phẩm kèm caption là tên sản phẩm nhé. Bot sẽ tạo draft ẩn trong admin.', token)
      return c.json({ success: true, skipped: true, reason: 'TITLE_OR_IMAGE_REQUIRED' })
    }

    try {
      await deps.initDB(c.env.DB)
      const result = await createDraftFromTelegramFiles({
        db: c.env.DB,
        env: c.env,
        token,
        chatId,
        title,
        fileIds: [fileId],
      })
      return c.json({ success: true, data: { product_id: result.draft.id, title, image_url: result.imageUrls[0], image_count: result.imageUrls.length, used_gemini: result.ai.usedGemini } })
    } catch (error: any) {
      const msg = String(error?.message || 'TELEGRAM_PRODUCT_DRAFT_FAILED')
      await sendTelegramMessage(chatId, `Không tạo được draft: ${msg}`, token)
      return c.json({ success: false, error: msg }, 500)
    }
  })

  app.get('/api/telegram/product-draft/health', (c) => jsonResponse({
    success: true,
    has_bot_token: Boolean(String(c.env.TELEGRAM_BOT_TOKEN || '').trim()),
    has_webhook_secret: Boolean(String(c.env.TELEGRAM_WEBHOOK_SECRET || '').trim()),
    has_gemini_key: Boolean(String(c.env.GEMINI_API_KEY || '').trim()),
    has_r2: Boolean(getProductAssetBucket(c.env)),
  }))
}
