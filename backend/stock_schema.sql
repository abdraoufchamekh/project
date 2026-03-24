-- Create new Stock Management Tables

-- Stock Products Table
CREATE TABLE IF NOT EXISTS stock_products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(100) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Stock Product Variants Table
CREATE TABLE IF NOT EXISTS stock_product_variants (
    id SERIAL PRIMARY KEY,
    product_id INTEGER REFERENCES stock_products(id) ON DELETE CASCADE,
    color VARCHAR(100),
    size VARCHAR(50),
    dimension VARCHAR(100),
    quantity INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create triggers for updated_at
CREATE TRIGGER update_stock_products_updated_at BEFORE UPDATE ON stock_products
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_stock_variants_updated_at BEFORE UPDATE ON stock_product_variants
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
