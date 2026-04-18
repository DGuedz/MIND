import { spawn } from "node:child_process";
import fs from "node:fs/promises";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { setTimeout as wait } from "node:timers/promises";

type TestResult = {
  name: string;
  pass: boolean;
  details?: unknown;
};

type JsonRecord = Record<string, unknown>;

const nowStamp = () => new Date().toISOString().replace(/[:.]/g, "-");

const findRepoRoot = (startDir: string): string => {
  let current = path.resolve(startDir);
  while (true) {
    const pkgPath = path.join(current, "package.json");
    if (existsSync(pkgPath)) {
      try {
        const parsed = JSON.parse(readFileSync(pkgPath, "utf8")) as { name?: string };
        if (parsed.name === "mind-monorepo") return current;
      } catch {
        // continue
      }
    }
    const parent = path.dirname(current);
    if (parent === current) return path.resolve(startDir);
    current = parent;
  }
};

const parseJsonl = async (filePath: string): Promise<JsonRecord[]> => {
  try {
    const raw = await fs.readFile(filePath, "utf8");
    return raw
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => JSON.parse(line) as JsonRecord);
  } catch {
    return [];
  }
};

const assertStatus = async (name: string, expected: number, response: Response): Promise<TestResult> => {
  const bodyText = await response.text();
  let body: unknown = bodyText;
  try {
    body = JSON.parse(bodyText);
  } catch {
    body = bodyText;
  }
  return {
    name,
    pass: response.status === expected,
    details: { expected, got: response.status, body }
  };
};

const waitForHealth = async (baseUrl: string, timeoutMs = 15000) => {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    try {
      const response = await fetch(`${baseUrl}/v1/health`);
      if (response.ok) return;
    } catch {
      // retry
    }
    await wait(250);
  }
  throw new Error("event-router-service health timeout");
};

