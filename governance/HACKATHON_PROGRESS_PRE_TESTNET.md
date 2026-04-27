# MIND Hackathon Progress Map Before Testnet

Date: 2026-04-26 America/Sao_Paulo
Scope: Colosseum Frontier readiness, testnet gap map, product direction

```json
{
  "decision": "NEEDS_HUMAN_APPROVAL",
  "reason_codes": ["RC_MISSING_EVIDENCE"],
  "confidence": 0.78,
  "assumptions": [
    "Frontier is the active hackathon target",
    "Testnet means a public devnet or controlled mainnet-beta validation path",
    "No real financial execution should be promoted without tx evidence"
  ],
  "required_followups": [
    "Re-run service and strict-mode gates in the current checkout",
    "Deploy or verify Solana programs on devnet/mainnet-beta",
    "Replace mock Cloak/Mindprint proof paths with verifiable receipts"
  ],
  "evidence": [
    "README.md",
    "governance/PITCHDECK_SCRIPT_V2.md",
    "governance/spec_runtime/pitch_hackathon.md",
    "artifacts/install-and-test-2026-04-05T23-31-02Z/install_and_test_report.json",
    "artifacts/strict-mode-go-no-go-2026-04-06T09-44-13-987Z.json",
    "artifacts/e2e-live-flow-2026-04-06T12-21-00-623Z/report.json",
    "artifacts/service-router-integration-2026-04-06T12-21-08-765Z/report.json",
    "artifacts/deployment-pack-validation-2026-04-06T12-20-51-145Z/report.json",
    "docs/DEMO_EVIDENCE.json"
  ]
}
```

## Executive Read

MIND started as a Solana A2A execution demo and is now closer to a
policy-controlled private checkout for agent payments.

The strongest hackathon story is:

`agent intent -> policy -> approval -> x402/payment -> Cloak privacy -> proof`

Do not lead with generic marketplace language. Lead with spend control,
private settlement, and proof for autonomous agents.

## External Hackathon Fit

Colosseum Frontier is live from April 6 to May 11, 2026. Colosseum says
the competition is an engineering and business sprint for startup-grade
products, with product submissions due May 11 and accelerator evaluation
for winners.

Solana x402 hackathon requirements are aligned with MIND's older thesis:
open-source code, x402 or related agent infrastructure on Solana, devnet
or mainnet deployment, a three-minute demo video, and runnable docs.

MIND fits best under:
1. x402 API integration.
2. Trustless agent / policy-controlled agent.
3. AgentPay / autonomous API payments.
4. Multi-protocol agent, if Cloak and x402 are both proven.

## Where We Came From

### Phase 0: Narrative and interface

The project began as an agent economy interface with Solana settlement
and marketplace language. Early public-facing copy leaned ambitious:
atomic execution, KMS, marketplace, Agent Cards, proof, and revenue share.

Status:
- Implemented as product narrative and frontend surface.
- Not enough by itself for judging.

### Phase 1: x402 and Telegram proof-of-action

The first credible wedge was not the dashboard. It was the loop where a
human can approve an agent payment and a tx/proof can be shown.

Historical evidence:
- `scripts/a2a_payment.ts` became the real settlement gate.
- Telegram UX was used as the HITL approval path.
- Memory indicates tiny mainnet x402 settlement was the real showcase,
  while other routes stayed simulated.

Status:
- Implemented and historically validated in prior runs.
- Must be revalidated before testnet/demo claims.

### Phase 2: Secure intent rail

MIND then became more coherent:

`signal -> intent -> policy check -> approval -> execution -> proof`

This fixed the core hackathon problem: judges need to see a clear safety
rail, not just a bot.

Historical evidence:
- `README.md` defines the official core demo and proof semantics.
- `docs/DEMO_EVIDENCE.json` has `decision: ALLOW` and
  `proofVerified: true`.
- Prior artifacts show successful install/test and proof bundle checks.

Status:
- Implemented.
- Historically validated.
- Current checkout not yet revalidated.

### Phase 3: Strict proof and deployment discipline

MIND added strict anchor gates, Metaplex proof integration, runtime
guards, event routing, and deployment-pack validation.

Historical evidence:
- `install_and_test_report.json`: all listed steps passed.
- `strict-mode-go-no-go-2026-04-06T09-44-13-987Z.json`: `GO`.
- `e2e-live-flow` report: `pass`.
- `service-router-integration` report: `pass`.
- `deployment-pack-validation` report: `pass`.

Status:
- Strongest internal engineering evidence.
- Still historical; testnet requires a fresh run.

### Phase 4: PMF correction

The pitch was corrected from "agent marketplace" to:

private, policy-checked agent payments on Solana.

That is a better hackathon and business wedge because it speaks to a real
pain: autonomous agents can act, but they cannot safely spend.

