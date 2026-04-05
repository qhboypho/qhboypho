import { getCookie } from 'hono/cookie'
import type { Hono } from 'hono'
import type { AppBindings } from '../types/app'
import { storefrontHTML } from '../pages/storefrontPage'
import { adminHTML } from '../pages/adminPage'
import { adminLoginHTML } from '../pages/adminLoginPage'
import { validateAdminSessionToken } from '../lib/adminHelpers'

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

  app.get('/', (c) => c.html(storefrontHTML()))

  app.get('*', (c) => c.html(storefrontHTML()))
}
