#!/usr/bin/env bash
set -euo pipefail

API_GATEWAY_URL="${API_GATEWAY_URL:-http://localhost:3000}"
SIGNER_SERVICE_URL="${SIGNER_SERVICE_URL:-http://localhost:3007}"

echo "health checks..."
curl -sS "${API_GATEWAY_URL}/v1/health/services"
curl -sS "${API_GATEWAY_URL}/v1/health/db"

echo "smoke tests..."
API_GATEWAY_URL="${API_GATEWAY_URL}" ./scripts/smoke_health_db.sh
SIGNER_SERVICE_URL="${SIGNER_SERVICE_URL}" ./scripts/smoke_signer.sh
API_GATEWAY_URL="${API_GATEWAY_URL}" ./scripts/smoke_hero_flow.sh
API_GATEWAY_URL="${API_GATEWAY_URL}" ./scripts/smoke_proof_bundle.sh
API_GATEWAY_URL="${API_GATEWAY_URL}" API_GATEWAY_API_KEY="${API_GATEWAY_API_KEY:-}" ./scripts/smoke_a2a.sh
API_GATEWAY_URL="${API_GATEWAY_URL}" SIGNER_SERVICE_URL="${SIGNER_SERVICE_URL}" ./scripts/smoke_all.sh

echo "release bundle ok"
