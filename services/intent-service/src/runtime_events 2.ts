import * as routerClient from "../../../shared/router_client.js";

type EmitRuntimeEventResult = routerClient.EmitRuntimeEventResult;
type EmitRuntimeEventFn = (
  domain: Parameters<typeof routerClient.emitRuntimeEvent>[0],
  input: Parameters<typeof routerClient.emitRuntimeEvent>[1]
) => Promise<EmitRuntimeEventResult>;

type LoggerLike = {
  warn: (obj: unknown, msg?: string) => void;
};

type PolicyDecision = "ALLOW" | "REQUIRE_APPROVAL" | "REJECT";

type IntentCreatedInput = {
  intentId: string;
  policyId: string;
  amount?: unknown;
  riskScore?: unknown;
};

type IntentPolicyCheckedInput = {
  intentId: string;
  decision: PolicyDecision;
  allowed: boolean;
  requiresApproval: boolean;
  reasons: string[];
  policyHash: string | null;
  evNetBps: number | null;
};

const toSeverity = (decision: PolicyDecision) => (decision === "REJECT" ? "high" : "medium");

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

export const emitIntentCreatedEvent = async (
  input: IntentCreatedInput,
  logger?: LoggerLike
): Promise<EmitRuntimeEventResult> => {
  const result = await safeEmitRuntimeEvent("intent", {
    event_type: "intent.created",
    context: {
      intent_id: input.intentId,
      policy_id: input.policyId,
      amount: input.amount ?? null,
      risk_score: input.riskScore ?? null
    },
    policy: {
      severity: "medium",
      dedupe_key: `intent-created:${input.intentId}`,
      run_spec_update: true
    }
  });
  handleEmit(logger, "intent.created", result);
  return result;
};

export const emitIntentPolicyCheckedEvents = async (
  input: IntentPolicyCheckedInput,
  logger?: LoggerLike
): Promise<EmitRuntimeEventResult[]> => {
  const baseContext = {
    intent_id: input.intentId,
    decision: input.decision,
    allowed: input.allowed,
    requires_approval: input.requiresApproval,
    reason_codes: input.reasons,
    policy_hash: input.policyHash,
    ev_net_bps: input.evNetBps
  };

  const checkedResult = await safeEmitRuntimeEvent("intent", {
    event_type: "intent.policy.checked",
    context: baseContext,
    policy: {
      severity: toSeverity(input.decision),
      dedupe_key: `intent-policy:${input.intentId}:${input.decision}`,
      run_spec_update: true
    }
  });
  handleEmit(logger, "intent.policy.checked", checkedResult);

  if (input.decision === "REJECT") {
    const blockedResult = await safeEmitRuntimeEvent("intent", {
      event_type: "intent.blocked",
      context: baseContext,
      policy: {
        severity: "high",
        dedupe_key: `intent-blocked:${input.intentId}`,
        run_spec_update: true
      }
    });
    handleEmit(logger, "intent.blocked", blockedResult);
    return [checkedResult, blockedResult];
  }

  const allowedResult = await safeEmitRuntimeEvent("intent", {
    event_type: "intent.allowed",
    context: baseContext,
    policy: {
      severity: "medium",
      dedupe_key: `intent-allowed:${input.intentId}`,
      run_spec_update: true
    }
  });
  handleEmit(logger, "intent.allowed", allowedResult);
  return [checkedResult, allowedResult];
};
