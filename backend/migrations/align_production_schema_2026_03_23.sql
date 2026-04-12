-- Idempotent schema alignment for production environments.
-- Safe to run multiple times.

-- Ensure helper function exists before creating triggers.
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE 'plpgsql';

-- Orders table: add all fields required by current API/models.
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS first_name VARCHAR(100),
  ADD COLUMN IF NOT EXISTS last_name VARCHAR(100),
  ADD COLUMN IF NOT EXISTS phone2 VARCHAR(20),
  ADD COLUMN IF NOT EXISTS wilaya VARCHAR(100),
  ADD COLUMN IF NOT EXISTS commune VARCHAR(100),
  ADD COLUMN IF NOT EXISTS delivery_type VARCHAR(50) DEFAULT 'domicile',
  ADD COLUMN IF NOT EXISTS stop_desk_agency VARCHAR(100),
  ADD COLUMN IF NOT EXISTS is_free_delivery BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS has_exchange BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS has_insurance BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS declared_value NUMERIC(10, 2),
  ADD COLUMN IF NOT EXISTS delivery_fee DECIMAL(10, 2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS discount DECIMAL(10, 2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS source VARCHAR(50) DEFAULT 'admin',
  ADD COLUMN IF NOT EXISTS versement DECIMAL(10, 2) DEFAULT 0;

-- Products table: support stock image propagation in orders.
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS image_url TEXT;

-- Photos table: transition from images to photos with types and user tracking.
ALTER TABLE photos
  ADD COLUMN IF NOT EXISTS filename VARCHAR(255),
  ADD COLUMN IF NOT EXISTS type VARCHAR(50) DEFAULT 'client',
  ADD COLUMN IF NOT EXISTS uploaded_by INTEGER REFERENCES users(id) ON DELETE SET NULL;
  
-- Backfill filename from url if url exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'photos' AND column_name = 'url') THEN
    UPDATE photos SET filename = url WHERE filename IS NULL AND url IS NOT NULL;
  END IF;
END $$;

-- Inventory table used by current Stock model.
CREATE TABLE IF NOT EXISTS inventory_items (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  color VARCHAR(100),
  dimension VARCHAR(100),
  size VARCHAR(50),
  quantity INTEGER NOT NULL DEFAULT 0,
  image_url TEXT,
  price DECIMAL(10, 2),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Backfill inventory table shape if table already existed with fewer columns.
ALTER TABLE inventory_items
  ADD COLUMN IF NOT EXISTS image_url TEXT,
  ADD COLUMN IF NOT EXISTS price DECIMAL(10, 2),
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- Company settings table for invoice settings endpoints.
CREATE TABLE IF NOT EXISTS company_settings (
  id SERIAL PRIMARY KEY,
  key VARCHAR(255) UNIQUE NOT NULL,
  value TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO company_settings (key, value) VALUES
  ('company_name', 'AUREA DECO'),
  ('vendor_name', 'MOSEFAOUI NESRINE'),
  ('activity', 'Artisan en impression sur divers supports'),
  ('address', 'Sour El Ghozlane - Bouira'),
  ('phone', '07 75 96 07 56')
ON CONFLICT (key) DO NOTHING;

-- Performance indexes.
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders (status);
CREATE INDEX IF NOT EXISTS idx_orders_designer ON orders (assigned_designer);
CREATE INDEX IF NOT EXISTS idx_products_order_id ON products (order_id);
CREATE INDEX IF NOT EXISTS idx_photos_order_id ON photos (order_id);
CREATE INDEX IF NOT EXISTS idx_inventory_items_name ON inventory_items (name);

-- Triggers for updated_at timestamps.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_orders_updated_at') THEN
    CREATE TRIGGER update_orders_updated_at
    BEFORE UPDATE ON orders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_products_updated_at') THEN
    CREATE TRIGGER update_products_updated_at
    BEFORE UPDATE ON products
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_inventory_items_updated_at') THEN
    CREATE TRIGGER update_inventory_items_updated_at
    BEFORE UPDATE ON inventory_items
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_company_settings_updated_at') THEN
    CREATE TRIGGER update_company_settings_updated_at
    BEFORE UPDATE ON company_settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;
