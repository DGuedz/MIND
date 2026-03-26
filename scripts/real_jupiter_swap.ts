import { Connection, Keypair, VersionedTransaction } from "@solana/web3.js";
import bs58 from "bs58";
import * as dotenv from "dotenv";

dotenv.config();

/**
 * 🚀 EXECUÇÃO REAL DE ARBITRAGEM VIA JUPITER V6 API 🚀
 * Este script faz um swap real na Solana Mainnet usando a Jupiter API.
 */
async function executeRealArbitrage(amountInSol: number) {
  console.log(`\n🤖 MIND Protocol - Inicializando Execução Real via Jupiter (Swap ${amountInSol} SOL para USDC)`);
  
  // 1. Setup da Wallet e Conexão
  const envKey = process.env.METAPLEX_KEYPAIR;
  if (!envKey) throw new Error("METAPLEX_KEYPAIR não encontrada no .env");
  
  const secretKey = envKey.trim().startsWith("[") ? new Uint8Array(JSON.parse(envKey)) : bs58.decode(envKey);
  const wallet = Keypair.fromSecretKey(secretKey);
  
  const rpcUrl = process.env.HELIUS_RPC_URL || "https://api.mainnet-beta.solana.com";
  const connection = new Connection(rpcUrl, "confirmed");

  console.log(`🏦 Wallet Origem: ${wallet.publicKey.toBase58()}`);

  // O valor em SOL precisa ser convertido para lamports (1 SOL = 10^9 lamports)
  const lamports = Math.floor(amountInSol * 1e9);

  // Tokens da Mainnet
  const SOL_MINT = "So11111111111111111111111111111111111111112";
  const USDC_MINT = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";

  try {
    // 2. Consultar a Rota (Quote) na Jupiter API v6
    console.log("🔍 Buscando a melhor rota de arbitragem no Jupiter...");
    const quoteResponse = await (
      await fetch(`https://quote-api.jup.ag/v6/quote?inputMint=${SOL_MINT}&outputMint=${USDC_MINT}&amount=${lamports}&slippageBps=50`)
    ).json();

    if (!quoteResponse || (quoteResponse as any).error) {
      throw new Error(`Erro ao buscar quote: ${JSON.stringify(quoteResponse)}`);
    }

    const expectedUsdc = ((quoteResponse as any).outAmount / 1e6).toFixed(2);
    console.log(`✅ Rota encontrada! Expectativa de receber ~${expectedUsdc} USDC`);

    // 3. Obter a Transação Serializada (Swap Transaction)
    console.log("📦 Solicitando transação empacotada ao Jupiter...");
    const swapResponse = await (
      await fetch('https://quote-api.jup.ag/v6/swap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          quoteResponse,
          userPublicKey: wallet.publicKey.toString(),
          wrapAndUnwrapSol: true,
        })
      })
    ).json();

    if (!swapResponse || !(swapResponse as any).swapTransaction) {
      throw new Error(`Erro ao gerar transação de swap: ${JSON.stringify(swapResponse)}`);
    }

    // 4. Desserializar e Assinar a Transação
    console.log("✍️  Assinando transação com a chave efêmera (MIND KMS)...");
    const swapTransactionBuf = Buffer.from((swapResponse as any).swapTransaction, 'base64');
    const transaction = VersionedTransaction.deserialize(swapTransactionBuf);
    
    // Assina a transação com a carteira
    transaction.sign([wallet]);

    // 5. Enviar para a Blockchain (Execução Atômica)
    console.log("⚡ Enviando para a rede Solana Mainnet...");
    const rawTransaction = transaction.serialize();
    const txid = await connection.sendRawTransaction(rawTransaction, {
      skipPreflight: true,
      maxRetries: 2
    });

    console.log("⏳ Aguardando confirmação do bloco...");
    // Apenas aguardamos a confirmação inicial para não travar muito tempo
    await connection.confirmTransaction(txid, 'processed');

    console.log(`\n🎉 SUCESSO! Arbitragem Real Executada!`);
    console.log(`🔍 Ver Recibo no Explorer: https://solscan.io/tx/${txid}`);
    
    return txid;

  } catch (error: any) {
    console.error(`\n❌ Falha na Execução Real:`, error.message);
    throw error;
  }
}

// Se o script for chamado diretamente, executa com 0.01 SOL (teste pequeno)
if (require.main === module) {
    // IMPORTANTE: Mude este valor para testar quantias maiores
    executeRealArbitrage(0.01).catch(() => process.exit(1));
}

export { executeRealArbitrage };