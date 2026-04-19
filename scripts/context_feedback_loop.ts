import fs from "node:fs/promises";
import path from "node:path";

type JsonRecord = Record<string, unknown>;

const ROOT = process.cwd();
const SPEC_DIR = path.join(ROOT, "governance", "spec_runtime");

const FILES = {
  decisionLog: path.join(SPEC_DIR, "decision_log.jsonl"),
  executionLearn: path.join(SPEC_DIR, "execution_learnings.jsonl"),
  riskRegister: path.join(SPEC_DIR, "risk_register.json"),
  mindIndex: path.join(SPEC_DIR, "mind_index.md"),
  reviewRequests: path.join(SPEC_DIR, "review_requests.jsonl"),
  feedbackState: path.join(SPEC_DIR, "context_feedback_state.json")
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
    riskThreshold: Number(lookup["risk-threshold"] ?? "45"),
    writeReviewOnHighRisk: lookup["write-review"] !== "false"
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

const appendJsonl = async (filePath: string, payload: unknown) => {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.appendFile(filePath, `${JSON.stringify(payload)}\n`, "utf8");
};

const updateMindIndexFeedbackSection = async (snapshot: {
  decisions_window: number;
  allow: number;
  block: number;
  block_rate: number;
  avg_ev_net: number;
  risk_pressure_score: number;
  top_risk_reason: string | null;
}) => {
  let raw = await fs.readFile(FILES.mindIndex, "utf8");
  const heading = "## Feedback loop snapshot";
  const block =
    `${heading}\n` +
    `- updated_at: \`${nowIso()}\`\n` +
    `- decisions_window: \`${snapshot.decisions_window}\`\n` +
    `- allow: \`${snapshot.allow}\`\n` +
    `- block: \`${snapshot.block}\`\n` +
    `- block_rate: \`${snapshot.block_rate.toFixed(3)}\`\n` +
    `- avg_ev_net: \`${snapshot.avg_ev_net.toFixed(3)}\`\n` +
    `- risk_pressure_score: \`${snapshot.risk_pressure_score.toFixed(2)}\`\n` +
    `- top_risk_reason: \`${snapshot.top_risk_reason ?? "n/a"}\`\n`;

  if (raw.includes(heading)) {
    raw = raw.replace(new RegExp(`${heading}[\\s\\S]*$`), block.trimEnd());
  } else {
    raw = `${raw.trimEnd()}\n\n${block}`;
  }

  await fs.writeFile(FILES.mindIndex, `${raw.trimEnd()}\n`, "utf8");
};

async function main() {
  const args = parseArgs();
  const [decisions, executionLearn, riskRegister] = await Promise.all([
    readJsonl(FILES.decisionLog),
    readJsonl(FILES.executionLearn),
    readJson<Record<string, unknown>>(FILES.riskRegister, {})
  ]);

  const recentDecisions = decisions.slice(-50);
  const allow = recentDecisions.filter((d) => String(d.decision ?? "") === "ALLOW").length;
  const block = recentDecisions.filter((d) => String(d.decision ?? "") === "BLOCK").length;
  const total = allow + block;
  const blockRate = total > 0 ? block / total : 0;

  const evValues = executionLearn
    .slice(-50)
    .map((x) => Number((x.economics as JsonRecord | undefined)?.ev_net))
    .filter((n) => Number.isFinite(n));
  const avgEvNet = evValues.length > 0 ? evValues.reduce((a, b) => a + b, 0) / evValues.length : 0;

  const byReason = (riskRegister.by_reason as Record<string, number> | undefined) ?? {};
  const sortedReasons = Object.entries(byReason).sort((a, b) => b[1] - a[1]);
  const topRiskReason = sortedReasons[0]?.[0] ?? null;
  const topRiskCount = sortedReasons[0]?.[1] ?? 0;

  const riskPressureScore = Number((blockRate * 60 + (topRiskCount > 0 ? 20 : 0) + (avgEvNet < 0 ? 20 : 0)).toFixed(2));

  const feedbackState = {
    updated_at: nowIso(),
    decisions_window: recentDecisions.length,
    allow,
    block,
    block_rate: blockRate,
    avg_ev_net: avgEvNet,
    risk_pressure_score: riskPressureScore,
    top_risk_reason: topRiskReason,
    threshold: args.riskThreshold,
    recommended_policy_bias: riskPressureScore >= args.riskThreshold ? "conservative" : "balanced"
  };

  await fs.mkdir(path.dirname(FILES.feedbackState), { recursive: true });
  await fs.writeFile(FILES.feedbackState, JSON.stringify(feedbackState, null, 2), "utf8");
  await updateMindIndexFeedbackSection({
    decisions_window: feedbackState.decisions_window,
    allow,
    block,
    block_rate: blockRate,
    avg_ev_net: avgEvNet,
    risk_pressure_score: riskPressureScore,
    top_risk_reason: topRiskReason
  });

  if (args.writeReviewOnHighRisk && riskPressureScore >= args.riskThreshold) {
    await appendJsonl(FILES.reviewRequests, {
      at: nowIso(),
      event_type: "feedback.risk_threshold_breach",
      severity: "high",
      reason: "risk_pressure_score_above_threshold",
      feedback_state: feedbackState
    });
  }

  console.log(
    JSON.stringify(
      {
        status: "ok",
        feedbackStateFile: FILES.feedbackState,
        feedbackState
      },
      null,
      2
    )
  );
}

main().catch((error) => {
  console.error("[context_feedback_loop] failed:", error instanceof Error ? error.message : String(error));
  process.exit(1);
});
