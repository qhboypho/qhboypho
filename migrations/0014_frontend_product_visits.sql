CREATE TABLE IF NOT EXISTS frontend_product_visits (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  visitor_id TEXT NOT NULL,
  product_id INTEGER,
  visit_date TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (product_id) REFERENCES products(id)
);

CREATE INDEX IF NOT EXISTS idx_frontend_product_visits_date ON frontend_product_visits(visit_date);
CREATE INDEX IF NOT EXISTS idx_frontend_product_visits_visitor_date ON frontend_product_visits(visitor_id, visit_date);
CREATE INDEX IF NOT EXISTS idx_frontend_product_visits_product_id ON frontend_product_visits(product_id);
