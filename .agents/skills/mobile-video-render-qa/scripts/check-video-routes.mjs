#!/usr/bin/env node
import http from "node:http";
import https from "node:https";

const [base, ...paths] = process.argv.slice(2);
if (!base || paths.length === 0) {
  console.error("Usage: check-video-routes.mjs <base-url> <path> [path...]");
  process.exit(2);
}

function check(url) {
  return new Promise((resolve) => {
    const client = url.startsWith("https:") ? https : http;
    const req = client.request(url, { method: "HEAD", timeout: 5000 }, (res) => {
      res.resume();
      resolve({
        url,
        status: res.statusCode,
        contentType: res.headers["content-type"] || null,
        contentLength: res.headers["content-length"] || null,
      });
    });
    req.on("timeout", () => {
      req.destroy(new Error("timeout"));
    });
    req.on("error", (err) => {
      resolve({ url, status: null, error: err.message });
    });
    req.end();
  });
}

(async () => {
  const results = [];
  for (const path of paths) {
    const url = new URL(path, base).toString();
    results.push(await check(url));
  }
  console.log(JSON.stringify(results, null, 2));
  process.exit(results.every((r) => r.status && r.status >= 200 && r.status < 400) ? 0 : 1);
})();
