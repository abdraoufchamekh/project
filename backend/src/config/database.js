const { Pool } = require('pg');
require('dotenv').config();

// Support both local split env vars and Render-style DATABASE_URL.
const useConnectionString = !!process.env.DATABASE_URL;
const isProduction = process.env.NODE_ENV === 'production';

const pool = new Pool(
  useConnectionString
    ? {
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false }, // Required for Supabase
      max: parseInt(process.env.PG_POOL_MAX || '20', 10),
      idleTimeoutMillis: 30_000,
      connectionTimeoutMillis: 10_000
    }
    : {
      host: process.env.DB_HOST || '127.0.0.1',
      port: process.env.DB_PORT || 5432,
      database: process.env.DB_NAME,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      max: parseInt(process.env.PG_POOL_MAX || '20', 10),
      idleTimeoutMillis: 30_000,
      connectionTimeoutMillis: 10_000
    }
);

pool.on('connect', () => {
  console.log('✅ Connected to PostgreSQL database');
});

pool.on('error', (err) => {
  console.error('❌ Unexpected error on idle client', err);
  process.exit(-1);
});

module.exports = pool;