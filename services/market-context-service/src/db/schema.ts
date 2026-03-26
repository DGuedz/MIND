import { pgTable, text, timestamp, numeric } from "drizzle-orm/pg-core";

export const marketContexts = pgTable("market_contexts", {
  id: text("id").primaryKey(),
  source: text("source").notNull(),
  snapshotHash: text("snapshot_hash").notNull(),
  score: numeric("score").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull()
});
