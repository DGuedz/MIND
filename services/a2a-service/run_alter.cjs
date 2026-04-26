const { Pool } = require('pg');
require('dotenv').config({ path: '../../.env' });
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
pool.query(`
ALTER TABLE approvals ADD COLUMN IF NOT EXISTS context_id text;
ALTER TABLE approvals ADD COLUMN IF NOT EXISTS task_id text;
`).then(() => { console.log('Altered'); process.exit(0); }).catch(e => { console.error(e); process.exit(1); });
