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

export function registerPageRoutes(app: Hono<{ Bindings: AppBindings }>) {
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
