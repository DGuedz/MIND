import * as http from "node:http";
import * as https from "node:https";
import { Buffer } from "node:buffer";

export type OpenClawContextVisibilityMode = "all" | "allowlist" | "allowlist_quote";

export type OpenClawContextVisibility = {
  mode: OpenClawContextVisibilityMode;
  allowlist?: string[];
};

export type OpenClawEndpointOptions = {
  explicitEndpoint?: string;
  baseUrl?: string;
  basePath: string;
  fallbackEndpoint: string;
};

export type OpenClawRequestRuntime = {
  timeoutMs: number;
  proxyUrl?: string;
  proxyAuthorization?: string;
  tlsInsecureSkipVerify: boolean;
};

const DEFAULT_OPENCLAW_ALLOWLIST = [
  "intentId",
  "prompt",
  "paymentProof.txHash",
  "paymentProof.receiptHash",
  "paymentProof.metaplexProofTxHash"
];

const toTrimmed = (value: string | undefined): string => (value ?? "").trim();

const parseBoolean = (value: string | undefined, fallback: boolean): boolean => {
  if (!value) return fallback;
  const normalized = value.trim().toLowerCase();
  if (["1", "true", "yes", "on"].includes(normalized)) return true;
  if (["0", "false", "no", "off"].includes(normalized)) return false;
  return fallback;
};

const parseCsv = (value: string | undefined): string[] =>
  (value ?? "")
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);

const safeParseHeaders = (value: string | undefined): Record<string, string> => {
  const raw = toTrimmed(value);
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    return Object.entries(parsed).reduce<Record<string, string>>((acc, [key, val]) => {
      if (typeof val === "string") {
        acc[key] = val;
      }
      return acc;
    }, {});
  } catch {
    return {};
  }
};

const normalizeMode = (value: string | undefined): OpenClawContextVisibilityMode => {
  const normalized = toTrimmed(value).toLowerCase();
  if (normalized === "all" || normalized === "allowlist" || normalized === "allowlist_quote") {
    return normalized;
  }
  return "allowlist_quote";
};

export const resolveOpenClawEndpoint = (options: OpenClawEndpointOptions): string => {
  const explicit = toTrimmed(options.explicitEndpoint || process.env.OPENCLAW_INFERENCE_ENDPOINT);
  if (explicit) return explicit;

  const base = toTrimmed(options.baseUrl || process.env.OPENCLAW_BASE_URL).replace(/\/$/, "");
  if (base) {
    const path = options.basePath.startsWith("/") ? options.basePath : `/${options.basePath}`;
    return `${base}${path}`;
  }
  return options.fallbackEndpoint;
};

export const buildOpenClawContextVisibility = (
  fallbackAllowlist: string[] = DEFAULT_OPENCLAW_ALLOWLIST
): OpenClawContextVisibility => {
  const mode = normalizeMode(process.env.OPENCLAW_CONTEXT_VISIBILITY_MODE);
  if (mode === "all") {
    return { mode };
  }
  const allowlist = parseCsv(process.env.OPENCLAW_CONTEXT_ALLOWLIST);
  return { mode, allowlist: allowlist.length > 0 ? allowlist : fallbackAllowlist };
};

export const buildOpenClawHeaders = (input: {
  apiKey?: string;
  defaultHeaders?: Record<string, string>;
}): Record<string, string> => {
  const headers: Record<string, string> = {
    ...(input.defaultHeaders ?? {})
  };

  const authHeader = toTrimmed(process.env.OPENCLAW_AUTH_HEADER || "authorization");
  const authScheme = toTrimmed(process.env.OPENCLAW_AUTH_SCHEME || "Bearer");
  const authToken = toTrimmed(process.env.OPENCLAW_AUTH_TOKEN || input.apiKey || process.env.OPENCLAW_API_KEY);
  if (authHeader && authToken) {
    const value = authHeader.toLowerCase() === "authorization" && authScheme ? `${authScheme} ${authToken}` : authToken;
    headers[authHeader] = value;
  }

  return {
    ...headers,
    ...safeParseHeaders(process.env.OPENCLAW_EXTRA_HEADERS_JSON)
  };
};

export const resolveOpenClawRequestRuntime = (defaultTimeoutMs: number): OpenClawRequestRuntime => {
  const timeout = Number(process.env.OPENCLAW_TIMEOUT_MS ?? `${defaultTimeoutMs}`);
  return {
    timeoutMs: Number.isFinite(timeout) && timeout > 0 ? timeout : defaultTimeoutMs,
    proxyUrl: toTrimmed(process.env.OPENCLAW_PROXY_URL) || undefined,
    proxyAuthorization: toTrimmed(process.env.OPENCLAW_PROXY_AUTH) || undefined,
    tlsInsecureSkipVerify: parseBoolean(process.env.OPENCLAW_TLS_INSECURE_SKIP_VERIFY, false)
  };
};

export const postJsonWithRuntime = async (
  url: string,
  body: unknown,
  headers: Record<string, string>,
  runtime: OpenClawRequestRuntime
): Promise<{ statusCode?: number; data: string }> => {
  const payload = JSON.stringify(body);
  const target = new URL(url);
  const proxy = runtime.proxyUrl ? new URL(runtime.proxyUrl) : undefined;

  const routeThroughProxy = Boolean(proxy);
  const requestProtocol = routeThroughProxy ? proxy!.protocol : target.protocol;
  const client = requestProtocol === "https:" ? https : http;

  const requestHeaders: Record<string, string> = {
    "content-type": "application/json",
    "content-length": Buffer.byteLength(payload).toString(),
    ...headers
  };

  if (routeThroughProxy && runtime.proxyAuthorization) {
    requestHeaders["proxy-authorization"] = runtime.proxyAuthorization;
  }

  return new Promise<{ statusCode?: number; data: string }>((resolve, reject) => {
    const req = client.request(
      {
        method: "POST",
        hostname: routeThroughProxy ? proxy!.hostname : target.hostname,
        port: routeThroughProxy
          ? proxy!.port
            ? Number(proxy!.port)
            : proxy!.protocol === "https:"
              ? 443
              : 80
          : target.port
            ? Number(target.port)
            : target.protocol === "https:"
              ? 443
              : 80,
        path: routeThroughProxy ? target.toString() : `${target.pathname}${target.search}`,
        rejectUnauthorized: requestProtocol === "https:" ? !runtime.tlsInsecureSkipVerify : undefined,
        headers: requestHeaders
      },
      (res) => {
        let data = "";
        res.on("data", (chunk) => {
          data += chunk.toString();
        });
        res.on("end", () => {
          resolve({ statusCode: res.statusCode, data });
        });
      }
    );

    req.setTimeout(runtime.timeoutMs, () => {
      req.destroy(new Error(`OpenClaw request timeout after ${runtime.timeoutMs}ms`));
    });
    req.on("error", reject);
    req.write(payload);
    req.end();
  });
};
