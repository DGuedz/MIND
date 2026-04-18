import { describe, it, expect, beforeEach } from "vitest";
import { IntentFirewall } from "../core/IntentFirewall.js";
import { IntentRequest } from "../core/types.js";

describe("IntentFirewall Unit Tests", () => {
  let firewall: IntentFirewall;

  beforeEach(() => {
    firewall = new IntentFirewall();
  });

  const createBaseIntent = (overrides?: Partial<IntentRequest>): IntentRequest => ({
    intentId: "test-intent",
    protocol: "JUPITER",
    action: "SWAP",
    assetIn: "SOL",
    amount: 5,
    agentId: "test-agent",
    ...overrides
  });

  it("should approve valid intent within limits (Happy Path)", () => {
    const intent = createBaseIntent();
    const result = firewall.validateIntent(intent, 100);

    expect(result.allowed).toBe(true);
    expect(result.status).toBe("approved");
    expect(result.reasonCode).toBeUndefined();
  });

  it("should require human approval for amounts >= 10 SOL", () => {
    const intent = createBaseIntent({ amount: 15 });
    const result = firewall.validateIntent(intent, 100);

    expect(result.allowed).toBe(false);
    expect(result.status).toBe("approval_required");
    expect(result.reasonCode).toBe("RC_NEEDS_HUMAN_APPROVAL");
  });

  it("should block intent if amount is invalid", () => {
    const intent = createBaseIntent({ amount: -5 });
    const result = firewall.validateIntent(intent, 100);

    expect(result.allowed).toBe(false);
    expect(result.status).toBe("blocked");
    expect(result.reasonCode).toBe("RC_INVALID_AMOUNT");
  });

  it("should block unsupported protocols (Policy Agent)", () => {
    const intent = createBaseIntent({ protocol: "UNISWAP" });
    const result = firewall.validateIntent(intent, 100);

    expect(result.allowed).toBe(false);
    expect(result.status).toBe("blocked");
    expect(result.reasonCode).toBe("RC_POLICY_VIOLATION");
  });

  it("should block unsupported assets (Policy Agent)", () => {
    const intent = createBaseIntent({ assetIn: "PEPE" });
    const result = firewall.validateIntent(intent, 100);

    expect(result.allowed).toBe(false);
    expect(result.status).toBe("blocked");
    expect(result.reasonCode).toBe("RC_POLICY_VIOLATION");
  });

  it("should block intent if slippage exceeds max institutional limit (Risk Agent)", () => {
    const intent = createBaseIntent({ maxSlippageBps: 250 }); // > 200 default max
    const result = firewall.validateIntent(intent, 100);

    expect(result.allowed).toBe(false);
    expect(result.status).toBe("blocked");
    expect(result.reasonCode).toBe("RC_RISK_SLIPPAGE_EXCEEDED");
  });

  it("should block intent if liquidity is insufficient (Risk Agent)", () => {
    const intent = createBaseIntent({ amount: 50 });
    const result = firewall.validateIntent(intent, 20); // balance is 20, need 50

    expect(result.allowed).toBe(false);
    expect(result.status).toBe("blocked");
    expect(result.reasonCode).toBe("RC_RISK_LIQUIDITY_CRUNCH");
  });
});
