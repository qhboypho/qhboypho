CREATE TABLE IF NOT EXISTS auto_vouchers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  discount_amount REAL NOT NULL,
  scope TEXT NOT NULL DEFAULT 'all',
  product_ids TEXT NOT NULL DEFAULT '[]',
  is_active INTEGER NOT NULL DEFAULT 1,
  valid_from DATETIME,
  valid_to DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_auto_vouchers_active ON auto_vouchers(is_active);
CREATE INDEX IF NOT EXISTS idx_auto_vouchers_scope ON auto_vouchers(scope);
