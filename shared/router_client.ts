import fs from "node:fs/promises";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { setTimeout as wait } from "node:timers/promises";
import {
  normalizeRuntimeEvent,
  type RuntimeEventDomain,
  type RuntimeEventEnvelope,
  type RuntimeEventInput
} from "./runtime_event_contract.js";

type DispatchStatus = "delivered" | "spooled" | "duplicate" | "disabled" | "rejected";

export type EmitRuntimeEventResult = {
  ok: boolean;
  status: DispatchStatus;
  event_id: string;
  attempts: number;
  http_status?: number;
  error?: string;
  spool_file?: string;
};

type DispatchResponse = {
  ok: boolean;
  httpStatus: number;
  bodyText: string;
  transientFailure: boolean;
};

type RouterClientConfig = {
  enabled: boolean;
  baseUrl: string;
  token: string;
  timeoutMs: number;
  maxRetries: number;
  retryBackoffMs: number;
  spoolDir: string;
  pendingDir: string;
  dispatchedDir: string;
  failureLogFile: string;
  drainBatch: number;
  drainOnEmit: boolean;
};

const sentEventIds = new Set<string>();
let draining = false;

const nowIso = () => new Date().toISOString();

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

const boolFromEnv = (value: string | undefined, fallback: boolean) => {
  if (value === undefined) return fallback;
  const normalized = value.trim().toLowerCase();
  if (normalized === "true") return true;
  if (normalized === "false") return false;
  return fallback;
};

const numberFromEnv = (value: string | undefined, fallback: number) => {
  if (!value) return fallback;
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return parsed;
};

const getRouterClientConfig = (): RouterClientConfig => {
  const repoRoot = findRepoRoot(process.cwd());
  const spoolDir = process.env.EVENT_ROUTER_SPOOL_DIR ?? path.join(repoRoot, "failed_event_spool");

  return {
    enabled: boolFromEnv(process.env.EVENT_ROUTER_ENABLED, true),
    baseUrl: process.env.EVENT_ROUTER_SERVICE_URL ?? "http://127.0.0.1:3016",
    token: process.env.EVENT_ROUTER_SERVICE_TOKEN ?? "",
    timeoutMs: numberFromEnv(process.env.EVENT_ROUTER_TIMEOUT_MS, 1500),
    maxRetries: numberFromEnv(process.env.EVENT_ROUTER_RETRY_MAX, 2),
    retryBackoffMs: numberFromEnv(process.env.EVENT_ROUTER_RETRY_BACKOFF_MS, 250),
    spoolDir,
    pendingDir: path.join(spoolDir, "pending"),
    dispatchedDir: path.join(spoolDir, "dispatched"),
    failureLogFile: path.join(spoolDir, "dispatch_failures.jsonl"),
    drainBatch: Math.max(1, numberFromEnv(process.env.EVENT_ROUTER_SPOOL_DRAIN_BATCH, 20)),
    drainOnEmit: boolFromEnv(process.env.EVENT_ROUTER_DRAIN_ON_EMIT, true)
  };
};

const appendJsonl = async (filePath: string, payload: unknown) => {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.appendFile(filePath, `${JSON.stringify(payload)}\n`, "utf8");
};

const safeBodyText = async (response: Response) => {
  try {
    return await response.text();
  } catch {
    return "";
  }
};

const dispatchWithTimeout = async (
  config: RouterClientConfig,
  payload: RuntimeEventEnvelope
): Promise<DispatchResponse> => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), config.timeoutMs);

  try {
    const response = await fetch(`${config.baseUrl}/v1/events`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        ...(config.token ? { "x-event-router-token": config.token } : {})
      },
      body: JSON.stringify(payload),
      signal: controller.signal
    });

    const bodyText = await safeBodyText(response);
    const transientFailure = response.status >= 500 || response.status === 408 || response.status === 429;
    return {
      ok: response.ok || response.status === 202 || response.status === 409 || response.status === 422,
      httpStatus: response.status,
      bodyText,
      transientFailure
    };
  } catch (error) {
    return {
      ok: false,
      httpStatus: 0,
      bodyText: error instanceof Error ? error.message : String(error),
      transientFailure: true
    };
  } finally {
    clearTimeout(timer);
  }
};

const spoolFilePath = (config: RouterClientConfig, eventId: string) => {
  return path.join(config.pendingDir, `${Date.now()}-${eventId}.json`);
};

const listPendingFiles = async (pendingDir: string) => {
  try {
    const entries = await fs.readdir(pendingDir);
    return entries
      .filter((entry) => entry.endsWith(".json"))
      .sort((a, b) => a.localeCompare(b))
      .map((entry) => path.join(pendingDir, entry));
  } catch {
    return [] as string[];
  }
};

const existsPendingEventId = async (config: RouterClientConfig, eventId: string) => {
  const files = await listPendingFiles(config.pendingDir);
  return files.some((file) => file.includes(eventId));
};

