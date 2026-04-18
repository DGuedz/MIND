import "dotenv/config";
import fs from "node:fs/promises";
import path from "node:path";
import { CreateIntentInputSchema } from "@mind/schemas";
import { fetchJupiterContext } from "../services/market-context-service/src/adapters/jupiter.js";

type CliArgs = {
  dryRun: boolean;
  outDir?: string;
};

const SOL_MINT = "So11111111111111111111111111111111111111112";
const USDC_MINT = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";

const parseNumber = (value: unknown): number | null => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const nowIso = () => new Date().toISOString();

const parseArgs = (): CliArgs => {
  const pairs = process.argv.slice(2).filter((arg) => arg.startsWith("--"));
  const args = Object.fromEntries(
    pairs.map((pair) => {
      const [k, ...rest] = pair.slice(2).split("=");
      return [k, rest.length > 0 ? rest.join("=") : "true"];
    })
  );

  return {
    dryRun: args["dry-run"] === "true",
    outDir: args["out-dir"]
  };
};

const buildBaseIntent = () => {
  const amount = process.env.JUPITER_PHASE2_AMOUNT ?? "1";
  const notional = process.env.JUPITER_PHASE2_NOTIONAL ?? amount;

  return {
    creatorAgentId: process.env.JUPITER_PHASE2_CREATOR_AGENT_ID ?? "mind_jupiter_agent",
    targetAgentId: process.env.JUPITER_PHASE2_TARGET_AGENT_ID ?? "mind_execution_agent",
    asset: process.env.JUPITER_PHASE2_ASSET ?? "SOL",
    action: (process.env.JUPITER_PHASE2_ACTION as "buy" | "sell" | "rebalance" | "monitor") ?? "rebalance",
    amount,
    notional,
    confidence: parseNumber(process.env.JUPITER_PHASE2_CONFIDENCE) ?? 0.8,
    riskScore: parseNumber(process.env.JUPITER_PHASE2_RISK_SCORE) ?? 0.3,
    expectedProfitBps: parseNumber(process.env.JUPITER_PHASE2_EXPECTED_PROFIT_BPS) ?? undefined,
    latencyPenaltyBps: parseNumber(process.env.JUPITER_PHASE2_LATENCY_PENALTY_BPS) ?? undefined,
    mevRiskScore: parseNumber(process.env.JUPITER_PHASE2_MEV_RISK_SCORE) ?? undefined,
    expiryTs: new Date(Date.now() + 30 * 60_000).toISOString(),
    policyId: process.env.JUPITER_PHASE2_POLICY_ID ?? "policy_v1",
    marketContextId: undefined
  };
};

const ensureDir = async (dir: string) => {
  await fs.mkdir(dir, { recursive: true });
};

