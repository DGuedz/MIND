import fastify, { FastifyReply, FastifyRequest } from "fastify";
import { CreateAgentInputSchema } from "@mind/schemas";
import { fetchAgentOnchain, registerAgentOnchain } from "./adapters/metaplex.js";
import { checkDb } from "./db/client.js";
import { createAgent, getAgentById, listAgents } from "./db/repository.js";

const server = fastify({ logger: true });

server.get("/health", async () => ({
  status: "ok",
  service: "registry-service"
}));

server.get("/health/db", async (_request: FastifyRequest, reply: FastifyReply) => {
  try {
    await checkDb();
    return reply.code(200).send({ status: "ok", service: "registry-service", db: "ok" });
  } catch (error) {
    return reply.code(500).send({ status: "error", service: "registry-service", db: "error" });
  }
});

server.post("/v1/agents/register", async (request: FastifyRequest, reply: FastifyReply) => {
  const parsed = CreateAgentInputSchema.safeParse(request.body);
  if (!parsed.success) {
    return reply.code(400).send({ error: "invalid_agent", details: parsed.error.flatten() });
  }
  const stored = await createAgent(parsed.data);
  const onchain = await registerAgentOnchain(parsed.data);
  return reply
    .code(201)
    .send({ status: "registered", agentId: stored.id, agent: parsed.data, onchain });
});

server.get<{ Params: { id: string } }>(
  "/v1/agents/:id",
  async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
  const agent = await getAgentById(request.params.id);
  if (!agent) {
    return reply.code(404).send({ error: "agent_not_found" });
  }
  return reply.code(200).send({ agent });
});

server.get("/v1/agents", async (request: FastifyRequest, reply: FastifyReply) => {
  const limitValue = Number((request.query as { limit?: string }).limit ?? "20");
  const limit = Number.isFinite(limitValue) ? Math.min(Math.max(limitValue, 1), 100) : 20;
  const agents = await listAgents(limit);
  return reply.code(200).send({ items: agents });
});

server.get<{ Params: { id: string } }>(
  "/v1/agents/:id/onchain",
  async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
  const onchain = await fetchAgentOnchain(request.params.id);
  return reply.code(200).send({ status: "ok", onchain });
});

const port = Number(process.env.REGISTRY_SERVICE_PORT ?? 3004);

server.listen({ port, host: "0.0.0.0" });
