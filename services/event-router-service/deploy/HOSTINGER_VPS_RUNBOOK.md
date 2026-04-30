# Hostinger VPS Runbook

## Decision

Use `api.mindprotocol.xyz` as the public VPS entrypoint.

- `mindprotocol.xyz`: Vercel frontend
- `www.mindprotocol.xyz`: Vercel redirect to apex
- `api.mindprotocol.xyz`: Hostinger VPS with Traefik

Traefik is managed by `services/event-router-service/deploy/docker-compose.yml`. It does not need to be pre-installed separately.

## Target Architecture

- Vercel hosts `apps/landingpage`.
- Hostinger VPS runs backend services with Docker Compose.
- Traefik terminates TLS and routes public API paths.
- GitHub Actions builds images, pushes to GHCR, and deploys by SSH.
- Trae remains the operator workstation for local edits and manual verification.

## Agent Card Status

`agent-cards/skills/hostinger/hostinger-vps-manager.json` is a capability descriptor for the MIND/MCP integration layer. It is not the autonomous executor in the current release path.

Current execution path:

- GitHub Actions builds and publishes images.
- GitHub Actions connects to the VPS by SSH.
- Docker Compose starts Traefik and backend services.

Future execution path:

- The Hostinger VPS Manager agent-card can be activated to operate Hostinger infrastructure through the Hostinger API.
- Possible future actions include VPS lifecycle operations, rebuilds, snapshots, DNS updates, and infrastructure status checks.
- This complements GitHub Actions. It does not need to replace the GHA deployment path.

## Management Metrics

Initial operational metrics after first deployment:

| Metric | Source | Target |
|---|---|---|
| Deploy lead time | GitHub Actions run duration, push to healthy | `< 5 min` |
| TLS renewal SLA | Traefik ACME logs | auto-renew before expiry window |
| Public API uptime | monitor `GET /v1/health` | `99.5%` initial |
| Unauth request rate | `401` count on `/hermes/events` | baseline plus anomaly detection |

Start with an external uptime monitor against:

```text
https://api.mindprotocol.xyz/v1/health
```

Public routes:

- `GET https://api.mindprotocol.xyz/v1/health`
- `POST https://api.mindprotocol.xyz/v1/events`
- `GET https://api.mindprotocol.xyz/hermes/health`
- `POST https://api.mindprotocol.xyz/hermes/events`

Internal routes:

- `hermes-auth:9000/verify`
- `hermes-backend:8001/hermes/events`
- `event-router-service:3016`

Do not expose `3016`, `8001`, or `9000` publicly.

## VPS Prerequisites

Install Docker on the Hostinger VPS:

```bash
sudo apt-get update
sudo apt-get install -y git curl ca-certificates
curl -fsSL https://get.docker.com | sudo sh
sudo usermod -aG docker "$USER"
```

Log out and back in after adding the user to the Docker group.

Verify:

```bash
docker version
docker compose version
```

Prepare the deployment directory. Replace `<deploy-user>` with the same user configured in `HOSTINGER_VPS_USER`:

```bash
sudo mkdir -p /opt/mind/releases
sudo chown -R <deploy-user>:<deploy-user> /opt/mind
```

Open inbound firewall ports:

- `80/tcp`: Let's Encrypt HTTP challenge and HTTP to HTTPS redirect
- `443/tcp`: public HTTPS API traffic

## Traefik Setup

Traefik is defined in `docker-compose.yml` with:

- entrypoint `web` on port `80`
- entrypoint `websecure` on port `443`
- HTTP to HTTPS redirect
- Let's Encrypt HTTP challenge
- ACME storage volume `traefik-letsencrypt`

Required runtime variables:

```bash
export PUBLIC_API_HOST=api.mindprotocol.xyz
export TRAEFIK_ACME_EMAIL=ops@mindprotocol.xyz
```

Traefik labels route:

- `/v1/health` to `event-router-service`
- `/v1/events` to `event-router-service`
- `/hermes/events` to `hermes-backend` through ForwardAuth

`hermes-auth` is internal ForwardAuth middleware. Do not expose `/verify` as a public API route.

## DNS On Hostinger

Create or update this DNS record:

```text
Type: A
Name: api
Value: <HOSTINGER_VPS_PUBLIC_IP>
TTL: 300
```

Keep the apex domain on Vercel:

