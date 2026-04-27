import { config } from "dotenv";
import fs from "node:fs/promises";
import path from "node:path";
import { execSync } from "node:child_process";

config({ override: true });

type ReasonCode =
  | "RC_POLICY_VIOLATION"
  | "RC_PROMPT_INJECTION"
  | "RC_SECRET_EXFIL_ATTEMPT"
  | "RC_UNTRUSTED_OVERRIDE_ATTEMPT"
  | "RC_MISSING_EVIDENCE"
  | "RC_HIGH_RISK_NO_APPROVAL"
  | "RC_TOOL_FAILURE"
  | "RC_RATE_LIMIT_OR_RPC_BLOCKED";

type JsonRecord = Record<string, unknown>;

const ROOT = process.cwd();
const ARTIFACTS_DIR = path.join(ROOT, "artifacts");

const API_GATEWAY_URL = process.env.API_GATEWAY_URL ?? "http://localhost:3000";
const COLOSSEUM_API_BASE = process.env.COLOSSEUM_COPILOT_API_BASE ?? "https://copilot.colosseum.com/api/v1";
const COLOSSEUM_PAT = process.env.COLOSSEUM_COPILOT_PAT?.trim() ?? "";

const nowIso = () => new Date().toISOString();
const toStamp = (iso: string) => iso.replace(/[:.]/g, "-");

const safeGit = (cmd: string) => {
  try {
    return execSync(cmd, { cwd: ROOT, stdio: ["ignore", "pipe", "ignore"] }).toString("utf8").trim();
  } catch {
    return "unknown";
  }
};

const tryJson = async (url: string): Promise<{ ok: boolean; status: number | null; json: JsonRecord | null }> => {
  try {
    const res = await fetch(url);
    const status = res.status;
    if (!res.ok) return { ok: false, status, json: null };
    const json = (await res.json()) as JsonRecord;
    return { ok: true, status, json };
  } catch {
    return { ok: false, status: null, json: null };
  }
};

const checkCopilot = async (): Promise<{ patConfigured: boolean; authenticated: boolean; status: number | null }> => {
  if (!COLOSSEUM_PAT) return { patConfigured: false, authenticated: false, status: null };
  try {
    const res = await fetch(`${COLOSSEUM_API_BASE}/status`, {
      headers: { Authorization: `Bearer ${COLOSSEUM_PAT}` }
    });
    return { patConfigured: true, authenticated: res.ok, status: res.status };
  } catch {
    return { patConfigured: true, authenticated: false, status: null };
  }
};

async function main() {
  const generatedAt = nowIso();
  const ts = toStamp(generatedAt);
  const reasonCodes = new Set<ReasonCode>();
  const evidence: string[] = [];

  const iCloudWorktreeDetected = /Mobile Documents|com~apple~CloudDocs/.test(ROOT);
  if (iCloudWorktreeDetected) {
    reasonCodes.add("RC_TOOL_FAILURE");
    evidence.push("Worktree under iCloud Drive can cause non-deterministic behavior (pnpm hang risk).");
  }

  const git = {
    branch: safeGit("git rev-parse --abbrev-ref HEAD"),
    commit: safeGit("git rev-parse --short HEAD"),
    dirty: safeGit("git status --porcelain").length > 0
  };

  const health = await tryJson(`${API_GATEWAY_URL}/v1/health/services`);
  const apiGatewayReachable = health.ok;
  if (!apiGatewayReachable) {
    reasonCodes.add("RC_TOOL_FAILURE");
    evidence.push(`API Gateway not reachable at ${API_GATEWAY_URL}.`);
  }

  const servicesOk =
    health.ok &&
    String(health.json?.status ?? "") === "ok" &&
    Array.isArray(health.json?.services) &&
    (health.json?.services as Array<{ name?: string; status?: string }>).every((s) => s.status === "ok");
  if (apiGatewayReachable && !servicesOk) {
    reasonCodes.add("RC_TOOL_FAILURE");
    evidence.push("/v1/health/services returned non-ok service statuses.");
  }

  const copilot = await checkCopilot();
  if (copilot.patConfigured && !copilot.authenticated) {
    reasonCodes.add("RC_MISSING_EVIDENCE");
    evidence.push("COLOSSEUM_COPILOT_PAT configured but authentication failed (/status not ok).");
  }

  const decision = reasonCodes.size === 0 ? "ALLOW" : "BLOCK";
  const report = {
    reportType: "runtime_health",
    generatedAt,
    decisionContract: {
      decision,
      reason_codes: Array.from(reasonCodes),
      confidence: decision === "ALLOW" ? 0.9 : 0.99,
      assumptions: ["This check validates local runtime reachability and evidence freshness gates."],
      required_followups:
        decision === "ALLOW"
          ? []
          : [
              !apiGatewayReachable ? "Start services and ensure /v1/health/services returns ok." : null,
              iCloudWorktreeDetected ? "Move repo out of iCloud Drive and rerun." : null,
              copilot.patConfigured && !copilot.authenticated ? "Refresh COLOSSEUM_COPILOT_PAT." : null
            ].filter((v): v is string => Boolean(v)),
      evidence
    },
    env: {
      apiGatewayUrl: API_GATEWAY_URL,
      colosseumApiBase: COLOSSEUM_API_BASE,
      colosseumPatConfigured: copilot.patConfigured
    },
    git,
    filesystem: {
      rootDir: ROOT,
      iCloudWorktreeDetected
    },
    apiGateway: {
      reachable: apiGatewayReachable,
      status: health.status,
      snapshot: health.json
    },
    copilot
  };

  await fs.mkdir(ARTIFACTS_DIR, { recursive: true });
  const outputFile = path.join(ARTIFACTS_DIR, `runtime-health-${ts}.json`);
  await fs.writeFile(outputFile, JSON.stringify(report, null, 2), "utf8");

  console.log(JSON.stringify({ status: decision === "ALLOW" ? "ok" : "fail", outputFile, report }, null, 2));
  if (decision !== "ALLOW") process.exitCode = 1;
}

main().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error("[runtime_health] failed:", message);
  process.exit(1);
});

