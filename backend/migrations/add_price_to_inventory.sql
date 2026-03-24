-- Add optional default price to inventory items (used as default unit price when adding to order)
ALTER TABLE inventory_items
  ADD COLUMN IF NOT EXISTS price DECIMAL(10, 2) DEFAULT NULL;

COMMENT ON COLUMN inventory_items.price IS 'Default unit price (DA) when this item is added to an order; user can override in the order form.';
