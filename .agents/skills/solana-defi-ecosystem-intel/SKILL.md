---
name: solana-defi-ecosystem-intel
description: Collects and structures public Solana DeFi ecosystem signals (blogs, docs, changelogs, X, institutional posts) using Firecrawl. Use when user asks to "track ecosystem updates", "build market signals feed", or "monitor protocol announcements". Never label these as verified onchain metrics.
version: 1.0.0
license: Proprietary
compatibility: Claude Code, Codex, OpenClaw
metadata: {"category":"ecosystem-intelligence","author":"MIND","tags":"solana,defi,firecrawl,signals,intel,rwa"}
---

# Solana DeFi Ecosystem Intel

This skill builds a structured intelligence feed from **public ecosystem sources**.

It is not an onchain telemetry skill.

## Non-Negotiable Classification Rules

1. Never classify institutional posts as onchain data.
2. Always separate:
   - `public_ecosystem_signal`
   - `verified_onchain_metric`
3. Every record must include:
   - `source_url`
   - `timestamp`
   - `content_hash`
   - `confidence_score`
4. Extract only verifiable published facts.
5. Promotional claims must be tagged `company_claim`.
6. Never invent missing metrics.
7. Keep architecture ready for future replacement by backend/GitHub/indexer sources.

## Trigger Phrases

Use this skill when user asks:
- "track Solana DeFi updates"
- "build ecosystem intelligence feed"
- "monitor protocol announcements"
- "collect market signals"
- "update landing with market signals"

Do not use this skill for:
- direct RPC/contract reads
- wallet balances
- transaction counts from chain
- proof verification from chain events

## Source Taxonomy

- `indexer_api` (DefiLlama, Helius)
- `onchain_oracle` (Pyth)
- `blog`
- `docs`
- `changelog`
- `product_page`
- `x_post`
- `institutional_announcement`
- `press_release`
- `governance_forum`

## Signal Taxonomy

- `integration`
- `partnership`
- `product_launch`
- `risk_incident`
- `liquidity_program`
- `incentive_program`
- `compliance_update`
- `company_claim`
- `onchain_volume` (Must be verified by indexer)
- `onchain_tvl` (Must be verified by indexer)

## Priority Source Map (Initial)

Use `references/source-priority.md` as canonical source map for:
- **Helius / RPC Nodes:** Onchain verified transactions and block metrics.
- **DefiLlama / CoinGecko APIs:** Market volume, circulating supply, and historical prices.
- **Pyth Network:** Real-time onchain price feeds and oracles.
- **Jupiter API:** Swap volume and liquidity depth.
- **Meteora / Kamino:** Yield, TVL, and pool state.
- **Solana Foundation:** Ecosystem roundups and official network health.
- **Marginfi / Drift:** Margin limits, perp volume, and borrowing rates.

## Operational Pipeline

Use `references/operational-flow.md`.

Mandatory order:
1. Crawl
2. Extract
3. Normalize
4. Deduplicate
5. Confidence scoring
6. Publish to MIND feed

## Required Output Contract

Use `references/output-schema.json`.

Minimum required fields for each item:
- `protocol_name`
- `source_url`
- `source_type`
- `published_at`
- `headline`
- `summary`
- `claim_type`
- `confidence_score`
- `content_hash`
- `last_seen_at`
- `classification_layer` (`public_ecosystem_signal` or `verified_onchain_metric`)

## Confidence Scoring Policy

Use bounded score `0.0` to `1.0`.

Base scoring:
- +0.30 official domain/source
- +0.20 explicit date + concrete fact
- +0.20 corroborated by second independent source
- +0.10 stable permalink (docs/changelog)
- -0.20 purely promotional language
- -0.20 missing author/date

Clamp to `[0.0, 1.0]`.

Guidance:
- `>= 0.80`: high confidence
- `0.60 - 0.79`: medium confidence
- `< 0.60`: low confidence (publish only if relevant, label clearly)

## Anti-Hallucination and Anti-Duplication

1. Do not infer values not present in source.
2. If a metric is absent, return `null` and add note in `extraction_warnings`.
3. Deduplicate by:
   - exact `content_hash`
   - near-duplicate (`protocol_name + normalized_headline + published_at`)
4. Keep `first_seen_at` and update `last_seen_at` on recurrence.
5. Preserve provenance for all merged duplicates in `evidence`.

## Publish Contract to MIND Feed

Publish each normalized item to internal feed contract:

```json
{
  "feed": "ecosystem_intel",
  "layer": "public_ecosystem_signal",
  "event": { "...schema item..." }
}
```

Never publish public posts under `verified_onchain_metric`.

## Landing Integration Rules (No Design Change)

1. Keep existing design system.
2. Inject numbers/claims only with label:
   - `Market Signals` for this skill output.
3. Reserve `Verified Onchain Metrics` only for RPC/indexer-verified data.
4. Show `source_url` and `as_of` timestamp in tooltip/details panel.
5. If feed unavailable, show last valid snapshot with timestamp.

## Acceptance Criteria

The run is accepted only if:
1. Every item validates against output schema.
2. Every item has provenance (`source_url`, `timestamp`, `content_hash`).
3. Classification layer is explicit.
4. Promotional claims are tagged `company_claim`.
5. No fabricated metric fields.
6. Deduplication report is produced.

## Fallback Behavior

If crawl/extract fails:
1. Return last valid snapshot (`stale=true`).
2. Include `fallback_reason`.
3. Include `last_successful_run_at`.
4. Do not backfill with guessed values.

