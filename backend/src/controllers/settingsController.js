const pool = require('../config/database');

// Get company settings
exports.getSettings = async (req, res) => {
    try {
        const result = await pool.query('SELECT key, value FROM company_settings');
        // Convert array of rows into a single object
        const settings = {};
        result.rows.forEach(row => {
            settings[row.key] = row.value;
        });
        res.json(settings);
    } catch (err) {
        console.error('Error fetching settings:', err);
        res.status(500).send('Server Error');
    }
};

// Update company settings
exports.updateSettings = async (req, res) => {
    try {
        const updates = req.body;
        
        // Ensure user is admin (optional extra layer, though middleware should handle this)
        if (req.user.role !== 'admin') {
            return res.status(403).json({ msg: 'Not authorized' });
        }

        const keys = Object.keys(updates);
        if (keys.length === 0) return res.json({ msg: 'No updates provided' });

        // Update each setting
        for (const key of keys) {
            await pool.query(
                `INSERT INTO company_settings (key, value) 
                 VALUES ($1, $2) 
                 ON CONFLICT (key) DO UPDATE SET value = $2, updated_at = NOW()`,
                [key, updates[key]]
            );
        }

        // Fetch and return the updated settings
        const result = await pool.query('SELECT key, value FROM company_settings');
        const settings = {};
        result.rows.forEach(row => {
            settings[row.key] = row.value;
        });

        res.json(settings);
    } catch (err) {
        console.error('Error updating settings:', err);
        res.status(500).send('Server Error');
    }
};
