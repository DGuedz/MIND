#!/usr/bin/env bash
set -euo pipefail

API_GATEWAY_URL="${API_GATEWAY_URL:-http://localhost:3000}"
SIGNER_SERVICE_URL="${SIGNER_SERVICE_URL:-http://localhost:3007}"

echo "running db health..."
API_GATEWAY_URL="${API_GATEWAY_URL}" ./scripts/smoke_health_db.sh

echo "running signer test..."
SIGNER_SERVICE_URL="${SIGNER_SERVICE_URL}" ./scripts/smoke_signer.sh

echo "running hero flow..."
API_GATEWAY_URL="${API_GATEWAY_URL}" ./scripts/smoke_hero_flow.sh

echo "running a2a..."
API_GATEWAY_URL="${API_GATEWAY_URL}" ./scripts/smoke_a2a.sh

echo "running proof bundle..."
API_GATEWAY_URL="${API_GATEWAY_URL}" ./scripts/smoke_proof_bundle.sh

echo "running a2a flow..."
API_GATEWAY_URL="${API_GATEWAY_URL}" API_GATEWAY_API_KEY="${API_GATEWAY_API_KEY:-}" ./scripts/smoke_a2a.sh

echo "all smoke tests ok"
