import type { Hono } from 'hono'
import type { AppBindings } from '../types/app'
import { buildPublicAssetUrl, getProductAssetBucket, writeProductAssetObject } from '../lib/assetStorage.ts'

type TelegramProductDraftDeps = {
  initDB: (db: D1Database) => Promise<void>
}

type TelegramMessage = {
  chat?: { id?: number | string }
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
const DEFAULT_GEMINI_MODEL = 'gemini-2.5-flash'
const ALLOWED_IMAGE_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp'])

function cleanText(value: unknown, max = 1200) {
  return String(value || '').replace(/\r\n?/g, '\n').trim().slice(0, max)
}

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8' },
  })
}

function getTelegramMessage(update: any): TelegramMessage | null {
  return update?.message || update?.edited_message || null
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

export function readGeminiDescription(data: any): string {
  const parts = Array.isArray(data?.candidates?.[0]?.content?.parts)
    ? data.candidates[0].content.parts
    : []
  const text = parts.map((part: any) => String(part?.text || '')).filter(Boolean).join('\n')
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
  imageUrl: string
  storefrontVisibility?: string[]
}) {
  const visibility = Array.isArray(input.storefrontVisibility) && input.storefrontVisibility.length
    ? input.storefrontVisibility
    : ['boypho']
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
    input.imageUrl,
    JSON.stringify([input.imageUrl]),
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

async function downloadTelegramFile(fileId: string, token: string, fetchImpl: typeof fetch = fetch): Promise<TelegramFileDownload> {
  const infoRes = await fetchImpl(`https://api.telegram.org/bot${token}/getFile?file_id=${encodeURIComponent(fileId)}`)
  if (!infoRes.ok) throw new Error(`TELEGRAM_GET_FILE_FAILED_${infoRes.status}`)
  const info = await infoRes.json().catch(() => ({}))
  const filePath = String(info?.result?.file_path || '')
  const fileSize = Number(info?.result?.file_size || 0)
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
    if (!title || !fileId) {
      await sendTelegramMessage(chatId, 'Gửi 1 ảnh sản phẩm kèm caption là tên sản phẩm nhé. Bot sẽ tạo draft ẩn trong admin.', token)
      return c.json({ success: true, skipped: true, reason: 'TITLE_OR_IMAGE_REQUIRED' })
    }

    try {
      await deps.initDB(c.env.DB)
      const image = await downloadTelegramFile(fileId, token)
      const imageUrl = await uploadTelegramProductImage(c.env, image)
      const ai = await generateGeminiProductDescription({ title, image, env: c.env })
      const draft = await createTelegramProductDraft(c.env.DB, {
        title,
        description: ai.description,
        imageUrl,
        storefrontVisibility: ['boypho'],
      })
      await sendTelegramMessage(
        chatId,
        [
          `Đã tạo draft sản phẩm #${draft.id}`,
          `Tên: ${title}`,
          ai.usedGemini ? 'Mô tả: Gemini đã tự viết.' : `Mô tả: dùng fallback (${ai.error || 'Gemini chưa sẵn sàng'}).`,
          'Trạng thái: đang ẩn, vào admin bổ sung giá/size/màu rồi bật mắt để public.',
        ].join('\n'),
        token
      )
      return c.json({ success: true, data: { product_id: draft.id, title, image_url: imageUrl, used_gemini: ai.usedGemini } })
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
