import { emitRuntimeEvent, type EmitRuntimeEventResult } from "../../../shared/router_client.js";

type LoggerLike = {
  warn: (obj: unknown, msg?: string) => void;
};

type ProofGeneratedInput = {
  proofId: string;
  intentId: string;
  executionId?: string | null;
  approvalId?: string | null;
  anchorCount: number;
  externalAnchorStatus: string;
};

type ProofVerificationInput = {
  proofId: string;
  intentId: string;
  verified: boolean;
  internalVerified: boolean;
  strictMetaplexAnchor: boolean;
  externalAnchorStatus: string;
  reason?: string | null;
};

const handleEmit = (logger: LoggerLike | undefined, label: string, result: EmitRuntimeEventResult) => {
  if (!result.ok) {
    logger?.warn({ label, emit_status: result.status, event_id: result.event_id, error: result.error }, "runtime_event_emit_failed");
  }
};

export const emitProofGeneratedEvent = async (
  input: ProofGeneratedInput,
  logger?: LoggerLike
): Promise<EmitRuntimeEventResult> => {
  const result = await emitRuntimeEvent("proof", {
    event_type: "proof.generated",
    context: {
      proof_id: input.proofId,
      intent_id: input.intentId,
      execution_id: input.executionId ?? null,
      approval_id: input.approvalId ?? null,
      anchor_count: input.anchorCount,
      external_anchor_status: input.externalAnchorStatus
    },
    policy: {
      severity: "medium",
      dedupe_key: `proof-generated:${input.proofId}`,
      run_spec_update: true
    }
  });
  handleEmit(logger, "proof.generated", result);
  return result;
};

export const emitProofVerificationEvent = async (
  input: ProofVerificationInput,
  logger?: LoggerLike
): Promise<EmitRuntimeEventResult> => {
  const eventType = input.verified ? "proof.verified" : "proof.failed";
  const severity = input.verified ? "medium" : "high";

  const result = await emitRuntimeEvent("proof", {
    event_type: eventType,
    context: {
      proof_id: input.proofId,
      intent_id: input.intentId,
      verified: input.verified,
      internal_verified: input.internalVerified,
      strict_metaplex_anchor: input.strictMetaplexAnchor,
      external_anchor_status: input.externalAnchorStatus,
      reason: input.reason ?? null,
      proof_status: input.verified ? "verified" : "failed"
    },
    policy: {
      severity,
      dedupe_key: `proof-verify:${input.proofId}:${eventType}`,
      run_spec_update: true
    }
  });
  handleEmit(logger, eventType, result);
  return result;
};
