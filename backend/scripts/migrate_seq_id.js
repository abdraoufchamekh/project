const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const pool = require('../src/config/database');

const migrate = async () => {
  const client = await pool.connect();
  try {
    console.log('🔄 Starting seq_id migration...');
    await client.query('BEGIN');

    // 1. Add seq_id column if it doesn't exist
    await client.query(`
      ALTER TABLE orders 
      ADD COLUMN IF NOT EXISTS seq_id INT
    `);
    console.log('✅ Column seq_id added (or already exists)');

    // 2. Fetch all orders to populate sequential IDs
    const { rows: orders } = await client.query(`
      SELECT id, source FROM orders ORDER BY id ASC
    `);
    console.log(`📋 Found ${orders.length} orders to process`);

    let adminCount = 0;
    let atelierCount = 0;

    for (const order of orders) {
      const source = order.source || 'admin';
      let seqId;
      if (source === 'atelier') {
        atelierCount++;
        seqId = atelierCount;
      } else {
        adminCount++;
        seqId = adminCount;
      }

      await client.query(`
        UPDATE orders 
        SET seq_id = $1, source = $2
        WHERE id = $3
      `, [seqId, source, order.id]);
    }

    console.log(`✨ Migrated existing orders. Total admin/online: ${adminCount}, total atelier: ${atelierCount}`);

    // 3. Create unique index to guarantee uniqueness of (source, seq_id)
    await client.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS idx_orders_source_seq_id 
      ON orders (source, seq_id)
    `);
    console.log('✅ Unique index idx_orders_source_seq_id created');

    await client.query('COMMIT');
    console.log('🎉 Migration completed successfully!');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Migration failed:', error);
  } finally {
    client.release();
    process.exit(0);
  }
};

migrate();
