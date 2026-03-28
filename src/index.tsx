import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { serveStatic } from 'hono/cloudflare-workers'
import { getCookie } from 'hono/cookie'
import { registerPageRoutes } from './routes/pageRoutes'
import { registerAuthRoutes } from './routes/authRoutes'
import { registerProductRoutes } from './routes/productRoutes'
import { registerOrderRoutes } from './routes/orderRoutes'
import { registerPaymentRoutes } from './routes/paymentRoutes'
import { registerVoucherStatsRoutes } from './routes/voucherStatsRoutes'
import { registerAdminUtilityRoutes } from './routes/adminUtilityRoutes'
import { createInitDB } from './lib/db'
import type { AppBindings } from './types/app'
import {
  ADDRESS_KIT_BASE_URL,
  addressKitCache,
  buildZaloPayAppTransId,
  getZaloPayConfig,
  getZaloPayMissingConfigKeys,
  parseJsonObject,
  payOSBuildDataString,
  payOSGetPaymentInfo,
  payOSSignWithChecksum,
  sanitizeAddressEffectiveDate,
  syncOrderPayment,
  syncOrderPaymentWithPayOS,
  syncOrderPaymentWithZaloPay
} from './lib/paymentHelpers'
import {
  buildInternalTestOrderWhereSql,
  getGhtkPickupConfig,
  ghtkCancelShipment,
  ghtkCreateShipment,
  ghtkFetchLabelPdf,
  ghtkFetchPickupAddresses,
  mergePdfBytes
} from './lib/shippingHelpers'
import {
  getAppSettingValue,
  normalizeAdminUserKey,
  resolveAdminProfile,
  upsertAppSettings
} from './lib/adminHelpers'
import { resolveSelectedColorImage } from './lib/orderColorHelpers'

const app = new Hono<{ Bindings: AppBindings }>()

app.use('/api/*', cors())
app.use('/static/*', serveStatic({ root: './' }))

// Enforce admin auth for all admin APIs except login
app.use('/api/admin/*', async (c, next) => {
  if (c.req.path === '/api/admin/login') {
    return next()
  }
  const adminToken = getCookie(c, 'admin_token')
  if (adminToken !== 'super_secret_admin_token') {
    return c.json({ success: false, error: 'Unauthorized' }, 401)
  }
  return next()
})

const initDB = createInitDB({ resolveSelectedColorImage })

registerProductRoutes(app, { initDB })

registerOrderRoutes(app, {
  initDB,
  buildInternalTestOrderWhereSql,
  resolveSelectedColorImage,
  ghtkCancelShipment,
  ghtkCreateShipment,
  ghtkFetchLabelPdf,
  mergePdfBytes
})

registerAdminUtilityRoutes(app, {
  initDB,
  getGhtkPickupConfig,
  upsertAppSettings,
  ghtkFetchPickupAddresses
})

registerAuthRoutes(app, {
  initDB,
  resolveAdminProfile,
  normalizeAdminUserKey,
  getAppSettingValue,
  upsertAppSettings
})

registerPaymentRoutes(app, {
  initDB,
  syncOrderPayment,
  syncOrderPaymentWithPayOS,
  syncOrderPaymentWithZaloPay,
  getZaloPayConfig,
  getZaloPayMissingConfigKeys,
  sanitizeAddressEffectiveDate,
  addressKitCache,
  ADDRESS_KIT_BASE_URL,
  buildZaloPayAppTransId,
  payOSSignWithChecksum,
  payOSBuildDataString,
  parseJsonObject,
  payOSGetPaymentInfo
})

registerVoucherStatsRoutes(app, {
  initDB,
  buildInternalTestOrderWhereSql
})


registerPageRoutes(app)

export default app
