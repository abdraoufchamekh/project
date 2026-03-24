const pool = require('./src/config/database');
const fs = require('fs');

(async () => {
  try {
    let sql = fs.readFileSync('settings_schema.sql', 'utf8');
    
    // Check if function exists, if not, create it
    const createFuncSql = `
    CREATE OR REPLACE FUNCTION update_updated_at_column()
    RETURNS TRIGGER AS $$
    BEGIN
        NEW.updated_at = CURRENT_TIMESTAMP;
        RETURN NEW;
    END;
    $$ language 'plpgsql';
    `;
    
    await pool.query(createFuncSql);
    console.log('Function created or exists.');
    
    await pool.query(sql);
    console.log('Schema executed successfully.');
    
    process.exit(0);
  } catch (err) {
    console.error('Failed to execute schema:', err.message);
    process.exit(1);
  }
})();
