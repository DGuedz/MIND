import type { EmitRuntimeEventInput } from "../event_emitter.js";
import { adaptIntentEvent } from "./intent_event_adapter.js";
import { adaptProofEvent } from "./proof_event_adapter.js";
import { adaptExecutionEvent } from "./execution_event_adapter.js";
import { adaptMarketEvent } from "./market_event_adapter.js";

type AnyRecord = Record<string, unknown>;

const asObj = (value: unknown): AnyRecord => (value && typeof value === "object" ? (value as AnyRecord) : {});

export const adaptDomainEvent = (payloadInput: unknown): EmitRuntimeEventInput => {
  const payload = asObj(payloadInput);
  const explicitDomain = typeof payload.domain === "string" ? payload.domain.toLowerCase() : "";
  const eventType = typeof payload.event_type === "string" ? payload.event_type.toLowerCase() : "";

  if (explicitDomain === "intent" || eventType.startsWith("intent.")) return adaptIntentEvent(payload);
  if (explicitDomain === "proof" || eventType.startsWith("proof.")) return adaptProofEvent(payload);
  if (explicitDomain === "execution" || eventType.startsWith("execution.") || eventType.startsWith("tx.")) {
    return adaptExecutionEvent(payload);
  }
  if (explicitDomain === "market" || eventType.startsWith("market.")) return adaptMarketEvent(payload);

  const context = asObj(payload.context);
  return {
    event_id: typeof payload.event_id === "string" ? payload.event_id : undefined,
    timestamp: typeof payload.timestamp === "string" ? payload.timestamp : undefined,
    event_type: typeof payload.event_type === "string" ? payload.event_type : "conversation.message.received",
    agent_id: typeof payload.agent_id === "string" ? payload.agent_id : "event_router",
    context,
    policy: asObj(payload.policy)
  };
};
