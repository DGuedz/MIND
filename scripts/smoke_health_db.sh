#!/usr/bin/env bash
set -euo pipefail

API_GATEWAY_URL="${API_GATEWAY_URL:-http://localhost:3000}"

response="$(curl -sS "${API_GATEWAY_URL}/v1/health/db")"
echo "${response}"

if ! echo "${response}" | grep -q '"status":"ok"'; then
  echo "db health failed" >&2
  exit 1
fi

if echo "${response}" | grep -q '"status":"error"'; then
  echo "db health failed: one or more services unhealthy" >&2
  exit 1
fi

echo "db health ok"
