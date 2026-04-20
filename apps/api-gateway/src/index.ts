import fastify, { FastifyReply, FastifyRequest } from "fastify";
import { z } from "zod";
import { CreateAgentInputSchema, CreateIntentInputSchema } from "@mind/schemas";
import { getJson, HttpRequestError, postJson } from "./http.js";

const server = fastify({ logger: true });

const rateLimitWindowMs = Number(process.env.API_GATEWAY_RATE_LIMIT_WINDOW_MS ?? 60000);
const rateLimitMax = Number(process.env.API_GATEWAY_RATE_LIMIT_MAX ?? 60);
const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

const isHealthRoute = (url: string) => url.startsWith("/health") || url.startsWith("/v1/health");
const isPublicReadRoute = (method: string, url: string) =>
  method.toUpperCase() === "GET" && url.startsWith("/v1/market/signals");

const getApiKey = (request: FastifyRequest) => {
  const header = request.headers["authorization"];
  if (typeof header === "string" && header.toLowerCase().startsWith("bearer ")) {
    return header.slice(7).trim();
  }
  const alt = request.headers["x-api-key"];
  return typeof alt === "string" ? alt : null;
};

server.addHook("preHandler", async (request, reply) => {
  if (isHealthRoute(request.url) || isPublicReadRoute(request.method, request.url)) {
    return;
  }

  const apiKey = process.env.API_GATEWAY_API_KEY;
  if (apiKey) {
    const provided = getApiKey(request);
    if (!provided || provided !== apiKey) {
      reply.code(401).send({ error: "unauthorized" });
      return;
    }
  }

  const now = Date.now();
  const key = request.ip ?? "unknown";
  const entry = rateLimitStore.get(key);
  if (!entry || now >= entry.resetAt) {
    rateLimitStore.set(key, { count: 1, resetAt: now + rateLimitWindowMs });
    return;
  }

  if (entry.count >= rateLimitMax) {
    reply.code(429).send({ error: "rate_limited" });
    return;
  }

  entry.count += 1;
});

const PlanExecutionInputSchema = z.object({
  intentId: z.string().min(1),
  mode: z.enum(["simulated", "real"]).default("simulated"),
  protocol: z.enum(["JUPITER", "ORCA", "RAYDIUM", "METEORA"]).optional(),
  policyHash: z.string().optional()
});

const RunExecutionInputSchema = z.object({
  executionId: z.string().optional(),
  intentId: z.string().optional(),
  taskId: z.string().optional(),
  mode: z.enum(["simulated", "real"]).optional(),
  protocol: z.enum(["JUPITER", "ORCA", "RAYDIUM", "METEORA"]).optional(),
  action: z.enum(["TRANSFER", "SWAP"]).default("SWAP"),
  amount: z.union([z.number(), z.string()]).optional(),
  amountAtomic: z.union([z.number(), z.string()]).optional(),
  asset: z.string().optional(),
  assetIn: z.string().optional(),
  assetOut: z.string().optional(),
  destination: z.string().optional(),
  walletId: z.string().optional(),
  maxSlippageBps: z.number().int().min(0).max(10_000).optional(),
  priceBounds: z.object({ min: z.number().optional(), max: z.number().optional() }).optional(),
  expiresAt: z.string().optional(),
  policyHash: z.string().optional()
});

const CreateA2AContextInputSchema = z.object({
  intentId: z.string(),
  initiatorAgentId: z.string(),
  counterpartyAgentId: z.string().optional(),
  expiresAt: z.string()
});

const CreateA2ATaskInputSchema = z.object({
  executorAgentId: z.string(),
  payload: z.record(z.unknown()),
  idempotencyKey: z.string().optional()
});

const AcceptA2AContextInputSchema = z.object({
  taskId: z.string(),
  acceptedByAgentId: z.string()
});

const CancelA2AContextInputSchema = z.object({
  cancelledByAgentId: z.string(),
  reason: z.string().optional()
});

const X402ChainSchema = z.enum(["solana", "ethereum", "polygon"]);
const X402AssetSchema = z.enum(["SOL", "USDC", "USDT", "PYUSD", "USDG"]);

const X402PaymentRequestSchema = z.object({
  amount: z.union([z.number(), z.string()]),
  currency: X402AssetSchema,
  recipient: z.string().min(32),
  chain: X402ChainSchema.default("solana"),
  metadata: z.record(z.unknown()).optional()
});

const X402PaymentVerifySchema = z.object({
  paymentId: z.string().min(32),
  amount: z.union([z.number(), z.string()]),
  currency: X402AssetSchema,
  recipient: z.string().min(32),
  chain: X402ChainSchema.default("solana")
});

const SourceOfTruthVerifySchema = z.object({
  proofId: z.string().min(1).optional(),
  payment: X402PaymentVerifySchema.optional()
});

const sendDownstreamError = (reply: FastifyReply, error: unknown) => {
  if (error instanceof HttpRequestError) {
    const statusCode = error.statusCode ?? 502;
    try {
      const parsed = JSON.parse(error.body) as Record<string, unknown>;
      return reply.code(statusCode).send(parsed);
    } catch (parseError) {
      return reply.code(statusCode).send({
        error: "downstream_error",
        method: error.method,
        url: error.url,
        details: error.body
      });
    }
  }

  return reply.code(502).send({
    error: "downstream_unavailable",
    details: (error as Error).message
  });
};

const parseFiniteNumber = (value: unknown): number | null => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const toMinorAmount = (asset: z.infer<typeof X402AssetSchema>, amountDecimal: number): string | null => {
  if (!Number.isFinite(amountDecimal) || amountDecimal <= 0) return null;
  const decimals = asset === "USDC" || asset === "USDT" || asset === "PYUSD" || asset === "USDG" ? 6 : 9;
  const minor = Math.round(amountDecimal * Math.pow(10, decimals));
  if (!Number.isFinite(minor) || minor <= 0) return null;
  return String(minor);
};

type EcosystemSignalItem = {
  protocol_name: string;
  source_url: string;
  source_type: string;
  published_at: string;
  timestamp: string;
  headline: string;
  summary: string;
  claim_type: string;
  classification_layer: "public_ecosystem_signal" | "verified_onchain_metric";
  confidence_score: number;
  content_hash: string;
  last_seen_at: string;
};

type EcosystemSignalsResponse = {
  feed: "ecosystem_intel";
  layer: "public_ecosystem_signal";
  stale: boolean;
  fallback_reason?: string;
  source_mode: "remote_feed" | "fallback_snapshot";
  cached_at: string;
  items: EcosystemSignalItem[];
};

const marketSignalsCacheTtlMs = Number(process.env.MARKET_SIGNALS_CACHE_TTL_MS ?? 30_000);
const marketSignalsFeedUrl = (process.env.MARKET_INTEL_FEED_URL ?? "").trim();
let marketSignalsCache: { expiresAt: number; payload: EcosystemSignalsResponse } | null = null;

