import fastify, { FastifyReply, FastifyRequest } from "fastify";
import { z } from "zod";
import { CreateIntentInputSchema, IntentStatus } from "@mind/schemas";
import { checkDb } from "./db/client.js";
import {
  computePolicyHash,
  createIntent,
  getIntentById,
  updateIntentPolicyHash,
  updateIntentStatus
} from "./db/repository.js";

const server = fastify({ logger: true });

server.get("/health", async () => ({
  status: "ok",
  service: "intent-service"
}));

server.get("/health/db", async (_request: FastifyRequest, reply: FastifyReply) => {
  try {
    await checkDb();
    return reply.code(200).send({ status: "ok", service: "intent-service", db: "ok" });
  } catch (error) {
    return reply.code(500).send({ status: "error", service: "intent-service", db: "error" });
  }
});

const PolicyCheckSchema = z.object({
  maxSlippageBps: z.number().int().min(0).max(10_000).optional(),
  policy: z.record(z.unknown()).optional()
});

const parseNumber = (value: unknown) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

server.post<{ Params: { id: string } }>(
  "/v1/intents/:id/policy/check",
  async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
  const parsed = PolicyCheckSchema.safeParse(request.body ?? {});
  if (!parsed.success) {
    return reply.code(400).send({ error: "invalid_policy_check", details: parsed.error.flatten() });
  }

  const intent = await getIntentById(request.params.id);
  if (!intent) {
    return reply.code(404).send({ error: "intent_not_found" });
  }

  const reasons: string[] = [];
  const maxAmount = parseNumber(process.env.POLICY_MAX_AMOUNT);
  const maxRisk = parseNumber(process.env.POLICY_MAX_RISK_SCORE);
  const maxSlippage = parseNumber(process.env.POLICY_MAX_SLIPPAGE_BPS);
  const requireApprovalOver = parseNumber(process.env.POLICY_REQUIRE_APPROVAL_OVER);

  const amount = parseNumber(intent.amount);
  const riskScore = parseNumber(intent.riskScore);

  if (maxAmount !== null && amount !== null && amount > maxAmount) {
    reasons.push("max_amount_exceeded");
  }
  if (maxRisk !== null && riskScore !== null && riskScore > maxRisk) {
    reasons.push("max_risk_exceeded");
  }
  if (maxSlippage !== null && parsed.data.maxSlippageBps !== undefined) {
    if (parsed.data.maxSlippageBps > maxSlippage) {
      reasons.push("max_slippage_exceeded");
    }
  }

  const requiresApproval =
    requireApprovalOver !== null && amount !== null ? amount > requireApprovalOver : false;

  const allowed = reasons.length === 0;

  const policyHash = parsed.data.policy ? computePolicyHash(parsed.data.policy) : null;
  if (policyHash) {
    await updateIntentPolicyHash(intent.id, policyHash);
  }

  return reply.code(200).send({ allowed, reasons, requiresApproval, policyHash });
});

server.post("/v1/intents", async (request: FastifyRequest, reply: FastifyReply) => {
  const parsed = CreateIntentInputSchema.safeParse(request.body);
  if (!parsed.success) {
    return reply.code(400).send({ error: "invalid_intent", details: parsed.error.flatten() });
  }
  if (!parsed.data.policyId) {
    return reply.code(400).send({ error: "policy_id_required" });
  }
  const result = await createIntent(parsed.data);
  return reply.code(201).send({
    status: "created",
    intentId: result.intentId,
    event: result.event,
    policyHash: null
  });
});

server.post<{ Params: { id: string } }>(
  "/v1/intents/:id/status",
  async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
  const body = request.body ?? {};
  const parsed = IntentStatus.safeParse((body as { status?: unknown }).status);
  if (!parsed.success) {
    return reply.code(400).send({ error: "invalid_status", details: parsed.error.flatten() });
  }
  const intent = await getIntentById(request.params.id);
  if (!intent) {
    return reply.code(404).send({ error: "intent_not_found" });
  }
  const event = await updateIntentStatus(intent.id, parsed.data);
  return reply.code(202).send({ status: "accepted", nextStatus: parsed.data, event });
});

server.get<{ Params: { id: string } }>(
  "/v1/intents/:id",
  async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
  const intent = await getIntentById(request.params.id);
  if (!intent) {
    return reply.code(404).send({ error: "intent_not_found" });
  }
  return reply.code(200).send({ intent });
});

const port = Number(process.env.INTENT_SERVICE_PORT ?? 3001);

server.listen({ port, host: "0.0.0.0" });
