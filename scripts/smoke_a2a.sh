#!/usr/bin/env bash
set -euo pipefail

API_GATEWAY_URL="${API_GATEWAY_URL:-http://localhost:3000}"

future_ts="$(node -e "const d=new Date(Date.now()+10*60*1000); process.stdout.write(d.toISOString())")"

create_session="$(curl -sS -X POST "${API_GATEWAY_URL}/v1/a2a/sessions" -H "content-type: application/json" -d "{
  \"intentId\": \"intent_a2a_test\",
  \"initiatorAgentId\": \"agent_alpha\",
  \"counterpartyAgentId\": \"agent_beta\",
  \"expiresAt\": \"${future_ts}\"
}")"

echo "${create_session}"

session_id="$(echo "${create_session}" | node -e "const fs=require('fs'); const d=JSON.parse(fs.readFileSync(0,'utf8')); process.stdout.write(d.sessionId || '')")"
if [ -z "${session_id}" ]; then
  echo "a2a smoke failed: sessionId missing" >&2
  exit 1
fi

proposal="$(curl -sS -X POST "${API_GATEWAY_URL}/v1/a2a/sessions/${session_id}/proposals" -H "content-type: application/json" -d '{
  "proposerAgentId": "agent_beta",
  "payload": { "offer": "swap" },
  "idempotencyKey": "proposal-test-1"
}')"

echo "${proposal}"

proposal_id="$(echo "${proposal}" | node -e "const fs=require('fs'); const d=JSON.parse(fs.readFileSync(0,'utf8')); process.stdout.write(d.proposalId || '')")"
if [ -z "${proposal_id}" ]; then
  echo "a2a smoke failed: proposalId missing" >&2
  exit 1
fi

accept="$(curl -sS -X POST "${API_GATEWAY_URL}/v1/a2a/sessions/${session_id}/accept" -H "content-type: application/json" -d "{
  \"proposalId\": \"${proposal_id}\",
  \"acceptedByAgentId\": \"agent_alpha\"
}")"

echo "${accept}"

billing="$(curl -sS -X POST "${API_GATEWAY_URL}/v1/a2a/sessions/${session_id}/billing" -H "content-type: application/json" -d '{
  "eventType": "a2a.session.accepted",
  "units": 1,
  "metadata": { "source": "smoke" },
  "idempotencyKey": "bill-test-1"
}')"

echo "${billing}"

timeline="$(curl -sS "${API_GATEWAY_URL}/v1/a2a/sessions/${session_id}/timeline")"
echo "${timeline}"

metrics="$(curl -sS "${API_GATEWAY_URL}/v1/metrics/a2a")"
echo "${metrics}"

if ! echo "${metrics}" | grep -q '"sessionsTotal"'; then
  echo "a2a smoke failed: metrics missing" >&2
  exit 1
fi

echo "a2a smoke ok"
