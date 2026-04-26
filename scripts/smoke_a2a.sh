#!/usr/bin/env bash
set -euo pipefail

API_GATEWAY_URL="${API_GATEWAY_URL:-http://localhost:3000}"
AUTH_HEADER="Authorization: Bearer dev_api_key_12345"

future_ts="$(node -e "const d=new Date(Date.now()+10*60*1000); process.stdout.write(d.toISOString())")"

echo "1. Creating Context..."
create_context="$(curl -sS -X POST "${API_GATEWAY_URL}/v1/a2a/contexts" \
  -H "${AUTH_HEADER}" \
  -H "content-type: application/json" \
  -d "{
    \"intentId\": \"intent_a2a_test\",
    \"initiatorAgentId\": \"agent_alpha\",
    \"counterpartyAgentId\": \"agent_beta\",
    \"expiresAt\": \"${future_ts}\"
  }")"

echo "${create_context}"

context_id="$(echo "${create_context}" | node -e "const fs=require('fs'); const d=JSON.parse(fs.readFileSync(0,'utf8')); process.stdout.write(d.contextId || '')")"
if [ -z "${context_id}" ]; then
  echo "a2a smoke failed: contextId missing" >&2
  exit 1
fi

echo "2. Creating Task..."
task="$(curl -sS -X POST "${API_GATEWAY_URL}/v1/a2a/contexts/${context_id}/tasks" \
  -H "${AUTH_HEADER}" \
  -H "content-type: application/json" \
  -d '{
    "executorAgentId": "agent_beta",
    "payload": { "offer": "swap" },
    "idempotencyKey": "task-test-1"
  }')"

echo "${task}"

task_id="$(echo "${task}" | node -e "const fs=require('fs'); const d=JSON.parse(fs.readFileSync(0,'utf8')); process.stdout.write(d.taskId || '')")"
if [ -z "${task_id}" ]; then
  echo "a2a smoke failed: taskId missing" >&2
  exit 1
fi

echo "3. Accepting Context..."
accept="$(curl -sS -X POST "${API_GATEWAY_URL}/v1/a2a/contexts/${context_id}/accept" \
  -H "${AUTH_HEADER}" \
  -H "content-type: application/json" \
  -d "{
    \"taskId\": \"${task_id}\",
    \"acceptedByAgentId\": \"agent_alpha\"
  }")"

echo "${accept}"

echo "4. Recording Billing Event..."
billing="$(curl -sS -X POST "${API_GATEWAY_URL}/v1/a2a/contexts/${context_id}/billing" \
  -H "${AUTH_HEADER}" \
  -H "content-type: application/json" \
  -d '{
    "eventType": "a2a.context.accepted",
    "units": 1,
    "metadata": { "source": "smoke" },
    "idempotencyKey": "bill-test-1"
  }')"

echo "${billing}"

echo "5. Fetching Timeline..."
timeline="$(curl -sS -H "${AUTH_HEADER}" "${API_GATEWAY_URL}/v1/a2a/contexts/${context_id}/timeline")"
echo "${timeline}"

echo "6. Checking Metrics..."
metrics="$(curl -sS -H "${AUTH_HEADER}" "${API_GATEWAY_URL}/v1/metrics/a2a")"
echo "${metrics}"

if ! echo "${metrics}" | grep -q '"contextsTotal"'; then
  echo "a2a smoke failed: metrics missing or incorrect format" >&2
  exit 1
fi

echo "a2a smoke ok"
