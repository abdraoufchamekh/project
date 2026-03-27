const pool = require('./backend/src/config/database');

async function createTable() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS notifications (
        id SERIAL PRIMARY KEY,
        inventory_item_id INT REFERENCES inventory_items(id) ON DELETE CASCADE,
        deficit INT NOT NULL,
        is_resolved BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);
    
    // Add unique constraint so one item has at most one unresolved notification
    await pool.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS unq_inventory_item_unresolved 
      ON notifications (inventory_item_id) 
      WHERE is_resolved = FALSE;
    `);

    console.log('Notifications table created');
  } catch (error) {
    console.error('Error creating table:', error);
  } finally {
    pool.end();
  }
}

createTable();
