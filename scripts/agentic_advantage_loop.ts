import "dotenv/config";
import fs from "node:fs/promises";
import path from "node:path";
import { spawnSync } from "node:child_process";

type StepStatus = "pass" | "fail" | "skipped";

type StepResult = {
  name: string;
  status: StepStatus;
  exitCode?: number;
  stdoutTail?: string;
  stderrTail?: string;
  details?: Record<string, unknown>;
};

type Args = {
  phase: string;
  status: "planned" | "in_progress" | "blocked" | "done";
  summary?: string;
  skipOpenClaw: boolean;
  skipStrict: boolean;
  skipRuntimeMetrics: boolean;
  skipColosseumUpdate: boolean;
  skipRpcChecks: boolean;
};

const ROOT = process.cwd();
const ARTIFACTS_DIR = path.join(ROOT, "artifacts");

const nowIso = () => new Date().toISOString();
const ts = () => nowIso().replace(/[:.]/g, "-");

const tail = (value: string, lines = 40) => value.split(/\r?\n/).slice(-lines).join("\n");

const parseArgs = (): Args => {
  const raw = process.argv.slice(2);
  const lookup = Object.fromEntries(
    raw
      .filter((item) => item.startsWith("--"))
      .map((item) => {
        const [k, ...rest] = item.slice(2).split("=");
        return [k, rest.join("=") || "true"];
      })
  );

  return {
    phase: lookup.phase || "Phase 2 - Live Reliability Loop",
    status: (lookup.status as Args["status"]) || "in_progress",
    summary: lookup.summary || undefined,
    skipOpenClaw: lookup["skip-openclaw"] === "true",
    skipStrict: lookup["skip-strict"] === "true",
    skipRuntimeMetrics: lookup["skip-runtime-metrics"] === "true",
    skipColosseumUpdate: lookup["skip-colosseum-update"] === "true",
    skipRpcChecks: lookup["skip-rpc-checks"] === "true"
  };
};

const runPnpmScript = (scriptName: string): StepResult => {
  const run = spawnSync("pnpm", [scriptName], {
    cwd: ROOT,
    encoding: "utf8",
    maxBuffer: 1024 * 1024 * 8
  });
  return {
    name: scriptName,
    status: run.status === 0 ? "pass" : "fail",
    exitCode: run.status ?? -1,
    stdoutTail: tail(run.stdout || ""),
    stderrTail: tail(run.stderr || "")
  };
};

const buildGatekeeperRpcUrl = (): string | null => {
  if (process.env.GATEKEEPER_RPC_URL?.trim()) return process.env.GATEKEEPER_RPC_URL.trim();
  const helius = process.env.HELIUS_RPC_URL?.trim();
  if (!helius) return null;
  try {
    const u = new URL(helius);
    const apiKey = u.searchParams.get("api-key");
    if (!apiKey) return null;
    return `https://beta.helius-rpc.com/?api-key=${apiKey}`;
  } catch {
    return null;
  }
};

const rpcProbe = async (url: string) => {
  const call = async (method: string) => {
    const res = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ jsonrpc: "2.0", id: method, method })
    });
    const body = (await res.json()) as Record<string, unknown>;
    return { ok: res.ok, status: res.status, body };
  };

  const [health, slot] = await Promise.all([call("getHealth"), call("getSlot")]);
  const healthOk = !health.body.error;
  const slotOk = typeof slot.body.result === "number";

  return {
    ok: health.ok && slot.ok && healthOk && slotOk,
    health,
    slot
  };
};

const makeUpdateSummary = (steps: StepResult[]) => {
  const passed = steps.filter((s) => s.status === "pass").map((s) => s.name);
  const failed = steps.filter((s) => s.status === "fail").map((s) => s.name);
  const skipped = steps.filter((s) => s.status === "skipped").map((s) => s.name);
  return {
    passed,
    failed,
    skipped
  };
};