Status:
- `governance/PITCHDECK_SCRIPT_V2.md` captures the better thesis.
- `governance/LEAN_CANVAS.md` translates it into ICP, channels, model.

## Current Asset Inventory

### Product surface

- Landing app and marketplace pages exist.
- Cloak Gateway page exists.
- Agent Card catalogs exist.
- Current local counts:
  - 74 Agent Card JSON files under `agent-cards/skills`.
  - 19 local skill docs under `.agents/skills`.
  - 6 product cards under `agent-cards/products`.

Interpretation:
- Good supply-side narrative.
- Not equal to paid usage or PMF.

### Backend services

Implemented service boundaries:
- API gateway.
- Intent service.
- Market context service.
- Approval gateway.
- Registry service.
- Proof service.
- Execution service.
- Signer service.
- Event router service.
- A2A service.

Interpretation:
- Strong architectural depth for a hackathon.
- Risk: too broad unless demo narrows to one crisp flow.

### Solana programs

Programs found:
- `programs/mind_a2a_session`: session policy and 92/8 payment split.
- `programs/mind_cloak_settlement`: Cloak nullifier/Mindprint record.

Limitations:
- No root `Anchor.toml` found in this checkout.
- Program IDs look placeholder-style.
- No current deployment evidence found for these programs.

Decision:
- Claim "program code exists".
- Do not claim "deployed testnet program" yet.

### Cloak integration

Implemented:
- `apps/api-gateway/src/services/cloak.service.ts` imports
  `@cloak.dev/sdk` and wraps UTXO creation, transaction, withdrawal.
- API route `/v1/treasury/shield-pay` returns decision/evidence shape.
- Frontend Cloak Gateway calls the shield-pay endpoint.

Risks:
- Uses mainnet-beta directly in service code.
- Session key is read from API key header.
- `viewingKey` currently has a demo value.
- Nullifier/root extraction contains mock derivation fallback.
- Mindprint minting is logged, not fully proven on-chain.

Decision:
- Cloak integration is promising but not testnet-ready.
- It needs a controlled devnet/testnet path and proof evidence.

## Current Repo and Public Signal

GitHub current snapshot:
- Repo: `DGuedz/MIND`.
- Visibility: public.
- Default branch: `main`.
- Stars: 0.
- Forks: 1.
- Open issues: 1.
- Pull requests: 3 total, 3 merged.
- Latest merged PR: CLINT Agent Card from The Garage / Superteam.
- Remote branches verified:
  - `main`
  - `hackathon-public-sanitized`

Interpretation:
- GitHub proves shipping velocity and builder onboarding shape.
- GitHub does not yet prove demand, revenue, or PMF.

## Current Market Tailwind

Fresh public metrics pulled during this analysis:

- Solana TVL: about $5.58B.
- Solana stablecoins: about $15.71B.
- Solana DEX volume: about $1.05B over 24h.
- Solana DEX volume: about $7.99B over 7d.
- Solana DEX volume: about $43.15B over 30d.

Interpretation:
- The Solana liquidity rail is real.
- MIND should not pitch "Solana is early".
- Pitch: Solana has liquidity; agents lack spend controls.

## Implemented, Tested, Ready

### Implemented

- Agent Card catalog and marketplace shape.
- Intent creation and policy check path.
- Telegram/HITL approval path.
- Proof composition and verification path.
- Event router with replay and guardrail handling.
- Strict proof gate scripts.
- Cloak Gateway UI.
- Cloak SDK wrapper.
- Anchor program drafts for A2A session and Cloak settlement.

### Historically tested

- Install/test strict stack passed on 2026-04-05.
- Strict GO report generated on 2026-04-06.
- E2E live flow passed on 2026-04-06.
- Service router integration passed on 2026-04-06.
- Deployment pack validation passed on 2026-04-06.
- Demo evidence shows `proofVerified=true`.

### Ready now

Ready for:
- Narrative submission.
- Architecture walkthrough.
- Controlled local demo if services/env are restored.
- Supply-side story using Agent Cards and CLINT PR.

Not ready for:
- Testnet promotion claim.
- Production revenue claim.
- Enterprise readiness claim.
- Cloak settlement claim without a fresh tx/proof.
- "Zero hallucination" claim.

## Testnet Gap Map

### P0: Clean execution baseline

Problem:
The current worktree is dirty, with many modified files and deleted
duplicate `* 2.*` artifacts. This blocks a clean release read.

Required:
1. Decide public branch target: `main` or `hackathon-public-sanitized`.
2. Preserve user changes.
3. Generate a fresh clean-room branch or release branch.
4. Run all gates from that branch.

Gate:
`git ls-remote --heads origin main hackathon-public-sanitized`

### P0: Fresh service validation

Problem:
Historical evidence is not enough before testnet.

Required:
1. Export `.env`.
2. Start services with `pnpm dev:services:env`.
3. Verify `/v1/health/services`.
4. Verify `/v1/health/db`.
5. Run official demo.

