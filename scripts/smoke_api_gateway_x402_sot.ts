import fastify from "fastify";
import assert from "node:assert/strict";

const startMockA2AService = async () => {
  const app = fastify({ logger: false });
  const reference = "MockReference111111111111111111111111111111";

  app.post("/v1/payments/solana/request", async () => {
    return {
      status: "ok",
      url: `solana:MockRecipient?amount=0.05&reference=${reference}&label=MIND%20Protocol%20x402`,
      reference,
      asset: "USDC",
      amount: 0.05
    };
  });

  app.post("/v1/payments/solana/verify", async () => {
    return { status: "confirmed", txHash: "MockTxHash" };
  });

  const address = await app.listen({ port: 0, host: "127.0.0.1" });
  return { app, address };
};

const startMockProofService = async () => {
  const app = fastify({ logger: false });

  app.get<{ Params: { id: string } }>("/v1/proofs/:id/anchors", async (request) => {
    return { anchors: [{ type: "mock", hash: `anchor:${request.params.id}` }] };
  });

  app.post<{ Params: { id: string } }>("/v1/proofs/:id/verify", async () => {
    return {
      status: "ok",
      verified: true,
      payloadHash: "MockPayloadHash",
      eventHash: "MockEventHash",
      proofHash: "MockProofHash"
    };
  });

  const address = await app.listen({ port: 0, host: "127.0.0.1" });
  return { app, address };
};

const main = async () => {
  process.env.API_GATEWAY_START = "false";

  const a2a = await startMockA2AService();
  const proof = await startMockProofService();

  process.env.A2A_SERVICE_URL = a2a.address;
  process.env.PROOF_SERVICE_URL = proof.address;

  const { server } = await import("../apps/api-gateway/src/index.ts");

  const subsidyResp = await server.inject({
    method: "POST",
    url: "/v1/payment/x402",
    payload: {
      amount: 0,
      currency: "USDC",
      recipient: "MockRecipient1111111111111111111111111111111111",
      chain: "solana",
      metadata: {
        intentId: "community_claim_smoke",
        voucherCode: "THEGARAGE",
        builderHandle: "smoke-builder",
        marketplaceItemId: "card_price_feed_sol",
        phase: "the_garage_community"
      }
    }
  });

  assert.equal(subsidyResp.statusCode, 200);
  const subsidyJson = subsidyResp.json() as any;
  assert.equal(subsidyJson.status, "sponsored");
  assert.equal(subsidyJson.communityTraction.settlementRequired, false);
  assert.ok(subsidyJson.communityTraction.evidence.includes("sponsored_access_no_onchain_broadcast"));

  const paymentResp = await server.inject({
    method: "POST",
    url: "/v1/payment/x402",
    payload: {
      amount: 0.05,
      currency: "USDC",
      recipient: "MockRecipient1111111111111111111111111111111111",
      chain: "solana",
      metadata: { memo: "smoke", intentId: "intent_smoke" }
    }
  });

  if (paymentResp.statusCode !== 200) {
    throw new Error(`x402 request failed: ${paymentResp.statusCode} ${paymentResp.body}`);
  }
  const paymentJson = paymentResp.json() as any;
  assert.equal(paymentJson.status, "pending");
  assert.equal(paymentJson.paymentId, "MockReference111111111111111111111111111111");

  const sotResp = await server.inject({
    method: "POST",
    url: "/v1/source-of-truth/verify",
    payload: {
      proofId: "proof_smoke",
      payment: {
        paymentId: paymentJson.paymentId,
        amount: 0.05,
        currency: "USDC",
        recipient: "MockRecipient1111111111111111111111111111111111",
        chain: "solana"
      }
    }
  });

  assert.equal(sotResp.statusCode, 200);
  const sotJson = sotResp.json() as any;
  assert.equal(sotJson.decision, "ALLOW");
  assert.ok(Array.isArray(sotJson.evidence));
  assert.ok(sotJson.evidence.some((v: string) => v.startsWith("payment:MockReference111111111111111111111111111111:confirmed")));
  assert.ok(sotJson.evidence.some((v: string) => v.startsWith("proof:proof_smoke:verified")));

  await server.close();
  await a2a.app.close();
  await proof.app.close();
};

main().catch((err) => {
  console.error(err instanceof Error ? err.message : String(err));
  process.exit(1);
});
