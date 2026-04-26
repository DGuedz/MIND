import { createHash, randomUUID } from "node:crypto";
import { config } from "dotenv";
import { getJson, HttpRequestError, postJson } from "../apps/api-gateway/src/http.js";

config({ override: true });

type Decision = "approved" | "rejected" | null;

type ApprovalRecord = {
  id: string;
  intentId: string;
  decision: Decision;
  decidedAt: string | null;
  createdAt: string;
};

const API_GATEWAY_URL = process.env.API_GATEWAY_URL ?? "http://localhost:3000";
const INTENT_SERVICE_URL = process.env.INTENT_SERVICE_URL ?? "http://localhost:3001";
const MARKET_CONTEXT_SERVICE_URL = process.env.MARKET_CONTEXT_SERVICE_URL ?? "http://localhost:3002";
const APPROVAL_GATEWAY_SERVICE_URL = process.env.APPROVAL_GATEWAY_SERVICE_URL ?? "http://localhost:3003";
const EXECUTION_SERVICE_URL = process.env.EXECUTION_SERVICE_URL ?? "http://localhost:3006";
const PROOF_SERVICE_URL = process.env.PROOF_SERVICE_URL ?? "http://localhost:3005";

const chatId = process.env.TEST_TG_CHAT_ID;
const demoWallet =
  process.env.DEMO_WALLET ?? "So11111111111111111111111111111111111111112";
const amount = process.env.DEMO_AMOUNT ?? "0.25";
const maxSlippageBps = Number(process.env.DEMO_MAX_SLIPPAGE_BPS ?? "50");
const executionMode = (process.env.DEMO_EXECUTION_MODE ?? "simulated") as
  | "simulated"
  | "real";
const approvalTimeoutSec = Number(process.env.DEMO_APPROVAL_TIMEOUT_SEC ?? "180");
const autoApprove = process.env.DEMO_AUTO_APPROVE === "true";

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const toIsoInFuture = (minutes: number) =>
  new Date(Date.now() + minutes * 60_000).toISOString();

const hashValue = (value: unknown) =>
  createHash("sha256").update(JSON.stringify(value)).digest("hex");

const printStep = (step: string, detail: string) => {
  console.log(`\n[${step}] ${detail}`);
};

const parseError = (error: unknown) => {
  if (error instanceof HttpRequestError) {
    return {
      type: "http_error",
      statusCode: error.statusCode,
      method: error.method,
      url: error.url,
      body: error.body
    };
  }

  return {
    type: "runtime_error",
    message: error instanceof Error ? error.message : String(error)
  };
};

const waitForDecision = async (approvalId: string): Promise<ApprovalRecord> => {
  const timeoutAt = Date.now() + approvalTimeoutSec * 1000;

  while (Date.now() < timeoutAt) {
    const approvalRes = await getJson<{ approval: ApprovalRecord }>(
      `${APPROVAL_GATEWAY_SERVICE_URL}/v1/approvals/${approvalId}`
    );

    const approval = approvalRes.data.approval;
    const currentDecision = approval?.decision ?? null;

    if (currentDecision) {
      return approval;
    }

    process.stdout.write(".");
    await sleep(2000);
  }

  throw new Error(
    `approval_timeout after ${approvalTimeoutSec}s for approvalId=${approvalId}`
  );
};

