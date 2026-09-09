import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { serveStatic } from 'hono/cloudflare-workers'
import { getCookie } from 'hono/cookie'
import { registerPageRoutes } from './routes/pageRoutes'
import { registerAuthRoutes } from './routes/authRoutes'
import { registerProductRoutes } from './routes/productRoutes'
import { registerOrderRoutes } from './routes/orderRoutes'
import { registerReturnsRoutes } from './routes/returnsRoutes'
import { registerCustomerRoutes } from './routes/customerRoutes'
import { registerPaymentRoutes } from './routes/paymentRoutes'
import { registerAdminPaymentReconciliationRoutes } from './routes/adminPaymentReconciliationRoutes'
import { registerVoucherStatsRoutes } from './routes/voucherStatsRoutes'
import { registerAdminUtilityRoutes } from './routes/adminUtilityRoutes'
import { registerAdminPushRoutes } from './routes/adminPushRoutes'
import { registerFlashSaleRoutes } from './routes/flashSaleRoutes'
import { registerReviewRoutes } from './routes/reviewRoutes'
import { registerBlockRoutes } from './routes/blockRoutes'
import { registerLiveChatRoutes } from './routes/liveChatRoutes'
import { registerTelegramProductDraftRoutes } from './routes/telegramProductDraftRoutes'
import { registerMarketplaceRoutes } from './routes/marketplaceRoutes'
import { createInitDB } from './lib/db'
import type { AppBindings } from './types/app'
import ghtkTailSvg from '../public/GHTK_id8dR2ZdYY_1.svg?raw'
import {
  ADDRESS_KIT_BASE_URL,
  addressKitCache,
  buildManualVietQRPaymentData,
  buildMoMoOrderId,
  buildZaloPayAppTransId,
  getBankTransferProviderConfig,
  getMoMoConfig,
  getMoMoMissingConfigKeys,
  getPayOSConfig,
  getZaloPayConfig,
  getZaloPayMissingConfigKeys,
  parseJsonObject,
  payOSBuildDataString,
  payOSGetPaymentInfo,
  payOSSignWithChecksum,
  sanitizeAddressEffectiveDate,
  syncOrderPayment,
  syncOrderPaymentWithPayOS,
  syncOrderPaymentWithMoMo,
  syncOrderPaymentWithZaloPay
} from './lib/paymentHelpers'
import {
  buildInternalTestOrderWhereSql,
  getAllShippingCarriers,
  getAvailableShippingCarriers,
  getGhtkPickupConfig,
  getGhnConfig,
  getSpxConfig,
  ghnCreateShipment,
  ghnFetchLabelDocument,
  ghnFetchLabelPdf,
  ghtkCancelShipment,
  ghtkCreateShipment,
  ghtkFetchLabelPdf,
  ghtkFetchPickupAddresses,
  mergePdfBytes,
  spxCreateShipment,
  spxFetchLabelPdf
} from './lib/shippingHelpers'
import {
  getAppSettingValue,
  normalizeAdminUserKey,
  resolveAdminProfile,
  upsertAppSettings,
  validateAdminSessionToken
} from './lib/adminHelpers'
import { canAccessAdminRequest } from './lib/adminPermissions'
import { resolveSelectedColorImage } from './lib/orderColorHelpers'

const app = new Hono<{ Bindings: AppBindings }>()

app.use('/api/*', cors({
  origin: (origin, c) => {
    if (!origin) return origin
    const allowed = String((c.env as any).CORS_ALLOWED_ORIGINS || '').trim()
    if (allowed) {
      const list = allowed.split(',').map(o => o.trim()).filter(Boolean)
      if (list.includes('*')) return origin
      if (list.includes(origin)) return origin
    }
    try {
      const url = new URL(origin)
      if (url.hostname === 'localhost' || url.hostname === '127.0.0.1') return origin
    } catch { }
    return undefined
  },
  credentials: true
}))
app.use('/static/*', serveStatic({ root: './', manifest: {} }))
app.get('/GHTK_id8dR2ZdYY_1.svg', (c) => c.body(ghtkTailSvg, 200, {
  'content-type': 'image/svg+xml; charset=UTF-8',
  'cache-control': 'public, max-age=31536000, immutable'
}))

// Enforce admin auth for all admin APIs except login
app.use('/api/admin/*', async (c, next) => {
  if (c.req.path === '/api/admin/login') {
    return next()
  }
  const adminToken = getCookie(c, 'admin_token')
  const adminUserKey = getCookie(c, 'admin_user_key') || 'admin'
  const isValid = await validateAdminSessionToken(c.env.DB, adminUserKey, adminToken || '')
  if (!isValid) {
    return c.json({ success: false, error: 'Unauthorized' }, 401)
  }
  const isAllowed = await canAccessAdminRequest(c.env.DB, adminUserKey, c.req.path, c.req.method)
  if (!isAllowed) {
    return c.json({ success: false, error: 'Forbidden', code: 'ADMIN_PERMISSION_DENIED' }, 403)
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
  spxCreateShipment,
  spxFetchLabelPdf,
  ghnCreateShipment,
  ghnFetchLabelDocument,
  ghnFetchLabelPdf,
  getAvailableShippingCarriers,
  mergePdfBytes
})

registerReturnsRoutes(app, {
  initDB
})

registerCustomerRoutes(app, {
  initDB
})

registerAdminUtilityRoutes(app, {
  initDB,
  getGhtkPickupConfig,
  getSpxConfig,
  getGhnConfig,
  getAllShippingCarriers,
  getAvailableShippingCarriers,
  upsertAppSettings,
  ghtkFetchPickupAddresses
})

registerAdminPushRoutes(app, {
  initDB
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
  syncOrderPaymentWithMoMo,
  syncOrderPaymentWithZaloPay,
  getPayOSConfig,
  getZaloPayConfig,
  getZaloPayMissingConfigKeys,
  getBankTransferProviderConfig,
  getMoMoConfig,
  getMoMoMissingConfigKeys,
  buildManualVietQRPaymentData,
  sanitizeAddressEffectiveDate,
  addressKitCache,
  ADDRESS_KIT_BASE_URL,
  buildMoMoOrderId,
  buildZaloPayAppTransId,
  payOSSignWithChecksum,
  payOSBuildDataString,
  parseJsonObject,
  payOSGetPaymentInfo
})

registerAdminPaymentReconciliationRoutes(app, {
  initDB,
  buildInternalTestOrderWhereSql
})

registerVoucherStatsRoutes(app, {
  initDB,
  buildInternalTestOrderWhereSql
})

registerFlashSaleRoutes(app, {
  initDB
})

registerReviewRoutes(app, {
  initDB
})

registerBlockRoutes(app, {
  initDB
})

registerLiveChatRoutes(app, {
  initDB
})

registerMarketplaceRoutes(app, {
  initDB
})

registerTelegramProductDraftRoutes(app, {
  initDB
})

registerPageRoutes(app)

export default {
  fetch: (request: Request, env: AppBindings, ctx: ExecutionContext) => app.fetch(request, env, ctx),
}
