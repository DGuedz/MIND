#!/usr/bin/env bash
set -euo pipefail

SIGNER_SERVICE_URL="${SIGNER_SERVICE_URL:-http://localhost:3007}"

response="$(curl -sS -X POST "${SIGNER_SERVICE_URL}/v1/sign" -H "content-type: application/json" -d '{
  "payload": {
    "intentId": "intent_test",
    "executionId": "exec_test",
    "amount": "1.0"
  },
  "context": {
    "mode": "real"
  }
}')"

echo "${response}"

if ! echo "${response}" | grep -q '"signature"'; then
  echo "signer smoke test failed: signature missing" >&2
  exit 1
fi

if ! echo "${response}" | grep -q '"bodyHash"'; then
  echo "signer smoke test failed: bodyHash missing" >&2
  exit 1
fi

echo "signer smoke test ok"
