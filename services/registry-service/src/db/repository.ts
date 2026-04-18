import { desc, eq } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import { db } from "./client.js";
import { agentCapabilities, agents } from "./schema.js";

export const createAgent = async (input: {
  name: string;
  role: string;
  wallet: string;
  capabilities: string[];
  status: string;
  policyId?: string;
}) => {
  const id = randomUUID();
  const now = new Date();

  await db.insert(agents).values({
    id,
    name: input.name,
    role: input.role,
    wallet: input.wallet,
    status: input.status,
    policyId: input.policyId ?? null,
    createdAt: now
  });

  if (input.capabilities.length) {
    await db.insert(agentCapabilities).values(
      input.capabilities.map((capability) => ({
        agentId: id,
        capability
      }))
    );
  }

  return { id };
};

export const getAgentById = async (agentId: string) => {
  const rows = await db.select().from(agents).where(eq(agents.id, agentId)).limit(1);
  return rows[0];
};

export const listAgents = async (limit: number) => {
  return db.select().from(agents).orderBy(desc(agents.createdAt)).limit(limit);
};
