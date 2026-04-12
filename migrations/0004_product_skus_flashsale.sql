CREATE TABLE IF NOT EXISTS product_skus (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  product_id INTEGER NOT NULL,
  sku_code TEXT NOT NULL,
  color TEXT DEFAULT '',
  size TEXT DEFAULT '',
  image TEXT DEFAULT '',
  price REAL NOT NULL,
  original_price REAL,
  stock INTEGER DEFAULT 0,
  is_active INTEGER DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (product_id) REFERENCES products(id)
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_product_skus_unique_variant ON product_skus(product_id, color, size);
CREATE INDEX IF NOT EXISTS idx_product_skus_product_active ON product_skus(product_id, is_active);

WITH color_variants AS (
  SELECT
    p.id AS product_id,
    '' AS color_name,
    TRIM(COALESCE(p.thumbnail, '')) AS color_image
  FROM products p
  WHERE NOT EXISTS (
    SELECT 1
    FROM json_each(CASE WHEN json_valid(p.colors) THEN p.colors ELSE '[]' END)
  )
  UNION ALL
  SELECT
    p.id AS product_id,
    TRIM(COALESCE(
      NULLIF(json_extract(c.value, '$.name'), ''),
      NULLIF(json_extract(c.value, '$.label'), ''),
      CASE
        WHEN json_type(c.value) = 'text' THEN json_extract(c.value, '$')
        ELSE ''
      END,
      ''
    )) AS color_name,
    TRIM(COALESCE(
      NULLIF(json_extract(c.value, '$.image'), ''),
      NULLIF(json_extract(c.value, '$.image_url'), ''),
      p.thumbnail,
      ''
    )) AS color_image
  FROM products p
  JOIN json_each(CASE WHEN json_valid(p.colors) THEN p.colors ELSE '[]' END) c
),
size_variants AS (
  SELECT
    p.id AS product_id,
    '' AS size_name
  FROM products p
  WHERE NOT EXISTS (
    SELECT 1
    FROM json_each(CASE WHEN json_valid(p.sizes) THEN p.sizes ELSE '[]' END)
  )
  UNION ALL
  SELECT
    p.id AS product_id,
    TRIM(COALESCE(
      CASE
        WHEN json_type(s.value) = 'text' THEN json_extract(s.value, '$')
        ELSE CAST(s.value AS TEXT)
      END,
      ''
    )) AS size_name
  FROM products p
  JOIN json_each(CASE WHEN json_valid(p.sizes) THEN p.sizes ELSE '[]' END) s
),
desired_skus AS (
  SELECT
    p.id AS product_id,
    ('SKU-' || p.id || '-' || printf('%03d', ROW_NUMBER() OVER (
      PARTITION BY p.id
      ORDER BY LOWER(COALESCE(cv.color_name, '')), LOWER(COALESCE(sv.size_name, ''))
    ))) AS sku_code,
    COALESCE(cv.color_name, '') AS color,
    COALESCE(sv.size_name, '') AS size,
    COALESCE(cv.color_image, TRIM(COALESCE(p.thumbnail, '')), '') AS image,
    p.price AS price,
    p.original_price AS original_price,
    p.stock AS stock,
    COALESCE(p.is_active, 1) AS is_active
  FROM products p
  JOIN color_variants cv ON cv.product_id = p.id
  JOIN size_variants sv ON sv.product_id = p.id
)
INSERT OR IGNORE INTO product_skus (product_id, sku_code, color, size, image, price, original_price, stock, is_active)
SELECT product_id, sku_code, color, size, image, price, original_price, stock, is_active
FROM desired_skus;

ALTER TABLE flash_sale_items ADD COLUMN product_sku_id INTEGER;
CREATE INDEX IF NOT EXISTS idx_flash_sale_items_product_sku_id ON flash_sale_items(product_sku_id);

INSERT INTO flash_sale_items (flash_sale_id, product_id, sale_price, discount_percent, purchase_limit, is_enabled, product_sku_id, created_at, updated_at)
SELECT
  fsi.flash_sale_id,
  fsi.product_id,
  fsi.sale_price,
  fsi.discount_percent,
  fsi.purchase_limit,
  fsi.is_enabled,
  ps.id AS product_sku_id,
  fsi.created_at,
  fsi.updated_at
FROM flash_sale_items fsi
JOIN product_skus ps ON ps.product_id = fsi.product_id
WHERE fsi.product_sku_id IS NULL;

DELETE FROM flash_sale_items WHERE product_sku_id IS NULL;

ALTER TABLE orders ADD COLUMN product_sku_id INTEGER;
CREATE INDEX IF NOT EXISTS idx_orders_product_sku_id ON orders(product_sku_id);

UPDATE orders
SET product_sku_id = (
  SELECT ps.id
  FROM product_skus ps
  WHERE ps.product_id = orders.product_id
    AND LOWER(TRIM(COALESCE(ps.color, ''))) = LOWER(TRIM(COALESCE(orders.color, '')))
    AND LOWER(TRIM(COALESCE(ps.size, ''))) = LOWER(TRIM(COALESCE(orders.size, '')))
  ORDER BY ps.id ASC
  LIMIT 1
)
WHERE product_sku_id IS NULL;

UPDATE orders
SET product_sku_id = (
  SELECT ps.id
  FROM product_skus ps
  WHERE ps.product_id = orders.product_id
  ORDER BY ps.id ASC
  LIMIT 1
)
WHERE product_sku_id IS NULL;
