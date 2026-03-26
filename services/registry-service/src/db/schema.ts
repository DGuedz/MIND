import { pgTable, text, timestamp } from "drizzle-orm/pg-core";

export const agents = pgTable("agents", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  role: text("role").notNull(),
  wallet: text("wallet").notNull(),
  status: text("status").notNull(),
  policyId: text("policy_id"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull()
});

export const agentCapabilities = pgTable("agent_capabilities", {
  agentId: text("agent_id").notNull(),
  capability: text("capability").notNull()
});
