import { VersionedTransaction, Transaction } from "@solana/web3.js";

/**
 * Interface padronizada para Provedores de Key Management Service (KMS).
 * Abstrai a necessidade de expor chaves privadas no código, permitindo 
 * delegar a assinatura para infraestruturas como Turnkey, Privy ou Fireblocks.
 */
export interface KmsProvider {
  /**
   * Nome do provedor (ex: "TURNKEY", "PRIVY", "LOCAL_MOCK")
   */
  readonly name: string;

  /**
   * Inicializa a sessão com o provedor (autenticação de API, etc.)
   */
  initialize(): Promise<void>;

  /**
   * Obtém a chave pública delegada associada ao usuário ou agente.
   * @param userId Identificador único do usuário (ex: Telegram ID)
   */
  getPublicKey(userId: string): Promise<string>;

  /**
   * Solicita a assinatura de uma transação ao KMS sem expor a chave privada.
   * O KMS valida as policies internas (limites, destinos) antes de assinar.
   * 
   * @param userId Identificador único do usuário
   * @param transaction Transação não assinada
   * @param intentContext Contexto da intenção para log/auditoria no KMS
   * @returns A transação assinada e pronta para broadcast
   */
  signTransaction(
    userId: string, 
    transaction: VersionedTransaction | Transaction,
    intentContext?: Record<string, any>
  ): Promise<VersionedTransaction | Transaction>;
}
