import fastify, { FastifyReply, FastifyRequest } from "fastify";
import { z } from "zod";
import { Connection, LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";
import { checkDb } from "./db/client.js";
import { IntentFirewall } from "./core/IntentFirewall.js";
import { IntentRequest } from "./core/types.js";
import { JupiterAdapter } from "./adapters/JupiterAdapter.js";
import { SolanaPaymentsLayer } from "./core/payments/SolanaPaymentsLayer.js";
import { SUPPORTED_ASSETS, getAssetBySymbol } from "./core/payments/supportedAssets.js";
import {
  createProposal,
  createSession,
  getA2AMetrics,
  getProposalById,
  getSessionById,
  listBillingEventsBySessionId,
  listProposalsBySessionId,
  listSessionEvents,
  recordBillingEvent,
  updateSessionStatus
} from "./db/repository.js";

const server = fastify({ logger: true });
const intentFirewall = new IntentFirewall();
const jupiterAdapter = new JupiterAdapter();
const solanaNetwork = process.env.SOLANA_NETWORK === "devnet" ? "devnet" : "mainnet-beta";
const solanaConnection = new Connection(process.env.HELIUS_RPC_URL ?? "https://api.mainnet-beta.solana.com", "confirmed");
const solanaPaymentsLayer = new SolanaPaymentsLayer(solanaConnection, solanaNetwork);

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

const SessionStatusSchema = z.enum(["open", "accepted", "cancelled", "expired"]);

const isSessionExpired = (expiresAt: Date) => {
  return Date.now() > expiresAt.getTime();
};

const CreateSessionSchema = z.object({
  intentId: z.string(),
  initiatorAgentId: z.string(),
  counterpartyAgentId: z.string().optional(),
  expiresAt: z.string()
});

const CreateProposalSchema = z.object({
  proposerAgentId: z.string(),
  payload: z.record(z.unknown()),
  idempotencyKey: z.string().optional()
});

const AcceptSessionSchema = z.object({
  proposalId: z.string(),
  acceptedByAgentId: z.string()
});

const CancelSessionSchema = z.object({
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

server.post("/v1/a2a/sessions", async (request: FastifyRequest, reply: FastifyReply) => {
  const parsed = CreateSessionSchema.safeParse(request.body);
  if (!parsed.success) {
    return reply.code(400).send({ error: "invalid_a2a_session", details: parsed.error.flatten() });
  }

  const expiresAtTs = Date.parse(parsed.data.expiresAt);
  if (!Number.isFinite(expiresAtTs) || expiresAtTs <= Date.now()) {
    return reply.code(400).send({ error: "invalid_expires_at" });
  }

  const result = await createSession(parsed.data);
  return reply.code(201).send({ status: "created", sessionId: result.sessionId, event: result.event });
});

server.post<{ Params: { id: string } }>(
  "/v1/a2a/sessions/:id/proposals",
  async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    const parsed = CreateProposalSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: "invalid_a2a_proposal", details: parsed.error.flatten() });
    }

    const session = await getSessionById(request.params.id);
    if (!session) {
      return reply.code(404).send({ error: "a2a_session_not_found" });
    }

    const statusParsed = SessionStatusSchema.safeParse(session.status);
    if (!statusParsed.success) {
      return reply.code(500).send({ error: "invalid_session_status" });
    }

    if (isSessionExpired(session.expiresAt) && statusParsed.data === "open") {
      const event = await updateSessionStatus({
        sessionId: session.id,
        status: "expired",
        payloadForHash: { reason: "expired_by_proposal" },
        eventType: "a2a.session.expired",
        expectedCurrentStatus: "open"
      });
      return reply.code(409).send({ error: "a2a_session_expired", event });
    }

    if (statusParsed.data !== "open") {
      return reply.code(409).send({ error: "a2a_session_not_open", status: statusParsed.data });
    }

    const result = await createProposal({
      sessionId: session.id,
      proposerAgentId: parsed.data.proposerAgentId,
      payload: parsed.data.payload,
      idempotencyKey: parsed.data.idempotencyKey
    });

    return reply.code(201).send({
      status: "created",
      proposalId: result.proposalId,
      version: result.version,
      event: result.event,
      idempotent: result.event === null
    });
  }
);

