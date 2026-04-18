# Event Router Deployment Pack

This directory contains production-oriented deployment assets for `@mind/event-router-service`.

## Files
- `Dockerfile`: container image build from monorepo root.
- `docker-compose.yml`: single-service stack with healthcheck and persistent logs.
- `pm2/ecosystem.config.cjs`: PM2 runtime profile for host deployment.
- `systemd/mind-event-router.service`: systemd unit for Linux host lifecycle.
- `nginx/event-router.conf`: reverse-proxy edge config for `/v1/health` and `/v1/events`.

## Quick Validate
From repo root:
```bash
pnpm spec:validate-deployment-pack
```

## Compose Run (local)
From this directory:
```bash
export EVENT_ROUTER_SERVICE_TOKEN=change-me
docker compose up -d --build
```

Verify:
```bash
curl -s http://127.0.0.1:3016/v1/health
```
