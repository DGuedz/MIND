import { spawn } from "node:child_process";
import fs from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { setTimeout as wait } from "node:timers/promises";
import { emitRuntimeEvent, drainRuntimeEventSpool } from "../shared/router_client.js";
import { emitIntentCreatedEvent, emitIntentPolicyCheckedEvents } from "../services/intent-service/src/runtime_events.js";
import { emitProofGeneratedEvent, emitProofVerificationEvent } from "../services/proof-service/src/runtime_events.js";
import {
  emitExecutionConfirmedEvent,
  emitExecutionFailedEvent,
  emitExecutionSubmittedEvent
} from "../services/execution-service/src/runtime_events.js";
import {
  emitMarketLatencyAlertEvent,
  emitMarketRouteDegradedEvent,
  emitMarketSlippageAlertEvent
} from "../services/market-context-service/src/runtime_events.js";

type JsonRecord = Record<string, unknown>;

type TestResult = {
  name: string;
  pass: boolean;
  details?: unknown;
};

const nowStamp = () => new Date().toISOString().replace(/[:.]/g, "-");

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

const assert = (name: string, condition: boolean, details?: unknown): TestResult => ({
  name,
  pass: condition,
  details
});

async function main() {
  const repoRoot = process.cwd();
  const stamp = nowStamp();
  const artifactDir = path.join(repoRoot, "artifacts", `service-router-integration-${stamp}`);
  const logDir = path.join(artifactDir, "router-logs");
  const spoolDir = path.join(artifactDir, "failed_event_spool");
  const guardrailsFile = path.join(artifactDir, "runtime_guardrails.test.json");
  const reviewQueueFile = path.join(artifactDir, "review_queue.test.json");
  const reportFile = path.join(artifactDir, "report.json");

  await fs.mkdir(logDir, { recursive: true });
  await fs.mkdir(spoolDir, { recursive: true });

  const guardrails = {
    version: "1.0",
    auth: {
      header_name: "x-event-router-token",
      token_env: "EVENT_ROUTER_SERVICE_TOKEN",
      required: true
    },
    rate_limit: {
      window_sec: 60,
      max_requests_per_window: 300
    },
    replay_protection: {
      enabled: true,
      ttl_sec: 900
    },
    duplicate_suppression: {
      enabled: true,
      ttl_sec: 30
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
      failure_threshold: 30,
      open_sec: 60
    }
  };
  await fs.writeFile(guardrailsFile, JSON.stringify(guardrails, null, 2), "utf8");

  const port = Number(process.env.SERVICE_ROUTER_IT_PORT ?? "3046");
  const host = "127.0.0.1";
  const token = `it-router-token-${Date.now()}`;
  const baseUrl = `http://${host}:${port}`;

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

  child.stdout.on("data", (d) => process.stdout.write(`[router] ${d}`));
  child.stderr.on("data", (d) => process.stderr.write(`[router] ${d}`));

  process.env.EVENT_ROUTER_ENABLED = "true";
  process.env.EVENT_ROUTER_SERVICE_URL = baseUrl;
  process.env.EVENT_ROUTER_SERVICE_TOKEN = token;
  process.env.EVENT_ROUTER_TIMEOUT_MS = "1500";
  process.env.EVENT_ROUTER_RETRY_MAX = "1";
  process.env.EVENT_ROUTER_RETRY_BACKOFF_MS = "100";
  process.env.EVENT_ROUTER_SPOOL_DIR = spoolDir;
  process.env.EVENT_ROUTER_DRAIN_ON_EMIT = "true";

  const results: TestResult[] = [];
  const trackedEventIds: string[] = [];

  try {
    await waitForHealth(baseUrl);

    const intentCreated = await emitIntentCreatedEvent({
      intentId: `int_it_created_${Date.now()}`,
      policyId: "policy_it",
      amount: "100",
      riskScore: "0.3"
    });
    trackedEventIds.push(intentCreated.event_id);

    const intentBlocked = await emitIntentPolicyCheckedEvents({
      intentId: `int_it_blocked_${Date.now()}`,
      decision: "REJECT",
      allowed: false,
      requiresApproval: false,
      reasons: ["max_risk_exceeded"],
      policyHash: "ph_blocked",
      evNetBps: -5
    });
    trackedEventIds.push(...intentBlocked.map((item) => item.event_id));

    const intentAllowed = await emitIntentPolicyCheckedEvents({
      intentId: `int_it_allowed_${Date.now()}`,
      decision: "ALLOW",
      allowed: true,
      requiresApproval: false,
      reasons: [],
      policyHash: "ph_allowed",
      evNetBps: 12
    });
    trackedEventIds.push(...intentAllowed.map((item) => item.event_id));

    const proofGenerated = await emitProofGeneratedEvent({
      proofId: `pr_it_${Date.now()}`,
      intentId: `int_it_pf_${Date.now()}`,
      executionId: `ex_it_${Date.now()}`,
      approvalId: `ap_it_${Date.now()}`,
      anchorCount: 2,
      externalAnchorStatus: "pending"
    });
    trackedEventIds.push(proofGenerated.event_id);

    const proofVerified = await emitProofVerificationEvent({
      proofId: `pr_it_v_${Date.now()}`,
      intentId: `int_it_pv_${Date.now()}`,
      verified: true,
      internalVerified: true,
      strictMetaplexAnchor: false,
      externalAnchorStatus: "pending",
      reason: null
    });
    trackedEventIds.push(proofVerified.event_id);

    const proofFailed = await emitProofVerificationEvent({
      proofId: `pr_it_f_${Date.now()}`,
      intentId: `int_it_pf2_${Date.now()}`,
      verified: false,
      internalVerified: true,
      strictMetaplexAnchor: true,
      externalAnchorStatus: "pending",
      reason: "external_anchor_not_confirmed"
    });
    trackedEventIds.push(proofFailed.event_id);

    const executionSubmitted = await emitExecutionSubmittedEvent({
      executionId: `ex_it_sub_${Date.now()}`,
      intentId: `int_it_ex_${Date.now()}`,
      mode: "simulated",
      protocol: "JUPITER",
      policyHash: "ph_exec"
    });
    trackedEventIds.push(executionSubmitted.event_id);

    const executionConfirmed = await emitExecutionConfirmedEvent({
      executionId: `ex_it_conf_${Date.now()}`,
      intentId: `int_it_ex2_${Date.now()}`,
      mode: "simulated",
      status: "simulated",
      txHash: null,
      receiptHash: `rcpt_${Date.now()}`,
      routeHash: `route_${Date.now()}`,
      executionHash: `exec_hash_${Date.now()}`,
      policyHash: "ph_exec2",
      protocol: "JUPITER"
    });
    trackedEventIds.push(executionConfirmed.event_id);

    const executionFailed = await emitExecutionFailedEvent({
      executionId: `ex_it_fail_${Date.now()}`,
      intentId: `int_it_ex3_${Date.now()}`,
      mode: "real",
      reason: "signer_failed",
      policyHash: "ph_exec3",
      protocol: "ORCA"
    });
    trackedEventIds.push(executionFailed.event_id);

    const marketSlippage = await emitMarketSlippageAlertEvent({
      source: "integration_test",
      intentId: `int_it_mk_${Date.now()}`,
      slippageBps: 72,
      details: { path: "market.slippage.alert" }
    });
    if (marketSlippage) trackedEventIds.push(marketSlippage.event_id);

    const marketLatency = await emitMarketLatencyAlertEvent({
      source: "integration_test",
      intentId: `int_it_mk2_${Date.now()}`,
      latencyMs: 5500,
      details: { path: "market.latency.alert" }
    });
    if (marketLatency) trackedEventIds.push(marketLatency.event_id);

    const marketDegraded = await emitMarketRouteDegradedEvent({
      source: "integration_test",
      intentId: `int_it_mk3_${Date.now()}`,
      reason: "provider_unavailable",
      details: { path: "market.route.degraded" }
    });
    trackedEventIds.push(marketDegraded.event_id);

    results.push(
      assert("adapter_emissions_succeeded", trackedEventIds.length >= 12, {
        emitted_count: trackedEventIds.length
      })
    );

    const replayEventId = `evt_it_replay_${Date.now()}`;
    const replayFirst = await emitRuntimeEvent("intent", {
      event_id: replayEventId,
      event_type: "intent.created",
      context: { intent_id: `int_it_replay_${Date.now()}` }
    });
    const replaySecond = await emitRuntimeEvent("intent", {
      event_id: replayEventId,
      event_type: "intent.created",
      context: { intent_id: `int_it_replay_${Date.now()}` }
    });
    results.push(
      assert(
        "replay_protection_works",
        replayFirst.ok && replaySecond.ok && replaySecond.status === "duplicate",
        { replayFirst, replaySecond }
      )
    );

    results.push(
      assert(
        "guardrail_breach_captured",
        Boolean(marketSlippage?.http_status === 422 || marketSlippage?.status === "delivered"),
        { marketSlippage }
      )
    );

    process.env.EVENT_ROUTER_SERVICE_URL = "http://127.0.0.1:3999";
    const spooled = await emitRuntimeEvent("execution", {
      event_type: "execution.submitted",
      event_id: `evt_it_spool_${Date.now()}`,
      context: {
        execution_id: `ex_it_spool_${Date.now()}`,
        intent_id: `int_it_spool_${Date.now()}`,
        mode: "simulated"
      }
    });

    const pendingFilesAfterFailure = existsSync(path.join(spoolDir, "pending"))
      ? await fs.readdir(path.join(spoolDir, "pending"))
      : [];

    results.push(
      assert("dispatch_failure_spooled", spooled.status === "spooled" && pendingFilesAfterFailure.length > 0, {
        spooled,
        pending_files: pendingFilesAfterFailure
      })
    );

    process.env.EVENT_ROUTER_SERVICE_URL = baseUrl;

    let drained = { processed: 0, delivered: 0, pending: 0 };
    let pendingAfterDrain: string[] = [];
    for (let attempt = 0; attempt < 4; attempt += 1) {
      drained = await drainRuntimeEventSpool();
      pendingAfterDrain = existsSync(path.join(spoolDir, "pending"))
        ? await fs.readdir(path.join(spoolDir, "pending"))
        : [];
      if (pendingAfterDrain.length === 0) break;
      await wait(200);
    }

    results.push(
      assert("spool_recovery_works", drained.processed >= 1 && pendingAfterDrain.length === 0, {
        drained,
        pending_after_drain: pendingAfterDrain
      })
    );

    await wait(800);

    const ingressLog = path.join(logDir, "event_router_service_ingress.jsonl");
    const outcomeLog = path.join(logDir, "event_router_service_outcomes.jsonl");
    const securityLog = path.join(logDir, "event_router_service_security.jsonl");
    const triggerLog = path.join(repoRoot, "governance", "spec_runtime", "trigger_outcomes.jsonl");

    const ingressLines = await parseJsonl(ingressLog);
    const outcomeLines = await parseJsonl(outcomeLog);
    const securityLines = await parseJsonl(securityLog);
    const triggerLines = await parseJsonl(triggerLog);

    results.push(
      assert(
        "router_logs_persisted",
        ingressLines.length > 0 && outcomeLines.length > 0 && securityLines.length > 0,
        {
          ingress: ingressLines.length,
          outcomes: outcomeLines.length,
          security: securityLines.length
        }
      )
    );

    const triggerMatched = triggerLines.some((line) => {
      const event = (line.event as JsonRecord | undefined) ?? {};
      const eventId = String(event.event_id ?? line.event_id ?? "");
      return trackedEventIds.includes(eventId);
    });

    results.push(
      assert("resolver_received_service_events", triggerMatched, {
        tracked_event_ids: trackedEventIds.length
      })
    );
  } finally {
    child.kill("SIGTERM");
    await wait(350);
  }

  const failed = results.filter((item) => !item.pass);
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
  console.error("[service_router_integration_test] failed:", error);
  process.exit(1);
});
