ALTER TABLE products ADD COLUMN storefront_visibility TEXT NOT NULL DEFAULT '["boypho"]';

UPDATE products
SET storefront_visibility = '["boypho"]'
WHERE storefront_visibility IS NULL OR TRIM(storefront_visibility) = '';

UPDATE products
SET storefront_visibility = '["boypho","hottrendnu"]'
WHERE LOWER(COALESCE(category, '')) IN ('female', 'women', 'girls')
   OR LOWER(COALESCE(name, '')) LIKE '%váy%'
   OR LOWER(COALESCE(name, '')) LIKE '%đầm%'
   OR LOWER(COALESCE(name, '')) LIKE '%nữ%'
   OR LOWER(COALESCE(name, '')) LIKE '%set%'
   OR LOWER(COALESCE(description, '')) LIKE '%váy%'
   OR LOWER(COALESCE(description, '')) LIKE '%đầm%'
   OR LOWER(COALESCE(description, '')) LIKE '%thời trang nữ%';

CREATE INDEX IF NOT EXISTS idx_products_storefront_visibility ON products(storefront_visibility);
