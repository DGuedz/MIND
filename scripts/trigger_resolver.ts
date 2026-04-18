import fs from "node:fs/promises";
import path from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

type RuntimeEvent = {
  event_id: string;
  event_type: string;
  timestamp: string;
  agent_id: string;
  context: Record<string, unknown>;
  policy?: Record<string, unknown>;
};

type SignalRule = {
  path: string;
  op: "equals" | "in" | "contains_any" | "exists" | "gt" | "gte" | "lt" | "lte" | "regex";
  value?: unknown;
};

type TriggerPolicy = {
  severity?: "low" | "medium" | "high";
  cooldown_sec?: number;
  dedupe_key?: string;
};

type TriggerDef = {
  id: string;
  class: "conversation" | "execution" | "drift" | "market";
  event_types: string[];
  signal?: {
    all?: SignalRule[];
    any?: SignalRule[];
  };
  policy?: TriggerPolicy;
  actions: string[];
};

type TriggerConfig = {
  version: string;
  description?: string;
  triggers: TriggerDef[];
};

type ResolverState = {
  dedupe: Record<string, string>;
};

type ActionResult = {
  action: string;
  status: "executed" | "skipped" | "failed";
  detail?: string;
};

const ROOT = process.cwd();
const SPEC_DIR = path.join(ROOT, "governance", "spec_runtime");
const TRIGGERS_FILE = path.join(SPEC_DIR, "triggers.yaml");
const STATE_FILE = path.join(ROOT, "artifacts", "trigger_runtime_state.json");
const OUTCOME_LOG = path.join(SPEC_DIR, "trigger_outcomes.jsonl");
const DECISION_LOG = path.join(SPEC_DIR, "decision_log.jsonl");
const EXECUTION_LEARNINGS_LOG = path.join(SPEC_DIR, "execution_learnings.jsonl");
const RUNTIME_BLOCKS_LOG = path.join(SPEC_DIR, "runtime_blocks.jsonl");
const REVIEW_REQUESTS_LOG = path.join(SPEC_DIR, "review_requests.jsonl");
const FILINGS_LOG = path.join(SPEC_DIR, "filings.jsonl");
const OPS_NOTIFICATIONS_LOG = path.join(SPEC_DIR, "ops_notifications.jsonl");
const OP_CONTEXT_LOG = path.join(SPEC_DIR, "operational_context.jsonl");
const RISK_REGISTER_FILE = path.join(SPEC_DIR, "risk_register.json");

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
    dryRun: lookup["dry-run"] === "true",
    ignorePolicy: lookup["ignore-policy"] === "true",
    verbose: lookup["verbose"] !== "false"
  };
};

const nowIso = () => new Date().toISOString();

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

const evaluateRule = (event: RuntimeEvent, rule: SignalRule): boolean => {
  const left = getPath({ ...event, context: event.context }, rule.path);
  switch (rule.op) {
    case "equals":
      return left === rule.value;
    case "in":
      return Array.isArray(rule.value) ? rule.value.includes(left as never) : false;
    case "contains_any":
      if (Array.isArray(left) && Array.isArray(rule.value)) {
        const set = new Set(left.map(String));
        return rule.value.some((v) => set.has(String(v)));
      }
      if (typeof left === "string" && Array.isArray(rule.value)) {
        const lower = left.toLowerCase();
        return rule.value.some((v) => lower.includes(String(v).toLowerCase()));
      }
      return false;
    case "exists":
      return left !== undefined && left !== null;
    case "gt":
      return Number(left) > Number(rule.value);
    case "gte":
      return Number(left) >= Number(rule.value);
    case "lt":
      return Number(left) < Number(rule.value);
    case "lte":
      return Number(left) <= Number(rule.value);
    case "regex":
      if (typeof left !== "string" || typeof rule.value !== "string") return false;
      try {
        return new RegExp(rule.value, "i").test(left);
      } catch {
        return false;
      }
    default:
      return false;
  }
};

