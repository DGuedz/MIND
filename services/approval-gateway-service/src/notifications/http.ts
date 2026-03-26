import http from "node:http";
import https from "node:https";

export const postJson = async (url: string, body: unknown, headers?: Record<string, string>) => {
  const payload = JSON.stringify(body);
  const target = new URL(url);
  const client = target.protocol === "https:" ? https : http;

  return new Promise<{ statusCode?: number; data: string }>((resolve, reject) => {
    const req = client.request(
      {
        method: "POST",
        hostname: target.hostname,
        port: target.port ? Number(target.port) : target.protocol === "https:" ? 443 : 80,
        path: `${target.pathname}${target.search}`,
        headers: {
          "content-type": "application/json",
          "content-length": Buffer.byteLength(payload).toString(),
          ...headers
        }
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

    req.on("error", reject);
    req.write(payload);
    req.end();
  });
};
