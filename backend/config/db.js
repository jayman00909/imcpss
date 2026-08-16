const { Pool } = require('pg');

// Managed Postgres providers (Supabase, Railway, Render, Heroku) require TLS but
// present certificates that are not in Node's default trust store, hence
// rejectUnauthorized: false. Local Postgres normally has TLS disabled.
//
// Defaults to on in production; DATABASE_SSL=true/false overrides it explicitly
// so a local production-mode run or a self-hosted DB can opt out.
const sslSetting = process.env.DATABASE_SSL;
const useSsl = sslSetting !== undefined
  ? ['true', '1', 'yes'].includes(String(sslSetting).toLowerCase())
  : process.env.NODE_ENV === 'production';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: useSsl ? { rejectUnauthorized: false } : false,
});

pool.on('error', (err) => {
  console.error('Unexpected database pool error:', err.message);
});

module.exports = pool;
