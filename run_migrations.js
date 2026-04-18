const { Pool } = require('pg');
const fs = require('fs');
require('dotenv').config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const sql = fs.readFileSync('scripts/migrations/001_init.sql', 'utf8');

pool.query(sql).then(() => {
  console.log('Migrations applied');
  process.exit(0);
}).catch(err => {
  console.error(err);
  process.exit(1);
});
