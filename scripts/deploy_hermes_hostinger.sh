#!/usr/bin/env bash
set -Eeuo pipefail

MODE="${1:---deploy}"
DEPLOY_DIR="${HERMES_DEPLOY_DIR:-/opt/mind/hermes}"
COMPOSE_FILE="services/hermes-backend/deploy/docker-compose.hostinger.yml"

required_env() {
  local name="$1"
  if [[ -z "${!name:-}" ]]; then
    echo "missing required env: ${name}" >&2
    exit 1
  fi
}

quote_env() {
  local value="${1:-}"
  printf "'%s'" "${value//\'/\'\\\'\'}"
}

ssh_target() {
  printf "%s@%s" "${HOSTINGER_VPS_USER}" "${HOSTINGER_VPS_HOST}"
}

build_ssh_args() {
  SSH_ARGS=()
  if [[ -n "${HOSTINGER_VPS_SSH_KEY_PATH:-}" ]]; then
    SSH_ARGS+=("-i" "${HOSTINGER_VPS_SSH_KEY_PATH}")
  fi
  SSH_ARGS+=("-o" "IdentitiesOnly=yes")
  SSH_ARGS+=("-o" "StrictHostKeyChecking=accept-new")
}

run_ssh() {
  local target
  target="$(ssh_target)"
  build_ssh_args
  ssh "${SSH_ARGS[@]}" "${target}" "$@"
}

copy_runtime_env() {
  {
    printf "PUBLIC_API_HOST=%s\n" "$(quote_env "${PUBLIC_API_HOST:-api.mindprotocol.xyz}")"
    printf "TRAEFIK_ACME_EMAIL=%s\n" "$(quote_env "${TRAEFIK_ACME_EMAIL:-ops@mindprotocol.xyz}")"
    printf "AUTH_JWKS_URL=%s\n" "$(quote_env "${AUTH_JWKS_URL}")"
    printf "AUTH_ISSUER=%s\n" "$(quote_env "${AUTH_ISSUER}")"
    printf "AUTH_AUDIENCE=%s\n" "$(quote_env "${AUTH_AUDIENCE}")"
    printf "HERMES_BACKEND_IMAGE=%s\n" "$(quote_env "${HERMES_BACKEND_IMAGE:-mind-hermes-backend:local}")"
    printf "HERMES_AUTH_IMAGE=%s\n" "$(quote_env "${HERMES_AUTH_IMAGE:-mind-hermes-auth:local}")"
  } | run_ssh "mkdir -p '${DEPLOY_DIR}' && umask 077 && cat > '${DEPLOY_DIR}/runtime.env'"
}

check_local() {
  required_env AUTH_JWKS_URL
  required_env AUTH_ISSUER
  required_env AUTH_AUDIENCE

  PUBLIC_API_HOST="${PUBLIC_API_HOST:-api.mindprotocol.xyz}" \
  TRAEFIK_ACME_EMAIL="${TRAEFIK_ACME_EMAIL:-ops@mindprotocol.xyz}" \
  AUTH_JWKS_URL="${AUTH_JWKS_URL}" \
  AUTH_ISSUER="${AUTH_ISSUER}" \
  AUTH_AUDIENCE="${AUTH_AUDIENCE}" \
  docker compose -f "${COMPOSE_FILE}" config >/tmp/mind-hermes-hostinger-compose.yml

  echo "decision=ALLOW"
  echo "evidence=compose_config_ok"
}

deploy_remote() {
  required_env HOSTINGER_VPS_HOST
  required_env HOSTINGER_VPS_USER
  required_env AUTH_JWKS_URL
  required_env AUTH_ISSUER
  required_env AUTH_AUDIENCE

  if [[ -n "${HOSTINGER_VPS_SSH_KEY_PATH:-}" && ! -f "${HOSTINGER_VPS_SSH_KEY_PATH}" ]]; then
    echo "missing SSH key file: ${HOSTINGER_VPS_SSH_KEY_PATH}" >&2
    exit 1
  fi

  local target
  target="$(ssh_target)"
  build_ssh_args

  ssh "${SSH_ARGS[@]}" "${target}" "mkdir -p '${DEPLOY_DIR}'"
  tar -czf - \
    package.json \
    pnpm-lock.yaml \
    pnpm-workspace.yaml \
    services/hermes-backend \
    services/hermes-auth \
    | ssh "${SSH_ARGS[@]}" "${target}" "tar -xzf - -C '${DEPLOY_DIR}'"

  copy_runtime_env

  run_ssh "cd '${DEPLOY_DIR}' && set -a && . ./runtime.env && set +a && docker compose -f '${COMPOSE_FILE}' config >/tmp/mind-hermes-compose.yml"
  run_ssh "cd '${DEPLOY_DIR}' && set -a && . ./runtime.env && set +a && docker compose -f '${COMPOSE_FILE}' up -d --build"
  run_ssh "cd '${DEPLOY_DIR}' && docker compose -f '${COMPOSE_FILE}' ps"
  run_ssh "docker exec mind-hermes-backend curl -fsS http://127.0.0.1:8001/hermes/health"

  if [[ "${SKIP_PUBLIC_HEALTH:-0}" != "1" ]]; then
    curl -fsS "https://${PUBLIC_API_HOST:-api.mindprotocol.xyz}/hermes/health"
  fi

  echo "decision=ALLOW"
  echo "evidence=hostinger_hermes_deployed"
}

case "${MODE}" in
  --check)
    check_local
    ;;
  --deploy)
    deploy_remote
    ;;
  *)
    echo "usage: $0 [--check|--deploy]" >&2
    exit 2
    ;;
esac