```text
mindprotocol.xyz -> Vercel
www.mindprotocol.xyz -> Vercel redirect to apex
api.mindprotocol.xyz -> Hostinger VPS
```

Verify DNS:

```bash
dig +short api.mindprotocol.xyz
```

Expected result: the VPS public IP.

## GitHub Actions

Workflow:

```text
.github/workflows/vps-deploy.yml
```

It builds and pushes these GHCR images:

- `event-router-service`
- `hermes-auth`
- `hermes-backend`

It then SSHes into the VPS, writes `/opt/mind/runtime.env` with `0600` permissions, and runs:

```bash
bash /opt/mind/current/scripts/deploy_vps.sh
```

Configure these GitHub Actions secrets:

- `HOSTINGER_VPS_HOST`
- `HOSTINGER_VPS_USER`
- `HOSTINGER_VPS_SSH_KEY`
- `EVENT_ROUTER_SERVICE_TOKEN`
- `AUTH_JWKS_URL`
- `AUTH_ISSUER`
- `AUTH_AUDIENCE`
- `GHCR_USERNAME`
- `GHCR_READ_TOKEN` if GHCR packages are private

Configure these GitHub Actions variables:

- `PUBLIC_API_HOST=api.mindprotocol.xyz`
- `TRAEFIK_ACME_EMAIL=ops@mindprotocol.xyz`

### Deploy-Only SSH Key

Generate a dedicated key for GitHub Actions. Do not reuse a personal SSH key.

```bash
ssh-keygen -t ed25519 -C "mind-vps-deploy" -f ~/.ssh/mind_vps_deploy -N ""
cat ~/.ssh/mind_vps_deploy.pub
```

Add the public key to the VPS deploy user's `~/.ssh/authorized_keys`.

Recommended restrictions for the current workflow:

```text
no-agent-forwarding,no-port-forwarding,no-X11-forwarding ssh-ed25519 AAAA... mind-vps-deploy
```

If you want to restrict by GitHub Actions source CIDR, fetch the current ranges first:

```bash
curl -fsS https://api.github.com/meta | jq -r '.actions[]'
```

Then add `from="cidr1,cidr2,..."` before the options. GitHub Actions ranges can change; refresh periodically.

Do not use `command="..."` with the current workflow. The deploy flow uses both `scp` and multiple `ssh` commands, and `command=` would block file transfer. Only add `command=` after refactoring the workflow to avoid `scp`.

### Secret Setup With GitHub CLI

After `gh auth login`, set secrets and variables from Trae:

```bash
gh secret set HOSTINGER_VPS_HOST --body "<vps-ip-or-host>"
gh secret set HOSTINGER_VPS_USER --body "<deploy-user>"
gh secret set HOSTINGER_VPS_SSH_KEY < ~/.ssh/mind_vps_deploy
gh secret set EVENT_ROUTER_SERVICE_TOKEN --body "$(openssl rand -hex 32)"
gh secret set AUTH_JWKS_URL --body "https://<issuer>/.well-known/jwks.json"
gh secret set AUTH_ISSUER --body "https://<issuer>/"
gh secret set AUTH_AUDIENCE --body "mind-hermes-api"
gh secret set GHCR_USERNAME --body "<github-user>"
gh secret set GHCR_READ_TOKEN --body "<pat-with-read-packages>"

gh variable set PUBLIC_API_HOST --body "api.mindprotocol.xyz"
gh variable set TRAEFIK_ACME_EMAIL --body "ops@mindprotocol.xyz"
```

`HOSTINGER_VPS_SSH_KEY` must contain the full private key, including:

```text
-----BEGIN OPENSSH PRIVATE KEY-----
...
-----END OPENSSH PRIVATE KEY-----
```

Using `gh secret set HOSTINGER_VPS_SSH_KEY < ~/.ssh/mind_vps_deploy` preserves multiline formatting and the final newline.

Confirm configuration:

```bash
gh secret list
gh variable list
```

Manual deploy:

```text
GitHub -> Actions -> Deploy MIND VPS -> Run workflow
```

## Manual Deploy From Trae

Use this only after images exist in GHCR:

