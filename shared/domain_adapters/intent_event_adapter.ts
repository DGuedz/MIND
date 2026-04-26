import type { EmitRuntimeEventInput } from "../event_emitter.js";

type AnyRecord = Record<string, unknown>;

const asObj = (value: unknown): AnyRecord => (value && typeof value === "object" ? (value as AnyRecord) : {});

export const adaptIntentEvent = (payload: AnyRecord): EmitRuntimeEventInput => {
  const context = asObj(payload.context);
  return {
    event_id: typeof payload.event_id === "string" ? payload.event_id : undefined,
    timestamp: typeof payload.timestamp === "string" ? payload.timestamp : undefined,
    event_type: typeof payload.event_type === "string" ? payload.event_type : "intent.created",
    agent_id: typeof payload.agent_id === "string" ? payload.agent_id : "intent_service",
    context: {
      intent_id: context.intent_id ?? payload.intent_id ?? null,
      decision: context.decision ?? payload.decision ?? null,
      reason_codes: context.reason_codes ?? payload.reason_codes ?? [],
      proof_status: context.proof_status ?? payload.proof_status ?? null,
      ...context
    },
    policy: asObj(payload.policy)
  };
};
