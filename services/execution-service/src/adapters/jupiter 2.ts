import { DexAdapter, QuoteParams, RouteQuote } from "./types.js";

const JUPITER_QUOTE_BASE_URL =
  process.env.JUPITER_QUOTE_BASE_URL ?? "https://lite-api.jup.ag/swap/v1/quote";

export class JupiterDexAdapter implements DexAdapter {
  readonly name: string;
  private readonly dexes?: string[];

  constructor(name = "JUPITER", dexes?: string[]) {
    this.name = name;
    this.dexes = dexes;
  }

  async quote(params: QuoteParams): Promise<RouteQuote> {
    const query = new URLSearchParams({
      inputMint: params.inputMint,
      outputMint: params.outputMint,
      amount: String(params.amountAtomic),
      slippageBps: String(params.slippageBps)
    });

    if (this.dexes && this.dexes.length > 0) {
      query.set("dexes", this.dexes.join(","));
    }

    const response = await fetch(`${JUPITER_QUOTE_BASE_URL}?${query.toString()}`);
    if (!response.ok) {
      const body = await response.text();
      throw new Error(`jupiter_quote_failed status=${response.status} body=${body.slice(0, 300)}`);
    }

    const data = (await response.json()) as {
      inAmount?: string;
      outAmount?: string;
      priceImpactPct?: string;
      contextSlot?: number;
      routePlan?: Array<{ swapInfo?: { label?: string } }>;
    };

    if (!data.outAmount || !data.inAmount) {
      throw new Error("jupiter_quote_missing_amounts");
    }

    const routePlan =
      data.routePlan?.map((step) => step.swapInfo?.label || "unknown_dex").filter(Boolean) ?? [];

    return {
      adapter: this.name,
      inputMint: params.inputMint,
      outputMint: params.outputMint,
      inAmount: data.inAmount,
      outAmount: data.outAmount,
      priceImpactPct: Number(data.priceImpactPct ?? "0"),
      contextSlot: data.contextSlot,
      routePlan,
      raw: data
    };
  }
}

