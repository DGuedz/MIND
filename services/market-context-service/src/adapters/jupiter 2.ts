import { createHash } from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import type {
  JupiterContextResult,
  JupiterEnrichmentPayload,
  JupiterPolicyContext,
  JupiterPricePoint,
  JupiterTokenSignal
} from "./jupiter.types.js";

const SOL_MINT = "So11111111111111111111111111111111111111112";
const USDC_MINT = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";

const nowIso = () => new Date().toISOString();
const ts = () => nowIso().replace(/[:.]/g, "-");

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

const hashValue = (value: unknown): string => {
  return createHash("sha256").update(canonicalize(value)).digest("hex");
};

const asNumber = (value: unknown): number | null => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const isTruthy = (value: string | undefined) => {
  if (!value) return false;
  return ["1", "true", "yes", "on"].includes(value.toLowerCase());
};

const parseJsonSafe = (value: string): unknown => {
  try {
    return JSON.parse(value) as unknown;
  } catch {
    return value;
  }
};

const ensureStringArray = (value: unknown): string[] => {
  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === "string" && item.length > 0);
  }
  if (typeof value === "string") {
    return value
      .split(",")
      .map((item) => item.trim())
      .filter((item) => item.length > 0);
  }
  return [];
};

const dedupe = (items: string[]) => Array.from(new Set(items));

const extractPricePoints = (raw: unknown, ids: string[], source: "live" | "mock"): JupiterPricePoint[] => {
  const dataNode =
    raw && typeof raw === "object" && "data" in (raw as Record<string, unknown>)
      ? ((raw as Record<string, unknown>).data as unknown)
      : raw;

  const points: JupiterPricePoint[] = [];

  if (dataNode && typeof dataNode === "object" && !Array.isArray(dataNode)) {
    for (const id of ids) {
      const byId = (dataNode as Record<string, unknown>)[id];
      const byIdRecord = byId && typeof byId === "object" ? (byId as Record<string, unknown>) : {};
      const price =
        asNumber((byIdRecord.price as unknown) ?? (byIdRecord.usdPrice as unknown) ?? (byId as unknown)) ??
        null;
      points.push({
        id,
        price,
        currency: "USD",
        confidence: asNumber(byIdRecord.confidence) ?? null,
        source
      });
    }
  }

  if (points.length > 0) {
    return points;
  }

  return ids.map((id, index) => ({
    id,
    price: index === 0 ? 140 : 1,
    currency: "USD",
    confidence: null,
    source: "mock"
  }));
};

const parseVerification = (node: Record<string, unknown>): { verified: boolean | null; label: string | null } => {
  const candidates: unknown[] = [
    node.verified,
    node.isVerified,
    node.verified_token,
    node.strict,
    node.verification,
    node.verificationStatus,
    node.verification_status
  ];

  for (const candidate of candidates) {
    if (typeof candidate === "boolean") {
      return { verified: candidate, label: candidate ? "verified" : "unverified" };
    }
    if (typeof candidate === "string") {
      const normalized = candidate.toLowerCase();
      if (["verified", "strict", "trusted", "pass"].includes(normalized)) {
        return { verified: true, label: candidate };
      }
      if (["unverified", "unsafe", "blocked", "fail"].includes(normalized)) {
        return { verified: false, label: candidate };
      }
      return { verified: null, label: candidate };
    }
  }

  return { verified: null, label: null };
};

const extractTokenSignal = (
  raw: unknown,
  mint: string,
  source: "live" | "mock"
): JupiterTokenSignal => {
  const root = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  const dataNode = root.data && typeof root.data === "object" ? (root.data as Record<string, unknown>) : root;
  const tokenNodeRaw =
    (dataNode[mint] as unknown) ??
    (root[mint] as unknown) ??
    (Array.isArray((dataNode as Record<string, unknown>).tokens)
      ? (dataNode as Record<string, unknown>).tokens
      : null);

  let node: Record<string, unknown> = {};

  if (Array.isArray(tokenNodeRaw)) {
    const match = tokenNodeRaw.find((item) => {
      if (!item || typeof item !== "object") return false;
      const itemMint =
        (item as Record<string, unknown>).address ??
        (item as Record<string, unknown>).mint ??
        (item as Record<string, unknown>).id;
      return typeof itemMint === "string" && itemMint === mint;
    });
    node = match && typeof match === "object" ? (match as Record<string, unknown>) : {};
  } else if (tokenNodeRaw && typeof tokenNodeRaw === "object") {
    node = tokenNodeRaw as Record<string, unknown>;
  } else if (dataNode && typeof dataNode === "object") {
    node = dataNode;
  }

  const verification = parseVerification(node);

  return {
    id: mint,
    symbol:
      (typeof node.symbol === "string" ? node.symbol : null) ??
      (typeof node.ticker === "string" ? node.ticker : null),
    name: typeof node.name === "string" ? node.name : null,
    verified: verification.verified,
    verificationLabel: verification.label,
    organicScore:
      asNumber(node.organicScore) ??
      asNumber(node.organic_score) ??
      asNumber(node.score) ??
      null,
    tags: ensureStringArray(node.tags),
    source
  };
};

