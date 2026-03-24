-- Table for Company Settings used in Invoices
CREATE TABLE IF NOT EXISTS company_settings (
    id SERIAL PRIMARY KEY,
    key VARCHAR(255) UNIQUE NOT NULL,
    value TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert default AUREA DECO information
INSERT INTO company_settings (key, value) VALUES
    ('company_name', 'AUREA DECO'),
    ('vendor_name', 'MOSEFAOUI NESRINE'),
    ('activity', 'Artisan en impression sur divers supports'),
    ('address', 'Sour El Ghozlane – Bouira'),
    ('phone', '07 75 96 07 56')
ON CONFLICT (key) DO NOTHING;

-- Create trigger for updated_at
CREATE TRIGGER update_company_settings_updated_at BEFORE UPDATE ON company_settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
