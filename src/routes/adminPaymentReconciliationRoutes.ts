import { getCookie } from 'hono/cookie'
import type { Hono } from 'hono'
import type { AppBindings } from '../types/app'
import type { AppContext } from '../types/admin'
import {
  canUseAdminPermission,
  readAdminPermissionMap,
  type AdminPermissionMap,
} from '../lib/adminPermissions'
import { normalizeAdminUserKey } from '../lib/adminHelpers'

const RECONCILIATION_PROVIDER = 'MANUAL_VIETQR'
const RECONCILIATION_METHOD = 'BANK_TRANSFER' // payment_method BANK_TRANSFER orders only
const DEFAULT_LIST_LIMIT = 100
const MAX_LIST_LIMIT = 200
const MAX_BANK_REFERENCE_LENGTH = 160
const MAX_IDEMPOTENCY_KEY_LENGTH = 160

type AdminPaymentReconciliationRouteDeps = {
  initDB: (db: D1Database) => Promise<void>
  buildInternalTestOrderWhereSql?: (alias?: string) => string
}

type ReconciliationPermissionAction = 'view' | 'edit'

type ReconciliationActor = {
  adminUserKey: string
  permissions: AdminPermissionMap
}

type ReconciliationAuditRow = {
  id?: number | string
  order_id?: number | string
  order_code?: string | null
  payment_provider?: string | null
  bank_reference?: string | null
  verified_amount?: number | string | null
  order_amount?: number | string | null
  admin_user_key?: string | null
  admin_user_id?: number | string | null
  action?: string | null
  idempotency_key?: string | null
  created_at?: string | null
}

type ReconciliationOrderRow = {
  id?: number | string
  order_code?: string | null
  customer_name?: string | null
  customer_phone?: string | null
  customer_address?: string | null
  product_name?: string | null
  product_price?: number | string | null
  quantity?: number | string | null
  total_price?: number | string | null
  discount_amount?: number | string | null
  voucher_code?: string | null
  note?: string | null
  payment_method?: string | null
  payment_status?: string | null
  payment_paid_at?: string | null
  payment_ref?: string | null
  payment_provider?: string | null
  payment_review_required?: number | string | boolean | null
  payment_review_reason?: string | null
  shipping_arranged?: number | string | boolean | null
  shipping_arranged_at?: string | null
  shipping_carrier?: string | null
  shipping_tracking_code?: string | null
  status?: string | null
  created_at?: string | null
  updated_at?: string | null
  product_thumbnail?: string | null
  latest_audit_id?: number | string | null
  latest_audit_bank_reference?: string | null
  latest_audit_verified_amount?: number | string | null
  latest_audit_admin_user_key?: string | null
  latest_audit_created_at?: string | null
}

function normalizeUpper(value: unknown): string {
  return String(value ?? '').trim().toUpperCase()
}

function isTruthyFlag(value: unknown): boolean {
  return value === true || value === 1 || value === '1' || normalizeUpper(value) === 'TRUE'
}

function normalizeBankReference(value: unknown): string {
  return String(value ?? '')
    .normalize('NFKC')
    .replace(/[\u0000-\u001f\u007f]/g, ' ')
    .trim()
    .replace(/\s+/g, ' ')
    .toUpperCase()
}

function normalizeIdempotencyKey(value: unknown): string {
  return String(value ?? '')
    .normalize('NFKC')
    .replace(/[\u0000-\u001f\u007f]/g, '')
    .trim()
}

function isValidBankReference(value: string): boolean {
  return value.length >= 2
    && value.length <= MAX_BANK_REFERENCE_LENGTH
    && !/[\u0000-\u001f\u007f]/.test(value)
}

function parseOrderId(value: unknown): number {
  const id = Number.parseInt(String(value ?? ''), 10)
  return Number.isSafeInteger(id) && id > 0 ? id : 0
}

function parsePositiveAmount(value: unknown): number {
  if (typeof value === 'string' && !value.trim()) return 0
  const amount = Number(value)
  if (!Number.isSafeInteger(amount) || amount <= 0) return 0
  return amount
}

function amountsMatch(left: number, right: number): boolean {
  // VND is represented as a whole number in the checkout flow. Reject
  // fractional and unsafe values before this exact comparison is reached.
  return Number.isSafeInteger(left) && Number.isSafeInteger(right) && left === right
}

