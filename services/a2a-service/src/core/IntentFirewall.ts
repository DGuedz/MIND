import { IntentRequest } from "./types.js";

export interface PolicyGateResult {
  allowed: boolean;
  status: "approved" | "blocked" | "approval_required";
  reason?: string;
  reasonCode?: string;
}

/**
 * O Intent Firewall atua como Risk Agent e Policy Agent combinados do MIND.
 * Ele avalia cada intenção contra limites de risco (mercado) e regras da tesouraria (institucional).
 */
export class IntentFirewall {
  private readonly MAX_SLIPPAGE_BPS = 200; // Max 2% slippage default
  private readonly ALLOWED_PROTOCOLS = ["JUPITER", "KAMINO", "METEORA"];
  private readonly ALLOWED_ASSETS = ["SOL", "USDC", "USDT"];
  private readonly HUMAN_APPROVAL_THRESHOLD_SOL = 10; // Acima de 10 SOL exige aprovação humana

  public validateIntent(intent: IntentRequest, currentBalanceSol: number): PolicyGateResult {
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

    // 5. Policy Agent: Human Approval Requirement
    if (intent.assetIn.toUpperCase() === "SOL" && intent.amount >= this.HUMAN_APPROVAL_THRESHOLD_SOL) {
      return { allowed: false, status: "approval_required", reason: `Amount ${intent.amount} SOL exceeds auto-execution limit. Needs human approval.`, reasonCode: "RC_NEEDS_HUMAN_APPROVAL" };
    }

    return { allowed: true, status: "approved" };
  }
}