const triggerMatches = (event: RuntimeEvent, trigger: TriggerDef): boolean => {
  if (!trigger.event_types.includes(event.event_type)) return false;
  const signal = trigger.signal;
  if (!signal) return true;
  const allOk = signal.all ? signal.all.every((rule) => evaluateRule(event, rule)) : true;
  const anyOk = signal.any ? signal.any.some((rule) => evaluateRule(event, rule)) : true;
  if (signal.all && signal.any) return allOk && anyOk;
  if (signal.all) return allOk;
  if (signal.any) return anyOk;
  return true;
};

const loadConfig = async (): Promise<TriggerConfig> => {
  const raw = await fs.readFile(TRIGGERS_FILE, "utf8");
  return JSON.parse(raw) as TriggerConfig;
};

const loadState = async (): Promise<ResolverState> => {
  try {
    const raw = await fs.readFile(STATE_FILE, "utf8");
    return JSON.parse(raw) as ResolverState;
  } catch {
    return { dedupe: {} };
  }
};

const saveState = async (state: ResolverState) => {
  await fs.mkdir(path.dirname(STATE_FILE), { recursive: true });
  await fs.writeFile(STATE_FILE, JSON.stringify(state, null, 2), "utf8");
};

const ensureDir = async (filePath: string) => {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
};

const appendJsonl = async (filePath: string, payload: unknown) => {
  await ensureDir(filePath);
  await fs.appendFile(filePath, `${JSON.stringify(payload)}\n`, "utf8");
};

const resolveTemplate = (template: string, event: RuntimeEvent): string =>
  template.replace(/\$\{([^}]+)\}/g, (_, expr: string) => {
    const val = getPath({ ...event, context: event.context }, expr.trim());
    return val === undefined || val === null ? "" : String(val);
  });

const isSuppressedByPolicy = (event: RuntimeEvent, trigger: TriggerDef, state: ResolverState) => {
  const cooldownSec = trigger.policy?.cooldown_sec ?? 0;
  const dedupeTemplate = trigger.policy?.dedupe_key;
  if (!dedupeTemplate) return { suppressed: false, dedupeKey: null as string | null };
  const dedupeKey = resolveTemplate(dedupeTemplate, event);
  if (!dedupeKey) return { suppressed: false, dedupeKey: null as string | null };
  const last = state.dedupe[dedupeKey];
  if (!last) return { suppressed: false, dedupeKey };
  const elapsedSec = (Date.now() - new Date(last).getTime()) / 1000;
  if (elapsedSec < cooldownSec) {
    return { suppressed: true, dedupeKey };
  }
  return { suppressed: false, dedupeKey };
};

const updateDedupeState = (dedupeKey: string | null, state: ResolverState) => {
  if (!dedupeKey) return;
  state.dedupe[dedupeKey] = nowIso();
};

const updateRiskRegister = async (event: RuntimeEvent, reason: string) => {
  const base = {
    updated_at: nowIso(),
    by_reason: {} as Record<string, number>,
    by_event_type: {} as Record<string, number>,
    latest: [] as Array<{ event_id: string; event_type: string; reason: string; timestamp: string }>
  };
  let current = base;
  try {
    const raw = await fs.readFile(RISK_REGISTER_FILE, "utf8");
    current = JSON.parse(raw) as typeof base;
  } catch {
    current = base;
  }

  current.by_reason[reason] = (current.by_reason[reason] ?? 0) + 1;
  current.by_event_type[event.event_type] = (current.by_event_type[event.event_type] ?? 0) + 1;
  current.latest.unshift({
    event_id: event.event_id,
    event_type: event.event_type,
    reason,
    timestamp: event.timestamp
  });
  current.latest = current.latest.slice(0, 50);
  current.updated_at = nowIso();

  await ensureDir(RISK_REGISTER_FILE);
  await fs.writeFile(RISK_REGISTER_FILE, JSON.stringify(current, null, 2), "utf8");
};

