import fastify, { FastifyReply, FastifyRequest } from "fastify";
import { z } from "zod";
import { Connection, LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";
import { checkDb } from "./db/client.js";
import { IntentFirewall } from "./core/IntentFirewall.js";
import { TreasuryAgent } from "./core/agents/TreasuryAgent.js";
import { IntentRequest } from "./core/types.js";
import { JupiterAdapter } from "./adapters/JupiterAdapter.js";
import { SolanaPaymentsLayer } from "./core/payments/SolanaPaymentsLayer.js";
import { SUPPORTED_ASSETS, getAssetBySymbol } from "./core/payments/supportedAssets.js";
import { ExecutionBridge } from "./core/ExecutionBridge.js";
import {
  createTask,
  createContext,
  getA2AMetrics,
  getTaskById,
  getContextById,
  listBillingEventsByContextId,
  listTasksByContextId,
  listContextEvents,
  recordBillingEvent,
  updateContextStatus
} from "./db/repository.js";

const server = fastify({ logger: true });
const intentFirewall = new IntentFirewall();
const treasuryAgent = new TreasuryAgent();
const jupiterAdapter = new JupiterAdapter();
const solanaNetwork = process.env.SOLANA_NETWORK === "devnet" ? "devnet" : "mainnet-beta";
const solanaConnection = new Connection(process.env.HELIUS_RPC_URL ?? "https://api.mainnet-beta.solana.com", "confirmed");
const solanaPaymentsLayer = new SolanaPaymentsLayer(solanaConnection, solanaNetwork);
const executionBridge = new ExecutionBridge(server.log);

// Rota raiz para health check amigável no navegador
server.get("/", async (_request: FastifyRequest, reply: FastifyReply) => {
  return reply.code(200).send({
    service: "MIND Protocol - A2A Server",
    status: "online",
    version: "1.0.0",
    message: "A2A API is running. The Landing Page is served on a different port (usually 5173 or 3000 via Vercel/Vite).",
    endpoints: {
      health: "/health",
      agentCard: "/v1/a2a/agent-card",
      paymentsAssets: "/v1/payments/solana/assets",
      paymentsRequest: "/v1/payments/solana/request",
      paymentsVerify: "/v1/payments/solana/verify",
      metrics: "/v1/metrics/a2a"
    }
  });
});

server.get("/health", async () => ({
  status: "ok",
  service: "a2a-service"
}));

server.get("/health/db", async (_request: FastifyRequest, reply: FastifyReply) => {
  try {
    await checkDb();
    return reply.code(200).send({ status: "ok", service: "a2a-service", db: "ok" });
  } catch (error) {
    return reply.code(500).send({ status: "error", service: "a2a-service", db: "error" });
  }
});

server.get("/v1/a2a/agent-card", async (_request: FastifyRequest, reply: FastifyReply) => {
  return reply.code(200).send({
    name: "MIND A2A Treasury Server",
    network: solanaNetwork,
    version: "1.0.0",
    capabilities: [
      "streaming",
      "async tasks",
      "human approval",
      "proof receipts",
      "policy validation"
    ],
    skills: [
      "market intelligence",
      "risk analysis",
      "route planning",
      "treasury activation",
      "execution orchestration",
      "audit proofs"
    ],
    supported_intents: [
      "swap",
      "rebalance",
      "provide_liquidity",
      "withdraw_liquidity",
      "arbitrage_candidate",
      "treasury_reposition",
      "hedge_request"
    ]
  });
});

const ContextStatusSchema = z.enum(["open", "accepted", "cancelled", "expired"]);

const isContextExpired = (expiresAt: Date) => {
  return Date.now() > expiresAt.getTime();
};

const CreateContextSchema = z.object({
  intentId: z.string(),
  initiatorAgentId: z.string(),
  counterpartyAgentId: z.string().optional(),
  expiresAt: z.string()
});

const CreateTaskSchema = z.object({
  executorAgentId: z.string(),
  payload: z.record(z.unknown()),
  idempotencyKey: z.string().optional()
});

const AcceptContextSchema = z.object({
  taskId: z.string(),
  acceptedByAgentId: z.string()
});

const CancelContextSchema = z.object({
  cancelledByAgentId: z.string(),
  reason: z.string().optional()
});

const BillingEventSchema = z.object({
  eventType: z.string(),
  units: z.number().int().min(1),
  metadata: z.record(z.unknown()).optional(),
  idempotencyKey: z.string().optional()
});

const PaymentAssetSchema = z.enum(["SOL", "USDC", "USDT", "PYUSD", "USDG"]);

const CreateSolanaPaymentRequestSchema = z.object({
  asset: PaymentAssetSchema,
  recipientWallet: z.string().min(32),
  amountMinor: z.string().regex(/^\d+$/),
  reference: z.string().optional(),
  label: z.string().min(1).max(80).optional(),
  message: z.string().min(1).max(200).optional(),
  memo: z.string().min(1).max(200).optional(),
  intentId: z.string().min(1).max(120).optional(),
  expiresInSeconds: z.number().int().positive().max(86400).optional(),
  network: z.enum(["mainnet-beta", "devnet"]).optional()
});

const VerifySolanaPaymentSchema = z.object({
  asset: PaymentAssetSchema,
  recipientWallet: z.string().min(32),
  amountMinor: z.string().regex(/^\d+$/),
  reference: z.string().min(32),
  commitment: z.enum(["processed", "confirmed", "finalized"]).optional(),
  network: z.enum(["mainnet-beta", "devnet"]).optional(),
  searchLimit: z.number().int().positive().max(100).optional()
});

const IntentRequestSchema = z.object({
  intentId: z.string().min(1),
  protocol: z.string().min(1),
  action: z.enum(["SWAP", "ALLOCATE_YIELD", "PROVIDE_LIQUIDITY", "WITHDRAW"]),
  assetIn: z.string().min(1),
  assetOut: z.string().optional(),
  amount: z.number().positive(),
  maxSlippageBps: z.number().nonnegative().optional(),
  agentId: z.string().min(1)
});

const resolveAdapter = (protocol: string) => {
  if (protocol.toUpperCase() === "JUPITER") return jupiterAdapter;
  return null;
};

const asServiceError = (error: unknown) => {
  return error instanceof Error ? error.message : "unknown_error";
};

const verifyInstitutionalAuth = (request: FastifyRequest, reply: FastifyReply, done: (err?: Error) => void) => {
  const authHeader = request.headers.authorization;
  // Simples middleware de AuthZ para fins institucionais (em prod usaria JWT assinado por KMS)
  if (!authHeader || !authHeader.startsWith("Bearer MIND_INSTITUTIONAL_")) {
    return reply.code(401).send({ error: "unauthorized", message: "Missing or invalid institutional authorization token." });
  }
  done();
};

server.post("/v1/a2a/contexts", { preHandler: verifyInstitutionalAuth }, async (request: FastifyRequest, reply: FastifyReply) => {
  const parsed = CreateContextSchema.safeParse(request.body);
  if (!parsed.success) {
    return reply.code(400).send({ error: "invalid_a2a_context", details: parsed.error.flatten() });
  }

  const expiresAtTs = Date.parse(parsed.data.expiresAt);
  if (!Number.isFinite(expiresAtTs) || expiresAtTs <= Date.now()) {
    return reply.code(400).send({ error: "invalid_expires_at" });
  }

  const result = await createContext(parsed.data);
  return reply.code(201).send({ status: "created", contextId: result.contextId, event: result.event });
});

server.post<{ Params: { id: string } }>(
  "/v1/a2a/contexts/:id/tasks",
  { preHandler: verifyInstitutionalAuth },
  async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    const parsed = CreateTaskSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: "invalid_a2a_task", details: parsed.error.flatten() });
    }

    const context = await getContextById(request.params.id);
    if (!context) {
      return reply.code(404).send({ error: "a2a_context_not_found" });
    }

    const statusParsed = ContextStatusSchema.safeParse(context.status);
    if (!statusParsed.success) {
      return reply.code(500).send({ error: "invalid_context_status" });
    }

    if (isContextExpired(context.expiresAt) && statusParsed.data === "open") {
      const event = await updateContextStatus({
        contextId: context.id,
        status: "expired",
        payloadForHash: { reason: "expired_by_task" },
        eventType: "a2a.context.expired",
        expectedCurrentStatus: "open"
      });
      return reply.code(409).send({ error: "a2a_context_expired", event });
    }

    if (statusParsed.data !== "open") {
      return reply.code(409).send({ error: "a2a_context_not_open", status: statusParsed.data });
    }

    const result = await createTask({
      contextId: context.id,
      executorAgentId: parsed.data.executorAgentId,
      payload: parsed.data.payload,
      idempotencyKey: parsed.data.idempotencyKey
    });

    return reply.code(201).send({
      status: "created",
      taskId: result.taskId,
      version: result.version,
      event: result.event,
      idempotent: result.event === null
    });
  }
);

