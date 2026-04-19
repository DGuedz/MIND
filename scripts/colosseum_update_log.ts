import fs from "node:fs/promises";
import path from "node:path";
import { execSync } from "node:child_process";

type JsonRecord = Record<string, unknown>;

const ROOT = process.cwd();
const DOCS_DIR = path.join(ROOT, "docs");
const SPEC_DIR = path.join(ROOT, "governance", "spec_runtime");
const ARTIFACTS_DIR = path.join(ROOT, "artifacts");
const COLOSSEUM_ARTIFACTS_DIR = path.join(ARTIFACTS_DIR, "colosseum_updates");
const UPDATE_LOG_MD = path.join(DOCS_DIR, "COLOSSEUM_DEV_UPDATES.md");

type Args = {
  phase: string;
  status: "planned" | "in_progress" | "blocked" | "done";
  summary: string;
  wins: string[];
  risks: string[];
  next: string[];
  evidence: string[];
  write: boolean;
};

const nowIso = () => new Date().toISOString();
const toTimestamp = (iso: string) => iso.replace(/[:.]/g, "-");

const parseList = (value?: string) =>
  (value ?? "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

const parseArgs = (): Args => {
  const raw = process.argv.slice(2);
  const lookup = Object.fromEntries(
    raw
      .filter((value) => value.startsWith("--"))
      .map((value) => {
        const [key, ...rest] = value.slice(2).split("=");
        return [key, rest.join("=")];
      })
  );

  return {
    phase: lookup.phase || "Phase-Unknown",
    status: (lookup.status as Args["status"]) || "in_progress",
    summary: lookup.summary || "Incremental implementation and validation update.",
    wins: parseList(lookup.wins),
    risks: parseList(lookup.risks),
    next: parseList(lookup.next),
    evidence: parseList(lookup.evidence),
    write: lookup.write !== "false"
  };
};

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

const rel = (targetPath: string) => path.relative(ROOT, targetPath).replace(/\\/g, "/");

const safeGit = (cmd: string) => {
  try {
    return execSync(cmd, { cwd: ROOT, stdio: ["ignore", "pipe", "ignore"] }).toString("utf8").trim();
  } catch {
    return "unknown";
  }
};

const getLatestByPrefix = async (
  dirPath: string,
  prefix: string,
  kind: "file" | "dir"
): Promise<string | null> => {
  try {
    const entries = await fs.readdir(dirPath, { withFileTypes: true });
    const filtered = entries.filter((entry) => {
      const kindMatch = kind === "file" ? entry.isFile() : entry.isDirectory();
      return kindMatch && entry.name.startsWith(prefix);
    });
    if (filtered.length === 0) return null;

    const withStats = await Promise.all(
      filtered.map(async (entry) => {
        const fullPath = path.join(dirPath, entry.name);
        const stat = await fs.stat(fullPath);
        return { fullPath, mtimeMs: stat.mtimeMs };
      })
    );

    withStats.sort((a, b) => b.mtimeMs - a.mtimeMs);
    return withStats[0]?.fullPath ?? null;
  } catch {
    return null;
  }
};

const pct = (value: number) => `${(value * 100).toFixed(2)}%`;

async function main() {
  const args = parseArgs();
  const generatedAt = nowIso();
  const ts = toTimestamp(generatedAt);

  const decisionLog = await readJsonl(path.join(SPEC_DIR, "decision_log.jsonl"));
  const reviewQueue = await readJson<JsonRecord[]>(path.join(SPEC_DIR, "review_queue.json"), []);

  const allow = decisionLog.filter((row) => String(row.decision ?? "") === "ALLOW").length;
  const block = decisionLog.filter((row) => String(row.decision ?? "") === "BLOCK").length;
  const decisionCount = allow + block;
  const proofVerified = decisionLog.filter((row) => String(row.proof_status ?? "") === "verified").length;
  const proofVerifiedRate = decisionCount > 0 ? proofVerified / decisionCount : 0;

  const strictGoNoGoPath = await getLatestByPrefix(ARTIFACTS_DIR, "strict-mode-go-no-go-", "file");
  const runtimeMetricsPath = await getLatestByPrefix(ARTIFACTS_DIR, "runtime-metrics-", "file");
  const e2eLiveFlowPath = await getLatestByPrefix(ARTIFACTS_DIR, "e2e-live-flow-", "dir");
  const integrationPath = await getLatestByPrefix(ARTIFACTS_DIR, "service-router-integration-", "dir");

  const strictGoNoGo = strictGoNoGoPath
    ? await readJson<JsonRecord>(strictGoNoGoPath, {})
    : ({} as JsonRecord);
  const runtimeMetrics = runtimeMetricsPath
    ? await readJson<JsonRecord>(runtimeMetricsPath, {})
    : ({} as JsonRecord);

  const evidence = [
    strictGoNoGoPath ? rel(strictGoNoGoPath) : null,
    runtimeMetricsPath ? rel(runtimeMetricsPath) : null,
    e2eLiveFlowPath ? rel(e2eLiveFlowPath) : null,
    integrationPath ? rel(integrationPath) : null,
    ...args.evidence
  ].filter((value): value is string => Boolean(value));

  const branch = safeGit("git rev-parse --abbrev-ref HEAD");
  const commit = safeGit("git rev-parse --short HEAD");

  const strictDecision = String(strictGoNoGo.decision ?? "UNKNOWN");
  const colosseumFieldText =
    `Progress update (${args.phase}): ${args.summary} ` +
    `Current governance metrics show allow=${allow}, block=${block}, proofVerifiedRate=${pct(proofVerifiedRate)}, ` +
    `reviewQueue=${reviewQueue.length}. Strict promotion gate latest decision is ${strictDecision}. ` +
    `Evidence artifacts are attached from runtime metrics, strict go/no-go, and end-to-end integration snapshots.`;

  const report = {
    reportType: "colosseum_progress_update",
    generatedAt,
    phase: args.phase,
    status: args.status,
    summary: args.summary,
    git: { branch, commit },
    kpis: {
      allow,
      block,
      decisions: decisionCount,
      proofVerified,
      proofVerifiedRate,
      reviewQueueSize: reviewQueue.length
    },
    strictGate: {
      decision: strictDecision,
      source: strictGoNoGoPath ? rel(strictGoNoGoPath) : null
    },
    runtimeMetrics: {
      source: runtimeMetricsPath ? rel(runtimeMetricsPath) : null,
      snapshot: runtimeMetrics
    },
    notes: {
      wins: args.wins,
      risks: args.risks,
      next: args.next
    },
    evidence,
    colosseumFieldText
  };

  let outputFile: string | null = null;
  if (args.write) {
    await fs.mkdir(COLOSSEUM_ARTIFACTS_DIR, { recursive: true });
    outputFile = path.join(COLOSSEUM_ARTIFACTS_DIR, `colosseum-update-${ts}.json`);
    await fs.writeFile(outputFile, JSON.stringify(report, null, 2), "utf8");

    const lines = [
      `## ${generatedAt} | ${args.phase} | ${args.status}`,
      `Summary: ${args.summary}`,
      `KPIs: allow=${allow}, block=${block}, proofVerifiedRate=${pct(proofVerifiedRate)}, reviewQueue=${reviewQueue.length}`,
      `Strict gate: ${strictDecision}`,
      args.wins.length ? `Wins: ${args.wins.join(" | ")}` : null,
      args.risks.length ? `Risks: ${args.risks.join(" | ")}` : null,
      args.next.length ? `Next: ${args.next.join(" | ")}` : null,
      evidence.length ? `Evidence: ${evidence.join(" | ")}` : null,
      `Colosseum-ready text: ${colosseumFieldText}`,
      ""
    ].filter(Boolean);
    await fs.appendFile(UPDATE_LOG_MD, `${lines.join("\n")}\n`, "utf8");
  }

  console.log(
    JSON.stringify(
      {
        status: "ok",
        outputFile: outputFile ? rel(outputFile) : null,
        markdownLog: rel(UPDATE_LOG_MD),
        report
      },
      null,
      2
    )
  );
}

main().catch((error) => {
  console.error("[colosseum_update_log] failed:", error instanceof Error ? error.message : String(error));
  process.exit(1);
});
