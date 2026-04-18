import { config } from "dotenv";
config();
const token = process.env.TELEGRAM_BOT_TOKEN;
fetch(`https://api.telegram.org/bot${token}/getUpdates`)
  .then(res => res.json())
  .then(data => {
    if (data.ok && data.result.length > 0) {
      const last = data.result[data.result.length - 1];
      const chatId = last.message?.chat?.id || last.callback_query?.message?.chat?.id;
      console.log(`\n✅ Chat ID encontrado: ${chatId}\n`);
    } else {
      console.log(`\n❌ Nenhum histórico encontrado. Mande um 'Oi' para @Mind_Agent_Protocol_bot no Telegram e rode esse script novamente.\n`);
    }
  });
