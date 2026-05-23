const NORMALIZED_ORDER_PHONE_SQL = "REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(TRIM(COALESCE(customer_phone, '')), ' ', ''), '-', ''), '.', ''), '(', ''), ')', ''), '+', '')"
const NORMALIZED_BLOCK_PHONE_SQL = "REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(TRIM(COALESCE(customer_phone, '')), ' ', ''), '-', ''), '.', ''), '(', ''), ')', ''), '+', '')"

export const CUSTOMER_FAULT_AUTO_BLOCK_THRESHOLD = 3
export const SYSTEM_AUTO_BLOCK_REASON_PREFIX = 'Tự động chặn:'

function normalizeCustomerPhone(value: unknown) {
  return String(value || '').trim().replace(/\s+/g, '').replace(/[^\d]/g, '')
}

function normalizeUserId(value: unknown) {
  const parsed = Number.parseInt(String(value || ''), 10)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null
}

function buildCustomerIdentityWhereSql(userId: number | null, customerPhone: string | null, phoneSql: string) {
  const conditions: string[] = []
  const params: any[] = []

  if (userId) {
    conditions.push('user_id = ?')
    params.push(userId)
  }

  if (customerPhone) {
    conditions.push(`${phoneSql} = ?`)
    params.push(customerPhone)
  }

  return {
    sql: conditions.length ? `(${conditions.join(' OR ')})` : '(1 = 0)',
    params
  }
}

function buildSystemAutoBlockReason(count: number) {
  return `${SYSTEM_AUTO_BLOCK_REASON_PREFIX} Không nhận hàng ${count} lần`
}

export async function countCustomerFaultCancelledOrders(
  db: D1Database,
  userIdInput: unknown,
  customerPhoneInput: unknown
) {
  const userId = normalizeUserId(userIdInput)
  const customerPhone = normalizeCustomerPhone(customerPhoneInput)
  if (!userId && !customerPhone) return 0

  const identity = buildCustomerIdentityWhereSql(userId, customerPhone || null, NORMALIZED_ORDER_PHONE_SQL)
  const row = await db.prepare(`
    SELECT COUNT(*) AS cancelled_count
    FROM orders
    WHERE ${identity.sql}
      AND (
        LOWER(COALESCE(return_status, '')) = 'delivery_failed'
        OR (
          (LOWER(COALESCE(status, '')) = 'cancelled' OR LOWER(COALESCE(return_status, '')) = 'cancelled')
          AND LOWER(COALESCE(cancelled_by, '')) = 'customer'
          AND (
            COALESCE(shipping_arranged, 0) = 1
            OR TRIM(COALESCE(shipping_tracking_code, '')) != ''
          )
        )
      )
  `).bind(...identity.params).first<{ cancelled_count?: number }>()

  return Number(row?.cancelled_count || 0)
}

async function applySystemAutoBlock(
  db: D1Database,
  userId: number | null,
  customerPhone: string | null,
  reason: string
) {
  if (userId) {
    await db.prepare(`
      UPDATE users
      SET is_blocked = 1,
          blocked_reason = ?,
          blocked_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).bind(reason, userId).run()
  }

  if (userId) {
    const existingWhere = customerPhone
      ? `user_id = ? AND ${NORMALIZED_BLOCK_PHONE_SQL} = ?`
      : "user_id = ? AND (customer_phone IS NULL OR TRIM(COALESCE(customer_phone, '')) = '')"
    const existingParams = customerPhone ? [userId, customerPhone] : [userId]
    const existing = await db.prepare(`
      SELECT id
      FROM blocked_customers
      WHERE ${existingWhere}
      LIMIT 1
    `).bind(...existingParams).first<{ id?: number }>()

    if (existing) {
      await db.prepare(`
        UPDATE blocked_customers
        SET is_active = 1,
            blocked_reason = ?,
            blocked_by = 'system',
            blocked_at = CURRENT_TIMESTAMP,
            unblocked_at = NULL
        WHERE id = ?
      `).bind(reason, existing.id).run()
      return
    }

    await db.prepare(`
      INSERT INTO blocked_customers (user_id, customer_phone, blocked_reason, blocked_by, is_active)
      VALUES (?, ?, ?, 'system', 1)
      ON CONFLICT(user_id, customer_phone) DO UPDATE SET
        is_active = 1,
        blocked_reason = excluded.blocked_reason,
        blocked_by = 'system',
        blocked_at = CURRENT_TIMESTAMP,
        unblocked_at = NULL
    `).bind(userId, customerPhone, reason).run()
    return
  }

  if (!customerPhone) return

  const existing = await db.prepare(
    `SELECT id FROM blocked_customers WHERE ${NORMALIZED_BLOCK_PHONE_SQL} = ? AND user_id IS NULL LIMIT 1`
  ).bind(customerPhone).first<{ id?: number }>()

  if (existing) {
    await db.prepare(`
      UPDATE blocked_customers
      SET is_active = 1,
          blocked_reason = ?,
          blocked_by = 'system',
          blocked_at = CURRENT_TIMESTAMP,
          unblocked_at = NULL
      WHERE id = ?
    `).bind(reason, existing.id).run()
    return
  }

  await db.prepare(`
    INSERT INTO blocked_customers (user_id, customer_phone, blocked_reason, blocked_by, is_active)
    VALUES (NULL, ?, ?, 'system', 1)
  `).bind(customerPhone, reason).run()
}

async function clearStaleSystemAutoBlock(db: D1Database, userId: number | null, customerPhone: string | null) {
  if (userId) {
    await db.prepare(`
      UPDATE users
      SET is_blocked = 0,
          blocked_reason = NULL,
          blocked_at = NULL
      WHERE id = ?
        AND COALESCE(is_blocked, 0) = 1
        AND COALESCE(blocked_reason, '') LIKE ?
        AND NOT EXISTS (
          SELECT 1
          FROM blocked_customers bc
          WHERE bc.is_active = 1
            AND bc.blocked_by = 'admin'
            AND bc.user_id = users.id
        )
    `).bind(userId, `${SYSTEM_AUTO_BLOCK_REASON_PREFIX}%`).run()
  }

  const identity = buildCustomerIdentityWhereSql(userId, customerPhone, NORMALIZED_BLOCK_PHONE_SQL)
  await db.prepare(`
    UPDATE blocked_customers
    SET is_active = 0,
        unblocked_at = CURRENT_TIMESTAMP
    WHERE is_active = 1
      AND blocked_by = 'system'
      AND ${identity.sql}
  `).bind(...identity.params).run()
}

export async function refreshCustomerAutoBlock(
  db: D1Database,
  userIdInput: unknown,
  customerPhoneInput: unknown
) {
  const userId = normalizeUserId(userIdInput)
  const customerPhone = normalizeCustomerPhone(customerPhoneInput)
  if (!userId && !customerPhone) {
    return { autoBlocked: false, cancelledCount: 0, reason: '' }
  }

  const cancelledCount = await countCustomerFaultCancelledOrders(db, userId, customerPhone)
  if (cancelledCount >= CUSTOMER_FAULT_AUTO_BLOCK_THRESHOLD) {
    const reason = buildSystemAutoBlockReason(cancelledCount)
    await applySystemAutoBlock(db, userId, customerPhone || null, reason)
    return { autoBlocked: true, cancelledCount, reason }
  }

  await clearStaleSystemAutoBlock(db, userId, customerPhone || null)
  return { autoBlocked: false, cancelledCount, reason: '' }
}
