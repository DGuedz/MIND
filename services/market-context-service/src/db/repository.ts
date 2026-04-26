import { desc, eq } from "drizzle-orm";
import { db } from "./client.js";
import { marketContexts, ecosystemSignals } from "./schema.js";

export const listMarketContexts = async (limit: number) => {
  return db.select().from(marketContexts).orderBy(desc(marketContexts.createdAt)).limit(limit);
};

export const getMarketContextById = async (id: string) => {
  const rows = await db.select().from(marketContexts).where(eq(marketContexts.id, id)).limit(1);
  return rows[0];
};

export const listEcosystemSignals = async (limit: number) => {
  return db.select().from(ecosystemSignals).orderBy(desc(ecosystemSignals.timestamp)).limit(limit);
};

export const upsertEcosystemSignal = async (signal: any) => {
  return db.insert(ecosystemSignals).values({
    ...signal,
    confidenceScore: signal.confidenceScore.toString(),
  }).onConflictDoUpdate({
    target: ecosystemSignals.contentHash,
    set: {
      lastSeenAt: signal.lastSeenAt,
      metadata: signal.metadata,
      evidence: signal.evidence
    }
  }).returning();
};
