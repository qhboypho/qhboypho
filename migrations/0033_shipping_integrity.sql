-- Shipping side-effect guard.  A row is inserted before calling a carrier;
-- the creating state is deliberately durable so a timeout or worker crash
-- cannot cause a second remote order to be created blindly.
ALTER TABLE orders ADD COLUMN shipping_delivery_confirmed_at DATETIME;
ALTER TABLE orders ADD COLUMN shipping_delivery_source TEXT;
ALTER TABLE orders ADD COLUMN shipping_delivery_evidence_ref TEXT;
ALTER TABLE orders ADD COLUMN shipping_delivery_confirmed_by TEXT;

CREATE TABLE IF NOT EXISTS shipping_creation_attempts (
  order_id INTEGER PRIMARY KEY,
  carrier TEXT NOT NULL,
  idempotency_key TEXT NOT NULL UNIQUE,
  state TEXT NOT NULL DEFAULT 'creating'
    CHECK (state IN ('creating', 'created', 'failed', 'needs_reconciliation')),
  tracking_code TEXT,
  label_code TEXT,
  shipping_fee REAL NOT NULL DEFAULT 0,
  last_error TEXT,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (order_id) REFERENCES orders(id)
);

CREATE INDEX IF NOT EXISTS idx_shipping_creation_attempts_state
  ON shipping_creation_attempts(state, updated_at);

CREATE INDEX IF NOT EXISTS idx_orders_shipping_delivery_evidence
  ON orders(shipping_delivery_confirmed_at)
  WHERE shipping_delivery_confirmed_at IS NOT NULL;
