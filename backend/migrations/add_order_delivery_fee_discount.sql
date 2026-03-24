-- Add delivery fee and discount to orders for invoice totals
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS delivery_fee DECIMAL(10, 2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS discount DECIMAL(10, 2) DEFAULT 0;

COMMENT ON COLUMN orders.delivery_fee IS 'Frais de livraison (DA) - 0 if is_free_delivery';
COMMENT ON COLUMN orders.discount IS 'Remise (DA) applied to invoice total';
