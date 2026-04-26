import { pgTable, text, timestamp } from "drizzle-orm/pg-core";

export const approvals = pgTable("approvals", {
  id: text("id").primaryKey(),
  intentId: text("intent_id").notNull(),
  contextId: text("context_id"),
  taskId: text("task_id"),
  channel: text("channel").notNull(),
  requesterId: text("requester_id").notNull(),
  decision: text("decision"),
  decidedAt: timestamp("decided_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull()
});

export const credentials = pgTable("credentials", {
  id: text("id").primaryKey(),
  agentId: text("agent_id").notNull(),
  nftMint: text("nft_mint").notNull(),
  tier: text("tier").notNull(), // MICRO, PRO, INSTITUTIONAL
  status: text("status").notNull().default("ACTIVE"),
  expiresAt: timestamp("expires_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull()
});

export const approvalEvents = pgTable("approval_events", {
  id: text("id").primaryKey(),
  approvalId: text("approval_id").notNull(),
  eventType: text("event_type").notNull(),
  payloadHash: text("payload_hash").notNull(),
  prevHash: text("prev_hash"),
  eventHash: text("event_hash").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull()
});
