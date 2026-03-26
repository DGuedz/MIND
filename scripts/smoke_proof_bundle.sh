#!/usr/bin/env bash
set -euo pipefail

API_GATEWAY_URL="${API_GATEWAY_URL:-http://localhost:3000}"

expiry_ts="$(node -e "process.stdout.write(new Date(Date.now() + 10 * 60 * 1000).toISOString())")"
execution_expires_at="$(node -e "process.stdout.write(new Date(Date.now() + 15 * 60 * 1000).toISOString())")"

payload="$(cat <<JSON
{
  "agent": {
    "name": "Scan Agent",
    "role": "scan",
    "wallet": "So1anaWallet111111111111111111111111111111111",
    "capabilities": ["scan", "signal"],
    "status": "active"
  },
  "intent": {
    "creatorAgentId": "agent_scan_001",
    "asset": "SOL",
    "action": "buy",
    "amount": "0.5",
    "confidence": 0.82,
    "riskScore": 0.35,
    "expiryTs": "${expiry_ts}",
    "policyId": "policy_v1"
  },
  "marketContext": {
    "source": "covalent",
    "payload": {
      "asset": "SOL",
      "timeframe": "1h"
    }
  },
  "approval": {
    "channel": "telegram",
    "requesterId": "123456789"
  },
  "execution": {
    "mode": "simulated",
    "amount": "0.5",
    "maxSlippageBps": 50,
    "expiresAt": "${execution_expires_at}"
  }
}
JSON
)"

hero_response="$(curl -sS -X POST "${API_GATEWAY_URL}/v1/hero-flow/run" -H "content-type: application/json" -d "${payload}")"

echo "${hero_response}"

proof_id="$(echo "${hero_response}" | node -e "const fs=require('fs'); const d=JSON.parse(fs.readFileSync(0,'utf8')); process.stdout.write(d.proofId || '')")"

if [ -z "${proof_id}" ]; then
  echo "bundle smoke test failed: proofId not found" >&2
  exit 1
fi

bundle_response="$(curl -sS "${API_GATEWAY_URL}/v1/proofs/${proof_id}/bundle")"
echo "${bundle_response}"

if ! echo "${bundle_response}" | grep -q '"proof"'; then
  echo "bundle smoke test failed: proof missing" >&2
  exit 1
fi

if ! echo "${bundle_response}" | grep -q '"anchors"'; then
  echo "bundle smoke test failed: anchors missing" >&2
  exit 1
fi

if ! echo "${bundle_response}" | grep -q '"events"'; then
  echo "bundle smoke test failed: events missing" >&2
  exit 1
fi

echo "bundle smoke test ok"
