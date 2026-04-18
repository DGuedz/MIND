# Event Router Service

Dedicated ingress service for the MIND live policy runtime.

## Responsibilities
- Authenticate ingress (`x-event-router-token`)
- Enforce rate limit, replay protection, duplicate suppression
- Apply runtime guardrails (slippage/retry/proof timeout/anchor timeout)
- Open circuit breaker under failure pressure
- Dispatch accepted events to `scripts/event_router.ts`
- Persist ingress/outcome/security evidence logs

## Run
```bash
pnpm --filter @mind/event-router-service run dev
```

## Environment
Use [`router.env.example`](./router.env.example).

## Production Hardening Pack
- Env contract: [`router.env.example`](./router.env.example)
- Observability contract: [`observability_spec.md`](./observability_spec.md)
- Incident severity policy: [`incident_severity.yaml`](./incident_severity.yaml)
- Alerts policy: [`alerts_config.md`](./alerts_config.md)
- Live operations runbook: [`live_demo_runbook.md`](./live_demo_runbook.md)
- End-to-end live flow test: [`e2e_live_flow_test.ts`](./e2e_live_flow_test.ts)
- Deployment bundle:
  - Dockerfile: [`deploy/Dockerfile`](./deploy/Dockerfile)
  - Compose stack: [`deploy/docker-compose.yml`](./deploy/docker-compose.yml)
  - PM2 profile: [`deploy/pm2/ecosystem.config.cjs`](./deploy/pm2/ecosystem.config.cjs)
  - Systemd unit: [`deploy/systemd/mind-event-router.service`](./deploy/systemd/mind-event-router.service)
  - Nginx ingress: [`deploy/nginx/event-router.conf`](./deploy/nginx/event-router.conf)
