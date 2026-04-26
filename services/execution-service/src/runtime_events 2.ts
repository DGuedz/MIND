import { emitRuntimeEvent, type EmitRuntimeEventResult } from "../../../shared/router_client.js";

type LoggerLike = {
  warn: (obj: unknown, msg?: string) => void;
};

type SubmittedInput = {
  executionId: string;
  intentId: string;
  mode: "simulated" | "real";
  protocol?: string | null;
  policyHash?: string | null;
};

type ConfirmedInput = {
  executionId: string;
  intentId: string;
  mode: "simulated" | "real";
  status: "simulated" | "executed";
  txHash?: string | null;
  receiptHash?: string | null;
  routeHash?: string | null;
  executionHash?: string | null;
  policyHash?: string | null;
  protocol?: string | null;
};

type FailedInput = {
  executionId: string;
  intentId: string;
  mode: "simulated" | "real";
  reason: string;
  policyHash?: string | null;
  protocol?: string | null;
};

const handleEmit = (logger: LoggerLike | undefined, label: string, result: EmitRuntimeEventResult) => {
  if (!result.ok) {
    logger?.warn({ label, emit_status: result.status, event_id: result.event_id, error: result.error }, "runtime_event_emit_failed");
  }
};

export const emitExecutionSubmittedEvent = async (
  input: SubmittedInput,
  logger?: LoggerLike
): Promise<EmitRuntimeEventResult> => {
  const result = await emitRuntimeEvent("execution", {
    event_type: "execution.submitted",
    context: {
      execution_id: input.executionId,
      intent_id: input.intentId,
      mode: input.mode,
      protocol: input.protocol ?? null,
      policy_hash: input.policyHash ?? null
    },
    policy: {
      severity: "medium",
      dedupe_key: `execution-submitted:${input.executionId}`,
      run_spec_update: true
    }
  });
  handleEmit(logger, "execution.submitted", result);
  return result;
};

export const emitExecutionConfirmedEvent = async (
  input: ConfirmedInput,
  logger?: LoggerLike
): Promise<EmitRuntimeEventResult> => {
  const result = await emitRuntimeEvent("execution", {
    event_type: "execution.confirmed",
    context: {
      execution_id: input.executionId,
      intent_id: input.intentId,
      mode: input.mode,
      status: input.status,
      tx_hash: input.txHash ?? null,
      receipt_hash: input.receiptHash ?? null,
      route_hash: input.routeHash ?? null,
      execution_hash: input.executionHash ?? null,
      policy_hash: input.policyHash ?? null,
      protocol: input.protocol ?? null
    },
    policy: {
      severity: "medium",
      dedupe_key: `execution-confirmed:${input.executionId}:${input.status}`,
      run_spec_update: true
    }
  });
  handleEmit(logger, "execution.confirmed", result);
  return result;
};

export const emitExecutionFailedEvent = async (
  input: FailedInput,
  logger?: LoggerLike
): Promise<EmitRuntimeEventResult> => {
  const result = await emitRuntimeEvent("execution", {
    event_type: "execution.failed",
    context: {
      execution_id: input.executionId,
      intent_id: input.intentId,
      mode: input.mode,
      reason: input.reason,
      policy_hash: input.policyHash ?? null,
      protocol: input.protocol ?? null,
      route_failure: true
    },
    policy: {
      severity: "high",
      dedupe_key: `execution-failed:${input.executionId}`,
      run_spec_update: true
    }
  });
  handleEmit(logger, "execution.failed", result);
  return result;
};
