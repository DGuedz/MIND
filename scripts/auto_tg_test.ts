import { exec, spawn } from "child_process";
import fs from "fs";
import path from "path";
import { config } from "dotenv";

config();

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

async function run() {
  console.log("============================================");
  console.log("🚀 Iniciando Automação do Teste Telegram HITL");
  console.log("============================================\n");

  // 1. Pegar o Chat ID
  const token = process.env.TELEGRAM_BOT_TOKEN;
  let chatId = "";
  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/getUpdates`);
    const data = await res.json();
    if (data.ok && data.result.length > 0) {
      const last = data.result[data.result.length - 1];
      chatId = last.message?.chat?.id || last.callback_query?.message?.chat?.id;
    }
  } catch (e) {}

  if (!chatId) {
    console.error("❌ Não consegui achar seu Chat ID. Mande um 'Oi' para o bot (@Mind_Agent_Protocol_bot) e rode esse comando de novo.");
    process.exit(1);
  }
  console.log(`✅ [1/5] Chat ID encontrado: ${chatId}`);

  // 2. Iniciar Localtunnel
  console.log("🌐 [2/5] Iniciando túnel público (localtunnel)...");
  const lt = spawn("npx", ["localtunnel", "--port", "3003"], { stdio: ["ignore", "pipe", "pipe"] });
  
  let publicUrl = "";
  
  await new Promise<void>((resolve) => {
    lt.stdout.on("data", (data) => {
      const output = data.toString();
      const match = output.match(/your url is: (https:\/\/[^\s]+)/);
      if (match) {
        publicUrl = match[1];
        resolve();
      }
    });
  });

  console.log(`✅ Túnel ativo! URL: ${publicUrl}`);

  // 3. Atualizar .env com a URL
  const envPath = path.resolve(process.cwd(), ".env");
  let envContent = fs.readFileSync(envPath, "utf8");
  if (envContent.includes("APPROVAL_GATEWAY_PUBLIC_URL=")) {
    envContent = envContent.replace(/APPROVAL_GATEWAY_PUBLIC_URL=.*/, `APPROVAL_GATEWAY_PUBLIC_URL=${publicUrl}`);
  } else {
    envContent += `\nAPPROVAL_GATEWAY_PUBLIC_URL=${publicUrl}\n`;
  }
  fs.writeFileSync(envPath, envContent);

  // 4. Configurar Webhook no Telegram
  const hookRes = await fetch(`https://api.telegram.org/bot${token}/setWebhook?url=${publicUrl}/v1/approvals/telegram/webhook`);
  const hookData = await hookRes.json();
  if (hookData.ok) {
    console.log(`✅ [3/5] Webhook configurado no Telegram!`);
  } else {
    console.error(`❌ Erro ao configurar Webhook:`, hookData);
  }

  // 5. Matar serviços antigos e iniciar novos
  console.log("⚙️  [4/5] Reiniciando serviços de backend...");
  exec("killall node"); // Tentativa segura de matar antigos
  await sleep(2000);

  const services = spawn("pnpm", ["run", "dev:services"], { stdio: "ignore", detached: true });
  services.unref();

  console.log("⏳ Aguardando serviços subirem (15 segundos)...");
  await sleep(15000);

  // 6. Rodar o script E2E com o Chat ID
  console.log("\n🎬 [5/5] Executando fluxo E2E...");
  const e2e = spawn("pnpm", ["exec", "tsx", "scripts/e2e_real_telegram.ts"], {
    env: { ...process.env, TEST_TG_CHAT_ID: chatId.toString(), APPROVAL_GATEWAY_PUBLIC_URL: publicUrl },
    stdio: "inherit"
  });

  e2e.on("close", (code) => {
    console.log(`\n🛑 Teste finalizado. Desligando tudo...`);
    lt.kill();
    exec("killall node");
    process.exit(code || 0);
  });
}

run();