function normalizeView(value: unknown): 'all' | 'waiting_payment' | 'requires_review' {
  const view = String(value ?? 'all').trim().toLowerCase()
  if (view === 'waiting_payment' || view === 'waiting-payment' || view === 'unpaid') return 'waiting_payment'
  if (view === 'requires_review' || view === 'requires-review' || view === 'review') return 'requires_review'
  return 'all'
}

function parseLimit(value: unknown): number {
  const parsed = Number.parseInt(String(value ?? ''), 10)
  if (!Number.isFinite(parsed)) return DEFAULT_LIST_LIMIT
  return Math.min(MAX_LIST_LIMIT, Math.max(1, parsed))
}

function schemaUnavailable(error: unknown): boolean {
  const message = String((error as any)?.message || error || '').toLowerCase()
  // A UNIQUE violation also contains the audit-table name.  Treat only an
  // actual missing schema object as a migration problem; otherwise the
  // caller must receive the idempotent/conflict response below.
  const missingObject = message.includes('no such table')
    || message.includes('no such column')
    || message.includes('does not exist')
  return missingObject && (
    message.includes('admin_payment_reconciliation_audit')
      || message.includes('payment_review_required')
      || message.includes('payment_review_reason')
  )
}

function isUniqueConflict(error: unknown): boolean {
  const message = String((error as any)?.message || error || '').toLowerCase()
  return message.includes('unique constraint')
    || message.includes('constraint failed')
    || message.includes('already exists')
}

function buildInternalFilter(deps: AdminPaymentReconciliationRouteDeps, includeInternal: boolean): string {
  if (includeInternal || !deps.buildInternalTestOrderWhereSql) return '1=1'
  return `NOT ${deps.buildInternalTestOrderWhereSql('o')}`
}

function buildBaseReconciliationWhere(deps: AdminPaymentReconciliationRouteDeps, includeInternal: boolean): string {
  return [
    buildInternalFilter(deps, includeInternal),
    `UPPER(COALESCE(o.payment_method, '')) = '${RECONCILIATION_METHOD}'`,
  ].join(' AND ')
}

function buildViewWhere(baseWhere: string, view: 'all' | 'waiting_payment' | 'requires_review'): string {
  if (view === 'waiting_payment') {
    // The queue is for every unpaid bank-transfer order.  The action layer
    // still restricts manual confirmation to MANUAL_VIETQR, while PayOS (or
    // an unassigned provider) remains visible for provider re-checking.
    return `${baseWhere} AND LOWER(COALESCE(o.payment_status, '')) != 'paid' AND LOWER(COALESCE(o.status, '')) NOT IN ('cancelled', 'done')`
  }
  if (view === 'requires_review') {
    return `${baseWhere} AND COALESCE(CAST(o.payment_review_required AS INTEGER), 0) = 1`
  }
  return `${baseWhere} AND (LOWER(COALESCE(o.payment_status, '')) != 'paid' OR COALESCE(CAST(o.payment_review_required AS INTEGER), 0) = 1)`
}

function mapOrderRow(row: ReconciliationOrderRow) {
  const id = parseOrderId(row.id)
  const totalPrice = Number(row.total_price || 0)
  const paymentStatus = normalizeUpper(row.payment_status).toLowerCase() || 'unpaid'
  const paymentReviewRequired = isTruthyFlag(row.payment_review_required)
  return {
    ...row,
    id,
    total_price: totalPrice,
    payment_status: paymentStatus,
    payment_review_required: paymentReviewRequired,
    shipping_arranged: isTruthyFlag(row.shipping_arranged),
    amount_due: paymentStatus === 'paid' ? 0 : totalPrice,
    reconciliation_state: paymentReviewRequired
      ? 'requires_review'
      : paymentStatus === 'paid' ? 'paid' : 'waiting_payment',
    shipping_eligible: paymentStatus === 'paid'
      && !paymentReviewRequired
      && normalizeUpper(row.status) !== 'CANCELLED'
      && normalizeUpper(row.status) !== 'DONE',
    latest_audit: row.latest_audit_id ? {
      id: Number(row.latest_audit_id),
      bank_reference: String(row.latest_audit_bank_reference || ''),
      verified_amount: Number(row.latest_audit_verified_amount || 0),
      admin_user_key: String(row.latest_audit_admin_user_key || ''),
      created_at: String(row.latest_audit_created_at || ''),
    } : null,
  }
}

