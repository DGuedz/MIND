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

## Traefik Edge Route
This compose stack includes Traefik as edge ingress with automatic TLS on `PUBLIC_API_HOST`.

1. Set public host:
```bash
export PUBLIC_API_HOST=api.mindprotocol.xyz
export TRAEFIK_ACME_EMAIL=ops@mindprotocol.xyz
```
2. Start stack:
```bash
export EVENT_ROUTER_SERVICE_TOKEN=change-me
docker compose up -d --build
```
3. Test health route via Traefik:
```bash
curl -s https://api.mindprotocol.xyz/v1/health
```
4. Test event ingress (POST only):
```bash
curl -i -X POST \
  -H "x-event-router-token: ${EVENT_ROUTER_SERVICE_TOKEN}" \
  -H "content-type: application/json" \
  -d '{"eventType":"smoke.test","eventId":"evt-1","payload":{}}' \
  https://api.mindprotocol.xyz/v1/events
```

The Traefik dashboard is enabled but not exposed through an insecure public port.

## Hermes Behind Traefik (JWT via ForwardAuth)
This stack supports a dedicated `hermes-backend` protected by JWT/OIDC validation at the edge.

Required env vars:
```bash
export EVENT_ROUTER_SERVICE_TOKEN=change-me
export AUTH_JWKS_URL=https://idp.example.com/.well-known/jwks.json
export AUTH_ISSUER=https://idp.example.com/
export AUTH_AUDIENCE=mind-hermes-api
```

Bring up:
```bash
docker compose --profile hermes up -d --build
```

Expected behavior:
- `POST /hermes/events` without Bearer token -> denied by `hermes-auth` (`401/403`)
- `POST /hermes/events` with valid JWT (issuer/audience match) -> forwarded to `hermes-backend:8001`

Smoke test (no token, should fail):
```bash
curl -i -X POST \
  -H "content-type: application/json" \
  -d '{"eventType":"hermes.test","eventId":"evt-hermes-1","payload":{}}' \
  https://api.mindprotocol.xyz/hermes/events
```
