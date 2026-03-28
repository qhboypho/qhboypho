import { getCookie } from 'hono/cookie'
import type { Hono } from 'hono'
import { storefrontHTML } from '../pages/storefrontPage'
import { adminHTML } from '../pages/adminPage'
import { adminLoginHTML } from '../pages/adminLoginPage'

export function registerPageRoutes(app: Hono<any>) {
  app.get('/admin', (c) => c.redirect('/admin/dashboard'))

  app.get('/admin/login', (c) => c.html(adminLoginHTML()))

  app.get('/admin/*', (c) => {
    const adminToken = getCookie(c, 'admin_token')
    if (adminToken !== 'super_secret_admin_token') {
      return c.redirect('/admin/login')
    }
    return c.html(adminHTML())
  })

  app.get('/', (c) => c.html(storefrontHTML()))

  app.get('*', (c) => c.html(storefrontHTML()))
}
