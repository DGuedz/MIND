import "dotenv/config";
import { spawn, type ChildProcess } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";
import { setTimeout as wait } from "node:timers/promises";

type JsonRecord = Record<string, unknown>;

type Args = {
  dryRun: boolean;
  startServices: boolean;
  outDir?: string;
};

type StepResult = {
  step: string;
  ok: boolean;
  statusCode?: number;
  message?: string;
  details?: unknown;
};

const nowIso = () => new Date().toISOString();
const stamp = () => nowIso().replace(/[:.]/g, "-");

const parseArgs = (): Args => {
  const pairs = process.argv.slice(2).filter((item) => item.startsWith("--"));
  const parsed = Object.fromEntries(
    pairs.map((item) => {
      const [k, ...rest] = item.slice(2).split("=");
      return [k, rest.length > 0 ? rest.join("=") : "true"];
    })
  );

  return {
    dryRun: parsed["dry-run"] !== "false",
    startServices: parsed["start-services"] !== "false",
    outDir: parsed["out-dir"]
  };
};

const parseJsonSafe = (value: string): unknown => {
  try {
    return JSON.parse(value) as unknown;
  } catch {
    return value;
  }
};

const postJson = async (url: string, body: unknown) => {
  const response = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body)
  });
  const raw = await response.text();
  return { statusCode: response.status, ok: response.ok, data: parseJsonSafe(raw), raw };
};

const getJson = async (url: string) => {
  const response = await fetch(url);
  const raw = await response.text();
  return { statusCode: response.status, ok: response.ok, data: parseJsonSafe(raw), raw };
};

const waitForHealth = async (url: string, timeoutMs = 25000) => {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const response = await fetch(`${url}/health`);
      if (response.ok) return;
    } catch {
      // retry
    }
    await wait(300);
  }
  throw new Error(`health_timeout:${url}`);
};

const spawnService = (label: string, filePath: string, env: NodeJS.ProcessEnv): ChildProcess => {
  const child = spawn("pnpm", ["exec", "tsx", filePath], {
    cwd: process.cwd(),
    env,
    stdio: ["ignore", "pipe", "pipe"]
  });

  child.stdout?.on("data", (chunk) => process.stdout.write(`[${label}] ${chunk}`));
  child.stderr?.on("data", (chunk) => process.stderr.write(`[${label}] ${chunk}`));

  return child;
};

const terminate = async (child: ChildProcess | null) => {
  if (!child || child.killed) return;
  child.kill("SIGTERM");
  await wait(500);
  if (!child.killed) {
    child.kill("SIGKILL");
  }
};

const asNumber = (value: unknown): number | null => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