Gate:
`pnpm install:test:strict-stack`

### P0: Solana deployment proof

Problem:
Program code exists, but deployment evidence is missing.

Required:
1. Add or restore `Anchor.toml`.
2. Confirm program IDs.
3. Build Anchor programs.
4. Deploy to devnet or controlled mainnet-beta.
5. Save tx signatures and program addresses.

Gate:
Explorer links plus deployment logs.

### P0: Cloak proof hardening

Problem:
The current Cloak path mixes real SDK calls with demo placeholders.

Required:
1. Move RPC/network config to env.
2. Remove hardcoded `viewingKey`.
3. Use explicit devnet/testnet mode.
4. Persist Cloak signature, nullifier, root, and policy decision.
5. Prove one settlement with verifiable tx or return
   `INSUFFICIENT_EVIDENCE`.

Gate:
`/v1/treasury/shield-pay` returns real evidence or blocks.

### P1: Proof/Mindprint closure

Problem:
Mindprint minting is part of the story but not fully evidenced in the
Cloak flow.

Required:
1. Connect shield-pay result to proof-service.
2. Anchor proof to Metaplex or mark internal-only.
3. Verify bundle after settlement.

Gate:
`proofVerified=true` plus external proof status clearly labeled.

### P1: PMF instrumentation

Problem:
MIND tracks architecture better than PMF.

Required weekly metrics:
1. Approved Agent Cards.
2. Paid executions.
3. Repeat buyers.
4. Builder payout volume.
5. Blocked unsafe intents.
6. Proof verification rate.
7. Cloak shielded settlement count.

Gate:
Dashboard or JSON snapshot with timestamp.

## Recommended Hackathon Positioning

One-liner:

MIND is the private checkout and risk desk for Solana AI agents.

Demo promise:

An agent requests a paid tool. MIND checks policy, asks for approval
when needed, pays through x402/Cloak, then emits a proof bundle.

What judges should remember:

1. Agents can spend only inside policy.
2. Sensitive intent can be shielded.
3. Every execution gets a receipt.
4. Builders can monetize skills as Agent Cards.

## 14-Day Plan Before Submission

### Day 1-2: Clean release branch

- Freeze scope.
- Use `hackathon-public-sanitized` as the public-safe branch unless
  `main` is cleaned and approved.
- Remove duplicate local artifacts from submission surface.
- Confirm no secrets or credential artifacts are exposed.

Output:
- Clean branch.
- GitHub URL.
- Secret scan evidence.

### Day 3-4: Service proof refresh

- Run install/test strict stack.
- Capture fresh reports under `artifacts/`.
- Fix any broken env/service contract.

Output:
- Fresh `GO` or `NO_GO`.
- Health service JSON.
- Demo output JSON.

### Day 5-7: Devnet/testnet settlement path

- Restore Anchor project config.
- Deploy A2A session or Cloak settlement program to devnet.
- Connect one endpoint to a verifiable tx.

Output:
- Program ID.
- Deployment tx.
- One settlement/proof tx.

### Day 8-9: Cloak partnership demo

- Convert Cloak Gateway from fallback demo to evidence-first mode.
- If Cloak proof is unavailable, show `INSUFFICIENT_EVIDENCE`.
- Record the exact proof fields.

Output:
- Shield-pay receipt.
- Nullifier/root evidence.
- No mock success.

### Day 10-11: Agent Card onboarding

- Pick 3 real cards:
  - CLINT.
  - Colosseum Copilot.
  - Zero Trust Release or Smart Contract Auditor.
- Give each one owner, price, SLA, proof requirement, payout route.

Output:
- 3 credible cards.
- 1 paid execution path.

### Day 12: PMF deck and video

- Use `PITCHDECK_SCRIPT_V2`.
- Keep video under 3 minutes.
- Show one flow end to end.
- Avoid revenue and enterprise claims.

Output:
- Deck.
- Script.
- Video capture checklist.

### Day 13-14: Submission hardening

- Run final gates.
- Verify public docs.
- Verify public links.
- Verify GitHub branch.
- Verify demo command.

Output:
- Final submission package.
- Evidence index.
- Known limitations.

## Final Recommendation

Do not expand scope before testnet.

The winning path is one narrow, provable transaction:

`Agent Card purchase -> policy ALLOW/BLOCK -> private settlement -> proof`

Everything else should support that story or be removed from the judging
surface.

## Sources

- Colosseum Frontier announcement:
  https://blog.colosseum.com/announcing-the-solana-frontier-hackathon/
- Colosseum hackathon page:
  https://colosseum.com/hackathon
- Solana x402 hackathon page:
  https://solana.com/x402/hackathon
- DefiLlama Solana:
  https://defillama.com/chain/Solana
- DefiLlama stablecoins:
  https://stablecoins.llama.fi/
- MIND repo:
  https://github.com/DGuedz/MIND

