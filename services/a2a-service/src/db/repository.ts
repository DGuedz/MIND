import { and, desc, eq, sql } from "drizzle-orm";
import { createHash, randomUUID } from "node:crypto";
import { db } from "./client.js";
import { a2aBillingEvents, a2aTasks, a2aContextEvents, a2aContexts } from "./schema.js";

const canonicalize = (value: unknown): string => {
  if (value === null || value === undefined) {
    return "null";
  }
  if (Array.isArray(value)) {
    return `[${value.map(canonicalize).join(",")}]`;
  }
  if (typeof value === "object") {
    const obj = value as Record<string, unknown>;
    const keys = Object.keys(obj).sort();
    return `{${keys.map((key) => `${JSON.stringify(key)}:${canonicalize(obj[key])}`).join(",")}}`;
  }
  return JSON.stringify(value);
};

const hashValue = (value: unknown): string => {
  return createHash("sha256").update(canonicalize(value)).digest("hex");
};

const parseNumber = (value: unknown): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

export type A2AContextStatus = "open" | "accepted" | "cancelled" | "expired";
export type A2ATaskStatus = "scanning" | "routing" | "risk_check" | "approval_required" | "approved" | "executing" | "settling" | "completed" | "failed";

export const createContext = async (input: {
  intentId: string;
  initiatorAgentId: string;
  counterpartyAgentId?: string;
  expiresAt: string;
}) => {
  return await db.transaction(async (tx) => {
    const now = new Date();
    const contextId = randomUUID();

    await tx.insert(a2aContexts).values({
      id: contextId,
      intentId: input.intentId,
      initiatorAgentId: input.initiatorAgentId,
      counterpartyAgentId: input.counterpartyAgentId ?? null,
      status: "open",
      acceptedTaskId: null,
      expiresAt: new Date(input.expiresAt),
      createdAt: now,
      updatedAt: now
    });

    const payloadHash = hashValue({
      contextId,
      intentId: input.intentId,
      initiatorAgentId: input.initiatorAgentId,
      counterpartyAgentId: input.counterpartyAgentId ?? null,
      expiresAt: input.expiresAt
    });

    const event = await appendContextEvent(contextId, "a2a.context.created", payloadHash, tx);
    return { contextId, event };
  });
};

export const getContextById = async (contextId: string) => {
  const rows = await db.select().from(a2aContexts).where(eq(a2aContexts.id, contextId)).limit(1);
  return rows[0];
};

export const getTaskById = async (contextId: string, taskId: string) => {
  const rows = await db
    .select()
    .from(a2aTasks)
    .where(and(eq(a2aTasks.id, taskId), eq(a2aTasks.contextId, contextId)))
    .limit(1);
  return rows[0];
};

export const listTasksByContextId = async (contextId: string, limit: number) => {
  return db
    .select()
    .from(a2aTasks)
    .where(eq(a2aTasks.contextId, contextId))
    .orderBy(desc(a2aTasks.version))
    .limit(limit);
};

export const listContextEvents = async (contextId: string, limit: number) => {
  return db
    .select()
    .from(a2aContextEvents)
    .where(eq(a2aContextEvents.contextId, contextId))
    .orderBy(desc(a2aContextEvents.createdAt))
    .limit(limit);
};

export const createTask = async (input: {
  contextId: string;
  executorAgentId: string;
  payload: Record<string, unknown>;
  idempotencyKey?: string;
}) => {
  return await db.transaction(async (tx) => {
    if (input.idempotencyKey) {
      const existing = await tx
        .select()
        .from(a2aTasks)
        .where(and(eq(a2aTasks.contextId, input.contextId), eq(a2aTasks.idempotencyKey, input.idempotencyKey)))
        .limit(1)
        .for("update"); // Lock the row if it exists
      if (existing[0]) {
        return { taskId: existing[0].id, version: existing[0].version, event: null };
      }
    }

    // Lock the context row to prevent race conditions on max version
    await tx.select().from(a2aContexts).where(eq(a2aContexts.id, input.contextId)).for("update");

    const nextVersionRows = await tx
      .select({ maxVersion: sql<number>`coalesce(max(${a2aTasks.version}), 0)` })
      .from(a2aTasks)
      .where(eq(a2aTasks.contextId, input.contextId));

    const nextVersion = (nextVersionRows[0]?.maxVersion ?? 0) + 1;
    const taskId = randomUUID();

    // The unique constraint will block concurrent inserts with the same idempotency key
    await tx.insert(a2aTasks).values({
      id: taskId,
      contextId: input.contextId,
      executorAgentId: input.executorAgentId,
      status: "scanning", // Initial task status
      version: nextVersion,
      idempotencyKey: input.idempotencyKey ?? null,
      payload: input.payload,
      createdAt: new Date()
    });

    const payloadHash = hashValue({
      contextId: input.contextId,
      taskId,
      executorAgentId: input.executorAgentId,
      version: nextVersion,
      payload: input.payload
    });

    const event = await appendContextEvent(input.contextId, "a2a.task.created", payloadHash, tx);

    return { taskId, version: nextVersion, event };
  });
};