server.post<{ Params: { id: string } }>(
  "/v1/a2a/contexts/:id/accept",
  { preHandler: verifyInstitutionalAuth },
  async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    const parsed = AcceptContextSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: "invalid_accept_request", details: parsed.error.flatten() });
    }

    const context = await getContextById(request.params.id);
    if (!context) {
      return reply.code(404).send({ error: "a2a_context_not_found" });
    }

    if (context.status !== "open") {
      // Idempotency check before doing anything else
      if (context.status === "accepted" && context.acceptedTaskId === parsed.data.taskId) {
        return reply.code(200).send({
          status: "accepted",
          contextId: context.id,
          taskId: parsed.data.taskId,
          idempotent: true
        });
      }
      return reply.code(409).send({ error: "a2a_context_not_open", status: context.status });
    }

    if (isContextExpired(context.expiresAt)) {
      const event = await updateContextStatus({
        contextId: context.id,
        status: "expired",
        payloadForHash: { reason: "expired_by_accept" },
        eventType: "a2a.context.expired",
        expectedCurrentStatus: "open"
      });
      return reply.code(409).send({ error: "a2a_context_expired", event });
    }

    const task = await getTaskById(context.id, parsed.data.taskId);
    if (!task) {
      return reply.code(404).send({ error: "a2a_task_not_found" });
    }

    let event;
    try {
      event = await updateContextStatus({
        contextId: context.id,
        status: "accepted",
        acceptedTaskId: task.id,
        payloadForHash: {
          taskId: task.id,
          acceptedByAgentId: parsed.data.acceptedByAgentId
        },
        eventType: "a2a.context.accepted",
        expectedCurrentStatus: "open"
      });
    } catch (error) {
      if (asServiceError(error) === "stale_context_state") {
        const refreshed = await getContextById(context.id);
        if (refreshed?.status === "accepted" && refreshed.acceptedTaskId === task.id) {
          return reply.code(200).send({
            status: "accepted",
            contextId: refreshed.id,
            taskId: task.id,
            idempotent: true
          });
        }
        return reply.code(409).send({ error: "a2a_context_not_open", status: refreshed?.status ?? "unknown" });
      }
      throw error;
    }

    await recordBillingEvent({
      contextId: context.id,
      eventType: "a2a.context.accepted",
      units: 1,
      metadata: {
        taskId: task.id,
        acceptedByAgentId: parsed.data.acceptedByAgentId
      }
    });

    // Dispara a execução assíncrona on-chain delegando para a Execution Layer (Ponte)
    executionBridge.executeAcceptedTask(context.id, task).catch(e => {
      request.log.error({ err: e }, "Failed to trigger background execution");
    });

    return reply.code(202).send({ status: "accepted", contextId: context.id, taskId: task.id, event });
  }
);