const updateIndexHeartbeat = async (event: RuntimeEvent) => {
  const indexFile = path.join(SPEC_DIR, "mind_index.md");
  let raw = await fs.readFile(indexFile, "utf8");
  const heartbeatHeading = "## Runtime heartbeat";
  const block =
    `${heartbeatHeading}\n` +
    `- last_event_type: \`${event.event_type}\`\n` +
    `- last_event_id: \`${event.event_id}\`\n` +
    `- last_event_time: \`${event.timestamp}\`\n` +
    `- last_decision: \`${String(event.context?.decision ?? "n/a")}\`\n` +
    `- last_proof_status: \`${String(event.context?.proof_status ?? "n/a")}\`\n`;

  if (raw.includes(heartbeatHeading)) {
    raw = raw.replace(new RegExp(`${heartbeatHeading}[\\s\\S]*$`), block.trimEnd());
  } else {
    raw = `${raw.trimEnd()}\n\n${block}`;
  }
  await fs.writeFile(indexFile, `${raw.trimEnd()}\n`, "utf8");
};

const runSpecCommand = async (args: string[]) => {
  const { stdout, stderr } = await execFileAsync("pnpm", args, { cwd: ROOT, maxBuffer: 1024 * 1024 * 8 });
  return `${stdout}${stderr}`.trim();
};

const executeAction = async (action: string, event: RuntimeEvent, dryRun: boolean): Promise<ActionResult> => {
  if (dryRun) return { action, status: "skipped", detail: "dry_run=true" };
  try {
    if (action === "spec:file") {
      await appendJsonl(FILINGS_LOG, { at: nowIso(), event_id: event.event_id, event_type: event.event_type, context: event.context });
      return { action, status: "executed" };
    }
    if (action === "spec:update-index") {
      await updateIndexHeartbeat(event);
      return { action, status: "executed" };
    }
    if (action === "spec:lint-claims") {
      const out = await runSpecCommand(["spec:lint-claims"]);
      return { action, status: "executed", detail: out.slice(0, 400) };
    }
    if (action === "spec:append-decision-log") {
      await appendJsonl(DECISION_LOG, {
        at: nowIso(),
        event_id: event.event_id,
        intent_id: event.context.intent_id ?? null,
        decision: event.context.decision ?? null,
        proof_status: event.context.proof_status ?? null,
        reason_codes: event.context.reason_codes ?? []
      });
      return { action, status: "executed" };
    }
    if (action === "spec:update-risk-register") {
      await updateRiskRegister(event, String(event.context.decision ?? "runtime_signal"));
      return { action, status: "executed" };
    }
    if (action === "spec:file-execution-learning") {
      await appendJsonl(EXECUTION_LEARNINGS_LOG, {
        at: nowIso(),
        event_id: event.event_id,
        intent_id: event.context.intent_id ?? null,
        outcome: event.context.decision ?? null,
        proof_status: event.context.proof_status ?? null,
        economics: {
          ev_net: event.context.EV_net ?? null,
          fee_capture_bps: event.context.fee_capture_bps ?? null,
          latency_ms: event.context.latency_ms ?? null
        }
      });
      return { action, status: "executed" };
    }
    if (action === "spec:lint-memory") {
      const out = await runSpecCommand(["spec:lint-claims"]);
      return { action, status: "executed", detail: out.slice(0, 400) };
    }
    if (action === "spec:request-review") {
      await appendJsonl(REVIEW_REQUESTS_LOG, {
        at: nowIso(),
        event_id: event.event_id,
        event_type: event.event_type,
        reason: "triggered_review_request",
        context: event.context
      });
      return { action, status: "executed" };
    }
    if (action === "spec:recompile-dossier") {
      const out = await runSpecCommand(["spec:assemble-context", "--tier=3"]);
      return { action, status: "executed", detail: out.slice(0, 400) };
    }
    if (action === "spec:update-operational-context") {
      await appendJsonl(OP_CONTEXT_LOG, { at: nowIso(), event_id: event.event_id, event_type: event.event_type, context: event.context });
      return { action, status: "executed" };
    }
    if (action === "spec:escalate-risk") {
      await updateRiskRegister(event, "escalated_runtime_risk");
      return { action, status: "executed" };
    }
    if (action === "spec:block-similar-intents" || action === "runtime:block-dependent-intents") {
      await appendJsonl(RUNTIME_BLOCKS_LOG, {
        at: nowIso(),
        event_id: event.event_id,
        intent_id: event.context.intent_id ?? null,
        reason: action,
        status: "requested"
      });
      return { action, status: "executed" };
    }
    if (action === "notify:ops") {
      await appendJsonl(OPS_NOTIFICATIONS_LOG, {
        at: nowIso(),
        event_id: event.event_id,
        severity: event.policy?.severity ?? "high",
        event_type: event.event_type,
        context: event.context
      });
      return { action, status: "executed" };
    }
    return { action, status: "skipped", detail: "unknown_action" };
  } catch (error) {
    return {
      action,
      status: "failed",
      detail: error instanceof Error ? error.message : String(error)
    };
  }
};

