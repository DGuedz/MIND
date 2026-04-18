# PRD - A2A Neural Rails: Credential-Gated Execution

Status: Active Evolution (Only Agents Vision)
Owner: MIND Core  
Date: 2026-04-17

## 1) Executive Decision

This PRD defines the shift from Human-in-the-Loop (HITL) to **Autonomous Credential-Gated Execution**. MIND is no longer a tool for humans to approve bot actions; it is the **Settlement Layer** where agents interact, pay, and execute based on on-chain credentials (Metaplex Core).

Recommended strategy:
- **Only Agents Policy:** Execution is triggered by "Neural Messages" (signed intents with x402 payment).
- **Credential-Gated Security:** Instead of human clicks, the `SignerService` validates the agent's Metaplex NFT (Credential) against the requested capital and risk profile.
- **Deterministic Proofs:** Every execution produces a `Proof Bundle` (Metaplex Core Asset) that serves as an immutable receipt for other agents in the network.

Reason:
- Speed: Machine-to-machine transactions cannot wait for human intervention.
- Scale: A2A economy requires programmable trust, not manual oversight.
- Sovereignty: The human role moves from "Approver" to "Architect" (defining policies and issuing credentials).

## 2) Problem Statement

Previous HITL flows (Telegram-based) created latency and scaling bottlenecks. The agent economy needs:
- **Discovery-to-Settlement:** A single message rail where an agent finds a service, pays for it (x402), and receives the output.
- **Automated Trust:** Verification that an agent is authorized to spend capital without exposing private keys.
- **Neural Rails:** A unified communication protocol where "Money is a Message".

## 3) Product Goals

Primary goal:
- Enable agents to execute real Solana transactions (DeFi, Data, Compute) using KMS-backed wallets, gated strictly by on-chain credentials.

Secondary goals:
- **Zero-Latency Settlement:** Remove manual approval steps for agents with valid credentials.
- **Atomic Revenue Splits:** Ensure the MIND Protocol captures its 8% fee on every A2A interaction.
- **Auditability:** Maintain the `Proof-as-a-Service` model for post-execution compliance.

## 4) Success Metrics

North-star metric:
- `A2A_settlement_volume`: Total SOL/USDC flowing through the MIND Neural Rails.

Safety metrics:
- `credential_validation_failure_rate`: Rejection of unauthorized agents (Target: 100% precision).
- `policy_breach_rate`: 0% (No agent executes outside its credentialed limits).

Operational metrics:
- `Message-to-Settlement_Latency`: < 5 seconds.

## 5) Architecture: The Neural Rail

The flow moves from a centralized gateway to a distributed intent propagation:

1. **Discovery:** Agent A identifies a task (e.g., "Need 100 SOL Hedge").
2. **Intent:** Agent A broadcasts a "Neural Message" (JSON + x402 Payment + Signature).
3. **Validation:** MIND Kernel verifies:
   - Possession of Metaplex Credential NFT.
   - Policy compliance (Slippage, Notional, Risk).
4. **Execution:** KMS Provider signs and submits to Solana (Atomic Split included).
5. **Receipt:** Proof Bundle generated and sent back to Agent A.

## 6) Components

### 6.1 Neural Message Schema

```json
{
  "version": "1.0",
  "intent_id": "uuid",
  "agent_id": "publicKey",
  "credential_nft": "mintAddress",
  "action": {
    "type": "DEFI_SWAP",
    "params": { "input": "SOL", "output": "USDC", "amount": 1000000000 }
  },
  "payment": {
    "type": "x402",
    "amount": 0.001,
    "recipient": "MIND_TREASURY"
  },
  "signature": "agentSignature"
}
```

### 6.2 Credential Tiers (Metaplex-Gated)

- **Tier 1 (Micro):** Allows automated trades up to 1 SOL. Issued to basic task agents.
- **Tier 2 (Pro):** Allows up to 50 SOL. Requires multi-sig policy or staked MIND tokens.
- **Tier 3 (Institutional):** Unlimited. Requires cold-wallet governor approval for policy changes.

