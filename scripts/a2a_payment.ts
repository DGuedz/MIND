import { Keypair, Connection, Transaction, SystemProgram, sendAndConfirmTransaction, PublicKey, TransactionInstruction, LAMPORTS_PER_SOL } from "@solana/web3.js";
import bs58 from "bs58";
import * as dotenv from "dotenv";
dotenv.config();

async function simulateA2APayment() {
  console.log("\n🤖 MIND Protocol - Agent-to-Agent (A2A) Payment Rail\n");

  // 1. Carregar Agente A (Pagador - A sua Treasury Wallet com fundos)
  const envKey = process.env.METAPLEX_KEYPAIR;
  if (!envKey) throw new Error("METAPLEX_KEYPAIR não encontrada no .env");
  
  let secretKey = envKey.trim().startsWith("[") ? new Uint8Array(JSON.parse(envKey)) : bs58.decode(envKey);
  const agentA = Keypair.fromSecretKey(secretKey);

  // 2. Gerar Agente B (Recebedor - Ex: Um agente de Oráculo ou IA de terceiros fornecendo dados)
  // Geramos uma carteira nova na hora para simular um recebedor externo.
  const agentB = Keypair.generate();

  const network = process.env.SOLANA_NETWORK || "mainnet-beta";
  const rpcUrl = process.env.HELIUS_RPC_URL || "https://api.mainnet-beta.solana.com";
  const connection = new Connection(rpcUrl, "confirmed");

  console.log(`🏦 Agente A (Comprador/MIND): ${agentA.publicKey.toBase58()}`);
  console.log(`📡 Agente B (Vendedor/Serviço Externo): ${agentB.publicKey.toBase58()}`);

  const balance = await connection.getBalance(agentA.publicKey);
  console.log(`💰 Saldo Atual Agente A: ${balance / LAMPORTS_PER_SOL} SOL`);

  // Valor do micropagamento (0.001 SOL = ~ 9 centavos de dólar)
  const paymentAmount = 0.001;

  if (balance < paymentAmount * LAMPORTS_PER_SOL) {
      throw new Error("Saldo insuficiente para o micropagamento A2A.");
  }

  console.log(`\n💸 Iniciando Micropagamento x402 de ${paymentAmount} SOL para o Agente B...`);

  // 3. Criar a transação combinando Transferência de Valor + Contexto (Memo)
  // O Memo Program é um Smart Contract nativo da Solana para anexar mensagens imutáveis às transações.
  const memoProgramId = new PublicKey("MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr");
  const memoText = `MIND_x402_PAYMENT: Servico de Inferencia de Dados (NoahAI) | Pagamento A2A`;

  const tx = new Transaction().add(
      // Instrução 1: Mover o dinheiro (Liquidação)
      SystemProgram.transfer({
          fromPubkey: agentA.publicKey,
          toPubkey: agentB.publicKey,
          lamports: paymentAmount * LAMPORTS_PER_SOL, 
      }),
      // Instrução 2: Gravar o motivo do pagamento na blockchain (Prova/Contexto)
      new TransactionInstruction({
          keys: [{ pubkey: agentA.publicKey, isSigner: true, isWritable: true }],
          programId: memoProgramId,
          data: Buffer.from(memoText, "utf-8"),
      })
  );

  console.log("⚡ Assinando e liquidando atômicamente na rede...");
  try {
      const signature = await sendAndConfirmTransaction(connection, tx, [agentA]);
      console.log("\n✅ SUCESSO! Pagamento A2A Liquidado.");
      console.log(`📝 Contexto Gravado (Memo): "${memoText}"`);
      const clusterParam = network === "mainnet-beta" ? "" : `?cluster=${network}`;
      console.log(`🔍 Ver Recibo A2A no Explorer: https://explorer.solana.com/tx/${signature}${clusterParam}`);
  } catch (error: any) {
      console.error(`\n❌ Falha na liquidação: ${error.message}`);
  }
}

simulateA2APayment().catch(console.error);
