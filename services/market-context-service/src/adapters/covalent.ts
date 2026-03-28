import { createHash } from "node:crypto";
import { postJson } from "./http.js";

const canonicalize = (value: unknown): string => {
  if (value === null || value === undefined) {
    return "null";
  }
  if (Array.isArray(value)) {
    return `[${value.map(canonicalize).join(",")}]`;
  }
  if (typeof value === "object") {
    const obj = value as Record<string, unknown>;
    const keys = Object.keys(obj).sort();
    return `{${keys.map((key) => `${JSON.stringify(key)}:${canonicalize(obj[key])}`).join(",")}}`;
  }
  return JSON.stringify(value);
};

const hashValue = (value: unknown): string => {
  return createHash("sha256").update(canonicalize(value)).digest("hex");
};

type CovalentFetchedResult = {
  status: "fetched";
  statusCode: number;
  snapshotHash: string;
  raw: string;
};

type CovalentSkippedResult = {
  status: "skipped";
  reason: "missing_endpoint";
};

type CovalentFailedResult = {
  status: "failed";
  reason: "http_error";
  statusCode?: number;
  raw: string;
};

export type CovalentContextResult =
  | CovalentFetchedResult
  | CovalentSkippedResult
  | CovalentFailedResult;

export const fetchCovalentContext = async (payload: Record<string, unknown>) => {
  const endpoint = process.env.COVALENT_MARKET_CONTEXT_ENDPOINT;
  if (!endpoint) {
    return { status: "skipped", reason: "missing_endpoint" } as CovalentSkippedResult;
  }

  const apiKey = process.env.COVALENT_API_KEY;
  const response = await postJson(
    endpoint,
    payload,
    apiKey ? { authorization: `Bearer ${apiKey}` } : undefined
  );

  if (!response.statusCode || response.statusCode < 200 || response.statusCode >= 300) {
    return {
      status: "failed",
      reason: "http_error",
      statusCode: response.statusCode,
      raw: response.data
    } as CovalentFailedResult;
  }

  const snapshotHash = hashValue({ payload, response: response.data });

  return {
    status: "fetched",
    statusCode: response.statusCode,
    snapshotHash,
    raw: response.data
  } as CovalentFetchedResult;
};

export const computeSnapshotHash = (payload: Record<string, unknown>, raw: string) => {
  return hashValue({ payload, response: raw });
};
