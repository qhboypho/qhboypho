import { getCookie } from 'hono/cookie'
import type { Hono } from 'hono'
import type { AppBindings } from '../types/app'
import { storefrontHTML } from '../pages/storefrontPage'
import { privacyPolicyHTML } from '../pages/privacyPolicyPage'
import { returnPolicyHTML } from '../pages/returnPolicyPage'
import { adminHTML } from '../pages/adminPage'
import { adminLoginHTML } from '../pages/adminLoginPage'
import { validateAdminSessionToken } from '../lib/adminHelpers'
import { readTextUiSettings } from '../lib/textUiSettings'

function adminManifestJson(): string {
  return JSON.stringify({
    name: 'QH Clothes Admin',
    short_name: 'QH Admin',
    description: 'Dashboard quan ly QH Clothes tren dien thoai.',
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

  app.get('/chinh-sach-doi-tra', (c) => c.html(returnPolicyHTML()))
  app.get('/return-policy', (c) => c.redirect('/chinh-sach-doi-tra'))
  app.get('/chinh-sach-bao-mat', (c) => c.html(privacyPolicyHTML()))
  app.get('/privacy-policy', (c) => c.redirect('/chinh-sach-bao-mat'))

  app.get('*', renderStorefront)
}
