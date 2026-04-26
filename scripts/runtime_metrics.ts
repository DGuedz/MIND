import fs from "node:fs/promises";
import path from "node:path";

type JsonRecord = Record<string, unknown>;

const ROOT = process.cwd();
const SPEC_DIR = path.join(ROOT, "governance", "spec_runtime");
const ARTIFACTS_DIR = path.join(ROOT, "artifacts");

const FILES = {
  triggerOutcomes: path.join(SPEC_DIR, "trigger_outcomes.jsonl"),
  decisionLog: path.join(SPEC_DIR, "decision_log.jsonl"),
  riskRegister: path.join(SPEC_DIR, "risk_register.json"),
  eventStream: path.join(SPEC_DIR, "event_stream.jsonl"),
  eventRouterOutcomes: path.join(SPEC_DIR, "event_router_outcomes.jsonl")
};

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
    write: lookup.write !== "false"
  };
};

const nowIso = () => new Date().toISOString();

const readJson = async <T>(filePath: string, fallback: T): Promise<T> => {
  try {
    return JSON.parse(await fs.readFile(filePath, "utf8")) as T;
  } catch {
    return fallback;
  }
};

const readJsonl = async (filePath: string): Promise<JsonRecord[]> => {
  try {
    const raw = await fs.readFile(filePath, "utf8");
    return raw
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => JSON.parse(line) as JsonRecord);
  } catch {
    return [];
  }
};

const mean = (values: number[]) => (values.length === 0 ? 0 : values.reduce((a, b) => a + b, 0) / values.length);

async function main() {
  const args = parseArgs();
  const [outcomes, decisions, events, routerOutcomes, riskRegister] = await Promise.all([
    readJsonl(FILES.triggerOutcomes),
    readJsonl(FILES.decisionLog),
    readJsonl(FILES.eventStream),
    readJsonl(FILES.eventRouterOutcomes),
    readJson<Record<string, unknown>>(FILES.riskRegister, {})
  ]);

  const triggerVolumeByClass: Record<string, number> = {};
  let contextUpdatedCount = 0;
  for (const outcome of outcomes) {
    const applied = Array.isArray(outcome.applied) ? (outcome.applied as JsonRecord[]) : [];
    let updatedContext = false;
    for (const item of applied) {
      const cls = String(item.class ?? "unknown");
      triggerVolumeByClass[cls] = (triggerVolumeByClass[cls] ?? 0) + 1;
      const actions = Array.isArray(item.actions) ? (item.actions as JsonRecord[]) : [];
      for (const actionRec of actions) {
        const action = String(actionRec.action ?? "");
        if (action === "spec:update-index" || action === "spec:update-operational-context" || action === "spec:recompile-dossier") {
          updatedContext = true;
        }
      }
    }
    if (updatedContext) contextUpdatedCount += 1;
  }

  const allowCount = decisions.filter((d) => String(d.decision ?? "") === "ALLOW").length;
  const blockCount = decisions.filter((d) => String(d.decision ?? "") === "BLOCK").length;
  const totalPolicyDecisions = allowCount + blockCount;
  const proofVerifiedCount = decisions.filter((d) => String(d.proof_status ?? "") === "verified").length;
  const proofCheckedCount = decisions.filter((d) => String(d.proof_status ?? "").length > 0 && String(d.proof_status) !== "null").length;

  const policyBreachCount = blockCount;
  const latencyValues = routerOutcomes.map((x) => Number(x.latency_ms)).filter((n) => Number.isFinite(n));
  const meanResponseTimeMs = mean(latencyValues);

  const byReason = (riskRegister.by_reason as Record<string, number> | undefined) ?? {};
  const topRecurringRisks = Object.entries(byReason)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([reason, count]) => ({ reason, count }));

  const metrics = {
    generated_at: nowIso(),
    window: {
      total_events: events.length,
      total_trigger_outcomes: outcomes.length,
      total_decisions: decisions.length
    },
    governance: {
      trigger_volume_by_class: triggerVolumeByClass,
      allow_vs_block: {
        allow: allowCount,
        block: blockCount,
        total_policy_decisions: totalPolicyDecisions
      },
      proof_verified_rate: proofCheckedCount > 0 ? proofVerifiedCount / proofCheckedCount : 0,
      policy_breach_count: policyBreachCount,
      mean_response_time_ms: meanResponseTimeMs,
      top_recurring_risks: topRecurringRisks,
      context_update_rate: outcomes.length > 0 ? contextUpdatedCount / outcomes.length : 0
    }
  };

  let outputFile: string | null = null;
  if (args.write) {
    await fs.mkdir(ARTIFACTS_DIR, { recursive: true });
    outputFile = path.join(ARTIFACTS_DIR, `runtime-metrics-${nowIso().replace(/[:.]/g, "-")}.json`);
    await fs.writeFile(outputFile, JSON.stringify(metrics, null, 2), "utf8");
  }

  console.log(JSON.stringify({ status: "ok", outputFile, metrics }, null, 2));
}

main().catch((error) => {
  console.error("[runtime_metrics] failed:", error instanceof Error ? error.message : String(error));
  process.exit(1);
});
