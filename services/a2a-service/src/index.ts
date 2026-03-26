import fastify, { FastifyReply, FastifyRequest } from "fastify";
import { z } from "zod";
import { checkDb } from "./db/client.js";
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

server.get("/v1/metrics/a2a", async (_request: FastifyRequest, reply: FastifyReply) => {
  const metrics = await getA2AMetrics();
  return reply.code(200).send({ status: "ok", metrics });
});

const port = Number(process.env.A2A_SERVICE_PORT ?? 3008);

server.listen({ port, host: "0.0.0.0" });
