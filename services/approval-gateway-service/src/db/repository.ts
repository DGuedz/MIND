import { eq, desc } from "drizzle-orm";
import { randomUUID, createHash } from "node:crypto";
import { db } from "./client.js";
import { approvalEvents, approvals } from "./schema.js";

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

export const createApproval = async (input: {
  intentId: string;
  contextId?: string;
  taskId?: string;
  channel: string;
  requesterId: string;
}) => {
  const now = new Date();
  const approvalId = randomUUID();

  const record = {
    id: approvalId,
    intentId: input.intentId,
    contextId: input.contextId,
    taskId: input.taskId,
    channel: input.channel,
    requesterId: input.requesterId,
    decision: null,
    decidedAt: null,
    createdAt: now
  };

  await db.insert(approvals).values(record);

  const payloadHash = hashValue({
    approvalId,
    intentId: input.intentId,
    channel: input.channel,
    requesterId: input.requesterId
  });

  const event = await appendApprovalEvent(approvalId, "approval.requested", payloadHash);

  return { approvalId, event };
};

export const getApprovalById = async (approvalId: string) => {
  const rows = await db.select().from(approvals).where(eq(approvals.id, approvalId)).limit(1);
  return rows[0];
};

export const listApprovalsByIntentId = async (intentId: string, limit: number) => {
  return db
    .select()
    .from(approvals)
    .where(eq(approvals.intentId, intentId))
    .orderBy(desc(approvals.createdAt))
    .limit(limit);
};

export const recordDecision = async (approvalId: string, decision: string) => {
  const now = new Date();
  await db.update(approvals).set({ decision, decidedAt: now }).where(eq(approvals.id, approvalId));
  const payloadHash = hashValue({ approvalId, decision, decidedAt: now.toISOString() });
  const event = await appendApprovalEvent(approvalId, "approval.decided", payloadHash);
  return event;
};

export const appendApprovalEvent = async (
  approvalId: string,
  eventType: string,
  payloadHash: string
) => {
  const previous = await db
    .select()
    .from(approvalEvents)
    .where(eq(approvalEvents.approvalId, approvalId))
    .orderBy(desc(approvalEvents.createdAt))
    .limit(1);

  const prevHash = previous[0]?.eventHash ?? null;
  const createdAt = new Date();
  const eventHash = hashValue({
    approvalId,
    eventType,
    payloadHash,
    prevHash,
    createdAt: createdAt.toISOString()
  });

  const event = {
    id: randomUUID(),
    approvalId,
    eventType,
    payloadHash,
    prevHash,
    eventHash,
    createdAt
  };

  await db.insert(approvalEvents).values(event);

  return event;
};
