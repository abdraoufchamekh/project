-- Performance Indexes
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders (status);
CREATE INDEX IF NOT EXISTS idx_orders_designer ON orders (assigned_designer);
CREATE INDEX IF NOT EXISTS idx_products_order_id ON products (order_id);
CREATE INDEX IF NOT EXISTS idx_photos_order_id ON photos (order_id);