## 7) Implementation Roadmap (Priorities)

### Phase 1: Neural Messaging MVP
- Implement the JSON schema validation for A2A messages.
- Connect x402 payment detection to the execution trigger.

### Phase 2: Metaplex Credential Gating
- Integrate Metaplex Core SDK to check NFT ownership on every `signTransaction` call.
- Implement the "Kill Switch" via NFT burning or metadata freezing.

### Phase 3: Atomic Settlement Engine
- Ensure every transaction built by `execution-service` includes the 92/8 split.
- Automate the `Proof-as-a-Service` receipt generation.

## 12) Real Testing Strategy

### 12.1 Test Pyramid

Unit:
- Policy engine checks (limits, allowlist, expiry, nonce).
- Adapter serialization/deserialization.

Integration:
- Signer-service <-> KMS sandbox/API integration.
- Execution-service unsigned tx builder against known fixtures.

E2E:
- Telegram approval -> signed tx -> confirmation -> proof record.

### 12.2 Mandatory Real Validation (capital-safe)

Stage A (Devnet):
- 20 successful executions, mixed allow/block cases.
- 0 unauthorized sign operations.

Stage B (Mainnet guarded):
- Small notional (example 0.001-0.01 SOL equivalent).
- 10 successful executions across at least 2 protocol adapters.
- Evidence captured for each run:
  - `intent_id`
  - decision contract
  - provider request id
  - tx signature + explorer URL
  - post-trade balance check

### 12.3 Failure/Chaos Tests

- Simulate provider timeout.
- Simulate RPC failure.
- Simulate stale approval token.
- Simulate slippage breach.

Expected:
- Safe `BLOCK`/`INSUFFICIENT_EVIDENCE`, never unsafe fallback signer.

## 13) Observability and Auditability

Required telemetry:
- `intent_received`, `intent_approved`, `policy_checked`, `sign_requested`, `sign_succeeded`, `tx_submitted`, `tx_confirmed`, `tx_failed`

Required logs:
- Hashes and ids only, no secrets.
- Structured JSON logs with trace correlation.

Required dashboards:
- Approval-to-confirmation latency
- Block reasons by reason code
- Provider availability and error rate

## 14) Rollout and Safe Fallback

Rollout:
- `dry-run` -> `shadow-sign` -> `mainnet-small` -> `limited-prod` -> `full-prod`.

Fallback policy:
- On KMS/provider incident: pause execution (`kill switch`) and keep read-only monitoring.
- Never fallback to raw local key signer for real funds.

## 15) Risks and Mitigations

Risk: provider lock-in  
Mitigation: `KmsProvider` abstraction + dual adapter support.

Risk: policy drift between MIND and provider  
Mitigation: policy hash snapshots stored per sign request.

Risk: replay/duplicate approval  
Mitigation: expiring approval tokens + consumed flag + nonce.

Risk: false success reporting  
Mitigation: success only after tx signature + confirmation check.

## 16) Provider Decision Matrix

Turnkey strengths:
- Strong server-side signing model and Solana SDK path.
- Good fit for policy-driven backend execution.

Privy strengths:
- Strong user onboarding UX and embedded wallet experience.
- Good for hybrid UX where user-level auth/wallet UX is required.

Recommended rollout:
- v1: Turnkey-first for execution.
- v1.5: Privy adapter for optional onboarding/secondary provider.

## 17) Repo-Level Task List (Implementation Mapping)

Primary files to change:
- `scripts/tg_neural_chat.ts`
- `scripts/a2a_payment.ts`
- `services/signer-service/src/index.ts`
- `services/approval-gateway-service/src/index.ts`
- `services/execution-service/src/index.ts`
- `services/proof-service/src/index.ts`

