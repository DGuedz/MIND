import { describe, it, expect, beforeEach } from "vitest";
import { TreasuryAgent } from "../core/agents/TreasuryAgent.js";

describe("TreasuryAgent Unit Tests", () => {
  let agent: TreasuryAgent;
  const mockWallet = "11111111111111111111111111111111"; // Mock pubkey for tests

  beforeEach(() => {
    agent = new TreasuryAgent(); // Defaults to 100 SOL (80 idle, 20 JIT)
  });

  it("should initialize with default mocked treasury allocation", () => {
    const state = agent.getTreasuryState("SOL");
    expect(state).toBeDefined();
    expect(state?.totalBalance).toBe(100);
    expect(state?.idleYieldBalance).toBe(80);
    expect(state?.activeJitBalance).toBe(20);
  });

  it("should return null for unmanaged assets", () => {
    const state = agent.getTreasuryState("BTC");
    expect(state).toBeNull();
  });

  describe("activateLiquidity (JIT Pull)", () => {
    it("should succeed without pulling if JIT balance is already sufficient", async () => {
      const result = await agent.activateLiquidity("SOL", 10, mockWallet);
      const state = agent.getTreasuryState("SOL")!;
      
      expect(result.success).toBe(true);
      expect(result.message).toContain("already active");
      // Balances unchanged
      expect(state.idleYieldBalance).toBe(80);
      expect(state.activeJitBalance).toBe(20);
    });

    it("should pull from Idle Yield if JIT is insufficient but total covers it", async () => {
      const result = await agent.activateLiquidity("SOL", 50, mockWallet); // needs 30 from idle
      const state = agent.getTreasuryState("SOL")!;

      expect(result.success).toBe(true);
      expect(result.message).toContain("Activated 30 SOL");
      
      // Balances shifted
      expect(state.idleYieldBalance).toBe(50); // 80 - 30
      expect(state.activeJitBalance).toBe(50); // 20 + 30
      expect(state.totalBalance).toBe(100);    // Total unchanged
    });

    it("should fail if total balance cannot cover the required amount", async () => {
      const result = await agent.activateLiquidity("SOL", 150, mockWallet);
      const state = agent.getTreasuryState("SOL")!;

      expect(result.success).toBe(false);
      expect(result.message).toContain("Insufficient total treasury balance");

      // Balances unchanged
      expect(state.idleYieldBalance).toBe(80);
      expect(state.activeJitBalance).toBe(20);
    });

    it("should fail for unmanaged assets", async () => {
      const result = await agent.activateLiquidity("ETH", 10, mockWallet);
      expect(result.success).toBe(false);
    });
  });

  describe("parkIdleCapital (Yield Return)", () => {
    it("should park capital back to Idle Yield successfully", async () => {
      // First let's put it in a known state
      const state = agent.getTreasuryState("SOL")!;
      
      const result = await agent.parkIdleCapital("SOL", 15, mockWallet);

      expect(result.success).toBe(true);
      expect(result.message).toContain("Parked 15 SOL");

      expect(state.activeJitBalance).toBe(5);  // 20 - 15
      expect(state.idleYieldBalance).toBe(95); // 80 + 15
      expect(state.totalBalance).toBe(100);
    });

    it("should fail if trying to park more than active JIT balance", async () => {
      const result = await agent.parkIdleCapital("SOL", 50, mockWallet); // active is only 20
      const state = agent.getTreasuryState("SOL")!;

      expect(result.success).toBe(false);
      expect(result.message).toContain("Cannot park more than active");

      // Balances unchanged
      expect(state.activeJitBalance).toBe(20);
      expect(state.idleYieldBalance).toBe(80);
    });

    it("should fail for unmanaged assets", async () => {
      const result = await agent.parkIdleCapital("USDC", 10, mockWallet);
      expect(result.success).toBe(false);
    });
  });
});
