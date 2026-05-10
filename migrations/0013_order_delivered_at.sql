ALTER TABLE orders ADD COLUMN delivered_at DATETIME;

UPDATE orders
SET delivered_at = COALESCE(delivered_at, updated_at)
WHERE LOWER(COALESCE(status, '')) = 'done'
  AND delivered_at IS NULL;