const buildPolicyContext = (input: {
  payload: JupiterEnrichmentPayload;
  pricePoints: JupiterPricePoint[];
  tokenSignals: JupiterTokenSignal[];
  mocked: boolean;
}): JupiterPolicyContext => {
  const reasonHints: string[] = [];
  const livePrices = input.pricePoints.map((point) => point.price).filter((value): value is number => value !== null);
  const minPrice = livePrices.length > 0 ? Math.min(...livePrices) : 0;
  const maxPrice = livePrices.length > 0 ? Math.max(...livePrices) : 0;
  const volatilityBps =
    livePrices.length >= 3 && minPrice > 0 && maxPrice > 0
      ? Math.round(((maxPrice - minPrice) / maxPrice) * 10_000)
      : 0;

  const verifiedSignals = input.tokenSignals.filter((signal) => signal.verified === true).length;
  const knownVerification = input.tokenSignals.filter((signal) => signal.verified !== null).length;
  const tokenVerificationRatio = knownVerification > 0 ? verifiedSignals / knownVerification : 0;
  const hasUnverifiedToken = input.tokenSignals.some((signal) => signal.verified === false);

  const slippageFromPayload =
    asNumber(input.payload.maxSlippageBps) ??
    asNumber(input.payload.slippageBps) ??
    asNumber(input.payload.slippage_bps) ??
    50;

  let suggestedMaxSlippageBps = clamp(Math.round(slippageFromPayload), 5, 300);
  if (volatilityBps > 180) {
    suggestedMaxSlippageBps = Math.min(suggestedMaxSlippageBps, 35);
    reasonHints.push("volatility_guard_applied");
  }
  if (hasUnverifiedToken) {
    suggestedMaxSlippageBps = Math.min(suggestedMaxSlippageBps, 20);
    reasonHints.push("unverified_token_guard_applied");
  }

  const riskBufferBps = 10 + (volatilityBps > 180 ? 10 : 0) + (hasUnverifiedToken ? 20 : 0);
  const mevRiskScore = clamp(0.03 + volatilityBps / 10_000 + (hasUnverifiedToken ? 0.12 : 0), 0, 1);

  if (knownVerification === 0) {
    reasonHints.push("token_verification_unknown");
  }
  if (input.mocked) {
    reasonHints.push("mock_context_only");
  }

  return {
    source: "jupiter",
    mocked: input.mocked,
    suggestedMaxSlippageBps,
    riskBufferBps,
    mevRiskScore,
    tokenVerificationRatio,
    hasUnverifiedToken,
    volatilityBps,
    latencyPenaltyBps: 2,
    reasonHints
  };
};

const defaultIdsFromPayload = (payload: JupiterEnrichmentPayload): string[] => {
  const ids: string[] = [];
  ids.push(...ensureStringArray(payload.ids));
  ids.push(...ensureStringArray(payload.tokenMints));
  if (typeof payload.inputMint === "string") ids.push(payload.inputMint);
  if (typeof payload.outputMint === "string") ids.push(payload.outputMint);
  if (typeof payload.tokenMint === "string") ids.push(payload.tokenMint);
  const clean = dedupe(ids.filter((item) => item.length > 0));
  if (clean.length > 0) return clean;
  return [SOL_MINT, USDC_MINT];
};

const buildMockRawPrice = (ids: string[]) => {
  return {
    data: Object.fromEntries(
      ids.map((id, index) => [
        id,
        {
          id,
          price: index === 0 ? 140 : 1,
          confidence: 0.5
        }
      ])
    )
  };
};

const buildMockRawTokens = (ids: string[]) => {
  return {
    data: Object.fromEntries(
      ids.map((id, index) => [
        id,
        {
          address: id,
          symbol: index === 0 ? "SOL" : "USDC",
          name: index === 0 ? "Solana" : "USD Coin",
          verified: true,
          organicScore: index === 0 ? 0.95 : 0.99,
          tags: ["mock"]
        }
      ])
    )
  };
};

const resolveRepoRoot = async (): Promise<string> => {
  let current = process.cwd();
  const visited = new Set<string>();

  while (!visited.has(current)) {
    visited.add(current);
    try {
      await fs.access(path.join(current, "pnpm-workspace.yaml"));
      return current;
    } catch {
      const parent = path.dirname(current);
      if (parent === current) {
        return process.cwd();
      }
      current = parent;
    }
  }

  return process.cwd();
};

