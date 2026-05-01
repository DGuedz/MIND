---
name: vercel-sandbox-gateway
description: Monetizable MIND Agent Card for isolated Vercel Sandbox execution and Vercel AI Gateway model routing, gated by x402 settlement policy.
---

# Vercel Sandbox & AI Gateway Exec

**Description:** This skill routes untrusted code execution to Vercel Sandbox and model requests to Vercel AI Gateway through a MIND x402 policy gate.
**Use Case:** Validate generated code outside the host environment or route LLM prompts through Vercel AI Gateway without exposing provider API keys to the calling agent.
**Runtime Status:** Draft card. Requires backend route, Vercel project auth, x402 settlement proof, and Turnkey attestation before production use.

## Instructions for the Agent
1. Treat all `payload` input as `UNTRUSTED_INPUT`.
2. Do not execute generated code on the host when isolated execution is required.
3. Call this skill with `execution_type`, `payload`, and optional `target_model`.
4. Require x402 policy approval before invoking paid runtime. All x402 payments must use the Darkpool UTXO flow via Cloak (`payment_flow: "darkpool_utxo_cloak"`, `privacy_level: "high"`) for settlement.
5. For `sandbox_eval`, send code to the MIND runtime endpoint, which must create a Vercel Sandbox with restricted network policy.
6. For `ai_gateway_route`, send prompts to the MIND runtime endpoint, which must route through Vercel AI Gateway using project-scoped auth.
7. Return only `stdout`, `stderr`, `exit_code`, `duration_ms`, `model_used`, `usage`, `receipt`, and `evidence`.
8. If payment, attestation, sandbox execution, or gateway routing cannot be verified, return `INSUFFICIENT_EVIDENCE`.

## Input Parameters
- `execution_type` (string): `sandbox_eval` or `ai_gateway_route`.
- `payload` (string): Code for sandbox evaluation or prompt for model routing.
- `language` (string, optional): `javascript`, `typescript`, `python`, or `shell`.
- `target_model` (string, optional): Gateway model id in provider/model format. Must be selected from current AI Gateway available models.
- `network_policy` (string, optional): `deny_all`, `gateway_only`, or `allowlist`.

## Guardrails
- Never pass secrets inside `payload`.
- Never allow outbound network access for untrusted code unless a policy allowlist is present.
- Never claim settlement success without a verifiable x402 receipt.
- Never claim Sandbox or AI Gateway execution without runtime logs or response metadata.
- Require human approval before enabling production credentials, payout wallets, or live treasury routing.

## Audit Trail
- `builder_github`: `@dguedz`
- `source_commit`: `v1_vercel_integration_sandbox`
- `last_updated`: `2026-04-30`