export const updateContextStatus = async (input: {
  contextId: string;
  status: A2AContextStatus;
  acceptedTaskId?: string;
  payloadForHash: Record<string, unknown>;
  eventType: string;
  expectedCurrentStatus?: A2AContextStatus;
}) => {
  return await db.transaction(async (tx) => {
    const whereClause = input.expectedCurrentStatus
      ? and(eq(a2aContexts.id, input.contextId), eq(a2aContexts.status, input.expectedCurrentStatus))
      : eq(a2aContexts.id, input.contextId);

    const updatedRows = await tx
      .update(a2aContexts)
      .set({
        status: input.status,
        acceptedTaskId: input.acceptedTaskId ?? null,
        updatedAt: new Date()
      })
      .where(whereClause)
      .returning({ id: a2aContexts.id });

    if (updatedRows.length === 0) {
      throw new Error("stale_context_state");
    }

    const payloadHash = hashValue({
      contextId: input.contextId,
      status: input.status,
      acceptedTaskId: input.acceptedTaskId ?? null,
      ...input.payloadForHash
    });

    const event = await appendContextEvent(input.contextId, input.eventType, payloadHash, tx);
    return event;
  });
};

export const recordBillingEvent = async (input: {
  contextId: string;
  eventType: string;
  units: number;
  metadata: Record<string, unknown>;
  idempotencyKey?: string;
}) => {
  return await db.transaction(async (tx) => {
    if (input.idempotencyKey) {
      const existing = await tx
        .select()
        .from(a2aBillingEvents)
        .where(
          and(eq(a2aBillingEvents.contextId, input.contextId), eq(a2aBillingEvents.idempotencyKey, input.idempotencyKey))
        )
        .limit(1)
        .for("update");
      if (existing[0]) {
        return existing[0];
      }
    }

    const event = {
      id: randomUUID(),
      contextId: input.contextId,
      eventType: input.eventType,
      units: input.units,
      idempotencyKey: input.idempotencyKey ?? null,
      metadata: input.metadata,
      createdAt: new Date()
    };

    await tx.insert(a2aBillingEvents).values(event);
    return event;
  });
};

export const listBillingEventsByContextId = async (contextId: string, limit: number) => {
  return db
    .select()
    .from(a2aBillingEvents)
    .where(eq(a2aBillingEvents.contextId, contextId))
    .orderBy(desc(a2aBillingEvents.createdAt))
    .limit(limit);
};

export const getA2AMetrics = async () => {
  const byStatus = await db
    .select({
      status: a2aContexts.status,
      count: sql<number>`count(*)`
    })
    .from(a2aContexts)
    .groupBy(a2aContexts.status);

  const tasksTotalRows = await db
    .select({ count: sql<number>`count(*)` })
    .from(a2aTasks);

  const billingEventsRows = await db
    .select({ count: sql<number>`count(*)` })
    .from(a2aBillingEvents);

  const p95Rows = await db
    .select({
      p95: sql<number>`coalesce(percentile_cont(0.95) within group (order by extract(epoch from (${a2aContexts.updatedAt} - ${a2aContexts.createdAt})) * 1000), 0)`
    })
    .from(a2aContexts)
    .where(eq(a2aContexts.status, "accepted"));

  const statusMap = new Map<string, number>();
  for (const row of byStatus) {
    statusMap.set(row.status, parseNumber(row.count));
  }

  const contextsTotal = Array.from(statusMap.values()).reduce((sum, count) => sum + count, 0);
  const accepted = statusMap.get("accepted") ?? 0;
  const acceptanceRate = contextsTotal > 0 ? accepted / contextsTotal : 0;

  return {
    contextsTotal,
    contextsByStatus: {
      open: statusMap.get("open") ?? 0,
      accepted,
      cancelled: statusMap.get("cancelled") ?? 0,
      expired: statusMap.get("expired") ?? 0
    },
    tasksTotal: parseNumber(tasksTotalRows[0]?.count),
    billingEventsTotal: parseNumber(billingEventsRows[0]?.count),
    acceptanceRate,
    p95TimeToAcceptMs: parseNumber(p95Rows[0]?.p95)
  };
};

export const appendContextEvent = async (contextId: string, eventType: string, payloadHash: string, tx: any = db) => {
  const previous = await tx
    .select()
    .from(a2aContextEvents)
    .where(eq(a2aContextEvents.contextId, contextId))
    .orderBy(desc(a2aContextEvents.createdAt))
    .limit(1);

  const prevHash = previous[0]?.eventHash ?? null;
  const createdAt = new Date();
  const eventHash = hashValue({
    contextId,
    eventType,
    payloadHash,
    prevHash,
    createdAt: createdAt.toISOString()
  });

  const event = {
    id: randomUUID(),
    contextId,
    eventType,
    payloadHash,
    prevHash,
    eventHash,
    createdAt
  };

  await tx.insert(a2aContextEvents).values(event);
  return event;
};
