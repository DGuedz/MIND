import fastify, { FastifyReply, FastifyRequest } from "fastify";
import { CreateMarketContextInputSchema } from "@mind/schemas";
import { z } from "zod";
import { randomUUID } from "node:crypto";
import { fetchCovalentContext } from "./adapters/covalent.js";
import { checkDb, db } from "./db/client.js";
import { marketContexts } from "./db/schema.js";
import { getMarketContextById, listMarketContexts } from "./db/repository.js";

const server = fastify({ logger: true });

server.get("/health", async () => ({
  status: "ok",
  service: "market-context-service"
}));

server.get("/health/db", async (_request: FastifyRequest, reply: FastifyReply) => {
  try {
    await checkDb();
    return reply.code(200).send({ status: "ok", service: "market-context-service", db: "ok" });
  } catch (error) {
    return reply.code(500).send({ status: "error", service: "market-context-service", db: "error" });
  }
});

server.post("/v1/market-context", async (request: FastifyRequest, reply: FastifyReply) => {
  const parsed = CreateMarketContextInputSchema.safeParse(request.body);
  if (!parsed.success) {
    return reply.code(400).send({ error: "invalid_market_context", details: parsed.error.flatten() });
  }
  const id = randomUUID();
  const now = new Date();
  await db.insert(marketContexts).values({
    id,
    source: parsed.data.source,
    snapshotHash: parsed.data.snapshotHash,
    score: parsed.data.score.toString(),
    createdAt: now
  });
  return reply.code(201).send({ status: "created", marketContext: parsed.data });
});

server.get("/v1/market-context", async (request: FastifyRequest, reply: FastifyReply) => {
  const limitValue = Number((request.query as { limit?: string }).limit ?? "20");
  const limit = Number.isFinite(limitValue) ? Math.min(Math.max(limitValue, 1), 100) : 20;
  const contexts = await listMarketContexts(limit);
  return reply.code(200).send({ items: contexts });
});

server.get<{ Params: { id: string } }>(
  "/v1/market-context/:id",
  async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    const marketContext = await getMarketContextById(request.params.id);
    if (!marketContext) {
      return reply.code(404).send({ error: "market_context_not_found" });
    }
    return reply.code(200).send({ marketContext });
  }
);

const EnrichMarketContextSchema = z.object({
  source: z.enum(["covalent"]),
  payload: z.record(z.unknown())
});

server.post("/v1/market-context/enrich", async (request: FastifyRequest, reply: FastifyReply) => {
  const parsed = EnrichMarketContextSchema.safeParse(request.body);
  if (!parsed.success) {
    return reply.code(400).send({ error: "invalid_enrich_request", details: parsed.error.flatten() });
  }

  if (parsed.data.source === "covalent") {
    const result = await fetchCovalentContext(parsed.data.payload);
    if (result.status === "fetched" && result.snapshotHash) {
      const id = randomUUID();
      await db.insert(marketContexts).values({
        id,
        source: "covalent",
        snapshotHash: result.snapshotHash,
        score: "0",
        createdAt: new Date()
      });
      return reply.code(200).send({ status: "ok", source: "covalent", result, marketContextId: id });
    }
    return reply.code(200).send({ status: "ok", source: "covalent", result });
  }

  return reply.code(400).send({ error: "unsupported_source" });
});

const port = Number(process.env.MARKET_CONTEXT_SERVICE_PORT ?? 3002);

server.listen({ port, host: "0.0.0.0" });
