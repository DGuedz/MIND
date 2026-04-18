export interface KmsProvider {
  /**
   * Provisiona uma nova wallet no provedor KMS.
   */
  createUserWallet(input: {
    userId: string;
    chain: "solana";
  }): Promise<{ walletId: string; publicKey: string }>;

  /**
   * Cria uma política de segurança nativa no provedor (se suportado).
   * O MIND fará a primeira camada de firewall, mas o KMS é o fallback inviolável.
   */
  createSessionPolicy(input: {
    walletId: string;
    maxDailySol: number;
    allowedPrograms: string[];
    allowedMints: string[];
    expiresAt: string;
  }): Promise<{ policyId: string }>;

  /**
   * Assina uma transação sem expor a chave privada ao servidor MIND.
   * O payload é assinado diretamente no enclave/HSM do KMS.
   */
  signTransaction(input: {
    walletId: string;
    transactionBase64: string;
    context: {
      intentId: string;
      telegramUserId: string;
      strategy: string;
    };
  }): Promise<{ signedTransactionBase64: string; providerRequestId: string }>;
}
