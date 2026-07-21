import type { Hono } from 'hono'
import type { AppBindings } from '../types/app'
import { getCookie } from 'hono/cookie'
import { validateAdminSessionToken } from '../lib/adminHelpers'
import { getUserSessionUserId } from '../lib/userSessionHelpers'
import { getRuntimeConfigValue } from '../lib/runtimeConfigHelpers'

type PaymentRouteDeps = {
  initDB: (db: D1Database) => Promise<void>
  syncOrderPayment: (db: D1Database, env: any, order: any) => Promise<any>
  syncOrderPaymentWithPayOS: (db: D1Database, env: any, order: any) => Promise<any>
  syncOrderPaymentWithZaloPay: (db: D1Database, env: any, order: any) => Promise<any>
  getPayOSConfig: (db: D1Database, env: any) => Promise<any>
  getZaloPayConfig: (db: D1Database, env: any) => Promise<any>
  getZaloPayMissingConfigKeys: (config: any) => string[]
  getBankTransferProviderConfig: (db: D1Database, env: any) => Promise<any>
  buildManualVietQRPaymentData: (order: any, config: any) => any
  sanitizeAddressEffectiveDate: (value: string) => string
  addressKitCache: { provinces: Map<string, any[]>, communes: Map<string, any[]> }
  ADDRESS_KIT_BASE_URL: string
  buildZaloPayAppTransId: (orderId: number, nowMs?: number) => string
  payOSSignWithChecksum: (key: string, payload: string) => Promise<string>
  payOSBuildDataString: (input: Record<string, any>) => string
  parseJsonObject: (value: any) => Record<string, any>
  payOSGetPaymentInfo: (db: D1Database, env: any, paymentLinkIdOrOrderCode: string | number) => Promise<any>
}

async function verifyOrderAccess(c: any, order: any): Promise<boolean> {
  const userId = await getUserSessionUserId(c)
  if (userId && order.user_id != null && String(order.user_id) === String(userId)) return true
  const adminToken = getCookie(c, 'admin_token')
  const adminUserKey = getCookie(c, 'admin_user_key') || 'admin'
  if (adminToken) return validateAdminSessionToken(c.env.DB, adminUserKey, adminToken)
  return false
}

async function isWalletTopupEnabled(db: D1Database): Promise<boolean> {
  const row = await db.prepare("SELECT value FROM app_settings WHERE key='wallet_topup_enabled' LIMIT 1").first<{ value?: string | null }>()
  return String(row?.value || '1') !== '0'
}

