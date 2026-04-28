import { getBaseUrl, getRedirectUri, redirect, verifyState } from "./shared.js";

async function exchangeCode(req, code) {
  const response = await fetch("https://github.com/login/oauth/access_token", {
    method: "POST",
    headers: {
      accept: "application/json",
      "content-type": "application/json"
    },
    body: JSON.stringify({
      client_id: process.env.GITHUB_OAUTH_CLIENT_ID,
      client_secret: process.env.GITHUB_OAUTH_CLIENT_SECRET,
      code,
      redirect_uri: getRedirectUri(req)
    })
  });

  if (!response.ok) {
    throw new Error(`GITHUB_TOKEN_EXCHANGE_${response.status}`);
  }

  const payload = await response.json();
  if (!payload.access_token) {
    throw new Error(payload.error || "MISSING_ACCESS_TOKEN");
  }

  return payload.access_token;
}

async function fetchGithubUser(accessToken) {
  const response = await fetch("https://api.github.com/user", {
    headers: {
      accept: "application/vnd.github+json",
      authorization: `Bearer ${accessToken}`,
      "user-agent": "mind-builder-oauth"
    }
  });

  if (!response.ok) {
    throw new Error(`GITHUB_USER_${response.status}`);
  }

  return response.json();
}

export default async function handler(req, res) {
  const requestUrl = new URL(req.url, getBaseUrl(req));
  const code = requestUrl.searchParams.get("code");
  const state = verifyState(requestUrl.searchParams.get("state"));

  if (!code || !state) {
    redirect(res, "/contribute?github_error=invalid_oauth_state");
    return;
  }

  try {
    const accessToken = await exchangeCode(req, code);
    const user = await fetchGithubUser(accessToken);
    const campaignCode = state.campaignCode || "THEGARAGE";
    const next = state.next || "marketplace";

    const returnTo = state.returnTo === "register" ? "register" : "contribute";
    const target = new URL(`/${returnTo}`, getBaseUrl(req));
    target.searchParams.set("code", campaignCode);
    target.searchParams.set("next", next);
    target.searchParams.set("github_connected", "1");
    target.searchParams.set("github_login", user.login);
    target.searchParams.set("github_id", String(user.id));
    if (user.avatar_url) target.searchParams.set("github_avatar", user.avatar_url);

    redirect(res, `${target.pathname}${target.search}`);
  } catch (error) {
    const campaignCode = state.campaignCode || "THEGARAGE";
    const next = state.next || "marketplace";
    const returnTo = state.returnTo === "register" ? "register" : "contribute";
    redirect(res, `/${returnTo}?code=${encodeURIComponent(campaignCode)}&next=${encodeURIComponent(next)}&github_error=oauth_failed`);
  }
}
