import { and, desc, eq, sql } from "drizzle-orm";
import { createHash, randomUUID } from "node:crypto";
import { db } from "./client.js";
import { a2aBillingEvents, a2aProposals, a2aSessionEvents, a2aSessions } from "./schema.js";

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

export type A2ASessionStatus = "open" | "accepted" | "cancelled" | "expired";

export const createSession = async (input: {
  intentId: string;
  initiatorAgentId: string;
  counterpartyAgentId?: string;
  expiresAt: string;
}) => {
  const now = new Date();
  const sessionId = randomUUID();

  await db.insert(a2aSessions).values({
    id: sessionId,
    intentId: input.intentId,
    initiatorAgentId: input.initiatorAgentId,
    counterpartyAgentId: input.counterpartyAgentId ?? null,
    status: "open",
    acceptedProposalId: null,
    expiresAt: new Date(input.expiresAt),
    createdAt: now,
    updatedAt: now
  });

  const payloadHash = hashValue({
    sessionId,
    intentId: input.intentId,
    initiatorAgentId: input.initiatorAgentId,
    counterpartyAgentId: input.counterpartyAgentId ?? null,
    expiresAt: input.expiresAt
  });

  const event = await appendSessionEvent(sessionId, "a2a.session.created", payloadHash);
  return { sessionId, event };
};

export const getSessionById = async (sessionId: string) => {
  const rows = await db.select().from(a2aSessions).where(eq(a2aSessions.id, sessionId)).limit(1);
  return rows[0];
};

export const getProposalById = async (sessionId: string, proposalId: string) => {
  const rows = await db
    .select()
    .from(a2aProposals)
    .where(and(eq(a2aProposals.id, proposalId), eq(a2aProposals.sessionId, sessionId)))
    .limit(1);
  return rows[0];
};

export const listProposalsBySessionId = async (sessionId: string, limit: number) => {
  return db
    .select()
    .from(a2aProposals)
    .where(eq(a2aProposals.sessionId, sessionId))
    .orderBy(desc(a2aProposals.version))
    .limit(limit);
};

export const listSessionEvents = async (sessionId: string, limit: number) => {
  return db
    .select()
    .from(a2aSessionEvents)
    .where(eq(a2aSessionEvents.sessionId, sessionId))
    .orderBy(desc(a2aSessionEvents.createdAt))
    .limit(limit);
};

export const createProposal = async (input: {
  sessionId: string;
  proposerAgentId: string;
  payload: Record<string, unknown>;
  idempotencyKey?: string;
}) => {
  if (input.idempotencyKey) {
    const existing = await db
      .select()
      .from(a2aProposals)
      .where(and(eq(a2aProposals.sessionId, input.sessionId), eq(a2aProposals.idempotencyKey, input.idempotencyKey)))
      .limit(1);
    if (existing[0]) {
      return { proposalId: existing[0].id, version: existing[0].version, event: null };
    }
  }

  const nextVersionRows = await db
    .select({ maxVersion: sql<number>`coalesce(max(${a2aProposals.version}), 0)` })
    .from(a2aProposals)
    .where(eq(a2aProposals.sessionId, input.sessionId));

  const nextVersion = (nextVersionRows[0]?.maxVersion ?? 0) + 1;
  const proposalId = randomUUID();

  await db.insert(a2aProposals).values({
    id: proposalId,
    sessionId: input.sessionId,
    proposerAgentId: input.proposerAgentId,
    version: nextVersion,
    idempotencyKey: input.idempotencyKey ?? null,
    payload: input.payload,
    createdAt: new Date()
  });

  const payloadHash = hashValue({
    sessionId: input.sessionId,
    proposalId,
    proposerAgentId: input.proposerAgentId,
    version: nextVersion,
    payload: input.payload
  });

  const event = await appendSessionEvent(input.sessionId, "a2a.proposal.created", payloadHash);

  return { proposalId, version: nextVersion, event };
};

