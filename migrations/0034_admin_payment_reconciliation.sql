-- Append-only evidence for deliberate manual VietQR payment confirmation.
-- The order row remains the source of current payment state; this table records
-- who verified a bank reference, which amount was checked, and the retry key.
CREATE TABLE IF NOT EXISTS admin_payment_reconciliation_audit (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id INTEGER NOT NULL,
  order_code TEXT NOT NULL,
  payment_provider TEXT NOT NULL COLLATE NOCASE,
  bank_reference TEXT NOT NULL COLLATE NOCASE,
  verified_amount INTEGER NOT NULL CHECK (verified_amount > 0),
  order_amount INTEGER NOT NULL CHECK (order_amount > 0),
  admin_user_key TEXT NOT NULL,
  admin_user_id INTEGER,
  action TEXT NOT NULL DEFAULT 'confirm_paid',
  idempotency_key TEXT NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(payment_provider, bank_reference),
  UNIQUE(idempotency_key),
  UNIQUE(order_id),
  CHECK (verified_amount = order_amount)
);

CREATE INDEX IF NOT EXISTS idx_admin_payment_reconciliation_order
  ON admin_payment_reconciliation_audit(order_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_admin_payment_reconciliation_created
  ON admin_payment_reconciliation_audit(created_at DESC);

-- Audit evidence must not be editable or removable through the database API.
CREATE TRIGGER IF NOT EXISTS trg_admin_payment_reconciliation_audit_no_update
BEFORE UPDATE ON admin_payment_reconciliation_audit
BEGIN
  SELECT RAISE(ABORT, 'admin payment reconciliation audit is immutable');
END;

CREATE TRIGGER IF NOT EXISTS trg_admin_payment_reconciliation_audit_no_delete
BEFORE DELETE ON admin_payment_reconciliation_audit
BEGIN
  SELECT RAISE(ABORT, 'admin payment reconciliation audit is immutable');
END;