server.post<{ Params: { id: string } }>(
  "/v1/a2a/contexts/:id/cancel",
  { preHandler: verifyInstitutionalAuth },
  async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    const parsed = CancelContextSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: "invalid_cancel_request", details: parsed.error.flatten() });
    }

    const context = await getContextById(request.params.id);
    if (!context) {
      return reply.code(404).send({ error: "a2a_context_not_found" });
    }

    if (context.status !== "open") {
      if (context.status === "cancelled") {
        return reply.code(200).send({ status: "cancelled", contextId: context.id, idempotent: true });
      }
      return reply.code(409).send({ error: "a2a_context_not_open", status: context.status });
    }

    let event;
    try {
      event = await updateContextStatus({
        contextId: context.id,
        status: "cancelled",
        payloadForHash: {
          cancelledByAgentId: parsed.data.cancelledByAgentId,
          reason: parsed.data.reason ?? null
        },
        eventType: "a2a.context.cancelled",
        expectedCurrentStatus: "open"
      });
    } catch (error) {
      if (asServiceError(error) === "stale_context_state") {
        const refreshed = await getContextById(context.id);
        if (refreshed?.status === "cancelled") {
          return reply.code(200).send({ status: "cancelled", contextId: refreshed.id, idempotent: true });
        }
        return reply.code(409).send({ error: "a2a_context_not_open", status: refreshed?.status ?? "unknown" });
      }
      throw error;
    }

    return reply.code(202).send({ status: "cancelled", contextId: context.id, event });
  }
);

