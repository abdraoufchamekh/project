const { Pool } = require('pg');
require('dotenv').config();

// Support both local split env vars and Render-style DATABASE_URL.
const useConnectionString = !!process.env.DATABASE_URL;
const isProduction = process.env.NODE_ENV === 'production';

require('dns').setDefaultResultOrder('ipv4first'); // Fix for ENOTFOUND errors with Supabase pooler

const pool = new Pool(
  useConnectionString
    ? {
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false }, // Required for Supabase
      max: parseInt(process.env.PG_POOL_MAX || '15', 10),
      idleTimeoutMillis: 10_000, // Reduced from 30_000 to prevent 'Connection terminated unexpectedly'
      connectionTimeoutMillis: 15_000,
      keepAlive: true,
      allowExitOnIdle: true
    }
    : {
      host: process.env.DB_HOST || '127.0.0.1',
      port: process.env.DB_PORT || 5432,
      database: process.env.DB_NAME,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      max: parseInt(process.env.PG_POOL_MAX || '15', 10),
      idleTimeoutMillis: 10_000,
      connectionTimeoutMillis: 15_000,
      keepAlive: true,
      allowExitOnIdle: true
    }
);

pool.on('connect', () => {
  console.log('✅ Connected to PostgreSQL database');
});

pool.on('error', (err) => {
  console.error('❌ Unexpected error on idle client', err);
  // process.exit(-1); // Removed to prevent crashing the server when pooler drops connection
});

module.exports = pool;