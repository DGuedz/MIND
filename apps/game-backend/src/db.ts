import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

// Ensure data directory exists
const dataDir = path.join(process.cwd(), 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const db = new Database(path.join(dataDir, 'game.db'));

// Initialize schema
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    telegram_id TEXT PRIMARY KEY,
    username TEXT,
    xp INTEGER DEFAULT 0,
    mevs_destroyed INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_played_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

export interface UserRow {
  telegram_id: string;
  username: string | null;
  xp: number;
  mevs_destroyed: number;
  created_at: string;
  last_played_at: string;
}

export const getUser = (telegramId: string): UserRow | undefined => {
  return db.prepare('SELECT * FROM users WHERE telegram_id = ?').get(telegramId) as UserRow | undefined;
};

export const createUser = (telegramId: string, username: string | null): UserRow => {
  db.prepare('INSERT INTO users (telegram_id, username) VALUES (?, ?)').run(telegramId, username);
  return getUser(telegramId)!;
};

export const addXP = (telegramId: string, xpToAdd: number, mevsDestroyed: number) => {
  db.prepare(`
    UPDATE users 
    SET xp = xp + ?, 
        mevs_destroyed = mevs_destroyed + ?, 
        last_played_at = CURRENT_TIMESTAMP 
    WHERE telegram_id = ?
  `).run(xpToAdd, mevsDestroyed, telegramId);
};

export const getLeaderboard = (limit: number = 10): UserRow[] => {
  return db.prepare('SELECT * FROM users ORDER BY xp DESC LIMIT ?').all(limit) as UserRow[];
};