server.post<{ Params: { id: string } }>(
  "/v1/a2a/contexts/:id/billing",
  { preHandler: verifyInstitutionalAuth },
  async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    const parsed = BillingEventSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: "invalid_billing_event", details: parsed.error.flatten() });
    }

    const context = await getContextById(request.params.id);
    if (!context) {
      return reply.code(404).send({ error: "a2a_context_not_found" });
    }

    const billing = await recordBillingEvent({
      contextId: context.id,
      eventType: parsed.data.eventType,
      units: parsed.data.units,
      metadata: parsed.data.metadata ?? {},
      idempotencyKey: parsed.data.idempotencyKey
    });

    return reply.code(201).send({ status: "recorded", billing });
  }
);

server.get<{ Params: { id: string } }>(
  "/v1/a2a/contexts/:id",
  async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    const context = await getContextById(request.params.id);
    if (!context) {
      return reply.code(404).send({ error: "a2a_context_not_found" });
    }

    const tasks = await listTasksByContextId(context.id, 10);
    const billing = await listBillingEventsByContextId(context.id, 10);
    return reply.code(200).send({ context, tasks, billing });
  }
);

server.get<{ Params: { id: string } }>(
  "/v1/a2a/contexts/:id/timeline",
  async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    const context = await getContextById(request.params.id);
    if (!context) {
      return reply.code(404).send({ error: "a2a_context_not_found" });
    }

    const events = await listContextEvents(context.id, 200);
    const tasks = await listTasksByContextId(context.id, 200);
    const billing = await listBillingEventsByContextId(context.id, 200);

    return reply.code(200).send({ contextId: context.id, status: context.status, events, tasks, billing });
  }
);

// ============================================================================
// SOLANA PAYMENTS LAYER ENDPOINTS
// ============================================================================

server.get("/v1/payments/solana/assets", async (_request: FastifyRequest, reply: FastifyReply) => {
  return reply.code(200).send({ status: "ok", assets: SUPPORTED_ASSETS });
});

server.post("/v1/payments/solana/request", async (request: FastifyRequest, reply: FastifyReply) => {
  const parsed = CreateSolanaPaymentRequestSchema.safeParse(request.body);
  if (!parsed.success) {
    return reply.code(400).send({ error: "invalid_payment_request", details: parsed.error.flatten() });
  }

  const { asset, recipientWallet, amountMinor, label, memo } = parsed.data;

  // Convert minor amount to decimal based on asset
  const supportedAsset = getAssetBySymbol(asset);
  // Fallback to manual decimal lookup if the helper isn't exposed
  let decimals = supportedAsset ? supportedAsset.decimals : 9;
  if (!supportedAsset && (asset === "USDC" || asset === "USDT" || asset === "PYUSD" || asset === "USDG")) decimals = 6;
  
  const amountDecimal = Number(amountMinor) / Math.pow(10, decimals);

  try {
    const paymentReq = solanaPaymentsLayer.createPaymentRequest(
      recipientWallet,
      asset,
      amountDecimal,
      memo,
      label
    );

    return reply.code(200).send({
      status: "ok",
      url: paymentReq.url,
      reference: paymentReq.reference,
      asset: paymentReq.asset.symbol,
      amount: paymentReq.amount
    });
  } catch (error) {
    return reply.code(500).send({ error: "payment_request_failed", message: asServiceError(error) });
  }
});

server.post("/v1/payments/solana/verify", async (request: FastifyRequest, reply: FastifyReply) => {
  const parsed = VerifySolanaPaymentSchema.safeParse(request.body);
  if (!parsed.success) {
    return reply.code(400).send({ error: "invalid_verify_request", details: parsed.error.flatten() });
  }

  const { asset, recipientWallet, amountMinor, reference } = parsed.data;

  let decimals = 9;
  if (asset === "USDC" || asset === "USDT" || asset === "PYUSD" || asset === "USDG") decimals = 6;
  const amountDecimal = Number(amountMinor) / Math.pow(10, decimals);

  try {
    const verification = await solanaPaymentsLayer.verifyPayment(
      reference,
      recipientWallet,
      asset,
      amountDecimal
    );

    return reply.code(200).send({
      status: verification.status,
      reason: verification.reason,
      txHash: verification.txHash
    });
  } catch (error) {
    return reply.code(500).send({ error: "payment_verification_failed", message: asServiceError(error) });
  }
});

// ============================================================================
// INTENT FIREWALL ENDPOINTS
// ============================================================================

