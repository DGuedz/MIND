#!/usr/bin/env bash
set -euo pipefail

APP_DIR="${APP_DIR:-/opt/mind}"
COMPOSE_FILE="services/event-router-service/deploy/docker-compose.yml"

required() {
  local name="$1"
  if [ -z "${!name:-}" ]; then
    echo "missing required env: $name" >&2
    exit 1
  fi
}

required DEPLOY_REF
required EVENT_ROUTER_SERVICE_TOKEN
required PUBLIC_API_HOST
required EVENT_ROUTER_IMAGE

if [ "${HERMES_PROFILE:-true}" = "true" ]; then
  required AUTH_JWKS_URL
  required AUTH_ISSUER
  required AUTH_AUDIENCE
  required HERMES_AUTH_IMAGE
  required HERMES_BACKEND_IMAGE
fi

cd "$APP_DIR"

if [ -n "${GHCR_READ_TOKEN:-}" ]; then
  printf '%s' "$GHCR_READ_TOKEN" | docker login ghcr.io -u "${GHCR_USERNAME:-}" --password-stdin >/dev/null
fi

export EVENT_ROUTER_SERVICE_TOKEN
export PUBLIC_API_HOST
export TRAEFIK_ACME_EMAIL="${TRAEFIK_ACME_EMAIL:-ops@mindprotocol.xyz}"
export EVENT_ROUTER_IMAGE
export AUTH_JWKS_URL="${AUTH_JWKS_URL:-}"
export AUTH_ISSUER="${AUTH_ISSUER:-}"
export AUTH_AUDIENCE="${AUTH_AUDIENCE:-}"
export HERMES_AUTH_IMAGE="${HERMES_AUTH_IMAGE:-}"
export HERMES_BACKEND_IMAGE="${HERMES_BACKEND_IMAGE:-}"

if [ "${HERMES_PROFILE:-true}" = "true" ]; then
  docker compose -f "$COMPOSE_FILE" --profile hermes pull
  docker compose -f "$COMPOSE_FILE" --profile hermes up -d --no-build
else
  docker compose -f "$COMPOSE_FILE" pull event-router-service traefik
  docker compose -f "$COMPOSE_FILE" up -d --no-build
fi

docker compose -f "$COMPOSE_FILE" ps
curl -fsS http://127.0.0.1:3016/v1/health >/dev/null
