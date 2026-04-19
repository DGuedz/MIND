import { spawn } from "node:child_process";
import { setTimeout as wait } from "node:timers/promises";

const PORT = Number(process.env.EVENT_ROUTER_SERVICE_TEST_PORT ?? "3026");
const BASE_URL = `http://127.0.0.1:${PORT}`;
const TOKEN = "test-router-token";

type TestResult = {
  name: string;
  pass: boolean;
  details?: unknown;
};

const assertStatus = async (name: string, expected: number, response: Response): Promise<TestResult> => {
  const body = await response.text();
  return {
    name,
    pass: response.status === expected,
    details: { expected, got: response.status, body }
  };
};

async function waitForHealth(timeoutMs = 12000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(`${BASE_URL}/v1/health`);
      if (res.ok) return;
    } catch {
      // retry
    }
    await wait(250);
  }
  throw new Error("event_router_service health timeout");
}

async function main() {
  const child = spawn("pnpm", ["exec", "tsx", "scripts/event_router_service.ts"], {
    env: {
      ...process.env,
      EVENT_ROUTER_SERVICE_PORT: String(PORT),
      EVENT_ROUTER_SERVICE_HOST: "127.0.0.1",
      EVENT_ROUTER_SERVICE_TOKEN: TOKEN
    },
    stdio: ["ignore", "pipe", "pipe"]
  });

  child.stdout.on("data", (d) => process.stdout.write(`[router-service] ${d}`));
  child.stderr.on("data", (d) => process.stderr.write(`[router-service] ${d}`));

  const results: TestResult[] = [];
  try {
    await waitForHealth();

    const sampleIntentBlock = {
      source: "intent_service",
      domain: "intent",
      event_id: "evt_service_test_001",
      event_type: "intent.policy.checked",
      timestamp: "2026-04-06T12:40:00Z",
      agent_id: "mind_router",
      context: {
        intent_id: "int_service_001",
        decision: "BLOCK",
        proof_status: "pending",
        reason_codes: ["RC_POLICY_VIOLATION"]
      },
      policy: { severity: "high" }
    };

    const sampleMarketBreach = {
      source: "market_monitor",
      domain: "market",
      event_id: "evt_service_test_002",
      event_type: "market.runtime.signal",
      timestamp: "2026-04-06T12:41:00Z",
      agent_id: "mind_router",
      context: {
        intent_id: "int_service_002",
        slippage_bps: 120,
        latency_ms: 5000
      }
    };

    const unauthorized = await fetch(`${BASE_URL}/v1/events`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(sampleIntentBlock)
    });
    results.push(await assertStatus("unauthorized_request", 401, unauthorized));

    const accepted = await fetch(`${BASE_URL}/v1/events`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-event-router-token": TOKEN
      },
      body: JSON.stringify(sampleIntentBlock)
    });
    results.push(await assertStatus("accepted_event", 202, accepted));

    const replay = await fetch(`${BASE_URL}/v1/events`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-event-router-token": TOKEN
      },
      body: JSON.stringify(sampleIntentBlock)
    });
    results.push(await assertStatus("replay_rejected", 409, replay));

    const guardrailViolation = await fetch(`${BASE_URL}/v1/events`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-event-router-token": TOKEN
      },
      body: JSON.stringify(sampleMarketBreach)
    });
    results.push(await assertStatus("slippage_guardrail_violation", 422, guardrailViolation));
  } finally {
    child.kill("SIGTERM");
    await wait(250);
  }

  const failed = results.filter((r) => !r.pass);
  const output = {
    status: failed.length === 0 ? "pass" : "fail",
    total: results.length,
    failed: failed.length,
    results
  };
  console.log(JSON.stringify(output, null, 2));
  if (failed.length > 0) process.exit(1);
}

main().catch((error) => {
  console.error("[test_event_router_service] failed:", error instanceof Error ? error.message : String(error));
  process.exit(1);
});
