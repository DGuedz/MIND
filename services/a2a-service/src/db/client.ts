import * as dotenv from "dotenv";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: resolve(__dirname, "../../../../.env") });

import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl && process.env.NODE_ENV === "production") {
  console.error("CRITICAL: DATABASE_URL is missing in production environment.");
}

const pool = new Pool({
  connectionString: databaseUrl,
  ssl: process.env.DATABASE_URL?.includes("supabase.co") || process.env.NODE_ENV === "production" 
    ? { rejectUnauthorized: false } 
    : false
});

export const db = drizzle(pool);

export const checkDb = async () => {
  await pool.query("select 1");
  return true;
};
