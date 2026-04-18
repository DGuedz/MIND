import { config } from "dotenv";
config({ override: true });
const token = process.env.TELEGRAM_BOT_TOKEN;
const url = process.env.APPROVAL_GATEWAY_PUBLIC_URL;

if (!token) {
  console.error("❌ TELEGRAM_BOT_TOKEN não está definido no .env");
  process.exit(1);
}

if (!url) {
  console.error("❌ APPROVAL_GATEWAY_PUBLIC_URL não está definido no .env");
  process.exit(1);
}

const webhookUrl = `${url.replace(/\/$/, "")}/v1/approvals/telegram/webhook`;

fetch(`https://api.telegram.org/bot${token}/setWebhook?url=${encodeURIComponent(webhookUrl)}`)
  .then((res) => res.json())
  .then(data => {
    if (data.ok) {
      console.log(`\n✅ Webhook configurado com sucesso para: ${webhookUrl}`);
      return fetch(`https://api.telegram.org/bot${token}/getWebhookInfo`).then((res) => res.json());
    } else {
      console.error(`\n❌ Falha ao configurar webhook:`, data);
      process.exit(1);
    }
  })
  .then((info) => {
    if (!info?.ok) {
      console.error("\n❌ Não foi possível validar o webhook via getWebhookInfo:", info);
      process.exit(1);
    }
    console.log(`🔎 Webhook ativo no Telegram: ${info.result?.url ?? "(vazio)"}\n`);
  })
  .catch((error) => {
    console.error("\n❌ Erro ao configurar/validar webhook:", error);
    process.exit(1);
  });
