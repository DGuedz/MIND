import { pgTable, text, timestamp } from "drizzle-orm/pg-core";

export const executions = pgTable("executions", {
  id: text("id").primaryKey(),
  intentId: text("intent_id").notNull(),
  mode: text("mode").notNull(),
  status: text("status").notNull(),
  txHash: text("tx_hash"),
  receiptHash: text("receipt_hash"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
  executedAt: timestamp("executed_at", { withTimezone: true })
});

export const executionEvents = pgTable("execution_events", {
  id: text("id").primaryKey(),
  executionId: text("execution_id").notNull(),
  eventType: text("event_type").notNull(),
  payloadHash: text("payload_hash").notNull(),
  prevHash: text("prev_hash"),
  eventHash: text("event_hash").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull()
});