const fallbackEcosystemSignals = (): EcosystemSignalItem[] => {
  const now = new Date().toISOString();
  const publishedAt = "2026-04-01T00:00:00.000Z";
  return [
    {
      protocol_name: "Kamino",
      source_url: "https://app.kamino.finance/",
      source_type: "product_page",
      published_at: publishedAt,
      timestamp: now,
      headline: "Kamino Prime market footprint highlighted",
      summary: "Institutional collateral management updates tracked as ecosystem signal.",
      claim_type: "company_claim",
      classification_layer: "public_ecosystem_signal",
      confidence_score: 0.62,
      content_hash: "8d8762afdb69616f5f79e5a627e5798b77a0524ae7189bdb2eb0df8cb5f96656",
      last_seen_at: now
    },
    {
      protocol_name: "Meteora",
      source_url: "https://meteora.ag/",
      source_type: "product_page",
      published_at: publishedAt,
      timestamp: now,
      headline: "Liquidity routing programs remain active",
      summary: "Public ecosystem communication indicates active liquidity incentives.",
      claim_type: "liquidity_program",
      classification_layer: "public_ecosystem_signal",
      confidence_score: 0.68,
      content_hash: "7b8f2b73ad2f6211d737ea04d5a35a6b4174e2fe777526845109fab64f4f64d2",
      last_seen_at: now
    },
    {
      protocol_name: "Ondo",
      source_url: "https://ondo.finance/",
      source_type: "institutional_announcement",
      published_at: publishedAt,
      timestamp: now,
      headline: "RWA expansion narratives tied to Solana ecosystem",
      summary: "Institutional footprint references are tracked as market signal only.",
      claim_type: "company_claim",
      classification_layer: "public_ecosystem_signal",
      confidence_score: 0.6,
      content_hash: "d5d32fa5bbf6ec5c7d9f60942a7766fd80f3f090c94295f5f6ecf0af45d311e5",
      last_seen_at: now
    }
  ];
};

server.get("/health", async () => ({
  status: "ok",
  service: "api-gateway"
}));

server.get("/health/db", async (_request: FastifyRequest, reply: FastifyReply) => {
  return reply.send({ status: "ok" });
});

server.post("/v1/agents/register", async (request: FastifyRequest, reply: FastifyReply) => {
  const parsed = CreateAgentInputSchema.safeParse(request.body);
  if (!parsed.success) {
    return reply.code(400).send({ error: "invalid_agent", details: parsed.error.flatten() });
  }

  const registryServiceUrl = process.env.REGISTRY_SERVICE_URL ?? "http://localhost:3004";
  try {
    const response = await postJson<Record<string, unknown>>(
      `${registryServiceUrl}/v1/agents/register`,
      parsed.data
    );
    return reply.code(response.statusCode ?? 201).send(response.data);
  } catch (error) {
    return sendDownstreamError(reply, error);
  }
});

server.get<{ Params: { id: string } }>(
  "/v1/agents/:id/onchain",
  async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    const registryServiceUrl = process.env.REGISTRY_SERVICE_URL ?? "http://localhost:3004";
    try {
      const response = await getJson<{
        status?: string;
        onchain?: {
          status?: string;
          statusCode?: number;
          raw?: Record<string, unknown>;
        } | null;
      }>(`${registryServiceUrl}/v1/agents/${request.params.id}/onchain`);

      const onchain = response.data?.onchain ?? null;
      const raw = onchain?.raw ?? null;
      let payload: unknown = raw;
      if (typeof raw === "string") {
        try {
          payload = JSON.parse(raw);
        } catch {
          payload = raw;
        }
      }
      const providerError =
        payload && typeof payload === "object" && "error" in payload
          ? ((payload as { error: Record<string, unknown> }).error ?? null)
          : null;

      return reply.code(200).send({
        status: "ok",
        agentId: request.params.id,
        onchain_lookup_status: onchain?.status ?? "unknown",
        statusCode: onchain?.statusCode ?? null,
        payload,
        providerError
      });
    } catch (error) {
      return sendDownstreamError(reply, error);
    }
  }
);

server.post("/v1/intents", async (request: FastifyRequest, reply: FastifyReply) => {
  const parsed = CreateIntentInputSchema.safeParse(request.body);
  if (!parsed.success) {
    return reply.code(400).send({ error: "invalid_intent", details: parsed.error.flatten() });
  }

  const intentServiceUrl = process.env.INTENT_SERVICE_URL ?? "http://localhost:3001";
  try {
    const response = await postJson<Record<string, unknown>>(`${intentServiceUrl}/v1/intents`, parsed.data);
    return reply.code(response.statusCode ?? 201).send(response.data);
  } catch (error) {
    return sendDownstreamError(reply, error);
  }
});

server.post("/v1/payment/x402", async (request: FastifyRequest, reply: FastifyReply) => {
  const parsed = X402PaymentRequestSchema.safeParse(request.body);
  if (!parsed.success) {
    return reply.code(400).send({ error: "invalid_x402_payment_request", details: parsed.error.flatten() });
  }

  if (parsed.data.chain !== "solana") {
    return reply.code(400).send({ error: "unsupported_chain", chain: parsed.data.chain });
  }

  const amountDecimal = parseFiniteNumber(parsed.data.amount);
  if (amountDecimal === null) {
    return reply.code(400).send({ error: "invalid_amount" });
  }

  const amountMinor = toMinorAmount(parsed.data.currency, amountDecimal);
  if (!amountMinor) {
    return reply.code(400).send({ error: "invalid_amount_minor" });
  }

  const a2aServiceUrl = process.env.A2A_SERVICE_URL ?? "http://localhost:3008";
  const label = "MIND Protocol x402";
  const memo = typeof parsed.data.metadata?.memo === "string" ? parsed.data.metadata.memo : undefined;
  const intentId = typeof parsed.data.metadata?.intentId === "string" ? parsed.data.metadata.intentId : undefined;

  try {
    const response = await postJson<{
      status: string;
      url: string;
      reference: string;
      asset: string;
      amount: number;
    }>(`${a2aServiceUrl}/v1/payments/solana/request`, {
      asset: parsed.data.currency,
      recipientWallet: parsed.data.recipient,
      amountMinor,
      label,
      memo,
      intentId
    });

    return reply.code(200).send({
      paymentId: response.data.reference,
      status: "pending",
      chain: "solana",
      transactionHash: null,
      paymentUrl: response.data.url,
      reference: response.data.reference,
      asset: response.data.asset,
      amount: response.data.amount
    });
  } catch (error) {
    return sendDownstreamError(reply, error);
  }
});

