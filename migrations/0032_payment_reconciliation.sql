-- Payment state that needs an operator decision must be explicit. In
-- particular, a late payment for a cancelled order must never reopen it.
ALTER TABLE orders ADD COLUMN payment_review_required INTEGER NOT NULL DEFAULT 0;
ALTER TABLE orders ADD COLUMN payment_review_reason TEXT;

-- A PayOS create request is not idempotent at the HTTP layer. Keep one durable
-- attempt per order/provider so concurrent browser clicks cannot create two
-- payment links, and an interrupted request can be reconciled by order code.
CREATE TABLE IF NOT EXISTS payment_attempts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id INTEGER NOT NULL,
  provider TEXT NOT NULL,
  idempotency_key TEXT NOT NULL,
  provider_order_code INTEGER,
  status TEXT NOT NULL DEFAULT 'CREATING',
  payment_link_id TEXT,
  checkout_url TEXT,
  error_code TEXT,
  lease_expires_at DATETIME,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(order_id, provider),
  FOREIGN KEY (order_id) REFERENCES orders(id)
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_payment_attempts_provider_code
  ON payment_attempts(provider, provider_order_code)
  WHERE provider_order_code IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_payment_attempts_stale
  ON payment_attempts(status, lease_expires_at, updated_at);

-- The reconciliation worker records a short retry delay after an unpaid
-- provider query. This prevents old expired payments from starving newer ones.
CREATE TABLE IF NOT EXISTS payment_reconciliation_attempts (
  order_id INTEGER PRIMARY KEY,
  attempt_count INTEGER NOT NULL DEFAULT 0,
  last_attempt_at DATETIME,
  next_attempt_at DATETIME,
  last_result TEXT,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (order_id) REFERENCES orders(id)
);

CREATE INDEX IF NOT EXISTS idx_payment_reconciliation_due
  ON payment_reconciliation_attempts(next_attempt_at, last_attempt_at);
