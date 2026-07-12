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

export function registerPageRoutes(app: Hono<{ Bindings: AppBindings }>) {
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

  app.get('/', renderStorefront)

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

  app.get('*', renderStorefront)
}
