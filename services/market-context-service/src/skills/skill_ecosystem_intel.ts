import { EcosystemIntelAdapter, EcosystemSignal } from "../adapters/ecosystem_intel.js";
import { upsertEcosystemSignal } from "../db/repository.js";
import { z } from "zod";

/**
 * Skill Nativa: Solana DeFi Ecosystem Intelligence
 * Acionada periodicamente ou sob demanda para atualizar os sinais de mercado do MIND.
 */
const SourceTypeSchema = z.enum([
  "indexer_api",
  "onchain_oracle",
  "blog",
  "docs",
  "changelog",
  "product_page",
  "x_post",
  "institutional_announcement",
  "press_release",
  "governance_forum"
]);

const ClassificationLayerSchema = z.enum(["public_ecosystem_signal", "verified_onchain_metric"]);

const EcosystemSignalSchema = z.object({
  id: z.string().min(1),
  protocolName: z.string().min(1),
  sourceUrl: z.string().url(),
  sourceType: SourceTypeSchema,
  publishedAt: z.string().datetime(),
  headline: z.string().min(1),
  summary: z.string().min(1),
  claimType: z.string().min(1),
  classificationLayer: ClassificationLayerSchema,
  confidenceScore: z.number().min(0).max(1),
  contentHash: z.string().regex(/^[a-f0-9]{64}$/i),
  timestamp: z.string().datetime(),
  lastSeenAt: z.string().datetime(),
  firstSeenAt: z.string().datetime(),
  evidence: z.any().optional(),
  metadata: z.any().optional()
});

export type EcosystemIntelIntent = {
  id: string;
  query: string;
  constraints?: {
    max_items?: number;
    max_cost_usdc?: number;
    freshness_minutes?: number;
    allow_source_types?: z.infer<typeof SourceTypeSchema>[];
  };
};

export type EcosystemIntelUpdateResult = {
  signals: EcosystemSignal[];
  proof: {
    intent_id: string;
    as_of: string;
    query: string;
    constraints: Record<string, unknown>;
    fetched_count: number;
    accepted_count: number;
    rejected_count: number;
    persisted_count: number;
    content_hashes: string[];
    source_urls: string[];
    warnings: string[];
  };
};

const estimateCostUSDC = (input: { maxItems: number }) => {
  const perItem = 0.0005;
  return Number((input.maxItems * perItem).toFixed(6));
};

const normalizeSignals = (input: {
  signals: EcosystemSignal[];
  allowSourceTypes?: z.infer<typeof SourceTypeSchema>[];
  maxItems: number;
}) => {
  const warnings: string[] = [];
  const allowSet = input.allowSourceTypes?.length ? new Set(input.allowSourceTypes) : null;

  const accepted: EcosystemSignal[] = [];
  let rejected = 0;

  for (const raw of input.signals) {
    const parsed = EcosystemSignalSchema.safeParse(raw);
    if (!parsed.success) {
      rejected += 1;
      continue;
    }

    const s = parsed.data;
    if (allowSet && !allowSet.has(s.sourceType)) {
      rejected += 1;
      continue;
    }

    if (s.classificationLayer === "verified_onchain_metric") {
      if (s.sourceType !== "indexer_api" && s.sourceType !== "onchain_oracle") {
        rejected += 1;
        warnings.push(`dropped_verified_onchain_metric_without_indexer_or_oracle:${s.protocolName}`);
        continue;
      }
    } else {
      if (s.sourceType === "indexer_api" || s.sourceType === "onchain_oracle") {
        rejected += 1;
        warnings.push(`dropped_public_signal_with_onchain_source_type:${s.protocolName}`);
        continue;
      }
    }

    accepted.push(s);
    if (accepted.length >= input.maxItems) break;
  }

  return { accepted, rejected, warnings };
};

export async function runEcosystemIntelUpdate(intent: EcosystemIntelIntent): Promise<EcosystemIntelUpdateResult> {
  const adapter = new EcosystemIntelAdapter();
  const now = new Date().toISOString();

  const maxItemsRaw = intent.constraints?.max_items;
  const maxItems = Number.isFinite(maxItemsRaw) ? Math.min(Math.max(Number(maxItemsRaw), 1), 50) : 10;
  const maxCostRaw = intent.constraints?.max_cost_usdc;
  const maxCost = typeof maxCostRaw === "number" && Number.isFinite(maxCostRaw) ? maxCostRaw : null;
  const allowSourceTypes = intent.constraints?.allow_source_types;

  const estimatedCostUSDC = estimateCostUSDC({ maxItems });
  if (maxCost !== null && estimatedCostUSDC > maxCost) {
    return {
      signals: [],
      proof: {
        intent_id: intent.id,
        as_of: now,
        query: intent.query,
        constraints: { ...intent.constraints, estimated_cost_usdc: estimatedCostUSDC },
        fetched_count: 0,
        accepted_count: 0,
        rejected_count: 0,
        persisted_count: 0,
        content_hashes: [],
        source_urls: [],
        warnings: ["policy_violation:max_cost_usdc"]
      }
    };
  }

  const fetched = await adapter.fetchLatestSignals(intent.query);
  const { accepted, rejected, warnings } = normalizeSignals({
    signals: fetched,
    allowSourceTypes,
    maxItems
  });

  let persistedCount = 0;
  const contentHashes: string[] = [];
  const sourceUrls: string[] = [];

  for (const signal of accepted) {
    await upsertEcosystemSignal(signal);
    persistedCount += 1;
    contentHashes.push(signal.contentHash);
    sourceUrls.push(signal.sourceUrl);
  }

  return {
    signals: accepted,
    proof: {
      intent_id: intent.id,
      as_of: now,
      query: intent.query,
      constraints: { ...intent.constraints, estimated_cost_usdc: estimatedCostUSDC },
      fetched_count: fetched.length,
      accepted_count: accepted.length,
      rejected_count: rejected,
      persisted_count: persistedCount,
      content_hashes: contentHashes.slice(0, 50),
      source_urls: Array.from(new Set(sourceUrls)).slice(0, 50),
      warnings
    }
  };
}
