import { VersionedTransaction, Transaction, Keypair } from "@solana/web3.js";
import { KmsProvider } from "./KmsProvider.js";

/**
 * Mock KMS Provider para Fase 0 e ambientes de teste (Dry-Run).
 * Finge ser um provedor KMS remoto, mas apenas simula a assinatura
 * ou usa uma chave de dev injetada localmente.
 */
export class MockKmsProvider implements KmsProvider {
  public readonly name = "LOCAL_MOCK_KMS";
  private devKeypair?: Keypair;

  constructor(devKeypair?: Keypair) {
    this.devKeypair = devKeypair;
  }

  async initialize(): Promise<void> {
    console.log(`[${this.name}] Initialized in sandbox mode.`);
  }

  async getPublicKey(userId: string): Promise<string> {
    if (this.devKeypair) {
      return this.devKeypair.publicKey.toBase58();
    }
    // Retorna uma chave mockada consistente para o usuário
    return "MockKmsPublicKey111111111111111111111111111";
  }

  async signTransaction(
    userId: string,
    transaction: VersionedTransaction | Transaction,
    intentContext?: Record<string, any>
  ): Promise<VersionedTransaction | Transaction> {
    console.log(`[${this.name}] Policy check passed for user ${userId}. Requesting signature...`);
    
    if (intentContext) {
      console.log(`[${this.name}] Intent Context ID:`, intentContext.intentId || "unknown");
    }

    if (this.devKeypair) {
      if ('version' in transaction) {
        transaction.sign([this.devKeypair]);
      } else {
        transaction.sign(this.devKeypair);
      }
      return transaction;
    }

    // Em modo puramente mock, retorna a transação inalterada (vai falhar no broadcast real)
    console.warn(`[${this.name}] WARNING: No dev keypair provided. Returning unsigned transaction.`);
    return transaction;
  }
}
