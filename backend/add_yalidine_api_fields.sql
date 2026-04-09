-- Migration for adding Yalidine API fields
ALTER TABLE orders 
ADD COLUMN yalidine_tracking VARCHAR(255) NULL,
ADD COLUMN yalidine_label_url TEXT NULL,
ADD COLUMN yalidine_status VARCHAR(50) DEFAULT 'pending',
ADD COLUMN yalidine_error TEXT NULL,
ADD COLUMN yalidine_synced_at TIMESTAMP NULL;
