import { desc, eq } from "drizzle-orm";
import { db } from "./client.js";
import { marketContexts } from "./schema.js";

export const listMarketContexts = async (limit: number) => {
  return db.select().from(marketContexts).orderBy(desc(marketContexts.createdAt)).limit(limit);
};

export const getMarketContextById = async (id: string) => {
  const rows = await db.select().from(marketContexts).where(eq(marketContexts.id, id)).limit(1);
  return rows[0];
};