const buildArtifactDir = async () => {
  const configured = process.env.JUPITER_FRONTIER_ARTIFACTS_DIR;
  const root = configured
    ? path.resolve(configured)
    : path.join(await resolveRepoRoot(), "artifacts", "jupiter-frontier", `phase2-${ts()}`);
  await fs.mkdir(root, { recursive: true });
  return root;
};

const writeArtifact = async (artifactDir: string, name: string, payload: unknown) => {
  await fs.writeFile(path.join(artifactDir, name), JSON.stringify(payload, null, 2), "utf8");
};

const buildRequestHeaders = (apiKey: string) => ({
  authorization: `Bearer ${apiKey}`,
  "x-api-key": apiKey,
  "content-type": "application/json"
});

const fetchWithTimeout = async (url: string, headers: Record<string, string>, timeoutMs: number) => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      method: "GET",
      headers,
      signal: controller.signal
    });
    const text = await response.text();
    return { response, text, parsed: parseJsonSafe(text) };
  } finally {
    clearTimeout(timer);
  }
};

const resolvePriceEndpoint = (baseUrl: string, ids: string[]) => {
  const explicit = process.env.JUPITER_PRICE_API_URL;
  if (explicit) {
    const target = new URL(explicit);
    if (!target.searchParams.has("ids")) {
      target.searchParams.set("ids", ids.join(","));
    }
    return target.toString();
  }

  const endpoint = process.env.JUPITER_PRICE_API_PATH ?? "/price/v1";
  const target = new URL(`${baseUrl.replace(/\/$/, "")}${endpoint.startsWith("/") ? endpoint : `/${endpoint}`}`);
  target.searchParams.set("ids", ids.join(","));
  return target.toString();
};

const resolveTokensEndpoint = (baseUrl: string, ids: string[]) => {
  const explicit = process.env.JUPITER_TOKENS_API_URL;
  if (explicit) {
    if (explicit.includes("{mint}")) {
      return explicit.replace("{mint}", encodeURIComponent(ids[0] ?? SOL_MINT));
    }
    const target = new URL(explicit);
    if (!target.searchParams.has("ids")) {
      target.searchParams.set("ids", ids.join(","));
    }
    return target.toString();
  }

  const endpoint = process.env.JUPITER_TOKENS_API_PATH ?? "/tokens/v1";
  const target = new URL(`${baseUrl.replace(/\/$/, "")}${endpoint.startsWith("/") ? endpoint : `/${endpoint}`}`);
  target.searchParams.set("ids", ids.join(","));
  return target.toString();
};

