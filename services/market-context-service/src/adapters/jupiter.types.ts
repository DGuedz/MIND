export type JupiterEnrichmentPayload = {
  intentId?: string;
  intent_id?: string;
  inputMint?: string;
  outputMint?: string;
  tokenMint?: string;
  tokenMints?: string[];
  ids?: string[] | string;
  slippageBps?: number;
  slippage_bps?: number;
  maxSlippageBps?: number;
  amountAtomic?: number | string;
  notional?: number | string;
  dryRun?: boolean;
};

export type JupiterPricePoint = {
  id: string;
  price: number | null;
  currency: string;
  confidence: number | null;
  source: "live" | "mock";
};

export type JupiterTokenSignal = {
  id: string;
  symbol: string | null;
  name: string | null;
  verified: boolean | null;
  verificationLabel: string | null;
  organicScore: number | null;
  tags: string[];
  source: "live" | "mock";
};

export type JupiterPolicyContext = {
  source: "jupiter";
  mocked: boolean;
  suggestedMaxSlippageBps: number;
  riskBufferBps: number;
  mevRiskScore: number;
  tokenVerificationRatio: number;
  hasUnverifiedToken: boolean;
  volatilityBps: number;
  latencyPenaltyBps: number;
  reasonHints: string[];
};

export type JupiterFetchedResult = {
  status: "fetched";
  statusCode: number;
  snapshotHash: string;
  mocked: false;
  price: {
    endpoint: string;
    points: JupiterPricePoint[];
    raw: unknown;
  };
  tokens: {
    endpoint: string;
    signals: JupiterTokenSignal[];
    raw: unknown;
  };
  policyContext: JupiterPolicyContext;
  artifactDir: string;
};

export type JupiterSkippedResult = {
  status: "skipped";
  reason: "dry_run" | "missing_api_key" | "missing_base_url";
  snapshotHash: string;
  mocked: true;
  price: {
    endpoint: string;
    points: JupiterPricePoint[];
    raw: unknown;
  };
  tokens: {
    endpoint: string;
    signals: JupiterTokenSignal[];
    raw: unknown;
  };
  policyContext: JupiterPolicyContext;
  artifactDir: string;
};

export type JupiterFailedResult = {
  status: "failed";
  reason: "http_error" | "parse_error" | "exception";
  statusCode?: number;
  snapshotHash: string;
  mocked: boolean;
  price: {
    endpoint: string;
    points: JupiterPricePoint[];
    raw: unknown;
  };
  tokens: {
    endpoint: string;
    signals: JupiterTokenSignal[];
    raw: unknown;
  };
  policyContext: JupiterPolicyContext;
  artifactDir: string;
  error: string;
};

export type JupiterContextResult = JupiterFetchedResult | JupiterSkippedResult | JupiterFailedResult;
