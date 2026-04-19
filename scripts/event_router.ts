import fs from "node:fs/promises";
import path from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { appendToEventStream, createRuntimeEvent, validateRuntimeEvent, type RuntimeEvent } from "../shared/event_emitter.js";

const execFileAsync = promisify(execFile);

type PriorityName = "high" | "medium" | "low";

type EventPriorityCondition = {
  path: string;
  equals?: unknown;
  gt?: number;
  contains_any?: unknown[];
  priority: PriorityName;
};

type EventPriorityRule = {
  when?: EventPriorityCondition[];
  default: PriorityName;
};

type PriorityPolicy = {
  event_priority_map: Record<string, EventPriorityRule>;
};

const ROOT = process.cwd();
const SPEC_DIR = path.join(ROOT, "governance", "spec_runtime");
const PRIORITIES_FILE = path.join(SPEC_DIR, "policy_priorities.yaml");
const ROUTER_INGRESS_LOG = path.join(SPEC_DIR, "event_router_ingress.jsonl");
const ROUTER_OUTCOMES_LOG = path.join(SPEC_DIR, "event_router_outcomes.jsonl");

const parseArgs = () => {
  const raw = process.argv.slice(2);
  const lookup = Object.fromEntries(
    raw
      .filter((v) => v.startsWith("--"))
      .map((v) => {
        const [k, ...rest] = v.slice(2).split("=");
        return [k, rest.join("=") || "true"];
      })
  );
  return {
    eventFile: typeof lookup["event-file"] === "string" ? lookup["event-file"] : undefined,
    eventJson: typeof lookup["event-json"] === "string" ? lookup["event-json"] : undefined,
    emitOnly: lookup["emit-only"] === "true",
    dryRun: lookup["dry-run"] === "true",
    verbose: lookup["verbose"] !== "false"
  };
};

const nowIso = () => new Date().toISOString();

const appendJsonl = async (filePath: string, payload: unknown) => {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.appendFile(filePath, `${JSON.stringify(payload)}\n`, "utf8");
};

const getPath = (obj: Record<string, unknown>, rawPath: string): unknown => {
  const parts = rawPath.split(".").filter(Boolean);
  let current: unknown = obj;
  for (const part of parts) {
    if (current && typeof current === "object" && part in (current as Record<string, unknown>)) {
      current = (current as Record<string, unknown>)[part];
    } else {
      return undefined;
    }
  }
  return current;
};

const eventAliases: Record<string, string> = {
  "execution.confirmed": "tx.confirmed",
  "execution.failed": "execution.failed",
  "proof.generated": "proof.generated",
  "proof.verified": "proof.verified",
  "market.slippage.alert": "market.runtime.signal",
  "anchor.timeout": "market.runtime.signal"
};

const normalizeEventType = (eventType: string): string => eventAliases[eventType] ?? eventType;

const loadPriorityPolicy = async (): Promise<PriorityPolicy> => {
  const raw = await fs.readFile(PRIORITIES_FILE, "utf8");
  return JSON.parse(raw) as PriorityPolicy;
};

const conditionMatches = (event: RuntimeEvent, cond: EventPriorityCondition): boolean => {
  const left = getPath({ ...event, context: event.context }, cond.path);
  if (cond.equals !== undefined) return left === cond.equals;
  if (cond.gt !== undefined) return Number(left) > cond.gt;
  if (cond.contains_any && Array.isArray(left)) {
    const set = new Set((left as unknown[]).map(String));
    return cond.contains_any.some((v) => set.has(String(v)));
  }
  return false;
};

const resolvePriority = (event: RuntimeEvent, policy: PriorityPolicy): PriorityName => {
  const rule = policy.event_priority_map[event.event_type];
  if (!rule) return "medium";
  for (const cond of rule.when ?? []) {
    if (conditionMatches(event, cond)) return cond.priority;
  }
  return rule.default;
};

const runResolver = async (event: RuntimeEvent, dryRun: boolean) => {
  const args = ["exec", "tsx", "scripts/trigger_resolver.ts", `--event-json=${JSON.stringify(event)}`];
  if (dryRun) args.push("--dry-run=true");
  const { stdout, stderr } = await execFileAsync("pnpm", args, { cwd: ROOT, maxBuffer: 1024 * 1024 * 8 });
  return `${stdout}${stderr}`.trim();
};

const readInput = async (eventFile?: string, eventJson?: string): Promise<Record<string, unknown>> => {
  if (eventJson) return JSON.parse(eventJson) as Record<string, unknown>;
  if (eventFile) return JSON.parse(await fs.readFile(path.resolve(eventFile), "utf8")) as Record<string, unknown>;
  const stdin = await new Promise<string>((resolve) => {
    let data = "";
    process.stdin.setEncoding("utf8");
    process.stdin.on("data", (chunk) => (data += chunk));
    process.stdin.on("end", () => resolve(data));
  });
  if (!stdin.trim()) throw new Error("No event payload. Use --event-file, --event-json, or stdin.");
  return JSON.parse(stdin) as Record<string, unknown>;
};

async function main() {
  const args = parseArgs();
  const startedAtMs = Date.now();
  const raw = await readInput(args.eventFile, args.eventJson);
  const normalizedEventType = normalizeEventType(String(raw.event_type ?? ""));

  const event = createRuntimeEvent({
    event_id: typeof raw.event_id === "string" ? raw.event_id : undefined,
    timestamp: typeof raw.timestamp === "string" ? raw.timestamp : undefined,
    event_type: normalizedEventType,
    agent_id: typeof raw.agent_id === "string" ? raw.agent_id : "mind_router",
    context: (raw.context && typeof raw.context === "object" ? (raw.context as Record<string, unknown>) : {}) as Record<string, unknown>,
    policy: (raw.policy && typeof raw.policy === "object" ? (raw.policy as Record<string, unknown>) : undefined) as RuntimeEvent["policy"]
  });

  const validation = validateRuntimeEvent(event);
  if (!validation.valid) {
    throw new Error(`Invalid runtime event: ${validation.errors.join("; ")}`);
  }

  const priorityPolicy = await loadPriorityPolicy();
  const priority = resolvePriority(event, priorityPolicy);
  event.policy = {
    ...(event.policy ?? {}),
    severity: event.policy?.severity ?? priority,
    queue_priority: priority
  };

  await appendJsonl(ROUTER_INGRESS_LOG, { at: nowIso(), event });
  const streamFile = await appendToEventStream(event);

  let resolverOutput = "emit_only=true";
  if (!args.emitOnly) {
    resolverOutput = await runResolver(event, args.dryRun);
  }

  const finishedAtMs = Date.now();
  const result = {
    at: nowIso(),
    latency_ms: finishedAtMs - startedAtMs,
    emit_only: args.emitOnly,
    dry_run: args.dryRun,
    event_id: event.event_id,
    event_type: event.event_type,
    queue_priority: priority,
    event_stream_file: streamFile,
    resolver_output: resolverOutput
  };
  await appendJsonl(ROUTER_OUTCOMES_LOG, result);

  if (args.verbose) {
    console.log(JSON.stringify(result, null, 2));
  } else {
    console.log(JSON.stringify({ event_id: event.event_id, queue_priority: priority, latency_ms: result.latency_ms }, null, 2));
  }
}

main().catch((error) => {
  console.error("[event_router] failed:", error instanceof Error ? error.message : String(error));
  process.exit(1);
});
