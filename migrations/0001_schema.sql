-- Products table
CREATE TABLE IF NOT EXISTS products (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  description TEXT,
  price REAL NOT NULL,
  original_price REAL,
  category TEXT DEFAULT 'unisex',
  brand TEXT,
  material TEXT,
  thumbnail TEXT,
  images TEXT DEFAULT '[]',
  colors TEXT DEFAULT '[]',
  sizes TEXT DEFAULT '[]',
  stock INTEGER DEFAULT 0,
  is_active INTEGER DEFAULT 1,
  is_featured INTEGER DEFAULT 0,
  is_trending INTEGER DEFAULT 0,
  trending_order INTEGER DEFAULT 0,
  display_order INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Orders table
CREATE TABLE IF NOT EXISTS orders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_code TEXT UNIQUE NOT NULL,
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  customer_address TEXT NOT NULL,
  user_id INTEGER,
  product_id INTEGER NOT NULL,
  product_name TEXT NOT NULL,
  product_price REAL NOT NULL,
  color TEXT,
  selected_color_image TEXT DEFAULT '',
  size TEXT,
  quantity INTEGER DEFAULT 1,
  total_price REAL NOT NULL,
  voucher_code TEXT DEFAULT '',
  discount_amount REAL DEFAULT 0,
  note TEXT,
  payment_method TEXT DEFAULT 'COD',
  payment_status TEXT DEFAULT 'unpaid',
  payment_paid_at DATETIME,
  payment_ref TEXT,
  payment_provider TEXT,
  payment_link_id TEXT,
  payment_checkout_url TEXT,
  payment_order_code INTEGER,
  shipping_arranged INTEGER DEFAULT 0,
  shipping_arranged_at DATETIME,
  shipping_carrier TEXT DEFAULT '',
  shipping_tracking_code TEXT,
  shipping_label TEXT,
  shipping_fee REAL DEFAULT 0,
  status TEXT DEFAULT 'pending',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (product_id) REFERENCES products(id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created ON orders(created_at);
CREATE INDEX IF NOT EXISTS idx_products_active ON products(is_active);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