async function main() {
  const repoRoot = findRepoRoot(process.cwd());
  const stamp = nowStamp();
  const artifactDir = path.join(repoRoot, "artifacts", `e2e-live-flow-${stamp}`);
  const logDir = path.join(artifactDir, "logs");
  const guardrailsFile = path.join(artifactDir, "runtime_guardrails.test.json");
  const reviewQueueFile = path.join(artifactDir, "review_queue.test.json");
  const reportFile = path.join(artifactDir, "report.json");

  await fs.mkdir(logDir, { recursive: true });

  const guardrails = {
    version: "1.0",
    auth: {
      header_name: "x-event-router-token",
      token_env: "EVENT_ROUTER_SERVICE_TOKEN",
      required: true
    },
    rate_limit: {
      window_sec: 60,
      max_requests_per_window: 120
    },
    replay_protection: {
      enabled: true,
      ttl_sec: 900
    },
    duplicate_suppression: {
      enabled: true,
      ttl_sec: 60
    },
    limits: {
      max_slippage_bps: 50,
      max_retry: 3,
      proof_timeout_sec: 120,
      anchor_timeout_sec: 180
    },
    circuit_breaker: {
      enabled: true,
      failure_window_sec: 300,
      failure_threshold: 2,
      open_sec: 30
    }
  };
  await fs.writeFile(guardrailsFile, JSON.stringify(guardrails, null, 2), "utf8");

  const port = Number(process.env.EVENT_ROUTER_SERVICE_TEST_PORT ?? "3036");
  const host = "127.0.0.1";
  const baseUrl = `http://${host}:${port}`;
  const token = `test-token-${Date.now()}`;

  const child = spawn("pnpm", ["exec", "tsx", "services/event-router-service/src/index.ts"], {
    cwd: repoRoot,
    env: {
      ...process.env,
      EVENT_ROUTER_SERVICE_HOST: host,
      EVENT_ROUTER_SERVICE_PORT: String(port),
      EVENT_ROUTER_SERVICE_TOKEN: token,
      EVENT_ROUTER_GUARDRAILS_FILE: guardrailsFile,
      EVENT_ROUTER_LOG_DIR: logDir,
      EVENT_ROUTER_REVIEW_QUEUE_FILE: reviewQueueFile
    },
    stdio: ["ignore", "pipe", "pipe"]
  });

  child.stdout.on("data", (data) => process.stdout.write(`[event-router-service] ${data}`));
  child.stderr.on("data", (data) => process.stderr.write(`[event-router-service] ${data}`));

  const results: TestResult[] = [];
  const trackedEventIds: string[] = [];

  try {
    await waitForHealth(baseUrl);

    const blockEvent1 = {
      source: "intent_service",
      domain: "intent",
      event_id: `evt_e2e_block_1_${Date.now()}`,
      event_type: "intent.policy.checked",
      timestamp: new Date().toISOString(),
      agent_id: "mind_router",
      context: {
        intent_id: `int_e2e_block_1_${Date.now()}`,
        decision: "BLOCK",
        proof_status: "failed",
        reason_codes: ["RC_POLICY_VIOLATION"]
      },
      policy: { severity: "high" }
    };
    trackedEventIds.push(blockEvent1.event_id);

    const unauthorized = await fetch(`${baseUrl}/v1/events`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(blockEvent1)
    });
    results.push(await assertStatus("unauthorized_rejected", 401, unauthorized));

    const accepted1 = await fetch(`${baseUrl}/v1/events`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-event-router-token": token
      },
      body: JSON.stringify(blockEvent1)
    });
    results.push(await assertStatus("accepted_block_event_1", 202, accepted1));

    const replay = await fetch(`${baseUrl}/v1/events`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-event-router-token": token
      },
      body: JSON.stringify(blockEvent1)
    });
    results.push(await assertStatus("replay_rejected", 409, replay));

    const duplicateSuppressedEvent = {
      ...blockEvent1,
      event_id: `evt_e2e_dup_${Date.now()}`
    };
    trackedEventIds.push(duplicateSuppressedEvent.event_id);
    const duplicate = await fetch(`${baseUrl}/v1/events`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-event-router-token": token
      },
      body: JSON.stringify(duplicateSuppressedEvent)
    });
    const duplicateStatus = await assertStatus("duplicate_suppressed", 202, duplicate);
    const duplicateBody = (duplicateStatus.details as { body?: JsonRecord } | undefined)?.body;
    duplicateStatus.pass = duplicateStatus.pass && (duplicateBody as JsonRecord)?.status === "duplicate_suppressed";
    results.push(duplicateStatus);

    const marketGuardrailEvent = {
      source: "market_monitor",
      domain: "market",
      event_id: `evt_e2e_market_${Date.now()}`,
      event_type: "market.runtime.signal",
      timestamp: new Date().toISOString(),
      agent_id: "mind_router",
      context: {
        intent_id: `int_e2e_market_${Date.now()}`,
        slippage_bps: 120,
        latency_ms: 4500
      }
    };
    trackedEventIds.push(marketGuardrailEvent.event_id);
    const guardrailViolation = await fetch(`${baseUrl}/v1/events`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-event-router-token": token
      },
      body: JSON.stringify(marketGuardrailEvent)
    });
    results.push(await assertStatus("guardrail_slippage_violation", 422, guardrailViolation));

    const blockEvent2 = {
      ...blockEvent1,
      event_id: `evt_e2e_block_2_${Date.now()}`,
      context: {
        ...blockEvent1.context,
        intent_id: `int_e2e_block_2_${Date.now()}`
      }
    };
    trackedEventIds.push(blockEvent2.event_id);
    const accepted2 = await fetch(`${baseUrl}/v1/events`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-event-router-token": token
      },
      body: JSON.stringify(blockEvent2)
    });
    results.push(await assertStatus("accepted_block_event_2", 202, accepted2));

    const blockEvent3 = {
      ...blockEvent1,
      event_id: `evt_e2e_block_3_${Date.now()}`,
      context: {
        ...blockEvent1.context,
        intent_id: `int_e2e_block_3_${Date.now()}`
      }
    };
    trackedEventIds.push(blockEvent3.event_id);
    const circuitOpen = await fetch(`${baseUrl}/v1/events`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-event-router-token": token
      },
      body: JSON.stringify(blockEvent3)
    });
    results.push(await assertStatus("circuit_open_rejects", 503, circuitOpen));

    await wait(600);

    const ingressLog = path.join(logDir, "event_router_service_ingress.jsonl");
    const outcomeLog = path.join(logDir, "event_router_service_outcomes.jsonl");
    const securityLog = path.join(logDir, "event_router_service_security.jsonl");

    const ingressLines = await parseJsonl(ingressLog);
    const outcomeLines = await parseJsonl(outcomeLog);
    const securityLines = await parseJsonl(securityLog);
    const reviewQueueExists = existsSync(reviewQueueFile);

    results.push({
      name: "logs_written",
      pass: ingressLines.length > 0 && outcomeLines.length > 0 && securityLines.length > 0,
      details: {
        ingress: ingressLines.length,
        outcomes: outcomeLines.length,
        security: securityLines.length,
        reviewQueueExists
      }
    });

    const triggerOutcomesFile = path.join(repoRoot, "governance", "spec_runtime", "trigger_outcomes.jsonl");
    const triggerLines = await parseJsonl(triggerOutcomesFile);
    const trackedInTrigger = triggerLines.some((line) => {
      const nestedEvent = (line.event as JsonRecord | undefined) ?? {};
      const eventId = String(nestedEvent.event_id ?? line.event_id ?? "");
      return trackedEventIds.includes(eventId);
    });
    results.push({
      name: "dispatch_reaches_trigger_resolver",
      pass: trackedInTrigger,
      details: {
        trackedEventIds,
        matched: trackedInTrigger
      }
    });

    const metricsRun = await fetch(`${baseUrl}/v1/health`);
    results.push(await assertStatus("health_endpoint_available", 200, metricsRun));
  } finally {
    child.kill("SIGTERM");
    await wait(400);
  }

  const failed = results.filter((result) => !result.pass);
  const report = {
    status: failed.length === 0 ? "pass" : "fail",
    generated_at: new Date().toISOString(),
    artifact_dir: artifactDir,
    total: results.length,
    failed: failed.length,
    results
  };

  await fs.mkdir(path.dirname(reportFile), { recursive: true });
  await fs.writeFile(reportFile, JSON.stringify(report, null, 2), "utf8");
  console.log(JSON.stringify(report, null, 2));

  if (failed.length > 0) process.exit(1);
}

main().catch((error) => {
  console.error("[e2e_live_flow_test] failed:", error);
  process.exit(1);
});
