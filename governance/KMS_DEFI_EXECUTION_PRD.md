# PRD - KMS DeFi Execution via Telegram (x402)

Status: Draft for implementation kickoff  
Owner: MIND Core  
Date: 2026-03-31

## 1) Executive Decision

This PRD defines how MIND moves from simulated execution to real on-chain DeFi execution via Telegram without Phantom dependency and without storing private keys in app databases.

Recommended strategy:
- Primary signer architecture: `KMSProvider` abstraction with `Turnkey` as first production provider.
- Optional UX layer: `Privy` for embedded wallet onboarding when needed.
- Policy enforcement remains in MIND (`Intent Firewall`) and is duplicated in provider-level policy controls.

Reason:
- Keeps execution server-side and automatable for Telegram flows.
- Preserves strong custody boundaries (no raw secret keys in MIND services).
- Supports multi-provider fallback and future migration.

## 2) Problem Statement

Current bot flow (`scripts/tg_neural_chat.ts`) can execute x402 settlement using local key material (`METAPLEX_KEYPAIR`), which is not production-grade custody for institutional scale.

We need:
- Real DeFi transactions (Kamino/Meteora/Jupiter routes) signed by institutional-grade KMS.
- Human-in-the-loop approvals from Telegram with strict policy checks.
- Complete audit trail with deterministic evidence (`txHash`, decision contract, proof record).

## 3) Product Goals

Primary goal:
- Execute approved Telegram intents as real Solana transactions signed by KMS, never exposing private keys to application code.

Secondary goals:
- Maintain existing decision contract semantics (`ALLOW|BLOCK|INSUFFICIENT_EVIDENCE|NEEDS_HUMAN_APPROVAL`).
- Preserve capital safety as top priority.
- Provide observable, replayable evidence for every critical action.

Non-goals (phase v1):
- Full autonomous execution without human approval.
- Cross-chain custody.
- Unlimited strategy plugins.

## 4) Success Metrics

North-star metric:
- `approved_intents_success_rate` >= 99% (approved intents that reach confirmed on-chain finality).

Safety metrics:
- `unauthorized_sign_attempts` = 0
- `policy_block_rate_for_invalid_requests` = 100%
- `key_material_exposure_incidents` = 0

Operational metrics:
- P95 time from Telegram approval to tx submitted <= 12s
- P95 time to confirmed/finalized <= 45s (network dependent)

## 5) Current vs Target Architecture

Current:
- `scripts/tg_neural_chat.ts` -> direct flow + local signer path
- `scripts/a2a_payment.ts` -> supports dry-run/real settlement with local decoded key
- `services/signer-service` -> HMAC mock (not blockchain signer)

Target:
- Telegram Bot -> Approval Gateway -> Intent Firewall -> Execution Orchestrator -> KMS Provider -> Solana RPC
- Proof Service stores immutable evidence bundle
- No raw private key in bot/service process memory beyond provider SDK session requirements

## 6) Proposed Components

### 6.1 New/Refactored Modules

1. `services/signer-service/src/providers/KmsProvider.ts`
- Interface for all KMS vendors.

2. `services/signer-service/src/providers/turnkey.ts`
- Turnkey implementation.

3. `services/signer-service/src/providers/privy.ts`
- Privy implementation (optional for v1 hard launch, required for vendor redundancy plan).

4. `services/signer-service/src/policy/SignPolicyEngine.ts`
- Local policy guard before provider sign call.

5. `services/execution-service/src/adapters/{Jupiter,Kamino,Meteora}ExecutionAdapter.ts`
- Build unsigned txs from strategy intents.

6. `services/approval-gateway-service`
- Add approval token + idempotency key + expiry enforcement.

7. `services/proof-service`
- Store full evidence: request hash, policy snapshot hash, unsigned tx hash, signed tx hash, tx signature.

### 6.2 KMS Provider Interface (contract)

```ts
export interface KmsProvider {
  createUserWallet(input: { userId: string; chain: "solana" }): Promise<{ walletId: string; publicKey: string }>;
  createSessionPolicy(input: {
    walletId: string;
    maxDailySol: number;
    allowedPrograms: string[];
    allowedMints: string[];
    expiresAt: string;
  }): Promise<{ policyId: string }>;
  signTransaction(input: {
    walletId: string;
    transactionBase64: string;
    context: {
      intentId: string;
      telegramUserId: string;
      strategy: string;
    };
  }): Promise<{ signedTransactionBase64: string; providerRequestId: string }>;
}
```

## 7) Security and Policy Controls

