import { createHash, randomUUID } from "node:crypto";
import { config } from "dotenv";
import { getJson, HttpRequestError, postJson } from "../apps/api-gateway/src/http.js";

config({ override: true });

type PolicyDecision = "ALLOW" | "REJECT" | "REQUIRE_APPROVAL";
type ApprovalDecision = "approved" | "rejected" | null;
type ExecutionMode = "simulated" | "real";
type DexProtocol = "JUPITER" | "ORCA" | "RAYDIUM" | "METEORA";

type ApprovalRecord = {
  id: string;
  intentId: string;
  decision: ApprovalDecision;
  decidedAt: string | null;
  createdAt: string;
};

type Anchor = { type: string; hash: string };

type FinalDemoOutput = {
  intentId: string | null;
  approvalId: string | null;
  executionId: string | null;
  routeUsed: string | null;
  EV_net: number | null;
  decision: PolicyDecision | null;
  txHash: string | null;
  receiptHash: string | null;
  route_hash: string | null;
  execution_hash: string | null;
  proofId: string | null;
  proofHash: string | null;
  proofVerified: boolean | null;
  metaplexConfirmed: boolean | null;
  externalAnchorStatus: "pending" | "confirmed" | "failed" | null;
  metaplex_proof_tx: string | null;
  metaplex_registry_ref: string | null;
  status: "completed" | "stopped" | "failed";
  elapsedMs: number;
  error: string | null;
};

const API_GATEWAY_URL = process.env.API_GATEWAY_URL ?? "http://localhost:3000";
const INTENT_SERVICE_URL = process.env.INTENT_SERVICE_URL ?? "http://localhost:3001";
const MARKET_CONTEXT_SERVICE_URL = process.env.MARKET_CONTEXT_SERVICE_URL ?? "http://localhost:3002";
const APPROVAL_GATEWAY_SERVICE_URL = process.env.APPROVAL_GATEWAY_SERVICE_URL ?? "http://localhost:3003";
const PROOF_SERVICE_URL = process.env.PROOF_SERVICE_URL ?? "http://localhost:3005";

const chatId = process.env.TEST_TG_CHAT_ID ?? "";
const demoWallet =
  process.env.DEMO_WALLET ?? "So11111111111111111111111111111111111111112";
const toExecutionMode = (value: string | undefined): ExecutionMode =>
  value === "real" ? "real" : "simulated";

const toProtocol = (value: string | undefined): DexProtocol => {
  if (value === "ORCA" || value === "RAYDIUM" || value === "METEORA") {
    return value;
  }
  return "JUPITER";
};

const executionMode = toExecutionMode(process.env.DEMO_EXECUTION_MODE);
const autoApprove = (process.env.DEMO_AUTO_APPROVE ?? "true") === "true";
const strictCovalent = process.env.DEMO_STRICT_COVALENT === "true";
const approvalTimeoutSec = Number(process.env.DEMO_APPROVAL_TIMEOUT_SEC ?? "25");
const strictMetaplexAnchor = (process.env.STRICT_METAPLEX_ANCHOR ?? "false") === "true";
const maxSlippageBps = Number(process.env.DEMO_MAX_SLIPPAGE_BPS ?? "50");
const amount = process.env.DEMO_AMOUNT ?? "0.25";
const protocol = toProtocol(process.env.DEMO_PROTOCOL);
const assetIn = process.env.DEMO_ASSET_IN ?? "SOL";
const assetOut = process.env.DEMO_ASSET_OUT ?? "USDC";
const expectedProfitBps = Number(process.env.DEMO_EXPECTED_PROFIT_BPS ?? "26");
const latencyPenaltyBps = Number(process.env.DEMO_LATENCY_PENALTY_BPS ?? "4");
const mevRiskScore = Number(process.env.DEMO_MEV_RISK_SCORE ?? "0.06");
const notional = Number(process.env.DEMO_NOTIONAL ?? amount);
const externalAnchorStatusInput = process.env.DEMO_EXTERNAL_ANCHOR_STATUS;
const metaplexProofTx = process.env.DEMO_METAPLEX_PROOF_TX;
const metaplexRegistryRef =
  process.env.DEMO_METAPLEX_REGISTRY_REF ?? process.env.METAPLEX_REGISTRY_ENDPOINT;

const HARD_DEADLINE_MS = 60_000;
const DEFAULT_STEP_TIMEOUT_MS = 10_000;
const APPROVAL_POLL_INTERVAL_MS = 1_000;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const toIsoInFuture = (minutes: number) =>
  new Date(Date.now() + minutes * 60_000).toISOString();

