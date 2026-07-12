ALTER TABLE products ADD COLUMN is_new_arrival INTEGER DEFAULT 0;

UPDATE products
SET is_new_arrival = 0
WHERE is_new_arrival IS NULL;

CREATE INDEX IF NOT EXISTS idx_products_new_arrival ON products(is_new_arrival, updated_at);
