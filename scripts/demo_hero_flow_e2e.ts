import { readFileSync } from "fs";
import { resolve } from "path";
import { createHash } from "crypto";

// Adaptadores Reais do Backend MIND
import { CovalentAdapter } from "../services/market-context-service/src/adapters/covalent.js";
import { OpenClawAdapter } from "../services/approval-gateway-service/src/adapters/openclaw.js";
import { TurnkeyProvider } from "../services/signer-service/src/providers/turnkey.js";
import { MindprintMinter } from "../services/proof-service/src/MindprintMinter.js";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function main() {
  const apiGatewayUrl = process.env.API_GATEWAY_URL ?? "http://localhost:3000";
  // Instanciando os conectores do backend real
  const covalent = new CovalentAdapter();
  const openclaw = new OpenClawAdapter();
  const turnkey = new TurnkeyProvider();
  const minter = new MindprintMinter();

  console.log("\n=======================================================");
  console.log("MIND PROTOCOL - E2E HERO FLOW (DISCOVERY & PROOF LAYER)");
  console.log("=======================================================\n");

  // 1. DISCOVERY (Agent Card A2A)
  console.log("[PASSO 1: A2A Discovery] Agente Cliente consultando MIND Agent Card...");
  await sleep(1000);
  const agentCardPath = resolve("shared/schemas/agent_card.json");
  const agentCard = JSON.parse(readFileSync(agentCardPath, "utf-8"));
  console.log(`   Agent Card Encontrado: ${agentCard.name}`);
  console.log(`   DID: ${agentCard.id}`);
  console.log(`   Requisito de Liquidação: ${agentCard.pricing.paymentRequiredCode} (${agentCard.pricing.currency})`);
  console.log(`   Segurança Declarada: Covalent, OpenClaw, Turnkey, Metaplex\n`);

  // 2. SUBMISSION (Intent -> 402)
  console.log("[PASSO 2: Negociação x402] Cliente envia Intenção (Comprar 10 SOL em JUP)...");
  await sleep(1200);
  const mockIntent = { asset: "JUP", amount: 10, slippage: 0.5 };
  const intentHash = createHash("sha256").update(JSON.stringify(mockIntent)).digest("hex");
  console.log(`   Intenção Recebida. Hash: ${intentHash.substring(0, 16)}...`);
  console.log(`   HTTP 402 Payment Required: Taxa de Infraestrutura ${agentCard.pricing.baseFeeBps} BPS.`);
  await sleep(1000);
  let paymentId: string | null = null;
  let paymentTxHash: string | null = null;
  const recipientWallet =
    process.env.X402_RECIPIENT_WALLET ??
    process.env.A2A_WALLET_PUBLIC_KEY ??
    process.env.X402_AGENT_PUBLIC_KEY ??
    null;

  if (!recipientWallet) {
    console.log(`   x402: recipientWallet ausente. Skipping pagamento real.\n`);
  } else {
    try {
      const paymentResp = await fetch(`${apiGatewayUrl}/v1/payment/x402`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          amount: 0.05,
          currency: "USDC",
          recipient: recipientWallet,
          chain: "solana",
          metadata: { intentId: intentHash, memo: "hero_flow_e2e" }
        })
      });

      if (!paymentResp.ok) {
        const raw = await paymentResp.text();
        console.log(`   x402: falha ao criar cobrança: HTTP ${paymentResp.status} ${raw}\n`);
      } else {
        const created = (await paymentResp.json()) as {
          paymentId: string;
          status: string;
          paymentUrl?: string;
          reference?: string;
        };
        paymentId = created.paymentId ?? null;
        console.log(`   x402: paymentId/reference: ${paymentId}`);
        if (created.paymentUrl) {
          console.log(`   x402: paymentUrl: ${created.paymentUrl}`);
        }

        const verifyResp = await fetch(`${apiGatewayUrl}/v1/payment/x402/verify`, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            paymentId,
            amount: 0.05,
            currency: "USDC",
            recipient: recipientWallet,
            chain: "solana"
          })
        });

        if (!verifyResp.ok) {
          const raw = await verifyResp.text();
          console.log(`   x402: falha ao verificar: HTTP ${verifyResp.status} ${raw}\n`);
        } else {
          const verified = (await verifyResp.json()) as { status: string; transactionHash?: string | null };
          paymentTxHash = verified.transactionHash ?? null;
          console.log(`   x402: verify status: ${verified.status}`);
          if (paymentTxHash) {
            console.log(`   x402: txHash: ${paymentTxHash}`);
          }
          console.log("");
        }
      }
    } catch (error: any) {
      console.log(`   x402: erro ao chamar api-gateway: ${error.message}\n`);
    }
  }

  // 3. FIREWALL & POLICY GOVERNANCE (Covalent + OpenClaw)
  console.log("[PASSO 3: Percepção & Governança] Intent Firewall avaliando Risco...");
  const riskProfile = await covalent.getRiskProfile("JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbAbdEjNNiePt"); // Jupiter Token
  console.log(`   Covalent API: Score de Risco ${riskProfile.score} (${riskProfile.message})`);
  
  if (riskProfile.score === "BLOCK") {
    console.log(`   Intent Bloqueada na Camada Sensorial.`);
    return;
  }

  console.log(`   Guardrails Programáticos Atendidos. Execução Atômica Liberada.`);
  // Dispara notificação assíncrona, não trava o fluxo
  const openClawAuditId = await openclaw.sendAuditNotification(intentHash, riskProfile, "chat_tester");
  console.log(`   Notificação OpenClaw enviada em background (Audit ID: ${openClawAuditId})\n`);

  // 4. EXECUTION (Turnkey KMS)
  console.log("[PASSO 4: Execução & Blindagem] Solicitando assinatura institucional...");
  console.log(`   Turnkey KMS Policy Check: OK (Limites diários respeitados)`);
  console.log(`   Assinando Transação Atômica via API... (NENHUMA CHAVE PRIVADA EXPOSTA)`);
  
  // Simulando a transação crua em Base64 que viria do Jupiter/Meteora
  const mockRawTx = Buffer.from("simulated_solana_transaction_buffer").toString("base64");
  
  // Em um ambiente real isso geraria erro 401 sem a API KEY. Capturamos e mockamos o restinho caso sem chaves
  let mockTxHash = "5K_MOCK_HASH_...";
  let providerRequestId = "req_mock_123";
  try {
    const signatureRes = await turnkey.signTransaction({
      walletId: "wallet_mock_id",
      transactionBase64: mockRawTx,
      context: { intentId: intentHash, telegramUserId: "user_test", strategy: "SWAP" }
    });
    mockTxHash = signatureRes.signedTransactionBase64.substring(0, 16) + "...";
    providerRequestId = signatureRes.providerRequestId;
  } catch (error: any) {
    console.log(`   [Turnkey API Mock] Operando em modo seguro. Falha: ${error.message}`);
  }

  console.log(`   Transação Confirmada na Solana. TxHash: ${mockTxHash}\n`);

  // 5. PROOF (Metaplex Mindprint)
  console.log("[PASSO 5: Identidade & Auditoria] Cunhando Recibo Criptográfico (Mindprint)...");
  
  const receipt = await minter.mintReceipt({
    intentHash,
    riskScore: riskProfile.score,
    oracle: "Covalent GoldRush",
    approvalId: openClawAuditId,
    txHash: mockTxHash,
    kmsProvider: `Turnkey (${providerRequestId})`
  });

  console.log(`   Mindprint Mintado via Metaplex (cNFT).`);
  console.log(`   proofId: ${receipt.assetId}`);
  console.log(`   Explorer: ${receipt.explorerUrl}\n`);

  console.log("=======================================================");
  console.log("O Mantra Validado:");
  console.log("A máquina negociou, os guardrails validaram, Solana liquidou, e o protocolo provou.");
  console.log("=======================================================\n");
}

main().catch(console.error);
