import { IntentRequest } from "./types.js";

export type CredentialTier = "MICRO" | "PRO" | "INSTITUTIONAL";

export interface PolicyGateResult {
  allowed: boolean;
  status: "approved" | "blocked" | "credential_insufficient";
  reason?: string;
  reasonCode?: string;
}

/**
 * O Intent Firewall atua como Risk Agent e Policy Agent combinados do MIND.
 * Agora operando sob a visão "Only Agents": sem aprovação humana, apenas Credenciais Metaplex.
 */
export class IntentFirewall {
  private readonly MAX_SLIPPAGE_BPS = 200; // Max 2% slippage default
  private readonly ALLOWED_PROTOCOLS = ["JUPITER", "KAMINO", "METEORA"];
  private readonly ALLOWED_ASSETS = ["SOL", "USDC", "USDT"];
  
  // Limites por Tier de Credencial (On-Chain cNFT Metaplex)
  private readonly TIER_LIMITS_SOL = {
    MICRO: 1,           // Até 1 SOL por operação
    PRO: 50,            // Até 50 SOL por operação
    INSTITUTIONAL: 1000 // Até 1000 SOL por operação
  };

  public validateIntent(intent: IntentRequest & { credentialTier?: CredentialTier }, currentBalanceSol: number): PolicyGateResult {
    if (!Number.isFinite(intent.amount) || intent.amount <= 0) {
      return { allowed: false, status: "blocked", reason: "Intent amount must be a positive number.", reasonCode: "RC_INVALID_AMOUNT" };
    }

    // 1. Policy Agent: Protocol Whitelist Check
    if (!this.ALLOWED_PROTOCOLS.includes(intent.protocol.toUpperCase())) {
      return { allowed: false, status: "blocked", reason: `Protocol ${intent.protocol} is not in the whitelist.`, reasonCode: "RC_POLICY_VIOLATION" };
    }

    // 2. Policy Agent: Asset Whitelist Check
    if (!this.ALLOWED_ASSETS.includes(intent.assetIn.toUpperCase())) {
      return { allowed: false, status: "blocked", reason: `Asset ${intent.assetIn} is not supported.`, reasonCode: "RC_POLICY_VIOLATION" };
    }

    // 3. Risk Agent: Liquidity / Balance Check
    if (intent.assetIn.toUpperCase() === "SOL" && intent.amount > (currentBalanceSol - 0.005)) {
      return { allowed: false, status: "blocked", reason: `Insufficient JIT Treasury balance for this intent.`, reasonCode: "RC_RISK_LIQUIDITY_CRUNCH" };
    }

    // 4. Risk Agent: Slippage Check
    if (
      intent.maxSlippageBps !== undefined &&
      (!Number.isFinite(intent.maxSlippageBps) || intent.maxSlippageBps < 0 || intent.maxSlippageBps > this.MAX_SLIPPAGE_BPS)
    ) {
      return { allowed: false, status: "blocked", reason: `Requested slippage (${intent.maxSlippageBps} bps) exceeds institutional maximum (${this.MAX_SLIPPAGE_BPS} bps).`, reasonCode: "RC_RISK_SLIPPAGE_EXCEEDED" };
    }

    // 5. Only Agents: Credential Tier Validation (Substitui aprovação humana)
    const tier = intent.credentialTier || "MICRO"; // Default para o tier mais baixo se não especificado
    const limit = this.TIER_LIMITS_SOL[tier];

    if (intent.assetIn.toUpperCase() === "SOL" && intent.amount > limit) {
      return { 
        allowed: false, 
        status: "credential_insufficient", 
        reason: `Amount ${intent.amount} SOL exceeds the limit for ${tier} credential (${limit} SOL). Upgrade your Metaplex Credential NFT.`, 
        reasonCode: "RC_CREDENTIAL_INSUFFICIENT" 
      };
    }

    return { allowed: true, status: "approved" };
  }
}