const persistFailedDispatch = async (
  config: RouterClientConfig,
  payload: RuntimeEventEnvelope,
  reason: string,
  attempts: number
): Promise<string> => {
  await fs.mkdir(config.pendingDir, { recursive: true });
  await fs.mkdir(config.dispatchedDir, { recursive: true });

  if (await existsPendingEventId(config, payload.event_id)) {
    return "already_pending";
  }

  const targetFile = spoolFilePath(config, payload.event_id);
  await fs.writeFile(
    targetFile,
    JSON.stringify(
      {
        status: "pending_dispatch",
        created_at: nowIso(),
        attempts,
        reason,
        payload
      },
      null,
      2
    ),
    "utf8"
  );

  await appendJsonl(config.failureLogFile, {
    at: nowIso(),
    event_id: payload.event_id,
    reason,
    attempts,
    spool_file: targetFile
  });

  return targetFile;
};

const markSpoolDispatched = async (config: RouterClientConfig, spoolFile: string, status: string, detail?: string) => {
  const base = path.basename(spoolFile);
  const target = path.join(config.dispatchedDir, `${status}-${base}`);
  const raw = await fs.readFile(spoolFile, "utf8");
  const parsed = JSON.parse(raw) as Record<string, unknown>;
  const next = {
    ...parsed,
    status,
    dispatched_at: nowIso(),
    detail: detail ?? null
  };
  await fs.writeFile(target, JSON.stringify(next, null, 2), "utf8");
  await fs.unlink(spoolFile);
};

const tryDispatch = async (config: RouterClientConfig, payload: RuntimeEventEnvelope): Promise<EmitRuntimeEventResult> => {
  let attempts = 0;
  let lastError = "unknown_error";

  while (attempts <= config.maxRetries) {
    attempts += 1;
    const result = await dispatchWithTimeout(config, payload);

    if (result.ok) {
      sentEventIds.add(payload.event_id);
      return {
        ok: true,
        status: result.httpStatus === 409 ? "duplicate" : "delivered",
        event_id: payload.event_id,
        attempts,
        http_status: result.httpStatus
      };
    }

    lastError = result.bodyText || `http_${result.httpStatus}`;
    if (!result.transientFailure || attempts > config.maxRetries) {
      break;
    }

    await wait(config.retryBackoffMs * attempts);
  }

  const spoolFile = await persistFailedDispatch(config, payload, lastError, attempts);
  return {
    ok: false,
    status: "spooled",
    event_id: payload.event_id,
    attempts,
    error: lastError,
    spool_file: spoolFile
  };
};

export const drainRuntimeEventSpool = async (): Promise<{ processed: number; delivered: number; pending: number }> => {
  const config = getRouterClientConfig();
  if (!config.enabled) return { processed: 0, delivered: 0, pending: 0 };
  if (draining) return { processed: 0, delivered: 0, pending: 0 };

  draining = true;
  let processed = 0;
  let delivered = 0;

  try {
    const files = await listPendingFiles(config.pendingDir);
    for (const filePath of files.slice(0, config.drainBatch)) {
      processed += 1;
      let payload: RuntimeEventEnvelope | null = null;

      try {
        const raw = await fs.readFile(filePath, "utf8");
        const parsed = JSON.parse(raw) as { payload?: RuntimeEventEnvelope };
        payload = parsed.payload ?? null;
      } catch {
        await markSpoolDispatched(config, filePath, "invalid_payload", "json_parse_failed");
        continue;
      }

      if (!payload) {
        await markSpoolDispatched(config, filePath, "invalid_payload", "missing_payload");
        continue;
      }

      const dispatch = await dispatchWithTimeout(config, payload);
      if (dispatch.ok) {
        delivered += 1;
        await markSpoolDispatched(config, filePath, "dispatched", dispatch.bodyText);
        continue;
      }

      if (!dispatch.transientFailure) {
        await markSpoolDispatched(config, filePath, "rejected", dispatch.bodyText);
      }
    }

    const remaining = await listPendingFiles(config.pendingDir);
    return { processed, delivered, pending: remaining.length };
  } finally {
    draining = false;
  }
};

export const emitRuntimeEvent = async (
  domain: RuntimeEventDomain,
  input: RuntimeEventInput
): Promise<EmitRuntimeEventResult> => {
  const config = getRouterClientConfig();
  const payload = normalizeRuntimeEvent(domain, input);

  if (!config.enabled) {
    return {
      ok: true,
      status: "disabled",
      event_id: payload.event_id,
      attempts: 0
    };
  }

  if (sentEventIds.has(payload.event_id)) {
    return {
      ok: true,
      status: "duplicate",
      event_id: payload.event_id,
      attempts: 0
    };
  }

  if (config.drainOnEmit) {
    await drainRuntimeEventSpool();
  }

  return tryDispatch(config, payload);
};
