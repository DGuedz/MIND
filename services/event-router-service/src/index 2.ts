import Fastify, { type FastifyInstance, type FastifyReply, type FastifyRequest } from "fastify";
import fs from "node:fs/promises";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import * as domainAdapters from "../../../shared/domain_adapters/index.js";
import * as eventEmitter from "../../../shared/event_emitter.js";

const execFileAsync = promisify(execFile);
const domainAdapterModule = domainAdapters as unknown as { adaptDomainEvent?: unknown; default?: { adaptDomainEvent?: unknown } };
const eventEmitterModule = eventEmitter as unknown as {
  createRuntimeEvent?: unknown;
  validateRuntimeEvent?: unknown;
  default?: { createRuntimeEvent?: unknown; validateRuntimeEvent?: unknown };
};

const adaptDomainEvent = (domainAdapterModule.adaptDomainEvent ??
  domainAdapterModule.default?.adaptDomainEvent) as typeof import("../../../shared/domain_adapters/index.js").adaptDomainEvent;
const createRuntimeEvent = (eventEmitterModule.createRuntimeEvent ??
  eventEmitterModule.default?.createRuntimeEvent) as typeof import("../../../shared/event_emitter.js").createRuntimeEvent;
const validateRuntimeEvent = (eventEmitterModule.validateRuntimeEvent ??
  eventEmitterModule.default?.validateRuntimeEvent) as typeof import("../../../shared/event_emitter.js").validateRuntimeEvent;
type RuntimeEvent = import("../../../shared/event_emitter.js").RuntimeEvent;

if (!adaptDomainEvent || !createRuntimeEvent || !validateRuntimeEvent) {
  throw new Error("event-router-service failed to load shared runtime modules");
}

type AnyRecord = Record<string, unknown>;

type Guardrails = {
  auth: { header_name: string; token_env: string; required: boolean };
  rate_limit: { window_sec: number; max_requests_per_window: number };
  replay_protection: { enabled: boolean; ttl_sec: number };
  duplicate_suppression: { enabled: boolean; ttl_sec: number };
  limits: {
    max_slippage_bps: number;
    max_retry: number;
    proof_timeout_sec: number;
    anchor_timeout_sec: number;
  };
  circuit_breaker: {
    enabled: boolean;
    failure_window_sec: number;
    failure_threshold: number;
    open_sec: number;
  };
};

const nowIso = () => new Date().toISOString();

const asObj = (value: unknown): AnyRecord => (value && typeof value === "object" ? (value as AnyRecord) : {});

const appendJsonl = async (filePath: string, payload: unknown) => {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.appendFile(filePath, `${JSON.stringify(payload)}\n`, "utf8");
};

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

const resolvePaths = (repoRoot: string) => {
  const specDir = process.env.EVENT_ROUTER_SPEC_DIR ?? path.join(repoRoot, "governance", "spec_runtime");
  const logDir = process.env.EVENT_ROUTER_LOG_DIR ?? specDir;
  const guardrailsFile = process.env.EVENT_ROUTER_GUARDRAILS_FILE ?? path.join(specDir, "runtime_guardrails.yaml");
  const reviewQueueFile = process.env.EVENT_ROUTER_REVIEW_QUEUE_FILE ?? path.join(specDir, "review_queue.json");

  return {
    repoRoot,
    specDir,
    logDir,
    guardrailsFile,
    reviewQueueFile,
    serviceIngressLog: path.join(logDir, "event_router_service_ingress.jsonl"),
    serviceOutcomeLog: path.join(logDir, "event_router_service_outcomes.jsonl"),
    serviceSecurityLog: path.join(logDir, "event_router_service_security.jsonl")
  };
};

const readGuardrails = async (guardrailsFile: string): Promise<Guardrails> => {
  const raw = await fs.readFile(guardrailsFile, "utf8");
  return JSON.parse(raw) as Guardrails;
};

const pushReviewQueue = async (reviewQueueFile: string, entry: AnyRecord) => {
  let queue: AnyRecord[] = [];
  try {
    queue = JSON.parse(await fs.readFile(reviewQueueFile, "utf8")) as AnyRecord[];
  } catch {
    queue = [];
  }
  queue.unshift(entry);
  queue = queue.slice(0, 500);
  await fs.mkdir(path.dirname(reviewQueueFile), { recursive: true });
  await fs.writeFile(reviewQueueFile, JSON.stringify(queue, null, 2), "utf8");
};

const runEventRouter = async (repoRoot: string, event: RuntimeEvent, dryRun: boolean) => {
  const args = ["exec", "tsx", "scripts/event_router.ts", `--event-json=${JSON.stringify(event)}`];
  if (dryRun) args.push("--dry-run=true");
  const { stdout, stderr } = await execFileAsync("pnpm", args, {
    cwd: repoRoot,
    maxBuffer: 1024 * 1024 * 8
  });
  return `${stdout}${stderr}`.trim();
};

