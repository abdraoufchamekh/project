const pool = require('../src/config/database');

const resetDB = async () => {
  try {
    console.log('⚠️ INITIATING CORRUPTED DATA WIPE...');

    const query = `
      TRUNCATE TABLE orders, products, photos, inventory_items RESTART IDENTITY CASCADE;
    `;
    
    await pool.query(query);

    console.log('✅ WIPE SUCCESSFUL. All orders, products, photos, and stock were deleted.');
    console.log('🔄 All ID sequences have been reset to 1.');

  } catch (error) {
    console.error('❌ ERREUR LORS DU TRUNCATE:', error.message);
  } finally {
    process.exit(0);
  }
};

resetDB();
