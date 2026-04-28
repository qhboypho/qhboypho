-- Add cancelled_by column to track who cancelled the order
-- Values: NULL (not cancelled), 'shop' (shop cancelled), 'customer' (customer cancelled/bom hang)

ALTER TABLE orders ADD COLUMN cancelled_by TEXT DEFAULT NULL;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_orders_cancelled_by ON orders(cancelled_by);

-- Update existing cancelled orders
-- If order was cancelled before shipping arranged, it's shop cancelled
UPDATE orders 
SET cancelled_by = 'shop'
WHERE status = 'cancelled' 
  AND return_status = 'cancelled'
  AND (shipping_arranged = 0 OR shipping_arranged IS NULL)
  AND (shipping_tracking_code IS NULL OR shipping_tracking_code = '');

-- If order was cancelled after shipping arranged, it's customer cancelled (bom hang)
UPDATE orders 
SET cancelled_by = 'customer'
WHERE status = 'cancelled' 
  AND return_status = 'cancelled'
  AND shipping_arranged = 1
  AND shipping_tracking_code IS NOT NULL 
  AND shipping_tracking_code != '';
