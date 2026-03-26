import { pgTable, text, timestamp } from "drizzle-orm/pg-core";

export const proofs = pgTable("proofs", {
  id: text("id").primaryKey(),
  intentId: text("intent_id").notNull(),
  approvalId: text("approval_id"),
  executionId: text("execution_id"),
  proofHash: text("proof_hash").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull()
});

export const proofAnchors = pgTable("proof_anchors", {
  proofId: text("proof_id").notNull(),
  type: text("type").notNull(),
  hash: text("hash").notNull()
});

export const proofEvents = pgTable("proof_events", {
  id: text("id").primaryKey(),
  proofId: text("proof_id").notNull(),
  eventType: text("event_type").notNull(),
  payloadHash: text("payload_hash").notNull(),
  prevHash: text("prev_hash"),
  eventHash: text("event_hash").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull()
});
