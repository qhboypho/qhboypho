-- Order creation integrity: idempotent guest access, inventory reservation,
-- and race-safe voucher usage. Existing orders are intentionally left with
-- inventory_reserved = 0 so a later cancellation cannot restock legacy stock.

ALTER TABLE orders ADD COLUMN inventory_reserved INTEGER NOT NULL DEFAULT 0;
ALTER TABLE orders ADD COLUMN inventory_released INTEGER NOT NULL DEFAULT 0;
ALTER TABLE orders ADD COLUMN order_access_token_hash TEXT;
ALTER TABLE orders ADD COLUMN idempotency_key_hash TEXT;
ALTER TABLE orders ADD COLUMN idempotency_payload_hash TEXT;

CREATE INDEX IF NOT EXISTS idx_orders_order_access_token_hash
  ON orders(order_access_token_hash)
  WHERE order_access_token_hash IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_orders_idempotency_key_hash
  ON orders(idempotency_key_hash)
  WHERE idempotency_key_hash IS NOT NULL;

-- A new order reserves exactly one authoritative inventory source. The
-- conditional UPDATE and RAISE run inside the INSERT transaction, so a
-- concurrent request cannot oversell and a later INSERT/constraint failure
-- rolls the reservation back with the order.
CREATE TRIGGER IF NOT EXISTS orders_reserve_product_sku_stock
BEFORE INSERT ON orders
WHEN COALESCE(NEW.inventory_reserved, 0) = 1
  AND NEW.product_sku_id IS NOT NULL
BEGIN
  UPDATE product_skus
  SET stock = stock - CAST(NEW.quantity AS INTEGER),
      updated_at = CURRENT_TIMESTAMP
  WHERE id = NEW.product_sku_id
    AND product_id = NEW.product_id
    AND is_active = 1
    AND EXISTS (SELECT 1 FROM products WHERE id = NEW.product_id AND is_active = 1)
    AND COALESCE(stock, 0) >= CAST(NEW.quantity AS INTEGER);

  SELECT CASE
    WHEN changes() = 0 THEN RAISE(ABORT, 'INSUFFICIENT_STOCK')
  END;
END;

CREATE TRIGGER IF NOT EXISTS orders_reserve_product_stock
BEFORE INSERT ON orders
WHEN COALESCE(NEW.inventory_reserved, 0) = 1
  AND NEW.product_sku_id IS NULL
BEGIN
  UPDATE products
  SET stock = stock - CAST(NEW.quantity AS INTEGER),
      updated_at = CURRENT_TIMESTAMP
  WHERE id = NEW.product_id
    AND is_active = 1
    AND COALESCE(stock, 0) >= CAST(NEW.quantity AS INTEGER);

  SELECT CASE
    WHEN changes() = 0 THEN RAISE(ABORT, 'INSUFFICIENT_STOCK')
  END;
END;

-- Voucher usage is consumed by the same order INSERT transaction. The
-- conditional predicate closes the usage-limit race between validation reads.
CREATE TRIGGER IF NOT EXISTS orders_consume_voucher_usage
BEFORE INSERT ON orders
WHEN TRIM(COALESCE(NEW.voucher_code, '')) <> ''
BEGIN
  UPDATE vouchers
  SET used_count = COALESCE(used_count, 0) + 1
  WHERE UPPER(code) = UPPER(TRIM(NEW.voucher_code))
    AND is_active = 1
    AND valid_from <= CURRENT_TIMESTAMP
    AND valid_to >= CURRENT_TIMESTAMP
    AND (COALESCE(usage_limit, 0) <= 0 OR COALESCE(used_count, 0) < usage_limit);

  SELECT CASE
    WHEN changes() = 0 THEN RAISE(ABORT, 'INVALID_VOUCHER')
  END;
END;

-- Release only stock reserved by the new flow and only when cancellation is
-- still before shipment. A carrier cancellation/return is not proof that the
-- item is physically back in sellable inventory, so those paths need an
-- explicit restock action instead of an automatic release.
CREATE TRIGGER IF NOT EXISTS orders_release_inventory_after_cancel
AFTER UPDATE OF status, return_status ON orders
WHEN COALESCE(OLD.inventory_released, 0) = 0
  AND COALESCE(NEW.inventory_reserved, 0) = 1
  AND COALESCE(NEW.inventory_released, 0) = 0
  AND LOWER(COALESCE(NEW.status, '')) = 'cancelled'
  AND COALESCE(NEW.shipping_arranged, 0) = 0
  AND TRIM(COALESCE(NEW.shipping_tracking_code, '')) = ''
BEGIN
  UPDATE product_skus
  SET stock = stock + CAST(NEW.quantity AS INTEGER),
      updated_at = CURRENT_TIMESTAMP
  WHERE NEW.product_sku_id IS NOT NULL
    AND id = NEW.product_sku_id
    AND product_id = NEW.product_id;

  UPDATE products
  SET stock = stock + CAST(NEW.quantity AS INTEGER),
      updated_at = CURRENT_TIMESTAMP
  WHERE NEW.product_sku_id IS NULL
    AND id = NEW.product_id;

  UPDATE orders
  SET inventory_released = 1,
      updated_at = CURRENT_TIMESTAMP
  WHERE id = NEW.id
    AND inventory_released = 0;
END;
