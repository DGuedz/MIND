import * as http from "node:http";
import fs from "node:fs/promises";
import path from "node:path";
import assert from "node:assert/strict";
import {
  buildOpenClawContextVisibility,
  buildOpenClawHeaders,
  postJsonWithRuntime,
  resolveOpenClawEndpoint,
  resolveOpenClawRequestRuntime
} from "../shared/openclaw_runtime.js";
import { logOpenClawProgressEvent } from "./audit_logger.js";

const AUDIT_PROGRESS_LOG = path.join(process.cwd(), "governance", "openclaw_progress_events.jsonl");

type MockRequest = {
  headers: http.IncomingHttpHeaders;
  body: Record<string, unknown>;
};

const startMockServer = async () => {
  let lastRequest: MockRequest | null = null;
  const server = http.createServer((req, res) => {
    const chunks: Buffer[] = [];
    req.on("data", (chunk) => {
      chunks.push(Buffer.from(chunk));
    });
    req.on("end", () => {
      try {
        const body = JSON.parse(Buffer.concat(chunks).toString("utf8")) as Record<string, unknown>;
        lastRequest = { headers: req.headers, body };
      } catch {
        lastRequest = { headers: req.headers, body: {} };
      }
      res.writeHead(200, { "content-type": "application/json" });
      res.end(
        JSON.stringify({
          ok: true,
          received: lastRequest
        })
      );
    });
  });

  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  if (!address || typeof address === "string") {
    throw new Error("Failed to start mock OpenClaw server.");
  }

  return {
    url: `http://127.0.0.1:${address.port}/v1/inference`,
    close: async () => {
      await new Promise<void>((resolve, reject) => {
        server.close((err) => (err ? reject(err) : resolve()));
      });
    }
  };
};

const readAuditLog = async (): Promise<string> => {
  try {
    return await fs.readFile(AUDIT_PROGRESS_LOG, "utf8");
  } catch {
    return "";
  }
};

async function main() {
  const mock = await startMockServer();
  const intentId = `OPENCLAW-UPGRADE-${Date.now()}`;
  const envBackup = new Map<string, string | undefined>();
  const keys = [
    "OPENCLAW_INFERENCE_ENDPOINT",
    "OPENCLAW_BASE_URL",
    "OPENCLAW_TIMEOUT_MS",
    "OPENCLAW_AUTH_HEADER",
    "OPENCLAW_AUTH_TOKEN",
    "OPENCLAW_AUTH_SCHEME",
    "OPENCLAW_EXTRA_HEADERS_JSON",
    "OPENCLAW_CONTEXT_VISIBILITY_MODE",
    "OPENCLAW_CONTEXT_ALLOWLIST",
    "OPENCLAW_PROXY_URL",
    "OPENCLAW_PROXY_AUTH",
    "OPENCLAW_TLS_INSECURE_SKIP_VERIFY"
  ];
  for (const key of keys) {
    envBackup.set(key, process.env[key]);
  }

  try {
    process.env.OPENCLAW_INFERENCE_ENDPOINT = mock.url;
    process.env.OPENCLAW_BASE_URL = "";
    process.env.OPENCLAW_TIMEOUT_MS = "4000";
    process.env.OPENCLAW_AUTH_HEADER = "x-provider-auth";
    process.env.OPENCLAW_AUTH_SCHEME = "Bearer";
    process.env.OPENCLAW_AUTH_TOKEN = "";
    process.env.OPENCLAW_EXTRA_HEADERS_JSON = JSON.stringify({ "x-openclaw-test": "enabled" });
    process.env.OPENCLAW_CONTEXT_VISIBILITY_MODE = "allowlist_quote";
    process.env.OPENCLAW_CONTEXT_ALLOWLIST = "intentId,paymentProof.txHash,paymentProof.receiptHash";
    process.env.OPENCLAW_PROXY_URL = "";
    process.env.OPENCLAW_PROXY_AUTH = "";
    process.env.OPENCLAW_TLS_INSECURE_SKIP_VERIFY = "false";

    const endpoint = resolveOpenClawEndpoint({
      explicitEndpoint: process.env.OPENCLAW_INFERENCE_ENDPOINT,
      baseUrl: process.env.OPENCLAW_BASE_URL,
      basePath: "/inference",
      fallbackEndpoint: "http://localhost:3009/v1/inference"
    });
    const contextVisibility = buildOpenClawContextVisibility();
    const runtime = resolveOpenClawRequestRuntime(15000);
    const headers = buildOpenClawHeaders({
      apiKey: "local-test-openclaw-key",
      defaultHeaders: { "content-type": "application/json" }
    });

    const beforeAudit = await readAuditLog();
    await logOpenClawProgressEvent({
      intentId,
      source: "validate_openclaw_upgrade",
      phase: "plan",
      item: "openclaw_runtime_validation",
      status: "pending",
      metadata: {
        endpoint,
        contextMode: contextVisibility.mode
      }
    });

    const response = await postJsonWithRuntime(
      endpoint,
      {
        intentId,
        prompt: "validate-runtime",
        paymentProof: {
          txHash: "tx_mock_hash",
          receiptHash: "receipt_mock_hash"
        },
        contextVisibility,
        channelInput: {
          channel: "validation_script",
          contextVisibility
        }
      },
      headers,
      runtime
    );
    const status = response.statusCode ?? 0;
    const parsed = JSON.parse(response.data) as {
      ok: boolean;
      received: MockRequest;
    };
    assert.equal(status, 200, "Expected mock OpenClaw status 200.");
    assert.equal(parsed.ok, true, "Mock OpenClaw should return ok=true.");
    assert.equal(parsed.received.headers["x-openclaw-test"], "enabled");
    assert.equal(parsed.received.headers["x-provider-auth"], "local-test-openclaw-key");
    assert.equal(
      (parsed.received.body.contextVisibility as { mode?: string }).mode,
      "allowlist_quote",
      "Expected contextVisibility mode allowlist_quote."
    );
    assert.deepEqual(
      (parsed.received.body.contextVisibility as { allowlist?: string[] }).allowlist,
      ["intentId", "paymentProof.txHash", "paymentProof.receiptHash"]
    );

    await logOpenClawProgressEvent({
      intentId,
      source: "validate_openclaw_upgrade",
      phase: "execution",
      item: "openclaw_runtime_validation",
      status: "completed",
      metadata: {
        statusCode: status
      }
    });
    const afterAudit = await readAuditLog();
    assert.notEqual(beforeAudit, afterAudit, "Expected OpenClaw audit progress log to change.");
    assert.ok(afterAudit.includes(intentId), "Expected audit log to include validation intentId.");

    console.log(
      JSON.stringify(
        {
          status: "pass",
          intentId,
          endpoint,
          checks: {
            contextVisibility: "pass",
            headerOverride: "pass",
            authOverride: "pass",
            structuredProgressEvents: "pass"
          }
        },
        null,
        2
      )
    );
  } finally {
    await mock.close();
    for (const key of keys) {
      const previous = envBackup.get(key);
      if (previous === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = previous;
      }
    }
  }
}

main().catch((error) => {
  console.error("[validate_openclaw_upgrade] failed:", error instanceof Error ? error.message : String(error));
  process.exit(1);
});
