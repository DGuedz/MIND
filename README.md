# MIND - The Open Network for Agent Cards

**Build for agents. Get discovered. Earn on usage.**

MIND is a GitHub-native A2A (Agent-to-Agent) marketplace and execution protocol on Solana. 
It connects developers who build Agent Cards (AI services, trading strategies, data tools) with autonomous agents that need to consume them. 

Every execution is settled atomically onchain (USDC) with sub-cent fees, ensuring zero-latency discovery, instant creator monetization (92% revenue share), and verifiable cryptographic proofs.

`discovery -> intent -> atomic payment + split -> execution -> proof`

## Agentic GDP Infrastructure
MIND is positioned as the fundamental layer for the autonomous economy:
- **For Creators:** Publish reusable Agent Cards, define your price, and get paid per execution.
- **For Agents:** Find what you need to think, decide, and execute onchain. Fast, cheap, and verifiable.

[![Built for Solana Agent Economy Hackathon](https://img.shields.io/badge/Built_for-Solana_Agent_Economy_Hackathon-9945FF?style=for-the-badge&logo=solana&logoColor=white)](https://solana.com/hackathon)
[![Core Demo](https://img.shields.io/badge/Core_Demo-45--60s-14b8a6?style=for-the-badge)](#core-demo-45-60s)

## Live links
- Landing: https://mind-landingpage.vercel.app
- Telegram bot: https://t.me/Mind_Agent_Protocol_bot
- Repository: https://github.com/DGuedz/MIND

## Protocol Architecture & Business Model
Read our core specs for the Hackathon submission:
- [Solana Protocol Spec (Atomic Settlement & PDAs)](./SOLANA_PROTOCOL_SPEC.md)
- [Lean Canvas & Business Model (Minimum Sustainable Margin)](./LEAN_CANVAS_BUSINESS_MODEL.md)

## What works now
- **GitHub A2A Marketplace:** Agent Cards registry and discovery API.
- **SDKs:** Native LangChain and CrewAI tool wrappers.
- **Atomic Execution:** `simulated` and `real` modes supported by service contracts.
- **Multi-Chain Expansion:** Core contracts ready for Ethereum and Polygon.
- **Proof bundle composition and verification:** (`proofHash`, anchors, events).

## A2A Marketplace Demo
Want to see the atomic settlement in action? Run our marketplace demo to see an Agent Consumer discovering, buying, and settling a transaction for an Agent Card:

```bash
npx tsx scripts/demo_a2a_marketplace.ts
```
The script will output the exact Discovery process, the Atomic Fee Split (92% Dev / 8% MIND), and generate the cryptographic Usage Receipt.

## Core demo (45-60s)
Goal: show one clear flow from intent to proof.

1. Covalent market context is requested (`/v1/market-context/enrich`)
2. MIND creates an intent with economic parameters (`/v1/intents`)
3. MIND runs EV policy decision (`ALLOW | REJECT | REQUIRE_APPROVAL`)
4. MIND sends approval request to Telegram (`/v1/intents/request`)
5. If approved, execution is planned and run with canonical endpoints
6. MIND composes proof bundle and verifies it

Official demo command:

```bash
set -a; . ./.env; set +a
export DEMO_AUTO_APPROVE=true
export DEMO_EXECUTION_MODE=simulated
export DEMO_APPROVAL_TIMEOUT_SEC=25
export DEMO_MAX_SLIPPAGE_BPS=5
export DEMO_EXPECTED_PROFIT_BPS=40
export DEMO_LATENCY_PENALTY_BPS=2
export DEMO_MEV_RISK_SCORE=0.03
npx tsx scripts/demo_e2e_economic_rail.ts
```

The script prints a final JSON summary with:
- `intentId`
- `approvalId`
- `executionId`
- `routeUsed`
- `EV_net`
- `decision`
- `txHash` or `receiptHash`
- `route_hash`
- `execution_hash`
- `proofId`
- `proofHash`
- `proofVerified`
- `externalAnchorStatus`
- `metaplexConfirmed`
- `metaplex_proof_tx` / `metaplex_registry_ref`

Proof semantics:
- `proofVerified` = internal proof chain verified.
- `metaplexConfirmed` = external Metaplex anchor confirmed.
- With `STRICT_METAPLEX_ANCHOR=true`, verification only passes when external anchor is confirmed.

Strict mode states:
- `internal proof only`: internal chain verifies, no external provider evidence yet.
- `external anchor pending`: internal chain verifies, external provider still pending.
- `strict external anchor confirmed`: strict enabled and verification passes with confirmed external anchor + provider tx evidence.

Promotion gate command:
```bash
pnpm validate:strict-go-no-go
```

Full installation + strict validation (microtasks + evidence artifacts):
```bash
pnpm install:test:strict-stack
```

The gate writes a timestamped report to `artifacts/strict-mode-go-no-go-<timestamp>.json` and returns:
- `GO` when strict mode is effectively enabled and external proof is confirmed.
- `NO_GO` when env, service, strict behavior, or external evidence is missing.

OpenClaw runtime hardening (v2026.4.5 alignment):
- Install pipeline runs `openclaw doctor --fix` when CLI is available (`microtask-00` in `pnpm install:test:strict-stack`).
- Telegram/OpenClaw payloads now include `contextVisibility` (`all | allowlist | allowlist_quote`) with allowlist support.
- Structured progress events for OpenClaw requests are persisted to `governance/openclaw_progress_events.jsonl`.
- Provider request overrides are supported via env:
  - `OPENCLAW_AUTH_HEADER`, `OPENCLAW_AUTH_SCHEME`, `OPENCLAW_AUTH_TOKEN`
  - `OPENCLAW_EXTRA_HEADERS_JSON`
  - `OPENCLAW_PROXY_URL`, `OPENCLAW_PROXY_AUTH`
  - `OPENCLAW_TLS_INSECURE_SKIP_VERIFY`

Controlled local validation for external anchor wiring (non-production):
```bash
METAPLEX_PROOF_AUTH=local-dev-token pnpm dev:metaplex-proof-mock
```
```bash
METAPLEX_PROOF_ENDPOINT=http://localhost:3015/v1/proofs/anchor \
METAPLEX_PROOF_AUTH=local-dev-token \
pnpm validate:strict-go-no-go
```

## Sponsor integrations (hackathon focus)
| Sponsor | How MIND uses it in demo flow | Evidence path |
|---|---|---|
| Covalent | Market context enrichment before intent execution | `services/market-context-service/src/adapters/covalent.ts` |
| OpenClaw / NoahAI (Telegram UX path) | Human approval UX via Telegram callback webhook | `services/approval-gateway-service/src/notifications/telegram.ts` |
| Metaplex (proof pipeline alignment) | Proof-first architecture with hash anchors and bundle verification | `services/proof-service/src/index.ts` |

Note: this repository prioritizes verifiable working flow over speculative claims.

## Quick start (local)
### 1) Install and start services
```bash
pnpm install
pnpm dev:services:env
```

### 2) Configure Telegram webhook (for HITL)
Keep a public tunnel to port `3003` (example with localtunnel):
```bash
npx localtunnel --port 3003
```

Set/update `.env`:
```bash
APPROVAL_GATEWAY_PUBLIC_URL=https://<your-tunnel>.loca.lt
TELEGRAM_BOT_TOKEN=<your-telegram-bot-token>
TEST_TG_CHAT_ID=<your-chat-id>
```

Then configure webhook:
```bash
pnpm demo:setup-telegram-webhook
```

### 3) Run the hackathon demo
```bash
npx tsx scripts/demo_e2e_economic_rail.ts
```

## Useful verification endpoints
```bash
curl -s http://localhost:3000/v1/health/services
curl -s http://localhost:3000/v1/health/db
curl -s http://localhost:3003/v1/approvals/<approvalId>
curl -s http://localhost:3000/v1/proofs/<proofId>/bundle
```

## Repository structure
- `apps/api-gateway`: API facade and orchestration routes
- `services/intent-service`: intent lifecycle + policy check
- `services/approval-gateway-service`: Telegram approval gateway
- `services/execution-service`: execution planning + run
- `services/proof-service`: proof composition, anchors, verification
- `services/market-context-service`: Covalent context adapter
- `services/event-router-service`: dedicated live ingress service with auth, replay protection, dedupe, and circuit breaker
- `scripts/demo_e2e_economic_rail.ts`: official end-to-end economic rail demo script
- `docs/DEMO_EVIDENCE.json`: captured successful run with `proofVerified=true`

## Institutional docs (official)
- `docs/PRD_A2A_SERVER.md` (technical contract + stack extensions)
- `docs/MODELO_DE_NEGOCIOS.md` (business model canvas)
- `docs/STRICT_MODE_POLICY.md` (strict anchor promotion policy and operational gate)
- `docs/STRICT_MODE_INSTALLATION.md` (automated installation and strict validation microtasks)
- `docs/COLOSSEUM_ROADMAP_2026.md` (phase sequence and gates for hackathon execution)
- `docs/COLOSSEUM_DEV_UPDATES.md` (living log to report progress back to Colosseum)
- `docs/COLOSSEUM_HOT_INTEL_ROADMAP_2026-04-06.md` (Copilot-backed market intel + execution roadmap)
- `docs/AGENTIC_ADVANTAGE_LOOP.md` (daily loop to keep OpenClaw/Solana/RPC + governance checks fresh)
- `docs/STABLECOIN_B2B_RAIL_BLUEPRINT.md` (institutional stablecoin B2B narrative + operating blueprint)
- `docs/JUPITER_FRONTIER_CONTEXT_PROMPT_ZERO.md` (agent boot prompt for Jupiter Frontier mission)
- `docs/JUPITER_FRONTIER_PRD_PHASE1.md` (phase-1 scope and acceptance for Jupiter integration)
- `docs/JUPITER_FRONTIER_PRD_PHASE2.md` (Price+Tokens intent enrichment scope and runbook)
- `docs/DX-REPORT_JUPITER_TEMPLATE.md` (submission-grade DX report template)
- `governance/spec_runtime/` (spec-driven runtime docs, Prompt Zero, index, and skills map)
- `governance/REVENUE_MODEL.md` (monetization model)
- `governance/FLASH_LIQUIDITY_COORDINATION_THESIS.md` (flash liquidity thesis)

Spec-driven runtime commands:
```bash
pnpm spec:assemble-context --tier=1
pnpm spec:assemble-context --tier=2 --topic=revenue
pnpm spec:lint-claims
pnpm spec:event-router --event-file=governance/spec_runtime/samples/intent_block_event.json
pnpm dev:event-router-service
pnpm spec:event-router-service
pnpm spec:test-event-router-service
pnpm spec:test-e2e-live-flow
pnpm spec:test-service-router-integration
pnpm spec:validate-deployment-pack
pnpm spec:resolve-trigger --event-file=governance/spec_runtime/samples/intent_block_event.json
pnpm spec:test-triggers
pnpm spec:runtime-metrics
pnpm spec:context-feedback
pnpm spec:runtime-health
pnpm ops:agentic-loop --phase="Phase 2 - Live Reliability Loop" --status=in_progress
pnpm colosseum:update --phase="Phase 1 - Live Service Wiring" --status=in_progress --summary="Update summary"
pnpm jupiter:frontier:onboarding --dry-run=true
pnpm jupiter:frontier:phase2 --dry-run=true
pnpm jupiter:frontier:integration-test --dry-run=true
```

Production hardening pack for live ingress:
- `services/event-router-service/router.env.example`
- `services/event-router-service/observability_spec.md`
- `services/event-router-service/incident_severity.yaml`
- `services/event-router-service/alerts_config.md`
- `services/event-router-service/live_demo_runbook.md`
- `services/event-router-service/e2e_live_flow_test.ts`
- `services/event-router-service/deploy/Dockerfile`
- `services/event-router-service/deploy/docker-compose.yml`
- `services/event-router-service/deploy/pm2/ecosystem.config.cjs`
- `services/event-router-service/deploy/systemd/mind-event-router.service`
- `services/event-router-service/deploy/nginx/event-router.conf`
- `governance/spec_runtime/critical_event_coverage.md`

## Scope for this submission
In scope:
- secure intent pipeline
- HITL approval
- proof of execution
- sponsor integrations in the core path

Out of scope for judging flow:
- long-term institutional revenue thesis
- cross-chain expansion narrative
- speculative performance/MEV guarantees

## Security posture (current)
- Policy-first flow before execution
- Human approval gate for high-impact actions
- Hash-based audit trail (`approval`, `execution`, `proof` events)
- No claim of guaranteed profits

## Smoke tests
```bash
API_GATEWAY_URL=http://localhost:3000 ./scripts/smoke_health_db.sh
API_GATEWAY_URL=http://localhost:3000 ./scripts/smoke_a2a.sh
API_GATEWAY_URL=http://localhost:3000 ./scripts/smoke_proof_bundle.sh
```

## Hackathon summary
MIND is not a trading bot.
MIND is the secure intent rail that lets agents operate on Solana with policy, human control, and verifiable proof.