const readEvent = async (eventFile?: string, eventJson?: string): Promise<RuntimeEvent> => {
  if (eventJson) return JSON.parse(eventJson) as RuntimeEvent;
  if (eventFile) return JSON.parse(await fs.readFile(path.resolve(eventFile), "utf8")) as RuntimeEvent;
  const stdin = await new Promise<string>((resolve) => {
    let data = "";
    process.stdin.setEncoding("utf8");
    process.stdin.on("data", (chunk) => (data += chunk));
    process.stdin.on("end", () => resolve(data));
  });
  if (!stdin.trim()) {
    throw new Error("No event provided. Use --event-file, --event-json, or stdin.");
  }
  return JSON.parse(stdin) as RuntimeEvent;
};

async function main() {
  const args = parseArgs();
  const config = await loadConfig();
  const event = await readEvent(args.eventFile, args.eventJson);
  const state = await loadState();
  const startedAt = nowIso();

  const matchedTriggers = config.triggers.filter((trigger) => triggerMatches(event, trigger));
  const applied: Array<{
    trigger_id: string;
    class: string;
    suppressed: boolean;
    policy: TriggerPolicy | undefined;
    actions: ActionResult[];
  }> = [];

  for (const trigger of matchedTriggers) {
    const suppression = args.ignorePolicy ? { suppressed: false, dedupeKey: null as string | null } : isSuppressedByPolicy(event, trigger, state);
    if (suppression.suppressed) {
      applied.push({
        trigger_id: trigger.id,
        class: trigger.class,
        suppressed: true,
        policy: trigger.policy,
        actions: []
      });
      continue;
    }

    const results: ActionResult[] = [];
    for (const action of trigger.actions) {
      const result = await executeAction(action, event, args.dryRun);
      results.push(result);
    }
    updateDedupeState(suppression.dedupeKey, state);
    applied.push({
      trigger_id: trigger.id,
      class: trigger.class,
      suppressed: false,
      policy: trigger.policy,
      actions: results
    });
  }

  await saveState(state);
  const outcome = {
    at: nowIso(),
    started_at: startedAt,
    dry_run: args.dryRun,
    event,
    matched_count: matchedTriggers.length,
    applied
  };
  await appendJsonl(OUTCOME_LOG, outcome);

  if (args.verbose) {
    console.log(JSON.stringify(outcome, null, 2));
  } else {
    console.log(
      JSON.stringify(
        {
          event_id: event.event_id,
          matched_count: matchedTriggers.length,
          applied: applied.map((a) => ({
            trigger_id: a.trigger_id,
            suppressed: a.suppressed,
            actions: a.actions.map((x) => ({ action: x.action, status: x.status }))
          }))
        },
        null,
        2
      )
    );
  }
}

main().catch((error) => {
  console.error("[trigger_resolver] failed:", error);
  process.exit(1);
});
