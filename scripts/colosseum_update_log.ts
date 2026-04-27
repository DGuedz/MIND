import fs from "node:fs/promises";
import path from "node:path";
import { execSync } from "node:child_process";
import { config } from "dotenv";

config({ override: true });

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
const STALE_HOURS_RAW = Number(process.env.COLOSSEUM_SNAPSHOT_STALE_HOURS ?? "24");
const STALE_HOURS = Number.isFinite(STALE_HOURS_RAW) && STALE_HOURS_RAW > 0 ? STALE_HOURS_RAW : 24;
const API_GATEWAY_URL = process.env.API_GATEWAY_URL ?? "http://localhost:3000";
const COLOSSEUM_API_BASE = process.env.COLOSSEUM_COPILOT_API_BASE ?? "https://copilot.colosseum.com/api/v1";
const COLOSSEUM_PAT = process.env.COLOSSEUM_COPILOT_PAT?.trim() ?? "";

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

const parseIsoMs = (value: unknown): number | null => {
  if (typeof value !== "string" || value.trim().length === 0) return null;
  const ms = Date.parse(value);
  return Number.isFinite(ms) ? ms : null;
};

const parsePathMs = (value: string | null): number | null => {
  if (!value) return null;
  const stamp = value.match(/(\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}Z)/)?.[1];
  if (!stamp) return null;
  const iso = stamp.replace(/T(\d{2})-(\d{2})-(\d{2})Z/, "T$1:$2:$3Z");
  const ms = Date.parse(iso);
  return Number.isFinite(ms) ? ms : null;
};

