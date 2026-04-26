import { Connection, Keypair, VersionedTransaction } from "@solana/web3.js";

/**
 * Representa uma intenção padronizada recebida pelo A2A Server.
 */
export interface IntentRequest {
  intentId: string;
  protocol: string;
  action: "SWAP" | "ALLOCATE_YIELD" | "PROVIDE_LIQUIDITY" | "WITHDRAW";
  assetIn: string;
  assetOut?: string;
  amount: number;
  maxSlippageBps?: number;
  agentId: string;
}

/**
 * Resultado de uma simulação pré-trade.
 */
export interface SimulationResult {
  success: boolean;
  intentId?: string;
  estimatedOutput?: number;
  priceImpactBps?: number;
  feeEstimated?: number;
  error?: string;
  rawTransaction?: VersionedTransaction;
}

/**
 * Evidência final pós-execução (Audit Trail).
 */
export interface ExecutionReceipt {
  intentId: string;
  txHash: string;
  status: "SUCCESS" | "FAILED";
  actualOutput?: number;
  timestamp: string;
  metaplexReceiptHash?: string;
}

/**
 * Interface base que todos os protocolos DeFi devem implementar para plugar no MIND.
 */
export interface ProtocolAdapter {
  /**
   * Nome do protocolo (ex: JUPITER, KAMINO, METEORA)
   */
  readonly name: string;

  /**
   * Constrói e simula a transação baseada na intenção, sem enviar para a rede.
   */
  simulate(intent: IntentRequest, connection: Connection, walletPublicKey: string): Promise<SimulationResult>;

  /**
   * Assina e executa a transação previamente simulada.
   */
  execute(simulation: SimulationResult, connection: Connection, wallet: Keypair): Promise<ExecutionReceipt>;
}
