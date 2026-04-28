export type EcosystemSignalItem = {
  protocol_name: string;
  source_url: string;
  source_type: string;
  published_at: string;
  timestamp: string;
  headline: string;
  summary: string;
  claim_type: string;
  classification_layer: "public_ecosystem_signal" | "verified_onchain_metric";
  confidence_score: number;
  content_hash: string;
  last_seen_at: string;
};

type EcosystemSignalsResponse = {
  feed: "ecosystem_intel";
  layer: "public_ecosystem_signal";
  stale: boolean;
  cached_at: string;
  items: EcosystemSignalItem[];
};

export type ArchiveCardSignal = {
  line1: string;
  line2: string;
  line3: string;
};

const gatewayBaseUrl = (import.meta.env.VITE_API_GATEWAY_URL || "http://127.0.0.1:3000").trim().replace(/\/$/, "");

const defaultSignals: Record<string, ArchiveCardSignal> = {
  "Institutional DeFi": {
    line1: "KAMINO_PRIME: SIGNAL",
    line2: "ONDO_RWA: SIGNAL",
    line3: "SOURCE: MARKET_SIGNALS"
  },
  "Data Marketplace": {
    line1: "A2A_VOLUME: SIGNAL",
    line2: "GROWTH: SIGNAL",
    line3: "SOURCE: MARKET_SIGNALS"
  },
  "Cross-Chain Routing": {
    line1: "RWA_DOMINANCE: SIGNAL",
    line2: "RANKING: SIGNAL",
    line3: "SOURCE: MARKET_SIGNALS"
  },
  "Yield Optimization": {
    line1: "TVL_CONTEXT: SIGNAL",
    line2: "RISK_MODE: SIGNAL",
    line3: "SOURCE: MARKET_SIGNALS"
  },
  "Governance SDK": {
    line1: "COMPLIANCE: SIGNAL",
    line2: "POLICY_STATE: SIGNAL",
    line3: "SOURCE: MARKET_SIGNALS"
  }
};

const short = (text: string, max = 28) => (text.length > max ? `${text.slice(0, max - 3)}...` : text);

export const fetchEcosystemSignals = async (): Promise<EcosystemSignalsResponse> => {
  try {
    const response = await fetch(`${gatewayBaseUrl}/v1/market/signals`, {
      headers: { Accept: "application/json" }
    });
    if (!response.ok) {
      throw new Error(`market_signals_http_${response.status}`);
    }
    return (await response.json()) as EcosystemSignalsResponse;
  } catch (error) {
    // Silently fallback if connection is refused or other network errors occur
    console.warn("Backend unavailable, using fallback signals:", error instanceof Error ? error.message : String(error));
    return {
      feed: "ecosystem_intel",
      layer: "public_ecosystem_signal",
      stale: true,
      cached_at: new Date().toISOString(),
      items: []
    };
  }
};

export const buildArchiveSignalsMap = (items: EcosystemSignalItem[]) => {
  const map = { ...defaultSignals };
  const byProtocol = new Map<string, EcosystemSignalItem[]>();

  for (const item of items) {
    if (item.classification_layer !== "public_ecosystem_signal") continue;
    const key = item.protocol_name.toLowerCase();
    const list = byProtocol.get(key) ?? [];
    list.push(item);
    byProtocol.set(key, list);
  }

  const pick = (protocol: string) => (byProtocol.get(protocol.toLowerCase()) ?? [])[0];

  const kamino = pick("Kamino");
  const ondo = pick("Ondo");
  if (kamino || ondo) {
    map["Institutional DeFi"] = {
      line1: kamino ? `KAMINO: ${short(kamino.claim_type.toUpperCase())}` : map["Institutional DeFi"].line1,
      line2: ondo ? `ONDO: ${short(ondo.claim_type.toUpperCase())}` : map["Institutional DeFi"].line2,
      line3: "LABEL: MARKET_SIGNALS"
    };
  }

  const meteora = pick("Meteora");
  if (meteora) {
    map["Data Marketplace"] = {
      line1: `METEORA: ${short(meteora.claim_type.toUpperCase())}`,
      line2: `CONF: ${(meteora.confidence_score * 100).toFixed(0)}%`,
      line3: "LABEL: MARKET_SIGNALS"
    };
    map["Yield Optimization"] = {
      line1: `METEORA: ${short(meteora.headline.toUpperCase(), 24)}`,
      line2: `CONF: ${(meteora.confidence_score * 100).toFixed(0)}%`,
      line3: "LABEL: MARKET_SIGNALS"
    };
  }

  return map;
};

