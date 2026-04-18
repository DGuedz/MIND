export type RouteQuote = {
  adapter: string;
  inputMint: string;
  outputMint: string;
  inAmount: string;
  outAmount: string;
  priceImpactPct: number;
  contextSlot?: number;
  routePlan: string[];
  raw: unknown;
};

export type QuoteParams = {
  inputMint: string;
  outputMint: string;
  amountAtomic: number;
  slippageBps: number;
};

export interface DexAdapter {
  readonly name: string;
  quote(params: QuoteParams): Promise<RouteQuote>;
}

