import { postJson, getJson } from "../apps/api-gateway/src/http.js";

const A2A_SERVICE_URL = "http://localhost:3008";
const API_GATEWAY_URL = "http://localhost:3000";

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function runRealTelegramTest() {
  console.log("============================================");
  console.log("🚀 Iniciando Teste Real: Telegram HITL -> A2A Server");
  console.log("============================================\n");

  const chatId = process.env.TEST_TG_CHAT_ID;
  if (!chatId) {
    console.error("❌ ERRO: TEST_TG_CHAT_ID não definido. Pegue seu Chat ID usando 'pnpm exec tsx scripts/get_tg_chat_id.ts' e defina a variável no seu terminal ou .env.");
    process.exit(1);
  }

  try {
    // Passo 1: Client Agent cria um Contexto
    console.log("1️⃣  [Client Agent] Solicitando abertura de Contexto A2A...");
    const contextRes = await postJson<{ contextId: string; status: string }>(`${A2A_SERVICE_URL}/v1/a2a/contexts`, {
      intentId: `hedge_demo_${Date.now()}`,
      initiatorAgentId: "client_fund_A",
      expiresAt: new Date(Date.now() + 3600000).toISOString()
    }, { Authorization: "Bearer MIND_INSTITUTIONAL_ADMIN" });
    
    const contextId = contextRes.data.contextId;
    console.log(`✅ Contexto Criado: ${contextId}`);

    // Passo 2: Orchestrator cria uma Task de execução
    console.log("\n2️⃣  [Orchestrator] Criando Task para execução do Swap de 50 SOL (Gatilho de HITL)...");
    const taskRes = await postJson<{ taskId: string; status: string }>(`${A2A_SERVICE_URL}/v1/a2a/contexts/${contextId}/tasks`, {
      executorAgentId: "mind_execution_agent",
      payload: {
        action: "SWAP",
        assetIn: "SOL",
        assetOut: "USDC",
        amount: 50
      }
    }, { Authorization: "Bearer MIND_INSTITUTIONAL_ADMIN" });

    const taskId = taskRes.data.taskId;
    console.log(`✅ Task Criada: ${taskId}`);

    // Passo 3: IntentFirewall bloqueando a Task e pedindo HITL real
    console.log("\n3️⃣  [IntentFirewall] Redirecionando para Telegram do Usuário Real...");
    const approvalReq = await postJson<{ approvalId: string }>(`${API_GATEWAY_URL}/v1/intents/request`, {
      intentId: `hedge_demo_${Date.now()}`,
      contextId: contextId,
      taskId: taskId,
      channel: "telegram",
      requesterId: chatId,
      action: "Swap 50 SOL to USDC"
    });

    const approvalId = approvalReq.data.approvalId;
    console.log(`✅ Pedido de Aprovação Enviado para o seu Telegram! Verifique o bot.`);
    console.log(`⏳ Aguardando você clicar em "✅ Aprovar" ou "❌ Rejeitar" no Telegram...`);

    // Poll for status change
    let status = "open";
    while (status === "open") {
      await sleep(2000);
      const timelineRes = await getJson<{ status: string }>(`${A2A_SERVICE_URL}/v1/a2a/contexts/${contextId}/timeline`, {
        Authorization: "Bearer MIND_INSTITUTIONAL_ADMIN"
      });
      status = timelineRes.data.status;
      process.stdout.write(".");
    }

    console.log(`\n\n============================================`);
    console.log(`🎯 STATUS FINAL DO CONTEXTO: ${status.toUpperCase()}`);
    console.log(`============================================`);
    
    if (status === "accepted") {
      console.log("✅ SUCESSO ABSOLUTO! A sua aprovação via Telegram alterou o estado final no A2A.");
    } else if (status === "cancelled") {
      console.log("🚫 REJEITADO! A operação foi cancelada pela sua rejeição.");
    } else {
      console.log(`⚠️ Status desconhecido: ${status}`);
    }

  } catch (error: any) {
    console.error("\n❌ Erro durante o teste real:", error.message || error);
    if (error.body) console.error("Detalhes:", error.body);
  }
}

runRealTelegramTest();