const pruneMapByAge = (map: Map<string, number>, ttlMs: number) => {
  const now = Date.now();
  for (const [key, createdAt] of map.entries()) {
    if (now - createdAt > ttlMs) map.delete(key);
  }
};

export const startEventRouterService = async (): Promise<FastifyInstance> => {
  const repoRoot = findRepoRoot(process.cwd());
  const paths = resolvePaths(repoRoot);
  const guardrails = await readGuardrails(paths.guardrailsFile);

  const authToken = process.env[guardrails.auth.token_env] ?? "";
  const rateLimitMap = new Map<string, { count: number; startedAtMs: number }>();
  const replayMap = new Map<string, number>();
  const dedupeMap = new Map<string, number>();
  const failures: number[] = [];
  let circuitOpenUntil = 0;

  const port = Number(process.env.EVENT_ROUTER_SERVICE_PORT ?? "3016");
  const host = process.env.EVENT_ROUTER_SERVICE_HOST ?? "0.0.0.0";

  const app = Fastify({ logger: true });

  app.get("/v1/health", async () => {
    return {
      status: "ok",
      service: "event-router-service",
      timestamp: nowIso(),
      circuit_open: Date.now() < circuitOpenUntil,
      spec_dir: paths.specDir,
      log_dir: paths.logDir
    };
  });

  app.post("/v1/events", async (request: FastifyRequest, reply: FastifyReply) => {
    const startedAt = Date.now();
    const ip = request.ip;
    const headers = asObj(request.headers as unknown);
    const body = asObj(request.body as unknown);
    const source = (body.source as string | undefined) ?? "unknown";
    const dryRun = body.dry_run === true;

    if (guardrails.auth.required) {
      const headerName = guardrails.auth.header_name.toLowerCase();
      const supplied = String(headers[headerName] ?? "");
      if (!authToken || supplied !== authToken) {
        await appendJsonl(paths.serviceSecurityLog, {
          at: nowIso(),
          kind: "auth_rejected",
          ip,
          source
        });
        return reply.code(401).send({ status: "unauthorized" });
      }
    }

    const current = rateLimitMap.get(ip);
    const now = Date.now();
    if (!current || now - current.startedAtMs > guardrails.rate_limit.window_sec * 1000) {
      rateLimitMap.set(ip, { count: 1, startedAtMs: now });
    } else {
      current.count += 1;
      if (current.count > guardrails.rate_limit.max_requests_per_window) {
        await appendJsonl(paths.serviceSecurityLog, {
          at: nowIso(),
          kind: "rate_limited",
          ip,
          source,
          count: current.count
        });
        return reply.code(429).send({ status: "rate_limited" });
      }
    }

    if (Date.now() < circuitOpenUntil) {
      await appendJsonl(paths.serviceSecurityLog, {
        at: nowIso(),
        kind: "circuit_open_reject",
        ip,
        source
      });
      return reply.code(503).send({
        status: "circuit_open",
        retry_after_sec: Math.ceil((circuitOpenUntil - Date.now()) / 1000)
      });
    }

    const adapted = adaptDomainEvent(body);
    const event = createRuntimeEvent(adapted);
    const validation = validateRuntimeEvent(event);
    if (!validation.valid) {
      await appendJsonl(paths.serviceSecurityLog, {
        at: nowIso(),
        kind: "schema_invalid",
        event_id: event.event_id,
        errors: validation.errors
      });
      return reply.code(400).send({ status: "invalid_event", errors: validation.errors });
    }

    if (guardrails.replay_protection.enabled) {
      const seenAt = replayMap.get(event.event_id);
      if (seenAt && Date.now() - seenAt < guardrails.replay_protection.ttl_sec * 1000) {
        await appendJsonl(paths.serviceSecurityLog, {
          at: nowIso(),
          kind: "replay_rejected",
          event_id: event.event_id,
          source
        });
        return reply.code(409).send({ status: "replay_rejected", event_id: event.event_id });
      }
      replayMap.set(event.event_id, Date.now());
      pruneMapByAge(replayMap, guardrails.replay_protection.ttl_sec * 1000);
    }

    if (guardrails.duplicate_suppression.enabled) {
      const dedupeKey = `${event.event_type}:${String(event.context.intent_id ?? "")}::${String(event.context.decision ?? "")}`;
      const last = dedupeMap.get(dedupeKey);
      if (last && Date.now() - last < guardrails.duplicate_suppression.ttl_sec * 1000) {
        await appendJsonl(paths.serviceSecurityLog, {
          at: nowIso(),
          kind: "duplicate_suppressed",
          event_id: event.event_id,
          dedupe_key: dedupeKey,
          source
        });
        return reply.code(202).send({ status: "duplicate_suppressed", event_id: event.event_id });
      }
      dedupeMap.set(dedupeKey, Date.now());
      pruneMapByAge(dedupeMap, guardrails.duplicate_suppression.ttl_sec * 1000);
    }

    const slippage = Number(event.context.slippage_bps ?? 0);
    if (Number.isFinite(slippage) && slippage > guardrails.limits.max_slippage_bps) {
      await pushReviewQueue(paths.reviewQueueFile, {
        id: `rq_${event.event_id}`,
        at: nowIso(),
        reason: "slippage_breach",
        severity: "high",
        event
      });
      return reply.code(422).send({ status: "guardrail_violation", reason: "slippage_breach" });
    }

    const retryCount = Number(event.context.retry_count ?? 0);
    if (Number.isFinite(retryCount) && retryCount > guardrails.limits.max_retry) {
      await pushReviewQueue(paths.reviewQueueFile, {
        id: `rq_${event.event_id}`,
        at: nowIso(),
        reason: "retry_breach",
        severity: "high",
        event
      });
      return reply.code(422).send({ status: "guardrail_violation", reason: "retry_breach" });
    }

    const proofAge = Number(event.context.proof_age_sec ?? 0);
    if (Number.isFinite(proofAge) && proofAge > guardrails.limits.proof_timeout_sec) {
      await pushReviewQueue(paths.reviewQueueFile, {
        id: `rq_${event.event_id}`,
        at: nowIso(),
        reason: "proof_timeout",
        severity: "high",
        event
      });
      return reply.code(422).send({ status: "guardrail_violation", reason: "proof_timeout" });
    }

    const anchorAge = Number(event.context.anchor_age_sec ?? 0);
    if (Number.isFinite(anchorAge) && anchorAge > guardrails.limits.anchor_timeout_sec) {
      await pushReviewQueue(paths.reviewQueueFile, {
        id: `rq_${event.event_id}`,
        at: nowIso(),
        reason: "anchor_timeout",
        severity: "high",
        event
      });
      return reply.code(422).send({ status: "guardrail_violation", reason: "anchor_timeout" });
    }

    await appendJsonl(paths.serviceIngressLog, {
      at: nowIso(),
      source,
      ip,
      event
    });

    const isFailureSignal =
      event.context.proof_status === "failed" ||
      event.context.decision === "BLOCK" ||
      event.context.route_failure === true;
    if (isFailureSignal) {
      failures.push(Date.now());
      const windowStart = Date.now() - guardrails.circuit_breaker.failure_window_sec * 1000;
      while (failures.length > 0) {
        const firstFailure = failures[0];
        if (firstFailure === undefined || firstFailure >= windowStart) break;
        failures.shift();
      }
      if (guardrails.circuit_breaker.enabled && failures.length >= guardrails.circuit_breaker.failure_threshold) {
        circuitOpenUntil = Date.now() + guardrails.circuit_breaker.open_sec * 1000;
        await appendJsonl(paths.serviceSecurityLog, {
          at: nowIso(),
          kind: "circuit_open",
          source,
          failures_in_window: failures.length,
          open_until: new Date(circuitOpenUntil).toISOString()
        });
      }
    }

    let routerOutput = "";
    try {
      routerOutput = await runEventRouter(repoRoot, event, dryRun);
    } catch (error) {
      await appendJsonl(paths.serviceOutcomeLog, {
        at: nowIso(),
        event_id: event.event_id,
        status: "dispatch_failed",
        latency_ms: Date.now() - startedAt,
        error: error instanceof Error ? error.message : String(error)
      });
      return reply.code(500).send({ status: "dispatch_failed" });
    }

    const latency = Date.now() - startedAt;
    await appendJsonl(paths.serviceOutcomeLog, {
      at: nowIso(),
      event_id: event.event_id,
      status: "accepted",
      latency_ms: latency,
      source
    });

    return reply.code(202).send({
      status: "accepted",
      event_id: event.event_id,
      latency_ms: latency,
      router_output: routerOutput
    });
  });

  await app.listen({ port, host });
  app.log.info(`event-router-service listening on ${host}:${port}`);
  return app;
};

const isMain = (() => {
  if (!process.argv[1]) return false;
  const currentFile = fileURLToPath(import.meta.url);
  return path.resolve(process.argv[1]) === path.resolve(currentFile);
})();

if (isMain) {
  startEventRouterService().catch((error) => {
    console.error("[event-router-service] failed:", error);
    process.exit(1);
  });
}
