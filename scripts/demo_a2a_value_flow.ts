import { config } from "dotenv";
import { postJson } from "../apps/api-gateway/src/http.js";
import fs from "node:fs";

config({ override: true });

type PolicyDecision = "ALLOW" | "REJECT" | "REQUIRE_APPROVAL";
type DexProtocol = "JUPITER" | "ORCA" | "RAYDIUM" | "METEORA";
type ExternalAnchorStatus = "pending" | "confirmed" | "failed";

type FinalOutput = {
  agentA: string;
  agentB: string;
  paymentExecuted: boolean;
  EV_net: number | null;
  decision: PolicyDecision | null;
  proofVerified: boolean;
  metaplexConfirmed: boolean | null;
  externalAnchorStatus: "pending" | "confirmed" | "failed" | null;
  metaplex_proof_tx: string | null;
  metaplex_registry_ref: string | null;
  metaplexProofTx: string | null;
  metaplexRegistryRef: string | null;
  externalProvider: string | null;
  strictModeLocal: boolean;
  strictModeEffective: boolean | null;
  strictModeSource: string;
  valueTransferred: string;
  routeUsed: string | null;
  elapsedMs: number;
};

const API_GATEWAY_URL = process.env.API_GATEWAY_URL ?? "http://localhost:3000";
const MARKET_CONTEXT_SERVICE_URL = process.env.MARKET_CONTEXT_SERVICE_URL ?? "http://localhost:3002";
const APPROVAL_GATEWAY_SERVICE_URL = process.env.APPROVAL_GATEWAY_SERVICE_URL ?? "http://localhost:3003";
const PROOF_SERVICE_URL = process.env.PROOF_SERVICE_URL ?? "http://localhost:3005";
const INTENT_SERVICE_URL = process.env.INTENT_SERVICE_URL ?? "http://localhost:3001";

const amount = process.env.DEMO_A2A_AMOUNT ?? "0.25";
const assetIn = process.env.DEMO_A2A_ASSET_IN ?? "SOL";
const assetOut = process.env.DEMO_A2A_ASSET_OUT ?? "USDC";
const maxSlippageBps = Number(process.env.DEMO_A2A_MAX_SLIPPAGE_BPS ?? "5");
const protocol = (process.env.DEMO_A2A_PROTOCOL ?? "JUPITER") as DexProtocol;
const executionMode = "simulated";

const expectedProfitBps = Number(process.env.DEMO_A2A_EXPECTED_PROFIT_BPS ?? "40");
const latencyPenaltyBps = Number(process.env.DEMO_A2A_LATENCY_PENALTY_BPS ?? "2");
const mevRiskScore = Number(process.env.DEMO_A2A_MEV_RISK_SCORE ?? "0.03");
const notional = Number(process.env.DEMO_A2A_NOTIONAL ?? amount);

const autoApprove = (process.env.DEMO_A2A_AUTO_APPROVE ?? "true") === "true";
const approvalTimeoutSec = Number(process.env.DEMO_A2A_APPROVAL_TIMEOUT_SEC ?? "20");
const deadlineMs = Number(process.env.DEMO_A2A_DEADLINE_MS ?? "30000");
const strictMetaplexAnchor = (process.env.STRICT_METAPLEX_ANCHOR ?? "false") === "true";
const metaplexProofTx = process.env.DEMO_METAPLEX_PROOF_TX;
const metaplexRegistryRef =
  process.env.DEMO_METAPLEX_REGISTRY_REF ?? process.env.METAPLEX_REGISTRY_ENDPOINT;
const externalAnchorStatusInput = process.env.DEMO_EXTERNAL_ANCHOR_STATUS;
const metaplexProofEndpoint = process.env.METAPLEX_PROOF_ENDPOINT?.trim() ?? "";
const metaplexProofAuth = process.env.METAPLEX_PROOF_AUTH?.trim() ?? "";
const metaplexProofTimeoutMs = Number(process.env.METAPLEX_PROOF_TIMEOUT_MS ?? "8000");
const strictModeSource = (() => {
  try {
    const envRaw = fs.readFileSync(".env", "utf-8");
    if (/^\s*STRICT_METAPLEX_ANCHOR=/m.test(envRaw)) {
      return ".env (dotenv override=true)";
    }
  } catch {
    // no-op
  }
  return "default(false)";
})();