async function resolveReconciliationActor(
  db: D1Database,
  c: AppContext,
  action: ReconciliationPermissionAction,
): Promise<{ actor?: ReconciliationActor, denied?: boolean }> {
  const adminUserKey = normalizeAdminUserKey(getCookie(c, 'admin_user_key') || 'admin')
  const permissions = await readAdminPermissionMap(db, adminUserKey)
  // Reading belongs to the order workflow. Confirming money movement is a
  // payment-setting edit and must never be granted by order-edit alone.
  const allowed = action === 'edit'
    ? canUseAdminPermission(permissions, 'settings-payment', 'edit')
    : canUseAdminPermission(permissions, 'orders', 'view')
      || canUseAdminPermission(permissions, 'settings-payment', 'view')
  if (!allowed) return { denied: true }
  return { actor: { adminUserKey, permissions } }
}

function successPaymentResponse(order: ReconciliationOrderRow, audit: ReconciliationAuditRow | null, alreadyProcessed = false) {
  const paymentStatus = normalizeUpper(order.payment_status).toLowerCase() || 'unpaid'
  const reviewRequired = isTruthyFlag(order.payment_review_required)
  const orderStatus = normalizeUpper(order.status)
  return {
    order_id: parseOrderId(order.id),
    order_code: String(order.order_code || ''),
    payment_status: paymentStatus,
    payment_provider: normalizeUpper(order.payment_provider) || RECONCILIATION_PROVIDER,
    payment_ref: String(order.payment_ref || audit?.bank_reference || ''),
    payment_paid_at: String(order.payment_paid_at || ''),
    payment_review_required: reviewRequired,
    shipping_arranged: isTruthyFlag(order.shipping_arranged),
    shipping_eligible: paymentStatus === 'paid'
      && !reviewRequired
      && orderStatus !== 'CANCELLED'
      && orderStatus !== 'DONE',
    already_processed: alreadyProcessed,
    audit: audit ? {
      id: Number(audit.id || 0),
      bank_reference: String(audit.bank_reference || ''),
      verified_amount: Number(audit.verified_amount || 0),
      admin_user_key: String(audit.admin_user_key || ''),
      created_at: String(audit.created_at || ''),
    } : null,
  }
}

