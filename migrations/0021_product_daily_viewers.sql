-- Track unique product detail viewers per product and Vietnam date.
-- product_daily_views remains the aggregate counter for fast admin reads.
CREATE TABLE IF NOT EXISTS product_daily_viewers (
  product_id INTEGER NOT NULL,
  visitor_id TEXT NOT NULL,
  view_date TEXT NOT NULL,
  first_seen_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  last_seen_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (product_id, visitor_id, view_date),
  FOREIGN KEY (product_id) REFERENCES products(id)
);

CREATE INDEX IF NOT EXISTS idx_product_daily_viewers_product_date
  ON product_daily_viewers(product_id, view_date);

CREATE INDEX IF NOT EXISTS idx_product_daily_viewers_visitor_date
  ON product_daily_viewers(visitor_id, view_date);
