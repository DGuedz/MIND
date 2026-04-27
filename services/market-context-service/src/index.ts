import fastify, { FastifyReply, FastifyRequest } from "fastify";
import { CreateMarketContextInputSchema } from "@mind/schemas";
import { z } from "zod";
import { randomUUID } from "node:crypto";
import { fetchCovalentContext } from "./adapters/covalent.js";
import { checkDb, db } from "./db/client.js";
import { marketContexts } from "./db/schema.js";
import { getMarketContextById, listMarketContexts, listEcosystemSignals } from "./db/repository.js";
import { runColosseumDeepDive } from "./skills/skill_colosseum_intel.js";
import { EcosystemIntelIntent, runEcosystemIntelUpdate } from "./skills/skill_ecosystem_intel.js";

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

server.get("/v1/market/signals", async (request, reply) => {
  const signals = await listEcosystemSignals(10);
  return {
    feed: "ecosystem_intel",
    layer: "public_ecosystem_signal",
    stale: signals.length === 0,
    cached_at: new Date().toISOString(),
    items: signals
  };
});

server.post("/v1/market/signals/update", async (request, reply) => {
  const UpdateRequestSchema = z.object({
    query: z.string().min(1).optional(),
    intent: z
      .object({
        id: z.string().uuid().optional(),
        query: z.string().min(1).optional(),
        constraints: z
          .object({
            max_items: z.number().int().min(1).max(50).optional(),
            max_cost_usdc: z.number().positive().optional(),
            freshness_minutes: z.number().int().min(1).max(1440).optional(),
            allow_source_types: z
              .array(
                z.enum([
                  "indexer_api",
                  "onchain_oracle",
                  "blog",
                  "docs",
                  "changelog",
                  "product_page",
                  "x_post",
                  "institutional_announcement",
                  "press_release",
                  "governance_forum"
                ])
              )
              .optional()
          })
          .optional()
      })
      .optional()
  });

  const parsed = UpdateRequestSchema.safeParse(request.body);
  if (!parsed.success) {
    return reply.code(400).send({
      error: "invalid_market_signals_intent",
      details: parsed.error.flatten(),
      decision: buildDecision({
        decision: "BLOCK",
        reasonCodes: ["RC_MISSING_EVIDENCE"],
        confidence: 0.96,
        requiredFollowups: ["Enviar intent/query valido para atualizar o feed."],
        evidence: ["Schema validation failed: invalid_market_signals_intent"]
      })
    });
  }

  const intentId = parsed.data.intent?.id ?? randomUUID();
  const query = parsed.data.intent?.query ?? parsed.data.query ?? "Solana DeFi";
  const intent: EcosystemIntelIntent = {
    id: intentId,
    query,
    constraints: parsed.data.intent?.constraints
  };

  try {
    const result = await runEcosystemIntelUpdate(intent);

    const isPolicyViolation = result.proof.warnings.includes("policy_violation:max_cost_usdc");
    if (isPolicyViolation) {
      return reply.code(200).send({
        status: "ok",
        success: false,
        intent_id: intentId,
        decision: buildDecision({
          decision: "BLOCK",
          reasonCodes: ["RC_POLICY_VIOLATION"],
          confidence: 0.92,
          assumptions: ["Custo estimado baseado em limite max_items e constante interna por item."],
          requiredFollowups: ["Aumentar max_cost_usdc ou reduzir max_items."],
          evidence: [`query=${query}`, `estimated_cost_usdc=${String((result.proof.constraints as any).estimated_cost_usdc)}`]
        }),
        proof: result.proof
      });
    }

    return reply.code(200).send({
      status: "ok",
      success: true,
      intent_id: intentId,
      decision: buildDecision({
        decision: "ALLOW",
        confidence: 0.86,
        assumptions: ["Sinais sao classificados e filtrados conforme regras da skill (public vs verified)."],
        evidence: [
          `query=${query}`,
          `fetched_count=${result.proof.fetched_count}`,
          `accepted_count=${result.proof.accepted_count}`,
          `persisted_count=${result.proof.persisted_count}`
        ]
      }),
      proof: result.proof
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    request.log.error({ error: message }, "market_signals_update_failed");
    return reply.code(200).send({
      status: "ok",
      success: false,
      intent_id: intentId,
      decision: buildDecision({
        decision: "INSUFFICIENT_EVIDENCE",
        reasonCodes: ["RC_TOOL_FAILURE"],
        confidence: 0.9,
        requiredFollowups: ["Verificar logs e conectividade das fontes antes de nova tentativa."],
        evidence: [`exception=${message}`]
      })
    });
  }
});

server.get("/v1/market/context", async (request, reply) => {
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
