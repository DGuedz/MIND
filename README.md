# MIND - Agent Cards Marketplace

Public hackathon branch for the Solana Agent Economy Hackathon.

MIND is an A2A marketplace and execution prototype for Agent Cards on Solana. The public scope is limited to the demo flow, source code, examples, and integration surfaces needed for judging.

## Demo Flow

```text
discovery -> intent -> policy check -> approval -> execution -> proof
```

## What Is Public In This Branch

- Agent Cards registry and marketplace code.
- API and service code for local demo execution.
- Sponsor integration surfaces used in the demo path.
- Public examples and setup templates without production secrets.

## Out Of Public Scope

- Internal investment thesis and fundraising material.
- Internal governance runtime logs and audit artifacts.
- Operational credential metadata.
- Local artifacts, backups, generated reports, and service logs.

## Run Locally

```bash
pnpm install
pnpm dev:services:env
```

Run the core demo:

```bash
npx tsx scripts/demo_e2e_economic_rail.ts
```

Useful local checks:

```bash
curl -s http://localhost:3000/v1/health/services
curl -s http://localhost:3000/v1/health/db
```

## Repository Structure

- `apps/landingpage`: public landing app.
- `services/intent-service`: intent lifecycle and policy check.
- `services/approval-gateway-service`: human approval gateway.
- `services/execution-service`: execution planning and run path.
- `services/proof-service`: proof bundle composition and verification.
- `services/market-context-service`: market context adapters.
- `scripts/demo_e2e_economic_rail.ts`: end-to-end demo script.

## Security Note

Do not commit real `.env` files, keys, credential metadata, generated logs, artifacts, or internal strategy documents. This branch is intentionally sanitized for public review.
