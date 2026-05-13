ALTER TABLE orders ADD COLUMN device_hash TEXT;

CREATE INDEX IF NOT EXISTS idx_orders_device_hash_created
  ON orders(device_hash, created_at)
  WHERE device_hash IS NOT NULL;
