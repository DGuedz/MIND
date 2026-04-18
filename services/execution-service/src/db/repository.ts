import { eq, desc } from "drizzle-orm";
import { randomUUID, createHash } from "node:crypto";
import { db } from "./client.js";
import { executionEvents, executions } from "./schema.js";

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

export const createExecution = async (input: {
  intentId: string;
  mode: "simulated" | "real";
}) => {
  const now = new Date();
  const executionId = randomUUID();

  const record = {
    id: executionId,
    intentId: input.intentId,
    mode: input.mode,
    status: "pending",
    txHash: null,
    receiptHash: null,
    createdAt: now,
    executedAt: null
  };

  await db.insert(executions).values(record);

  const payloadHash = hashValue({
    executionId,
    intentId: input.intentId,
    mode: input.mode
  });

  const event = await appendExecutionEvent(executionId, "execution.planned", payloadHash);

  return { executionId, event };
};

export const markExecutionRunning = async (executionId: string) => {
  const payloadHash = hashValue({ executionId, status: "running" });
  const event = await appendExecutionEvent(executionId, "execution.started", payloadHash);
  await db.update(executions).set({ status: "running" }).where(eq(executions.id, executionId));
  return event;
};

export const markExecutionSucceeded = async (input: {
  executionId: string;
  txHash?: string;
  receiptHash: string;
}) => {
  const executedAt = new Date();
  await db
    .update(executions)
    .set({ status: "succeeded", txHash: input.txHash ?? null, receiptHash: input.receiptHash, executedAt })
    .where(eq(executions.id, input.executionId));

  const payloadHash = hashValue({
    executionId: input.executionId,
    status: "succeeded",
    txHash: input.txHash ?? null,
    receiptHash: input.receiptHash,
    executedAt: executedAt.toISOString()
  });
  const event = await appendExecutionEvent(input.executionId, "execution.succeeded", payloadHash);
  return event;
};

export const markExecutionFailed = async (input: { executionId: string; reason: string }) => {
  await db.update(executions).set({ status: "failed" }).where(eq(executions.id, input.executionId));
  const payloadHash = hashValue({
    executionId: input.executionId,
    status: "failed",
    reason: input.reason
  });
  const event = await appendExecutionEvent(input.executionId, "execution.failed", payloadHash);
  return event;
};

export const getExecutionById = async (executionId: string) => {
  const rows = await db.select().from(executions).where(eq(executions.id, executionId)).limit(1);
  return rows[0];
};

export const listExecutionsByIntentId = async (intentId: string, limit: number) => {
  return db
    .select()
    .from(executions)
    .where(eq(executions.intentId, intentId))
    .orderBy(desc(executions.createdAt))
    .limit(limit);
};

export const appendExecutionEvent = async (
  executionId: string,
  eventType: string,
  payloadHash: string
) => {
  const previous = await db
    .select()
    .from(executionEvents)
    .where(eq(executionEvents.executionId, executionId))
    .orderBy(desc(executionEvents.createdAt))
    .limit(1);

  const prevHash = previous[0]?.eventHash ?? null;
  const createdAt = new Date();
  const eventHash = hashValue({
    executionId,
    eventType,
    payloadHash,
    prevHash,
    createdAt: createdAt.toISOString()
  });

  const event = {
    id: randomUUID(),
    executionId,
    eventType,
    payloadHash,
    prevHash,
    eventHash,
    createdAt
  };

  await db.insert(executionEvents).values(event);

  return event;
};
