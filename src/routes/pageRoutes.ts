import { getCookie } from 'hono/cookie'
import type { Hono } from 'hono'
import type { AppBindings } from '../types/app'
import { storefrontHTML } from '../pages/storefrontPage'
import { hotTrendNuHTML } from '../pages/hottrendnuPage'
import { hotTrendNuPaymentPolicyHTML, hotTrendNuPrivacyPolicyHTML, hotTrendNuReturnPolicyHTML, hotTrendNuShippingPolicyHTML } from '../pages/hottrendnuPolicyPage'
import { privacyPolicyHTML } from '../pages/privacyPolicyPage'
import { returnPolicyHTML } from '../pages/returnPolicyPage'
import { adminHTML } from '../pages/adminPage'
import { adminLoginHTML } from '../pages/adminLoginPage'
import { validateAdminSessionToken } from '../lib/adminHelpers'
import { readTextUiSettings } from '../lib/textUiSettings'

function adminManifestJson(): string {
  return JSON.stringify({
    name: 'QH Boypho Admin',
    short_name: 'QH Admin',
    description: 'Dashboard quan ly QH Boypho tren dien thoai.',
    start_url: '/admin/dashboard',
    scope: '/admin/',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#0f172a',
    theme_color: '#e84393',
    icons: [
      {
        src: '/qh-logo.png',
        sizes: '192x192 512x512',
        type: 'image/png',
        purpose: 'any maskable',
      },
    ],
  })
}

function adminServiceWorkerScript(): string {
  return `const ADMIN_CACHE = 'qh-admin-shell-v1'
const ADMIN_STATIC_ASSETS = ['/qh-logo.png', '/admin-manifest.webmanifest']

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(ADMIN_CACHE)
      .then((cache) => cache.addAll(ADMIN_STATIC_ASSETS))
      .catch(() => undefined)
  )
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(
      keys.filter((key) => key !== ADMIN_CACHE).map((key) => caches.delete(key))
    ))
  )
  self.clients.claim()
})

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url)
  if (url.origin !== self.location.origin) return
  if (url.pathname.startsWith('/api/') || url.pathname.startsWith('/admin/')) return
  if (event.request.method !== 'GET') return
  const cacheable = ADMIN_STATIC_ASSETS.includes(url.pathname) || url.pathname.startsWith('/static/') || url.pathname.startsWith('/og/')
  if (!cacheable) return
  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached
      return fetch(event.request).then((response) => {
        if (!response || response.status !== 200) return response
        const copy = response.clone()
        caches.open(ADMIN_CACHE).then((cache) => cache.put(event.request, copy)).catch(() => undefined)
        return response
      })
    })
  )
})

self.addEventListener('push', (event) => {
  let data = {}
  try {
    const rawText = event.data ? event.data.text() : ''
    data = rawText ? JSON.parse(rawText) : {}
  } catch (_) {
    data = { title: 'Boypho có đơn mới', body: 'Có đơn hàng mới cần xử lý.' }
  }
  const title = data.title || 'Boypho có đơn mới'
  const options = {
    body: data.body || 'Có đơn hàng mới cần xử lý.',
    icon: data.icon || '/qh-logo.png',
    badge: data.badge || '/qh-logo.png',
    tag: data.tag || 'boypho-new-order',
    renotify: true,
    requireInteraction: true,
    data: {
      url: data.url || '/admin/orders',
      orderId: data.orderId || 0,
      orderCode: data.orderCode || ''
    }
  }
  event.waitUntil(self.registration.showNotification(title, options))
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const targetUrl = new URL(event.notification?.data?.url || '/admin/orders', self.location.origin).href
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.startsWith(self.location.origin + '/admin')) {
          return client.focus().then(() => client.navigate ? client.navigate(targetUrl) : client)
        }
      }
      return clients.openWindow(targetUrl)
    })
  )
})
`
}