async function main() {
  const args = parseArgs();
  const startedAt = Date.now();

  const inputMint = process.env.JUPITER_PHASE2_INPUT_MINT ?? SOL_MINT;
  const outputMint = process.env.JUPITER_PHASE2_OUTPUT_MINT ?? USDC_MINT;
  const requestedSlippageBps = parseNumber(process.env.JUPITER_PHASE2_MAX_SLIPPAGE_BPS) ?? 50;

  const enrichmentResult = await fetchJupiterContext({
    intentId: process.env.JUPITER_PHASE2_INTENT_ID ?? "phase2-demo-intent",
    inputMint,
    outputMint,
    slippageBps: requestedSlippageBps,
    dryRun: args.dryRun
  });

  const baseIntent = buildBaseIntent();
  const enrichedIntentPayload = {
    ...baseIntent,
    marketContextId: enrichmentResult.snapshotHash,
    latencyPenaltyBps:
      baseIntent.latencyPenaltyBps ?? enrichmentResult.policyContext.latencyPenaltyBps,
    mevRiskScore: baseIntent.mevRiskScore ?? enrichmentResult.policyContext.mevRiskScore
  };

  const validatedIntent = CreateIntentInputSchema.safeParse(enrichedIntentPayload);

  const effectiveSlippageBps = Math.min(
    requestedSlippageBps,
    enrichmentResult.policyContext.suggestedMaxSlippageBps
  );

  const intentNotional = parseNumber(enrichedIntentPayload.notional ?? enrichedIntentPayload.amount);

  const policyReadyContext = {
    maxSlippageBps: effectiveSlippageBps,
    policy: {
      maxAmount: process.env.POLICY_MAX_AMOUNT ?? null,
      maxRiskScore: process.env.POLICY_MAX_RISK_SCORE ?? null,
      maxSlippageBps: process.env.POLICY_MAX_SLIPPAGE_BPS ?? null,
      requireApprovalOver: process.env.POLICY_REQUIRE_APPROVAL_OVER ?? null
    },
    economics: {
      expectedProfitBps: enrichedIntentPayload.expectedProfitBps ?? 0,
      executionCostBps: effectiveSlippageBps,
      latencyPenaltyBps: enrichedIntentPayload.latencyPenaltyBps ?? 0,
      mevRiskScore: enrichedIntentPayload.mevRiskScore ?? 0,
      riskBufferBps: enrichmentResult.policyContext.riskBufferBps,
      notional: intentNotional ?? undefined,
      marketTokenVerificationRatio: enrichmentResult.policyContext.tokenVerificationRatio
    },
    marketContext: {
      source: "jupiter",
      policyContext: enrichmentResult.policyContext
    }
  };

  const outputDir = args.outDir
    ? path.resolve(args.outDir)
    : enrichmentResult.artifactDir;

  await ensureDir(outputDir);
  await Promise.all([
    fs.writeFile(
      path.join(outputDir, "jupiter_price_snapshot.json"),
      JSON.stringify(enrichmentResult.price, null, 2),
      "utf8"
    ),
    fs.writeFile(
      path.join(outputDir, "token_context.json"),
      JSON.stringify(enrichmentResult.tokens, null, 2),
      "utf8"
    ),
    fs.writeFile(
      path.join(outputDir, "enriched_intent_payload.json"),
      JSON.stringify(enrichedIntentPayload, null, 2),
      "utf8"
    ),
    fs.writeFile(
      path.join(outputDir, "policy_ready_context.json"),
      JSON.stringify(policyReadyContext, null, 2),
      "utf8"
    ),
    fs.writeFile(
      path.join(outputDir, "phase2_summary.json"),
      JSON.stringify(
        {
          generatedAt: nowIso(),
          elapsedMs: Date.now() - startedAt,
          status: enrichmentResult.status,
          mocked: enrichmentResult.mocked,
          source: "jupiter",
          artifactDir: outputDir,
          snapshotHash: enrichmentResult.snapshotHash,
          priceEndpoint: enrichmentResult.price.endpoint,
          tokensEndpoint: enrichmentResult.tokens.endpoint,
          intentSchemaValid: validatedIntent.success,
          dryRun: args.dryRun,
          policyReadyContext
        },
        null,
        2
      ),
      "utf8"
    )
  ]);

  const output = {
    status: enrichmentResult.status,
    mocked: enrichmentResult.mocked,
    source: "jupiter",
    artifactDir: outputDir,
    snapshotHash: enrichmentResult.snapshotHash,
    enrichedIntentPayload,
    policyReadyContext,
    intentValidation: validatedIntent.success
      ? { valid: true }
      : { valid: false, details: validatedIntent.error.flatten() }
  };

  console.log(JSON.stringify(output, null, 2));

  if (enrichmentResult.status === "failed" && !enrichmentResult.mocked) {
    process.exit(1);
  }

  if (!validatedIntent.success) {
    process.exit(1);
  }
}

main().catch((error) => {
  console.error("[jupiter_frontier_phase2] failed:", error);
  process.exit(1);
});