server.post("/v1/payment/x402/verify", async (request: FastifyRequest, reply: FastifyReply) => {
  const parsed = X402PaymentVerifySchema.safeParse(request.body);
  if (!parsed.success) {
    return reply.code(400).send({ error: "invalid_x402_verify_request", details: parsed.error.flatten() });
  }

  if (parsed.data.chain !== "solana") {
    return reply.code(400).send({ error: "unsupported_chain", chain: parsed.data.chain });
  }

  const amountDecimal = parseFiniteNumber(parsed.data.amount);
  if (amountDecimal === null) {
    return reply.code(400).send({ error: "invalid_amount" });
  }

  const amountMinor = toMinorAmount(parsed.data.currency, amountDecimal);
  if (!amountMinor) {
    return reply.code(400).send({ error: "invalid_amount_minor" });
  }

  const a2aServiceUrl = process.env.A2A_SERVICE_URL ?? "http://localhost:3008";

  try {
    const response = await postJson<{
      status: "pending" | "reference_not_found" | "confirmed" | "failed";
      reason?: string;
      txHash?: string;
    }>(`${a2aServiceUrl}/v1/payments/solana/verify`, {
      asset: parsed.data.currency,
      recipientWallet: parsed.data.recipient,
      amountMinor,
      reference: parsed.data.paymentId
    });

    return reply.code(200).send({
      paymentId: parsed.data.paymentId,
      status: response.data.status,
      chain: "solana",
      transactionHash: response.data.txHash ?? null,
      reason: response.data.reason ?? null
    });
  } catch (error) {
    return sendDownstreamError(reply, error);
  }
});

server.post("/v1/source-of-truth/verify", async (request: FastifyRequest, reply: FastifyReply) => {
  const parsed = SourceOfTruthVerifySchema.safeParse(request.body);
  if (!parsed.success) {
    return reply.code(400).send({ error: "invalid_source_of_truth_request", details: parsed.error.flatten() });
  }

  const evidence: string[] = [];
  const reason_codes: string[] = [];
  const required_followups: string[] = [];

  const checks: Record<string, unknown> = {};

  if (parsed.data.payment) {
    const payment = parsed.data.payment;
    const amountDecimal = parseFiniteNumber(payment.amount);
    if (amountDecimal === null) {
      return reply.code(400).send({ error: "invalid_amount" });
    }
    const amountMinor = toMinorAmount(payment.currency, amountDecimal);
    if (!amountMinor) {
      return reply.code(400).send({ error: "invalid_amount_minor" });
    }

    const a2aServiceUrl = process.env.A2A_SERVICE_URL ?? "http://localhost:3008";
    try {
      const paymentVerify = await postJson<{
        status: "pending" | "reference_not_found" | "confirmed" | "failed";
        reason?: string;
        txHash?: string;
      }>(`${a2aServiceUrl}/v1/payments/solana/verify`, {
        asset: payment.currency,
        recipientWallet: payment.recipient,
        amountMinor,
        reference: payment.paymentId
      });
      checks.payment = paymentVerify.data;
      evidence.push(`payment:${payment.paymentId}:${paymentVerify.data.status}`);
      if (paymentVerify.data.status !== "confirmed") {
        reason_codes.push("RC_MISSING_EVIDENCE");
        required_followups.push("payment_not_confirmed");
      }
    } catch (error) {
      reason_codes.push("RC_TOOL_FAILURE");
      required_followups.push("payment_verification_failed");
      return sendDownstreamError(reply, error);
    }
  }

  if (parsed.data.proofId) {
    const proofServiceUrl = process.env.PROOF_SERVICE_URL ?? "http://localhost:3005";
    try {
      const anchorsResp = await getJson<{ anchors: unknown[] }>(`${proofServiceUrl}/v1/proofs/${parsed.data.proofId}/anchors`);
      const verifyResp = await postJson<{
        status: string;
        verified: boolean;
        payloadHash: string;
        eventHash: string;
        proofHash: string;
      }>(`${proofServiceUrl}/v1/proofs/${parsed.data.proofId}/verify`, { anchors: anchorsResp.data.anchors });

      checks.proof = verifyResp.data;
      evidence.push(`proof:${parsed.data.proofId}:${verifyResp.data.verified ? "verified" : "unverified"}`);
      if (!verifyResp.data.verified) {
        reason_codes.push("RC_MISSING_EVIDENCE");
        required_followups.push("proof_unverified");
      }
    } catch (error) {
      reason_codes.push("RC_TOOL_FAILURE");
      required_followups.push("proof_verification_failed");
      return sendDownstreamError(reply, error);
    }
  }

  const hasBlocking = required_followups.length > 0;
  const decision = hasBlocking ? (reason_codes.includes("RC_TOOL_FAILURE") ? "INSUFFICIENT_EVIDENCE" : "INSUFFICIENT_EVIDENCE") : "ALLOW";

  return reply.code(200).send({
    decision,
    reason_codes,
    confidence: decision === "ALLOW" ? 0.9 : 0.6,
    assumptions: [],
    required_followups,
    evidence,
    checks
  });
});

// Proxy to Execution Service
server.post("/v1/executions", async (request: FastifyRequest, reply: FastifyReply) => {
  const parsed = PlanExecutionInputSchema.safeParse(request.body);
  if (!parsed.success) {
    return reply.code(400).send({ error: "invalid_execution", details: parsed.error.flatten() });
  }

  const executionServiceUrl = process.env.EXECUTION_SERVICE_URL ?? "http://localhost:3006";
  try {
    const response = await postJson<Record<string, unknown>>(
      `${executionServiceUrl}/v1/executions`,
      parsed.data
    );
    return reply.code(response.statusCode ?? 201).send(response.data);
  } catch (error) {
    return sendDownstreamError(reply, error);
  }
});

server.post("/v1/executions/run", async (request: FastifyRequest, reply: FastifyReply) => {
  const parsed = RunExecutionInputSchema.safeParse(request.body);
  if (!parsed.success) {
    return reply.code(400).send({ error: "invalid_execution_run", details: parsed.error.flatten() });
  }

  const executionServiceUrl = process.env.EXECUTION_SERVICE_URL ?? "http://localhost:3006";
  try {
    const response = await postJson<Record<string, unknown>>(
      `${executionServiceUrl}/v1/executions/run`,
      parsed.data
    );
    return reply.code(response.statusCode ?? 200).send(response.data);
  } catch (error) {
    return sendDownstreamError(reply, error);
  }
});

// --- NOVOS ENDPOINTS MIND API v1 ---

// Discovery
server.post("/v1/discovery/cards", async (request: FastifyRequest, reply: FastifyReply) => {
  const registryServiceUrl = process.env.REGISTRY_SERVICE_URL ?? "http://localhost:3004";
  try {
    const response = await postJson<Record<string, unknown>>(
      `${registryServiceUrl}/v1/discovery/cards`,
      request.body as Record<string, unknown>
    );
    return reply.code(response.statusCode ?? 200).send(response.data);
  } catch (error) {
    return sendDownstreamError(reply, error);
  }
});

server.post("/v1/discovery/validate", async (request: FastifyRequest, reply: FastifyReply) => {
  const registryServiceUrl = process.env.REGISTRY_SERVICE_URL ?? "http://localhost:3004";
  try {
    const response = await postJson<Record<string, unknown>>(
      `${registryServiceUrl}/v1/discovery/validate`,
      request.body as any
    );
    return reply.code(response.statusCode ?? 200).send(response.data);
  } catch (error) {
    return sendDownstreamError(reply, error);
  }
});

