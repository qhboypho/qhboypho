-- Compatibility migration kept for deployments that already saw this filename.
-- The canonical schema lives in 0012_frontend_product_visits.sql.
CREATE TABLE IF NOT EXISTS frontend_product_visits (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  visitor_id TEXT NOT NULL,
  visit_date TEXT NOT NULL,
  first_seen_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  last_seen_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_frontend_product_visits_visitor_day
  ON frontend_product_visits(visitor_id, visit_date);

CREATE INDEX IF NOT EXISTS idx_frontend_product_visits_visit_date
  ON frontend_product_visits(visit_date);

CREATE INDEX IF NOT EXISTS idx_frontend_product_visits_first_seen
  ON frontend_product_visits(first_seen_at);