```bash
ssh <user>@<host>
cd /opt/mind/current

export EVENT_ROUTER_SERVICE_TOKEN=<redacted>
export PUBLIC_API_HOST=api.mindprotocol.xyz
export TRAEFIK_ACME_EMAIL=ops@mindprotocol.xyz
export EVENT_ROUTER_IMAGE=<ghcr-event-router-image>
export AUTH_JWKS_URL=<redacted>
export AUTH_ISSUER=<redacted>
export AUTH_AUDIENCE=<redacted>
export HERMES_AUTH_IMAGE=<ghcr-hermes-auth-image>
export HERMES_BACKEND_IMAGE=<ghcr-hermes-backend-image>

docker compose -f services/event-router-service/deploy/docker-compose.yml --profile hermes pull
docker compose -f services/event-router-service/deploy/docker-compose.yml --profile hermes up -d --no-build
```

Verify locally on VPS:

```bash
curl -fsS http://127.0.0.1:3016/v1/health
docker compose -f services/event-router-service/deploy/docker-compose.yml ps
```

Verify public edge:

```bash
curl -fsS https://api.mindprotocol.xyz/v1/health
curl -i -X POST https://api.mindprotocol.xyz/hermes/events \
  -H "content-type: application/json" \
  -d '{"eventType":"hermes.test","eventId":"evt-hermes-1","payload":{}}'
```

Expected Hermes result without JWT: `401`.

## Hermes-Only Hostinger Runtime

For a dedicated 24/7 Hermes VPS runtime, use:

```bash
pnpm validate:hermes:hostinger
pnpm deploy:hermes:hostinger
```

Required local environment:

```bash
export HOSTINGER_VPS_HOST=<vps-ip-or-host>
export HOSTINGER_VPS_USER=<deploy-user>
export HOSTINGER_VPS_SSH_KEY_PATH=~/.ssh/mind_vps_deploy
export AUTH_JWKS_URL=https://<issuer>/.well-known/jwks.json
export AUTH_ISSUER=https://<issuer>/
export AUTH_AUDIENCE=mind-hermes-api
export PUBLIC_API_HOST=api.mindprotocol.xyz
```

The deploy script writes `/opt/mind/hermes/runtime.env` with `0600` permissions on the VPS and does not copy local `.env` files.

Evidence gates:

```bash
docker compose -f services/hermes-backend/deploy/docker-compose.hostinger.yml ps
curl -fsS https://api.mindprotocol.xyz/hermes/health
curl -i -X POST -H "content-type: application/json" -d '{}' https://api.mindprotocol.xyz/hermes/events
```

Expected unauthenticated event result: `401`.

## Vercel Integration

Set production env vars:

```bash
echo "https://api.mindprotocol.xyz/hermes/events" | vercel env add VITE_HERMES_BACKEND_URL production --scope dgs-projects-ac3c4a7c
echo "https://api.mindprotocol.xyz" | vercel env add VITE_HERMES_AUTH_URL production --scope dgs-projects-ac3c4a7c
```

The landing app rewrites:

```text
/v1/* -> https://api.mindprotocol.xyz/v1/*
```

After changing Vercel env vars, redeploy the landing page.

## Troubleshooting

Check Traefik logs:

```bash
docker logs mind-traefik --tail=200
```

Check service logs:

```bash
docker logs mind-event-router-service --tail=200
docker logs mind-hermes-auth --tail=200
docker logs mind-hermes-backend --tail=200
```

Check compose state:

```bash
docker compose -f services/event-router-service/deploy/docker-compose.yml --profile hermes ps
```

If TLS fails:

```bash
dig +short api.mindprotocol.xyz
sudo ss -tulpn | grep -E ':80|:443'
docker logs mind-traefik --tail=200 | grep -i acme
```

If GHCR pull fails:

```bash
docker login ghcr.io
docker pull <image>
```

If public health fails but local health works, check:

- DNS points to the VPS IP.
- Ports `80` and `443` are open.
- `PUBLIC_API_HOST=api.mindprotocol.xyz` is present in `/opt/mind/runtime.env`.
- Traefik labels are loaded in `docker compose config`.

## Definition Of Done

- `dig +short api.mindprotocol.xyz` returns VPS IP.
- GitHub workflow completes.
- `docker compose ps` shows Traefik and MIND services healthy/running.
- `https://api.mindprotocol.xyz/v1/health` returns success.
- `https://api.mindprotocol.xyz/hermes/events` denies unauthenticated requests with `401`.
- Vercel production uses `VITE_HERMES_BACKEND_URL=https://api.mindprotocol.xyz/hermes/events`.
