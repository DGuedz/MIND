import fastify from "fastify";
import { config } from "dotenv";
import { createHash } from "node:crypto";

config({ override: true });

const app = fastify({ logger: true });
const port = Number(process.env.METAPLEX_PROOF_MOCK_PORT ?? 3015);
const expectedAuth = process.env.METAPLEX_PROOF_AUTH?.trim() ?? "";

const toHash = (value: unknown) =>
  createHash("sha256").update(JSON.stringify(value)).digest("hex").slice(0, 44);

app.get("/health", async () => ({
  status: "ok",
  service: "metaplex-proof-mock"
}));

app.post("/v1/proofs/anchor", async (request, reply) => {
  if (expectedAuth) {
    const rawAuth = request.headers.authorization ?? "";
    const token = rawAuth.startsWith("Bearer ") ? rawAuth.slice("Bearer ".length).trim() : "";
    if (!token || token !== expectedAuth) {
      return reply.code(401).send({
        status: "unauthorized",
        provider: "metaplex-mock",
        error: "invalid_or_missing_auth"
      });
    }
  }

  const payload = (request.body ?? {}) as Record<string, unknown>;
  const txHash = `mockMetaTx_${toHash(payload)}`;
  const registryRef = `metaplex://mock/anchor/${txHash}`;

  return reply.code(200).send({
    status: "anchored",
    provider: "metaplex-mock",
    txHash,
    registryRef
  });
});

app.listen({ port, host: "0.0.0.0" }).then(() => {
  app.log.info(`metaplex-proof-mock listening on http://0.0.0.0:${port}`);
});
