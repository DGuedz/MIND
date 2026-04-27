#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "${ROOT_DIR}"

TS="$(date -u +"%Y-%m-%dT%H-%M-%SZ")"
ARTIFACT_DIR="${ROOT_DIR}/artifacts/install-and-test-${TS}"
mkdir -p "${ARTIFACT_DIR}"

API_GATEWAY_URL="${API_GATEWAY_URL:-http://localhost:3000}"
PROOF_SERVICE_URL="${PROOF_SERVICE_URL:-http://localhost:3005}"
SIGNER_SERVICE_URL="${SIGNER_SERVICE_URL:-http://localhost:3007}"
MOCK_PORT="${METAPLEX_PROOF_MOCK_PORT:-3015}"
MOCK_AUTH="${METAPLEX_PROOF_AUTH:-local-dev-token}"
MOCK_ENDPOINT="${METAPLEX_PROOF_ENDPOINT:-http://localhost:${MOCK_PORT}/v1/proofs/anchor}"

SERVICES_PID=""
MOCK_PID=""
FAILURES=0

status_openclaw_doctor="not_run"
status_install="not_run"
status_openclaw_upgrade_validation="not_run"
status_health="not_run"
status_mock_auth_guard="not_run"
status_gate_negative="not_run"
status_gate_positive="not_run"
status_demo_positive="not_run"
status_bundle_schema="not_run"
status_smoke_health_db="not_run"
status_smoke_a2a="not_run"
status_smoke_proof_bundle="not_run"

negative_gate_report=""
positive_gate_report=""
demo_output_json="${ARTIFACT_DIR}/demo_output.json"
openclaw_doctor_log="${ARTIFACT_DIR}/00_openclaw_doctor.log"
preflight_json="${ARTIFACT_DIR}/00_preflight.json"

log() {
  printf "[install-test][%s] %s\n" "$(date -u +"%Y-%m-%dT%H:%M:%SZ")" "$*"
}

write_report_and_exit() {
  local overall="$1"
  local failures="$2"
  REPORT_PATH="${ARTIFACT_DIR}/install_and_test_report.json"
  cat > "${REPORT_PATH}" <<JSON
{
  "reportType": "strict_stack_install_and_test",
  "timestamp": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  "overall": "${overall}",
  "rootDir": "${ROOT_DIR}",
  "artifactsDir": "${ARTIFACT_DIR}",
  "services": {
    "apiGatewayUrl": "${API_GATEWAY_URL}",
    "proofServiceUrl": "${PROOF_SERVICE_URL}",
    "signerServiceUrl": "${SIGNER_SERVICE_URL}",
    "strictRuntimeEnabled": true
  },
  "metaplex": {
    "mockEndpoint": "${MOCK_ENDPOINT}",
    "mockAuthConfigured": true
  },
  "steps": [
    { "id": "microtask-00", "name": "openclaw_doctor_fix", "status": "${status_openclaw_doctor}" },
    { "id": "microtask-01", "name": "install_dependencies", "status": "${status_install}" },
    { "id": "microtask-01b", "name": "openclaw_upgrade_validation", "status": "${status_openclaw_upgrade_validation}" },
    { "id": "microtask-02", "name": "services_health", "status": "${status_health}" },
    { "id": "microtask-03", "name": "mock_auth_guard", "status": "${status_mock_auth_guard}" },
    { "id": "microtask-04", "name": "gate_negative_no_endpoint_auth", "status": "${status_gate_negative}" },
    { "id": "microtask-05", "name": "gate_positive_with_mock", "status": "${status_gate_positive}" },
    { "id": "microtask-06", "name": "demo_positive_external_confirmed", "status": "${status_demo_positive}" },
    { "id": "microtask-07", "name": "bundle_internal_external_schema", "status": "${status_bundle_schema}" },
    { "id": "microtask-08a", "name": "smoke_health_db", "status": "${status_smoke_health_db}" },
    { "id": "microtask-08b", "name": "smoke_a2a", "status": "${status_smoke_a2a}" },
    { "id": "microtask-08c", "name": "smoke_proof_bundle", "status": "${status_smoke_proof_bundle}" }
  ],
  "evidence": {
    "preflight": "${preflight_json}",
    "openclawDoctorLog": "${openclaw_doctor_log}",
    "openclawUpgradeValidationLog": "${ARTIFACT_DIR}/01b_openclaw_upgrade_validation.log",
    "negativeGateReport": "${negative_gate_report}",
    "positiveGateReport": "${positive_gate_report}",
    "demoOutputJson": "${demo_output_json}",
    "bundleSnapshot": "${ARTIFACT_DIR}/07_bundle.json",
    "logsDir": "${ARTIFACT_DIR}"
  },
  "failures": ${failures}
}
JSON

  log "report=${REPORT_PATH}"
  cat "${REPORT_PATH}"
  if [ "${overall}" != "PASS" ]; then
    exit 1
  fi
  exit 0
}

