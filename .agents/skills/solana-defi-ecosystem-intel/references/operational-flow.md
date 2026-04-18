# Operational Flow

## Step 1: Crawl

- Use Firecrawl search/crawl to collect candidate pages by protocol and source type.
- Keep crawl scope to public pages only.
- Capture raw metadata: URL, title, discovered_at, source_type.

## Step 2: Extract

- Extract fact-level statements only.
- Required extracted atoms:
  - protocol_name
  - published_at (if available)
  - headline
  - summary
  - claim_type
- If missing data, keep field `null` and append warning.

## Step 3: Normalize

- Normalize protocol aliases (example: `Kamino`, `Kamino Finance` -> `Kamino`).
- Convert timestamps to UTC ISO-8601.
- Canonicalize text (trim, collapse whitespace) before hashing.
- Compute `content_hash` as SHA-256(canonical_text).

## Step 4: Deduplicate

- Primary key: `content_hash`.
- Secondary near-dup key: `protocol_name + normalized_headline + published_at`.
- Merge evidence into one item and update `last_seen_at`.

## Step 5: Confidence Scoring

- Apply scoring policy from SKILL.md.
- Store numeric `confidence_score` and optional scoring notes.
- Any marketing-heavy statement without hard facts must be `claim_type=company_claim`.

## Step 6: Publish to MIND Feed

- Publish validated items to `ecosystem_intel` feed.
- Include layer:
  - `public_ecosystem_signal` (default for this skill)
  - `verified_onchain_metric` only when source is truly chain-verified pipeline

## Delivery Contract

- Return:
  - `items[]` (schema-valid)
  - `stats` (crawled, extracted, deduped, published)
  - `errors[]`
  - `warnings[]`
  - `run_timestamp`

## Quality Gates

Run fails if:
- Any item lacks source_url/timestamp/content_hash/confidence_score
- Any item is misclassified as onchain without chain-verified evidence
- Any fabricated metric is detected

