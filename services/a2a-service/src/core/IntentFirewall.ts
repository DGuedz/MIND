import { IntentRequest } from "./types.js";

export interface PolicyGateResult {
  allowed: boolean;
  reason?: string;
}

/**
 * O Intent Firewall atua como o "Circuit Breaker" institucional do MIND.
 * Ele avalia cada intenção contra as regras de negócio antes de repassá-la para o Adapter.
 */
export class IntentFirewall {
  private readonly MAX_SLIPPAGE_BPS = 200; // Max 2% slippage default
  private readonly ALLOWED_PROTOCOLS = ["JUPITER", "KAMINO", "METEORA"];
  private readonly ALLOWED_ASSETS = ["SOL", "USDC", "USDT"];

  public validateIntent(intent: IntentRequest, currentBalanceSol: number): PolicyGateResult {
    if (!Number.isFinite(intent.amount) || intent.amount <= 0) {
      return { allowed: false, reason: "Intent amount must be a positive number." };
    }

    // 1. Protocol Whitelist Check
    if (!this.ALLOWED_PROTOCOLS.includes(intent.protocol.toUpperCase())) {
      return { allowed: false, reason: `Protocol ${intent.protocol} is not in the whitelist.` };
    }

    // 2. Asset Whitelist Check
    if (!this.ALLOWED_ASSETS.includes(intent.assetIn.toUpperCase())) {
      return { allowed: false, reason: `Asset ${intent.assetIn} is not supported.` };
    }

    // 3. Notional Limit / Balance Check (Simplified for SOL)
    // Se o ativo for SOL, não pode gastar mais do que o balance - reserva de fee
    if (intent.assetIn.toUpperCase() === "SOL" && intent.amount > (currentBalanceSol - 0.005)) {
      return { allowed: false, reason: `Insufficient JIT Treasury balance for this intent.` };
    }

    // 4. Slippage Check
    if (
      intent.maxSlippageBps !== undefined &&
      (!Number.isFinite(intent.maxSlippageBps) || intent.maxSlippageBps < 0 || intent.maxSlippageBps > this.MAX_SLIPPAGE_BPS)
    ) {
      return { allowed: false, reason: `Requested slippage (${intent.maxSlippageBps} bps) exceeds institutional maximum (${this.MAX_SLIPPAGE_BPS} bps).` };
    }

    return { allowed: true };
  }
}