cleanup() {
  log "cleanup: stopping local processes"
  bash scripts/performance_mode.sh > "${ARTIFACT_DIR}/cleanup.log" 2>&1 || true
}
trap cleanup EXIT

NODE_VERSION="$(node -v 2>/dev/null || echo unknown)"
PNPM_VERSION="$(pnpm -v 2>/dev/null || echo unknown)"
PNPM_STORE_PATH="$(pnpm store path 2>/dev/null || echo unknown)"

ICLOUD_DETECTED=false
case "${ROOT_DIR}" in
  *"Mobile Documents"*|*"com~apple~CloudDocs"*) ICLOUD_DETECTED=true ;;
esac

cat > "${preflight_json}" <<JSON
{
  "timestamp": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  "rootDir": "${ROOT_DIR}",
  "node": "${NODE_VERSION}",
  "pnpm": "${PNPM_VERSION}",
  "pnpmStorePath": "${PNPM_STORE_PATH}",
  "iCloudWorktreeDetected": ${ICLOUD_DETECTED},
  "blocked": false,
  "blockReason": null
}
JSON

if [ "${ICLOUD_DETECTED}" = "true" ] && [ "${ALLOW_ICLOUD_WORKTREE:-false}" != "true" ]; then
  status_openclaw_doctor="blocked"
  status_install="blocked"
  status_openclaw_upgrade_validation="blocked"
  status_health="blocked"
  status_mock_auth_guard="blocked"
  status_gate_negative="blocked"
  status_gate_positive="blocked"
  status_demo_positive="blocked"
  status_bundle_schema="blocked"
  status_smoke_health_db="blocked"
  status_smoke_a2a="blocked"
  status_smoke_proof_bundle="blocked"
  FAILURES=1
  cat > "${preflight_json}" <<JSON
{
  "timestamp": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  "rootDir": "${ROOT_DIR}",
  "node": "${NODE_VERSION}",
  "pnpm": "${PNPM_VERSION}",
  "pnpmStorePath": "${PNPM_STORE_PATH}",
  "iCloudWorktreeDetected": ${ICLOUD_DETECTED},
  "blocked": true,
  "blockReason": "iCloud worktree detected; refuse to run pnpm install due to hang/non-deterministic filesystem risk. Move repo to a non-synced path or set ALLOW_ICLOUD_WORKTREE=true to override."
}
JSON
  log "preflight: blocked (iCloud worktree). Set ALLOW_ICLOUD_WORKTREE=true to override." 
  write_report_and_exit "FAIL" "${FAILURES}"
fi

mark_fail() {
  FAILURES=$((FAILURES + 1))
}

run_expect_success() {
  local step="$1"
  local log_file="$2"
  shift 2
  log "step=${step} action=start"
  if "$@" > "${log_file}" 2>&1; then
    log "step=${step} action=ok"
    return 0
  fi
  log "step=${step} action=fail log=${log_file}"
  mark_fail
  return 1
}

run_expect_failure() {
  local step="$1"
  local log_file="$2"
  shift 2
  log "step=${step} action=start (expect_failure)"
  if "$@" > "${log_file}" 2>&1; then
    log "step=${step} action=unexpected_success log=${log_file}"
    mark_fail
    return 1
  fi
  log "step=${step} action=expected_failure"
  return 0
}

latest_gate_report() {
  ls -1t artifacts/strict-mode-go-no-go-*.json 2>/dev/null | head -n 1 || true
}

wait_for_services() {
  local timeout_sec=90
  local end=$((SECONDS + timeout_sec))
  while (( SECONDS < end )); do
    if curl -fsS "${API_GATEWAY_URL}/v1/health/services" > "${ARTIFACT_DIR}/health_services.json" 2>/dev/null; then
      if jq -e '.status=="ok" and (.services | all(.status=="ok"))' "${ARTIFACT_DIR}/health_services.json" >/dev/null 2>&1; then
        return 0
      fi
    fi
    sleep 2
  done
  return 1
}

