import fastify, { FastifyReply, FastifyRequest } from "fastify";
import { ApprovalDecision, CreateApprovalInputSchema } from "@mind/schemas";
import { checkDb } from "./db/client.js";
import {
  createApproval,
  getApprovalById,
  listApprovalsByIntentId,
  recordDecision
} from "./db/repository.js";
import { sendOpenClawApproval } from "./notifications/openclaw.js";
import { answerTelegramCallback, sendTelegramApproval } from "./notifications/telegram.js";

const server = fastify({ logger: true });

server.get("/health", async () => ({
  status: "ok",
  service: "approval-gateway-service"
}));

server.get("/health/db", async (_request: FastifyRequest, reply: FastifyReply) => {
  try {
    await checkDb();
    return reply.code(200).send({ status: "ok", service: "approval-gateway-service", db: "ok" });
  } catch (error) {
    return reply.code(500).send({ status: "error", service: "approval-gateway-service", db: "error" });
  }
});

// Telegram Onboarding Webhook (NoahAI/OpenClaw Flow)
server.post("/v1/onboard/tg-agent", async (request: FastifyRequest, reply: FastifyReply) => {
  const body = request.body as any;
  
  if (!body.agentToken || !body.wallet) {
    return reply.code(400).send({ error: "missing_fields", required: ["agentToken", "wallet"] });
  }

  // Simulate registering the agent and returning a deep link
  const agentId = `tg_agent_${Math.random().toString(36).substring(7)}`;
  server.log.info({ action: "tg_agent_onboarded", agentId, wallet: body.wallet }, "Telegram agent onboarded successfully");

  return reply.code(200).send({
    status: "success",
    agentId,
    message: "OpenClaw Agent detected and connected.",
    deepLink: `https://mind.app/connect?agent=${agentId}`
  });
});

server.post("/v1/approvals/request", async (request: FastifyRequest, reply: FastifyReply) => {
  const parsed = CreateApprovalInputSchema.safeParse(request.body);
  if (!parsed.success) {
    return reply.code(400).send({ error: "invalid_approval", details: parsed.error.flatten() });
  }
  const result = await createApproval(parsed.data);
  const summary = [
    `Nova Intent ${parsed.data.intentId}`,
    `Canal: ${parsed.data.channel}`,
    `Requester: ${parsed.data.requesterId}`
  ].join("\n");

  const publicBase = process.env.APPROVAL_GATEWAY_PUBLIC_URL ?? "";
  const decisionCallbackUrl = publicBase
    ? `${publicBase.replace(/\/$/, "")}/v1/approvals/${result.approvalId}/decision`
    : "";

  if (parsed.data.channel === "telegram") {
    await sendTelegramApproval({
      approvalId: result.approvalId,
      requesterId: parsed.data.requesterId,
      summary
    });
  } else {
    await sendOpenClawApproval({
      approvalId: result.approvalId,
      intentId: parsed.data.intentId,
      requesterId: parsed.data.requesterId,
      summary,
      decisionCallbackUrl
    });
  }

  return reply.code(202).send({
    status: "requested",
    approvalId: result.approvalId,
    event: result.event
  });
});

server.post<{ Params: { id: string } }>(
  "/v1/approvals/:id/decision",
  async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
  const body = request.body ?? {};
  const parsed = ApprovalDecision.safeParse((body as { decision?: unknown }).decision);
  if (!parsed.success) {
    return reply.code(400).send({ error: "invalid_decision", details: parsed.error.flatten() });
  }
  const approval = await getApprovalById(request.params.id);
  if (!approval) {
    return reply.code(404).send({ error: "approval_not_found" });
  }
  const event = await recordDecision(approval.id, parsed.data);
  return reply.code(202).send({ status: "recorded", decision: parsed.data, event });
});

server.get<{ Params: { id: string } }>(
  "/v1/approvals/:id",
  async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
  const approval = await getApprovalById(request.params.id);
  if (!approval) {
    return reply.code(404).send({ error: "approval_not_found" });
  }
  return reply.code(200).send({ approval });
});

server.get("/v1/approvals", async (request: FastifyRequest, reply: FastifyReply) => {
  const intentId = (request.query as { intentId?: string }).intentId;
  if (!intentId) {
    return reply.code(400).send({ error: "intent_id_required" });
  }
  const limitValue = Number((request.query as { limit?: string }).limit ?? "20");
  const limit = Number.isFinite(limitValue) ? Math.min(Math.max(limitValue, 1), 100) : 20;
  const approvals = await listApprovalsByIntentId(intentId, limit);
  return reply.code(200).send({ items: approvals });
});

server.post("/v1/approvals/telegram/webhook", async (request: FastifyRequest, reply: FastifyReply) => {
  const update = request.body as {
    callback_query?: { id: string; data?: string };
  };

  const data = update.callback_query?.data;
  if (!data) {
    return reply.code(200).send({ status: "ignored" });
  }

  const [action, approvalId] = data.split(":");
  const decision = action === "approve" ? "approved" : action === "reject" ? "rejected" : null;
  if (!decision || !approvalId) {
    return reply.code(200).send({ status: "ignored" });
  }

  const approval = await getApprovalById(approvalId);
  if (!approval) {
    return reply.code(404).send({ error: "approval_not_found" });
  }

  const event = await recordDecision(approval.id, decision);
  if (update.callback_query?.id) {
    await answerTelegramCallback({ callbackQueryId: update.callback_query.id });
  }

  return reply.code(200).send({ status: "recorded", decision, event });
});

const port = Number(process.env.APPROVAL_GATEWAY_SERVICE_PORT ?? 3003);

server.listen({ port, host: "0.0.0.0" });