async function runDemo() {
  if (!chatId) {
    throw new Error(
      "TEST_TG_CHAT_ID missing. Define TEST_TG_CHAT_ID in .env before running demo."
    );
  }

  const demoId = randomUUID();
  const anchors: Array<{ type: string; hash: string }> = [];

  printStep("1/7", "Covalent market context (sponsor integration)");
  try {
    const covalentRes = await postJson<{
      result?: { snapshotHash?: string };
      decision?: { decision?: string };
    }>(`${MARKET_CONTEXT_SERVICE_URL}/v1/market-context/enrich`, {
      source: "covalent",
      payload: {
        action: "get_balances",
        wallet: demoWallet,
        demoId
      }
    });

    const snapshotHash = covalentRes.data?.result?.snapshotHash;
    if (snapshotHash) {
      anchors.push({ type: "market_context", hash: snapshotHash });
      console.log(`Covalent snapshotHash: ${snapshotHash}`);
    } else {
      const decision = covalentRes.data?.decision?.decision ?? "unknown";
      console.log(`Covalent context skipped/limited (decision=${decision}).`);
    }
  } catch (error) {
    console.log("Covalent context unavailable. Continuing with local demo evidence.");
    console.log(JSON.stringify(parseError(error), null, 2));
  }

  printStep("2/7", "Create intent");
  const intentRes = await postJson<{ intentId: string }>(
    `${API_GATEWAY_URL}/v1/intents`,
    {
      creatorAgentId: "agent_demo_secure_rail",
      asset: "SOL",
      action: "buy",
      amount,
      confidence: 0.84,
      riskScore: 0.2,
      expiryTs: toIsoInFuture(20),
      policyId: "policy_demo_v1"
    }
  );

  const intentId = intentRes.data.intentId;
  console.log(`intentId: ${intentId}`);

  printStep("3/7", "Policy check + request Telegram approval");
  const policyCheck = await postJson<{
    allowed: boolean;
    reasons: string[];
    requiresApproval: boolean;
    policyHash?: string | null;
  }>(`${INTENT_SERVICE_URL}/v1/intents/${intentId}/policy/check`, {
    maxSlippageBps,
    policy: {
      maxAmount: process.env.POLICY_MAX_AMOUNT ?? null,
      maxRiskScore: process.env.POLICY_MAX_RISK_SCORE ?? null,
      maxSlippageBps: process.env.POLICY_MAX_SLIPPAGE_BPS ?? null,
      requireApprovalOver: process.env.POLICY_REQUIRE_APPROVAL_OVER ?? null,
      demo: "secure_intent_rail"
    }
  });

  if (!policyCheck.data.allowed) {
    throw new Error(`policy_blocked reasons=${policyCheck.data.reasons.join(",")}`);
  }

  if (policyCheck.data.policyHash) {
    anchors.push({ type: "policy_hash", hash: policyCheck.data.policyHash });
    console.log(`policyHash: ${policyCheck.data.policyHash}`);
  }

  const approvalReq = await postJson<{ approvalId: string }>(
    `${API_GATEWAY_URL}/v1/intents/request`,
    {
      intentId,
      channel: "telegram",
      requesterId: chatId,
      action: "Secure Intent Rail Demo",
      amount
    }
  );

  const approvalId = approvalReq.data.approvalId;
  console.log(`approvalId: ${approvalId}`);

  if (autoApprove) {
    printStep("AUTO", "DEMO_AUTO_APPROVE=true -> forcing approval in API");
    await postJson(`${APPROVAL_GATEWAY_SERVICE_URL}/v1/approvals/${approvalId}/decision`, {
      decision: "approved"
    });
  }

  printStep("4/7", "Wait for Telegram decision");
  console.log("Open Telegram and click Approve/Reject in the bot message.");
  const approval = await waitForDecision(approvalId);
  console.log(`\ndecision: ${approval.decision}`);

  anchors.push({
    type: "approval_decision",
    hash: hashValue({
      approvalId,
      decision: approval.decision,
      decidedAt: approval.decidedAt
    })
  });

  if (approval.decision !== "approved") {
    const result = {
      status: "stopped_by_human",
      intentId,
      approvalId,
      decision: approval.decision,
      decidedAt: approval.decidedAt
    };
    console.log("\n" + JSON.stringify(result, null, 2));
    return;
  }

  printStep("5/7", `Plan + run execution (${executionMode})`);
  const planRes = await postJson<{ executionId: string }>(
    `${API_GATEWAY_URL}/v1/executions`,
    {
      intentId,
      mode: executionMode
    }
  );

  const executionId = planRes.data.executionId;
  console.log(`executionId: ${executionId}`);

  const runRes = await postJson<{
    status: string;
    txHash?: string;
    receiptHash?: string;
    event?: { eventHash?: string };
  }>(`${EXECUTION_SERVICE_URL}/v1/executions/run`, {
    executionId,
    intentId,
    amount,
    maxSlippageBps,
    expiresAt: toIsoInFuture(10)
  });

  if (runRes.data.event?.eventHash) {
    anchors.push({ type: "execution_event", hash: runRes.data.event.eventHash });
  }

  if (runRes.data.receiptHash) {
    anchors.push({ type: "execution_receipt", hash: runRes.data.receiptHash });
  }

  if (runRes.data.txHash) {
    anchors.push({ type: "execution_tx", hash: runRes.data.txHash });
  }

  printStep("6/7", "Compose proof bundle");
  const proofRes = await postJson<{ proofId: string; proofHash: string }>(
    `${PROOF_SERVICE_URL}/v1/proofs/compose`,
    {
      intentId,
      approvalId,
      executionId,
      anchors
    }
  );

  const proofId = proofRes.data.proofId;
  const proofHash = proofRes.data.proofHash;

  const verifyRes = await postJson<{ verified: boolean }>(
    `${API_GATEWAY_URL}/v1/proofs/${proofId}/verify`,
    { anchors }
  );

  const bundleRes = await getJson<{ proof?: unknown; anchors?: unknown[]; events?: unknown[] }>(
    `${API_GATEWAY_URL}/v1/proofs/${proofId}/bundle`
  );

  printStep("7/7", "Demo summary");
  const summary = {
    status: "completed",
    intentId,
    approvalId,
    decision: approval.decision,
    executionId,
    executionStatus: runRes.data.status,
    txHash: runRes.data.txHash ?? null,
    receiptHash: runRes.data.receiptHash ?? null,
    proofId,
    proofHash,
    proofVerified: verifyRes.data.verified,
    anchorsCount: anchors.length,
    bundle: {
      hasProof: Boolean(bundleRes.data.proof),
      anchors: bundleRes.data.anchors?.length ?? 0,
      events: bundleRes.data.events?.length ?? 0
    }
  };

  console.log(JSON.stringify(summary, null, 2));
}

runDemo().catch((error) => {
  console.error("\nDemo failed:");
  console.error(JSON.stringify(parseError(error), null, 2));
  process.exit(1);
});
