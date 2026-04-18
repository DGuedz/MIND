import { postJson, getJson } from "./http.js";

export const registerAgentOnchain = async (agent: {
  name: string;
  role: string;
  wallet: string;
  capabilities: string[];
  policyId?: string;
}) => {
  const endpoint = process.env.METAPLEX_REGISTRY_ENDPOINT;
  if (!endpoint) {
    return { status: "skipped" as const };
  }

  const auth = process.env.METAPLEX_REGISTRY_AUTH;
  const response = await postJson(
    endpoint,
    {
      agent
    },
    auth ? { authorization: `Bearer ${auth}` } : undefined
  );

  return { status: "submitted" as const, statusCode: response.statusCode, raw: response.data };
};

export const fetchAgentOnchain = async (agentId: string) => {
  const endpoint = process.env.METAPLEX_REGISTRY_ENDPOINT;
  if (!endpoint) {
    return { status: "skipped" as const };
  }

  const auth = process.env.METAPLEX_REGISTRY_AUTH;
  const url = endpoint.includes("?") ? `${endpoint}&agentId=${agentId}` : `${endpoint}?agentId=${agentId}`;
  const response = await getJson(url, auth ? { authorization: `Bearer ${auth}` } : undefined);

  return { status: "fetched" as const, statusCode: response.statusCode, raw: response.data };
};
