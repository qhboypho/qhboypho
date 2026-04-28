-- Add return_status column to orders table
-- This column tracks whether an order was returned or cancelled
-- Values: NULL (normal order), 'returned' (customer returned), 'cancelled' (customer didn't receive - bom hang)

ALTER TABLE orders ADD COLUMN return_status TEXT DEFAULT NULL;

-- Create index for faster queries on return_status
CREATE INDEX IF NOT EXISTS idx_orders_return_status ON orders(return_status);

-- Update existing cancelled orders to have return_status = 'cancelled'
-- This helps identify orders that were cancelled/not received
UPDATE orders 
SET return_status = 'cancelled' 
WHERE status = 'cancelled' 
  AND shipping_tracking_code IS NOT NULL 
  AND shipping_tracking_code != '';
