import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { Hono } from 'hono'
import { registerMarketplaceRoutes } from '../src/routes/marketplaceRoutes.ts'
import {
  generateGeminiProductDescription,
  readGeminiDescription,
} from '../src/routes/telegramProductDraftRoutes.ts'
import { notifyAdminNewOrderPush } from '../src/lib/webPushHelpers.ts'

const tscCommand = process.platform === 'win32'
  ? new URL('../node_modules/typescript/bin/tsc', import.meta.url)
  : new URL('../node_modules/.bin/tsc', import.meta.url)
const tscArgs = process.platform === 'win32'
  ? ['--noEmit', '--pretty', 'false']
  : ['--noEmit', '--pretty', 'false']
const tsc = spawnSync(process.execPath, [fileURLToPath(tscCommand), ...tscArgs], {
  encoding: 'utf8',
})
const tscOutput = `${tsc.stdout || ''}\n${tsc.stderr || ''}`
assert.equal(tsc.error, undefined, 'TypeScript compiler must start')
assert.equal(tsc.status, 0, `The full TypeScript check must pass:\n${tscOutput}`)
const scopedDiagnostics = tscOutput
  .split(/\r?\n/)
  .filter((line) => /src[\\/](routes[\\/](marketplaceRoutes|telegramProductDraftRoutes)|lib[\\/]webPushHelpers)\.ts/.test(line))
  .filter((line) => /error TS\d+/.test(line))

assert.deepEqual(
  scopedDiagnostics,
  [],
  `Expected no TypeScript diagnostics in the targeted modules:\n${scopedDiagnostics.join('\n')}`
)

const jsonResponse = (body, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: { 'content-type': 'application/json' },
})

class MockStatement {
  bind(...values) {
    this.values = values
    return this
  }

  async all() {
    return { results: [] }
  }

  async run() {
    return { meta: { changes: 1 } }
  }
}

const mockDb = {
  prepare() {
    return new MockStatement()
  },
}

const marketplaceApp = new Hono()
registerMarketplaceRoutes(marketplaceApp, { initDB: async () => undefined })

const originalFetch = globalThis.fetch
try {
  globalThis.fetch = async (input) => {
    const url = String(input)
    if (url.includes('/v3.0/order/list')) {
      return jsonResponse({
        code: 1,
        message: 'mock order response',
        data: [{ info: { id: 'order-1', status: 60, createdAt: 1 }, customerName: 'Test' }],
        paginator: {},
      })
    }
    if (url.includes('/v3.0/ecom/shop')) return jsonResponse({ code: 1, data: [] })
    throw new Error(`Unexpected mock URL: ${url}`)
  }

  const response = await marketplaceApp.request(
    '/api/admin/marketplaces/orders?date=2026-09-10&days=1',
    {},
    {
      DB: mockDb,
      NHANH_APP_ID: 'app',
      NHANH_BUSINESS_ID: 'business',
      NHANH_ACCESS_TOKEN: 'token',
    }
  )
  const body = await response.json()
  assert.equal(response.status, 200)
  assert.equal(body.data.rawCode, 1)
  assert.equal(body.data.rawMessage, '')
  assert.equal(body.data.orders.length, 1)
} finally {
  globalThis.fetch = originalFetch
}

assert.equal(
  readGeminiDescription({ candidates: [{ content: { parts: [{ text: '  Mô tả mock  ' }] } }] }),
  'Mô tả mock'
)
assert.equal(readGeminiDescription({ candidates: null }), '')

const geminiResult = await generateGeminiProductDescription({
  title: 'Áo mock',
  image: { bytes: new Uint8Array([1, 2, 3]).buffer, contentType: 'image/png', filePath: 'mock.png' },
  env: { GEMINI_API_KEY: 'test-key' },
  fetchImpl: async () => jsonResponse({
    candidates: [{ content: { parts: [{ text: '  Mô tả từ Gemini  ' }] } }],
  }),
})
assert.equal(geminiResult.description, 'Mô tả từ Gemini')
assert.equal(geminiResult.usedGemini, true)

const encodeBase64Url = (bytes) => Buffer.from(bytes).toString('base64url')
const vapidPair = await crypto.subtle.generateKey(
  { name: 'ECDSA', namedCurve: 'P-256' },
  true,
  ['sign', 'verify']
)
const vapidPublicKey = encodeBase64Url(new Uint8Array(await crypto.subtle.exportKey('raw', vapidPair.publicKey)))
const vapidPrivateKey = await crypto.subtle.exportKey('jwk', vapidPair.privateKey)
const subscriptionPair = await crypto.subtle.generateKey(
  { name: 'ECDH', namedCurve: 'P-256' },
  true,
  ['deriveBits']
)
const subscriptionPublicKey = encodeBase64Url(new Uint8Array(await crypto.subtle.exportKey('raw', subscriptionPair.publicKey)))
const pushDb = {
  prepare() {
    return {
      bind() { return this },
      async all() {
        return {
          results: [{
            id: 7,
            endpoint: 'https://push.mock/subscription',
            p256dh: subscriptionPublicKey,
            auth: encodeBase64Url(crypto.getRandomValues(new Uint8Array(16))),
          }],
        }
      },
      async run() { return { meta: { changes: 1 } } },
    }
  },
}

let capturedPushInit
const fetchBeforePush = globalThis.fetch
try {
  globalThis.fetch = async (_input, init) => {
    capturedPushInit = init
    return new Response(null, { status: 201 })
  }
  const pushResult = await notifyAdminNewOrderPush(
    {
      WEB_PUSH_VAPID_PUBLIC_KEY: vapidPublicKey,
      WEB_PUSH_VAPID_PRIVATE_KEY: vapidPrivateKey.d,
      WEB_PUSH_VAPID_SUBJECT: 'mailto:test@example.com',
    },
    pushDb,
    { id: 7, order_code: 'ORDER-7', customer_name: 'Test', total_price: 1000 }
  )
  assert.equal(pushResult.sent, 1)
  assert.ok(capturedPushInit?.body instanceof ArrayBuffer)
  assert.equal(capturedPushInit.body.byteLength, Number(capturedPushInit.headers['content-length']))
} finally {
  globalThis.fetch = fetchBeforePush
}

console.log('targeted type-boundary integration checks passed')
