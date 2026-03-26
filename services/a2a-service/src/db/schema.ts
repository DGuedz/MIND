import { integer, jsonb, pgTable, text, timestamp } from "drizzle-orm/pg-core";

export const a2aSessions = pgTable("a2a_sessions", {
  id: text("id").primaryKey(),
  intentId: text("intent_id").notNull(),
  initiatorAgentId: text("initiator_agent_id").notNull(),
  counterpartyAgentId: text("counterparty_agent_id"),
  status: text("status").notNull(),
  acceptedProposalId: text("accepted_proposal_id"),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull()
});

export const a2aProposals = pgTable("a2a_proposals", {
  id: text("id").primaryKey(),
  sessionId: text("session_id").notNull(),
  proposerAgentId: text("proposer_agent_id").notNull(),
  version: integer("version").notNull(),
  idempotencyKey: text("idempotency_key"),
  payload: jsonb("payload").$type<Record<string, unknown>>().notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull()
});

export const a2aSessionEvents = pgTable("a2a_session_events", {
  id: text("id").primaryKey(),
  sessionId: text("session_id").notNull(),
  eventType: text("event_type").notNull(),
  payloadHash: text("payload_hash").notNull(),
  prevHash: text("prev_hash"),
  eventHash: text("event_hash").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull()
});

export const a2aBillingEvents = pgTable("a2a_billing_events", {
  id: text("id").primaryKey(),
  sessionId: text("session_id").notNull(),
  eventType: text("event_type").notNull(),
  units: integer("units").notNull(),
  idempotencyKey: text("idempotency_key"),
  metadata: jsonb("metadata").$type<Record<string, unknown>>().notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull()
});