// Autonomous Execution (Proxy to Execution Service)
server.post("/v1/execute/autonomous", async (request: FastifyRequest, reply: FastifyReply) => {
  const executionServiceUrl = process.env.EXECUTION_SERVICE_URL ?? "http://localhost:3006";
  try {
    const response = await postJson<Record<string, unknown>>(
      `${executionServiceUrl}/v1/execute/autonomous`,
      request.body as any
    );
    return reply.code(response.statusCode ?? 200).send(response.data);
  } catch (error) {
    return sendDownstreamError(reply, error);
  }
});

// Market Intelligence (Proxy to Market Context Service)
server.post("/v1/market/intel", async (request: FastifyRequest, reply: FastifyReply) => {
  const marketContextServiceUrl = process.env.MARKET_CONTEXT_SERVICE_URL ?? "http://localhost:3003";
  try {
    const response = await postJson<Record<string, unknown>>(
      `${marketContextServiceUrl}/v1/market/intel`,
      request.body as any
    );
    return reply.code(response.statusCode ?? 200).send(response.data);
  } catch (error) {
    return sendDownstreamError(reply, error);
  }
});

// Risk Assessment (Proxy to Market Context Service)
server.post("/v1/risk/assess", async (request: FastifyRequest, reply: FastifyReply) => {
  const marketContextServiceUrl = process.env.MARKET_CONTEXT_SERVICE_URL ?? "http://localhost:3003";
  try {
    const response = await postJson<Record<string, unknown>>(
      `${marketContextServiceUrl}/v1/risk/assess`,
      request.body as any
    );
    return reply.code(response.statusCode ?? 200).send(response.data);
  } catch (error) {
    return sendDownstreamError(reply, error);
  }
});

server.get("/v1/market/signals", async (_request: FastifyRequest, reply: FastifyReply) => {
  const now = Date.now();
  if (marketSignalsCache && now < marketSignalsCache.expiresAt) {
    return reply.code(200).send(marketSignalsCache.payload);
  }

  const cachedAt = new Date().toISOString();
  const buildPayload = (
    items: EcosystemSignalItem[],
    stale: boolean,
    sourceMode: "remote_feed" | "fallback_snapshot",
    fallbackReason?: string
  ): EcosystemSignalsResponse => ({
    feed: "ecosystem_intel",
    layer: "public_ecosystem_signal",
    stale,
    source_mode: sourceMode,
    fallback_reason: fallbackReason,
    cached_at: cachedAt,
    items: items
      .filter((item) => item.classification_layer === "public_ecosystem_signal")
      .map((item) => ({
        ...item,
        confidence_score: Math.max(0, Math.min(1, Number(item.confidence_score ?? 0))),
        last_seen_at: item.last_seen_at || cachedAt,
        timestamp: item.timestamp || cachedAt
      }))
  });

  try {
    const marketContextServiceUrl = process.env.MARKET_CONTEXT_SERVICE_URL ?? "http://localhost:3002";
    const response = await getJson<{ items?: any[] }>(`${marketContextServiceUrl}/v1/market/signals`);
    if (response.data?.items && response.data.items.length > 0) {
      const payload = buildPayload(response.data.items as any[], false, "remote_feed");
      marketSignalsCache = { payload, expiresAt: now + marketSignalsCacheTtlMs };
      return reply.code(200).send(payload);
    }
  } catch (error) {
    server.log.warn({ error: (error as Error).message }, "market signals service unavailable, using fallback snapshot");
  }

  const payload = buildPayload(
    fallbackEcosystemSignals(),
    true,
    "fallback_snapshot",
    marketSignalsFeedUrl ? "remote_feed_unavailable" : "remote_feed_not_configured"
  );
  marketSignalsCache = { payload, expiresAt: now + marketSignalsCacheTtlMs };
  return reply.code(200).send(payload);
});

// Analytics
server.post("/v1/analytics/track", async (request: FastifyRequest, reply: FastifyReply) => {
  // Por enquanto, apenas logamos os eventos de analytics no console ou event-router
  console.log(`[ANALYTICS] ${JSON.stringify(request.body)}`);
  return reply.code(200).send({ status: "tracked" });
});

server.get("/v1/analytics/performance", async (request: FastifyRequest, reply: FastifyReply) => {
  // Mock de performance analytics
  return reply.code(200).send({
    totalTransactions: 1250,
    monthlyRevenue: 45200,
    activeAgents: 42,
    successRate: 0.98,
    averageLatency: 120,
    chainDistribution: {
      solana: 0.85,
      ethereum: 0.10,
      polygon: 0.05
    }
  });
});

server.post("/v1/a2a/contexts", async (request: FastifyRequest, reply: FastifyReply) => {
  const parsed = CreateA2AContextInputSchema.safeParse(request.body);
  if (!parsed.success) {
    return reply.code(400).send({ error: "invalid_a2a_context", details: parsed.error.flatten() });
  }

  const a2aServiceUrl = process.env.A2A_SERVICE_URL ?? "http://localhost:3008";
  try {
    const response = await postJson<Record<string, unknown>>(`${a2aServiceUrl}/v1/a2a/contexts`, parsed.data, { Authorization: "Bearer MIND_INSTITUTIONAL_ADMIN" });
    return reply.code(response.statusCode ?? 201).send(response.data);
  } catch (error) {
    return sendDownstreamError(reply, error);
  }
});

server.post<{ Params: { id: string } }>(
  "/v1/a2a/contexts/:id/tasks",
  async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    const parsed = CreateA2ATaskInputSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: "invalid_a2a_task", details: parsed.error.flatten() });
    }

    const a2aServiceUrl = process.env.A2A_SERVICE_URL ?? "http://localhost:3008";
    try {
      const response = await postJson<Record<string, unknown>>(
        `${a2aServiceUrl}/v1/a2a/contexts/${request.params.id}/tasks`,
        parsed.data,
        { Authorization: "Bearer MIND_INSTITUTIONAL_ADMIN" }
      );
      return reply.code(response.statusCode ?? 201).send(response.data);
    } catch (error) {
      return sendDownstreamError(reply, error);
    }
  }
);

server.post<{ Params: { id: string } }>(
  "/v1/a2a/contexts/:id/accept",
  async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    const parsed = AcceptA2AContextInputSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: "invalid_a2a_accept", details: parsed.error.flatten() });
    }

    const a2aServiceUrl = process.env.A2A_SERVICE_URL ?? "http://localhost:3008";
    try {
      const response = await postJson<Record<string, unknown>>(
        `${a2aServiceUrl}/v1/a2a/contexts/${request.params.id}/accept`,
        parsed.data,
        { Authorization: "Bearer MIND_INSTITUTIONAL_ADMIN" }
      );
      return reply.code(response.statusCode ?? 202).send(response.data);
    } catch (error) {
      return sendDownstreamError(reply, error);
    }
  }
);

