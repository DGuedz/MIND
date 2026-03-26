import fastify, { FastifyReply, FastifyRequest } from "fastify";
import { z } from "zod";
import { createHash } from "node:crypto";
import http from "node:http";
import https from "node:https";
import { checkDb } from "./db/client.js";
import {
  createExecution,
  getExecutionById,
  listExecutionsByIntentId,
  markExecutionFailed,
  markExecutionRunning,
  markExecutionSucceeded
} from "./db/repository.js";
import { simulateExecution } from "./simulator.js";

const server = fastify({ logger: true });

server.get("/health", async () => ({
  status: "ok",
  service: "execution-service"
}));

server.get("/health/db", async (_request: FastifyRequest, reply: FastifyReply) => {
  try {
    await checkDb();
    return reply.code(200).send({ status: "ok", service: "execution-service", db: "ok" });
  } catch (error) {
    return reply.code(500).send({ status: "error", service: "execution-service", db: "error" });
  }
});

const PlanExecutionSchema = z.object({
  intentId: z.string(),
  mode: z.enum(["simulated", "real"])
});

const RunExecutionSchema = z.object({
  executionId: z.string(),
  intentId: z.string(),
  amount: z.string(),
  maxSlippageBps: z.number().int().min(0).max(10_000),
  priceBounds: z.object({ min: z.number().optional(), max: z.number().optional() }).optional(),
  expiresAt: z.string()
});

const parseNumber = (value: unknown) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const isExpired = (expiresAt: string) => {
  const expiry = Date.parse(expiresAt);
  return Number.isFinite(expiry) ? Date.now() > expiry : true;
};

const canonicalize = (value: unknown): string => {
  if (value === null || value === undefined) {
    return "null";
  }
  if (Array.isArray(value)) {
    return `[${value.map(canonicalize).join(",")}]`;
  }
  if (typeof value === "object") {
    const obj = value as Record<string, unknown>;
    const keys = Object.keys(obj).sort();
    return `{${keys.map((key) => `${JSON.stringify(key)}:${canonicalize(obj[key])}`).join(",")}}`;
  }
  return JSON.stringify(value);
};

const hashValue = (value: unknown): string => {
  return createHash("sha256").update(canonicalize(value)).digest("hex");
};

const postJson = async <T>(url: string, body: unknown) => {
  const payload = JSON.stringify(body);
  const target = new URL(url);
  const client = target.protocol === "https:" ? https : http;

  return new Promise<{ statusCode?: number; data: T }>((resolve, reject) => {
    const req = client.request(
      {
        method: "POST",
        hostname: target.hostname,
        port: target.port ? Number(target.port) : target.protocol === "https:" ? 443 : 80,
        path: `${target.pathname}${target.search}`,
        headers: {
          "content-type": "application/json",
          "content-length": Buffer.byteLength(payload).toString()
        }
      },
      (res) => {
        let data = "";
        res.on("data", (chunk) => {
          data += chunk.toString();
        });
        res.on("end", () => {
          const parsed = data ? (JSON.parse(data) as T) : ({} as T);
          resolve({ statusCode: res.statusCode, data: parsed });
        });
      }
    );

    req.on("error", reject);
    req.write(payload);
    req.end();
  });
};

server.post("/v1/executions/plan", async (request: FastifyRequest, reply: FastifyReply) => {
  const parsed = PlanExecutionSchema.safeParse(request.body);
  if (!parsed.success) {
    return reply.code(400).send({ error: "invalid_plan", details: parsed.error.flatten() });
  }
  const result = await createExecution(parsed.data);
  return reply.code(201).send({ status: "planned", ...result });
});

server.post("/v1/executions/run", async (request: FastifyRequest, reply: FastifyReply) => {
  const parsed = RunExecutionSchema.safeParse(request.body);
  if (!parsed.success) {
    return reply.code(400).send({ error: "invalid_run", details: parsed.error.flatten() });
  }

  const execution = await getExecutionById(parsed.data.executionId);
  if (!execution) {
    return reply.code(404).send({ error: "execution_not_found" });
  }

  if (isExpired(parsed.data.expiresAt)) {
    const event = await markExecutionFailed({
      executionId: execution.id,
      reason: "execution_expired"
    });
    return reply.code(412).send({ error: "execution_expired", event });
  }

  const maxSlippage = parseNumber(process.env.POLICY_MAX_SLIPPAGE_BPS);
  if (maxSlippage !== null && parsed.data.maxSlippageBps > maxSlippage) {
    const event = await markExecutionFailed({
      executionId: execution.id,
      reason: "max_slippage_exceeded"
    });
    return reply.code(412).send({ error: "max_slippage_exceeded", event });
  }

  await markExecutionRunning(execution.id);

  if (execution.mode === "simulated") {
    const simulation = await simulateExecution({
      intentId: parsed.data.intentId,
      amount: parsed.data.amount,
      maxSlippageBps: parsed.data.maxSlippageBps,
      priceBounds: parsed.data.priceBounds,
      expiresAt: parsed.data.expiresAt
    });
    const event = await markExecutionSucceeded({
      executionId: execution.id,
      receiptHash: simulation.receiptHash
    });
    return reply.code(200).send({ status: "simulated", receiptHash: simulation.receiptHash, event });
  }

  const signerServiceUrl = process.env.SIGNER_SERVICE_URL ?? "http://localhost:3007";
  const signPayload = {
    intentId: parsed.data.intentId,
    executionId: execution.id,
    amount: parsed.data.amount,
    maxSlippageBps: parsed.data.maxSlippageBps,
    priceBounds: parsed.data.priceBounds ?? null,
    expiresAt: parsed.data.expiresAt
  };

  try {
    const signatureResponse = await postJson<{ signature: string; bodyHash: string }>(
      `${signerServiceUrl}/v1/sign`,
      {
        payload: signPayload,
        context: { mode: "real" }
      }
    );
    const receiptHash = hashValue({
      signPayload,
      signature: signatureResponse.data.signature,
      bodyHash: signatureResponse.data.bodyHash
    });

    // VSC RULE 2 & 8: Atomic execution & hash logging
    server.log.info({ action: "atomic_execution", executionId: execution.id, receiptHash }, "Execution finalized");

    const event = await markExecutionSucceeded({
      executionId: execution.id,
      txHash: signatureResponse.data.signature,
      receiptHash
    });
    return reply.code(200).send({
      status: "executed",
      txHash: signatureResponse.data.signature,
      receiptHash,
      event
    });
  } catch (error) {
    const event = await markExecutionFailed({
      executionId: execution.id,
      reason: "signer_unavailable"
    });
    return reply.code(502).send({ error: "signer_unavailable", event });
  }
});

server.get<{ Params: { id: string } }>(
  "/v1/executions/:id",
  async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
  const execution = await getExecutionById(request.params.id);
  if (!execution) {
    return reply.code(404).send({ error: "execution_not_found" });
  }
  return reply.code(200).send({ execution });
});

server.get("/v1/executions", async (request: FastifyRequest, reply: FastifyReply) => {
  const intentId = (request.query as { intentId?: string }).intentId;
  if (!intentId) {
    return reply.code(400).send({ error: "intent_id_required" });
  }
  const limitValue = Number((request.query as { limit?: string }).limit ?? "20");
  const limit = Number.isFinite(limitValue) ? Math.min(Math.max(limitValue, 1), 100) : 20;
  const executions = await listExecutionsByIntentId(intentId, limit);
  return reply.code(200).send({ items: executions });
});

const port = Number(process.env.EXECUTION_SERVICE_PORT ?? 3006);

server.listen({ port, host: "0.0.0.0" });
