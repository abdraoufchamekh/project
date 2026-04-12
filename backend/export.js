require('dotenv').config();
const pool = require('./src/config/database');
const fs = require('fs');

const migrate = async () => {
    try {
        const tables = await pool.query(
            "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name"
        );

        console.log('Tables found:');
        tables.rows.forEach(r => console.log(' -', r.table_name));

        const data = {};
        for (const row of tables.rows) {
            const result = await pool.query('SELECT * FROM ' + row.table_name + ' ORDER BY id');
            data[row.table_name] = result.rows;
            console.log(row.table_name + ':', result.rows.length, 'rows');
        }

        fs.writeFileSync('backup_data.json', JSON.stringify(data, null, 2));
        console.log('✅ Backup saved to backup_data.json');
        process.exit(0);
    } catch (e) {
        console.error('❌ Error:', e.message);
        process.exit(1);
    }
};

migrate();