server.post("/v1/a2a/intents/simulate", async (request: FastifyRequest, reply: FastifyReply) => {
  const parsed = IntentRequestSchema.safeParse(request.body);
  if (!parsed.success) {
    return reply.code(400).send({ error: "invalid_intent_request", details: parsed.error.flatten() });
  }

  const intent = parsed.data as IntentRequest;
  const adapter = resolveAdapter(intent.protocol);
  if (!adapter) {
    return reply.code(400).send({ error: "unsupported_protocol_adapter", protocol: intent.protocol });
  }

  const walletPublicKeyText = process.env.A2A_WALLET_PUBLIC_KEY;
  if (!walletPublicKeyText) {
    return reply.code(422).send({ error: "missing_a2a_wallet_public_key_env", env: "A2A_WALLET_PUBLIC_KEY" });
  }

  let walletPublicKey: PublicKey;
  try {
    walletPublicKey = new PublicKey(walletPublicKeyText);
  } catch {
    return reply.code(422).send({ error: "invalid_a2a_wallet_public_key_env", env: "A2A_WALLET_PUBLIC_KEY" });
  }

  const balanceLamports = await solanaConnection.getBalance(walletPublicKey);
  const balanceSol = balanceLamports / LAMPORTS_PER_SOL;
  const policyGate = intentFirewall.validateIntent(intent, balanceSol);
  
  if (!policyGate.allowed) {
    if (policyGate.status === "approval_required") {
      return reply.code(202).send({
        status: "approval_required",
        reason: policyGate.reason,
        reasonCode: policyGate.reasonCode,
        intentId: intent.intentId
      });
    }
    
    return reply.code(403).send({
      status: "blocked_by_intent_firewall",
      reason: policyGate.reason,
      reasonCode: policyGate.reasonCode,
      intentId: intent.intentId
    });
  }

  const simulation = await adapter.simulate(intent, solanaConnection, walletPublicKey.toBase58());
  if (!simulation.success) {
    return reply.code(422).send({
      status: "simulation_failed",
      intentId: intent.intentId,
      protocol: adapter.name,
      error: simulation.error ?? "unknown_simulation_error"
    });
  }

  return reply.code(200).send({
    status: "simulated",
    intentId: intent.intentId,
    protocol: adapter.name,
    treasuryBalanceSol: balanceSol,
    simulation: {
      estimatedOutput: simulation.estimatedOutput,
      priceImpactBps: simulation.priceImpactBps,
      feeEstimated: simulation.feeEstimated ?? null
    }
  });
});

server.get("/v1/metrics/a2a", async (_request: FastifyRequest, reply: FastifyReply) => {
  const metrics = await getA2AMetrics();
  return reply.code(200).send({ status: "ok", metrics });
});

// ============================================================================
// TREASURY VAULT ENDPOINTS (KAMINO / JIT)
// ============================================================================

server.post("/v1/a2a/treasury/activate", async (request: FastifyRequest, reply: FastifyReply) => {
  const schema = z.object({
    asset: z.string(),
    amount: z.number().positive(),
    walletAddress: z.string()
  });
  
  const parsed = schema.safeParse(request.body);
  if (!parsed.success) {
    return reply.code(400).send({ error: "invalid_treasury_activation", details: parsed.error.flatten() });
  }

  const result = await treasuryAgent.activateLiquidity(parsed.data.asset, parsed.data.amount, parsed.data.walletAddress);
  if (!result.success) {
    return reply.code(422).send({ status: "failed", message: result.message });
  }

  return reply.code(200).send(result);
});

server.post("/v1/a2a/treasury/park", async (request: FastifyRequest, reply: FastifyReply) => {
  const schema = z.object({
    asset: z.string(),
    amount: z.number().positive(),
    walletAddress: z.string()
  });
  
  const parsed = schema.safeParse(request.body);
  if (!parsed.success) {
    return reply.code(400).send({ error: "invalid_treasury_parking", details: parsed.error.flatten() });
  }

  const result = await treasuryAgent.parkIdleCapital(parsed.data.asset, parsed.data.amount, parsed.data.walletAddress);
  if (!result.success) {
    return reply.code(422).send({ status: "failed", message: result.message });
  }

  return reply.code(200).send(result);
});

const port = Number(process.env.A2A_SERVICE_PORT ?? 3008);

if (process.env.NODE_ENV !== "test") {
  server.listen({ port, host: "0.0.0.0" }).catch((err) => {
    server.log.error(err);
    process.exit(1);
  });
}

export { server };