function notFoundHTML(): string {
  return `<!doctype html>
<html lang="vi">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
    <meta name="robots" content="noindex,follow" />
    <title>Không tìm thấy trang - QH Boypho</title>
    <link rel="icon" href="/qh-logo.png" />
    <style>
      :root {
        color-scheme: dark;
        --bg: #050816;
        --panel: rgba(10, 18, 34, 0.88);
        --line: rgba(148, 163, 184, 0.22);
        --text: #f8fafc;
        --muted: #94a3b8;
        --pink: #e84393;
        --blue: #4776ff;
        --purple: #b64ee5;
      }

      * {
        box-sizing: border-box;
      }

      body {
        margin: 0;
        min-height: 100vh;
        font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        color: var(--text);
        background:
          radial-gradient(circle at 20% 18%, rgba(232, 67, 147, 0.22), transparent 28rem),
          radial-gradient(circle at 82% 72%, rgba(71, 118, 255, 0.24), transparent 30rem),
          linear-gradient(135deg, #030712 0%, #07111f 52%, #111827 100%);
      }

      main {
        display: grid;
        min-height: 100vh;
        place-items: center;
        padding: clamp(1.25rem, 4vw, 3rem);
      }

      .not-found-shell {
        width: min(100%, 72rem);
      }

      .not-found-card {
        overflow: hidden;
        border: 1px solid rgba(232, 67, 147, 0.28);
        border-radius: 1.5rem;
        background: var(--panel);
        box-shadow: 0 1.5rem 5rem rgba(0, 0, 0, 0.42);
        backdrop-filter: blur(18px);
      }

      .not-found-card.primary-panel {
        display: flex;
        min-height: 27rem;
        flex-direction: column;
      }

      .not-found-top {
        display: flex;
        align-items: center;
        gap: 0.8rem;
        border-bottom: 1px solid var(--line);
        padding: 1.1rem 1.2rem;
        background: rgba(3, 7, 18, 0.62);
      }

      .not-found-logo {
        width: 2.65rem;
        height: 2.65rem;
        border-radius: 999px;
        background: #fff;
        box-shadow: 0 0 0 0.22rem rgba(255, 255, 255, 0.12);
      }

      .not-found-brand {
        margin: 0;
        font-size: 1.02rem;
        font-weight: 800;
      }

      .not-found-subtitle {
        margin: 0.12rem 0 0;
        color: var(--muted);
        font-size: 0.86rem;
        font-weight: 600;
      }

      .not-found-body {
        display: flex;
        flex: 1;
        flex-direction: column;
        justify-content: center;
        padding: clamp(1.6rem, 5vw, 3.4rem);
      }

      .not-found-code {
        width: max-content;
        border-radius: 1.2rem;
        padding: 0.28rem 0.8rem;
        color: rgba(255, 255, 255, 0.86);
        background: rgba(255, 255, 255, 0.08);
        font-size: clamp(4.8rem, 13vw, 8rem);
        font-weight: 900;
        line-height: 0.9;
        letter-spacing: 0;
      }

      h1 {
        margin: 1.15rem 0 0;
        max-width: none;
        font-size: clamp(1.05rem, 2.5vw, 1.55rem);
        line-height: 1.25;
        font-weight: 850;
        letter-spacing: 0;
      }

      .not-found-copy {
        margin: 1rem 0 0;
        max-width: 38rem;
        color: #cbd5e1;
        font-size: 1rem;
        line-height: 1.7;
      }

      .not-found-actions {
        display: flex;
        flex-wrap: wrap;
        gap: 0.75rem;
        margin-top: 1.45rem;
      }

      .not-found-button {
        display: inline-flex;
        min-height: 2.85rem;
        align-items: center;
        justify-content: center;
        border: 1px solid transparent;
        border-radius: 999px;
        padding: 0 1.1rem;
        color: #fff;
        font-size: 0.94rem;
        font-weight: 850;
        text-decoration: none;
        transition: transform 180ms ease, border-color 180ms ease, background 180ms ease;
      }

      .not-found-button:hover {
        transform: translateY(-1px);
      }

      .not-found-button.primary {
        background: #2563eb;
        border-color: #2563eb;
        box-shadow: 0 8px 20px rgba(37, 99, 235, 0.18);
      }

      .not-found-button.primary:hover {
        background: #1d4ed8;
        border-color: #1d4ed8;
      }

      .not-found-button:focus-visible {
        outline: 2px solid #93c5fd;
        outline-offset: 4px;
      }

      .not-found-button.secondary {
        border-color: rgba(148, 163, 184, 0.28);
        background: rgba(15, 23, 42, 0.72);
      }

      @media (max-width: 820px) {
        .not-found-card.primary-panel {
          min-height: 0;
        }
      }

      @media (max-width: 420px) {
        .not-found-card {
          border-radius: 1.1rem;
        }

        .not-found-button {
          width: 100%;
        }
      }
    </style>
  </head>
  <body>
    <main>
      <div class="not-found-shell">
        <section class="not-found-card primary-panel" aria-labelledby="not-found-title">
          <div class="not-found-top">
            <img class="not-found-logo" src="/qh-logo.png" alt="QH Boypho" />
            <div>
              <p class="not-found-brand">QH Boypho</p>
              <p class="not-found-subtitle">Shop thời trang nam nữ</p>
            </div>
          </div>
          <div class="not-found-body">
            <div class="not-found-code">404</div>
            <h1 id="not-found-title">Trang này không tồn tại</h1>
            <p class="not-found-copy">Link bạn vừa mở chưa có nội dung hoặc sản phẩm đã được đổi đường dẫn. Quay lại trang chủ để xem các mẫu đang bán nhé.</p>
            <div class="not-found-actions">
              <a class="not-found-button primary" href="/">Về trang chủ</a>
              <a class="not-found-button secondary" href="/hottrendnu">Xem Hot Trend Nữ</a>
            </div>
          </div>
        </section>
      </div>
    </main>
  </body>
</html>`
}

