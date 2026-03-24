const pool = require('./src/config/database');

const runIndexes = async () => {
  try {
    console.log('Adding pg_trgm extension and indexes...');
    
    // Enable pg_trgm for fast text search
    await pool.query('CREATE EXTENSION IF NOT EXISTS pg_trgm;');
    
    // B-tree index on source
    await pool.query('CREATE INDEX IF NOT EXISTS idx_orders_source ON orders (source);');
    
    // GIN indexes for text search (client_name, phone, first_name, last_name)
    // ILIKE uses gin_trgm_ops
    await pool.query('CREATE INDEX IF NOT EXISTS idx_orders_client_name_trgm ON orders USING gin (client_name gin_trgm_ops);');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_orders_phone_trgm ON orders USING gin (phone gin_trgm_ops);');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_orders_first_name_trgm ON orders USING gin (first_name gin_trgm_ops);');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_orders_last_name_trgm ON orders USING gin (last_name gin_trgm_ops);');

    console.log('✅ All indexes applied successfully!');
  } catch (error) {
    console.error('❌ Error adding indexes:', error.message);
  } finally {
    process.exit(0);
  }
};

runIndexes();
