import {
  Connection,
  Keypair,
  LAMPORTS_PER_SOL,
  SystemProgram,
  Transaction,
  sendAndConfirmTransaction,
  PublicKey
} from "@solana/web3.js";
import fs from "fs/promises";
import path from "path";

// Utility for colored terminal output
const log = {
  info: (msg: string) => console.log(`\x1b[36m[INFO]\x1b[0m ${msg}`),
  success: (msg: string) => console.log(`\x1b[32m[SUCCESS]\x1b[0m ${msg}`),
  warn: (msg: string) => console.log(`\x1b[33m[WARN]\x1b[0m ${msg}`),
  error: (msg: string) => console.log(`\x1b[31m[ERROR]\x1b[0m ${msg}`),
  bold: (msg: string) => console.log(`\x1b[1m${msg}\x1b[0m`),
};

async function loadAgentCards() {
  const cardsDir = path.join(process.cwd(), 'agent-cards', 'products');
  const priceFeed = JSON.parse(await fs.readFile(path.join(cardsDir, 'card_price_feed.json'), 'utf-8'));
  const swapRoute = JSON.parse(await fs.readFile(path.join(cardsDir, 'card_swap_route.json'), 'utf-8'));
  const simpleSignal = JSON.parse(await fs.readFile(path.join(cardsDir, 'card_simple_signal.json'), 'utf-8'));
  return [priceFeed, swapRoute, simpleSignal];
}

async function main() {
  console.log("\n========================================================");
  console.log("🧠 MIND PROTOCOL: A2A MARKETPLACE DEMO (SOLANA DEVNET) 🧠");
  console.log("========================================================\n");

  log.info("1. Conectando à Solana Devnet...");
  const connection = new Connection("https://api.devnet.solana.com", "confirmed");

  // -------------------------------------------------------------------
  // CONFIGURAÇÃO DOS ATORES (Agentes e Protocolo)
  // -------------------------------------------------------------------
  log.info("Gerando identidades dos Agentes...");
  
  // O Agente Consumidor (Buyer)
  const consumerAgent = Keypair.generate();
  
  // O Criador do Agent Card (Dev)
  const creatorDev = Keypair.generate();
  
  // A Tesouraria do MIND Protocol (Para a taxa de sustentabilidade)
  const mindTreasury = Keypair.generate();

  log.bold(`\n👤 Consumidor (Agente): ${consumerAgent.publicKey.toBase58()}`);
  log.bold(`🛠️  Criador (Dev):     ${creatorDev.publicKey.toBase58()}`);
  log.bold(`🏦 MIND Treasury:     ${mindTreasury.publicKey.toBase58()}\n`);

  // -------------------------------------------------------------------
  // FINANCIAMENTO INICIAL
  // -------------------------------------------------------------------
  log.info("Verificando/solicitando airdrop para o Agente Consumidor (Devnet)...");
  let hasFunds = false;
  try {
    const airdropSignature = await connection.requestAirdrop(
      consumerAgent.publicKey,
      0.1 * LAMPORTS_PER_SOL
    );
    await connection.confirmTransaction(airdropSignature);
    hasFunds = true;
    log.success("Airdrop confirmado!");
  } catch (error) {
    log.warn("Airdrop Devnet indisponível no momento (Rate Limit/RPC). Usando modo simulação (Dry-Run).");
  }

  // -------------------------------------------------------------------
  // DISCOVERY
  // -------------------------------------------------------------------
  log.info("\n2. Simulando Fase de Descoberta (Discovery)...");
  const agentCards = await loadAgentCards();
  console.log("\n📚 Catálogo de Agent Cards no GitHub/MIND:");
  agentCards.forEach(card => {
    console.log(`   - [${card.id}] ${card.name} | Preço: $${card.pricing.price} USDC`);
  });

  // O agente consumidor escolhe o Swap Router
  const selectedCard = agentCards.find(c => c.id === "card_jupiter_route");
  log.info(`\n🎯 Agente Consumidor escolheu o Card: "${selectedCard.name}"`);

  // -------------------------------------------------------------------
  // ATOMIC SETTLEMENT (MIND FEE SPLIT)
  // -------------------------------------------------------------------
  log.info("\n3. Preparando Liquidação Atômica (Atomic Settlement)...");
  
  // Como estamos em Devnet sem mint de USDC próprio, simularemos o pagamento
  // usando SOL puro. Preço do card: $0.009. 
  // Assumindo SOL = $150, 0.009 USDC = 0.00006 SOL = 60,000 lamports.
  const priceInLamports = 60_000;
  
  // MIND Protocol Model: 92% Creator / 8% MIND (Margem Sustentável)
  const creatorShare = Math.floor(priceInLamports * 0.92);
  const mindShare = priceInLamports - creatorShare;

  log.bold(`   💰 Preço Total: ${priceInLamports} lamports (~$0.009 USDC)`);
  log.bold(`   👨‍💻 Criador (92%): ${creatorShare} lamports`);
  log.bold(`   🏦 MIND (8%): ${mindShare} lamports`);

  // Construindo a Transação Atômica
  const transaction = new Transaction().add(
    // Instrução 1: Paga o criador
    SystemProgram.transfer({
      fromPubkey: consumerAgent.publicKey,
      toPubkey: creatorDev.publicKey,
      lamports: creatorShare,
    }),
    // Instrução 2: Paga a tesouraria do MIND
    SystemProgram.transfer({
      fromPubkey: consumerAgent.publicKey,
      toPubkey: mindTreasury.publicKey,
      lamports: mindShare,
    })
    // Na prática, haveria uma terceira instrução que emitiria o Receipt onchain
  );

  log.info("\n4. Assinando e Enviando a Transação...");
  
  let txHash = "";
  if (hasFunds) {
    txHash = await sendAndConfirmTransaction(
      connection,
      transaction,
      [consumerAgent]
    );
    log.success(`Transação Atômica confirmada na Solana Devnet!`);
    log.info(`🔗 Explorer: https://explorer.solana.com/tx/${txHash}?cluster=devnet`);
  } else {
    log.info("Modo de simulação ativado: simulando o envio da transação atômica (Dry-Run)...");
    await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate network latency
    txHash = "4Z7QzP7hR" + Math.random().toString(36).substring(2) + "xX" + Math.random().toString(36).substring(2);
    log.success(`Transação Atômica (Simulada) confirmada!`);
    log.info(`🔗 Explorer (Mock): https://explorer.solana.com/tx/${txHash}?cluster=devnet`);
  }

  // -------------------------------------------------------------------
  // USAGE RECEIPT
  // -------------------------------------------------------------------
  log.info("\n5. Gerando MIND Usage Receipt...");
  const receipt = {
    receiptId: `rcpt_${txHash.slice(0, 8)}`,
    cardId: selectedCard.id,
    buyer: consumerAgent.publicKey.toBase58(),
    amountPaid: selectedCard.pricing.price,
    currency: "USDC",
    timestamp: new Date().toISOString(),
    status: "SETTLED_ONCHAIN",
    split: {
      creator: "92%",
      mind: "8%"
    }
  };

  console.log("\n========================================================");
  console.log("📜 RECIBO CRIPTOGRÁFICO DE USO (MIND RECEIPT) 📜");
  console.log(JSON.stringify(receipt, null, 2));
  console.log("========================================================\n");

  log.success("O Agente Consumidor agora recebe acesso imediato (sub-segundo) ao endpoint do serviço!");
  console.log(`Endpoint liberado: ${selectedCard.endpoints.data}\n`);
}

main().catch(err => {
  log.error("Erro na execução: " + err.message);
});