server.post<{ Params: { id: string } }>(
  "/v1/a2a/contexts/:id/cancel",
  async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    const parsed = CancelA2AContextInputSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: "invalid_a2a_cancel", details: parsed.error.flatten() });
    }

    const a2aServiceUrl = process.env.A2A_SERVICE_URL ?? "http://localhost:3008";
    try {
      const response = await postJson<Record<string, unknown>>(
        `${a2aServiceUrl}/v1/a2a/contexts/${request.params.id}/cancel`,
        parsed.data,
        { Authorization: "Bearer MIND_INSTITUTIONAL_ADMIN" }
      );
      return reply.code(response.statusCode ?? 202).send(response.data);
    } catch (error) {
      return sendDownstreamError(reply, error);
    }
  }
);
server.post<{ Params: { id: string } }>(
  "/v1/a2a/contexts/:id/billing",
  async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
  const a2aServiceUrl = process.env.A2A_SERVICE_URL ?? "http://localhost:3008";
  try {
    const response = await postJson<Record<string, unknown>>(
      `${a2aServiceUrl}/v1/a2a/contexts/${request.params.id}/billing`,
      request.body ?? {},
      { Authorization: "Bearer MIND_INSTITUTIONAL_ADMIN" }
    );
    return reply.code(response.statusCode ?? 201).send(response.data);
  } catch (error) {
    return sendDownstreamError(reply, error);
  }
});


server.get<{ Params: { id: string } }>(
  "/v1/a2a/contexts/:id",
  async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    const a2aServiceUrl = process.env.A2A_SERVICE_URL ?? "http://localhost:3008";
    try {
      const response = await getJson<Record<string, unknown>>(
        `${a2aServiceUrl}/v1/a2a/contexts/${request.params.id}`,
        { Authorization: "Bearer MIND_INSTITUTIONAL_ADMIN" }
      );
      return reply.code(200).send(response.data);
    } catch (error) {
      return sendDownstreamError(reply, error);
    }
  }
);

server.get<{ Params: { id: string } }>(
  "/v1/a2a/contexts/:id/timeline",
  async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    const a2aServiceUrl = process.env.A2A_SERVICE_URL ?? "http://localhost:3008";
    try {
      const response = await getJson<Record<string, unknown>>(
        `${a2aServiceUrl}/v1/a2a/contexts/${request.params.id}/timeline`,
        { Authorization: "Bearer MIND_INSTITUTIONAL_ADMIN" }
      );
      return reply.code(200).send(response.data);
    } catch (error) {
      return sendDownstreamError(reply, error);
    }
  }
);

server.get("/v1/metrics/a2a", async (_request: FastifyRequest, reply: FastifyReply) => {
  const a2aServiceUrl = process.env.A2A_SERVICE_URL ?? "http://localhost:3008";
  try {
    const response = await getJson<Record<string, unknown>>(`${a2aServiceUrl}/v1/metrics/a2a`);
    return reply.code(200).send(response.data);
  } catch (error) {
    return sendDownstreamError(reply, error);
  }
});

const HeroFlowSchema = z.object({
  agent: CreateAgentInputSchema,
  intent: CreateIntentInputSchema,
  marketContext: z.object({
    source: z.enum(["covalent", "jupiter"]),
    payload: z.record(z.unknown())
  }),
  approval: z.object({
    channel: z.enum(["telegram", "whatsapp", "api"]),
    requesterId: z.string()
  }),
  execution: z.object({
    mode: z.enum(["simulated", "real"]),
    protocol: z.enum(["JUPITER", "ORCA", "RAYDIUM", "METEORA"]).optional(),
    amount: z.string(),
    asset: z.string().default("USDC"),
    assetIn: z.string().optional(),
    assetOut: z.string().optional(),
    destination: z.string().optional(),
    walletId: z.string().default(process.env.TURNKEY_SIGN_WITH || "mock-wallet-id"),
    maxSlippageBps: z.number().int().min(0).max(10_000),
    priceBounds: z.object({ min: z.number().optional(), max: z.number().optional() }).optional(),
    expiresAt: z.string(),
    policyHash: z.string().optional()
  })
});

const IntentRequestSchema = z.object({
  intentId: z.string().min(1),
  contextId: z.string().optional(),
  taskId: z.string().optional(),
  channel: z.enum(["telegram", "whatsapp", "api"]).default("telegram"),
  requesterId: z.string().min(1),
  action: z.string().min(1).optional(),
  amount: z.string().min(1).optional()
});

const AgentHaltSchema = z.object({
  agentId: z.string().min(1),
  reason: z.string().min(1)
});

const AgentRebalanceSchema = z.object({
  targetAsset: z.string().min(1),
  strategy: z.string().min(1)
});

const TgOnboardSchema = z.object({
  agentToken: z.string().min(1),
  wallet: z.string().min(1)
});

server.post("/v1/onboard/tg-agent", async (request: FastifyRequest, reply: FastifyReply) => {
  const parsed = TgOnboardSchema.safeParse(request.body ?? {});
  if (!parsed.success) {
    return reply.code(400).send({ error: "invalid_tg_onboard_request", details: parsed.error.flatten() });
  }

  const approvalServiceUrl = process.env.APPROVAL_GATEWAY_SERVICE_URL ?? "http://localhost:3003";
  try {
    const response = await postJson<Record<string, unknown>>(
      `${approvalServiceUrl}/v1/onboard/tg-agent`,
      parsed.data
    );
    return reply.code(response.statusCode ?? 200).send(response.data);
  } catch (error) {
    return sendDownstreamError(reply, error);
  }
});

server.post("/v1/intents/request", async (request: FastifyRequest, reply: FastifyReply) => {
  const parsed = IntentRequestSchema.safeParse(request.body ?? {});
  if (!parsed.success) {
    return reply.code(400).send({ error: "invalid_intent_request", details: parsed.error.flatten() });
  }

  const approvalServiceUrl = process.env.APPROVAL_GATEWAY_SERVICE_URL ?? "http://localhost:3003";
  try {
    const response = await postJson<{ approvalId?: string; event?: unknown }>(
      `${approvalServiceUrl}/v1/approvals/request`,
      {
        intentId: parsed.data.intentId,
        contextId: parsed.data.contextId,
        taskId: parsed.data.taskId,
        channel: parsed.data.channel,
        requesterId: parsed.data.requesterId
      }
    );

    return reply.code(response.statusCode ?? 202).send({
      status: "requested",
      intentId: parsed.data.intentId,
      approvalId: response.data?.approvalId ?? null,
      event: response.data?.event ?? null
    });
  } catch (error) {
    return sendDownstreamError(reply, error);
  }
});

