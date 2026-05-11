CREATE TABLE IF NOT EXISTS user_registration_identities (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  identity_type TEXT NOT NULL CHECK(identity_type IN ('phone', 'ip_hash')),
  identity_value TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, identity_type, identity_value)
);

CREATE INDEX IF NOT EXISTS idx_user_registration_identities_lookup
  ON user_registration_identities(identity_type, identity_value);

CREATE INDEX IF NOT EXISTS idx_user_registration_identities_user
  ON user_registration_identities(user_id);

INSERT OR IGNORE INTO user_registration_identities (user_id, identity_type, identity_value)
SELECT
  id,
  'phone',
  REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(TRIM(phone), ' ', ''), '-', ''), '.', ''), '(', ''), ')', ''), '+', '')
FROM users
WHERE phone IS NOT NULL
  AND TRIM(phone) != ''
  AND REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(TRIM(phone), ' ', ''), '-', ''), '.', ''), '(', ''), ')', ''), '+', '') != '';
