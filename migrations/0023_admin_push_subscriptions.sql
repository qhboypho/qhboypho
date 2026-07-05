CREATE TABLE IF NOT EXISTS admin_push_subscriptions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  admin_user_key TEXT NOT NULL DEFAULT 'admin',
  endpoint TEXT NOT NULL UNIQUE,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  user_agent TEXT DEFAULT '',
  is_active INTEGER NOT NULL DEFAULT 1,
  failed_count INTEGER NOT NULL DEFAULT 0,
  last_error TEXT DEFAULT '',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_admin_push_subscriptions_active
  ON admin_push_subscriptions(is_active, admin_user_key);