New files (suggested):
- `services/signer-service/src/providers/KmsProvider.ts`
- `services/signer-service/src/providers/turnkey.ts`
- `services/signer-service/src/providers/privy.ts`
- `services/signer-service/src/policy/SignPolicyEngine.ts`
- `services/execution-service/src/adapters/KaminoAdapter.ts`
- `services/execution-service/src/adapters/MeteoraAdapter.ts`
- `services/execution-service/src/adapters/JupiterAdapter.ts`

## 18) Acceptance Gate (Definition of Done)

All must be true:
- Policy applied and recorded for every critical execution.
- Evidence bundle attached for every real transaction.
- Canonical reason codes returned on every block/failure.
- Safe fallback behavior validated in chaos tests.
- No non-negotiable governance rule violated.

## 19) Marketplace: Agent Cards + Escrow + Revenue Split (Solana)

This PRD also covers the execution-grade monetization layer required for the hackathon narrative:
- Builders (agents or humans) list Agent Cards and reusable skills.
- Requesters (agents) buy execution and data delivery under an escrow contract.
- Settlement is atomic and programmatic: escrow creation, delivery proof, release and split.

### 19.1 Outcomes
- A requester agent can request a card execution with a known price and policy.
- MIND can prove availability and integrity (source-of-truth verification).
- Funds are locked in escrow, delivery is verified, and the split is applied automatically by contract.

### 19.2 Flow (happy path)
1. Builder lists Agent Card (metadata + pricing + payout splits).
2. Requester calls discovery and selects a card.
3. MIND returns a payment requirement (x402) with a reference and expiry.
4. Requester funds escrow (or pays into an escrow initializer).
5. Execution runs under policy and produces an evidence bundle.
6. Proof is anchored (receipt hash + on-chain anchors).
7. Escrow releases to beneficiaries per split policy (ex: builder %, MIND %, optional referrer %).

### 19.3 Contract assumptions (v1)
- Splits are immutable per listing (or versioned).
- Escrow is a PDA-controlled account with explicit state transitions.
- Release requires proof reference and policyHash match.

### 19.4 Acceptance criteria (v1)
- No funds move without escrow state and proof reference.
- Every release includes `txHash` + `proofId` + `policyHash`.
- Any missing proof yields `INSUFFICIENT_EVIDENCE`, no release.

## 20) Landing Page (Institutional UX)

Landing must communicate and operationalize:
- What is sold: Agent Cards + Skills + Data delivery.
- How it settles: proof first, escrow second, split last.
- Where to build: GitHub + marketplace entry points.

### 20.1 Required UX elements
- Dedicated sections for:
  - Marketplace
  - How it works (Request -> Proof -> Escrow -> Split)
  - Builders (list a card)
  - GitHub evidence and docs entry
- Navigation routes that map to these sections and to the marketplace route.

### 20.2 Acceptance criteria
- User can reach Marketplace and Builders CTA in two clicks from hero.
- External GitHub link is visible in header/footer.
- Copy avoids absolute claims without proof language.

## 21) Devnet + Private Repo Operating Policy

While operating in devnet and private mode:
- Do not expose repository URLs publicly in the landing experience.
- Do not print secrets, API keys, bearer tokens, or raw headers in logs.
- Treat frontend `VITE_*` variables as public and non-secret by default.

### 21.1 Logging constraints (minimum)
- Log only ids and hashes for execution evidence: `intentId`, `approvalId`, `paymentId/reference`, `txHash`, `proofId`, `policyHash`.
- Never log: `COLOSSEUM_COPILOT_PAT`, Turnkey API private keys, Solana secret keys, or any bearer tokens.
- Errors must be reduced to message and code; do not dump request objects that may contain headers.

---

## Sources (official)

- Turnkey Solana SDK docs: https://docs.turnkey.com/sdks/web3/solana
- Privy docs root: https://docs.privy.io
- Meteora public DLMM data API (used in current dashboard): https://dlmm.datapi.meteora.ag/pools
- Kamino public API OpenAPI: https://api.kamino.finance/openapi/json
