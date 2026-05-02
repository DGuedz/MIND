# Operational Flow Pipeline

This document dictates the exact steps for `solana-defi-ecosystem-intel` to process data from the `source-priority.md` list to the final MIND output.

## 1. Crawl
- Invoke `firecrawl-crawl` or `firecrawl-scrape` against the target URL.
- Filter URLs for recent content (e.g., `/blog/`, `/news/`).
- Skip irrelevant paths (`/careers`, `/legal`).

## 2. Extract
- Extract raw markdown.
- Identify the core claims: protocol name, date published, headline, summary.
- Map to `Signal Taxonomy` (e.g., `integration`, `product_launch`).

## 3. Normalize
- Convert dates to ISO 8601 UTC.
- Enforce the `output-schema.json` contract.
- Label missing numerical metrics as `null`.

## 4. Deduplicate
- Hash the `headline + published_at + protocol_name` to create `content_hash`.
- Query Neural Memory for existing `content_hash`.
- If match: update `last_seen_at`.
- If no match: register as new `public_ecosystem_signal`.

## 5. Confidence Scoring
- Calculate score based on the formula in `SKILL.md`.
  - Base: 0.5
  - Official domain: +0.3
  - Exact date/fact: +0.2
  - Missing author: -0.2
- Clamp result between 0.0 and 1.0.

## 6. Publish to MIND Feed
- Store the verified JSON payload in Neural Memory.
- Make it accessible via `/v1/market-signals` endpoint (or static JSON for the frontend MVP).
