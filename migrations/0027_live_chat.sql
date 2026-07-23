CREATE TABLE IF NOT EXISTS live_chat_conversations (
  id TEXT PRIMARY KEY,
  user_id INTEGER,
  guest_phone TEXT DEFAULT '',
  customer_token TEXT NOT NULL,
  customer_name TEXT DEFAULT '',
  status TEXT DEFAULT 'open',
  assigned_admin_key TEXT DEFAULT '',
  product_id INTEGER,
  product_name TEXT DEFAULT '',
  product_thumbnail TEXT DEFAULT '',
  product_url TEXT DEFAULT '',
  last_message TEXT DEFAULT '',
  last_message_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  admin_unread_count INTEGER DEFAULT 0,
  customer_unread_count INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  expires_at DATETIME NOT NULL
);

CREATE TABLE IF NOT EXISTS live_chat_messages (
  id TEXT PRIMARY KEY,
  conversation_id TEXT NOT NULL,
  sender_type TEXT NOT NULL,
  sender_id TEXT DEFAULT '',
  sender_name TEXT DEFAULT '',
  body TEXT DEFAULT '',
  message_type TEXT DEFAULT 'text',
  product_id INTEGER,
  product_name TEXT DEFAULT '',
  product_thumbnail TEXT DEFAULT '',
  product_url TEXT DEFAULT '',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  expires_at DATETIME NOT NULL,
  FOREIGN KEY (conversation_id) REFERENCES live_chat_conversations(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_live_chat_conversations_status_updated
  ON live_chat_conversations(status, updated_at);

CREATE INDEX IF NOT EXISTS idx_live_chat_conversations_user
  ON live_chat_conversations(user_id, status);

CREATE INDEX IF NOT EXISTS idx_live_chat_conversations_guest_phone
  ON live_chat_conversations(guest_phone, status);

CREATE INDEX IF NOT EXISTS idx_live_chat_conversations_expires
  ON live_chat_conversations(expires_at);

CREATE INDEX IF NOT EXISTS idx_live_chat_messages_conversation_created
  ON live_chat_messages(conversation_id, created_at);

CREATE INDEX IF NOT EXISTS idx_live_chat_messages_expires
  ON live_chat_messages(expires_at);
