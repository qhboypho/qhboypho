ALTER TABLE orders ADD COLUMN client_ip_hash TEXT;
ALTER TABLE orders ADD COLUMN customer_address_fingerprint TEXT;

CREATE INDEX IF NOT EXISTS idx_orders_user_created
  ON orders(user_id, created_at)
  WHERE user_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_orders_phone_created
  ON orders(customer_phone, created_at)
  WHERE customer_phone IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_orders_ip_hash_created
  ON orders(client_ip_hash, created_at)
  WHERE client_ip_hash IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_orders_address_fingerprint_created
  ON orders(customer_address_fingerprint, created_at)
  WHERE customer_address_fingerprint IS NOT NULL;
