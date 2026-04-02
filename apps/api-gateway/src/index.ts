import fastify, { FastifyReply, FastifyRequest } from "fastify";
import { z } from "zod";
import { CreateAgentInputSchema, CreateIntentInputSchema } from "@mind/schemas";
import { getJson, HttpRequestError, postJson } from "./http.js";

const server = fastify({ logger: true });

const rateLimitWindowMs = Number(process.env.API_GATEWAY_RATE_LIMIT_WINDOW_MS ?? 60000);
const rateLimitMax = Number(process.env.API_GATEWAY_RATE_LIMIT_MAX ?? 60);
const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

const isHealthRoute = (url: string) => url.startsWith("/health") || url.startsWith("/v1/health");

const getApiKey = (request: FastifyRequest) => {
  const header = request.headers["authorization"];
  if (typeof header === "string" && header.toLowerCase().startsWith("bearer ")) {
    return header.slice(7).trim();
  }
  const alt = request.headers["x-api-key"];
  return typeof alt === "string" ? alt : null;
};

server.addHook("preHandler", async (request, reply) => {
  if (isHealthRoute(request.url)) {
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
  intentId: z.string(),
  mode: z.enum(["simulated", "real"])
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

// Proxy to Execution Service
server.post("/v1/executions", async (request: FastifyRequest, reply: FastifyReply) => {
  const parsed = PlanExecutionInputSchema.safeParse(request.body);
  if (!parsed.success) {
    return reply.code(400).send({ error: "invalid_execution", details: parsed.error.flatten() });
  }

  const executionServiceUrl = process.env.EXECUTION_SERVICE_URL ?? "http://localhost:3006";
  try {
    const response = await postJson<Record<string, unknown>>(
      `${executionServiceUrl}/v1/executions/plan`,
      parsed.data
    );
    return reply.code(response.statusCode ?? 201).send(response.data);
  } catch (error) {
    return sendDownstreamError(reply, error);
  }
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
    source: z.enum(["covalent"]),
    payload: z.record(z.unknown())
  }),
  approval: z.object({
    channel: z.enum(["telegram", "whatsapp", "api"]),
    requesterId: z.string()
  }),
  execution: z.object({
    mode: z.enum(["simulated", "real"]),
    amount: z.string(),
    maxSlippageBps: z.number().int().min(0).max(10_000),
    priceBounds: z.object({ min: z.number().optional(), max: z.number().optional() }).optional(),
    expiresAt: z.string()
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

    const marketContext = await postJson<{ result?: { snapshotHash?: string } }>(
      `${marketContextServiceUrl}/v1/market-context/enrich`,
      parsed.data.marketContext
    );

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

    const policyCheck = await postJson<{
      allowed: boolean;
      reasons: string[];
      requiresApproval: boolean;
      policyHash?: string | null;
    }>(`${intentServiceUrl}/v1/intents/${intentResponse.data.intentId}/policy/check`, {
      maxSlippageBps: parsed.data.execution.maxSlippageBps,
      policy: policyRules
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
      `${executionServiceUrl}/v1/executions/plan`,
      {
        intentId: intentResponse.data.intentId,
        mode: parsed.data.execution.mode
      }
    );

    const executionRun = await postJson<{ receiptHash?: string; event?: { eventHash: string } }>(
      `${executionServiceUrl}/v1/executions/run`,
      {
        executionId: executionPlan.data.executionId,
        intentId: intentResponse.data.intentId,
        amount: parsed.data.execution.amount,
        maxSlippageBps: parsed.data.execution.maxSlippageBps,
        priceBounds: parsed.data.execution.priceBounds,
        expiresAt: parsed.data.execution.expiresAt
      }
    );

    const anchors = [
      marketContext.data?.result?.snapshotHash
        ? { type: "market_context", hash: marketContext.data.result.snapshotHash }
        : null,
      policyCheck.data?.policyHash ? { type: "policy_hash", hash: policyCheck.data.policyHash } : null,
      executionRun.data?.event?.eventHash
        ? { type: "execution_event", hash: executionRun.data.event.eventHash }
        : null,
      executionRun.data?.receiptHash
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
      proofId: proof.data.proofId,
      proofHash: proof.data.proofHash,
      policyHash: policyCheck.data?.policyHash ?? null,
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
    const response = await postJson<{ verified: boolean }>(
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

    return reply.code(200).send({
      status: "ok",
      intent: intent.data?.intent ?? null,
      approvals: approvals.data?.items ?? [],
      executions: executions.data?.items ?? [],
      proofs: proofs.data?.items ?? [],
      policyHash: intent.data?.intent?.policyHash ?? null,
      anchors: anchors?.data?.anchors ?? []
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

server.listen({ port, host: "0.0.0.0" });
