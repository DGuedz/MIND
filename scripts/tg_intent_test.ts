import { postJson } from "../services/approval-gateway-service/src/notifications/http.js";
import * as dotenv from "dotenv";
import { execSync } from "child_process";

dotenv.config();

const TOKEN = process.env.TELEGRAM_BOT_TOKEN;

if (!TOKEN) {
  console.error("❌ TELEGRAM_BOT_TOKEN não encontrado no .env");
  process.exit(1);
}

const TELEGRAM_API = `https://api.telegram.org/bot${TOKEN}`;

async function getChatId() {
  console.log("⏳ Buscando seu Chat ID no Telegram...");
  console.log("👉 Por favor, envie uma mensagem (ex: /start ou Oi) para o seu bot no Telegram (@Mind_Agent_Protocol_bot)");
  
  let lastUpdateId = 0;
  
  while (true) {
    try {
      const response = await fetch(`${TELEGRAM_API}/getUpdates?offset=${lastUpdateId}&timeout=10`);
      const data = await response.json();
      
      if (data.ok && data.result.length > 0) {
        for (const update of data.result) {
          lastUpdateId = update.update_id + 1;
          if (update.message && update.message.chat) {
            return update.message.chat.id;
          }
        }
      }
    } catch (e) {
      console.error("Erro ao buscar atualizações:", e);
    }
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
}

async function sendIntent(chatId: number) {
  const intentId = `MIND-INTENT-${Math.floor(Math.random() * 10000)}`;
  console.log(`\n📤 Enviando Intent de Aprovação (${intentId}) para o seu Telegram...`);
  
  const text = `🚨 *Aprovação Necessária*\n\n` +
               `*Agente:* NoahAI / Scan\n` +
               `*Ação:* Comprar 10 SOL\n` +
               `*Motivo:* Oportunidade de Arbitragem (Spread 2.4%)\n` +
               `*Valor:* ~ $920 USD\n\n` +
               `Deseja autorizar esta execução on-chain?`;

  const keyboard = {
    inline_keyboard: [
      [
        { text: "✅ Aprovar e Liquidar", callback_data: `approve:${intentId}` },
        { text: "❌ Rejeitar", callback_data: `reject:${intentId}` }
      ]
    ]
  };

  await fetch(`${TELEGRAM_API}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text: text,
      parse_mode: "Markdown",
      reply_markup: keyboard
    })
  });
  
  console.log("✅ Mensagem enviada! Verifique seu Telegram e clique em Aprovar.");
  return intentId;
}

async function waitForApproval(intentId: string) {
  console.log("⏳ Aguardando sua decisão no Telegram...");
  let lastUpdateId = 0;
  
  while (true) {
    try {
      const response = await fetch(`${TELEGRAM_API}/getUpdates?offset=${lastUpdateId}&timeout=10`);
      const data = await response.json();
      
      if (data.ok && data.result.length > 0) {
        for (const update of data.result) {
          lastUpdateId = update.update_id + 1;
          if (update.callback_query) {
            const callbackData = update.callback_query.data;
            const queryId = update.callback_query.id;
            
            // Responder ao callback para tirar o "reloginho" do botão
            await fetch(`${TELEGRAM_API}/answerCallbackQuery`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ callback_query_id: queryId, text: "Decisão Registrada pelo MIND!" })
            });

            if (callbackData === `approve:${intentId}`) {
              console.log("\n✅ INTENT APROVADA PELO HUMANO NO TELEGRAM!");
              return true;
            } else if (callbackData === `reject:${intentId}`) {
              console.log("\n❌ INTENT REJEITADA PELO HUMANO.");
              return false;
            }
          }
        }
      }
    } catch (e) {
      console.error("Erro ao buscar callback:", e);
    }
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
}

async function runDemo() {
  console.log("🤖 Iniciando Fluxo Human-in-the-Loop (Telegram) -> Solana\n");
  
  // 0. Desativar webhook temporariamente para permitir polling local
  console.log("🔄 Limpando webhooks antigos para teste local...");
  await fetch(`${TELEGRAM_API}/deleteWebhook`);

  // 1. Pegar Chat ID
  const chatId = await getChatId();
  console.log(`✅ Chat ID encontrado: ${chatId}`);
  
  // 2. Enviar a mensagem com botões
  const intentId = await sendIntent(chatId);
  
  // 3. Aguardar o clique do usuário
  const approved = await waitForApproval(intentId);
  
  // 4. Se aprovado, rodar o script de liquidação/prova!
  if (approved) {
    console.log("\n🚀 Acionando a camada de Liquidação Atômica (Solana)...");
    try {
      // Chama o nosso script de prova que usa o dinheiro real
      execSync("npx tsx scripts/mint_proof.ts", { stdio: "inherit" });
    } catch (e) {
      console.error("Erro ao executar liquidação:", e);
    }
  } else {
    console.log("🛑 Execução cancelada com segurança.");
  }
}

runDemo().catch(console.error);