async function main() {
  const args = parseArgs();
  const startedAt = Date.now();
  const repoRoot = process.cwd();
  const artifactDir = args.outDir
    ? path.resolve(args.outDir)
    : path.join(repoRoot, "artifacts", `jupiter-frontier-integration-${stamp()}`);
  await fs.mkdir(artifactDir, { recursive: true });

  const intentPort = Number(process.env.JUPITER_IT_INTENT_PORT ?? "3111");
  const marketPort = Number(process.env.JUPITER_IT_MARKET_PORT ?? "3112");

  const intentUrl = process.env.JUPITER_IT_INTENT_URL ?? `http://127.0.0.1:${intentPort}`;
  const marketUrl = process.env.JUPITER_IT_MARKET_URL ?? `http://127.0.0.1:${marketPort}`;

  const baseEnv: NodeJS.ProcessEnv = {
    ...process.env,
    INTENT_SERVICE_PORT: String(intentPort),
    MARKET_CONTEXT_SERVICE_PORT: String(marketPort)
  };

  let intentChild: ChildProcess | null = null;
  let marketChild: ChildProcess | null = null;

  const steps: StepResult[] = [];

  try {
    if (args.startServices) {
      intentChild = spawnService("intent-service", "services/intent-service/src/index.ts", baseEnv);
      marketChild = spawnService("market-context-service", "services/market-context-service/src/index.ts", baseEnv);
    }

    await waitForHealth(intentUrl);
    await waitForHealth(marketUrl);

    const [intentDb, marketDb] = await Promise.all([
      getJson(`${intentUrl}/health/db`),
      getJson(`${marketUrl}/health/db`)
    ]);

    await fs.writeFile(
      path.join(artifactDir, "health_checks.json"),
      JSON.stringify(
        {
          generatedAt: nowIso(),
          intentHealthDb: intentDb,
          marketHealthDb: marketDb
        },
        null,
        2
      ),
      "utf8"
    );

    if (!intentDb.ok || !marketDb.ok) {
      steps.push({
        step: "db_health",
        ok: false,
        message: "intent-service or market-context-service db health failed",
        details: { intentDb, marketDb }
      });
      throw new Error("db_health_failed");
    }

    const enrichRequest = {
      source: "jupiter",
      payload: {
        intentId: `jupiter-it-${Date.now()}`,
        inputMint:
          process.env.JUPITER_PHASE2_INPUT_MINT ?? "So11111111111111111111111111111111111111112",
        outputMint:
          process.env.JUPITER_PHASE2_OUTPUT_MINT ?? "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
        slippageBps: 50,
        dryRun: args.dryRun
      }
    };

    const enrichResponse = await postJson(`${marketUrl}/v1/market-context/enrich`, enrichRequest);
    await fs.writeFile(
      path.join(artifactDir, "step1_enrich_response.json"),
      JSON.stringify({ request: enrichRequest, response: enrichResponse }, null, 2),
      "utf8"
    );

    const enrichData = (enrichResponse.data as JsonRecord) ?? {};
    const enrichResult = (enrichData.result as JsonRecord) ?? {};
    const snapshotHash =
      (enrichResult.snapshotHash as string | undefined) ??
      (enrichResult.snapshot_hash as string | undefined) ??
      null;
    const policyContext = (enrichResult.policyContext as JsonRecord | undefined) ?? undefined;

    steps.push({
      step: "jupiter_enrich",
      ok: enrichResponse.ok && typeof snapshotHash === "string" && snapshotHash.length > 0,
      statusCode: enrichResponse.statusCode,
      details: {
        mocked: enrichResult.mocked,
        status: enrichResult.status,
        reason: enrichResult.reason,
        snapshotHash
      }
    });

    if (!(enrichResponse.ok && snapshotHash)) {
      throw new Error("jupiter_enrich_failed");
    }

    const intentRequest = {
      creatorAgentId: "mind_jupiter_it_agent",
      targetAgentId: "mind_execution_agent",
      asset: "SOL",
      action: "rebalance",
      amount: "1",
      notional: "1",
      confidence: 0.84,
      riskScore: 0.25,
      expectedProfitBps: 30,
      latencyPenaltyBps: asNumber(policyContext?.latencyPenaltyBps) ?? 2,
      mevRiskScore: asNumber(policyContext?.mevRiskScore) ?? 0.03,
      expiryTs: new Date(Date.now() + 20 * 60_000).toISOString(),
      policyId: "policy_v1",
      marketContextId: snapshotHash
    };

    const intentResponse = await postJson(`${intentUrl}/v1/intents`, intentRequest);
    await fs.writeFile(
      path.join(artifactDir, "step2_intent_response.json"),
      JSON.stringify({ request: intentRequest, response: intentResponse }, null, 2),
      "utf8"
    );

    const intentData = (intentResponse.data as JsonRecord) ?? {};
    const intentId = (intentData.intentId as string | undefined) ?? null;

    steps.push({
      step: "intent_create",
      ok: intentResponse.ok && typeof intentId === "string" && intentId.length > 0,
      statusCode: intentResponse.statusCode,
      details: { intentId }
    });

    if (!(intentResponse.ok && intentId)) {
      throw new Error("intent_create_failed");
    }

    const effectiveSlippage = Math.min(50, asNumber(policyContext?.suggestedMaxSlippageBps) ?? 50);

    const policyRequest = {
      maxSlippageBps: effectiveSlippage,
      economics: {
        expectedProfitBps: 30,
        executionCostBps: effectiveSlippage,
        latencyPenaltyBps: asNumber(policyContext?.latencyPenaltyBps) ?? 2,
        mevRiskScore: asNumber(policyContext?.mevRiskScore) ?? 0.03,
        riskBufferBps: asNumber(policyContext?.riskBufferBps) ?? 10,
        notional: 1,
        marketTokenVerificationRatio: asNumber(policyContext?.tokenVerificationRatio) ?? undefined
      },
      marketContext: {
        source: "jupiter",
        policyContext: policyContext ?? undefined
      }
    };

    const policyResponse = await postJson(`${intentUrl}/v1/intents/${intentId}/policy/check`, policyRequest);
    await fs.writeFile(
      path.join(artifactDir, "step3_policy_check_response.json"),
      JSON.stringify({ request: policyRequest, response: policyResponse }, null, 2),
      "utf8"
    );

    const policyData = (policyResponse.data as JsonRecord) ?? {};
    steps.push({
      step: "policy_check",
      ok: policyResponse.ok,
      statusCode: policyResponse.statusCode,
      details: {
        allowed: policyData.allowed,
        decision: policyData.decision,
        reasons: policyData.reasons
      }
    });

    const pass = steps.every((step) => step.ok);

    const report = {
      generatedAt: nowIso(),
      elapsedMs: Date.now() - startedAt,
      pass,
      dryRun: args.dryRun,
      intentUrl,
      marketUrl,
      steps
    };

    await fs.writeFile(path.join(artifactDir, "report.json"), JSON.stringify(report, null, 2), "utf8");
    console.log(JSON.stringify(report, null, 2));

    if (!pass) {
      process.exit(1);
    }
  } catch (error) {
    const report = {
      generatedAt: nowIso(),
      elapsedMs: Date.now() - startedAt,
      pass: false,
      dryRun: args.dryRun,
      intentUrl,
      marketUrl,
      steps,
      error: error instanceof Error ? error.message : String(error)
    };
    await fs.writeFile(path.join(artifactDir, "report.json"), JSON.stringify(report, null, 2), "utf8");
    console.log(JSON.stringify(report, null, 2));
    process.exit(1);
  } finally {
    await Promise.all([terminate(intentChild), terminate(marketChild)]);
  }
}

main().catch((error) => {
  console.error("[jupiter_frontier_integration_test] failed:", error);
  process.exit(1);
});
