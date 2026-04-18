import { pgTable, text, timestamp, numeric } from "drizzle-orm/pg-core";

export const intents = pgTable("intents", {
  id: text("id").primaryKey(),
  creatorAgentId: text("creator_agent_id").notNull(),
  targetAgentId: text("target_agent_id"),
  asset: text("asset").notNull(),
  action: text("action").notNull(),
  amount: text("amount").notNull(),
  confidence: numeric("confidence").notNull(),
  riskScore: numeric("risk_score").notNull(),
  expiryTs: timestamp("expiry_ts", { withTimezone: true }).notNull(),
  policyId: text("policy_id").notNull(),
  policyHash: text("policy_hash"),
  marketContextId: text("market_context_id"),
  status: text("status").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull()
});

export const intentEvents = pgTable("intent_events", {
  id: text("id").primaryKey(),
  intentId: text("intent_id").notNull(),
  eventType: text("event_type").notNull(),
  payloadHash: text("payload_hash").notNull(),
  prevHash: text("prev_hash"),
  eventHash: text("event_hash").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull()
});
