import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import { createSignerFromKeypair, signerIdentity } from "@metaplex-foundation/umi";
import { create, mplCore } from "@metaplex-foundation/mpl-core";
import { generateSigner } from "@metaplex-foundation/umi";
import * as dotenv from "dotenv";

dotenv.config();

export interface MindprintPayload {
  intentHash: string;
  riskScore: string;
  oracle: string;
  credentialNft: string;
  credentialTier: string;
  txHash: string;
  kmsProvider: string;
  phase?: string;
  nextPhase?: string;
  validationContract?: string;
  validationChecks?: string[];
  x402SettlementMode?: string;
  x402RealSettlementEnabled?: boolean;
}

/**
 * Minter Oficial do MIND Protocol (Proof of Intent)
 * Emite um ativo digital on-chain (Metaplex Core) imortalizando a operação.
 * Agora operando na visão "Only Agents".
 */
export class MindprintMinter {
  private umi;

  constructor() {
    const endpoint = process.env.SOLANA_RPC_URL || "https://api.devnet.solana.com";
    this.umi = createUmi(endpoint).use(mplCore());

    // NOTA: Para o Minter funcionar de forma automatizada, ele usa uma treasury key do protocolo.
    // As chaves dos usuários nunca são tocadas. Esta chave apenas cunha o recibo e paga a taxa do Metaplex.
    const secretKeyStr = process.env.MIND_TREASURY_SECRET_KEY;
    if (secretKeyStr) {
      try {
        const secretKey = new Uint8Array(JSON.parse(secretKeyStr));
        const keypair = this.umi.eddsa.createKeypairFromSecretKey(secretKey);
        const signer = createSignerFromKeypair(this.umi, keypair);
        this.umi.use(signerIdentity(signer));
      } catch (error) {
        console.warn("[MindprintMinter] MIND_TREASURY_SECRET_KEY invalida. O Mint operara em modo Mock.");
      }
    } else {
      console.warn("[MindprintMinter] MIND_TREASURY_SECRET_KEY nao definida. O Mint operara em modo Mock.");
    }
  }

  /**
   * Cunhar o Proof of Intent (Mindprint) na Solana
   */
  async mintReceipt(payload: MindprintPayload): Promise<{ assetId: string; explorerUrl: string }> {
    console.log(`[MindprintMinter] Iniciando cunhagem do Mindprint para Tx: ${payload.txHash}`);

    try {
      // Cria o endereço do novo Asset
      const asset = generateSigner(this.umi);

      // Metadados injetados diretamente na Solana via Metaplex Core (Plugins)
      const tx = await create(this.umi, {
        asset,
        name: `MIND Proof of Intent`,
        uri: `https://api.mindprotocol.io/v1/metadata/receipt/${payload.intentHash}`,
        plugins: [
          {
            type: 'Attributes',
            attributeList: [
              { key: 'Intent Hash', value: payload.intentHash },
              { key: 'Risk Score', value: payload.riskScore },
              { key: 'Data Oracle', value: payload.oracle },
              { key: 'Credential NFT', value: payload.credentialNft },
              { key: 'Credential Tier', value: payload.credentialTier },
              { key: 'Solana Tx Hash', value: payload.txHash },
              { key: 'KMS Provider', value: payload.kmsProvider },
              { key: 'Execution Mode', value: 'Autonomous (Credential-Gated)' },
              { key: 'MIND Phase', value: payload.phase ?? 'open_interest' },
              { key: 'Next Phase', value: payload.nextPhase ?? 'open_interest' },
              { key: 'Validation Contract', value: payload.validationContract ?? 'mind_x402_phase_contract_v1' },
              { key: 'Validation Checks', value: (payload.validationChecks ?? ['policy_gate', 'x402_payment_verified', 'proof_bundle']).join(',') },
              { key: 'x402 Settlement Mode', value: payload.x402SettlementMode ?? 'x402_solana_confirmed' },
              { key: 'x402 Real Settlement', value: String(payload.x402RealSettlementEnabled ?? true) }
            ]
          }
        ]
      });

      // Envia e confirma a transação
      await tx.sendAndConfirm(this.umi);
      
      const assetId = asset.publicKey.toString();
      console.log(`Mindprint cunhado com sucesso. Asset ID: ${assetId}`);

      return {
        assetId,
        explorerUrl: `https://explorer.solana.com/address/${assetId}?cluster=devnet`
      };
    } catch (error) {
      console.error("[MindprintMinter] Falha ao cunhar recibo on-chain:", error instanceof Error ? error.message : String(error));
      // Fallback seguro: se falhar o mint, não revertemos o capital, mas logamos a anomalia
      return {
        assetId: "MINT_FAILED_FALLBACK",
        explorerUrl: "https://explorer.mindprotocol.io/receipt/pending"
      };
    }
  }
}