export const updateSessionStatus = async (input: {
  sessionId: string;
  status: A2ASessionStatus;
  acceptedProposalId?: string;
  payloadForHash: Record<string, unknown>;
  eventType: string;
  expectedCurrentStatus?: A2ASessionStatus;
}) => {
  const whereClause = input.expectedCurrentStatus
    ? and(eq(a2aSessions.id, input.sessionId), eq(a2aSessions.status, input.expectedCurrentStatus))
    : eq(a2aSessions.id, input.sessionId);

  const updatedRows = await db
    .update(a2aSessions)
    .set({
      status: input.status,
      acceptedProposalId: input.acceptedProposalId ?? null,
      updatedAt: new Date()
    })
    .where(whereClause)
    .returning({ id: a2aSessions.id });

  if (updatedRows.length === 0) {
    throw new Error("stale_session_state");
  }

  const payloadHash = hashValue({
    sessionId: input.sessionId,
    status: input.status,
    acceptedProposalId: input.acceptedProposalId ?? null,
    ...input.payloadForHash
  });

  const event = await appendSessionEvent(input.sessionId, input.eventType, payloadHash);
  return event;
};

export const recordBillingEvent = async (input: {
  sessionId: string;
  eventType: string;
  units: number;
  metadata: Record<string, unknown>;
  idempotencyKey?: string;
}) => {
  if (input.idempotencyKey) {
    const existing = await db
      .select()
      .from(a2aBillingEvents)
      .where(
        and(eq(a2aBillingEvents.sessionId, input.sessionId), eq(a2aBillingEvents.idempotencyKey, input.idempotencyKey))
      )
      .limit(1);
    if (existing[0]) {
      return existing[0];
    }
  }

  const event = {
    id: randomUUID(),
    sessionId: input.sessionId,
    eventType: input.eventType,
    units: input.units,
    idempotencyKey: input.idempotencyKey ?? null,
    metadata: input.metadata,
    createdAt: new Date()
  };

  await db.insert(a2aBillingEvents).values(event);
  return event;
};

export const listBillingEventsBySessionId = async (sessionId: string, limit: number) => {
  return db
    .select()
    .from(a2aBillingEvents)
    .where(eq(a2aBillingEvents.sessionId, sessionId))
    .orderBy(desc(a2aBillingEvents.createdAt))
    .limit(limit);
};

export const getA2AMetrics = async () => {
  const byStatus = await db
    .select({
      status: a2aSessions.status,
      count: sql<number>`count(*)`
    })
    .from(a2aSessions)
    .groupBy(a2aSessions.status);

  const proposalsTotalRows = await db
    .select({ count: sql<number>`count(*)` })
    .from(a2aProposals);

  const billingEventsRows = await db
    .select({ count: sql<number>`count(*)` })
    .from(a2aBillingEvents);

  const p95Rows = await db
    .select({
      p95: sql<number>`coalesce(percentile_cont(0.95) within group (order by extract(epoch from (${a2aSessions.updatedAt} - ${a2aSessions.createdAt})) * 1000), 0)`
    })
    .from(a2aSessions)
    .where(eq(a2aSessions.status, "accepted"));

  const statusMap = new Map<string, number>();
  for (const row of byStatus) {
    statusMap.set(row.status, parseNumber(row.count));
  }

  const sessionsTotal = Array.from(statusMap.values()).reduce((sum, count) => sum + count, 0);
  const accepted = statusMap.get("accepted") ?? 0;
  const acceptanceRate = sessionsTotal > 0 ? accepted / sessionsTotal : 0;

  return {
    sessionsTotal,
    sessionsByStatus: {
      open: statusMap.get("open") ?? 0,
      accepted,
      cancelled: statusMap.get("cancelled") ?? 0,
      expired: statusMap.get("expired") ?? 0
    },
    proposalsTotal: parseNumber(proposalsTotalRows[0]?.count),
    billingEventsTotal: parseNumber(billingEventsRows[0]?.count),
    acceptanceRate,
    p95TimeToAcceptMs: parseNumber(p95Rows[0]?.p95)
  };
};

export const appendSessionEvent = async (sessionId: string, eventType: string, payloadHash: string) => {
  const previous = await db
    .select()
    .from(a2aSessionEvents)
    .where(eq(a2aSessionEvents.sessionId, sessionId))
    .orderBy(desc(a2aSessionEvents.createdAt))
    .limit(1);

  const prevHash = previous[0]?.eventHash ?? null;
  const createdAt = new Date();
  const eventHash = hashValue({
    sessionId,
    eventType,
    payloadHash,
    prevHash,
    createdAt: createdAt.toISOString()
  });

  const event = {
    id: randomUUID(),
    sessionId,
    eventType,
    payloadHash,
    prevHash,
    eventHash,
    createdAt
  };

  await db.insert(a2aSessionEvents).values(event);
  return event;
};
