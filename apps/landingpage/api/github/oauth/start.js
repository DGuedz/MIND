import { getBaseUrl, getRedirectUri, redirect, signState } from "./shared.js";

const VALID_CODES = new Set(["THEGARAGE", "SUPERTEAMBR", "COLOSSEUM"]);

export default async function handler(req, res) {
  const clientId = process.env.GITHUB_OAUTH_CLIENT_ID;
  const clientSecret = process.env.GITHUB_OAUTH_CLIENT_SECRET;

  const requestUrl = new URL(req.url, getBaseUrl(req));
  const campaignCode = requestUrl.searchParams.get("code")?.toUpperCase() || "THEGARAGE";
  const next = requestUrl.searchParams.get("next") || "marketplace";
  const returnTo = requestUrl.searchParams.get("return_to") === "register" ? "register" : "contribute";

  if (!clientId || !clientSecret) {
    redirect(res, `/${returnTo}?code=${encodeURIComponent(campaignCode)}&next=${encodeURIComponent(next)}&github_error=oauth_not_configured`);
    return;
  }

  const safeCode = VALID_CODES.has(campaignCode) ? campaignCode : "THEGARAGE";
  const state = signState({
    campaignCode: safeCode,
    next,
    returnTo
  });

  const githubUrl = new URL("https://github.com/login/oauth/authorize");
  githubUrl.searchParams.set("client_id", clientId);
  githubUrl.searchParams.set("redirect_uri", getRedirectUri(req));
  githubUrl.searchParams.set("scope", "read:user user:email");
  githubUrl.searchParams.set("state", state);
  githubUrl.searchParams.set("allow_signup", "true");

  redirect(res, githubUrl.toString());
}
