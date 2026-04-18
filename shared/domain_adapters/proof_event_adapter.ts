import type { EmitRuntimeEventInput } from "../event_emitter.js";

type AnyRecord = Record<string, unknown>;

const asObj = (value: unknown): AnyRecord => (value && typeof value === "object" ? (value as AnyRecord) : {});

export const adaptProofEvent = (payload: AnyRecord): EmitRuntimeEventInput => {
  const context = asObj(payload.context);
  const proofStatus = (context.proof_status ?? payload.proof_status ?? "").toString() || null;
  const eventType =
    typeof payload.event_type === "string"
      ? payload.event_type
      : proofStatus === "verified"
        ? "proof.verified"
        : "proof.generated";

  return {
    event_id: typeof payload.event_id === "string" ? payload.event_id : undefined,
    timestamp: typeof payload.timestamp === "string" ? payload.timestamp : undefined,
    event_type: eventType,
    agent_id: typeof payload.agent_id === "string" ? payload.agent_id : "proof_service",
    context: {
      intent_id: context.intent_id ?? payload.intent_id ?? null,
      proof_id: context.proof_id ?? payload.proof_id ?? null,
      proof_status: proofStatus,
      proof_tx: context.proof_tx ?? payload.proof_tx ?? null,
      ...context
    },
    policy: asObj(payload.policy)
  };
};
