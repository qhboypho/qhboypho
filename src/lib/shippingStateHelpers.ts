/**
 * Shared guards for the admin shipping workflow.
 *
 * Shipping creation is an external side effect.  Keep these helpers free of
 * database and carrier-specific code so route tests can exercise the rules
 * without making a real carrier request.
 */

export const TERMINAL_RETURN_STATUSES = new Set(['returned', 'cancelled', 'delivery_failed'])

export const PREPAID_SHIPPING_PAYMENT_METHODS = new Set(['BANK_TRANSFER', 'ZALOPAY', 'MOMO'])

export const SHIPPING_CREATION_STATES = new Set(['creating', 'created', 'failed', 'needs_reconciliation'])

export type ShippingPaymentEligibility = {
  allowed: boolean
  method: string
  paymentStatus: string
  reason: 'COD' | 'PREPAID_PAID' | 'PAYMENT_REQUIRED' | 'UNSUPPORTED_PAYMENT_METHOD'
}

export function evaluateShippingPaymentEligibility(paymentMethod: unknown, paymentStatus: unknown): ShippingPaymentEligibility {
  const method = String(paymentMethod || '').trim().toUpperCase()
  const status = String(paymentStatus || '').trim().toLowerCase()
  if (method === 'COD') {
    return { allowed: true, method, paymentStatus: status, reason: 'COD' }
  }
  if (PREPAID_SHIPPING_PAYMENT_METHODS.has(method) && status === 'paid') {
    return { allowed: true, method, paymentStatus: status, reason: 'PREPAID_PAID' }
  }
  return {
    allowed: false,
    method,
    paymentStatus: status,
    reason: PREPAID_SHIPPING_PAYMENT_METHODS.has(method) ? 'PAYMENT_REQUIRED' : 'UNSUPPORTED_PAYMENT_METHOD'
  }
}

export function isTerminalReturnStatus(value: unknown) {
  return TERMINAL_RETURN_STATUSES.has(String(value || '').trim().toLowerCase())
}

export function isValidOrderStatusTransition(currentStatus: unknown, nextStatus: unknown) {
  const current = String(currentStatus || '').trim().toLowerCase()
  const next = String(nextStatus || '').trim().toLowerCase()
  if (!current || !next) return false
  if (current === next) return true
  const transitions: Record<string, Set<string>> = {
    pending: new Set(['confirmed', 'cancelled']),
    confirmed: new Set(['shipping', 'cancelled']),
    shipping: new Set(['done']),
    done: new Set(),
    cancelled: new Set()
  }
  return transitions[current]?.has(next) === true
}

export function normalizeShippingCreationState(value: unknown) {
  const state = String(value || '').trim().toLowerCase()
  return SHIPPING_CREATION_STATES.has(state) ? state : null
}

export function buildShippingIdempotencyKey(order: any, carrier: unknown) {
  const orderId = String(order?.id || '').trim()
  const orderCode = String(order?.order_code || '').trim()
  const normalizedCarrier = String(carrier || '').trim().toUpperCase().replace(/[^A-Z0-9_-]+/g, '_') || 'UNKNOWN'
  const identity = [orderId, orderCode].filter(Boolean).join(':') || 'UNKNOWN_ORDER'
  return `qhship:${identity}:${normalizedCarrier}`.slice(0, 180)
}

function firstNonEmptyString(values: unknown[]) {
  for (const value of values) {
    const normalized = String(value ?? '').trim()
    if (normalized) return normalized
  }
  return ''
}

/** Extract provider tracking IDs, including duplicate-order responses. */
export function extractShippingTrackingCode(result: any) {
  const data = result?.data || {}
  const detail = result?.detail || {}
  const error = detail?.error || data?.error || result?.error || {}
  return firstNonEmptyString([
    data?.label,
    data?.tracking_id,
    data?.tracking_code,
    data?.order_code,
    data?.order?.label,
    data?.order?.label_id,
    data?.order?.tracking_id,
    data?.order?.tracking_code,
    detail?.ghtk_label,
    detail?.label,
    detail?.tracking_id,
    detail?.tracking_code,
    detail?.order?.label,
    detail?.order?.label_id,
    error?.ghtk_label,
    error?.label,
    error?.tracking_id,
    error?.tracking_code
  ])
}

export function isUncertainShippingCreateResult(result: any) {
  if (!result || typeof result !== 'object') return false
  if (result.uncertain === true || result.reconciliationRequired === true) return true
  const code = String(result?.detail?.error?.code || result?.detail?.code || '').trim().toUpperCase()
  return code === 'TIMEOUT' || code === 'NETWORK_ERROR' || code === 'REQUEST_TIMEOUT'
}
