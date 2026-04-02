import * as dotenv from "dotenv";
import { resolve } from "path";
dotenv.config({ path: resolve(process.cwd(), "../../.env") });

import fastify from "fastify";
import { z } from "zod";
import { Connection, PublicKey, SystemProgram, Transaction, VersionedTransaction } from "@solana/web3.js";
import bs58 from "bs58";

const app = fastify({ logger: true });

app.get("/health", async (request, reply) => {
  return reply.send({ status: "ok", service: "execution-service" });
});

app.get("/health/db", async (request, reply) => {
  return reply.send({ status: "ok", service: "execution-service", db: "not_required" });
});

const executionSchema = z.object({
  taskId: z.string(),
  action: z.enum(["TRANSFER", "SWAP"]),
  amount: z.number(),
  asset: z.string(),
  destination: z.string().optional(),
  walletId: z.string() // Turnkey signWith resource (Solana address)
});

// Helper to call Signer Service
async function signTransactionViaKMS(unsignedBs58: string, walletId: string): Promise<string> {
  const signerUrl = `http://localhost:${process.env.SIGNER_SERVICE_PORT || 3007}/v1/signer/sign`;
  
  const response = await fetch(signerUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      walletId,
      unsignedTransactionBs58: unsignedBs58
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Signer Service failed: ${errorText}`);
  }

  const data = await response.json();
  return data.signatureBs58; // The 64-byte Ed25519 signature
}

app.post("/v1/execution/execute", async (request, reply) => {
  try {
    const parsed = executionSchema.parse(request.body);
    const rpcUrl = process.env.HELIUS_RPC_URL;
    if (!rpcUrl) throw new Error("HELIUS_RPC_URL missing");

    const connection = new Connection(rpcUrl, "confirmed");

    // 1. Construct Transaction
    const tx = new Transaction();
    const settlementWallet = new PublicKey(process.env.NOAHAI_SETTLEMENT_WALLET || "CfvC1ERLc8RZzbjn2QY99ggXTqHPXAM81Hqc4wrHUXh8");
    const signerWallet = new PublicKey(parsed.walletId);

    if (parsed.action === "TRANSFER" && parsed.destination) {
      const destPubkey = new PublicKey(parsed.destination);
      tx.add(SystemProgram.transfer({
        fromPubkey: signerWallet,
        toPubkey: destPubkey,
        lamports: parsed.amount * 1e9 // Assuming SOL for demo
      }));
    } else {
      // Mock SWAP or other logic
      tx.add(SystemProgram.transfer({
        fromPubkey: signerWallet,
        toPubkey: settlementWallet, // Transfer to settlement
        lamports: 1000 // minimal dust
      }));
    }

    tx.feePayer = signerWallet;
    const { blockhash } = await connection.getLatestBlockhash();
    tx.recentBlockhash = blockhash;

    // 2. Serialize Unsigned Transaction
    const unsignedBuffer = tx.serializeMessage();
    const unsignedBs58 = bs58.encode(unsignedBuffer);

    request.log.info({ taskId: parsed.taskId }, "Requesting signature from KMS");

    // 3. Request Signature from KMS (Signer Service)
    const signatureBs58 = await signTransactionViaKMS(unsignedBs58, parsed.walletId);
    const signatureBuffer = bs58.decode(signatureBs58);

    // 4. Attach Signature
    tx.addSignature(signerWallet, signatureBuffer);

    // 5. Broadcast to Solana
    request.log.info("Broadcasting transaction to Solana Mainnet via Helius");
    
    // In a real environment, we'd uncomment the sendRawTransaction line.
    // For demo/safety, we log the intent and mock the TxHash unless explicitly overridden.
    let txHash = "mock_tx_" + bs58.encode(signatureBuffer).substring(0, 20);
    
    if (process.env.ENABLE_REAL_BROADCAST === "true") {
      txHash = await connection.sendRawTransaction(tx.serialize());
    } else {
      request.log.warn("ENABLE_REAL_BROADCAST is not true. Mocking broadcast.");
    }

    return reply.send({
      taskId: parsed.taskId,
      status: "EXECUTED",
      proofOfIntent: txHash,
      network: "solana-mainnet",
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    request.log.error(error);
    return reply.status(500).send({ error: error.message });
  }
});

const start = async () => {
  try {
    const port = process.env.EXECUTION_SERVICE_PORT ? parseInt(process.env.EXECUTION_SERVICE_PORT) : 3006;
    await app.listen({ port, host: "0.0.0.0" });
    console.log(`✅ Execution Service running on port ${port}`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};

start();