async function redirectToCanonicalHost(c: any, next: () => Promise<void>) {
  const url = new URL(c.req.url)
  if (url.hostname.startsWith('www.')) {
    url.hostname = url.hostname.slice(4)
    return c.redirect(url.toString(), 301)
  }
  await next()
}

function hasOnlyKnownStorefrontQueryParams(url: URL): boolean {
  const knownKeys = new Set([
    'search',
    'product',
    'ref',
    'aff',
    'affiliate',
    'fbclid',
    'gclid',
  ])
  const knownPrefixes = ['utm_']
  for (const rawKey of url.searchParams.keys()) {
    const key = rawKey.trim().toLowerCase()
    if (!key) return false
    if (knownKeys.has(key)) continue
    if (knownPrefixes.some((prefix) => key.startsWith(prefix))) continue
    return false
  }
  return true
}

export function registerPageRoutes(app: Hono<{ Bindings: AppBindings }>) {
  app.use('*', redirectToCanonicalHost)

  app.get('/admin-manifest.webmanifest', (c) => c.body(adminManifestJson(), 200, {
    'content-type': 'application/manifest+json; charset=UTF-8',
    'cache-control': 'public, max-age=300',
  }))

  app.get('/admin-sw.js', (c) => c.body(adminServiceWorkerScript(), 200, {
    'content-type': 'application/javascript; charset=UTF-8',
    'cache-control': 'no-cache',
  }))

  app.get('/admin', (c) => c.redirect('/admin/dashboard'))

  app.get('/admin/login', (c) => c.html(adminLoginHTML()))

  app.get('/admin/*', async (c) => {
    const adminToken = getCookie(c, 'admin_token')
    const adminUserKey = getCookie(c, 'admin_user_key') || 'admin'
    const isValid = await validateAdminSessionToken(c.env.DB, adminUserKey, adminToken || '')
    if (!isValid) {
      return c.redirect('/admin/login')
    }
    return c.html(adminHTML())
  })

  async function renderStorefront(c: any) {
    const textUiSettings = await readTextUiSettings(c.env.DB).catch(() => undefined)
    const requestUrl = new URL(c.req.url)
    const canonicalUrl = requestUrl.origin + '/'
    const ogImageUrl = requestUrl.origin + '/og/qh-clothes-share-16x9.png'
    return c.html(storefrontHTML({ textUiSettings, canonicalUrl, ogImageUrl }))
  }

  app.get('/', async (c) => {
    const requestUrl = new URL(c.req.url)
    if (!hasOnlyKnownStorefrontQueryParams(requestUrl)) {
      return c.html(notFoundHTML(), 404)
    }
    return renderStorefront(c)
  })

  app.get('/hottrendnu', async (c) => {
    const textUiSettings = await readTextUiSettings(c.env.DB).catch(() => undefined)
    const requestUrl = new URL(c.req.url)
    const canonicalUrl = requestUrl.origin + '/hottrendnu'
    const ogImageUrl = requestUrl.origin + '/og/qh-clothes-share-16x9.png'
    return c.html(hotTrendNuHTML({ textUiSettings, canonicalUrl, ogImageUrl }))
  })

  app.get('/hottrendnu/chinh-sach-doi-tra', (c) => c.html(hotTrendNuReturnPolicyHTML()))
  app.get('/hottrendnu/return-policy', (c) => c.redirect('/hottrendnu/chinh-sach-doi-tra'))
  app.get('/hottrendnu/chinh-sach-thanh-toan', (c) => c.html(hotTrendNuPaymentPolicyHTML()))
  app.get('/hottrendnu/payment-policy', (c) => c.redirect('/hottrendnu/chinh-sach-thanh-toan'))
  app.get('/hottrendnu/chinh-sach-van-chuyen', (c) => c.html(hotTrendNuShippingPolicyHTML()))
  app.get('/hottrendnu/shipping-policy', (c) => c.redirect('/hottrendnu/chinh-sach-van-chuyen'))
  app.get('/hottrendnu/chinh-sach-bao-mat', (c) => c.html(hotTrendNuPrivacyPolicyHTML()))
  app.get('/hottrendnu/privacy-policy', (c) => c.redirect('/hottrendnu/chinh-sach-bao-mat'))

  app.get('/chinh-sach-doi-tra', (c) => c.html(returnPolicyHTML()))
  app.get('/return-policy', (c) => c.redirect('/chinh-sach-doi-tra'))
  app.get('/chinh-sach-bao-mat', (c) => c.html(privacyPolicyHTML()))
  app.get('/privacy-policy', (c) => c.redirect('/chinh-sach-bao-mat'))

  app.get('*', (c) => c.html(notFoundHTML(), 404))
}