const toIsoInFuture = (minutes: number) => new Date(Date.now() + minutes * 60_000).toISOString();
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
const withAbortTimeout = (timeoutMs: number) => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  return { controller, clear: () => clearTimeout(timer) };
};

const parseJsonSafe = (raw: string): Record<string, unknown> => {
  if (!raw) return {};
  try {
    return JSON.parse(raw) as Record<string, unknown>;
  } catch {
    return {};
  }
};

const submitExternalAnchor = async (input: {
  intentId: string;
  executionId: string;
  anchors: Array<{ type: string; hash: string }>;
  routeUsed: string | null;
  txHash?: string | null;
  receiptHash?: string | null;
}): Promise<{
  status: "skipped" | "confirmed" | "pending" | "failed";
  externalProvider: string | null;
  externalAnchorStatus: ExternalAnchorStatus;
  metaplexProofTx: string | null;
  metaplexRegistryRef: string | null;
  detail: string | null;
}> => {
  if (!metaplexProofEndpoint) {
    return {
      status: "skipped",
      externalProvider: null,
      externalAnchorStatus: "pending",
      metaplexProofTx: null,
      metaplexRegistryRef: null,
      detail: "missing_metaplex_proof_endpoint"
    };
  }

  const headers: Record<string, string> = { "content-type": "application/json" };
  if (metaplexProofAuth) {
    headers.authorization = `Bearer ${metaplexProofAuth}`;
  }

  const payload = {
    intentId: input.intentId,
    executionId: input.executionId,
    routeUsed: input.routeUsed,
    txHash: input.txHash ?? null,
    receiptHash: input.receiptHash ?? null,
    anchors: input.anchors,
    submittedAt: new Date().toISOString()
  };

  const timeout = withAbortTimeout(Math.max(1500, metaplexProofTimeoutMs));
  try {
    const response = await fetch(metaplexProofEndpoint, {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
      signal: timeout.controller.signal
    });
    const raw = await response.text();
    const parsed = parseJsonSafe(raw);
    if (!response.ok) {
      return {
        status: "failed",
        externalProvider: (parsed.provider as string | undefined) ?? "metaplex",
        externalAnchorStatus: "failed",
        metaplexProofTx: null,
        metaplexRegistryRef:
          (parsed.registryRef as string | undefined) ??
          (parsed.metaplexRegistryRef as string | undefined) ??
          null,
        detail: `http_${response.status}`
      };
    }

    const proofTx =
      (parsed.txHash as string | undefined) ??
      (parsed.signature as string | undefined) ??
      (parsed.proofTxHash as string | undefined) ??
      null;
    const registry =
      (parsed.registryRef as string | undefined) ??
      (parsed.metaplexRegistryRef as string | undefined) ??
      null;
    return {
      status: proofTx ? "confirmed" : "pending",
      externalProvider: (parsed.provider as string | undefined) ?? "metaplex",
      externalAnchorStatus: proofTx ? "confirmed" : "pending",
      metaplexProofTx: proofTx,
      metaplexRegistryRef: registry,
      detail: null
    };
  } catch (error) {
    const detail =
      error instanceof Error && error.name === "AbortError"
        ? "request_timeout"
        : error instanceof Error
          ? error.message
          : String(error);
    return {
      status: "failed",
      externalProvider: "metaplex",
      externalAnchorStatus: "failed",
      metaplexProofTx: null,
      metaplexRegistryRef: null,
      detail
    };
  } finally {
    timeout.clear();
  }
};

const log = (step: string, msg: string) => {
  console.log(`[${new Date().toISOString()}] [${step}] ${msg}`);
};

const withTimeout = async <T>(label: string, timeoutMs: number, fn: () => Promise<T>): Promise<T> => {
  return Promise.race([
    fn(),
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error(`${label}_timeout`)), timeoutMs))
  ]);
};

const waitApprovalDecision = async (approvalId: string, hardDeadlineAt: number) => {
  const localTimeoutAt = Date.now() + approvalTimeoutSec * 1000;
  while (Date.now() < localTimeoutAt && Date.now() < hardDeadlineAt) {
    const approval = await withTimeout("approval_poll", 3000, () =>
      postJson<{ approval: { decision?: "approved" | "rejected" | null } }>(
        `${APPROVAL_GATEWAY_SERVICE_URL}/v1/approvals/${approvalId}`,
        {}
      ).catch(async () => {
        const res = await fetch(`${APPROVAL_GATEWAY_SERVICE_URL}/v1/approvals/${approvalId}`);
        if (!res.ok) throw new Error(`approval_poll_failed_${res.status}`);
        return { statusCode: res.status, data: await res.json() };
      })
    );

    const decision = approval.data?.approval?.decision ?? null;
    if (decision) {
      return decision;
    }
    await sleep(800);
  }
  throw new Error("approval_timeout");
};

