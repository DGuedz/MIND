import { postJson } from "../apps/api-gateway/src/http.js";
import { config } from "dotenv";

config();

async function triggerManual() {
  const chatId = process.env.TEST_TG_CHAT_ID || "913039626"; // Seu Chat ID do Telegram

  console.log(`\n🚀 Disparando pedido manual de aprovação para o Chat ID: ${chatId}...`);

  try {
    const res = await postJson<{ approvalId: string }>("http://localhost:3000/v1/intents/request", {
      intentId: `manual_test_${Date.now()}`,
      channel: "telegram",
      requesterId: chatId,
      action: "Testando fluxo manual (100 SOL to USDC)"
    });

    console.log(`\n✅ Pedido enviado com sucesso!`);
    console.log(`Approval ID: ${res.data.approvalId}`);
    console.log(`\n📱 Verifique o seu Telegram. O bot deve ter mandado uma mensagem com os botões.`);
    console.log(`Você pode clicar em "Aprovar" ou "Rejeitar" pelo celular e acompanhar os logs no terminal dos serviços.`);
  } catch (e: any) {
    console.error("\n❌ Falha ao enviar o pedido manual.");
    console.error(e.message || e);
    console.log("\nCertifique-se de que 'pnpm run dev:services' está rodando em outro terminal.");
  }
}

triggerManual();