import * as dotenv from "dotenv";
import { resolve } from "path";
dotenv.config({ path: resolve(process.cwd(), "../../.env") });

import fastify from "fastify";
import { z } from "zod";
import { createTurnkeyClient } from "./turnkey.js";
import bs58 from "bs58";
import { Transaction, VersionedTransaction } from "@solana/web3.js";

const app = fastify({ logger: true });
const TURNKEY_TIMEOUT_MS = Number(process.env.SIGNER_TURNKEY_TIMEOUT_MS ?? "20000");

const withTimeout = async <T>(promise: Promise<T>, timeoutMs: number): Promise<T> => {
  return await Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`TURNKEY_TIMEOUT_${timeoutMs}ms`)), timeoutMs)
    )
  ]);
};

app.get("/health", async (request, reply) => {
  return reply.send({ status: "ok", service: "signer-service" });
});

app.get("/health/db", async (request, reply) => {
  return reply.send({ status: "ok", service: "signer-service", db: "not_required" });
});

const signRequestSchema = z.object({
  walletId: z.string(),
  unsignedTransactionBase64: z.string().optional(),
  unsignedTransactionBs58: z.string().optional(),
});

app.post("/v1/signer/sign", async (request, reply) => {
  try {
    const parsed = signRequestSchema.parse(request.body);
    
    if (!parsed.unsignedTransactionBase64 && !parsed.unsignedTransactionBs58) {
      return reply.status(400).send({ error: "Must provide unsigned transaction" });
    }

    const orgId = process.env.TURNKEY_ORGANIZATION_ID;
    if (!orgId) {
      throw new Error("TURNKEY_ORGANIZATION_ID is missing");
    }

    // Decode the transaction to raw bytes
    let txBytes: Uint8Array;
    if (parsed.unsignedTransactionBase64) {
      txBytes = Buffer.from(parsed.unsignedTransactionBase64, "base64");
    } else {
      txBytes = bs58.decode(parsed.unsignedTransactionBs58!);
    }

    // Try to parse the transaction to get the message to sign.
    // Execution service may send the raw message bytes directly.
    let messageToSign: Buffer;
    try {
      const vTx = VersionedTransaction.deserialize(txBytes);
      messageToSign = Buffer.from(vTx.message.serialize());
    } catch {
      try {
        // Fallback to legacy transaction format
        const tx = Transaction.from(txBytes);
        messageToSign = tx.serializeMessage();
      } catch {
        // Final fallback: treat incoming payload as raw message bytes
        messageToSign = Buffer.from(txBytes);
        request.log.warn("Received raw message payload; skipping transaction deserialization");
      }
    }

    const payloadHex = messageToSign.toString("hex");

    const client = createTurnkeyClient();
    
    request.log.info({ walletId: parsed.walletId }, "Requesting signature from Turnkey KMS");

    const response = await withTimeout(
      client.signRawPayload({
        type: "ACTIVITY_TYPE_SIGN_RAW_PAYLOAD_V2",
        timestampMs: String(Date.now()),
        organizationId: orgId,
        parameters: {
          signWith: parsed.walletId,
          payload: payloadHex,
          encoding: "PAYLOAD_ENCODING_HEXADECIMAL",
          hashFunction: "HASH_FUNCTION_NOT_APPLICABLE",
        },
      }),
      TURNKEY_TIMEOUT_MS
    );

    const signatureHex = response.activity.result.signRawPayloadResult?.r;
    const signatureS = response.activity.result.signRawPayloadResult?.s;
    
    if (!signatureHex || !signatureS) {
      throw new Error("Failed to get signature from Turnkey");
    }

    // Ed25519 signature is 64 bytes: r (32) + s (32)
    const signatureBytes = Buffer.concat([
      Buffer.from(signatureHex, "hex"),
      Buffer.from(signatureS, "hex")
    ]);

    // Return the signature so the execution service can append it
    return reply.send({
      signatureBase64: signatureBytes.toString("base64"),
      signatureBs58: bs58.encode(signatureBytes),
      status: "signed"
    });

  } catch (error: any) {
    request.log.error(error);
    return reply.status(500).send({ error: error.message });
  }
});

const start = async () => {
  try {
    const port = process.env.SIGNER_SERVICE_PORT ? parseInt(process.env.SIGNER_SERVICE_PORT) : 3007;
    await app.listen({ port, host: "0.0.0.0" });
    console.log(`✅ Signer Service (KMS) running on port ${port}`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};

start();
