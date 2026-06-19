const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
 connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

pool.connect((err) => {
  if (err) {
    console.error( err);
  } else {
    console.log('Connected to Supabase database successfully!');
  }
});

pool.connect((err) => {
  if (err) {
    console.error( err);
  } else {
    console.log('Connected to Supabase database successfully!');
  }
});

module.exports = pool;