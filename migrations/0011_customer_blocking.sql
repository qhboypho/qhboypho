-- Customer blocking system
-- Track blocked customers (both registered users and guest checkout by phone)

-- Add is_blocked column to users table
ALTER TABLE users ADD COLUMN is_blocked INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN blocked_reason TEXT;
ALTER TABLE users ADD COLUMN blocked_at DATETIME;

-- Create blocked_customers table for tracking blocks (including guest checkout)
CREATE TABLE IF NOT EXISTS blocked_customers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,
  customer_phone TEXT,
  blocked_reason TEXT DEFAULT 'Bom hang 3 lan',
  blocked_by TEXT DEFAULT 'system',
  blocked_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  unblocked_at DATETIME,
  is_active INTEGER DEFAULT 1,
  UNIQUE(user_id, customer_phone)
);

CREATE INDEX IF NOT EXISTS idx_blocked_customers_user_id ON blocked_customers(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_blocked_customers_phone ON blocked_customers(customer_phone) WHERE customer_phone IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_blocked_customers_active ON blocked_customers(is_active);

-- Auto-block customers who have 3+ cancelled orders
-- This will be handled by application logic when order status changes
