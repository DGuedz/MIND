import { eq, desc } from "drizzle-orm";
import { randomUUID, createHash } from "node:crypto";
import { db } from "./client.js";
import { intentEvents, intents } from "./schema.js";

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

export const computePolicyHash = (rules: Record<string, unknown>) => {
  return hashValue({ rules });
};

export const createIntent = async (input: {
  creatorAgentId: string;
  targetAgentId?: string;
  asset: string;
  action: string;
  amount: string;
  confidence: number;
  riskScore: number;
  expiryTs: string;
  policyId: string;
  marketContextId?: string;
}) => {
  const now = new Date();
  const intentId = randomUUID();
  const data = {
    id: intentId,
    creatorAgentId: input.creatorAgentId,
    targetAgentId: input.targetAgentId ?? null,
    asset: input.asset,
    action: input.action,
    amount: input.amount,
    confidence: input.confidence.toString(),
    riskScore: input.riskScore.toString(),
    expiryTs: new Date(input.expiryTs),
    policyId: input.policyId,
    policyHash: null,
    marketContextId: input.marketContextId ?? null,
    status: "draft",
    createdAt: now,
    updatedAt: now
  };

  await db.insert(intents).values(data);

  const payloadHash = hashValue({
    intentId,
    creatorAgentId: input.creatorAgentId,
    asset: input.asset,
    action: input.action,
    amount: input.amount,
    policyId: input.policyId
  });

  const event = await appendIntentEvent(intentId, "intent.created", payloadHash);

  return { intentId, event };
};

export const getIntentById = async (intentId: string) => {
  const rows = await db.select().from(intents).where(eq(intents.id, intentId)).limit(1);
  return rows[0];
};

export const updateIntentStatus = async (intentId: string, status: string) => {
  const now = new Date();
  await db.update(intents).set({ status, updatedAt: now }).where(eq(intents.id, intentId));
  const payloadHash = hashValue({ intentId, status });
  const event = await appendIntentEvent(intentId, "intent.status_changed", payloadHash);
  return event;
};

export const updateIntentPolicyHash = async (intentId: string, policyHash: string) => {
  const now = new Date();
  await db.update(intents).set({ policyHash, updatedAt: now }).where(eq(intents.id, intentId));
  const payloadHash = hashValue({ intentId, policyHash });
  const event = await appendIntentEvent(intentId, "intent.policy_hashed", payloadHash);
  return event;
};

export const appendIntentEvent = async (intentId: string, eventType: string, payloadHash: string) => {
  const previous = await db
    .select()
    .from(intentEvents)
    .where(eq(intentEvents.intentId, intentId))
    .orderBy(desc(intentEvents.createdAt))
    .limit(1);

  const prevHash = previous[0]?.eventHash ?? null;
  const createdAt = new Date();
  const eventHash = hashValue({
    intentId,
    eventType,
    payloadHash,
    prevHash,
    createdAt: createdAt.toISOString()
  });

  const event = {
    id: randomUUID(),
    intentId,
    eventType,
    payloadHash,
    prevHash,
    eventHash,
    createdAt
  };

  await db.insert(intentEvents).values(event);

  return event;
};
