-- Track every storefront product detail modal open.
CREATE TABLE IF NOT EXISTS product_detail_views (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  product_id INTEGER NOT NULL,
  visitor_id TEXT NOT NULL,
  user_agent TEXT DEFAULT '',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (product_id) REFERENCES products(id)
);

CREATE INDEX IF NOT EXISTS idx_product_detail_views_product
  ON product_detail_views(product_id);

CREATE INDEX IF NOT EXISTS idx_product_detail_views_created
  ON product_detail_views(created_at);

CREATE INDEX IF NOT EXISTS idx_product_detail_views_visitor
  ON product_detail_views(visitor_id);
