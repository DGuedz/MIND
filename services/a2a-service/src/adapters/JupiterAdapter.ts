import { Connection, Keypair, VersionedTransaction } from "@solana/web3.js";
import { createJupiterApiClient, QuoteGetRequest } from "@jup-ag/api";
import { ProtocolAdapter, IntentRequest, SimulationResult, ExecutionReceipt } from "../core/types.js";

/**
 * Adapter para o Jupiter Aggregator (v6).
 * Especializado na ação "SWAP".
 */
export class JupiterAdapter implements ProtocolAdapter {
  public readonly name = "JUPITER";
  private jupiterApi = createJupiterApiClient();

  // Token metadata mínima para quote/normalização de unidades.
  private readonly TOKENS: Record<string, { mint: string; decimals: number }> = {
    SOL: { mint: "So11111111111111111111111111111111111111112", decimals: 9 },
    USDC: { mint: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v", decimals: 6 },
    USDT: { mint: "Es9vMFrzaCERmJfrF4H2hL2frrf5gkP7FpC18mU6YfJ", decimals: 6 }
  };

  async simulate(intent: IntentRequest, connection: Connection, walletPublicKey: string): Promise<SimulationResult> {
    if (intent.action !== "SWAP") {
      return { success: false, error: "JupiterAdapter only supports SWAP action." };
    }

    if (!intent.assetOut) {
      return { success: false, error: "assetOut is required for SWAP." };
    }

    const inputToken = this.TOKENS[intent.assetIn.toUpperCase()];
    const outputToken = this.TOKENS[intent.assetOut.toUpperCase()];
    const inputMint = inputToken?.mint;
    const outputMint = outputToken?.mint;

    if (!inputMint || !outputMint || !inputToken || !outputToken) {
      return { success: false, error: "Unsupported asset mints in JupiterAdapter." };
    }

    try {
      // 1. Obter Quote (Preço)
      const atomicIn = Math.floor(intent.amount * 10 ** inputToken.decimals);
      const quoteParams: QuoteGetRequest = {
        inputMint,
        outputMint,
        amount: atomicIn,
        slippageBps: intent.maxSlippageBps || 50,
      };

      const quoteResponse = await this.jupiterApi.quoteGet(quoteParams);

      if (!quoteResponse) {
        return { success: false, error: "No route found on Jupiter." };
      }

      // 2. Simular a construção da transação
      const swapResponse = await this.jupiterApi.swapPost({
        swapRequest: {
          quoteResponse,
          userPublicKey: walletPublicKey,
          wrapAndUnwrapSol: true,
        }
      });

      const swapTransactionBuf = Buffer.from(swapResponse.swapTransaction, "base64");
      const rawTransaction = VersionedTransaction.deserialize(swapTransactionBuf);

      return {
        success: true,
        intentId: intent.intentId,
        estimatedOutput: Number(quoteResponse.outAmount) / 10 ** outputToken.decimals,
        priceImpactBps: Math.round(Number(quoteResponse.priceImpactPct) * 10_000),
        rawTransaction
      };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async execute(simulation: SimulationResult, connection: Connection, wallet: Keypair): Promise<ExecutionReceipt> {
    if (!simulation.success || !simulation.rawTransaction) {
      throw new Error("Cannot execute a failed simulation.");
    }

    try {
      // Assinar
      simulation.rawTransaction.sign([wallet]);

      // Enviar e confirmar para garantir evidência mínima de finalização.
      const txHash = await connection.sendTransaction(simulation.rawTransaction, {
        skipPreflight: false,
        maxRetries: 2,
      });
      await connection.confirmTransaction(txHash, "confirmed");

      return {
        intentId: simulation.intentId ?? "unknown_intent",
        txHash,
        status: "SUCCESS",
        timestamp: new Date().toISOString()
      };
    } catch (error: any) {
      return {
        intentId: simulation.intentId ?? "unknown_intent",
        txHash: "",
        status: "FAILED",
        timestamp: new Date().toISOString()
      };
    }
  }
}