server.post<{ Params: { id: string } }>(
  "/v1/a2a/sessions/:id/accept",
  async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    const parsed = AcceptSessionSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: "invalid_accept_request", details: parsed.error.flatten() });
    }

    const session = await getSessionById(request.params.id);
    if (!session) {
      return reply.code(404).send({ error: "a2a_session_not_found" });
    }

    if (session.status !== "open") {
      return reply.code(409).send({ error: "a2a_session_not_open", status: session.status });
    }

    if (isSessionExpired(session.expiresAt)) {
      const event = await updateSessionStatus({
        sessionId: session.id,
        status: "expired",
        payloadForHash: { reason: "expired_by_accept" },
        eventType: "a2a.session.expired",
        expectedCurrentStatus: "open"
      });
      return reply.code(409).send({ error: "a2a_session_expired", event });
    }

    const proposal = await getProposalById(session.id, parsed.data.proposalId);
    if (!proposal) {
      return reply.code(404).send({ error: "a2a_proposal_not_found" });
    }

    let event;
    try {
      event = await updateSessionStatus({
        sessionId: session.id,
        status: "accepted",
        acceptedProposalId: proposal.id,
        payloadForHash: {
          proposalId: proposal.id,
          acceptedByAgentId: parsed.data.acceptedByAgentId
        },
        eventType: "a2a.session.accepted",
        expectedCurrentStatus: "open"
      });
    } catch (error) {
      if (asServiceError(error) === "stale_session_state") {
        const refreshed = await getSessionById(session.id);
        if (refreshed?.status === "accepted" && refreshed.acceptedProposalId === proposal.id) {
          return reply.code(200).send({
            status: "accepted",
            sessionId: refreshed.id,
            proposalId: proposal.id,
            idempotent: true
          });
        }
        return reply.code(409).send({ error: "a2a_session_not_open", status: refreshed?.status ?? "unknown" });
      }
      throw error;
    }

    await recordBillingEvent({
      sessionId: session.id,
      eventType: "a2a.session.accepted",
      units: 1,
      metadata: {
        proposalId: proposal.id,
        acceptedByAgentId: parsed.data.acceptedByAgentId
      }
    });

    return reply.code(202).send({ status: "accepted", sessionId: session.id, proposalId: proposal.id, event });
  }
);

server.post<{ Params: { id: string } }>(
  "/v1/a2a/sessions/:id/cancel",
  async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    const parsed = CancelSessionSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: "invalid_cancel_request", details: parsed.error.flatten() });
    }

    const session = await getSessionById(request.params.id);
    if (!session) {
      return reply.code(404).send({ error: "a2a_session_not_found" });
    }

    if (session.status !== "open") {
      return reply.code(409).send({ error: "a2a_session_not_open", status: session.status });
    }

    let event;
    try {
      event = await updateSessionStatus({
        sessionId: session.id,
        status: "cancelled",
        payloadForHash: {
          cancelledByAgentId: parsed.data.cancelledByAgentId,
          reason: parsed.data.reason ?? null
        },
        eventType: "a2a.session.cancelled",
        expectedCurrentStatus: "open"
      });
    } catch (error) {
      if (asServiceError(error) === "stale_session_state") {
        const refreshed = await getSessionById(session.id);
        if (refreshed?.status === "cancelled") {
          return reply.code(200).send({ status: "cancelled", sessionId: refreshed.id, idempotent: true });
        }
        return reply.code(409).send({ error: "a2a_session_not_open", status: refreshed?.status ?? "unknown" });
      }
      throw error;
    }

    return reply.code(202).send({ status: "cancelled", sessionId: session.id, event });
  }
);

server.post<{ Params: { id: string } }>(
  "/v1/a2a/sessions/:id/billing",
  async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    const parsed = BillingEventSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: "invalid_billing_event", details: parsed.error.flatten() });
    }

    const session = await getSessionById(request.params.id);
    if (!session) {
      return reply.code(404).send({ error: "a2a_session_not_found" });
    }

    const billing = await recordBillingEvent({
      sessionId: session.id,
      eventType: parsed.data.eventType,
      units: parsed.data.units,
      metadata: parsed.data.metadata ?? {},
      idempotencyKey: parsed.data.idempotencyKey
    });

    return reply.code(201).send({ status: "recorded", billing });
  }
);

server.get<{ Params: { id: string } }>(
  "/v1/a2a/sessions/:id",
  async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    const session = await getSessionById(request.params.id);
    if (!session) {
      return reply.code(404).send({ error: "a2a_session_not_found" });
    }

    const proposals = await listProposalsBySessionId(session.id, 10);
    const billing = await listBillingEventsBySessionId(session.id, 10);
    return reply.code(200).send({ session, proposals, billing });
  }
);

server.get<{ Params: { id: string } }>(
  "/v1/a2a/sessions/:id/timeline",
  async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    const session = await getSessionById(request.params.id);
    if (!session) {
      return reply.code(404).send({ error: "a2a_session_not_found" });
    }

    const events = await listSessionEvents(session.id, 200);
    const proposals = await listProposalsBySessionId(session.id, 200);
    const billing = await listBillingEventsBySessionId(session.id, 200);

    return reply.code(200).send({ sessionId: session.id, status: session.status, events, proposals, billing });
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
    return reply.code(403).send({
      status: "blocked_by_intent_firewall",
      reason: policyGate.reason,
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

const port = Number(process.env.A2A_SERVICE_PORT ?? 3008);

server.listen({ port, host: "0.0.0.0" });