const age = (sourceMs: number | null, nowMs: number) => {
  if (sourceMs === null) return { stale: true, ageHours: null as number | null };
  const ageHours = Math.max(0, (nowMs - sourceMs) / 3_600_000);
  return {
    stale: ageHours > STALE_HOURS,
    ageHours
  };
};

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
  const nowMs = Date.parse(generatedAt);
  const ts = toTimestamp(generatedAt);

  const decisionLog = await readJsonl(path.join(SPEC_DIR, "decision_log.jsonl"));
  const reviewQueue = await readJson<JsonRecord[]>(path.join(SPEC_DIR, "review_queue.json"), []);

  const allow = decisionLog.filter((row) => String(row.decision ?? "") === "ALLOW").length;
  const block = decisionLog.filter((row) => String(row.decision ?? "") === "BLOCK").length;
  const decisionCount = allow + block;
  const proofVerified = decisionLog.filter((row) => String(row.proof_status ?? "") === "verified").length;
  const proofCheckedCount = decisionLog.filter((row) => String(row.proof_status ?? "").length > 0 && String(row.proof_status ?? "") !== "null").length;
  const proofVerifiedRate = proofCheckedCount > 0 ? proofVerified / proofCheckedCount : 0;

  const strictGoNoGoPath = await getLatestByPrefix(ARTIFACTS_DIR, "strict-mode-go-no-go-", "file");
  const installAndTestDir = await getLatestByPrefix(ARTIFACTS_DIR, "install-and-test-", "dir");
  const runtimeMetricsPath = await getLatestByPrefix(ARTIFACTS_DIR, "runtime-metrics-", "file");
  const e2eLiveFlowPath = await getLatestByPrefix(ARTIFACTS_DIR, "e2e-live-flow-", "dir");
  const integrationPath = await getLatestByPrefix(ARTIFACTS_DIR, "service-router-integration-", "dir");

  const installAndTestReportPath = installAndTestDir ? path.join(installAndTestDir, "install_and_test_report.json") : null;

  const strictGoNoGo = strictGoNoGoPath
    ? await readJson<JsonRecord>(strictGoNoGoPath, {})
    : ({} as JsonRecord);
  const installAndTest = installAndTestReportPath
    ? await readJson<JsonRecord>(installAndTestReportPath, {})
    : ({} as JsonRecord);
  const runtimeMetrics = runtimeMetricsPath
    ? await readJson<JsonRecord>(runtimeMetricsPath, {})
    : ({} as JsonRecord);

  const strictGoNoGoMs = parseIsoMs(strictGoNoGo.generatedAt) ?? parsePathMs(strictGoNoGoPath);
  const installAndTestMs = parseIsoMs(installAndTest.timestamp) ?? parsePathMs(installAndTestDir);
  const currentGateFromInstall = installAndTestMs !== null && (strictGoNoGoMs === null || installAndTestMs >= strictGoNoGoMs);

  const strictDecision = String(strictGoNoGo.decision ?? "UNKNOWN");
  const installOverall = String(installAndTest.overall ?? "UNKNOWN");
  const currentGateDecision = currentGateFromInstall
    ? installOverall === "PASS"
      ? "GO"
      : installOverall === "FAIL"
        ? "NO_GO"
        : "UNKNOWN"
    : strictDecision;
  const currentGateSource = currentGateFromInstall
    ? installAndTestReportPath
      ? rel(installAndTestReportPath)
      : null
    : strictGoNoGoPath
      ? rel(strictGoNoGoPath)
      : null;

  let apiGatewayReachable = false;
  let apiGatewayHealth: JsonRecord | null = null;
  try {
    const resp = await fetch(`${API_GATEWAY_URL}/v1/health/services`);
    if (resp.ok) {
      apiGatewayReachable = true;
      apiGatewayHealth = (await resp.json()) as JsonRecord;
    }
  } catch {
    apiGatewayReachable = false;
  }

  let copilotAuthenticated = false;
  let copilotStatusCode: number | null = null;
  if (COLOSSEUM_PAT.length > 0) {
    try {
      const statusResp = await fetch(`${COLOSSEUM_API_BASE}/status`, {
        headers: { Authorization: `Bearer ${COLOSSEUM_PAT}` }
      });
      copilotStatusCode = statusResp.status;
      copilotAuthenticated = statusResp.ok;
    } catch {
      copilotAuthenticated = false;
    }
  }

  const runtimeGeneratedMs = parseIsoMs((runtimeMetrics as JsonRecord).generated_at);
  const runtimeAge = age(runtimeGeneratedMs, nowMs);

  const evidence = [
    strictGoNoGoPath ? rel(strictGoNoGoPath) : null,
    installAndTestReportPath ? rel(installAndTestReportPath) : null,
    runtimeMetricsPath ? rel(runtimeMetricsPath) : null,
    e2eLiveFlowPath ? rel(e2eLiveFlowPath) : null,
    integrationPath ? rel(integrationPath) : null,
    ...args.evidence
  ].filter((value): value is string => Boolean(value));

  const branch = safeGit("git rev-parse --abbrev-ref HEAD");
  const commit = safeGit("git rev-parse --short HEAD");

  const colosseumFieldText =
    `Progress update (${args.phase}): ${args.summary} ` +
    `Current governance metrics show allow=${allow}, block=${block}, proofVerifiedRate=${pct(proofVerifiedRate)}, ` +
    `proofChecked=${proofCheckedCount}, reviewQueue=${reviewQueue.length}. ` +
    `Current gate decision is ${currentGateDecision} from ${currentGateSource ?? "unknown_source"}. ` +
    `Runtime metrics stale=${runtimeAge.stale}. API gateway reachable=${apiGatewayReachable}. Copilot authenticated=${copilotAuthenticated}. ` +
    `Evidence artifacts are attached from runtime metrics, strict gate/install gate, and end-to-end integration snapshots.`;

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
      proofChecked: proofCheckedCount,
      proofVerifiedRate,
      reviewQueueSize: reviewQueue.length
    },
    currentGate: {
      decision: currentGateDecision,
      source: currentGateSource,
      strictGoNoGo: {
        decision: strictDecision,
        source: strictGoNoGoPath ? rel(strictGoNoGoPath) : null,
        generatedAt: strictGoNoGo.generatedAt ?? null
      },
      installAndTest: {
        overall: installOverall,
        source: installAndTestReportPath ? rel(installAndTestReportPath) : null,
        generatedAt: installAndTest.timestamp ?? null
      }
    },
    runtimeMetrics: {
      source: runtimeMetricsPath ? rel(runtimeMetricsPath) : null,
      stale: runtimeAge.stale,
      ageHours: runtimeAge.ageHours,
      snapshot: runtimeMetrics
    },
    serviceHealth: {
      apiGatewayUrl: API_GATEWAY_URL,
      apiGatewayReachable,
      snapshot: apiGatewayHealth
    },
    copilot: {
      apiBase: COLOSSEUM_API_BASE,
      patConfigured: COLOSSEUM_PAT.length > 0,
      authenticated: copilotAuthenticated,
      statusCode: copilotStatusCode
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
      `KPIs: allow=${allow}, block=${block}, proofVerifiedRate=${pct(proofVerifiedRate)}, proofChecked=${proofCheckedCount}, reviewQueue=${reviewQueue.length}`,
      `Current gate: ${currentGateDecision} (${currentGateSource ?? "unknown_source"})`,
      `Runtime metrics stale: ${runtimeAge.stale}${runtimeAge.ageHours === null ? "" : ` (ageHours=${runtimeAge.ageHours.toFixed(2)})`}`,
      `API gateway reachable: ${apiGatewayReachable}`,
      `Copilot authenticated: ${copilotAuthenticated}${copilotStatusCode === null ? "" : ` (status=${copilotStatusCode})`}`,
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