async function main() {
  const args = parseArgs();
  const generatedAt = nowIso();
  const runDir = path.join(ARTIFACTS_DIR, `agentic-advantage-loop-${ts()}`);
  await fs.mkdir(runDir, { recursive: true });

  const results: StepResult[] = [];

  if (args.skipOpenClaw) {
    results.push({ name: "validate:openclaw-upgrade", status: "skipped" });
  } else {
    results.push(runPnpmScript("validate:openclaw-upgrade"));
  }

  if (args.skipRpcChecks) {
    results.push({ name: "rpc:primary", status: "skipped" });
    results.push({ name: "rpc:gatekeeper", status: "skipped" });
  } else {
    const primaryUrl = process.env.HELIUS_RPC_URL?.trim();
    if (!primaryUrl) {
      results.push({
        name: "rpc:primary",
        status: "fail",
        details: { error: "HELIUS_RPC_URL is missing" }
      });
    } else {
      try {
        const check = await rpcProbe(primaryUrl);
        results.push({
          name: "rpc:primary",
          status: check.ok ? "pass" : "fail",
          details: {
            endpoint: primaryUrl,
            health: check.health,
            slot: check.slot
          }
        });
      } catch (error) {
        results.push({
          name: "rpc:primary",
          status: "fail",
          details: { error: error instanceof Error ? error.message : "unknown_error" }
        });
      }
    }

    const gatekeeper = buildGatekeeperRpcUrl();
    if (!gatekeeper) {
      results.push({
        name: "rpc:gatekeeper",
        status: "fail",
        details: { error: "GATEKEEPER_RPC_URL not configured and could not derive from HELIUS_RPC_URL" }
      });
    } else {
      try {
        const check = await rpcProbe(gatekeeper);
        results.push({
          name: "rpc:gatekeeper",
          status: check.ok ? "pass" : "fail",
          details: {
            endpoint: gatekeeper,
            health: check.health,
            slot: check.slot
          }
        });
      } catch (error) {
        results.push({
          name: "rpc:gatekeeper",
          status: "fail",
          details: { error: error instanceof Error ? error.message : "unknown_error" }
        });
      }
    }
  }

  if (args.skipStrict) {
    results.push({ name: "validate:strict-go-no-go", status: "skipped" });
  } else {
    results.push(runPnpmScript("validate:strict-go-no-go"));
  }

  if (args.skipRuntimeMetrics) {
    results.push({ name: "spec:runtime-metrics", status: "skipped" });
  } else {
    results.push(runPnpmScript("spec:runtime-metrics"));
  }

  const summary = makeUpdateSummary(results);
  const allPass = summary.failed.length === 0;

  const report = {
    reportType: "agentic_advantage_loop",
    generatedAt,
    phase: args.phase,
    status: allPass ? "pass" : "fail",
    summary: summary,
    checks: results
  };

  const reportFile = path.join(runDir, "report.json");
  await fs.writeFile(reportFile, JSON.stringify(report, null, 2), "utf8");

  let colosseumUpdate: StepResult = { name: "colosseum:update", status: "skipped" };
  if (!args.skipColosseumUpdate) {
    const phaseSummary =
      args.summary ||
      `Agentic loop executed: passed=${summary.passed.length}, failed=${summary.failed.length}, skipped=${summary.skipped.length}.`;
    const wins = summary.passed.slice(0, 4).join(",") || "no_passed_checks";
    const risks = summary.failed.length > 0 ? summary.failed.join(",") : "no_critical_failures";
    const next =
      summary.failed.length > 0
        ? "fix_failed_checks,rerun_agentic_loop"
        : "promote_best_checks_to_demo_and_partner_flow";

    const update = spawnSync(
      "pnpm",
      [
        "colosseum:update",
        `--phase=${args.phase}`,
        `--status=${args.status}`,
        `--summary=${phaseSummary}`,
        `--wins=${wins}`,
        `--risks=${risks}`,
        `--next=${next}`
      ],
      {
        cwd: ROOT,
        encoding: "utf8",
        maxBuffer: 1024 * 1024 * 8
      }
    );

    colosseumUpdate = {
      name: "colosseum:update",
      status: update.status === 0 ? "pass" : "fail",
      exitCode: update.status ?? -1,
      stdoutTail: tail(update.stdout || ""),
      stderrTail: tail(update.stderr || "")
    };
  }

  report.checks.push(colosseumUpdate);
  await fs.writeFile(reportFile, JSON.stringify(report, null, 2), "utf8");

  console.log(
    JSON.stringify(
      {
        status: "ok",
        runDir: path.relative(ROOT, runDir).replace(/\\/g, "/"),
        reportFile: path.relative(ROOT, reportFile).replace(/\\/g, "/"),
        report
      },
      null,
      2
    )
  );
}

main().catch((error) => {
  console.error("[agentic_advantage_loop] failed:", error instanceof Error ? error.message : String(error));
  process.exit(1);
});
