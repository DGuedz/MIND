import crypto from "node:crypto";

const STATE_TTL_MS = 10 * 60 * 1000;

function base64UrlEncode(value) {
  return Buffer.from(value).toString("base64url");
}

function base64UrlDecode(value) {
  return Buffer.from(value, "base64url").toString("utf8");
}

function getStateSecret() {
  return process.env.GITHUB_OAUTH_STATE_SECRET || process.env.GITHUB_OAUTH_CLIENT_SECRET;
}

export function getBaseUrl(req) {
  const proto = req.headers["x-forwarded-proto"] || "https";
  const host = req.headers["x-forwarded-host"] || req.headers.host;
  return `${proto}://${host}`;
}

export function getRedirectUri(req) {
  return process.env.GITHUB_OAUTH_REDIRECT_URI || `${getBaseUrl(req)}/api/github/oauth/callback`;
}

export function signState(payload) {
  const secret = getStateSecret();
  if (!secret) throw new Error("MISSING_STATE_SECRET");

  const body = base64UrlEncode(JSON.stringify({ ...payload, issuedAt: Date.now() }));
  const sig = crypto.createHmac("sha256", secret).update(body).digest("base64url");
  return `${body}.${sig}`;
}

export function verifyState(state) {
  const secret = getStateSecret();
  if (!secret || !state || !state.includes(".")) return null;

  const [body, sig] = state.split(".");
  const expected = crypto.createHmac("sha256", secret).update(body).digest("base64url");
  if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null;

  try {
    const payload = JSON.parse(base64UrlDecode(body));
    if (!payload.issuedAt || Date.now() - payload.issuedAt > STATE_TTL_MS) return null;
    return payload;
  } catch {
    return null;
  }
}

export function redirect(res, location, status = 302) {
  res.statusCode = status;
  res.setHeader("Location", location);
  res.end();
}
