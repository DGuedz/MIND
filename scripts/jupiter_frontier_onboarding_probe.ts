import "dotenv/config";
import fs from "node:fs/promises";
import path from "node:path";

type ProbeArgs = {
  dryRun: boolean;
  outDir?: string;
};

type ProbeResult = {
  status: "ok" | "error";
  generatedAt: string;
  dryRun: boolean;
  config: {
    hasApiKey: boolean;
    baseUrl: string | null;
    firstCallUrl: string | null;
    firstCallMethod: string;
    timeoutMs: number;
  };
  timings: {
    startedAt: string;
    completedAt: string;
    elapsedMs: number;
  };
  firstCall?: {
    url: string;
    method: string;
    status: number;
    ok: boolean;
    responsePreview: string;
  };
  error?: string;
  artifactDir?: string;
};

const ROOT = process.cwd();
const DEFAULT_ARTIFACTS_ROOT = path.join(ROOT, "artifacts", "jupiter-frontier");

const nowIso = () => new Date().toISOString();
const ts = () => nowIso().replace(/[:.]/g, "-");

const parseArgs = (): ProbeArgs => {
  const raw = process.argv.slice(2);
  const lookup = Object.fromEntries(
    raw
      .filter((item) => item.startsWith("--"))
      .map((item) => {
        const [k, ...rest] = item.slice(2).split("=");
        return [k, rest.join("=") || "true"];
      })
  );
  return {
    dryRun: lookup["dry-run"] === "true",
    outDir: lookup["out-dir"] || undefined
  };
};

const env = {
  apiKey: process.env.JUPITER_DEV_API_KEY || process.env.JUPITER_API_KEY || "",
  baseUrl: process.env.JUPITER_DEV_PLATFORM_BASE_URL || process.env.JUPITER_BASE_URL || "",
  firstCallUrl: process.env.JUPITER_FIRST_CALL_URL || "",
  firstCallMethod: (process.env.JUPITER_FIRST_CALL_METHOD || "GET").toUpperCase(),
  timeoutMs: Number(process.env.JUPITER_PROBE_TIMEOUT_MS || "15000")
};

const defaultFirstCallUrl = () => {
  if (!env.baseUrl) return "";
  return `${env.baseUrl.replace(/\/$/, "")}/price/v1?ids=So11111111111111111111111111111111111111112`;
};

async function main() {
  const args = parseArgs();
  const started = Date.now();
  const startedAt = nowIso();

  const firstCallUrl = env.firstCallUrl || defaultFirstCallUrl();

  const config = {
    hasApiKey: Boolean(env.apiKey),
    baseUrl: env.baseUrl || null,
    firstCallUrl: firstCallUrl || null,
    firstCallMethod: env.firstCallMethod,
    timeoutMs: env.timeoutMs
  };

  const artifactDir = args.outDir
    ? path.resolve(args.outDir)
    : path.join(DEFAULT_ARTIFACTS_ROOT, `onboarding-${ts()}`);

  if (args.dryRun) {
    const completedAt = nowIso();
    const elapsedMs = Date.now() - started;
    const dryRunResult: ProbeResult = {
      status: "ok",
      generatedAt: completedAt,
      dryRun: true,
      config,
      timings: { startedAt, completedAt, elapsedMs },
      artifactDir
    };
    console.log(JSON.stringify(dryRunResult, null, 2));
    return;
  }

  if (!env.apiKey) {
    const completedAt = nowIso();
    const elapsedMs = Date.now() - started;
    const result: ProbeResult = {
      status: "error",
      generatedAt: completedAt,
      dryRun: false,
      config,
      timings: { startedAt, completedAt, elapsedMs },
      error: "Missing JUPITER_DEV_API_KEY (or JUPITER_API_KEY)."
    };
    console.log(JSON.stringify(result, null, 2));
    process.exit(1);
  }

  if (!firstCallUrl) {
    const completedAt = nowIso();
    const elapsedMs = Date.now() - started;
    const result: ProbeResult = {
      status: "error",
      generatedAt: completedAt,
      dryRun: false,
      config,
      timings: { startedAt, completedAt, elapsedMs },
      error: "Missing first call target. Set JUPITER_FIRST_CALL_URL or JUPITER_DEV_PLATFORM_BASE_URL."
    };
    console.log(JSON.stringify(result, null, 2));
    process.exit(1);
  }

  const abort = new AbortController();
  const timer = setTimeout(() => abort.abort(), env.timeoutMs);

  try {
    const response = await fetch(firstCallUrl, {
      method: env.firstCallMethod,
      headers: {
        authorization: `Bearer ${env.apiKey}`,
        "content-type": "application/json"
      },
      signal: abort.signal
    });
    const text = await response.text();
    clearTimeout(timer);

    const completedAt = nowIso();
    const elapsedMs = Date.now() - started;
    const result: ProbeResult = {
      status: response.ok ? "ok" : "error",
      generatedAt: completedAt,
      dryRun: false,
      config,
      timings: { startedAt, completedAt, elapsedMs },
      firstCall: {
        url: firstCallUrl,
        method: env.firstCallMethod,
        status: response.status,
        ok: response.ok,
        responsePreview: text.slice(0, 2000)
      },
      artifactDir
    };

    await fs.mkdir(artifactDir, { recursive: true });
    await Promise.all([
      fs.writeFile(path.join(artifactDir, "first_api_call.json"), JSON.stringify(result, null, 2), "utf8"),
      fs.writeFile(
        path.join(artifactDir, "onboarding_timeline.json"),
        JSON.stringify(
          {
            startedAt,
            completedAt,
            elapsedMs,
            phase: "jupiter_first_call"
          },
          null,
          2
        ),
        "utf8"
      )
    ]);

    console.log(JSON.stringify(result, null, 2));
    if (!response.ok) process.exit(1);
  } catch (error) {
    clearTimeout(timer);
    const completedAt = nowIso();
    const elapsedMs = Date.now() - started;
    const result: ProbeResult = {
      status: "error",
      generatedAt: completedAt,
      dryRun: false,
      config,
      timings: { startedAt, completedAt, elapsedMs },
      error: error instanceof Error ? error.message : "unknown_error",
      artifactDir
    };
    await fs.mkdir(artifactDir, { recursive: true });
    await fs.writeFile(path.join(artifactDir, "first_api_call.json"), JSON.stringify(result, null, 2), "utf8");
    console.log(JSON.stringify(result, null, 2));
    process.exit(1);
  }
}

main().catch((error) => {
  console.error("[jupiter_frontier_onboarding_probe] failed:", error instanceof Error ? error.message : String(error));
  process.exit(1);
});