const toCanonical = (value: unknown): string => {
  if (value === null || value === undefined) return "null";
  if (Array.isArray(value)) return `[${value.map(toCanonical).join(",")}]`;
  if (typeof value === "object") {
    const obj = value as Record<string, unknown>;
    const keys = Object.keys(obj).sort();
    return `{${keys.map((key) => `${JSON.stringify(key)}:${toCanonical(obj[key])}`).join(",")}}`;
  }
  return JSON.stringify(value);
};

const hashValue = (value: unknown) => createHash("sha256").update(toCanonical(value)).digest("hex");

const timestamp = () => new Date().toISOString();
const log = (msg: string) => console.log(`[${timestamp()}] ${msg}`);
const printStep = (step: string, detail: string) => log(`[${step}] ${detail}`);

const parseErrorMessage = (error: unknown): string => {
  if (error instanceof HttpRequestError) {
    return `http_error status=${error.statusCode} method=${error.method} url=${error.url} body=${error.body}`;
  }
  return error instanceof Error ? error.message : String(error);
};

const derivePolicyDecision = (policy: {
  decision?: PolicyDecision;
  allowed?: boolean;
  requiresApproval?: boolean;
}): PolicyDecision => {
  if (policy.decision) return policy.decision;
  if (policy.allowed === false) return "REJECT";
  if (policy.requiresApproval) return "REQUIRE_APPROVAL";
  return "ALLOW";
};

const deriveRouteUsed = (runData: {
  route?: { routePlan?: string[]; adapter?: string };
}): string | null => {
  const routePlan = runData.route?.routePlan ?? [];
  if (routePlan.length > 0) {
    return routePlan.join(" -> ");
  }
  if (runData.route?.adapter) {
    return runData.route.adapter;
  }
  return null;
};

const withTimeout = async <T>(
  label: string,
  deadlineAt: number,
  fn: () => Promise<T>,
  requestedTimeoutMs = DEFAULT_STEP_TIMEOUT_MS
): Promise<T> => {
  const remaining = deadlineAt - Date.now();
  if (remaining <= 0) {
    throw new Error(`hard_timeout_exceeded before ${label}`);
  }

  const timeoutMs = Math.max(500, Math.min(requestedTimeoutMs, remaining));

  return Promise.race([
    fn(),
    new Promise<T>((_, reject) => {
      setTimeout(() => reject(new Error(`${label}_timeout_after_${timeoutMs}ms`)), timeoutMs);
    })
  ]);
};

const waitForDecision = async (
  approvalId: string,
  deadlineAt: number
): Promise<ApprovalRecord> => {
  const localTimeoutAt = Date.now() + approvalTimeoutSec * 1000;

  while (Date.now() < localTimeoutAt && Date.now() < deadlineAt) {
    const approvalRes = await withTimeout(
      "approval_poll",
      deadlineAt,
      () =>
        getJson<{ approval: ApprovalRecord }>(
          `${APPROVAL_GATEWAY_SERVICE_URL}/v1/approvals/${approvalId}`
        ),
      3_000
    );

    const approval = approvalRes.data.approval;
    if (approval?.decision) {
      return approval;
    }

    await sleep(APPROVAL_POLL_INTERVAL_MS);
  }

  throw new Error(`approval_timeout after ${approvalTimeoutSec}s`);
};

const createBaseOutput = (): FinalDemoOutput => ({
  intentId: null,
  approvalId: null,
  executionId: null,
  routeUsed: null,
  EV_net: null,
  decision: null,
  txHash: null,
  receiptHash: null,
  route_hash: null,
  execution_hash: null,
  proofId: null,
  proofHash: null,
  proofVerified: null,
  metaplexConfirmed: null,
  externalAnchorStatus: null,
  metaplex_proof_tx: null,
  metaplex_registry_ref: null,
  status: "failed",
  elapsedMs: 0,
  error: null
});