server.post("/v1/agent/halt", async (request: FastifyRequest, reply: FastifyReply) => {
  const parsed = AgentHaltSchema.safeParse(request.body ?? {});
  if (!parsed.success) {
    return reply.code(400).send({ error: "invalid_agent_halt", details: parsed.error.flatten() });
  }

  server.log.warn(
    { action: "agent_halt_requested", agentId: parsed.data.agentId, reason: parsed.data.reason },
    "Agent halt requested"
  );

  return reply.code(202).send({
    status: "halted",
    agentId: parsed.data.agentId,
    reason: parsed.data.reason,
    timestamp: new Date().toISOString()
  });
});

server.post("/v1/agent/rebalance", async (request: FastifyRequest, reply: FastifyReply) => {
  const parsed = AgentRebalanceSchema.safeParse(request.body ?? {});
  if (!parsed.success) {
    return reply.code(400).send({ error: "invalid_agent_rebalance", details: parsed.error.flatten() });
  }

  server.log.info(
    {
      action: "agent_rebalance_requested",
      targetAsset: parsed.data.targetAsset,
      strategy: parsed.data.strategy
    },
    "Agent rebalance requested"
  );

  return reply.code(202).send({
    status: "queued",
    targetAsset: parsed.data.targetAsset,
    strategy: parsed.data.strategy,
    timestamp: new Date().toISOString()
  });
});

server.post("/v1/hero-flow/run", async (request: FastifyRequest, reply: FastifyReply) => {
  const parsed = HeroFlowSchema.safeParse(request.body);
  if (!parsed.success) {
    return reply.code(400).send({ error: "invalid_hero_flow", details: parsed.error.flatten() });
  }

  const intentServiceUrl = process.env.INTENT_SERVICE_URL ?? "http://localhost:3001";
  const marketContextServiceUrl = process.env.MARKET_CONTEXT_SERVICE_URL ?? "http://localhost:3002";
  const approvalServiceUrl = process.env.APPROVAL_GATEWAY_SERVICE_URL ?? "http://localhost:3003";
  const registryServiceUrl = process.env.REGISTRY_SERVICE_URL ?? "http://localhost:3004";
  const proofServiceUrl = process.env.PROOF_SERVICE_URL ?? "http://localhost:3005";
  const executionServiceUrl = process.env.EXECUTION_SERVICE_URL ?? "http://localhost:3006";

  try {
    const registry = await postJson<{ status: string; onchain?: unknown }>(
      `${registryServiceUrl}/v1/agents/register`,
      parsed.data.agent
    );

    const marketContext = await postJson<{
      result?: {
        snapshotHash?: string;
        policyContext?: {
          suggestedMaxSlippageBps?: number;
          riskBufferBps?: number;
          mevRiskScore?: number;
          latencyPenaltyBps?: number;
          tokenVerificationRatio?: number;
          hasUnverifiedToken?: boolean;
          reasonHints?: string[];
          mocked?: boolean;
        };
      };
    }>(
      `${marketContextServiceUrl}/v1/market-context/enrich`,
      parsed.data.marketContext
    );

    const jupiterPolicyContext =
      parsed.data.marketContext.source === "jupiter"
        ? marketContext.data?.result?.policyContext
        : undefined;

    const intentPayload = {
      ...parsed.data.intent,
      marketContextId: marketContext.data?.result?.snapshotHash
    };

    const intentResponse = await postJson<{
      intentId: string;
      event: { eventHash: string };
      policyHash?: string | null;
    }>(
      `${intentServiceUrl}/v1/intents`,
      intentPayload
    );

    const policyRules = {
      maxAmount: process.env.POLICY_MAX_AMOUNT ?? null,
      maxRiskScore: process.env.POLICY_MAX_RISK_SCORE ?? null,
      maxSlippageBps: process.env.POLICY_MAX_SLIPPAGE_BPS ?? null,
      requireApprovalOver: process.env.POLICY_REQUIRE_APPROVAL_OVER ?? null
    };

    const intentEconomics = parsed.data.intent as unknown as {
      expectedProfitBps?: number;
      latencyPenaltyBps?: number;
      mevRiskScore?: number;
      notional?: number | string;
    };

    const intentExpectedProfitBps = intentEconomics.expectedProfitBps;
    const intentLatencyPenaltyBps = intentEconomics.latencyPenaltyBps;
    const intentMevRiskScore = intentEconomics.mevRiskScore;
    const intentNotional = Number(intentEconomics.notional ?? parsed.data.intent.amount);
    const contextRiskBufferBps = parseFiniteNumber(jupiterPolicyContext?.riskBufferBps);
    const contextLatencyPenaltyBps = parseFiniteNumber(jupiterPolicyContext?.latencyPenaltyBps);
    const contextMevRiskScore = parseFiniteNumber(jupiterPolicyContext?.mevRiskScore);
    const contextSuggestedSlippageBps = parseFiniteNumber(jupiterPolicyContext?.suggestedMaxSlippageBps);

    const effectiveSlippageBps =
      contextSuggestedSlippageBps !== null
        ? Math.min(parsed.data.execution.maxSlippageBps, contextSuggestedSlippageBps)
        : parsed.data.execution.maxSlippageBps;

    const economics =
      intentExpectedProfitBps !== undefined ||
      intentLatencyPenaltyBps !== undefined ||
      intentMevRiskScore !== undefined ||
      contextRiskBufferBps !== null ||
      contextLatencyPenaltyBps !== null ||
      contextMevRiskScore !== null
        ? {
            expectedProfitBps: intentExpectedProfitBps ?? 0,
            executionCostBps: effectiveSlippageBps,
            latencyPenaltyBps: intentLatencyPenaltyBps ?? contextLatencyPenaltyBps ?? 0,
            mevRiskScore: intentMevRiskScore ?? contextMevRiskScore ?? 0,
            riskBufferBps: contextRiskBufferBps ?? undefined,
            notional: Number.isFinite(intentNotional) ? intentNotional : undefined,
            marketTokenVerificationRatio:
              parseFiniteNumber(jupiterPolicyContext?.tokenVerificationRatio) ?? undefined
          }
        : undefined;

    const policyCheck = await postJson<{
      allowed: boolean;
      reasons: string[];
      requiresApproval: boolean;
      decision?: "ALLOW" | "REQUIRE_APPROVAL" | "REJECT";
      policyHash?: string | null;
      economics?: { evNetBps?: number } | null;
    }>(`${intentServiceUrl}/v1/intents/${intentResponse.data.intentId}/policy/check`, {
      maxSlippageBps: effectiveSlippageBps,
      policy: policyRules,
      economics,
      marketContext:
        parsed.data.marketContext.source === "jupiter" && jupiterPolicyContext
          ? {
              source: "jupiter",
              policyContext: jupiterPolicyContext
            }
          : undefined
    });

    if (!policyCheck.data.allowed) {
      return reply.code(403).send({
        status: "blocked",
        intentId: intentResponse.data.intentId,
        reasons: policyCheck.data.reasons
      });
    }

    if (policyCheck.data.requiresApproval) {
      const response = await postJson<{ approvalId: string; event: { eventHash: string } }>(
        `${approvalServiceUrl}/v1/approvals/request`,
        {
          intentId: intentResponse.data.intentId,
          channel: parsed.data.approval.channel,
          requesterId: parsed.data.approval.requesterId
        }
      );
      return reply.code(202).send({
        status: "awaiting_approval",
        intentId: intentResponse.data.intentId,
        approvalId: response.data.approvalId
      });
    }

    const executionPlan = await postJson<{ executionId: string }>(
      `${executionServiceUrl}/v1/executions`,
      {
        intentId: intentResponse.data.intentId,
        mode: parsed.data.execution.mode,
        protocol: parsed.data.execution.protocol,
        policyHash: policyCheck.data.policyHash ?? parsed.data.execution.policyHash
      }
    );

    const executionRun = await postJson<{
      status?: string;
      txHash?: string | null;
      receiptHash?: string | null;
      routeHash?: string | null;
      executionHash?: string | null;
      policyHash?: string | null;
    }>(`${executionServiceUrl}/v1/executions/run`, {
        executionId: executionPlan.data.executionId,
        intentId: intentResponse.data.intentId,
        mode: parsed.data.execution.mode,
        protocol: parsed.data.execution.protocol,
        action: "TRANSFER",
        amount: parseFloat(parsed.data.execution.amount) || 1,
        asset: parsed.data.execution.asset,
        assetIn: parsed.data.execution.assetIn,
        assetOut: parsed.data.execution.assetOut,
        destination: parsed.data.execution.destination,
        walletId: parsed.data.execution.walletId,
        maxSlippageBps: parsed.data.execution.maxSlippageBps,
        priceBounds: parsed.data.execution.priceBounds,
        expiresAt: parsed.data.execution.expiresAt,
        policyHash: policyCheck.data.policyHash ?? parsed.data.execution.policyHash
      });

    const anchors = [
      marketContext.data?.result?.snapshotHash
        ? { type: "market_context", hash: marketContext.data.result.snapshotHash }
        : null,
      policyCheck.data?.policyHash ? { type: "policy_hash", hash: policyCheck.data.policyHash } : null,
      executionRun.data?.routeHash ? { type: "route_hash", hash: executionRun.data.routeHash } : null,
      executionRun.data?.executionHash
        ? { type: "execution_hash", hash: executionRun.data.executionHash }
        : null,
      executionRun.data?.txHash
        ? { type: "execution_tx", hash: executionRun.data.txHash }
        : executionRun.data?.receiptHash
          ? { type: "execution_receipt", hash: executionRun.data.receiptHash }
        : null
    ].filter(Boolean) as { type: string; hash: string }[];

    const proof = await postJson<{ proofId: string; proofHash: string }>(
        `${proofServiceUrl}/v1/proofs/compose`,
        {
          intentId: intentResponse.data.intentId,
          approvalId: undefined,
          executionId: executionPlan.data.executionId,
          anchors
        }
      );

    return reply.code(200).send({
      status: "completed",
      intentId: intentResponse.data.intentId,
      approvalId: null,
      executionId: executionPlan.data.executionId,
      executionStatus: executionRun.data?.status ?? null,
      routeHash: executionRun.data?.routeHash ?? null,
      executionHash: executionRun.data?.executionHash ?? null,
      proofId: proof.data.proofId,
      proofHash: proof.data.proofHash,
      policyHash: policyCheck.data?.policyHash ?? null,
      evNetBps: policyCheck.data?.economics?.evNetBps ?? null,
      registry: registry.data,
      marketContext: marketContext.data,
      anchors
    });
  } catch (error) {
    return sendDownstreamError(reply, error);
  }
});

