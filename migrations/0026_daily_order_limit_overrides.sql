-- Allow admins to temporarily lift the daily order risk limit for one customer.
CREATE TABLE IF NOT EXISTS daily_order_limit_overrides (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,
  customer_phone TEXT NOT NULL,
  override_date TEXT NOT NULL,
  reason TEXT DEFAULT 'Admin cho phép đặt thêm trong ngày',
  granted_by TEXT DEFAULT 'admin',
  granted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  expires_at DATETIME NOT NULL,
  revoked_at DATETIME,
  is_active INTEGER DEFAULT 1,
  UNIQUE(customer_phone, override_date)
);

CREATE INDEX IF NOT EXISTS idx_daily_order_limit_overrides_phone_date
  ON daily_order_limit_overrides(customer_phone, override_date, is_active);

CREATE INDEX IF NOT EXISTS idx_daily_order_limit_overrides_expires
  ON daily_order_limit_overrides(expires_at)
  WHERE is_active = 1;
