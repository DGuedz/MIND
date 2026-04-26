import { randomUUID } from "node:crypto";
import type { RuntimeEventSeverity } from "./event_emitter.js";

export type RuntimeEventDomain = "intent" | "proof" | "execution" | "market";

export type IntentRuntimeEventType =
  | "intent.created"
  | "intent.policy.checked"
  | "intent.blocked"
  | "intent.allowed";

export type ProofRuntimeEventType = "proof.generated" | "proof.verified" | "proof.failed";

export type ExecutionRuntimeEventType =
  | "execution.submitted"
  | "execution.confirmed"
  | "execution.failed";

export type MarketRuntimeEventType =
  | "market.slippage.alert"
  | "market.latency.alert"
  | "market.route.degraded";

export type RuntimeEventType =
  | IntentRuntimeEventType
  | ProofRuntimeEventType
  | ExecutionRuntimeEventType
  | MarketRuntimeEventType;

export type RuntimeEventPolicy = {
  severity?: RuntimeEventSeverity;
  dedupe_key?: string;
  run_spec_update?: boolean;
  [key: string]: unknown;
};

export type RuntimeEventInput = {
  event_id?: string;
  event_type: RuntimeEventType;
  timestamp?: string;
  agent_id?: string;
  source?: string;
  context?: Record<string, unknown>;
  policy?: RuntimeEventPolicy;
  dry_run?: boolean;
};

export type RuntimeEventEnvelope = {
  source: string;
  domain: RuntimeEventDomain;
  event_id: string;
  event_type: RuntimeEventType;
  timestamp: string;
  agent_id: string;
  context: Record<string, unknown>;
  policy?: RuntimeEventPolicy;
  dry_run?: boolean;
};

const DOMAIN_PREFIX: Record<RuntimeEventDomain, string> = {
  intent: "intent.",
  proof: "proof.",
  execution: "execution.",
  market: "market."
};

const nowIso = () => new Date().toISOString();

const normalizeContext = (input: unknown): Record<string, unknown> => {
  if (!input || typeof input !== "object" || Array.isArray(input)) return {};
  return input as Record<string, unknown>;
};

const normalizeSource = (domain: RuntimeEventDomain, source?: string) => {
  if (source && source.trim().length > 0) return source;
  return `${domain}_service`;
};

const normalizeAgentId = (domain: RuntimeEventDomain, agentId?: string) => {
  if (agentId && agentId.trim().length > 0) return agentId;
  return process.env.RUNTIME_EVENT_AGENT_ID ?? `${domain}_agent`;
};

const validateEventType = (domain: RuntimeEventDomain, eventType: RuntimeEventType) => {
  const prefix = DOMAIN_PREFIX[domain];
  if (!String(eventType).startsWith(prefix)) {
    throw new Error(`invalid_event_type_for_domain domain=${domain} event_type=${eventType}`);
  }
};

export const normalizeRuntimeEvent = (
  domain: RuntimeEventDomain,
  input: RuntimeEventInput
): RuntimeEventEnvelope => {
  validateEventType(domain, input.event_type);

  return {
    source: normalizeSource(domain, input.source),
    domain,
    event_id: input.event_id ?? `evt_${randomUUID()}`,
    event_type: input.event_type,
    timestamp: input.timestamp ?? nowIso(),
    agent_id: normalizeAgentId(domain, input.agent_id),
    context: normalizeContext(input.context),
    policy: input.policy,
    dry_run: input.dry_run
  };
};