async function runDemo() {
  const startedAt = Date.now();
  const deadlineAt = startedAt + HARD_DEADLINE_MS;
  const anchors: Anchor[] = [];
  const output = createBaseOutput();

  const finalize = (status: FinalDemoOutput["status"], error: string | null) => {
    output.status = status;
    output.error = error;
    output.elapsedMs = Date.now() - startedAt;
    console.log(JSON.stringify(output, null, 2));
  };

  try {
    if (!chatId) {
      throw new Error("TEST_TG_CHAT_ID missing");
    }

    const demoId = randomUUID();

    printStep("1/7", "Fetch market context (Covalent)");
    try {
      const covalentRes = await withTimeout(
        "market_context_enrich",
        deadlineAt,
        () =>
          postJson<{ result?: { snapshotHash?: string } }>(
            `${MARKET_CONTEXT_SERVICE_URL}/v1/market-context/enrich`,
            {
              source: "covalent",
              payload: {
                action: "get_balances",
                wallet: demoWallet,
                demoId
              }
            }
          ),
        9_000
      );

      const snapshotHash = covalentRes.data?.result?.snapshotHash;
      if (snapshotHash) {
        anchors.push({ type: "market_context", hash: snapshotHash });
        log(`Covalent snapshotHash=${snapshotHash}`);
      } else {
        log("Covalent returned without snapshot hash.");
      }
    } catch (error) {
      const err = parseErrorMessage(error);
      if (strictCovalent) {
        throw new Error(`covalent_required_but_failed: ${err}`);
      }
      log(`Covalent unavailable; continuing demo. reason=${err}`);
    }

    printStep("2/7", "Create intent with economic parameters");
    const intentRes = await withTimeout(
      "create_intent",
      deadlineAt,
      () =>
        postJson<{ intentId: string }>(`${API_GATEWAY_URL}/v1/intents`, {
          creatorAgentId: "agent_demo_economic_rail",
          asset: assetIn,
          action: "buy",
          amount,
          confidence: 0.86,
          riskScore: 0.22,
          expectedProfitBps,
          latencyPenaltyBps,
          mevRiskScore,
          notional: String(notional),
          expiryTs: toIsoInFuture(20),
          policyId: "policy_demo_v1"
        }),
      8_000
    );

    output.intentId = intentRes.data.intentId;
    log(`intentId=${output.intentId}`);

    printStep("3/7", "Run EV evaluation (policy check)");
    const policyRes = await withTimeout(
      "policy_check",
      deadlineAt,
      () =>
        postJson<{
          allowed: boolean;
          reasons: string[];
          requiresApproval: boolean;
          decision?: PolicyDecision;
          policyHash?: string | null;
          economics?: { evNetBps?: number } | null;
        }>(`${INTENT_SERVICE_URL}/v1/intents/${output.intentId}/policy/check`, {
          maxSlippageBps,
          policy: {
            maxAmount: process.env.POLICY_MAX_AMOUNT ?? null,
            maxRiskScore: process.env.POLICY_MAX_RISK_SCORE ?? null,
            maxSlippageBps: process.env.POLICY_MAX_SLIPPAGE_BPS ?? null,
            requireApprovalOver: process.env.POLICY_REQUIRE_APPROVAL_OVER ?? null,
            demo: "economic_rail_e2e"
          },
          economics: {
            expectedProfitBps,
            executionCostBps: maxSlippageBps,
            latencyPenaltyBps,
            mevRiskScore,
            notional
          }
        }),
      8_000
    );

    output.decision = derivePolicyDecision(policyRes.data);
    output.EV_net = policyRes.data?.economics?.evNetBps ?? null;
    log(`policy_decision=${output.decision} EV_net=${output.EV_net ?? "n/a"}bps`);

    if (policyRes.data.policyHash) {
      anchors.push({ type: "policy_hash", hash: policyRes.data.policyHash });
    }

    if (output.decision === "REJECT" || policyRes.data.allowed === false) {
      log(`Policy rejected intent. reasons=${policyRes.data.reasons.join(",")}`);
      finalize("stopped", null);
      return;
    }

    printStep("4/7", "Send Telegram approval");
    const approvalReq = await withTimeout(
      "request_approval",
      deadlineAt,
      () =>
        postJson<{ approvalId: string }>(`${API_GATEWAY_URL}/v1/intents/request`, {
          intentId: output.intentId,
          channel: "telegram",
          requesterId: chatId,
          action: "MIND Economic Rail Demo",
          amount
        }),
      8_000
    );

    output.approvalId = approvalReq.data.approvalId;
    log(`approvalId=${output.approvalId}`);

    printStep("5/7", "Approve and wait decision");
    if (autoApprove) {
      await withTimeout(
        "approval_autodecision",
        deadlineAt,
        () =>
          postJson(`${APPROVAL_GATEWAY_SERVICE_URL}/v1/approvals/${output.approvalId}/decision`, {
            decision: "approved"
          }),
        5_000
      );
      log("Auto-approval sent.");
    } else {
      log("Waiting manual approval on Telegram...");
    }

    const approval = await waitForDecision(output.approvalId, deadlineAt);
    log(`approval_decision=${approval.decision}`);

    anchors.push({
      type: "approval_decision",
      hash: hashValue({
        approvalId: output.approvalId,
        decision: approval.decision,
        decidedAt: approval.decidedAt
      })
    });

    if (approval.decision !== "approved") {
      finalize("stopped", null);
      return;
    }

    printStep("6/7", `Plan + run execution (${executionMode})`);
    const planRes = await withTimeout(
      "execution_plan",
      deadlineAt,
      () =>
        postJson<{ executionId: string }>(`${API_GATEWAY_URL}/v1/executions`, {
          intentId: output.intentId,
          mode: executionMode,
          protocol
        }),
      8_000
    );

    output.executionId = planRes.data.executionId;
    log(`executionId=${output.executionId}`);

    const runRes = await withTimeout(
      "execution_run",
      deadlineAt,
      () =>
        postJson<{
          status: string;
          txHash?: string | null;
          receiptHash?: string | null;
          route?: { routePlan?: string[]; adapter?: string };
          routeHash?: string | null;
          executionHash?: string | null;
          policyHash?: string | null;
          event?: { eventHash?: string };
        }>(`${API_GATEWAY_URL}/v1/executions/run`, {
          executionId: output.executionId,
          intentId: output.intentId,
          mode: executionMode,
          protocol,
          action: "SWAP",
          amount,
          asset: assetIn,
          assetIn,
          assetOut,
          maxSlippageBps,
          expiresAt: toIsoInFuture(10)
        }),
      11_000
    );

    output.routeUsed = deriveRouteUsed(runRes.data) ?? protocol;
    output.route_hash = runRes.data.routeHash ?? null;
    output.execution_hash = runRes.data.executionHash ?? null;
    output.txHash = runRes.data.txHash ?? null;
    output.receiptHash = runRes.data.receiptHash ?? null;

    if (runRes.data.routeHash) {
      anchors.push({ type: "route_hash", hash: runRes.data.routeHash });
    }
    if (runRes.data.executionHash) {
      anchors.push({ type: "execution_hash", hash: runRes.data.executionHash });
    }
    if (runRes.data.txHash) {
      anchors.push({ type: "execution_tx", hash: runRes.data.txHash });
    } else if (runRes.data.receiptHash) {
      anchors.push({ type: "execution_receipt", hash: runRes.data.receiptHash });
    }

    printStep("7/7", "Compose + verify proof bundle");
    const externalAnchorStatus =
      externalAnchorStatusInput === "confirmed" ||
      externalAnchorStatusInput === "failed" ||
      externalAnchorStatusInput === "pending"
        ? externalAnchorStatusInput
        : metaplexProofTx
          ? "confirmed"
          : "pending";

    const proofRes = await withTimeout(
      "proof_compose",
      deadlineAt,
      () =>
        postJson<{ proofId: string; proofHash: string }>(`${PROOF_SERVICE_URL}/v1/proofs/compose`, {
          intentId: output.intentId,
          approvalId: output.approvalId,
          executionId: output.executionId,
          externalAnchorStatus,
          metaplex_proof_tx: metaplexProofTx,
          metaplex_registry_ref: metaplexRegistryRef,
          anchors
        }),
      8_000
    );

    output.proofId = proofRes.data.proofId;
    output.proofHash = proofRes.data.proofHash;

    const verifyRes = await withTimeout(
      "proof_verify",
      deadlineAt,
      () =>
        postJson<{
          verified: boolean;
          metaplexConfirmed?: boolean;
          externalAnchorStatus?: "pending" | "confirmed" | "failed";
          metaplex_proof_tx?: string | null;
          metaplex_registry_ref?: string | null;
        }>(`${API_GATEWAY_URL}/v1/proofs/${output.proofId}/verify`, {
          anchors
        }),
      7_000
    );

    output.proofVerified = verifyRes.data.verified;
    output.metaplexConfirmed = verifyRes.data.metaplexConfirmed ?? null;
    output.externalAnchorStatus = verifyRes.data.externalAnchorStatus ?? null;
    output.metaplex_proof_tx = verifyRes.data.metaplex_proof_tx ?? null;
    output.metaplex_registry_ref = verifyRes.data.metaplex_registry_ref ?? null;
    log(
      `proofVerified=${output.proofVerified} externalAnchorStatus=${output.externalAnchorStatus} strict_metaplex_anchor=${strictMetaplexAnchor}`
    );
    if (strictMetaplexAnchor && output.metaplexConfirmed !== true) {
      finalize("stopped", "strict_metaplex_anchor_enabled_external_not_confirmed");
      return;
    }
    finalize("completed", null);
  } catch (error) {
    finalize("failed", parseErrorMessage(error));
  }
}

runDemo().catch((error) => {
  const fallback = createBaseOutput();
  fallback.error = parseErrorMessage(error);
  fallback.elapsedMs = 0;
  console.log(JSON.stringify(fallback, null, 2));
  process.exit(1);
});
