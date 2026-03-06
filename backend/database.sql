-- Create Database
CREATE DATABASE aurea_deco;

-- Connect to the database
\c aurea_deco;

-- Users Table
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'designer',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Orders Table
CREATE TABLE orders (
    id SERIAL PRIMARY KEY,
    client_name VARCHAR(255) NOT NULL,
    phone VARCHAR(50) NOT NULL,
    address TEXT,
    assigned_designer INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Products Table
CREATE TABLE products (
    id SERIAL PRIMARY KEY,
    order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE,
    type VARCHAR(100) NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    unit_price DECIMAL(10, 2) NOT NULL,
    status VARCHAR(50) DEFAULT 'En attente',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Images Table
CREATE TABLE images (
    id SERIAL PRIMARY KEY,
    product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
    filename VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL, -- 'client' or 'designer'
    uploaded_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX idx_orders_designer ON orders(assigned_designer);
CREATE INDEX idx_orders_created ON orders(created_at DESC);
CREATE INDEX idx_products_order ON products(order_id);
CREATE INDEX idx_images_product ON images(product_id);
CREATE INDEX idx_users_email ON users(email);

-- Insert default admin user (password: admin123)
-- Password hash generated with: bcrypt.hash('admin123', 10)
INSERT INTO users (name, email, password, role) VALUES 
('Admin User', 'admin@aurea.dz', '$2a$10$K9pQ9Z7L9Z7L9Z7L9Z7L9eYqQhXfZ1bH8F7x9J5y4K6L3M8N9O0P1', 'admin');

-- Insert default designer user (password: designer123)
INSERT INTO users (name, email, password, role) VALUES 
('Designer User', 'designer@aurea.dz', '$2a$10$L8qR0M1M1M1M1M1M1M1MfZpRiYgA2cI9G8y0K6z5L7M4N9O0P1Q2', 'designer');

-- Insert sample order for testing
INSERT INTO orders (client_name, phone, address, assigned_designer) VALUES 
('Fatima Benali', '0555 123 456', 'Cité 20 Août, Sétif', 2);

-- Insert sample products
INSERT INTO products (order_id, type, quantity, unit_price, status) VALUES 
(1, 'Cadre', 2, 1500.00, 'Design en cours'),
(1, 'Couvre', 1, 3000.00, 'En attente');

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Grant permissions (adjust as needed)
-- GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO your_db_user;
-- GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO your_db_user;