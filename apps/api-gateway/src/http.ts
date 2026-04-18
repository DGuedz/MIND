import http from "node:http";
import https from "node:https";

export class HttpRequestError extends Error {
  readonly statusCode?: number;
  readonly body: string;
  readonly method: "GET" | "POST";
  readonly url: string;

  constructor(input: { method: "GET" | "POST"; url: string; statusCode?: number; body: string }) {
    super(`http_request_failed ${input.method} ${input.url} (${input.statusCode ?? "unknown"})`);
    this.name = "HttpRequestError";
    this.statusCode = input.statusCode;
    this.body = input.body;
    this.method = input.method;
    this.url = input.url;
  }
}

const parseJson = <T>(raw: string, method: "GET" | "POST", url: string): T => {
  if (!raw) {
    return {} as T;
  }
  try {
    return JSON.parse(raw) as T;
  } catch (error) {
    throw new Error(`invalid_json_response ${method} ${url}`);
  }
};

export const postJson = async <T>(url: string, body: unknown, headers?: Record<string, string>) => {
  const payload = JSON.stringify(body);
  const target = new URL(url);
  const client = target.protocol === "https:" ? https : http;

  return new Promise<{ statusCode?: number; data: T }>((resolve, reject) => {
    const req = client.request(
      {
        method: "POST",
        hostname: target.hostname,
        port: target.port ? Number(target.port) : target.protocol === "https:" ? 443 : 80,
        path: `${target.pathname}${target.search}`,
        headers: {
          "content-type": "application/json",
          "content-length": Buffer.byteLength(payload).toString(),
          "Bypass-Tunnel-Reminder": "true",
          ...headers
        }
      },
      (res) => {
        let data = "";
        res.on("data", (chunk) => {
          data += chunk.toString();
        });
        res.on("end", () => {
          if ((res.statusCode ?? 500) >= 400) {
            return reject(
              new HttpRequestError({
                method: "POST",
                url,
                statusCode: res.statusCode,
                body: data
              })
            );
          }
          const parsed = parseJson<T>(data, "POST", url);
          resolve({ statusCode: res.statusCode, data: parsed });
        });
      }
    );

    req.on("error", reject);
    req.write(payload);
    req.end();
  });
};

export const getJson = async <T>(url: string, headers?: Record<string, string>) => {
  const target = new URL(url);
  const client = target.protocol === "https:" ? https : http;

  return new Promise<{ statusCode?: number; data: T }>((resolve, reject) => {
    const req = client.request(
      {
        method: "GET",
        hostname: target.hostname,
        port: target.port ? Number(target.port) : target.protocol === "https:" ? 443 : 80,
        path: `${target.pathname}${target.search}`,
        headers: {
          "content-type": "application/json",
          ...headers
        }
      },
      (res) => {
        let data = "";
        res.on("data", (chunk) => {
          data += chunk.toString();
        });
        res.on("end", () => {
          if ((res.statusCode ?? 500) >= 400) {
            return reject(
              new HttpRequestError({
                method: "GET",
                url,
                statusCode: res.statusCode,
                body: data
              })
            );
          }
          const parsed = parseJson<T>(data, "GET", url);
          resolve({ statusCode: res.statusCode, data: parsed });
        });
      }
    );

    req.on("error", reject);
    req.end();
  });
};
