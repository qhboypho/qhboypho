import { getCookie } from 'hono/cookie'
import type { Hono } from 'hono'
import type { AppBindings } from '../types/app'
import { storefrontHTML } from '../pages/storefrontPage'
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
    return c.html(storefrontHTML({ textUiSettings }))
  }

  app.get('/', renderStorefront)

  app.get('*', renderStorefront)
}
