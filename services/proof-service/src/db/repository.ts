import { eq, desc } from "drizzle-orm";
import { randomUUID, createHash } from "node:crypto";
import { db } from "./client.js";
import { proofAnchors, proofEvents, proofs } from "./schema.js";

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

export const computeProofPayloadHash = (input: {
  intentId: string;
  approvalId?: string | null;
  executionId?: string | null;
  anchors: { type: string; hash: string }[];
}) => {
  return hashValue({
    intentId: input.intentId,
    approvalId: input.approvalId ?? null,
    executionId: input.executionId ?? null,
    anchors: input.anchors
  });
};

export const computeProofHash = (payloadHash: string, eventHash: string) => {
  return hashValue({
    payloadHash,
    eventHash
  });
};

export const createProof = async (input: {
  intentId: string;
  approvalId?: string;
  executionId?: string;
  anchors: { type: string; hash: string }[];
}) => {
  const now = new Date();
  const proofId = randomUUID();

  const payloadHash = computeProofPayloadHash({
    intentId: input.intentId,
    approvalId: input.approvalId ?? null,
    executionId: input.executionId ?? null,
    anchors: input.anchors
  });

  const event = await appendProofEvent(proofId, "proof.generated", payloadHash);
  const proofHash = computeProofHash(payloadHash, event.eventHash);

  const record = {
    id: proofId,
    intentId: input.intentId,
    approvalId: input.approvalId ?? null,
    executionId: input.executionId ?? null,
    proofHash,
    createdAt: now
  };

  await db.insert(proofs).values(record);

  if (input.anchors.length) {
    await db.insert(proofAnchors).values(
      input.anchors.map((anchor) => ({
        proofId,
        type: anchor.type,
        hash: anchor.hash
      }))
    );
  }

  return { proofId, proofHash, event };
};

export const getProofById = async (proofId: string) => {
  const rows = await db.select().from(proofs).where(eq(proofs.id, proofId)).limit(1);
  return rows[0];
};

export const listProofsByIntentId = async (intentId: string, limit: number) => {
  return db
    .select()
    .from(proofs)
    .where(eq(proofs.intentId, intentId))
    .orderBy(desc(proofs.createdAt))
    .limit(limit);
};

export const getProofAnchors = async (proofId: string) => {
  return db.select().from(proofAnchors).where(eq(proofAnchors.proofId, proofId));
};

export const getLatestProofEvent = async (proofId: string) => {
  const rows = await db
    .select()
    .from(proofEvents)
    .where(eq(proofEvents.proofId, proofId))
    .orderBy(desc(proofEvents.createdAt))
    .limit(1);
  return rows[0];
};

export const listProofEvents = async (proofId: string, limit: number) => {
  return db
    .select()
    .from(proofEvents)
    .where(eq(proofEvents.proofId, proofId))
    .orderBy(desc(proofEvents.createdAt))
    .limit(limit);
};

export const appendProofEvent = async (proofId: string, eventType: string, payloadHash: string) => {
  const previous = await db
    .select()
    .from(proofEvents)
    .where(eq(proofEvents.proofId, proofId))
    .orderBy(desc(proofEvents.createdAt))
    .limit(1);

  const prevHash = previous[0]?.eventHash ?? null;
  const createdAt = new Date();
  const eventHash = hashValue({
    proofId,
    eventType,
    payloadHash,
    prevHash,
    createdAt: createdAt.toISOString()
  });

  const event = {
    id: randomUUID(),
    proofId,
    eventType,
    payloadHash,
    prevHash,
    eventHash,
    createdAt
  };

  await db.insert(proofEvents).values(event);

  return event;
};
