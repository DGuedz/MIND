# MIND - Secure Intent Rail for Agent Economy

MIND is an A2A server for Solana agents.
It turns autonomous actions into verifiable intents:

`signal -> intent -> policy check -> human approval -> execution -> proof`

Agents do not execute blindly. They route intent through a secure layer.

[![Built for Solana Agent Economy Hackathon](https://img.shields.io/badge/Built_for-Solana_Agent_Economy_Hackathon-9945FF?style=for-the-badge&logo=solana&logoColor=white)](https://solana.com/hackathon)
[![Core Demo](https://img.shields.io/badge/Core_Demo-45--60s-14b8a6?style=for-the-badge)](#core-demo-45-60s)

## Live links
- Landing: https://landingpage-dgs-projects-ac3c4a7c.vercel.app
- Telegram bot: https://t.me/Mind_Agent_Protocol_bot
- Repository: https://github.com/DGuedz/MIND

## What works now
- Intent creation with policy validation
- Human-in-the-loop approval over Telegram
- Execution pipeline (`simulated` and `real` modes supported by service contracts)
- Proof bundle composition and verification (`proofHash`, anchors, events)
- Monorepo services with local DX and smoke scripts

## Core demo (45-60s)
Goal: show one clear flow from intent to proof.

1. Covalent market context is requested (`/v1/market-context/enrich`)
2. MIND creates an intent (`/v1/intents`)
3. MIND sends approval request to Telegram (`/v1/intents/request`)
4. Human clicks Approve/Reject in Telegram
5. If approved, execution is planned and run
6. MIND composes proof bundle and verifies it

New one-command demo script:

```bash
pnpm demo:secure-intent
```

The script prints a final JSON summary with:
- `intentId`
- `approvalId`
- `executionId`
- `txHash` or `receiptHash`
- `proofId`
- `proofHash`
- `proofVerified`

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
pnpm demo:secure-intent
```

## Useful verification endpoints
```bash
curl -s http://localhost:3000/v1/health/services
curl -s http://localhost:3000/v1/health/services/db
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
- `scripts/demo_secure_intent_rail.ts`: end-to-end hackathon demo script

## Institutional docs (official)
- `docs/PRD_A2A_SERVER.md` (technical contract + stack extensions)
- `docs/MODELO_DE_NEGOCIOS.md` (business model canvas)
- `governance/REVENUE_MODEL.md` (monetization model)
- `governance/FLASH_LIQUIDITY_COORDINATION_THESIS.md` (flash liquidity thesis)

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
