# Event Router Live Demo Runbook

This runbook executes a live governed runtime loop with evidence capture.

## Preconditions
- `.env` loaded with valid service URLs
- `EVENT_ROUTER_SERVICE_TOKEN` configured
- `governance/spec_runtime/runtime_guardrails.yaml` present
- No pending migration issues on core services

## Step 1: Start Core Services
```bash
set -a; . ./.env; set +a
pnpm dev:services:env
```

## Step 2: Verify Health
```bash
curl -s http://127.0.0.1:3016/v1/health
curl -s http://localhost:3000/v1/health/services
```

## Step 3: Run Event Router Service Validation
```bash
pnpm spec:test-event-router-service
pnpm spec:test-service-router-integration
pnpm --filter @mind/event-router-service run test:e2e-live-flow
```

## Step 4: Execute Live A2A Economic Flow
```bash
set -a; . ./.env; set +a
export DEMO_AUTO_APPROVE=true
export DEMO_EXECUTION_MODE=simulated
npx tsx scripts/demo_e2e_economic_rail.ts
```

## Step 5: Capture Governance Evidence
```bash
pnpm spec:runtime-metrics
pnpm spec:context-feedback
```

Check generated artifacts:
- `artifacts/e2e-live-flow-*/report.json`
- `artifacts/service-router-integration-*/report.json`
- `artifacts/runtime-metrics-*.json`
- `governance/spec_runtime/trigger_outcomes.jsonl`

## GO / NO_GO Gate
- GO:
  - ingress accepted
  - replay blocked
  - guardrail violations enforced
  - proof verification healthy
  - trigger outcomes persisted
- NO_GO:
  - repeated dispatch failures
  - circuit breaker open under normal load
  - missing proof evidence for critical chain
  - unresolved P0/P1 incident

## Rollback Procedure
1. Stop ingress service exposure (reverse proxy / load balancer route).
2. Keep core intent/proof services in safe mode.
3. Rotate `EVENT_ROUTER_SERVICE_TOKEN`.
4. Restore last known good guardrails file.
5. Re-run validation suite before reopening ingress.
