import { postJson } from "./http.js";

const buildKeyboard = (approvalId: string) => ({
  inline_keyboard: [
    [
      { text: "✅ Aprovar", callback_data: `approve:${approvalId}` },
      { text: "❌ Rejeitar", callback_data: `reject:${approvalId}` }
    ]
  ]
});

export const sendTelegramApproval = async (input: {
  approvalId: string;
  requesterId: string;
  summary: string;
}) => {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) {
    return { status: "skipped" as const };
  }

  const response = await postJson(`https://api.telegram.org/bot${token}/sendMessage`, {
    chat_id: input.requesterId,
    text: input.summary,
    reply_markup: buildKeyboard(input.approvalId)
  });

  return { status: "sent" as const, statusCode: response.statusCode };
};

export const answerTelegramCallback = async (input: {
  callbackQueryId: string;
  message?: string;
}) => {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) {
    return { status: "skipped" as const };
  }

  // Localtunnel exige o header "Bypass-Tunnel-Reminder" para não bloquear a resposta do webhook com uma tela de aviso html
  const response = await postJson(`https://api.telegram.org/bot${token}/answerCallbackQuery`, {
    callback_query_id: input.callbackQueryId,
    text: input.message ?? "Decisão registrada"
  });

  return { status: "sent" as const, statusCode: response.statusCode };
};
