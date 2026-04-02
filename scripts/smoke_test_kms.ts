import * as dotenv from "dotenv";
import { resolve } from "path";
// Força o dotenv a carregar a partir do diretório raiz do projeto
dotenv.config({ path: resolve(process.cwd(), ".env") });

import { Connection, PublicKey, SystemProgram, Transaction } from "@solana/web3.js";
import bs58 from "bs58";

async function runSmokeTest() {
  console.log("============================================");
  console.log("🔥 INICIANDO SMOKE TEST DE LIQUIDAÇÃO KMS");
  console.log("============================================\n");

  const rpcUrl = process.env.HELIUS_RPC_URL;
  const walletId = process.env.TURNKEY_SIGN_WITH;
  const settlementWalletStr = process.env.NOAHAI_SETTLEMENT_WALLET;

  if (!rpcUrl || !walletId || !settlementWalletStr) {
    console.error("❌ Faltam credenciais no .env (HELIUS_RPC_URL, TURNKEY_SIGN_WITH, NOAHAI_SETTLEMENT_WALLET)");
    process.exit(1);
  }

  const connection = new Connection(rpcUrl, "confirmed");
  const settlementWallet = new PublicKey(settlementWalletStr);

  try {
    console.log("1️⃣  Montando Transação (1000 lamports para a própria carteira)...");
    const signerWallet = new PublicKey(walletId);
    
    const tx = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: signerWallet,
        toPubkey: settlementWallet,
        lamports: 1000,
      })
    );
    tx.feePayer = signerWallet;
    const { blockhash } = await connection.getLatestBlockhash();
    tx.recentBlockhash = blockhash;

    const unsignedBs58 = bs58.encode(tx.serializeMessage());
    console.log("✅ Transação não assinada gerada.");

    console.log("\n2️⃣  Solicitando Assinatura Zero-Trust ao Signer Service (KMS)...");
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
      throw new Error(`Signer Service failed: ${await response.text()}`);
    }

    const data = await response.json();
    console.log("✅ Assinatura Ed25519 retornada pelo Turnkey com sucesso!");

    console.log("\n3️⃣  Anexando Assinatura e Transmitindo para Solana (Helius)...");
    const signatureBuffer = Buffer.from(bs58.decode(data.signatureBs58));
    
    // A chave pública que assina a transação deve ser a mesma configurada no Turnkey
    tx.addSignature(signerWallet, signatureBuffer);

    if (process.env.ENABLE_REAL_BROADCAST === "true") {
      const txHash = await connection.sendRawTransaction(tx.serialize());
      console.log(`✅ BROADCAST REALIZADO!`);
      console.log(`🔗 TxHash: ${txHash}`);
      console.log(`🔍 Acompanhe no Solscan: https://solscan.io/tx/${txHash}`);
      
      console.log("\n⏳ Aguardando confirmação na rede...");
      const confirmation = await connection.confirmTransaction(txHash, "confirmed");
      if (confirmation.value.err) {
        console.error("❌ Transação confirmada com erro:", confirmation.value.err);
      } else {
        console.log("✅ Transação confirmada com SUCESSO na Mainnet!");
      }
    } else {
      console.log("⚠️ ENABLE_REAL_BROADCAST não está true. Mockando transmissão.");
    }

    console.log("\n============================================");
    console.log("🎉 SMOKE TEST FINALIZADO COM SUCESSO!");
    console.log("============================================");

  } catch (error: any) {
    console.error("\n❌ Erro durante o Smoke Test:", error.message || error);
    process.exit(1);
  }
}

runSmokeTest();