const VerifyProofSchema = z.object({
  anchors: z.array(
    z.object({
      type: z.string(),
      hash: z.string()
    })
  )
});

server.post<{ Params: { id: string } }>(
  "/v1/proofs/:id/verify",
  async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
  const parsed = VerifyProofSchema.safeParse(request.body);
  if (!parsed.success) {
    return reply.code(400).send({ error: "invalid_verify_request", details: parsed.error.flatten() });
  }

  const proofServiceUrl = process.env.PROOF_SERVICE_URL ?? "http://localhost:3005";
  try {
    const response = await postJson<{
      verified: boolean;
      internalVerified?: boolean;
      strictMetaplexAnchor?: boolean;
      externalAnchorStatus?: "pending" | "confirmed" | "failed";
      externalProvider?: string | null;
      metaplexConfirmed?: boolean;
      metaplexProofTx?: string | null;
      metaplexRegistryRef?: string | null;
      metaplex_proof_tx?: string | null;
      metaplex_registry_ref?: string | null;
      reason?: string | null;
    }>(
      `${proofServiceUrl}/v1/proofs/${request.params.id}/verify`,
      parsed.data
    );
    return reply.code(200).send(response.data);
  } catch (error) {
    return sendDownstreamError(reply, error);
  }
});

server.get<{ Params: { id: string } }>(
  "/v1/hero-flow/:id/status",
  async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
  const intentId = request.params.id;
  const intentServiceUrl = process.env.INTENT_SERVICE_URL ?? "http://localhost:3001";
  const approvalServiceUrl = process.env.APPROVAL_GATEWAY_SERVICE_URL ?? "http://localhost:3003";
  const proofServiceUrl = process.env.PROOF_SERVICE_URL ?? "http://localhost:3005";
  const executionServiceUrl = process.env.EXECUTION_SERVICE_URL ?? "http://localhost:3006";

  try {
    const intent = await getJson<{ intent?: { policyHash?: string | null } }>(
      `${intentServiceUrl}/v1/intents/${intentId}`
    );
    const approvals = await getJson<{ items?: unknown[] }>(
      `${approvalServiceUrl}/v1/approvals?intentId=${encodeURIComponent(intentId)}`
    );
    const executions = await getJson<{ items?: unknown[] }>(
      `${executionServiceUrl}/v1/executions?intentId=${encodeURIComponent(intentId)}`
    );
    const proofs = await getJson<{ items?: unknown[] }>(
      `${proofServiceUrl}/v1/proofs?intentId=${encodeURIComponent(intentId)}`
    );
    const latestProofId =
      proofs.data?.items && proofs.data.items.length > 0
        ? (proofs.data.items[0] as { id?: string }).id
        : null;
    const anchors = latestProofId
      ? await getJson<{ anchors?: unknown[] }>(`${proofServiceUrl}/v1/proofs/${latestProofId}/anchors`)
      : null;

    let sourceOfTruth:
      | {
          decision: "ALLOW" | "BLOCK" | "INSUFFICIENT_EVIDENCE" | "NEEDS_HUMAN_APPROVAL";
          reason_codes: string[];
          confidence: number;
          assumptions: string[];
          required_followups: string[];
          evidence: string[];
          checks: Record<string, unknown>;
        }
      | null = null;

    if (!latestProofId) {
      sourceOfTruth = {
        decision: "INSUFFICIENT_EVIDENCE",
        reason_codes: ["RC_MISSING_EVIDENCE"],
        confidence: 0.5,
        assumptions: [],
        required_followups: ["missing_proof"],
        evidence: [],
        checks: {}
      };
    } else {
      try {
        const anchorsList = anchors?.data?.anchors ?? [];
        const verifyResp = await postJson<{
          status: string;
          verified: boolean;
          payloadHash: string;
          eventHash: string;
          proofHash: string;
        }>(`${proofServiceUrl}/v1/proofs/${latestProofId}/verify`, { anchors: anchorsList });

        sourceOfTruth = {
          decision: verifyResp.data.verified ? "ALLOW" : "INSUFFICIENT_EVIDENCE",
          reason_codes: verifyResp.data.verified ? [] : ["RC_MISSING_EVIDENCE"],
          confidence: verifyResp.data.verified ? 0.9 : 0.6,
          assumptions: [],
          required_followups: verifyResp.data.verified ? [] : ["proof_unverified"],
          evidence: [`proof:${latestProofId}:${verifyResp.data.verified ? "verified" : "unverified"}`],
          checks: { proof: verifyResp.data }
        };
      } catch {
        sourceOfTruth = {
          decision: "INSUFFICIENT_EVIDENCE",
          reason_codes: ["RC_TOOL_FAILURE"],
          confidence: 0.5,
          assumptions: [],
          required_followups: ["proof_verification_failed"],
          evidence: [`proof:${latestProofId}:tool_failure`],
          checks: {}
        };
      }
    }

    return reply.code(200).send({
      status: "ok",
      intent: intent.data?.intent ?? null,
      approvals: approvals.data?.items ?? [],
      executions: executions.data?.items ?? [],
      proofs: proofs.data?.items ?? [],
      policyHash: intent.data?.intent?.policyHash ?? null,
      anchors: anchors?.data?.anchors ?? [],
      sourceOfTruth
    });
  } catch (error) {
    return sendDownstreamError(reply, error);
  }
});

