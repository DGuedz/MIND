const { Pool } = require('pg');
const fs = require('fs');
require('dotenv').config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const migrations = [
  'sqls/002_ecosystem_signals.sql'
];

async function run() {
  for (const file of migrations) {
    console.log(`Applying ${file}...`);
    const sql = fs.readFileSync(file, 'utf8');
    await pool.query(sql);
  }
}

run().then(() => {
  console.log('Migrations applied');
  process.exit(0);
}).catch(err => {
  console.error(err instanceof Error ? err.message : String(err));
  process.exit(1);
});
