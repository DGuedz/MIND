import { Connection, PublicKey, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { KaminoAction, KaminoMarket } from "@kamino-finance/klend-sdk";

export interface TreasuryAllocation {
  asset: string;
  totalBalance: number;
  idleYieldBalance: number;
  activeJitBalance: number;
}

export class TreasuryAgent {
  private allocations: Map<string, TreasuryAllocation>;
  private connection: Connection;
  private mainMarketAddress = new PublicKey("7u3HeHxYDLhnCoErrtycNokbQYbWGzLs6JSDqG74t1wP"); // Main Kamino Market

  constructor(rpcUrl: string = "https://api.mainnet-beta.solana.com") {
    this.connection = new Connection(rpcUrl, "confirmed");
    this.allocations = new Map();
    // Default fallback mock if on-chain fails or takes too long to sync initially
    this.allocations.set("SOL", {
      asset: "SOL",
      totalBalance: 100,
      idleYieldBalance: 80,
      activeJitBalance: 20
    });
  }

  public getTreasuryState(asset: string): TreasuryAllocation | null {
    return this.allocations.get(asset.toUpperCase()) ?? null;
  }

  /**
   * Ativa capital do cofre de yield para o cofre JIT se houver necessidade e edge.
   */
  public async activateLiquidity(asset: string, amountRequired: number, walletPublicKeyStr: string): Promise<{ success: boolean; message: string; transaction?: any }> {
    const state = this.allocations.get(asset.toUpperCase());
    if (!state) return { success: false, message: `Asset ${asset} not managed by Treasury.` };

    if (state.activeJitBalance >= amountRequired) {
      return { success: true, message: "Sufficient JIT liquidity already active." };
    }

    const deficit = amountRequired - state.activeJitBalance;
    if (state.idleYieldBalance >= deficit) {
      try {
        // Mock fallback because klend-sdk strictly requires a provider instance which we don't have fully initialized for this hackathon
        // In a real scenario we'd use `await KaminoAction.buildWithdrawTxns(Kamino.create(...), ...)`
        state.idleYieldBalance -= deficit;
        state.activeJitBalance += deficit;
        
        return { 
          success: true, 
          message: `Activated ${deficit} ${asset} from Kamino Yield to Active JIT.`,
          transaction: { mockTx: true, action: "withdraw", amount: deficit }
        };
      } catch (e: any) {
        return { success: false, message: `Failed to build Kamino withdraw: ${e.message}` };
      }
    }

    return { success: false, message: "Insufficient total treasury balance to fulfill request." };
  }

  /**
   * Devolve capital da wallet JIT de volta para o protocolo de Yield.
   */
  public async parkIdleCapital(asset: string, amountToPark: number, walletPublicKeyStr: string): Promise<{ success: boolean; message: string; transaction?: any }> {
    const state = this.allocations.get(asset.toUpperCase());
    if (!state) return { success: false, message: `Asset ${asset} not managed by Treasury.` };

    if (state.activeJitBalance < amountToPark) {
      return { success: false, message: "Cannot park more than active JIT balance." };
    }

    try {
      // Mock fallback because klend-sdk strictly requires a provider instance which we don't have fully initialized for this hackathon
      state.activeJitBalance -= amountToPark;
      state.idleYieldBalance += amountToPark;
      
      return { 
        success: true, 
        message: `Parked ${amountToPark} ${asset} back to Kamino Yield.`,
        transaction: { mockTx: true, action: "deposit", amount: amountToPark }
      };
    } catch (e: any) {
       return { success: false, message: `Failed to build Kamino deposit: ${e.message}` };
    }
  }
}
