import { pgTable, text, timestamp, numeric, jsonb } from "drizzle-orm/pg-core";

export const marketContexts = pgTable("market_contexts", {
  id: text("id").primaryKey(),
  source: text("source").notNull(),
  snapshotHash: text("snapshot_hash").notNull(),
  score: numeric("score").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull()
});

export const ecosystemSignals = pgTable("ecosystem_signals", {
  id: text("id").primaryKey(),
  protocolName: text("protocol_name").notNull(),
  sourceUrl: text("source_url").notNull(),
  sourceType: text("source_type").notNull(),
  publishedAt: timestamp("published_at", { withTimezone: true }),
  headline: text("headline").notNull(),
  summary: text("summary").notNull(),
  claimType: text("claim_type").notNull(),
  classificationLayer: text("classification_layer").notNull(),
  confidenceScore: numeric("confidence_score").notNull(),
  contentHash: text("content_hash").notNull().unique(),
  timestamp: timestamp("timestamp", { withTimezone: true }).notNull(),
  lastSeenAt: timestamp("last_seen_at", { withTimezone: true }).notNull(),
  firstSeenAt: timestamp("first_seen_at", { withTimezone: true }).notNull(),
  evidence: jsonb("evidence").default([]),
  metadata: jsonb("metadata").default({})
});
