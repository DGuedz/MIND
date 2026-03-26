import { postJson } from "./http.js";

export const sendOpenClawApproval = async (input: {
  approvalId: string;
  intentId: string;
  requesterId: string;
  summary: string;
  decisionCallbackUrl: string;
}) => {
  const baseUrl = process.env.OPENCLAW_BASE_URL;
  const apiKey = process.env.OPENCLAW_API_KEY;
  if (!baseUrl || !apiKey) {
    return { status: "skipped" as const };
  }

  const response = await postJson(
    `${baseUrl.replace(/\/$/, "")}/v1/approvals/request`,
    {
      approvalId: input.approvalId,
      intentId: input.intentId,
      requesterId: input.requesterId,
      summary: input.summary,
      decisionCallbackUrl: input.decisionCallbackUrl
    },
    {
      authorization: `Bearer ${apiKey}`
    }
  );

  return { status: "sent" as const, statusCode: response.statusCode };
};
