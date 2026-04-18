import type { EmitRuntimeEventInput } from "../event_emitter.js";

type AnyRecord = Record<string, unknown>;

const asObj = (value: unknown): AnyRecord => (value && typeof value === "object" ? (value as AnyRecord) : {});

export const adaptMarketEvent = (payload: AnyRecord): EmitRuntimeEventInput => {
  const context = asObj(payload.context);
  return {
    event_id: typeof payload.event_id === "string" ? payload.event_id : undefined,
    timestamp: typeof payload.timestamp === "string" ? payload.timestamp : undefined,
    event_type: typeof payload.event_type === "string" ? payload.event_type : "market.runtime.signal",
    agent_id: typeof payload.agent_id === "string" ? payload.agent_id : "market_monitor",
    context: {
      intent_id: context.intent_id ?? payload.intent_id ?? null,
      slippage_bps: context.slippage_bps ?? payload.slippage_bps ?? null,
      latency_ms: context.latency_ms ?? payload.latency_ms ?? null,
      route_failure: context.route_failure ?? payload.route_failure ?? false,
      anchor_timeout: context.anchor_timeout ?? payload.anchor_timeout ?? false,
      proof_status: context.proof_status ?? payload.proof_status ?? null,
      fee_capture_bps: context.fee_capture_bps ?? payload.fee_capture_bps ?? null,
      ...context
    },
    policy: asObj(payload.policy)
  };
};