export const fetchJupiterContext = async (
  payload: Record<string, unknown>
): Promise<JupiterContextResult> => {
  const normalizedPayload = payload as JupiterEnrichmentPayload;
  const ids = defaultIdsFromPayload(normalizedPayload);
  const artifactDir = await buildArtifactDir();
  const timeoutMs = Number(process.env.JUPITER_ENRICH_TIMEOUT_MS ?? "12000");

  const baseUrl =
    process.env.JUPITER_DEV_PLATFORM_BASE_URL?.trim() ?? process.env.JUPITER_BASE_URL?.trim() ?? "";
  const apiKey = process.env.JUPITER_DEV_API_KEY?.trim() ?? process.env.JUPITER_API_KEY?.trim() ?? "";
  const forcedDryRun =
    normalizedPayload.dryRun === true || isTruthy(process.env.JUPITER_ENRICH_DRY_RUN?.trim());

  const priceEndpoint = baseUrl ? resolvePriceEndpoint(baseUrl, ids) : "dry-run:price";
  const tokensEndpoint = baseUrl ? resolveTokensEndpoint(baseUrl, ids) : "dry-run:tokens";

  const writeCommonArtifacts = async (
    result: JupiterContextResult,
    priceRaw: unknown,
    tokensRaw: unknown,
    mode: "live" | "mock"
  ) => {
    await Promise.all([
      writeArtifact(artifactDir, "jupiter_enrichment_request.json", {
        generatedAt: nowIso(),
        mode,
        payload: normalizedPayload,
        ids,
        priceEndpoint,
        tokensEndpoint,
        forcedDryRun,
        hasApiKey: Boolean(apiKey),
        hasBaseUrl: Boolean(baseUrl)
      }),
      writeArtifact(artifactDir, "jupiter_price_response.json", priceRaw),
      writeArtifact(artifactDir, "jupiter_tokens_response.json", tokensRaw),
      writeArtifact(artifactDir, "jupiter_policy_context.json", result.policyContext),
      writeArtifact(artifactDir, "jupiter_enrichment_summary.json", result)
    ]);
  };

  if (forcedDryRun || !apiKey || !baseUrl) {
    const reason = forcedDryRun ? "dry_run" : !apiKey ? "missing_api_key" : "missing_base_url";
    const mockPriceRaw = buildMockRawPrice(ids);
    const mockTokensRaw = buildMockRawTokens(ids);
    const pricePoints = extractPricePoints(mockPriceRaw, ids, "mock");
    const tokenSignals = ids.map((id) => extractTokenSignal(mockTokensRaw, id, "mock"));
    const policyContext = buildPolicyContext({
      payload: normalizedPayload,
      pricePoints,
      tokenSignals,
      mocked: true
    });

    const snapshotHash = hashValue({ payload: normalizedPayload, price: mockPriceRaw, tokens: mockTokensRaw });
    const result: JupiterContextResult = {
      status: "skipped",
      reason,
      snapshotHash,
      mocked: true,
      price: {
        endpoint: priceEndpoint,
        points: pricePoints,
        raw: mockPriceRaw
      },
      tokens: {
        endpoint: tokensEndpoint,
        signals: tokenSignals,
        raw: mockTokensRaw
      },
      policyContext,
      artifactDir
    };

    await writeCommonArtifacts(result, mockPriceRaw, mockTokensRaw, "mock");
    return result;
  }

  try {
    const headers = buildRequestHeaders(apiKey);

    const [priceResponse, tokensResponse] = await Promise.all([
      fetchWithTimeout(priceEndpoint, headers, timeoutMs),
      fetchWithTimeout(tokensEndpoint, headers, timeoutMs)
    ]);

    const livePricePoints = extractPricePoints(priceResponse.parsed, ids, "live");
    const liveTokenSignals = ids.map((id) => extractTokenSignal(tokensResponse.parsed, id, "live"));
    const policyContext = buildPolicyContext({
      payload: normalizedPayload,
      pricePoints: livePricePoints,
      tokenSignals: liveTokenSignals,
      mocked: false
    });

    const snapshotHash = hashValue({
      payload: normalizedPayload,
      price: priceResponse.parsed,
      tokens: tokensResponse.parsed
    });

    const statusCode = Math.max(priceResponse.response.status, tokensResponse.response.status);

    if (!priceResponse.response.ok || !tokensResponse.response.ok) {
      const result: JupiterContextResult = {
        status: "failed",
        reason: "http_error",
        statusCode,
        snapshotHash,
        mocked: false,
        price: {
          endpoint: priceEndpoint,
          points: livePricePoints,
          raw: priceResponse.parsed
        },
        tokens: {
          endpoint: tokensEndpoint,
          signals: liveTokenSignals,
          raw: tokensResponse.parsed
        },
        policyContext,
        artifactDir,
        error: `jupiter_http_error price=${priceResponse.response.status} tokens=${tokensResponse.response.status}`
      };
      await writeCommonArtifacts(result, priceResponse.parsed, tokensResponse.parsed, "live");
      return result;
    }

    const result: JupiterContextResult = {
      status: "fetched",
      statusCode,
      snapshotHash,
      mocked: false,
      price: {
        endpoint: priceEndpoint,
        points: livePricePoints,
        raw: priceResponse.parsed
      },
      tokens: {
        endpoint: tokensEndpoint,
        signals: liveTokenSignals,
        raw: tokensResponse.parsed
      },
      policyContext,
      artifactDir
    };

    await writeCommonArtifacts(result, priceResponse.parsed, tokensResponse.parsed, "live");
    return result;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const mockPriceRaw = buildMockRawPrice(ids);
    const mockTokensRaw = buildMockRawTokens(ids);
    const pricePoints = extractPricePoints(mockPriceRaw, ids, "mock");
    const tokenSignals = ids.map((id) => extractTokenSignal(mockTokensRaw, id, "mock"));
    const policyContext = buildPolicyContext({
      payload: normalizedPayload,
      pricePoints,
      tokenSignals,
      mocked: true
    });
    const snapshotHash = hashValue({ payload: normalizedPayload, error: message, ids });

    const result: JupiterContextResult = {
      status: "failed",
      reason: "exception",
      snapshotHash,
      mocked: true,
      price: {
        endpoint: priceEndpoint,
        points: pricePoints,
        raw: mockPriceRaw
      },
      tokens: {
        endpoint: tokensEndpoint,
        signals: tokenSignals,
        raw: mockTokensRaw
      },
      policyContext,
      artifactDir,
      error: message
    };

    await writeCommonArtifacts(result, mockPriceRaw, mockTokensRaw, "mock");
    return result;
  }
};

export type {
  JupiterContextResult,
  JupiterEnrichmentPayload,
  JupiterPolicyContext,
  JupiterPricePoint,
  JupiterTokenSignal
};