server.get<{ Params: { id: string } }>(
  "/v1/proofs/:id/anchors",
  async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
  const proofServiceUrl = process.env.PROOF_SERVICE_URL ?? "http://localhost:3005";
  try {
    const response = await getJson<{ anchors?: unknown[] }>(
      `${proofServiceUrl}/v1/proofs/${request.params.id}/anchors`
    );
    return reply.code(200).send(response.data);
  } catch (error) {
    return sendDownstreamError(reply, error);
  }
});

server.get<{ Params: { id: string } }>(
  "/v1/proofs/:id/bundle",
  async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
  const proofServiceUrl = process.env.PROOF_SERVICE_URL ?? "http://localhost:3005";
  try {
    const response = await getJson<Record<string, unknown>>(
      `${proofServiceUrl}/v1/proofs/${request.params.id}/bundle`
    );
    return reply.code(200).send(response.data);
  } catch (error) {
    return sendDownstreamError(reply, error);
  }
});

server.get("/v1/health/services", async (_request: FastifyRequest, reply: FastifyReply) => {
  const intentServiceUrl = process.env.INTENT_SERVICE_URL ?? "http://localhost:3001";
  const marketContextServiceUrl = process.env.MARKET_CONTEXT_SERVICE_URL ?? "http://localhost:3002";
  const approvalServiceUrl = process.env.APPROVAL_GATEWAY_SERVICE_URL ?? "http://localhost:3003";
  const registryServiceUrl = process.env.REGISTRY_SERVICE_URL ?? "http://localhost:3004";
  const proofServiceUrl = process.env.PROOF_SERVICE_URL ?? "http://localhost:3005";
  const executionServiceUrl = process.env.EXECUTION_SERVICE_URL ?? "http://localhost:3006";
  const signerServiceUrl = process.env.SIGNER_SERVICE_URL ?? "http://localhost:3007";
  const a2aServiceUrl = process.env.A2A_SERVICE_URL ?? "http://localhost:3008";

  const services = [
    { name: "intent-service", url: `${intentServiceUrl}/health` },
    { name: "market-context-service", url: `${marketContextServiceUrl}/health` },
    { name: "approval-gateway-service", url: `${approvalServiceUrl}/health` },
    { name: "registry-service", url: `${registryServiceUrl}/health` },
    { name: "proof-service", url: `${proofServiceUrl}/health` },
    { name: "execution-service", url: `${executionServiceUrl}/health` },
    { name: "signer-service", url: `${signerServiceUrl}/health` },
    { name: "a2a-service", url: `${a2aServiceUrl}/health` }
  ];

  const results = await Promise.all(
    services.map(async (service) => {
      try {
        const response = await getJson<Record<string, unknown>>(service.url);
        return { name: service.name, status: "ok", response: response.data };
      } catch (error) {
        return { name: service.name, status: "error", error: (error as Error).message };
      }
    })
  );

  return reply.code(200).send({ status: "ok", services: results });
});

server.get("/v1/health/db", async (_request: FastifyRequest, reply: FastifyReply) => {
  const intentServiceUrl = process.env.INTENT_SERVICE_URL ?? "http://localhost:3001";
  const marketContextServiceUrl = process.env.MARKET_CONTEXT_SERVICE_URL ?? "http://localhost:3002";
  const approvalServiceUrl = process.env.APPROVAL_GATEWAY_SERVICE_URL ?? "http://localhost:3003";
  const registryServiceUrl = process.env.REGISTRY_SERVICE_URL ?? "http://localhost:3004";
  const proofServiceUrl = process.env.PROOF_SERVICE_URL ?? "http://localhost:3005";
  const executionServiceUrl = process.env.EXECUTION_SERVICE_URL ?? "http://localhost:3006";
  const a2aServiceUrl = process.env.A2A_SERVICE_URL ?? "http://localhost:3008";

  const services = [
    { name: "intent-service", url: `${intentServiceUrl}/health/db` },
    { name: "market-context-service", url: `${marketContextServiceUrl}/health/db` },
    { name: "approval-gateway-service", url: `${approvalServiceUrl}/health/db` },
    { name: "registry-service", url: `${registryServiceUrl}/health/db` },
    { name: "proof-service", url: `${proofServiceUrl}/health/db` },
    { name: "execution-service", url: `${executionServiceUrl}/health/db` },
    { name: "a2a-service", url: `${a2aServiceUrl}/health/db` }
  ];

  const results = await Promise.all(
    services.map(async (service) => {
      try {
        const response = await getJson<Record<string, unknown>>(service.url);
        return { name: service.name, status: "ok", response: response.data };
      } catch (error) {
        return { name: service.name, status: "error", error: (error as Error).message };
      }
    })
  );

  return reply.code(200).send({ status: "ok", services: results });
});

const port = Number(process.env.API_GATEWAY_PORT ?? 3000);

export { server };

if (process.env.API_GATEWAY_START !== "false") {
  server.listen({ port, host: "0.0.0.0" }).catch((err) => {
    server.log.error(err);
    process.exit(1);
  });
}
