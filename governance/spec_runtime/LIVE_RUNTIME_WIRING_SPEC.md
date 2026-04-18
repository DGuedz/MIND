# Live Runtime Wiring Spec

This spec defines the next live integration layer:
- `event_router_service.ts`
- domain adapters
- `runtime_guardrails.yaml`

## 1) `scripts/event_router_service.ts`
### Role
Official HTTP ingress for OpenClaw/A2A/runtime events.

### Endpoints
- `GET /v1/health`
- `POST /v1/events`

### Responsibilities
1. authenticate request by header token
2. enforce rate limit
3. enforce replay protection
4. apply duplicate suppression
5. adapt payload by domain adapter
6. validate runtime event schema
7. enforce operational guardrails
8. dispatch accepted events to `event_router.ts`
9. persist ingress/outcomes/security logs
10. maintain review queue on violations

### Request contract (`POST /v1/events`)
```json
{
  "source": "openclaw|a2a|intent_service|proof_service|execution_service|market_monitor",
  "domain": "intent|proof|execution|market",
  "event_type": "intent.policy.checked",
  "event_id": "evt_123",
  "timestamp": "2026-04-06T12:00:00Z",
  "agent_id": "mind_router",
  "context": {},
  "policy": {}
}
```

### Response contract
- `202 accepted`
- `400 invalid_event`
- `401 unauthorized`
- `409 replay_rejected`
- `422 guardrail_violation`
- `429 rate_limited`
- `503 circuit_open`

## 2) Domain adapters
### Files
- `shared/domain_adapters/intent_event_adapter.ts`
- `shared/domain_adapters/proof_event_adapter.ts`
- `shared/domain_adapters/execution_event_adapter.ts`
- `shared/domain_adapters/market_event_adapter.ts`
- `shared/domain_adapters/index.ts`

### Contract
Input: source payload from a domain service  
Output: normalized `EmitRuntimeEventInput` for MIND runtime schema.

## 3) `runtime_guardrails.yaml`
### Contract fields
- `auth.header_name`
- `auth.token_env`
- `rate_limit.window_sec`
- `rate_limit.max_requests_per_window`
- `replay_protection.ttl_sec`
- `duplicate_suppression.ttl_sec`
- `limits.max_slippage_bps`
- `limits.max_retry`
- `limits.proof_timeout_sec`
- `limits.anchor_timeout_sec`
- `circuit_breaker.failure_window_sec`
- `circuit_breaker.failure_threshold`
- `circuit_breaker.open_sec`

## 4) Persistence outputs
- `event_router_service_ingress.jsonl`
- `event_router_service_outcomes.jsonl`
- `event_router_service_security.jsonl`
- `review_queue.json`

## 5) Acceptance criteria
1. valid authenticated event is accepted and dispatched
2. duplicate event is suppressed or replay-rejected
3. slippage/retry/proof-timeout/anchor-timeout violations are blocked
4. violations enqueue review items
5. circuit breaker rejects events when failure threshold is exceeded
