-- Extend reviews to support admin-managed manual reviews per product
CREATE TABLE IF NOT EXISTS reviews_new (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  product_id INTEGER NOT NULL,
  user_id INTEGER,
  order_id INTEGER,
  reviewer_name TEXT DEFAULT '',
  reviewer_avatar TEXT DEFAULT '',
  created_by_admin INTEGER NOT NULL DEFAULT 0,
  rating INTEGER NOT NULL DEFAULT 5 CHECK(rating >= 1 AND rating <= 5),
  comment TEXT NOT NULL DEFAULT '',
  images TEXT DEFAULT '[]',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (product_id) REFERENCES products(id),
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (order_id) REFERENCES orders(id)
);

INSERT INTO reviews_new (
  id, product_id, user_id, order_id, reviewer_name, reviewer_avatar, created_by_admin,
  rating, comment, images, created_at
)
SELECT
  r.id,
  r.product_id,
  r.user_id,
  r.order_id,
  COALESCE(u.name, ''),
  COALESCE(u.avatar, ''),
  0,
  r.rating,
  r.comment,
  COALESCE(r.images, '[]'),
  r.created_at
FROM reviews r
LEFT JOIN users u ON u.id = r.user_id;

DROP TABLE reviews;
ALTER TABLE reviews_new RENAME TO reviews;

CREATE INDEX IF NOT EXISTS idx_reviews_product ON reviews(product_id);
CREATE INDEX IF NOT EXISTS idx_reviews_user ON reviews(user_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_reviews_order_unique ON reviews(order_id) WHERE order_id IS NOT NULL;
