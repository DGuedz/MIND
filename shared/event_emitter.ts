import fs from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";

export type RuntimeEventSeverity = "low" | "medium" | "high";

export type RuntimeEvent = {
  event_id: string;
  event_type: string;
  timestamp: string;
  agent_id: string;
  context: Record<string, unknown>;
  policy?: {
    severity?: RuntimeEventSeverity;
    dedupe_key?: string;
    run_spec_update?: boolean;
    [key: string]: unknown;
  };
};

export type EmitRuntimeEventInput = {
  event_type: string;
  agent_id: string;
  context: Record<string, unknown>;
  event_id?: string;
  timestamp?: string;
  policy?: RuntimeEvent["policy"];
};

const ROOT = process.cwd();
const SPEC_DIR = path.join(ROOT, "governance", "spec_runtime");
const EVENT_STREAM_FILE = path.join(SPEC_DIR, "event_stream.jsonl");

const nowIso = () => new Date().toISOString();

export const createRuntimeEvent = (input: EmitRuntimeEventInput): RuntimeEvent => ({
  event_id: input.event_id ?? `evt_${randomUUID()}`,
  event_type: input.event_type,
  timestamp: input.timestamp ?? nowIso(),
  agent_id: input.agent_id,
  context: input.context,
  policy: input.policy
});

export const validateRuntimeEvent = (event: RuntimeEvent): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];
  if (!event.event_id || typeof event.event_id !== "string") errors.push("event_id is required");
  if (!event.event_type || typeof event.event_type !== "string") errors.push("event_type is required");
  if (!event.timestamp || Number.isNaN(new Date(event.timestamp).getTime())) errors.push("timestamp must be ISO date");
  if (!event.agent_id || typeof event.agent_id !== "string") errors.push("agent_id is required");
  if (!event.context || typeof event.context !== "object" || Array.isArray(event.context)) errors.push("context must be an object");
  return { valid: errors.length === 0, errors };
};

export const appendToEventStream = async (event: RuntimeEvent) => {
  await fs.mkdir(path.dirname(EVENT_STREAM_FILE), { recursive: true });
  await fs.appendFile(EVENT_STREAM_FILE, `${JSON.stringify(event)}\n`, "utf8");
  return EVENT_STREAM_FILE;
};
