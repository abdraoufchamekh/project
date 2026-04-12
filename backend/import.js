require('dotenv').config();
const { Pool } = require('pg');
const fs = require('fs');

const supabase = new Pool({
  connectionString: 'postgresql://postgres.oteeurtqpxrzmdegrgtp:AureaDBAction!26@aws-1-eu-west-1.pooler.supabase.com:5432/postgres',
  ssl: { rejectUnauthorized: false }
});

const data = JSON.parse(fs.readFileSync('backup_data.json', 'utf8'));

const importData = async () => {
  try {
    console.log('🚀 Starting import to Supabase...');

    // Drop all existing tables
    await supabase.query(`
      DROP TABLE IF EXISTS photos CASCADE;
      DROP TABLE IF EXISTS products CASCADE;
      DROP TABLE IF EXISTS notifications CASCADE;
      DROP TABLE IF EXISTS inventory_items CASCADE;
      DROP TABLE IF EXISTS orders CASCADE;
      DROP TABLE IF EXISTS stock_product_variants CASCADE;
      DROP TABLE IF EXISTS stock_products CASCADE;
      DROP TABLE IF EXISTS company_settings CASCADE;
      DROP TABLE IF EXISTS users CASCADE;
    `);
    console.log('✅ Old tables dropped');

    // Create tables with EXACT real columns
    await supabase.query(`
      CREATE TABLE users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255),
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        role VARCHAR(50) DEFAULT 'admin',
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE company_settings (
        id SERIAL PRIMARY KEY,
        key VARCHAR(255),
        value TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE orders (
        id SERIAL PRIMARY KEY,
        client_name VARCHAR(255),
        first_name VARCHAR(255),
        last_name VARCHAR(255),
        phone VARCHAR(50),
        phone2 VARCHAR(50),
        address TEXT,
        status VARCHAR(100) DEFAULT 'Nouvelle commande',
        assigned_designer VARCHAR(255),
        wilaya VARCHAR(255),
        wilaya_id INT,
        commune VARCHAR(255),
        commune_id INT,
        delivery_type VARCHAR(50) DEFAULT 'domicile',
        stop_desk_agency VARCHAR(255),
        agency_id INT,
        is_free_delivery BOOLEAN DEFAULT false,
        has_exchange BOOLEAN DEFAULT false,
        has_insurance BOOLEAN DEFAULT false,
        declared_value NUMERIC,
        delivery_fee NUMERIC DEFAULT 0,
        discount NUMERIC DEFAULT 0,
        versement NUMERIC DEFAULT 0,
        source VARCHAR(50) DEFAULT 'admin',
        delivery_carrier VARCHAR(20),
        yalidine_tracking VARCHAR(100),
        yalidine_label_url TEXT,
        yalidine_status VARCHAR(50),
        yalidine_error TEXT,
        yalidine_synced_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE products (
        id SERIAL PRIMARY KEY,
        order_id INT REFERENCES orders(id) ON DELETE CASCADE,
        type VARCHAR(255),
        quantity INT DEFAULT 1,
        unit_price NUMERIC DEFAULT 0,
        status VARCHAR(100),
        image_url TEXT,
        article_type VARCHAR(50),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE photos (
        id SERIAL PRIMARY KEY,
        order_id INT REFERENCES orders(id) ON DELETE CASCADE,
        url TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE inventory_items (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255),
        color VARCHAR(100),
        dimension VARCHAR(100),
        size VARCHAR(100),
        quantity INT DEFAULT 0,
        image_url TEXT,
        price NUMERIC,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE notifications (
        id SERIAL PRIMARY KEY,
        inventory_item_id INT REFERENCES inventory_items(id) ON DELETE CASCADE,
        deficit INT DEFAULT 0,
        is_resolved BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE stock_products (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255),
        description TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE stock_product_variants (
        id SERIAL PRIMARY KEY,
        stock_product_id INT REFERENCES stock_products(id) ON DELETE CASCADE,
        name VARCHAR(255),
        quantity INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log('✅ All tables created with correct columns');

    // Import users
    for (const u of data.users) {
      await supabase.query(
        `INSERT INTO users (id, name, email, password, role, created_at, updated_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7) ON CONFLICT (id) DO NOTHING`,
        [u.id, u.name, u.email, u.password, u.role, u.created_at, u.updated_at]
      );
    }
    console.log('✅ Users imported:', data.users.length);

    // Import company_settings
    for (const s of data.company_settings) {
      await supabase.query(
        `INSERT INTO company_settings (id, key, value, created_at, updated_at)
         VALUES ($1,$2,$3,$4,$5) ON CONFLICT (id) DO NOTHING`,
        [s.id, s.key, s.value, s.created_at, s.updated_at]
      );
    }
    console.log('✅ Company settings imported:', data.company_settings.length);

    // Import orders
    for (const o of data.orders) {
      await supabase.query(
        `INSERT INTO orders (
          id, client_name, first_name, last_name, phone, phone2,
          address, status, assigned_designer, wilaya, wilaya_id,
          commune, commune_id, delivery_type, stop_desk_agency,
          agency_id, is_free_delivery, has_exchange, has_insurance,
          declared_value, delivery_fee, discount, versement, source,
          delivery_carrier, yalidine_tracking, yalidine_label_url,
          yalidine_status, yalidine_error, yalidine_synced_at,
          created_at, updated_at
        ) VALUES (
          $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,
          $17,$18,$19,$20,$21,$22,$23,$24,$25,$26,$27,$28,$29,$30,
          $31,$32
        ) ON CONFLICT (id) DO NOTHING`,
        [
          o.id, o.client_name, o.first_name, o.last_name, o.phone, o.phone2,
          o.address, o.status, o.assigned_designer, o.wilaya, o.wilaya_id,
          o.commune, o.commune_id, o.delivery_type, o.stop_desk_agency,
          o.agency_id, o.is_free_delivery, o.has_exchange, o.has_insurance,
          o.declared_value, o.delivery_fee, o.discount, o.versement, o.source,
          o.delivery_carrier, o.yalidine_tracking, o.yalidine_label_url,
          o.yalidine_status, o.yalidine_error, o.yalidine_synced_at,
          o.created_at, o.updated_at
        ]
      );
    }
    console.log('✅ Orders imported:', data.orders.length);

    // Import products
    for (const p of data.products) {
      await supabase.query(
        `INSERT INTO products (
          id, order_id, type, quantity, unit_price,
          status, image_url, article_type, created_at, updated_at
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) ON CONFLICT (id) DO NOTHING`,
        [
          p.id, p.order_id, p.type, p.quantity, p.unit_price,
          p.status, p.image_url, p.article_type, p.created_at, p.updated_at
        ]
      );
    }
    console.log('✅ Products imported:', data.products.length);

    // Import photos
    for (const ph of data.photos) {
      await supabase.query(
        `INSERT INTO photos (id, order_id, url, created_at)
         VALUES ($1,$2,$3,$4) ON CONFLICT (id) DO NOTHING`,
        [ph.id, ph.order_id, ph.url, ph.created_at]
      );
    }
    console.log('✅ Photos imported:', data.photos.length);

    // Import inventory_items
    for (const i of data.inventory_items) {
      await supabase.query(
        `INSERT INTO inventory_items (
          id, name, color, dimension, size, quantity,
          image_url, price, created_at, updated_at
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) ON CONFLICT (id) DO NOTHING`,
        [
          i.id, i.name, i.color, i.dimension, i.size, i.quantity,
          i.image_url, i.price, i.created_at, i.updated_at
        ]
      );
    }
    console.log('✅ Inventory items imported:', data.inventory_items.length);

    // Import notifications
    for (const n of data.notifications) {
      await supabase.query(
        `INSERT INTO notifications (
          id, inventory_item_id, deficit, is_resolved, created_at, updated_at
        ) VALUES ($1,$2,$3,$4,$5,$6) ON CONFLICT (id) DO NOTHING`,
        [n.id, n.inventory_item_id, n.deficit, n.is_resolved, n.created_at, n.updated_at]
      );
    }
    console.log('✅ Notifications imported:', data.notifications.length);

    // Import stock_products
    for (const sp of data.stock_products) {
      await supabase.query(
        `INSERT INTO stock_products (id, name, description, created_at, updated_at)
         VALUES ($1,$2,$3,$4,$5) ON CONFLICT (id) DO NOTHING`,
        [sp.id, sp.name, sp.description, sp.created_at, sp.updated_at]
      );
    }
    console.log('✅ Stock products imported:', data.stock_products.length);

    // Import stock_product_variants
    for (const spv of data.stock_product_variants) {
      await supabase.query(
        `INSERT INTO stock_product_variants (
          id, stock_product_id, name, quantity, created_at, updated_at
        ) VALUES ($1,$2,$3,$4,$5,$6) ON CONFLICT (id) DO NOTHING`,
        [spv.id, spv.stock_product_id, spv.name, spv.quantity, spv.created_at, spv.updated_at]
      );
    }
    console.log('✅ Stock product variants imported:', data.stock_product_variants.length);

    // Fix all sequences
    await supabase.query(`SELECT setval('users_id_seq', COALESCE((SELECT MAX(id) FROM users), 1));`);
    await supabase.query(`SELECT setval('orders_id_seq', COALESCE((SELECT MAX(id) FROM orders), 1));`);
    await supabase.query(`SELECT setval('products_id_seq', COALESCE((SELECT MAX(id) FROM products), 1));`);
    await supabase.query(`SELECT setval('photos_id_seq', COALESCE((SELECT MAX(id) FROM photos), 1));`);
    await supabase.query(`SELECT setval('inventory_items_id_seq', COALESCE((SELECT MAX(id) FROM inventory_items), 1));`);
    await supabase.query(`SELECT setval('notifications_id_seq', COALESCE((SELECT MAX(id) FROM notifications), 1));`);
    await supabase.query(`SELECT setval('company_settings_id_seq', COALESCE((SELECT MAX(id) FROM company_settings), 1));`);
    await supabase.query(`SELECT setval('stock_products_id_seq', COALESCE((SELECT MAX(id) FROM stock_products), 1));`);
    await supabase.query(`SELECT setval('stock_product_variants_id_seq', COALESCE((SELECT MAX(id) FROM stock_product_variants), 1));`);
    console.log('✅ Sequences fixed');

    // Final verification
    const verify = await supabase.query(`
      SELECT
        (SELECT COUNT(*) FROM users) as users,
        (SELECT COUNT(*) FROM orders) as orders,
        (SELECT COUNT(*) FROM products) as products,
        (SELECT COUNT(*) FROM photos) as photos,
        (SELECT COUNT(*) FROM inventory_items) as inventory,
        (SELECT COUNT(*) FROM notifications) as notifications,
        (SELECT COUNT(*) FROM company_settings) as settings,
        (SELECT COUNT(*) FROM stock_products) as stock_products,
        (SELECT COUNT(*) FROM stock_product_variants) as stock_variants
    `);
    console.log('✅ Verification:', verify.rows[0]);

    console.log('🎉 Migration complete! All data imported to Supabase.');
    process.exit(0);
  } catch(e) {
    console.error('❌ Error:', e.message);
    process.exit(1);
  }
};

importData();