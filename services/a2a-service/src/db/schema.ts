import { integer, jsonb, pgTable, text, timestamp, unique } from "drizzle-orm/pg-core";

export const a2aContexts = pgTable("a2a_contexts", {
  id: text("id").primaryKey(),
  intentId: text("intent_id").notNull(),
  initiatorAgentId: text("initiator_agent_id").notNull(),
  counterpartyAgentId: text("counterparty_agent_id"),
  status: text("status").notNull(),
  acceptedTaskId: text("accepted_task_id"),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull()
});

export const a2aTasks = pgTable("a2a_tasks", {
  id: text("id").primaryKey(),
  contextId: text("context_id").notNull(),
  executorAgentId: text("executor_agent_id").notNull(),
  status: text("status").notNull(), // scanning, routing, risk_check, approval_required, approved, executing, settling, completed, failed
  version: integer("version").notNull(),
  idempotencyKey: text("idempotency_key"),
  payload: jsonb("payload").$type<Record<string, unknown>>().notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull()
}, (table) => ({
  idempotencyIdx: unique("a2a_tasks_idempotency_idx").on(table.contextId, table.idempotencyKey)
}));

export const a2aContextEvents = pgTable("a2a_context_events", {
  id: text("id").primaryKey(),
  contextId: text("context_id").notNull(),
  eventType: text("event_type").notNull(),
  payloadHash: text("payload_hash").notNull(),
  prevHash: text("prev_hash"),
  eventHash: text("event_hash").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull()
});

export const a2aBillingEvents = pgTable("a2a_billing_events", {
  id: text("id").primaryKey(),
  contextId: text("context_id").notNull(),
  eventType: text("event_type").notNull(),
  units: integer("units").notNull(),
  idempotencyKey: text("idempotency_key"),
  metadata: jsonb("metadata").$type<Record<string, unknown>>().notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull()
}, (table) => ({
  idempotencyIdx: unique("a2a_billing_idempotency_idx").on(table.contextId, table.idempotencyKey)
}));

