import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  arrayBufferToBase64,
  buildGeminiDescriptionPrompt,
  createTelegramProductDraft,
  getTelegramImageFileId,
  inferImageMimeType,
  normalizeTelegramProductTitle,
  readGeminiDescription,
} from '../src/routes/telegramProductDraftRoutes.ts'

class MockStatement {
  constructor(db, sql) {
    this.db = db
    this.sql = sql
    this.values = []
  }

  bind(...values) {
    this.values = values
    return this
  }

  async run() {
    this.db.runs.push({ sql: this.sql, values: this.values })
    return { success: true, meta: { last_row_id: 123, changes: 1 } }
  }
}

class MockDb {
  constructor() {
    this.runs = []
  }

  prepare(sql) {
    return new MockStatement(this, sql)
  }
}

describe('Telegram product draft contract', () => {
  it('reads the largest Telegram photo file_id and image documents', () => {
    assert.equal(getTelegramImageFileId({
      photo: [
        { file_id: 'small', width: 120, height: 120 },
        { file_id: 'large', width: 1000, height: 1000 },
      ],
    }), 'large')

    assert.equal(getTelegramImageFileId({
      document: {
        file_id: 'doc-webp',
        mime_type: 'image/webp',
        file_name: 'ao-khoac.webp',
      },
    }), 'doc-webp')

    assert.equal(getTelegramImageFileId({
      document: {
        file_id: 'doc-text',
        mime_type: 'text/plain',
        file_name: 'note.txt',
      },
    }), '')
  })

  it('normalizes the product title from photo caption or text', () => {
    assert.equal(normalizeTelegramProductTitle({ caption: '  Áo khoác gió 2 lớp\n#draft  ' }), 'Áo khoác gió 2 lớp')
    assert.equal(normalizeTelegramProductTitle({ text: '/draft   Áo Polo Nam Lịch Lãm' }), 'Áo Polo Nam Lịch Lãm')
    assert.equal(normalizeTelegramProductTitle({ caption: 'a'.repeat(220) }).length, 160)
  })

  it('uses Gemini-supported image MIME types and chunk-safe base64 encoding', () => {
    const bytes = new Uint8Array(140_000)
    bytes[0] = 1
    bytes[139_999] = 255
    assert.equal(arrayBufferToBase64(bytes.buffer), Buffer.from(bytes).toString('base64'))
    assert.equal(inferImageMimeType('application/octet-stream', 'photos/file_2.jpg'), 'image/jpeg')
    assert.equal(inferImageMimeType('image/png', 'documents/file'), 'image/png')
  })

  it('builds and reads a concise Vietnamese Gemini product description', () => {
    const prompt = buildGeminiDescriptionPrompt('Áo khoác gió 2 lớp')
    assert.match(prompt, /Áo khoác gió 2 lớp/)
    assert.match(prompt, /tiếng Việt/)
    assert.equal(readGeminiDescription({
      candidates: [
        { content: { parts: [{ text: '  Mô tả sản phẩm\n\n- Chất liệu đẹp  ' }] } },
      ],
    }), 'Mô tả sản phẩm\n\n- Chất liệu đẹp')
  })

  it('creates an inactive product draft with only title, description and image', async () => {
    const db = new MockDb()
    const result = await createTelegramProductDraft(db, {
      title: 'Áo khoác gió 2 lớp',
      description: 'Mô tả AI',
      imageUrl: '/media/telegram-products/2026-07-27/test.jpg',
      storefrontVisibility: ['boypho'],
    })

    assert.equal(result.id, 123)
    assert.equal(db.runs.length, 1)
    const insert = db.runs[0]
    assert.match(insert.sql, /INSERT INTO products/)
    assert.deepEqual(insert.values.slice(0, 5), [
      'Áo khoác gió 2 lớp',
      'Mô tả AI',
      0,
      null,
      'unisex',
    ])
    assert.equal(insert.values[7], '/media/telegram-products/2026-07-27/test.jpg')
    assert.equal(insert.values[8], JSON.stringify(['/media/telegram-products/2026-07-27/test.jpg']))
    assert.equal(insert.values[12], 0)
    assert.equal(insert.values[13], 0)
    assert.equal(insert.values[14], 0)
    assert.equal(insert.values[15], 0)
    assert.equal(insert.values[17], JSON.stringify(['boypho']))
  })
})
