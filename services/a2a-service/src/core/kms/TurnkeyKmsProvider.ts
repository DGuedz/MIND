import { VersionedTransaction, Transaction } from "@solana/web3.js";
import { Turnkey } from "@turnkey/sdk-server";
import { TurnkeySigner } from "@turnkey/solana";
import { KmsProvider } from "./KmsProvider.js";

/**
 * Provedor KMS Oficial utilizando Turnkey.
 * Garante a assinatura de transações Solana sem expor chaves privadas
 * no código ou no servidor.
 */
export class TurnkeyKmsProvider implements KmsProvider {
  public readonly name = "TURNKEY_KMS";
  
  private turnkeySdk: Turnkey;
  private signer: TurnkeySigner;
  
  private organizationId: string;
  private agentPublicKey: string;

  constructor(
    apiPublicKey: string,
    apiPrivateKey: string,
    organizationId: string,
    agentPublicKey: string
  ) {
    this.organizationId = organizationId;
    this.agentPublicKey = agentPublicKey;

    // Inicializa o SDK Server da Turnkey com as credenciais
    this.turnkeySdk = new Turnkey({
      apiBaseUrl: "https://api.turnkey.com",
      apiPublicKey,
      apiPrivateKey,
      defaultOrganizationId: organizationId,
    });

    // Inicializa o signer para Solana injetando o client
    this.signer = new TurnkeySigner({
      organizationId: this.organizationId,
      client: this.turnkeySdk.apiClient(),
    });
  }

  async initialize(): Promise<void> {
    console.log(`[${this.name}] Initializing Turnkey KMS connection...`);
    
    try {
      // Health Check: Valida se as credenciais de API têm acesso à org
      const client = this.turnkeySdk.apiClient();
      const whoami = await client.getWhoami({
        organizationId: this.organizationId,
      });
      
      console.log(`[${this.name}] Authenticated successfully! User ID: ${whoami.userId}`);
      console.log(`[${this.name}] Active Organization ID: ${whoami.organizationId}`);
      console.log(`[${this.name}] Agent Wallet PublicKey: ${this.agentPublicKey}`);
    } catch (error) {
      console.error(`[${this.name}] Authentication Failed. Check API Keys and Org ID.`);
      throw new Error(`Turnkey KMS Init Error: ${(error as Error).message}`);
    }
  }

  async getPublicKey(userId: string): Promise<string> {
    // Para A2A com Turnkey, nós usamos uma carteira delegada pelo Agente/Usuário
    // Neste setup Phase 1, usamos a carteira global provisionada para o agente
    return this.agentPublicKey;
  }

  async signTransaction(
    userId: string,
    transaction: VersionedTransaction | Transaction,
    intentContext?: Record<string, any>
  ): Promise<VersionedTransaction | Transaction> {
    console.log(`[${this.name}] Requesting KMS signature for user ${userId}...`);
    
    if (intentContext) {
      console.log(`[${this.name}] Intent Context:`, JSON.stringify(intentContext));
    }

    try {
      // O KMS do Turnkey adiciona a assinatura remotamente e devolve a transação
      await this.signer.addSignature(transaction, this.agentPublicKey);
      console.log(`[${this.name}] Signature successfully added by KMS.`);
      
      return transaction;
    } catch (error) {
      console.error(`[${this.name}] Failed to sign transaction via KMS:`, error);
      throw new Error(`KMS Signature Failed: ${(error as Error).message}`);
    }
  }
}
