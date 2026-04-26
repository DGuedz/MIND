import fastify, { FastifyReply, FastifyRequest } from "fastify";
import { z } from "zod";
import { checkDb } from "./db/client.js";
import {
  computeProofHash,
  computeProofPayloadHash,
  createProof,
  getLatestProofEvent,
  getProofAnchors,
  getProofById,
  listProofEvents,
  listProofsByIntentId
} from "./db/repository.js";

const server = fastify({ logger: true });

server.get("/health", async () => ({
  status: "ok",
  service: "proof-service"
}));

server.get("/health/db", async (_request: FastifyRequest, reply: FastifyReply) => {
  try {
    await checkDb();
    return reply.code(200).send({ status: "ok", service: "proof-service", db: "ok" });
  } catch (error) {
    return reply.code(500).send({ status: "error", service: "proof-service", db: "error" });
  }
});

const CreateProofSchema = z.object({
  intentId: z.string(),
  approvalId: z.string().optional(),
  executionId: z.string().optional(),
  anchors: z.array(
    z.object({
      type: z.string(),
      hash: z.string()
    })
  )
});

const VerifyProofSchema = z.object({
  anchors: z.array(
    z.object({
      type: z.string(),
      hash: z.string()
    })
  )
});

server.post("/v1/proofs/compose", async (request: FastifyRequest, reply: FastifyReply) => {
  const parsed = CreateProofSchema.safeParse(request.body);
  if (!parsed.success) {
    return reply.code(400).send({ error: "invalid_proof_request", details: parsed.error.flatten() });
  }
  const result = await createProof(parsed.data);
  return reply.code(201).send({ status: "created", ...result });
});

server.get<{ Params: { id: string } }>(
  "/v1/proofs/:id",
  async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
  const proof = await getProofById(request.params.id);
  if (!proof) {
    return reply.code(404).send({ error: "proof_not_found" });
  }
  return reply.code(200).send({ proof });
});

server.get("/v1/proofs", async (request: FastifyRequest, reply: FastifyReply) => {
  const intentId = (request.query as { intentId?: string }).intentId;
  if (!intentId) {
    return reply.code(400).send({ error: "intent_id_required" });
  }
  const limitValue = Number((request.query as { limit?: string }).limit ?? "20");
  const limit = Number.isFinite(limitValue) ? Math.min(Math.max(limitValue, 1), 100) : 20;
  const proofs = await listProofsByIntentId(intentId, limit);
  return reply.code(200).send({ items: proofs });
});

server.post<{ Params: { id: string } }>(
  "/v1/proofs/:id/verify",
  async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
  const parsed = VerifyProofSchema.safeParse(request.body);
  if (!parsed.success) {
    return reply.code(400).send({ error: "invalid_verify_request", details: parsed.error.flatten() });
  }

  const proof = await getProofById(request.params.id);
  if (!proof) {
    return reply.code(404).send({ error: "proof_not_found" });
  }

  const event = await getLatestProofEvent(proof.id);
  if (!event) {
    return reply.code(404).send({ error: "proof_event_not_found" });
  }

  const payloadHash = computeProofPayloadHash({
    intentId: proof.intentId,
    approvalId: proof.approvalId ?? null,
    executionId: proof.executionId ?? null,
    anchors: parsed.data.anchors
  });

  const proofHash = computeProofHash(payloadHash, event.eventHash);
  const verified = payloadHash === event.payloadHash && proofHash === proof.proofHash;

  return reply.code(200).send({
    status: "ok",
    verified,
    payloadHash,
    eventHash: event.eventHash,
    proofHash
  });
});

server.get<{ Params: { id: string } }>(
  "/v1/proofs/:id/anchors",
  async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
  const proof = await getProofById(request.params.id);
  if (!proof) {
    return reply.code(404).send({ error: "proof_not_found" });
  }
  const anchors = await getProofAnchors(proof.id);
  return reply.code(200).send({ anchors });
});

server.get<{ Params: { id: string } }>(
  "/v1/proofs/:id/bundle",
  async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
  const proof = await getProofById(request.params.id);
  if (!proof) {
    return reply.code(404).send({ error: "proof_not_found" });
  }
  const anchors = await getProofAnchors(proof.id);
  const events = await listProofEvents(proof.id, 100);
  return reply.code(200).send({ proof, anchors, events });
});

const port = Number(process.env.PROOF_SERVICE_PORT ?? 3005);

server.listen({ port, host: "0.0.0.0" });