Mandatory controls:
- Contract/program allowlist (Meteora, Kamino, Jupiter routes, Memo where needed).
- Daily spend limit per wallet and per user.
- Per-intent max notional cap.
- Slippage bound validation before signing.
- Replay protection via intent nonce + idempotency key.
- Approval expiry window (example: 120 seconds).
- Kill switch at gateway and signer-service.
- Full request signing (HMAC/mTLS between internal services).

Guardrails from repository governance:
- Never execute high-risk action without human approval.
- Never claim success without tx evidence.
- Return canonical reason codes on block/failure.

## 8) End-to-End Flows

### 8.1 Onboarding (Telegram user -> managed wallet)

1. User starts bot.
2. Bot calls wallet provisioning endpoint.
3. KMS creates wallet and returns `publicKey`.
4. MIND persists mapping: `telegram_user_id -> wallet_id -> public_key`.
5. User receives policy setup prompt.

### 8.2 Execution (approved DeFi intent)

1. Bot receives "approve" callback.
2. Approval Gateway verifies token, expiry, and idempotency.
3. Intent Firewall evaluates risk/policy.
4. Execution Service builds unsigned transaction.
5. Signer Service re-validates policy and requests KMS signature.
6. Signed tx submitted to Solana.
7. Proof Service stores evidence bundle.
8. Bot returns final status with explorer link.

### 8.3 Failure handling

- Provider unavailable: `BLOCK` + `RC_TOOL_FAILURE`, no fallback to local private key.
- RPC blocked/rate-limited: `INSUFFICIENT_EVIDENCE` + `RC_RATE_LIMIT_OR_RPC_BLOCKED`.
- Policy mismatch: `BLOCK` + `RC_POLICY_VIOLATION`.

## 9) Data Model Additions

Add persistence entities:
- `kms_wallets`: wallet_id, provider, public_key, telegram_user_id, status
- `kms_policies`: policy_id, wallet_id, limits_json, allowed_programs, expires_at
- `intent_approvals`: intent_id, approval_token_hash, approved_at, expires_at, consumed_at
- `sign_requests`: intent_id, unsigned_tx_hash, provider_request_id, decision, reason_codes
- `onchain_receipts`: intent_id, signature, slot, confirmation_status, explorer_url

All tables must include:
- `created_at`, `updated_at`
- immutable `trace_id`
- append-only audit records for critical transitions

## 10) API Contracts (v1)

### `POST /v1/kms/wallets`
- Input: `telegramUserId`
- Output: `walletId`, `publicKey`

### `POST /v1/kms/policies`
- Input: `walletId`, limits, allowlists, expiry
- Output: `policyId`

### `POST /v1/intents/:id/execute`
- Input: approval token, execution params
- Output: decision contract + tx evidence

### Decision contract response (required)

```json
{
  "decision": "ALLOW|BLOCK|INSUFFICIENT_EVIDENCE|NEEDS_HUMAN_APPROVAL",
  "reason_codes": [],
  "confidence": 0.0,
  "assumptions": [],
  "required_followups": [],
  "evidence": [],
  "artifacts": {
    "txHash": "optional",
    "explorerUrl": "optional"
  }
}
```

## 11) Implementation Plan (Phased)

### Phase 0 - Hardening Baseline (3-5 days)

Deliverables:
- Remove direct key dependency from Telegram runtime path.
- Introduce `KmsProvider` interface and feature flags.
- Add strict idempotency in approval flow.

Done when:
- No code path in bot executes real tx using raw `.env` private key.
- Unit tests cover policy rejection and idempotency.

### Phase 1 - Turnkey Integration (5-8 days)

Deliverables:
- Wallet provisioning and transaction signing via Turnkey adapter.
- Policy creation and enforcement mapping.

Done when:
- Devnet transaction signed by Turnkey adapter from Telegram approval flow.
- Evidence bundle includes provider request id + Solana signature.

### Phase 2 - DeFi Adapter Execution (7-10 days)

Deliverables:
- Real unsigned tx builders for Kamino/Meteora/Jupiter paths.
- Slippage and notional checks integrated with policy engine.

Done when:
- Controlled devnet/mainnet-small-value flows execute with tx confirmation.

### Phase 3 - Production Readiness (5-7 days)

Deliverables:
- Observability dashboards and alerts.
- Incident runbooks and rollback controls.
- Optional Privy adapter for redundancy.

Done when:
- SLOs met for 7 consecutive days in shadow/protected mode.

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

---

## Sources (official)

- Turnkey Solana SDK docs: https://docs.turnkey.com/sdks/web3/solana
- Privy docs root: https://docs.privy.io
- Meteora public DLMM data API (used in current dashboard): https://dlmm.datapi.meteora.ag/pools
- Kamino public API OpenAPI: https://api.kamino.finance/openapi/json
