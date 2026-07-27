CREATE TABLE IF NOT EXISTS telegram_product_draft_media_groups (
  media_group_id TEXT PRIMARY KEY,
  chat_id TEXT NOT NULL,
  title TEXT DEFAULT '',
  status TEXT DEFAULT 'pending',
  product_id INTEGER,
  error TEXT DEFAULT '',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  processed_at DATETIME
);

CREATE TABLE IF NOT EXISTS telegram_product_draft_media_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  media_group_id TEXT NOT NULL,
  chat_id TEXT NOT NULL,
  message_id INTEGER DEFAULT 0,
  file_id TEXT NOT NULL,
  caption TEXT DEFAULT '',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(media_group_id, file_id)
);

CREATE INDEX IF NOT EXISTS idx_telegram_product_draft_groups_status
  ON telegram_product_draft_media_groups(status, updated_at);

CREATE INDEX IF NOT EXISTS idx_telegram_product_draft_items_group_order
  ON telegram_product_draft_media_items(media_group_id, message_id, id);