export function registerAdminPaymentReconciliationRoutes(
  app: Hono<{ Bindings: AppBindings }>,
  deps: AdminPaymentReconciliationRouteDeps,
) {
  const listHandler = async (c: AppContext) => {
    try {
      await deps.initDB(c.env.DB)
      const permission = await resolveReconciliationActor(c.env.DB, c, 'view')
      if (permission.denied) return c.json({ success: false, error: 'Forbidden', code: 'ADMIN_PERMISSION_DENIED' }, 403)

      const view = normalizeView(c.req.query('view'))
      const includeInternal = c.req.query('include_internal') === '1'
      const limit = parseLimit(c.req.query('limit'))
      const baseWhere = buildBaseReconciliationWhere(deps, includeInternal)
      const where = buildViewWhere(baseWhere, view)
      const result = await c.env.DB.prepare(`
        SELECT
          o.*,
          p.thumbnail AS product_thumbnail,
          a.id AS latest_audit_id,
          a.bank_reference AS latest_audit_bank_reference,
          a.verified_amount AS latest_audit_verified_amount,
          a.admin_user_key AS latest_audit_admin_user_key,
          a.created_at AS latest_audit_created_at
        FROM orders o
        LEFT JOIN products p ON p.id = o.product_id
        LEFT JOIN admin_payment_reconciliation_audit a ON a.id = (
          SELECT aa.id
          FROM admin_payment_reconciliation_audit aa
          WHERE aa.order_id = o.id
          ORDER BY aa.id DESC
          LIMIT 1
        )
        WHERE ${where}
        ORDER BY
          CASE WHEN COALESCE(CAST(o.payment_review_required AS INTEGER), 0) = 1 THEN 0 ELSE 1 END,
          datetime(o.created_at) DESC,
          o.id DESC
        LIMIT ?
      `).bind(limit).all<ReconciliationOrderRow>()

      const [waitingCount, reviewCount, allCount] = await Promise.all([
        c.env.DB.prepare(`SELECT COUNT(*) AS count FROM orders o WHERE ${buildViewWhere(baseWhere, 'waiting_payment')}`).first<{ count?: number }>(),
        c.env.DB.prepare(`SELECT COUNT(*) AS count FROM orders o WHERE ${buildViewWhere(baseWhere, 'requires_review')}`).first<{ count?: number }>(),
        c.env.DB.prepare(`SELECT COUNT(*) AS count FROM orders o WHERE ${buildViewWhere(baseWhere, 'all')}`).first<{ count?: number }>(),
      ])

      const orders = (result.results || []).map(mapOrderRow)
      return c.json({
        success: true,
        data: orders,
        view,
        counts: {
          waiting_payment: Number(waitingCount?.count || 0),
          requires_review: Number(reviewCount?.count || 0),
          all: Number(allCount?.count || 0),
        },
      })
    } catch (error: any) {
      if (schemaUnavailable(error)) {
        return c.json({ success: false, error: 'PAYMENT_RECONCILIATION_SCHEMA_NOT_READY', code: 'PAYMENT_RECONCILIATION_SCHEMA_NOT_READY' }, 503)
      }
      console.error('[admin-payment-reconciliation] list failed', error)
      return c.json({ success: false, error: 'PAYMENT_RECONCILIATION_LIST_FAILED' }, 500)
    }
  }

  const confirmHandler = async (c: AppContext) => {
    let requestOrderId = 0
    let requestIdempotencyKey = ''
    let requestBankReference = ''
    let requestVerifiedAmount = 0
    let actor: ReconciliationActor | undefined
    try {
      await deps.initDB(c.env.DB)
      const permission = await resolveReconciliationActor(c.env.DB, c, 'edit')
      if (permission.denied) return c.json({ success: false, error: 'Forbidden', code: 'ADMIN_PERMISSION_DENIED' }, 403)
      actor = permission.actor

      const orderId = parseOrderId(c.req.param('id'))
      requestOrderId = orderId
      if (!orderId) return c.json({ success: false, error: 'INVALID_ORDER_ID', code: 'INVALID_ORDER_ID' }, 400)

      let body: any
      try {
        body = await c.req.json()
      } catch {
        return c.json({ success: false, error: 'INVALID_JSON', code: 'INVALID_JSON' }, 400)
      }
      if (body?.operator_confirmed !== true) {
        return c.json({ success: false, error: 'OPERATOR_CONFIRMATION_REQUIRED', code: 'OPERATOR_CONFIRMATION_REQUIRED' }, 400)
      }
      const bankReference = normalizeBankReference(body?.bank_reference ?? body?.payment_ref ?? body?.bankReference)
      requestBankReference = bankReference
      if (!isValidBankReference(bankReference)) {
        return c.json({ success: false, error: 'INVALID_BANK_REFERENCE', code: 'INVALID_BANK_REFERENCE' }, 400)
      }
      const suppliedIdempotencyKey = normalizeIdempotencyKey(body?.idempotency_key ?? body?.idempotencyKey)
      if (suppliedIdempotencyKey.length > MAX_IDEMPOTENCY_KEY_LENGTH) {
        return c.json({ success: false, error: 'INVALID_IDEMPOTENCY_KEY', code: 'INVALID_IDEMPOTENCY_KEY' }, 400)
      }
      // Keep the complete normalized reference in the deterministic fallback;
      // truncating it could make two legitimate long references collide.
      const idempotencyKey = suppliedIdempotencyKey || `manual-vietqr:${orderId}:${bankReference}`
      requestIdempotencyKey = idempotencyKey
      const verifiedAmount = parsePositiveAmount(body?.verified_amount ?? body?.amount ?? body?.verifiedAmount)
      requestVerifiedAmount = verifiedAmount
      if (!verifiedAmount) {
        return c.json({ success: false, error: 'INVALID_VERIFIED_AMOUNT', code: 'INVALID_VERIFIED_AMOUNT' }, 400)
      }

      const existingByIdempotency = await c.env.DB.prepare(`
        SELECT * FROM admin_payment_reconciliation_audit WHERE idempotency_key=? LIMIT 1
      `).bind(idempotencyKey).first<ReconciliationAuditRow>()
      if (existingByIdempotency) {
        const sameRequest = parseOrderId(existingByIdempotency.order_id) === orderId
          && normalizeBankReference(existingByIdempotency.bank_reference) === bankReference
          && amountsMatch(Number(existingByIdempotency.verified_amount || 0), verifiedAmount)
        if (!sameRequest) {
          return c.json({ success: false, error: 'IDEMPOTENCY_KEY_REUSED', code: 'IDEMPOTENCY_KEY_REUSED' }, 409)
        }
        const existingOrder = await c.env.DB.prepare(`
          SELECT * FROM orders WHERE id=? LIMIT 1
        `).bind(orderId).first<ReconciliationOrderRow>()
        if (!existingOrder) return c.json({ success: false, error: 'ORDER_NOT_FOUND', code: 'ORDER_NOT_FOUND' }, 404)
        return c.json({ success: true, data: successPaymentResponse(existingOrder, existingByIdempotency, true) })
      }

      const existingByReference = await c.env.DB.prepare(`
        SELECT * FROM admin_payment_reconciliation_audit
        WHERE payment_provider=? AND bank_reference=?
        LIMIT 1
      `).bind(RECONCILIATION_PROVIDER, bankReference).first<ReconciliationAuditRow>()
      if (existingByReference) {
        return c.json({
          success: false,
          error: parseOrderId(existingByReference.order_id) === orderId ? 'PAYMENT_ALREADY_RECORDED' : 'BANK_REFERENCE_ALREADY_RECORDED',
          code: parseOrderId(existingByReference.order_id) === orderId ? 'PAYMENT_ALREADY_RECORDED' : 'BANK_REFERENCE_ALREADY_RECORDED',
        }, 409)
      }

      const order = await c.env.DB.prepare(`SELECT * FROM orders WHERE id=? LIMIT 1`).bind(orderId).first<ReconciliationOrderRow>()
      if (!order) return c.json({ success: false, error: 'ORDER_NOT_FOUND', code: 'ORDER_NOT_FOUND' }, 404)
      if (normalizeUpper(order.payment_method) !== RECONCILIATION_METHOD || normalizeUpper(order.payment_provider) !== RECONCILIATION_PROVIDER) {
        return c.json({ success: false, error: 'MANUAL_VIETQR_ORDER_REQUIRED', code: 'MANUAL_VIETQR_ORDER_REQUIRED' }, 400)
      }
      if (normalizeUpper(order.status) === 'CANCELLED') {
        return c.json({ success: false, error: 'ORDER_CANCELLED', code: 'ORDER_CANCELLED' }, 409)
      }
      if (normalizeUpper(order.payment_status) === 'PAID') {
        return c.json({ success: false, error: 'PAYMENT_ALREADY_PAID', code: 'PAYMENT_ALREADY_PAID' }, 409)
      }

      const orderAmount = parsePositiveAmount(order.total_price)
      if (!orderAmount || !amountsMatch(orderAmount, verifiedAmount)) {
        return c.json({
          success: false,
          error: 'VERIFIED_AMOUNT_MISMATCH',
          code: 'VERIFIED_AMOUNT_MISMATCH',
          expected_amount: orderAmount,
        }, 400)
      }

      const audit: ReconciliationAuditRow = {
        order_id: orderId,
        order_code: String(order.order_code || ''),
        payment_provider: RECONCILIATION_PROVIDER,
        bank_reference: bankReference,
        verified_amount: Math.round(verifiedAmount),
        order_amount: Math.round(orderAmount),
        admin_user_key: actor?.adminUserKey || 'admin',
        admin_user_id: null,
        action: 'confirm_paid',
        idempotency_key: idempotencyKey,
      }

      const batchResult = await c.env.DB.batch([
        c.env.DB.prepare(`
          UPDATE orders
          SET payment_status='paid',
              payment_paid_at=COALESCE(payment_paid_at, CURRENT_TIMESTAMP),
              payment_ref=?,
              payment_provider=?,
              payment_review_required=0,
              payment_review_reason=NULL,
              updated_at=CURRENT_TIMESTAMP
          WHERE id=?
            AND LOWER(COALESCE(payment_status, '')) != 'paid'
            AND UPPER(COALESCE(payment_method, ''))=?
            AND UPPER(COALESCE(payment_provider, ''))=?
            AND LOWER(COALESCE(status, '')) NOT IN ('cancelled', 'done')
            AND LOWER(COALESCE(return_status, '')) NOT IN ('returned', 'delivery_failed', 'cancelled')
            AND ROUND(COALESCE(total_price, 0))=?
        `).bind(bankReference, RECONCILIATION_PROVIDER, orderId, RECONCILIATION_METHOD, RECONCILIATION_PROVIDER, Math.round(orderAmount)),
        c.env.DB.prepare(`
          INSERT INTO admin_payment_reconciliation_audit
            (order_id, order_code, payment_provider, bank_reference, verified_amount, order_amount, admin_user_key, admin_user_id, action, idempotency_key)
          SELECT ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
          WHERE changes() = 1
        `).bind(
          audit.order_id,
          audit.order_code,
          audit.payment_provider,
          audit.bank_reference,
          audit.verified_amount,
          audit.order_amount,
          audit.admin_user_key,
          audit.admin_user_id,
          audit.action,
          audit.idempotency_key,
        ),
      ])
      const changed = Number((batchResult as any)?.[0]?.meta?.changes || 0)
      const auditInserted = Number((batchResult as any)?.[1]?.meta?.changes || 0)
      if (changed < 1 || auditInserted < 1) {
        return c.json({ success: false, error: 'PAYMENT_STATE_CHANGED', code: 'PAYMENT_STATE_CHANGED' }, 409)
      }

      const updatedOrder = await c.env.DB.prepare(`SELECT * FROM orders WHERE id=? LIMIT 1`).bind(orderId).first<ReconciliationOrderRow>()
      const insertedAudit = await c.env.DB.prepare(`
        SELECT * FROM admin_payment_reconciliation_audit WHERE idempotency_key=? LIMIT 1
      `).bind(idempotencyKey).first<ReconciliationAuditRow>()
      return c.json({ success: true, data: successPaymentResponse(updatedOrder || { ...order, payment_status: 'paid', payment_ref: bankReference }, insertedAudit) })
    } catch (error: any) {
      if (schemaUnavailable(error)) {
        return c.json({ success: false, error: 'PAYMENT_RECONCILIATION_SCHEMA_NOT_READY', code: 'PAYMENT_RECONCILIATION_SCHEMA_NOT_READY' }, 503)
      }
      if (isUniqueConflict(error)) {
        const audit = requestIdempotencyKey
          ? await c.env.DB.prepare(`SELECT * FROM admin_payment_reconciliation_audit WHERE idempotency_key=? LIMIT 1`).bind(requestIdempotencyKey).first<ReconciliationAuditRow>()
          : null
        const auditMatchesRequest = audit
          && parseOrderId(audit.order_id) === requestOrderId
          && normalizeBankReference(audit.bank_reference) === requestBankReference
          && amountsMatch(Number(audit.verified_amount || 0), requestVerifiedAmount)
        if (audit && auditMatchesRequest) {
          const order = await c.env.DB.prepare(`SELECT * FROM orders WHERE id=? LIMIT 1`).bind(requestOrderId).first<ReconciliationOrderRow>()
          if (order && normalizeUpper(order.payment_provider) === RECONCILIATION_PROVIDER) {
            return c.json({ success: true, data: successPaymentResponse(order, audit, true) })
          }
        }
        return c.json({ success: false, error: 'PAYMENT_RECONCILIATION_CONFLICT', code: 'PAYMENT_RECONCILIATION_CONFLICT' }, 409)
      }
      console.error('[admin-payment-reconciliation] confirmation failed', error)
      return c.json({ success: false, error: 'PAYMENT_RECONCILIATION_CONFIRM_FAILED' }, 500)
    }
  }

  app.get('/api/admin/payment-reconciliation', listHandler)
  app.get('/api/admin/payment-reconciliation/orders', listHandler)
  app.post('/api/admin/payment-reconciliation/orders/:id/confirm', confirmHandler)
}

export type { AdminPaymentReconciliationRouteDeps }
