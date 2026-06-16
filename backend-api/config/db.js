const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  user: process.env.POSTGRES_USER,
  host: process.env.POSTGRES_HOST,
  database: process.env.POSTGRES_DB,
  password: process.env.POSTGRES_PASSWORD,
  port: process.env.POSTGRES_PORT,
  max: 20, 
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

pool.on('connect', () => {
  console.log('🗄️  [PostgreSQL] Connection pool established.');
});

pool.on('error', (err) => {
  console.error('❌ [PostgreSQL] Unexpected error on idle client', err);
  process.exit(-1);
});

module.exports = {
  pool, // <-- Add this line right here
  query: (text, params) => pool.query(text, params),
};