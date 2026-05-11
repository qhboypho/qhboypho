-- Aggregate product detail modal opens by product and Vietnam date.
CREATE TABLE IF NOT EXISTS product_daily_views (
  product_id INTEGER NOT NULL,
  view_date TEXT NOT NULL,
  view_count INTEGER NOT NULL DEFAULT 0,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (product_id, view_date),
  FOREIGN KEY (product_id) REFERENCES products(id)
);

CREATE INDEX IF NOT EXISTS idx_product_daily_views_date
  ON product_daily_views(view_date);

INSERT INTO product_daily_views (product_id, view_date, view_count, updated_at)
SELECT
  product_id,
  strftime('%Y-%m-%d', datetime(created_at, '+7 hours')) AS view_date,
  COUNT(*) AS view_count,
  CURRENT_TIMESTAMP
FROM product_detail_views
GROUP BY product_id, strftime('%Y-%m-%d', datetime(created_at, '+7 hours'))
ON CONFLICT(product_id, view_date) DO UPDATE SET
  view_count = product_daily_views.view_count + excluded.view_count,
  updated_at = CURRENT_TIMESTAMP;

DROP TABLE IF EXISTS product_detail_views;
