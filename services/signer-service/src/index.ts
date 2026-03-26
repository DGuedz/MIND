import fastify, { FastifyReply, FastifyRequest } from "fastify";
import { createHmac } from "node:crypto";
import { z } from "zod";

const server = fastify({ logger: true });

server.get("/health", async () => ({
  status: "ok",
  service: "signer-service"
}));

const SignSchema = z.object({
  payload: z.record(z.unknown()),
  context: z.record(z.unknown()).optional()
});

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

const signPayload = (payload: Record<string, unknown>, context?: Record<string, unknown>) => {
  const secret = (process.env.SIGNER_SECRET ?? "").trim();
  // VSC RULE 1: KMS Integration Mock - Keys are ephemeral and never logged
  // In a real env, we'd call AWS KMS or GCP KMS here.
  const ephemeralKmsKey = createHmac("sha256", secret).update("kms-ephemeral-key-request").digest("hex");
  
  const body = canonicalize({ payload, context: context ?? null });
  // VSC RULE 8: Only log hashes
  const bodyHash = createHmac("sha256", ephemeralKmsKey).update(body).digest("hex");
  const signature = createHmac("sha256", ephemeralKmsKey).update(bodyHash).digest("hex");
  
  server.log.info({ action: "sign_payload", bodyHash, signatureHash: createHmac("sha256", "log").update(signature).digest("hex") }, "Payload signed via ephemeral KMS key");
  
  return { signature, bodyHash };
};

server.post("/v1/sign", async (request: FastifyRequest, reply: FastifyReply) => {
  if (!(process.env.SIGNER_SECRET ?? "").trim()) {
    return reply.code(503).send({ error: "signer_misconfigured", reason: "SIGNER_SECRET_missing" });
  }
  const parsed = SignSchema.safeParse(request.body);
  if (!parsed.success) {
    return reply.code(400).send({ error: "invalid_sign_request", details: parsed.error.flatten() });
  }
  const result = signPayload(parsed.data.payload, parsed.data.context);
  return reply.code(200).send(result);
});

const port = Number(process.env.SIGNER_SERVICE_PORT ?? 3007);

server.listen({ port, host: "0.0.0.0" });
