-- Runtime init cleanup migration
-- Move schema evolution and one-time data setup out of request-time initDB().

-- Ensure auxiliary tables exist.
CREATE TABLE IF NOT EXISTS vouchers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  code TEXT UNIQUE NOT NULL,
  discount_amount REAL NOT NULL,
  valid_from DATETIME NOT NULL,
  valid_to DATETIME NOT NULL,
  usage_limit INTEGER DEFAULT 0,
  used_count INTEGER DEFAULT 0,
  is_active INTEGER DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS transactions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  tid TEXT UNIQUE,
  amount REAL,
  description TEXT,
  user_id INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  avatar TEXT,
  balance REAL DEFAULT 0,
  is_admin INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS app_settings (
  key TEXT PRIMARY KEY,
  value TEXT,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS hero_banners (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  image_url TEXT NOT NULL,
  subtitle TEXT,
  title TEXT,
  price TEXT,
  product_id INTEGER,
  display_order INTEGER DEFAULT 0,
  is_active INTEGER DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS flash_sales (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  start_at DATETIME NOT NULL,
  end_at DATETIME NOT NULL,
  is_active INTEGER DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS flash_sale_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  flash_sale_id INTEGER NOT NULL,
  product_id INTEGER NOT NULL,
  sale_price REAL,
  discount_percent REAL,
  purchase_limit INTEGER DEFAULT 0,
  is_enabled INTEGER DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- NOTE:
-- D1/SQLite does not support "ALTER TABLE ... ADD COLUMN IF NOT EXISTS".
-- Existing databases already have these columns from previous runtime init behavior.
-- New databases should receive the latest schema from base migrations.

-- Keep indexes in parity with runtime assumptions.
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created ON orders(created_at);
CREATE INDEX IF NOT EXISTS idx_products_active ON products(is_active);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_vouchers_code ON vouchers(code);
CREATE INDEX IF NOT EXISTS idx_flash_sales_status_time ON flash_sales(is_active, start_at, end_at);
CREATE INDEX IF NOT EXISTS idx_flash_sale_items_flash_sale_id ON flash_sale_items(flash_sale_id);
CREATE INDEX IF NOT EXISTS idx_flash_sale_items_product_id ON flash_sale_items(product_id);

-- One-time selected_color_image backfill:
-- use matching color image when available, otherwise fall back to product thumbnail.
WITH resolved AS (
  SELECT
    o.id AS order_id,
    COALESCE(
      (
        SELECT json_extract(j.value, '$.image')
        FROM json_each(
          CASE
            WHEN json_valid(p.colors) THEN p.colors
            ELSE '[]'
          END
        ) AS j
        WHERE lower(trim(json_extract(j.value, '$.name'))) = lower(trim(o.color))
          AND trim(COALESCE(json_extract(j.value, '$.image'), '')) <> ''
        LIMIT 1
      ),
      p.thumbnail
    ) AS resolved_image
  FROM orders o
  JOIN products p ON p.id = o.product_id
  WHERE trim(COALESCE(o.selected_color_image, '')) = ''
    AND trim(COALESCE(o.color, '')) <> ''
)
UPDATE orders
SET selected_color_image = COALESCE(
    (SELECT resolved_image FROM resolved r WHERE r.order_id = orders.id),
    selected_color_image
  ),
  updated_at = CURRENT_TIMESTAMP
WHERE id IN (SELECT order_id FROM resolved)
  AND trim(COALESCE((SELECT resolved_image FROM resolved r WHERE r.order_id = orders.id), '')) <> '';

-- Seed hero banners once.
INSERT INTO hero_banners (image_url, subtitle, title, price, product_id, display_order)
SELECT
  'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=500',
  'Moi nhat',
  'Bo suu tap Spring 2026',
  'Tu 299.000d',
  NULL,
  1
WHERE NOT EXISTS (SELECT 1 FROM hero_banners);

INSERT INTO hero_banners (image_url, subtitle, title, price, product_id, display_order)
SELECT
  'https://images.unsplash.com/photo-1550614000-4b95d4edc457?w=500',
  'Ban chay',
  'Phong cach duong pho',
  'Giam 20%',
  NULL,
  2
WHERE (SELECT COUNT(*) FROM hero_banners) = 1;

INSERT INTO hero_banners (image_url, subtitle, title, price, product_id, display_order)
SELECT
  'https://images.unsplash.com/photo-1492707892479-7bc8d5a4ee93?w=500',
  'Nam gioi',
  'Lich lam va tinh te',
  'Tu 450.000d',
  NULL,
  3
WHERE (SELECT COUNT(*) FROM hero_banners) = 2;
