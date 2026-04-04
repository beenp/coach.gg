// backend/db.js
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Force a test query to check the connection on startup
pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('Database connection failed! Error:', err.message);
  } else {
    console.log('Connected to the Supabase database successfully!');
  }
});

module.exports = {
  query: (text, params) => pool.query(text, params),
};