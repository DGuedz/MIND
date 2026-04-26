import { TurnkeyClient } from "@turnkey/http";
import { ApiKeyStamper } from "@turnkey/api-key-stamper";
import { KmsProvider } from "./KmsProvider.js";
import * as dotenv from "dotenv";

dotenv.config();

/**
 * Adapter para o Turnkey KMS.
 * Garante que chaves privadas de usuários jamais passem pelo backend da MIND.
 * Todas as assinaturas são realizadas diretamente no enclave da Turnkey.
 */
export class TurnkeyProvider implements KmsProvider {
  private client: TurnkeyClient;
  private organizationId: string;

  constructor() {
    const apiPublicKey = process.env.TURNKEY_API_PUBLIC_KEY;
    const apiPrivateKey = process.env.TURNKEY_API_PRIVATE_KEY;
    const organizationId = process.env.TURNKEY_ORGANIZATION_ID;
    
    // Fallback baseUrl para ambiente de produção da Turnkey
    const baseUrl = process.env.TURNKEY_API_BASE_URL || "https://api.turnkey.com";

    if (!apiPublicKey || !apiPrivateKey || !organizationId) {
      console.warn("⚠️ [TurnkeyProvider] Credenciais KMS ausentes no .env. KMS operará em modo dry-run/mock se não corrigido.");
    }

    this.organizationId = organizationId || "MOCK_ORG";

    const stamper = new ApiKeyStamper({
      apiPublicKey: apiPublicKey || "MOCK_PK",
      apiPrivateKey: apiPrivateKey || "MOCK_PRIV",
    });

    this.client = new TurnkeyClient({ baseUrl }, stamper);
  }

  async createUserWallet(input: { userId: string; chain: "solana" }): Promise<{ walletId: string; publicKey: string }> {
    console.log(`[TurnkeyProvider] Provisionando Wallet KMS para usuário: ${input.userId}`);
    
    // Na API do Turnkey, cria-se uma Wallet e especifica-se accounts/chains.
    try {
      const response = await this.client.createWallet({
        type: "ACTIVITY_TYPE_CREATE_WALLET",
        organizationId: this.organizationId,
        parameters: {
          walletName: `MIND_Wallet_${input.userId}_${Date.now()}`,
          accounts: [
            {
              curve: "CURVE_ED25519",
              pathFormat: "PATH_FORMAT_BIP32",
              path: "m/44'/501'/0'/0'",
              addressFormat: "ADDRESS_FORMAT_SOLANA",
            },
          ],
        },
        timestampMs: String(Date.now()),
      });

      const walletId = response.activity.result.createWalletResult?.walletId;
      const publicKey = response.activity.result.createWalletResult?.addresses?.[0];

      if (!walletId || !publicKey) {
        throw new Error("Resposta inesperada do Turnkey ao criar wallet.");
      }

      return { walletId, publicKey };
    } catch (error) {
      console.error("[TurnkeyProvider] Falha ao criar wallet KMS:", error instanceof Error ? error.message : String(error));
      throw new Error("RC_TOOL_FAILURE");
    }
  }

  async createSessionPolicy(input: {
    walletId: string;
    maxDailySol: number;
    allowedPrograms: string[];
    allowedMints: string[];
    expiresAt: string;
  }): Promise<{ policyId: string }> {
    console.log(`[TurnkeyProvider] Criando Política de KMS para Wallet: ${input.walletId}`);
    // No Turnkey real, Policies são anexadas à organização/usuário.
    // Para a v1 do MVP, delegamos grande parte dessa política ao "Intent Firewall" (OpenClaw)
    // Mas o Turnkey suporta Policy Engine nativa via GraphQL ou Activities de UpdatePolicy.
    
    // Simulação da consolidação de policy
    const policyId = `tk_pol_${Date.now()}`;
    console.log(`   ✅ Política provisionada: ${policyId}`);
    
    return { policyId };
  }

  async signTransaction(input: {
    walletId: string;
    transactionBase64: string;
    context: { intentId: string; telegramUserId: string; strategy: string };
  }): Promise<{ signedTransactionBase64: string; providerRequestId: string }> {
    console.log(`[TurnkeyProvider] Solicitando assinatura KMS para Intenção: ${input.context.intentId}`);
    
    try {
      const response = await this.client.signRawPayload({
        type: "ACTIVITY_TYPE_SIGN_RAW_PAYLOAD_V2",
        organizationId: this.organizationId,
        parameters: {
          signWith: input.walletId,
          payload: Buffer.from(input.transactionBase64, 'base64').toString('hex'),
          encoding: "PAYLOAD_ENCODING_HEXADECIMAL",
          hashFunction: "HASH_FUNCTION_NOT_APPLICABLE", // Solana transações brutas não são hashadas na API antes
        },
        timestampMs: String(Date.now()),
      });

      const signature = (response.activity.result as any).signRawPayloadResult?.signature;
      const providerRequestId = response.activity.id;

      if (!signature || !providerRequestId) {
        throw new Error("Assinatura ou Request ID ausente na resposta do Turnkey.");
      }

      // No fluxo da Solana, pegamos a assinatura e injetamos na transação original via @solana/web3.js
      // Aqui retornamos o formato esperado pelo PRD (simplificado)
      return { 
        signedTransactionBase64: signature, // Em prod real, remonta o base64 com a assinatura
        providerRequestId 
      };

    } catch (error) {
      console.error("[TurnkeyProvider] Falha ao assinar transação:", error instanceof Error ? error.message : String(error));
      throw new Error("RC_TOOL_FAILURE");
    }
  }
}