async function run() {
  const startedAt = Date.now();
  const hardDeadlineAt = startedAt + deadlineMs;

  const output: FinalOutput = {
    agentA: "",
    agentB: "",
    paymentExecuted: false,
    EV_net: null,
    decision: null,
    proofVerified: false,
    metaplexConfirmed: null,
    externalAnchorStatus: null,
    metaplex_proof_tx: null,
    metaplex_registry_ref: null,
    metaplexProofTx: null,
    metaplexRegistryRef: null,
    externalProvider: null,
    strictModeLocal: strictMetaplexAnchor,
    strictModeEffective: null,
    strictModeSource,
    valueTransferred: `${amount} ${assetIn}->${assetOut}`,
    routeUsed: null,
    elapsedMs: 0
  };

  const failAndPrint = (error: string) => {
    output.elapsedMs = Date.now() - startedAt;
    console.log(
      JSON.stringify(
        {
          ...output,
          error
        },
        null,
        2
      )
    );
  };

  try {
    log("1/7", "Register Agent A and Agent B");
    const agentARes = await withTimeout("register_agent_a", 5000, () =>
      postJson<{ agentId?: string; onchain?: { mint?: string } }>(`${API_GATEWAY_URL}/v1/agents/register`, {
        name: "Agent A Treasury",
        role: "initiator",
        wallet: process.env.VITE_AGENT_PUBLIC_KEY ?? "EyMoTToyaKWw3dvCYYsGAg6PfE6g5f6df8p5c4ropnan",
        capabilities: ["scan", "route", "pay"],
        policyId: "policy_demo_v1",
        status: "active"
      })
    );

    const agentBRes = await withTimeout("register_agent_b", 5000, () =>
      postJson<{ agentId?: string; onchain?: { mint?: string } }>(`${API_GATEWAY_URL}/v1/agents/register`, {
        name: "Agent B Liquidity",
        role: "executor",
        wallet: process.env.NOAHAI_SETTLEMENT_WALLET ?? "CfvC1ERLc8RZzbjn2QY99ggXTqHPXAM81Hqc4wrHUXh8",
        capabilities: ["execute", "settle"],
        policyId: "policy_demo_v1",
        status: "active"
      })
    );

    output.agentA = agentARes.data?.agentId ?? agentARes.data?.onchain?.mint ?? "agentA_registered";
    output.agentB = agentBRes.data?.agentId ?? agentBRes.data?.onchain?.mint ?? "agentB_registered";

    log("2/7", "Create A2A context and task (Agent A -> Agent B)");
    const context = await withTimeout("a2a_context", 5000, () =>
      postJson<{ contextId: string }>(`${API_GATEWAY_URL}/v1/a2a/contexts`, {
        intentId: `a2a-intent-${Date.now()}`,
        initiatorAgentId: output.agentA,
        counterpartyAgentId: output.agentB,
        expiresAt: toIsoInFuture(10)
      })
    );

    const contextId = context.data.contextId;
    const task = await withTimeout("a2a_task", 5000, () =>
      postJson<{ taskId: string }>(`${API_GATEWAY_URL}/v1/a2a/contexts/${contextId}/tasks`, {
        executorAgentId: output.agentB,
        payload: {
          action: "SWAP",
          amount,
          assetIn,
          assetOut,
          protocol,
          mode: executionMode,
          maxSlippageBps
        },
        idempotencyKey: `demo-a2a-${Date.now()}`
      })
    );

    const taskId = task.data.taskId;
    log("3/7", "Fetch market context + create economic intent");
    await withTimeout("market_context", 5000, () =>
      postJson(`${MARKET_CONTEXT_SERVICE_URL}/v1/market-context/enrich`, {
        source: "covalent",
        payload: {
          action: "get_balances",
          wallet: process.env.DEMO_WALLET ?? "So11111111111111111111111111111111111111112",
          demoId: `a2a-${Date.now()}`
        }
      }).catch(() => ({ statusCode: 200, data: {} }))
    );

    const intentRes = await withTimeout("create_intent", 5000, () =>
      postJson<{ intentId: string }>(`${API_GATEWAY_URL}/v1/intents`, {
        creatorAgentId: output.agentA,
        targetAgentId: output.agentB,
        asset: assetIn,
        action: "buy",
        amount,
        confidence: 0.86,
        riskScore: 0.2,
        expectedProfitBps,
        latencyPenaltyBps,
        mevRiskScore,
        notional: String(notional),
        expiryTs: toIsoInFuture(20),
        policyId: "policy_demo_v1"
      })
    );

    const intentId = intentRes.data.intentId;

    log("4/7", "Run EV decision and handle approval if required");
    const policyCheck = await withTimeout("policy_check", 5000, () =>
      postJson<{
        allowed: boolean;
        requiresApproval: boolean;
        decision?: PolicyDecision;
        reasons?: string[];
        economics?: { evNetBps?: number } | null;
      }>(`${INTENT_SERVICE_URL}/v1/intents/${intentId}/policy/check`, {
        maxSlippageBps,
        economics: {
          expectedProfitBps,
          executionCostBps: maxSlippageBps,
          latencyPenaltyBps,
          mevRiskScore,
          notional
        }
      })
    );

    const decision: PolicyDecision =
      policyCheck.data.decision ??
      (policyCheck.data.allowed ? (policyCheck.data.requiresApproval ? "REQUIRE_APPROVAL" : "ALLOW") : "REJECT");
    output.decision = decision;
    output.EV_net = policyCheck.data.economics?.evNetBps ?? null;

    if (decision === "REJECT" || policyCheck.data.allowed === false) {
      log("5/7", "Decision=REJECT, stopping safely");
      output.elapsedMs = Date.now() - startedAt;
      console.log(JSON.stringify(output, null, 2));
      return;
    }

    let approvalId: string | null = null;
    if (decision === "REQUIRE_APPROVAL") {
      const approvalReq = await withTimeout("request_approval", 5000, () =>
        postJson<{ approvalId: string }>(`${API_GATEWAY_URL}/v1/intents/request`, {
          intentId,
          contextId,
          taskId,
          channel: "telegram",
          requesterId: process.env.TEST_TG_CHAT_ID,
          action: "A2A value flow approval",
          amount
        })
      );
      approvalId = approvalReq.data.approvalId;

      if (autoApprove && approvalId) {
        await withTimeout("auto_approve", 3000, () =>
          postJson(`${APPROVAL_GATEWAY_SERVICE_URL}/v1/approvals/${approvalId}/decision`, {
            decision: "approved"
          })
        );
      }

      if (approvalId) {
        const approvalDecision = await waitApprovalDecision(approvalId, hardDeadlineAt);
        if (approvalDecision !== "approved") {
          throw new Error("approval_rejected");
        }
      }
    }

    log("5/7", "Accept A2A context (handshake)");
    await withTimeout("accept_context", 5000, () =>
      postJson(`${API_GATEWAY_URL}/v1/a2a/contexts/${contextId}/accept`, {
        taskId,
        acceptedByAgentId: output.agentB
      })
    );

    log("6/7", "Plan and run canonical execution");
    const plan = await withTimeout("execution_plan", 5000, () =>
      postJson<{ executionId: string }>(`${API_GATEWAY_URL}/v1/executions`, {
        intentId,
        mode: executionMode,
        protocol
      })
    );

    const executionId = plan.data.executionId;
    const runRes = await withTimeout("execution_run", 7000, () =>
      postJson<{
        status: string;
        txHash?: string | null;
        receiptHash?: string | null;
        route?: { adapter?: string; routePlan?: string[] };
        routeHash?: string | null;
        executionHash?: string | null;
      }>(`${API_GATEWAY_URL}/v1/executions/run`, {
        executionId,
        intentId,
        mode: executionMode,
        protocol,
        action: "SWAP",
        amount,
        asset: assetIn,
        assetIn,
        assetOut,
        maxSlippageBps,
        expiresAt: toIsoInFuture(10)
      })
    );

    const routeUsed =
      runRes.data.route?.routePlan && runRes.data.route.routePlan.length > 0
        ? runRes.data.route.routePlan.join(" -> ")
        : runRes.data.route?.adapter ?? protocol;
    output.routeUsed = routeUsed;
    output.paymentExecuted = Boolean(runRes.data.txHash || runRes.data.receiptHash);

    log("7/7", "Compose and verify proof bundle");
    const anchors = [
      runRes.data.routeHash ? { type: "route_hash", hash: runRes.data.routeHash } : null,
      runRes.data.executionHash ? { type: "execution_hash", hash: runRes.data.executionHash } : null,
      runRes.data.txHash
        ? { type: "execution_tx", hash: runRes.data.txHash }
        : runRes.data.receiptHash
          ? { type: "execution_receipt", hash: runRes.data.receiptHash }
          : null
    ].filter(Boolean) as Array<{ type: string; hash: string }>;

    const externalAnchor = await submitExternalAnchor({
      intentId,
      executionId,
      anchors,
      routeUsed,
      txHash: runRes.data.txHash ?? null,
      receiptHash: runRes.data.receiptHash ?? null
    });

    const externalAnchorStatus: ExternalAnchorStatus =
      externalAnchorStatusInput === "confirmed" ||
      externalAnchorStatusInput === "failed" ||
      externalAnchorStatusInput === "pending"
        ? externalAnchorStatusInput
        : metaplexProofTx || externalAnchor.metaplexProofTx
          ? "confirmed"
          : externalAnchor.externalAnchorStatus;

    const metaplexProofTxResolved = metaplexProofTx ?? externalAnchor.metaplexProofTx ?? undefined;
    const metaplexRegistryRefResolved =
      metaplexRegistryRef ?? externalAnchor.metaplexRegistryRef ?? undefined;

    const proofPayload: {
      intentId: string;
      executionId: string;
      anchors: Array<{ type: string; hash: string }>;
      approvalId?: string;
      externalAnchorStatus?: ExternalAnchorStatus;
      metaplex_proof_tx?: string;
      metaplex_registry_ref?: string;
    } = {
      intentId,
      executionId,
      anchors,
      externalAnchorStatus,
      metaplex_proof_tx: metaplexProofTxResolved,
      metaplex_registry_ref: metaplexRegistryRefResolved
    };

    const proof = await withTimeout("proof_compose", 5000, () =>
      postJson<{ proofId: string }>(`${PROOF_SERVICE_URL}/v1/proofs/compose`, proofPayload)
    );

    const verify = await withTimeout("proof_verify", 5000, () =>
      postJson<{
        verified: boolean;
        strictMetaplexAnchor?: boolean;
        externalProvider?: string | null;
        metaplexConfirmed?: boolean;
        externalAnchorStatus?: "pending" | "confirmed" | "failed";
        metaplexProofTx?: string | null;
        metaplexRegistryRef?: string | null;
        metaplex_proof_tx?: string | null;
        metaplex_registry_ref?: string | null;
      }>(`${API_GATEWAY_URL}/v1/proofs/${proof.data.proofId}/verify`, {
        anchors
      })
    );

    output.proofVerified = verify.data.verified;
    output.strictModeEffective = verify.data.strictMetaplexAnchor ?? null;
    output.externalProvider = verify.data.externalProvider ?? externalAnchor.externalProvider;
    output.metaplexConfirmed = verify.data.metaplexConfirmed ?? null;
    output.externalAnchorStatus = verify.data.externalAnchorStatus ?? null;
    output.metaplexProofTx = verify.data.metaplexProofTx ?? null;
    output.metaplexRegistryRef = verify.data.metaplexRegistryRef ?? null;
    output.metaplex_proof_tx = verify.data.metaplex_proof_tx ?? null;
    output.metaplex_registry_ref = verify.data.metaplex_registry_ref ?? null;
    log(
      "7/7",
      [
        `proofVerified=${output.proofVerified}`,
        `externalAnchorStatus=${output.externalAnchorStatus}`,
        `external_submit_status=${externalAnchor.status}`,
        `strict_local=${output.strictModeLocal}`,
        `strict_effective=${output.strictModeEffective}`,
        `strict_source=${output.strictModeSource}`
      ].join(" ")
    );
    if (strictMetaplexAnchor && output.metaplexConfirmed !== true) {
      throw new Error("strict_metaplex_anchor_enabled_external_not_confirmed");
    }
    output.elapsedMs = Date.now() - startedAt;
    console.log(JSON.stringify(output, null, 2));
  } catch (error) {
    failAndPrint(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}

run();