extract_demo_json() {
  local input_file="$1"
  local output_file="$2"
  node - "${input_file}" "${output_file}" <<'NODE'
const fs = require("fs");
const [inputFile, outputFile] = process.argv.slice(2);
const raw = fs.readFileSync(inputFile, "utf8").trim();
const idx = raw.lastIndexOf("\n{");
const candidate = idx >= 0 ? raw.slice(idx + 1).trim() : raw;
const parsed = JSON.parse(candidate);
fs.writeFileSync(outputFile, JSON.stringify(parsed, null, 2));
NODE
}

log "microtask-00: openclaw doctor preflight"
if command -v openclaw >/dev/null 2>&1; then
  if run_expect_success "openclaw_doctor_fix" "${openclaw_doctor_log}" openclaw doctor --fix; then
    status_openclaw_doctor="pass"
  else
    status_openclaw_doctor="fail"
  fi
else
  if [ "${OPENCLAW_DOCTOR_REQUIRED:-false}" = "true" ]; then
    echo "openclaw CLI not found and OPENCLAW_DOCTOR_REQUIRED=true" > "${openclaw_doctor_log}"
    status_openclaw_doctor="fail"
    mark_fail
  else
    echo "openclaw CLI not found; preflight skipped." > "${openclaw_doctor_log}"
    status_openclaw_doctor="skipped"
    log "openclaw doctor skipped (CLI unavailable)"
  fi
fi

log "microtask-01: install dependencies"
if run_expect_success "install_dependencies" "${ARTIFACT_DIR}/01_install.log" env CI=true pnpm install --frozen-lockfile --reporter=append-only; then
  status_install="pass"
else
  status_install="fail"
fi

log "microtask-01b: validate openclaw runtime hardening"
if [ "${status_install}" = "pass" ]; then
  if run_expect_success "openclaw_upgrade_validation" "${ARTIFACT_DIR}/01b_openclaw_upgrade_validation.log" pnpm validate:openclaw-upgrade; then
    status_openclaw_upgrade_validation="pass"
  else
    status_openclaw_upgrade_validation="fail"
  fi
else
  status_openclaw_upgrade_validation="blocked"
fi

log "microtask-02: start services with strict runtime enabled"
if [ "${status_install}" = "pass" ] && [ "${status_openclaw_upgrade_validation}" = "pass" ]; then
  (
    set -a
    . ./.env
    set +a
    export STRICT_METAPLEX_ANCHOR=true
    pnpm dev:services
  ) > "${ARTIFACT_DIR}/02_services.log" 2>&1 &
  SERVICES_PID=$!
  sleep 2
  if wait_for_services; then
    status_health="pass"
    log "services ready pid=${SERVICES_PID}"
  else
    status_health="fail"
    mark_fail
    log "services failed to become healthy"
  fi
else
  status_health="blocked"
fi

log "microtask-03: start metaplex proof mock and validate auth guard"
if [ "${status_health}" = "pass" ]; then
  (
    METAPLEX_PROOF_AUTH="${MOCK_AUTH}" METAPLEX_PROOF_MOCK_PORT="${MOCK_PORT}" pnpm dev:metaplex-proof-mock
  ) > "${ARTIFACT_DIR}/03_mock.log" 2>&1 &
  MOCK_PID=$!
  sleep 2
  if curl -sS -o "${ARTIFACT_DIR}/03_mock_unauth.json" -w "%{http_code}" \
    -X POST "${MOCK_ENDPOINT}" \
    -H "content-type: application/json" \
    -d '{"intentId":"auth-check"}' | grep -q "^401$"; then
    status_mock_auth_guard="pass"
  else
    status_mock_auth_guard="fail"
    mark_fail
  fi
else
  status_mock_auth_guard="blocked"
fi

log "microtask-04: validate gate NO_GO when endpoint/auth are missing"
if [ "${status_health}" = "pass" ]; then
  before_report="$(latest_gate_report)"
  if run_expect_failure "gate_negative" "${ARTIFACT_DIR}/04_gate_negative.log" env -u METAPLEX_PROOF_ENDPOINT -u METAPLEX_PROOF_AUTH pnpm validate:strict-go-no-go; then
    after_report="$(latest_gate_report)"
    negative_gate_report="${after_report}"
    if [ -n "${negative_gate_report}" ] && [ "${negative_gate_report}" != "${before_report}" ] && jq -e '.decision=="NO_GO"' "${negative_gate_report}" >/dev/null; then
      status_gate_negative="pass"
    else
      status_gate_negative="fail"
      mark_fail
    fi
  else
    status_gate_negative="fail"
  fi
