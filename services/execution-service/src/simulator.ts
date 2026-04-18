import { createHash } from "node:crypto";

const canonicalize = (value: unknown): string => {
  if (value === null || value === undefined) {
    return "null";
  }
  if (Array.isArray(value)) {
    return `[${value.map(canonicalize).join(",")}]`;
  }
  if (typeof value === "object") {
    const obj = value as Record<string, unknown>;
    const keys = Object.keys(obj).sort();
    return `{${keys.map((key) => `${JSON.stringify(key)}:${canonicalize(obj[key])}`).join(",")}}`;
  }
  return JSON.stringify(value);
};

export const simulateExecution = async (input: {
  intentId: string;
  amount: string;
  maxSlippageBps: number;
  priceBounds?: { min?: number; max?: number };
  expiresAt: string;
}) => {
  const summary = {
    intentId: input.intentId,
    amount: input.amount,
    maxSlippageBps: input.maxSlippageBps,
    priceBounds: input.priceBounds ?? null,
    expiresAt: input.expiresAt
  };

  const receiptHash = createHash("sha256").update(canonicalize(summary)).digest("hex");

  return {
    status: "simulated" as const,
    receiptHash,
    summary
  };
};
