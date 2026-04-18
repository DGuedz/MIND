import * as routerClient from "../../../shared/router_client.js";

type EmitRuntimeEventResult = routerClient.EmitRuntimeEventResult;
type EmitRuntimeEventFn = (
  domain: Parameters<typeof routerClient.emitRuntimeEvent>[0],
  input: Parameters<typeof routerClient.emitRuntimeEvent>[1]
) => Promise<EmitRuntimeEventResult>;

type LoggerLike = {
  warn: (obj: unknown, msg?: string) => void;
};

type MarketAlertInput = {
  source: string;
  intentId?: string | null;
  slippageBps?: number | null;
  latencyMs?: number | null;
  reason?: string | null;
  details?: Record<string, unknown>;
};

const safeEmitRuntimeEvent: EmitRuntimeEventFn = async (domain, input) => {
  const candidate = (routerClient as unknown as { emitRuntimeEvent?: EmitRuntimeEventFn }).emitRuntimeEvent;
  if (typeof candidate !== "function") {
    return {
      ok: true,
      status: "disabled",
      event_id: `runtime-event-disabled-${Date.now()}`,
      attempts: 0,
      error: "router_client_emit_unavailable"
    };
  }
  return candidate(domain, input);
};

const handleEmit = (logger: LoggerLike | undefined, label: string, result: EmitRuntimeEventResult) => {
  if (!result.ok) {
    logger?.warn({ label, emit_status: result.status, event_id: result.event_id, error: result.error }, "runtime_event_emit_failed");
  }
};

export const emitMarketSlippageAlertEvent = async (
  input: MarketAlertInput,
  logger?: LoggerLike
): Promise<EmitRuntimeEventResult | null> => {
  if (input.slippageBps === null || input.slippageBps === undefined) return null;
  const result = await safeEmitRuntimeEvent("market", {
    event_type: "market.slippage.alert",
    context: {
      source: input.source,
      intent_id: input.intentId ?? null,
      slippage_bps: input.slippageBps,
      ...input.details
    },
    policy: {
      severity: "high",
      dedupe_key: `market-slippage:${input.intentId ?? "none"}:${input.slippageBps}`,
      run_spec_update: true
    }
  });
  handleEmit(logger, "market.slippage.alert", result);
  return result;
};

export const emitMarketLatencyAlertEvent = async (
  input: MarketAlertInput,
  logger?: LoggerLike
): Promise<EmitRuntimeEventResult | null> => {
  if (input.latencyMs === null || input.latencyMs === undefined) return null;
  const result = await safeEmitRuntimeEvent("market", {
    event_type: "market.latency.alert",
    context: {
      source: input.source,
      intent_id: input.intentId ?? null,
      latency_ms: input.latencyMs,
      ...input.details
    },
    policy: {
      severity: "high",
      dedupe_key: `market-latency:${input.intentId ?? "none"}:${input.latencyMs}`,
      run_spec_update: true
    }
  });
  handleEmit(logger, "market.latency.alert", result);
  return result;
};

export const emitMarketRouteDegradedEvent = async (
  input: MarketAlertInput,
  logger?: LoggerLike
): Promise<EmitRuntimeEventResult> => {
  const result = await safeEmitRuntimeEvent("market", {
    event_type: "market.route.degraded",
    context: {
      source: input.source,
      intent_id: input.intentId ?? null,
      reason: input.reason ?? "route_degraded",
      ...input.details
    },
    policy: {
      severity: "high",
      dedupe_key: `market-route-degraded:${input.intentId ?? "none"}:${input.reason ?? "route_degraded"}`,
      run_spec_update: true
    }
  });
  handleEmit(logger, "market.route.degraded", result);
  return result;
};