else
  status_gate_negative="blocked"
fi

log "microtask-05: validate gate GO with mock endpoint/auth"
if [ "${status_health}" = "pass" ] && [ "${status_mock_auth_guard}" = "pass" ]; then
  before_report="$(latest_gate_report)"
  if run_expect_success "gate_positive" "${ARTIFACT_DIR}/05_gate_positive.log" env METAPLEX_PROOF_ENDPOINT="${MOCK_ENDPOINT}" METAPLEX_PROOF_AUTH="${MOCK_AUTH}" pnpm validate:strict-go-no-go; then
    after_report="$(latest_gate_report)"
    positive_gate_report="${after_report}"
    if [ -n "${positive_gate_report}" ] && [ "${positive_gate_report}" != "${before_report}" ] && jq -e '.decision=="GO"' "${positive_gate_report}" >/dev/null; then
      status_gate_positive="pass"
    else
      status_gate_positive="fail"
      mark_fail
    fi
  else
    status_gate_positive="fail"
  fi
else
  status_gate_positive="blocked"
fi

log "microtask-06: execute demo and assert strict visibility + external proof fields"
if [ "${status_health}" = "pass" ]; then
  if run_expect_success "demo_positive" "${ARTIFACT_DIR}/06_demo.log" env METAPLEX_PROOF_ENDPOINT="${MOCK_ENDPOINT}" METAPLEX_PROOF_AUTH="${MOCK_AUTH}" npx tsx scripts/demo_a2a_value_flow.ts; then
    if extract_demo_json "${ARTIFACT_DIR}/06_demo.log" "${demo_output_json}" && \
      jq -e '.proofVerified == true and .strictModeEffective == true and .externalAnchorStatus == "confirmed" and (.metaplexProofTx != null)' "${demo_output_json}" >/dev/null; then
      status_demo_positive="pass"
    else
      status_demo_positive="fail"
      mark_fail
    fi
  else
    status_demo_positive="fail"
  fi
else
  status_demo_positive="blocked"
fi

log "microtask-07: validate proof bundle internalProof/externalProof schema"
if [ "${status_gate_positive}" = "pass" ] && [ -n "${positive_gate_report}" ]; then
  proof_id="$(jq -r '.checks.strictBehavior.confirmedCheck.proofId // empty' "${positive_gate_report}")"
  if [ -n "${proof_id}" ] && curl -fsS "${API_GATEWAY_URL}/v1/proofs/${proof_id}/bundle" > "${ARTIFACT_DIR}/07_bundle.json"; then
    if jq -e '.internalProof.proofId != null and .externalProof.externalAnchorStatus != null and .externalProof.metaplexProofTx != null' "${ARTIFACT_DIR}/07_bundle.json" >/dev/null; then
      status_bundle_schema="pass"
    else
      status_bundle_schema="fail"
      mark_fail
    fi
  else
    status_bundle_schema="fail"
    mark_fail
  fi
else
  status_bundle_schema="blocked"
fi

log "microtask-08: run smoke tests for current stack"
if [ "${status_health}" = "pass" ]; then
  if run_expect_success "smoke_health_db" "${ARTIFACT_DIR}/08_smoke_health_db.log" env API_GATEWAY_URL="${API_GATEWAY_URL}" ./scripts/smoke_health_db.sh; then
    status_smoke_health_db="pass"
  else
    status_smoke_health_db="fail"
  fi

  if run_expect_success "smoke_a2a" "${ARTIFACT_DIR}/08_smoke_a2a.log" env API_GATEWAY_URL="${API_GATEWAY_URL}" ./scripts/smoke_a2a.sh; then
    status_smoke_a2a="pass"
  else
    status_smoke_a2a="fail"
  fi

  if run_expect_success "smoke_proof_bundle" "${ARTIFACT_DIR}/08_smoke_proof_bundle.log" env API_GATEWAY_URL="${API_GATEWAY_URL}" ./scripts/smoke_proof_bundle.sh; then
    status_smoke_proof_bundle="pass"
  else
    status_smoke_proof_bundle="fail"
  fi
else
  status_smoke_health_db="blocked"
  status_smoke_a2a="blocked"
  status_smoke_proof_bundle="blocked"
fi

overall="PASS"
if [ "${FAILURES}" -gt 0 ]; then
  overall="FAIL"
fi

write_report_and_exit "${overall}" "${FAILURES}"
