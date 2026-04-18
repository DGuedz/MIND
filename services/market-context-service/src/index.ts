import fastify, { FastifyReply, FastifyRequest } from "fastify";
import { CreateMarketContextInputSchema } from "@mind/schemas";
import { z } from "zod";
import { randomUUID } from "node:crypto";
import { fetchCovalentContext } from "./adapters/covalent.js";
import { checkDb, db } from "./db/client.js";
import { marketContexts } from "./db/schema.js";
import { getMarketContextById, listMarketContexts } from "./db/repository.js";

const server = fastify({ logger: true });

const DecisionSchema = z.enum([
  "ALLOW",
  "BLOCK",
  "INSUFFICIENT_EVIDENCE",
  "NEEDS_HUMAN_APPROVAL"
]);

const ReasonCodeSchema = z.enum([
  "RC_POLICY_VIOLATION",
  "RC_PROMPT_INJECTION",
  "RC_SECRET_EXFIL_ATTEMPT",
  "RC_UNTRUSTED_OVERRIDE_ATTEMPT",
  "RC_MISSING_EVIDENCE",
  "RC_HIGH_RISK_NO_APPROVAL",
  "RC_TOOL_FAILURE",
  "RC_RATE_LIMIT_OR_RPC_BLOCKED"
]);

type Decision = z.infer<typeof DecisionSchema>;
type ReasonCode = z.infer<typeof ReasonCodeSchema>;

type DecisionEnvelope = {
  decision: Decision;
  reason_codes: ReasonCode[];
  confidence: number;
  assumptions: string[];
  required_followups: string[];
  evidence: string[];
};

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

const buildDecision = (input: {
  decision: Decision;
  reasonCodes?: ReasonCode[];
  confidence: number;
  assumptions?: string[];
  requiredFollowups?: string[];
  evidence?: string[];
}): DecisionEnvelope => {
  return {
    decision: input.decision,
    reason_codes: input.reasonCodes ?? [],
    confidence: input.confidence,
    assumptions: input.assumptions ?? [],
    required_followups: input.requiredFollowups ?? [],
    evidence: input.evidence ?? []
  };
};

server.post("/v1/market-context/enrich", async (request: FastifyRequest, reply: FastifyReply) => {
  const parsed = EnrichMarketContextSchema.safeParse(request.body);
  if (!parsed.success) {
    return reply.code(400).send({
      error: "invalid_enrich_request",
      details: parsed.error.flatten(),
      decision: buildDecision({
        decision: "BLOCK",
        reasonCodes: ["RC_MISSING_EVIDENCE"],
        confidence: 0.95,
        requiredFollowups: ["Enviar payload valido para enriquecimento de contexto."],
        evidence: ["Schema validation failed: invalid_enrich_request"]
      })
    });
  }

  if (parsed.data.source !== "covalent") {
    return reply.code(400).send({
      error: "unsupported_source",
      decision: buildDecision({
        decision: "BLOCK",
        reasonCodes: ["RC_POLICY_VIOLATION"],
        confidence: 0.99,
        requiredFollowups: ["Usar uma source suportada pelo serviço."],
        evidence: [`Unsupported source requested: ${parsed.data.source}`]
      })
    });
  }

  try {
    const result = await fetchCovalentContext(parsed.data.payload);
    if (result.status === "fetched") {
      const id = randomUUID();
      await db.insert(marketContexts).values({
        id,
        source: "covalent",
        snapshotHash: result.snapshotHash,
        score: "0",
        createdAt: new Date()
      });
      return reply.code(200).send({
        status: "ok",
        source: "covalent",
        result,
        marketContextId: id,
        decision: buildDecision({
          decision: "ALLOW",
          confidence: 0.94,
          assumptions: ["COVALENT_MARKET_CONTEXT_ENDPOINT retornou payload confiavel (2xx)."],
          evidence: [
            `covalent.statusCode=${result.statusCode}`,
            `snapshotHash=${result.snapshotHash}`
          ]
        })
      });
    }

    if (result.status === "skipped") {
      return reply.code(200).send({
        status: "ok",
        source: "covalent",
        result,
        decision: buildDecision({
          decision: "INSUFFICIENT_EVIDENCE",
          reasonCodes: ["RC_MISSING_EVIDENCE"],
          confidence: 0.99,
          requiredFollowups: [
            "Configurar COVALENT_MARKET_CONTEXT_ENDPOINT para habilitar enriquecimento via Covalent."
          ],
          evidence: ["Missing env: COVALENT_MARKET_CONTEXT_ENDPOINT"]
        })
      });
    }

    const isRateLimited =
      result.statusCode === 429 || result.statusCode === 503 || result.statusCode === 504;
    return reply.code(200).send({
      status: "ok",
      source: "covalent",
      result,
      decision: buildDecision({
        decision: "INSUFFICIENT_EVIDENCE",
        reasonCodes: isRateLimited
          ? ["RC_TOOL_FAILURE", "RC_RATE_LIMIT_OR_RPC_BLOCKED"]
          : ["RC_TOOL_FAILURE"],
        confidence: 0.93,
        requiredFollowups: [
          "Verificar disponibilidade/autenticacao do endpoint Covalent.",
          "Reexecutar enriquecimento apos restaurar conectividade."
        ],
        evidence: [
          `covalent.statusCode=${result.statusCode ?? "unknown"}`,
          `covalent.reason=${result.reason}`
        ]
      })
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    request.log.error({ error: message }, "covalent_enrich_failed");
    return reply.code(200).send({
      status: "ok",
      source: "covalent",
      decision: buildDecision({
        decision: "INSUFFICIENT_EVIDENCE",
        reasonCodes: ["RC_TOOL_FAILURE"],
        confidence: 0.91,
        requiredFollowups: ["Checar logs e disponibilidade do endpoint Covalent antes de nova tentativa."],
        evidence: [`covalent.exception=${message}`]
      })
    });
  }
});

const port = Number(process.env.MARKET_CONTEXT_SERVICE_PORT ?? 3002);

server.listen({ port, host: "0.0.0.0" });