export function registerPaymentRoutes(app: Hono<{ Bindings: AppBindings }>, deps: PaymentRouteDeps) {
  app.post('/api/webhooks/casso', async (c) => {
    try {
      await deps.initDB(c.env.DB)
      const configuredToken = await getRuntimeConfigValue(c.env.DB, c.env, 'CASSO_SECURE_TOKEN')
      if (!configuredToken) {
        console.error('[payments] Casso webhook token is not configured')
        return c.json({ error: 'Webhook not configured' }, 503)
      }
      const secureToken = String(c.req.header('secure-token') || '').trim()
      if (secureToken !== configuredToken) {
        return c.json({ error: 'Invalid token' }, 401)
      }

      const body = await c.req.json()
      if (body.error !== 0) return c.json({ success: false })

      const transactions = body.data || []

      let count = 0
      for (const tx of transactions) {
        const exists = await c.env.DB.prepare("SELECT id FROM transactions WHERE tid=?").bind(tx.tid).first()
        if (exists) continue

        const desc = (tx.description || '').toUpperCase()
        const match = desc.match(/QHVN90(\d+)/)

        if (match) {
          const walletTopupEnabled = await isWalletTopupEnabled(c.env.DB)
          if (!walletTopupEnabled) {
            await c.env.DB.prepare("INSERT INTO transactions (tid, amount, description) VALUES (?, ?, ?)").bind(tx.tid, tx.amount, tx.description).run()
            continue
          }
          const userId = match[1]
          const amount = tx.amount
          await c.env.DB.prepare("UPDATE users SET balance = balance + ? WHERE id = ?").bind(amount, userId).run()
          await c.env.DB.prepare("INSERT INTO transactions (tid, amount, description, user_id) VALUES (?, ?, ?, ?)").bind(tx.tid, amount, tx.description, userId).run()
          count++
        } else {
          await c.env.DB.prepare("INSERT INTO transactions (tid, amount, description) VALUES (?, ?, ?)").bind(tx.tid, tx.amount, tx.description).run()
        }
      }

      return c.json({ success: true, processed: count })
    } catch (e: any) {
      return c.json({ success: false, error: e.message }, 500)
    }
  })

  app.get('/api/orders/:orderCode/payment-status', async (c) => {
    try {
      await deps.initDB(c.env.DB)
      const orderCode = String(c.req.param('orderCode') || '').trim().toUpperCase()
      if (!orderCode) return c.json({ success: false, error: 'MISSING_ORDER_CODE' }, 400)
      const order = await c.env.DB.prepare(`
        SELECT id, user_id, order_code, payment_status, payment_paid_at, status, payment_method, payment_link_id, payment_order_code, total_price
        FROM orders
        WHERE order_code=?
      `).bind(orderCode).first() as any
      if (!order) return c.json({ success: false, error: 'ORDER_NOT_FOUND' }, 404)
      if (!await verifyOrderAccess(c, order)) return c.json({ success: false, error: 'FORBIDDEN' }, 403)
      await deps.syncOrderPayment(c.env.DB, c.env, order)
      const latest = await c.env.DB.prepare(`SELECT order_code, payment_status, payment_paid_at, status FROM orders WHERE id=?`).bind(order.id).first() as any
      return c.json({ success: true, data: latest || order })
    } catch (e: any) {
      return c.json({ success: false, error: e.message }, 500)
    }
  })

  app.post('/api/orders/:id/payos-sync', async (c) => {
    try {
      await deps.initDB(c.env.DB)
      const id = Number(c.req.param('id') || 0)
      if (!id) return c.json({ success: false, error: 'INVALID_ORDER_ID' }, 400)
      const order = await c.env.DB.prepare(`
        SELECT id, user_id, order_code, payment_status, payment_paid_at, status, payment_method, payment_link_id, payment_order_code, total_price
        FROM orders
        WHERE id=?
      `).bind(id).first() as any
      if (!order) return c.json({ success: false, error: 'ORDER_NOT_FOUND' }, 404)
      if (!await verifyOrderAccess(c, order)) return c.json({ success: false, error: 'FORBIDDEN' }, 403)
      const sync = await deps.syncOrderPaymentWithPayOS(c.env.DB, c.env, order)
      const latest = await c.env.DB.prepare(`SELECT order_code, payment_status, payment_paid_at, status FROM orders WHERE id=?`).bind(id).first() as any
      return c.json({ success: true, data: latest || order, synced: !!sync.synced })
    } catch (e: any) {
      return c.json({ success: false, error: e.message }, 500)
    }
  })

  app.post('/api/orders/:id/zalopay-sync', async (c) => {
    try {
      await deps.initDB(c.env.DB)
      const id = Number(c.req.param('id') || 0)
      if (!id) return c.json({ success: false, error: 'INVALID_ORDER_ID' }, 400)
      const order = await c.env.DB.prepare(`
        SELECT id, user_id, order_code, payment_status, payment_paid_at, status, payment_method, payment_link_id, payment_order_code, total_price
        FROM orders
        WHERE id=?
      `).bind(id).first() as any
      if (!order) return c.json({ success: false, error: 'ORDER_NOT_FOUND' }, 404)
      if (!await verifyOrderAccess(c, order)) return c.json({ success: false, error: 'FORBIDDEN' }, 403)
      const sync = await deps.syncOrderPaymentWithZaloPay(c.env.DB, c.env, order)
      const latest = await c.env.DB.prepare(`SELECT order_code, payment_status, payment_paid_at, status FROM orders WHERE id=?`).bind(id).first() as any
      return c.json({ success: true, data: latest || order, synced: !!sync.synced })
    } catch (e: any) {
      return c.json({ success: false, error: e.message }, 500)
    }
  })

  app.get('/api/payments/zalopay/config', async (c) => {
    await deps.initDB(c.env.DB)
    const config = await deps.getZaloPayConfig(c.env.DB, c.env)
    const missing = deps.getZaloPayMissingConfigKeys(config)
    return c.json({
      success: true,
      data: {
        ready: missing.length === 0,
        missing
      }
    })
  })

  app.get('/api/address/provinces', async (c) => {
    try {
      const effectiveDate = deps.sanitizeAddressEffectiveDate(c.req.query('effectiveDate') || 'latest')
      if (deps.addressKitCache.provinces.has(effectiveDate)) {
        return c.json({ success: true, data: deps.addressKitCache.provinces.get(effectiveDate) || [] })
      }

      const url = `${deps.ADDRESS_KIT_BASE_URL}/${effectiveDate}/provinces`
      const res = await fetch(url, { headers: { accept: 'application/json' } })
      if (!res.ok) return c.json({ success: false, error: 'ADDRESSKIT_UPSTREAM_FAILED' }, 502)

      const json: any = await res.json().catch(() => ({}))
      const provinces = Array.isArray(json?.provinces) ? json.provinces : []
      const normalized = provinces
        .map((p: any) => ({
          code: String(p?.code || '').trim(),
          name: String(p?.name || '').trim(),
          administrativeLevel: String(p?.administrativeLevel || '').trim()
        }))
        .filter((p: any) => p.code && p.name)
        .sort((a: any, b: any) => a.name.localeCompare(b.name, 'vi'))

      deps.addressKitCache.provinces.set(effectiveDate, normalized)
      return c.json({ success: true, data: normalized })
    } catch (e: any) {
      return c.json({ success: false, error: e?.message || 'ADDRESSKIT_FETCH_FAILED' }, 500)
    }
  })

  app.get('/api/address/provinces/:provinceCode/communes', async (c) => {
    try {
      const effectiveDate = deps.sanitizeAddressEffectiveDate(c.req.query('effectiveDate') || 'latest')
      const provinceCode = String(c.req.param('provinceCode') || '').trim()
      if (!provinceCode) return c.json({ success: false, error: 'INVALID_PROVINCE_CODE' }, 400)
      const cacheKey = `${effectiveDate}:${provinceCode}`
      if (deps.addressKitCache.communes.has(cacheKey)) {
        return c.json({ success: true, data: deps.addressKitCache.communes.get(cacheKey) || [] })
      }

      const encodedProvinceCode = encodeURIComponent(provinceCode)
      const url = `${deps.ADDRESS_KIT_BASE_URL}/${effectiveDate}/provinces/${encodedProvinceCode}/communes`
      const res = await fetch(url, { headers: { accept: 'application/json' } })
      if (!res.ok) return c.json({ success: false, error: 'ADDRESSKIT_UPSTREAM_FAILED' }, 502)

      const json: any = await res.json().catch(() => ({}))
      const communes = Array.isArray(json?.communes) ? json.communes : []
      const normalized = communes
        .map((p: any) => ({
          code: String(p?.code || '').trim(),
          name: String(p?.name || '').trim(),
          administrativeLevel: String(p?.administrativeLevel || '').trim(),
          provinceCode: String(p?.provinceCode || '').trim(),
          provinceName: String(p?.provinceName || '').trim()
        }))
        .filter((p: any) => p.code && p.name)
        .sort((a: any, b: any) => a.name.localeCompare(b.name, 'vi'))

      deps.addressKitCache.communes.set(cacheKey, normalized)
      return c.json({ success: true, data: normalized })
    } catch (e: any) {
      return c.json({ success: false, error: e?.message || 'ADDRESSKIT_FETCH_FAILED' }, 500)
    }
  })

  app.post('/api/orders/:id/zalopay-link', async (c) => {
    try {
      await deps.initDB(c.env.DB)
      const id = Number(c.req.param('id') || 0)
      if (!id) return c.json({ success: false, error: 'INVALID_ORDER_ID' }, 400)
      const body: any = await c.req.json().catch(() => ({}))
      const origin = String(body.origin || c.req.header('origin') || '').trim()
      if (!origin) return c.json({ success: false, error: 'MISSING_ORIGIN' }, 400)

      const order = await c.env.DB.prepare(`
        SELECT id, user_id, order_code, total_price, customer_name, customer_phone, product_name, quantity, payment_method, payment_status, payment_link_id, payment_checkout_url, payment_order_code
        FROM orders WHERE id=?
      `).bind(id).first() as any
      if (!order) return c.json({ success: false, error: 'ORDER_NOT_FOUND' }, 404)
      if (!await verifyOrderAccess(c, order)) return c.json({ success: false, error: 'FORBIDDEN' }, 403)
      if (String(order.payment_method || '').toUpperCase() !== 'ZALOPAY') {
        return c.json({ success: false, error: 'PAYMENT_METHOD_NOT_ZALOPAY' }, 400)
      }
      if (String(order.payment_status || '').toLowerCase() === 'paid') {
        return c.json({ success: true, data: { alreadyPaid: true, orderCode: order.order_code } })
      }

      const sync = await deps.syncOrderPaymentWithZaloPay(c.env.DB, c.env, order)
      if (sync.paid) {
        return c.json({ success: true, data: { alreadyPaid: true, orderCode: order.order_code } })
      }

      const config = await deps.getZaloPayConfig(c.env.DB, c.env)
      const missingConfig = deps.getZaloPayMissingConfigKeys(config)
      if (missingConfig.length) {
        return c.json({ success: false, error: 'ZALOPAY_CONFIG_MISSING', missing: missingConfig }, 500)
      }

      const amount = Math.round(Number(order.total_price || 0))
      if (amount <= 0) return c.json({ success: false, error: 'INVALID_ORDER_AMOUNT' }, 400)

      const nowMs = Date.now()
      const appTransId = deps.buildZaloPayAppTransId(Number(order.id || 0), nowMs)
      const successUrl = `${origin}/?order=${encodeURIComponent(order.order_code)}&pay=success&provider=zalopay&closeTab=1`
      const cancelUrl = `${origin}/?order=${encodeURIComponent(order.order_code)}&pay=cancel&provider=zalopay`
      const embedData = JSON.stringify({
        order_id: Number(order.id || 0),
        order_code: String(order.order_code || ''),
        redirecturl: successUrl,
        cancelurl: cancelUrl
      })
      const item = JSON.stringify([
        {
          itemid: String(order.id || ''),
          itemname: String(order.product_name || 'Don hang'),
          itemprice: amount,
          itemquantity: Number(order.quantity || 1) || 1
        }
      ])
      const appUser = String(order.customer_phone || order.customer_name || `user_${order.id}`).slice(0, 50)
      const description = `QHBoypho - Thanh toan don hang #${order.order_code}`.slice(0, 256)
      const callbackUrl = config.callbackUrl || ''

      const macInput = `${config.appIdRaw}|${appTransId}|${appUser}|${amount}|${nowMs}|${embedData}|${item}`
      const mac = await deps.payOSSignWithChecksum(config.key1, macInput)

      const form = new URLSearchParams()
      form.set('app_id', config.appIdRaw)
      form.set('app_user', appUser)
      form.set('app_time', String(nowMs))
      form.set('amount', String(amount))
      form.set('app_trans_id', appTransId)
      form.set('embed_data', embedData)
      form.set('item', item)
      form.set('description', description)
      form.set('expire_duration_seconds', '900')
      form.set('mac', mac)
      if (callbackUrl) form.set('callback_url', callbackUrl)

      const resp = await fetch(config.createEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: form.toString()
      })
      const zaloRes: any = await resp.json().catch(() => ({}))
      const returnCode = Number(zaloRes?.return_code || 0)
      if (!resp.ok || returnCode !== 1 || !zaloRes?.order_url) {
        return c.json({ success: false, error: 'ZALOPAY_CREATE_LINK_FAILED', detail: zaloRes }, 400)
      }

      await c.env.DB.prepare(`
        UPDATE orders
        SET payment_provider='ZALOPAY',
            payment_link_id=?,
            updated_at=CURRENT_TIMESTAMP
        WHERE id=?
      `).bind(appTransId, id).run()

      return c.json({
        success: true,
        data: {
          appTransId,
          orderUrl: zaloRes.order_url,
          qrCode: zaloRes.qr_code || '',
          zpTransToken: zaloRes.zp_trans_token || '',
          orderToken: zaloRes.order_token || '',
          orderCode: order.order_code
        }
      })
    } catch (e: any) {
      return c.json({ success: false, error: e.message }, 500)
    }
  })

  const createBankTransferLink = async (c: any) => {
    try {
      await deps.initDB(c.env.DB)
      const id = Number(c.req.param('id') || 0)
      if (!id) return c.json({ success: false, error: 'INVALID_ORDER_ID' }, 400)
      const body: any = await c.req.json().catch(() => ({}))
      const origin = String(body.origin || c.req.header('origin') || '').trim()
      if (!origin) return c.json({ success: false, error: 'MISSING_ORIGIN' }, 400)

      const order = await c.env.DB.prepare(`
        SELECT id, user_id, order_code, total_price, customer_name, customer_phone, product_name, quantity,
               payment_method, payment_status, payment_link_id, payment_checkout_url, payment_order_code
        FROM orders WHERE id=?
      `).bind(id).first() as any
      if (!order) return c.json({ success: false, error: 'ORDER_NOT_FOUND' }, 404)
      if (!await verifyOrderAccess(c, order)) return c.json({ success: false, error: 'FORBIDDEN' }, 403)
      if (String(order.payment_method || '').toUpperCase() !== 'BANK_TRANSFER') {
        return c.json({ success: false, error: 'PAYMENT_METHOD_NOT_BANK_TRANSFER' }, 400)
      }
      if (String(order.payment_status || '').toLowerCase() === 'paid') {
        return c.json({ success: true, data: { alreadyPaid: true, orderCode: order.order_code } })
      }

      const bankTransferConfig = await deps.getBankTransferProviderConfig(c.env.DB, c.env)
      const activeProvider = String(bankTransferConfig.provider || 'PAYOS').toUpperCase()
      if (activeProvider === 'MANUAL_VIETQR') {
        const manualPayment = deps.buildManualVietQRPaymentData(order, bankTransferConfig.manualVietQR)
        await c.env.DB.prepare(`
          UPDATE orders
          SET payment_provider='MANUAL_VIETQR',
              payment_link_id=?,
              payment_checkout_url=NULL,
              updated_at=CURRENT_TIMESTAMP
          WHERE id=?
        `).bind(manualPayment.transferContent || null, id).run()
        return c.json({ success: true, data: manualPayment })
      }

      const sync = await deps.syncOrderPaymentWithPayOS(c.env.DB, c.env, order)
      if (sync.paid) {
        return c.json({ success: true, data: { alreadyPaid: true, orderCode: order.order_code } })
      }

      const existingLinkId = String(order.payment_link_id || '').trim()
      const existingCheckoutUrl = String(order.payment_checkout_url || '').trim()
      const existingPayment = await deps.payOSGetPaymentInfo(c.env.DB, c.env, existingLinkId || order.payment_order_code || order.id)
      if (existingPayment) {
        const existingPaymentStatus = String(existingPayment.status || '').trim().toUpperCase()
        const existingPaymentLinkId = String(existingPayment.id || '').trim()
        const existingPaymentCheckoutUrl = String(existingCheckoutUrl || existingPayment.checkoutUrl || (existingPaymentLinkId ? `https://pay.payos.vn/web/${encodeURIComponent(existingPaymentLinkId)}` : '')).trim()
        if (existingPaymentStatus === 'PENDING' && (existingPaymentLinkId || existingPaymentCheckoutUrl)) {
          await c.env.DB.prepare(`
            UPDATE orders
            SET payment_link_id=COALESCE(NULLIF(?, ''), payment_link_id),
                payment_checkout_url=COALESCE(NULLIF(?, ''), payment_checkout_url),
                payment_order_code=COALESCE(NULLIF(?, 0), payment_order_code),
                updated_at=CURRENT_TIMESTAMP
            WHERE id=?
          `).bind(
            existingPaymentLinkId || null,
            existingPaymentCheckoutUrl || null,
            Number(existingPayment.orderCode || order.payment_order_code || order.id || 0),
            id
          ).run()
          return c.json({
            success: true,
            data: {
              paymentLinkId: existingPaymentLinkId || existingPayment.id || '',
              checkoutUrl: existingPaymentCheckoutUrl || '',
              orderCode: order.order_code
            }
          })
        }
      }

      const { clientId, apiKey, checksumKey } = await deps.getPayOSConfig(c.env.DB, c.env)
      if (!clientId || !apiKey || !checksumKey) {
        const manualPayment = deps.buildManualVietQRPaymentData(order, bankTransferConfig.manualVietQR)
        await c.env.DB.prepare(`
          UPDATE orders
          SET payment_provider='MANUAL_VIETQR',
              payment_link_id=?,
              payment_checkout_url=NULL,
              updated_at=CURRENT_TIMESTAMP
          WHERE id=?
        `).bind(manualPayment.transferContent || null, id).run()
        return c.json({ success: true, data: { ...manualPayment, fallbackFrom: 'PAYOS_CONFIG_MISSING' } })
      }

      const amount = Math.round(Number(order.total_price || 0))
      if (amount <= 0) return c.json({ success: false, error: 'INVALID_ORDER_AMOUNT' }, 400)

      const orderCodeNum = Math.floor(Date.now() * 10 + Math.floor(Math.random() * 10))
      const description = `DH${orderCodeNum}`.slice(0, 25)
      const returnUrl = `${origin}/?order=${encodeURIComponent(order.order_code)}&pay=success&provider=payos&closeTab=1`
      const cancelUrl = `${origin}/?order=${encodeURIComponent(order.order_code)}&pay=cancel&provider=payos`
      const signPayload = { amount, cancelUrl, description, orderCode: orderCodeNum, returnUrl }
      const signature = await deps.payOSSignWithChecksum(checksumKey, deps.payOSBuildDataString(signPayload))
      const reqPayload = {
        orderCode: orderCodeNum,
        amount,
        description,
        buyerName: order.customer_name || '',
        buyerPhone: order.customer_phone || '',
        items: [{ name: order.product_name || 'Don hang', quantity: Number(order.quantity || 1), price: amount }],
        cancelUrl,
        returnUrl,
        signature
      }

      const resp = await fetch('https://api-merchant.payos.vn/v2/payment-requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-client-id': clientId,
          'x-api-key': apiKey
        },
        body: JSON.stringify(reqPayload)
      })
      const payosRes: any = await resp.json().catch(() => ({}))
      if (!resp.ok || String(payosRes.code || '') !== '00' || !payosRes.data) {
        const manualPayment = deps.buildManualVietQRPaymentData(order, bankTransferConfig.manualVietQR)
        await c.env.DB.prepare(`
          UPDATE orders
          SET payment_provider='MANUAL_VIETQR',
              payment_link_id=?,
              payment_checkout_url=NULL,
              updated_at=CURRENT_TIMESTAMP
          WHERE id=?
        `).bind(manualPayment.transferContent || null, id).run()
        return c.json({ success: true, data: { ...manualPayment, fallbackFrom: 'PAYOS_CREATE_LINK_FAILED' } })
      }

      await c.env.DB.prepare(`
        UPDATE orders
        SET payment_provider='PAYOS',
            payment_link_id=?,
            payment_checkout_url=?,
            payment_order_code=?,
            updated_at=CURRENT_TIMESTAMP
        WHERE id=?
      `).bind(
        payosRes.data.paymentLinkId || null,
        payosRes.data.checkoutUrl || null,
        orderCodeNum,
        id
      ).run()

      return c.json({
        success: true,
        data: {
          provider: 'PAYOS',
          paymentLinkId: payosRes.data.paymentLinkId,
          checkoutUrl: payosRes.data.checkoutUrl,
          qrCode: payosRes.data.qrCode,
          orderCode: order.order_code
        }
      })
    } catch (e: any) {
      return c.json({ success: false, error: e.message }, 500)
    }
  }

  app.post('/api/orders/:id/bank-transfer-link', createBankTransferLink)
  app.post('/api/orders/:id/payos-link', (c) => createBankTransferLink(c)) // Legacy alias for /api/orders/:id/bank-transfer-link

  app.post('/api/payments/zalopay/callback', async (c) => {
    try {
      await deps.initDB(c.env.DB)
      const body: any = await c.req.json().catch(() => ({}))
      const cbDataStr = String(body?.data || '')
      const providedMac = String(body?.mac || '').toLowerCase()
      const config = await deps.getZaloPayConfig(c.env.DB, c.env)
      if (!config.key2) {
        return c.json({ return_code: 0, return_message: 'ZALOPAY_CONFIG_MISSING' })
      }
      if (!cbDataStr || !providedMac) {
        return c.json({ return_code: -1, return_message: 'missing_data_or_mac' })
      }

      const expectedMac = await deps.payOSSignWithChecksum(config.key2, cbDataStr)
      if (expectedMac !== providedMac) {
        return c.json({ return_code: -1, return_message: 'mac not equal' })
      }

      const data = deps.parseJsonObject(cbDataStr)
      const appTransId = String(data?.app_trans_id || '').trim()
      const paidAmount = Number(data?.amount || 0)
      const zpTransIdNum = Number(data?.zp_trans_id || 0)
      const embedData = deps.parseJsonObject(data?.embed_data)
      const orderId = Number(embedData?.order_id || 0)
      const orderCode = String(embedData?.order_code || '').trim().toUpperCase()

      let order: any = null
      if (orderId > 0) {
        order = await c.env.DB.prepare(`
          SELECT id, order_code, total_price, payment_status
          FROM orders
          WHERE id=?
          LIMIT 1
        `).bind(orderId).first() as any
      }
      if (!order && orderCode) {
        order = await c.env.DB.prepare(`
          SELECT id, order_code, total_price, payment_status
          FROM orders
          WHERE order_code=?
          LIMIT 1
        `).bind(orderCode).first() as any
      }
      if (!order && appTransId) {
        order = await c.env.DB.prepare(`
          SELECT id, order_code, total_price, payment_status
          FROM orders
          WHERE payment_link_id=?
          LIMIT 1
        `).bind(appTransId).first() as any
      }
      if (!order) {
        return c.json({ return_code: 1, return_message: 'ignored_order_not_found' })
      }
      if (String(order.payment_status || '').toLowerCase() === 'paid') {
        return c.json({ return_code: 2, return_message: 'already_paid' })
      }

      if (paidAmount > 0 && Number(order.total_price || 0) > 0 && paidAmount < Number(order.total_price || 0)) {
        return c.json({ return_code: 1, return_message: 'ignored_insufficient_amount' })
      }

      await c.env.DB.prepare(`
        UPDATE orders
        SET payment_status='paid',
            payment_paid_at=CURRENT_TIMESTAMP,
            payment_ref=?,
            payment_provider='ZALOPAY',
            payment_link_id=COALESCE(?, payment_link_id),
            payment_order_code=COALESCE(?, payment_order_code),
            status=CASE WHEN status='pending' THEN 'confirmed' ELSE status END,
            updated_at=CURRENT_TIMESTAMP
        WHERE id=?
      `).bind(
        String(data?.zp_trans_id || appTransId || ''),
        appTransId || null,
        Number.isFinite(zpTransIdNum) && zpTransIdNum > 0 ? zpTransIdNum : null,
        order.id
      ).run()

      return c.json({ return_code: 1, return_message: 'success' })
    } catch (e: any) {
      return c.json({ return_code: 0, return_message: String(e?.message || 'UNKNOWN_ERROR') })
    }
  })

  app.post('/api/payments/payos/webhook', async (c) => {
    try {
      await deps.initDB(c.env.DB)
      const body: any = await c.req.json()
      const { checksumKey } = await deps.getPayOSConfig(c.env.DB, c.env)
      if (!checksumKey) return c.json({ success: false, error: 'PAYOS_CONFIG_MISSING' }, 500)

      const data = body?.data || {}
      const providedSignature = String(body?.signature || '').toLowerCase()
      if (!providedSignature) {
        return c.json({ success: false, error: 'MISSING_SIGNATURE' }, 400)
      }
      const verifyString = deps.payOSBuildDataString(data)
      const expectedSignature = await deps.payOSSignWithChecksum(checksumKey, verifyString)
      if (providedSignature !== expectedSignature) {
        return c.json({ success: false, error: 'INVALID_PAYOS_SIGNATURE' }, 401)
      }

      const payosOrderCode = Number(data?.orderCode || 0)
      if (!payosOrderCode) return c.json({ success: false, error: 'MISSING_ORDER_CODE' }, 400)
      const order = await c.env.DB.prepare(`
        SELECT id, order_code, total_price, payment_status, status, payment_order_code
        FROM orders
        WHERE id=? OR payment_order_code=?
        LIMIT 1
      `).bind(payosOrderCode, payosOrderCode).first() as any
      if (!order) {
        return c.json({ success: true, data: { ignored: true, reason: 'ORDER_NOT_FOUND', payosOrderCode } })
      }

      if (order.payment_status === 'paid') {
        return c.json({ success: true, data: { order_code: order.order_code, already_paid: true } })
      }

      const status = String(data?.status || '').toUpperCase()
      if (status !== 'PAID') {
        return c.json({ success: true, data: { ignored: true, reason: `status_${status || 'UNKNOWN'}` } })
      }

      const paidAmount = Number(data?.amount || data?.amountPaid || 0)
      if (paidAmount > 0 && Number(order.total_price) > 0 && paidAmount < Number(order.total_price)) {
        return c.json({ success: false, error: 'INSUFFICIENT_AMOUNT' }, 400)
      }

      const paymentRef = String(data?.paymentLinkId || data?.reference || payosOrderCode)
      await c.env.DB.prepare(`
        UPDATE orders
        SET payment_status='paid',
            payment_paid_at=CURRENT_TIMESTAMP,
            payment_ref=?,
            payment_provider='PAYOS',
            payment_order_code=?,
            payment_link_id=COALESCE(?, payment_link_id),
            status=CASE WHEN status='pending' THEN 'confirmed' ELSE status END,
            updated_at=CURRENT_TIMESTAMP
        WHERE id=?
      `).bind(
        paymentRef || null,
        payosOrderCode,
        data?.paymentLinkId || null,
        order.id
      ).run()

      return c.json({ success: true, data: { order_code: order.order_code, payment_status: 'paid' } })
    } catch (e: any) {
      return c.json({ success: false, error: e.message }, 500)
    }
  })

  app.post('/api/payments/payos/confirm-webhook', async (c) => {
    try {
      const body: any = await c.req.json().catch(() => ({}))
      const webhookUrl = String(body.webhookUrl || '').trim()
      if (!webhookUrl || !/^https:\/\//i.test(webhookUrl)) {
        return c.json({ success: false, error: 'INVALID_WEBHOOK_URL' }, 400)
      }

      await deps.initDB(c.env.DB)
      const { clientId, apiKey } = await deps.getPayOSConfig(c.env.DB, c.env)
      if (!clientId || !apiKey) {
        return c.json({ success: false, error: 'PAYOS_CONFIG_MISSING' }, 500)
      }

      const resp = await fetch('https://api-merchant.payos.vn/confirm-webhook', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-client-id': clientId,
          'x-api-key': apiKey
        },
        body: JSON.stringify({ webhookUrl })
      })
      const data: any = await resp.json().catch(() => ({}))
      if (!resp.ok || String(data.code || '') !== '00') {
        return c.json({ success: false, error: 'PAYOS_CONFIRM_WEBHOOK_FAILED', detail: data }, 400)
      }
      return c.json({ success: true, data })
    } catch (e: any) {
      return c.json({ success: false, error: e.message }, 500)
    }
  })
}
