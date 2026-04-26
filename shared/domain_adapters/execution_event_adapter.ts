import type { EmitRuntimeEventInput } from "../event_emitter.js";

type AnyRecord = Record<string, unknown>;

const asObj = (value: unknown): AnyRecord => (value && typeof value === "object" ? (value as AnyRecord) : {});

export const adaptExecutionEvent = (payload: AnyRecord): EmitRuntimeEventInput => {
  const context = asObj(payload.context);
  return {
    event_id: typeof payload.event_id === "string" ? payload.event_id : undefined,
    timestamp: typeof payload.timestamp === "string" ? payload.timestamp : undefined,
    event_type: typeof payload.event_type === "string" ? payload.event_type : "execution.submitted",
    agent_id: typeof payload.agent_id === "string" ? payload.agent_id : "execution_service",
    context: {
      intent_id: context.intent_id ?? payload.intent_id ?? null,
      execution_id: context.execution_id ?? payload.execution_id ?? null,
      tx_hash: context.tx_hash ?? payload.tx_hash ?? null,
      route_failure: context.route_failure ?? payload.route_failure ?? false,
      retry_count: context.retry_count ?? payload.retry_count ?? 0,
      slippage_bps: context.slippage_bps ?? payload.slippage_bps ?? null,
      latency_ms: context.latency_ms ?? payload.latency_ms ?? null,
      ...context
    },
    policy: asObj(payload.policy)
  };
};
