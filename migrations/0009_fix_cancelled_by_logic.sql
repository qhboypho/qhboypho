-- Fix cancelled_by logic for existing orders
-- New logic: If order has tracking code → customer cancelled (bom hang)
--            If no tracking code → shop cancelled

-- Reset all cancelled_by first
UPDATE orders 
SET cancelled_by = NULL
WHERE return_status = 'cancelled' OR status = 'cancelled';

-- Set customer cancelled: Orders with tracking code
UPDATE orders 
SET cancelled_by = 'customer'
WHERE (return_status = 'cancelled' OR status = 'cancelled')
  AND shipping_tracking_code IS NOT NULL 
  AND shipping_tracking_code != '';

-- Set shop cancelled: Orders without tracking code
UPDATE orders 
SET cancelled_by = 'shop'
WHERE (return_status = 'cancelled' OR status = 'cancelled')
  AND (shipping_tracking_code IS NULL OR shipping_tracking_code = '');
