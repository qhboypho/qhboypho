import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { serveStatic } from 'hono/cloudflare-workers'
import { getCookie, setCookie, deleteCookie } from 'hono/cookie'
import { registerPageRoutes } from './routes/pageRoutes'
import { registerAuthRoutes } from './routes/authRoutes'
import { registerProductRoutes } from './routes/productRoutes'
import { registerOrderRoutes } from './routes/orderRoutes'
import { registerPaymentRoutes } from './routes/paymentRoutes'
import { registerVoucherStatsRoutes } from './routes/voucherStatsRoutes'
import { registerAdminUtilityRoutes } from './routes/adminUtilityRoutes'
import { createInitDB } from './lib/db'
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

type Bindings = {
  DB: D1Database
  GOOGLE_CLIENT_ID?: string
  GOOGLE_CLIENT_SECRET?: string
  CASSO_SECURE_TOKEN?: string
  PAYOS_CLIENT_ID?: string
  PAYOS_API_KEY?: string
  PAYOS_CHECKSUM_KEY?: string
  ZALOPAY_APP_ID?: string
  ZALOPAY_KEY1?: string
  ZALOPAY_KEY2?: string
  ZALOPAY_CREATE_ENDPOINT?: string
  ZALOPAY_QUERY_ENDPOINT?: string
  ZALOPAY_CALLBACK_URL?: string
  GHTK_TOKEN?: string
  GHTK_CLIENT_SOURCE?: string
  GHTK_PICK_NAME?: string
  GHTK_PICK_ADDRESS?: string
  GHTK_PICK_PROVINCE?: string
  GHTK_PICK_DISTRICT?: string
  GHTK_PICK_WARD?: string
  GHTK_PICK_TEL?: string
  GHTK_FALLBACK_PROVINCE?: string
  GHTK_FALLBACK_DISTRICT?: string
  GHTK_FALLBACK_WARD?: string
  GHTK_DEFAULT_WEIGHT_KG?: string
  GHTK_LABEL_ORIGINAL?: string
  GHTK_LABEL_PAGE_SIZE?: string
}

const app = new Hono<{ Bindings: Bindings }>()

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


