import { z } from "zod";

export const IntentStatus = z.enum([
  "draft",
  "scored",
  "awaiting_approval",
  "approved",
  "rejected",
  "delegated",
  "executed",
  "failed",
  "proved"
]);

export const AgentStatus = z.enum(["active", "paused", "revoked"]);

export const ApprovalDecision = z.enum(["approved", "rejected"]);

export const ExecutionStatus = z.enum(["pending", "running", "succeeded", "failed"]);

export const ExecutionMode = z.enum(["simulated", "real"]);

export const AgentSchema = z.object({
  id: z.string(),
  name: z.string(),
  role: z.string(),
  wallet: z.string(),
  capabilities: z.array(z.string()),
  policyId: z.string().optional(),
  status: AgentStatus,
  createdAt: z.string()
});

export const MarketContextSchema = z.object({
  id: z.string(),
  source: z.string(),
  snapshotHash: z.string(),
  score: z.number(),
  createdAt: z.string()
});

export const PolicySchema = z.object({
  id: z.string(),
  name: z.string(),
  hash: z.string(),
  rules: z.record(z.unknown()),
  createdAt: z.string()
});

export const IntentSchema = z.object({
  id: z.string(),
  creatorAgentId: z.string(),
  targetAgentId: z.string().optional(),
  asset: z.string(),
  action: z.enum(["buy", "sell", "rebalance", "monitor"]),
  amount: z.string(),
  confidence: z.number(),
  riskScore: z.number(),
  expiryTs: z.string(),
  policyId: z.string(),
  policyHash: z.string().optional(),
  marketContextId: z.string().optional(),
  status: IntentStatus,
  createdAt: z.string(),
  updatedAt: z.string()
});

export const ApprovalSchema = z.object({
  id: z.string(),
  intentId: z.string(),
  contextId: z.string().optional(),
  taskId: z.string().optional(),
  channel: z.enum(["telegram", "whatsapp", "api"]),
  requesterId: z.string(),
  decision: ApprovalDecision.optional(),
  decidedAt: z.string().optional()
});

export const ExecutionSchema = z.object({
  id: z.string(),
  intentId: z.string(),
  mode: ExecutionMode,
  status: ExecutionStatus,
  txHash: z.string().optional(),
  receiptHash: z.string().optional(),
  executedAt: z.string().optional()
});

export const ProofSchema = z.object({
  id: z.string(),
  intentId: z.string(),
  approvalId: z.string().optional(),
  executionId: z.string().optional(),
  proofHash: z.string(),
  createdAt: z.string()
});

export const CreateIntentInputSchema = IntentSchema.omit({
  id: true,
  status: true,
  createdAt: true,
  updatedAt: true,
  policyHash: true
});

export const CreateAgentInputSchema = AgentSchema.omit({
  id: true,
  createdAt: true
});

export const CreateMarketContextInputSchema = MarketContextSchema.omit({
  id: true,
  createdAt: true
});

export const CreateApprovalInputSchema = ApprovalSchema.omit({
  id: true,
  decidedAt: true
});

export const CreateExecutionInputSchema = ExecutionSchema.omit({
  id: true
});

export const CreateProofInputSchema = ProofSchema.omit({
  id: true,
  createdAt: true
});

export type Agent = z.infer<typeof AgentSchema>;
export type Intent = z.infer<typeof IntentSchema>;
export type Approval = z.infer<typeof ApprovalSchema>;
export type Execution = z.infer<typeof ExecutionSchema>;
export type Proof = z.infer<typeof ProofSchema>;
export type Policy = z.infer<typeof PolicySchema>;
export type MarketContext = z.infer<typeof MarketContextSchema>;
