# Event Router Alerts Config

This file defines actionable operational alerts for live runtime governance.

## Metrics Source
- Primary: `pnpm spec:runtime-metrics`
- Logs:
  - `event_router_service_ingress.jsonl`
  - `event_router_service_outcomes.jsonl`
  - `event_router_service_security.jsonl`
  - `governance/spec_runtime/trigger_outcomes.jsonl`

## Severity Mapping
- P0/P1/P2/P3 mapping follows:
  - `services/event-router-service/incident_severity.yaml`

## Alert Rules

1. `alert_dispatch_failed_spike` (P1)
- Condition: `dispatch_failed_rate >= 0.05` over 5 minutes.
- Action:
  - open incident channel
  - run rollback procedure
  - preserve evidence bundle

2. `alert_circuit_open` (P1)
- Condition: any `circuit_open` status on ingress for production stream.
- Action:
  - block high-risk dependent intents
  - notify ops on-call
  - run health triage checklist

3. `alert_proof_verification_drop` (P0 for critical flow, otherwise P1)
- Condition: `proof_verified_rate < 0.95` over critical window.
- Action:
  - move runtime to safe mode
  - escalate security/risk owner
  - publish impacted event_ids

4. `alert_guardrail_violation_burst` (P2)
- Condition: guardrail violations exceed baseline for 15 minutes.
- Action:
  - open policy review task
  - validate slippage/timeout thresholds
  - rerun e2e flow tests

5. `alert_replay_or_auth_anomaly` (P1)
- Condition: replay or auth rejects trend upward for 15 minutes.
- Action:
  - rotate ingress token
  - inspect source IP distribution
  - verify ingress clients and dedupe keys

## Notification Targets
- Ops: `#mind-ops`
- Security: `#mind-security`
- Runtime governance: `#mind-runtime-governance`

## Minimum Incident Evidence
- `event_id`
- `event_type`
- `decision`
- `proof_status`
- `reason_codes`
- ingress/outcome/security logs
- trigger resolver output

## Verification Commands
```bash
pnpm spec:runtime-metrics
pnpm spec:test-event-router-service
pnpm spec:test-service-router-integration
pnpm --filter @mind/event-router-service run test:e2e-live-flow
```
