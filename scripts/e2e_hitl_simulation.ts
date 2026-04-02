import { postJson, getJson } from "../apps/api-gateway/src/http.js";

const A2A_SERVICE_URL = "http://localhost:3008";
const API_GATEWAY_URL = "http://localhost:3000";
const APPROVAL_GATEWAY_URL = "http://localhost:3003";

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function runE2ESimulation() {
  console.log("============================================");
  console.log("🚀 Iniciando Simulação E2E: Telegram HITL -> A2A Server");
  console.log("============================================\n");

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

    // Passo 3: Simulando o IntentFirewall bloqueando a Task e pedindo HITL
    console.log("\n3️⃣  [IntentFirewall] Violação de Limite (> 10 SOL). Redirecionando para Human-In-The-Loop...");
    const approvalReq = await postJson<{ approvalId: string }>(`${API_GATEWAY_URL}/v1/intents/request`, {
      intentId: `hedge_demo_${Date.now()}`,
      contextId: contextId,
      taskId: taskId,
      channel: "telegram",
      requesterId: process.env.TEST_TG_CHAT_ID || "admin_user_001",
      action: "Swap 50 SOL to USDC"
    });

    const approvalId = approvalReq.data.approvalId;
    console.log(`✅ Pedido de Aprovação Enviado para o Telegram! Approval ID: ${approvalId}`);

    await sleep(2000);

    // Passo 4: O Humano clica em "✅ Aprovar" no Telegram
    console.log("\n4️⃣  [Humano / Telegram] Usuário clicou em 'Aprovar' no chat do Telegram.");
    console.log("   -> Telegram dispara webhook para nosso Approval Gateway...");
    const webhookRes = await postJson<{ status: string; decision: string }>(`${APPROVAL_GATEWAY_URL}/v1/approvals/telegram/webhook`, {
      callback_query: {
        id: "mock_tg_callback_id",
        data: `approve:${approvalId}`
      }
    });

    console.log(`✅ Webhook processado. Decisão: ${webhookRes.data.decision}`);

    await sleep(1000);

    // Passo 5: Verificando o estado final do Contexto no A2A Server
    console.log("\n5️⃣  [Auditoria] Verificando o estado final do Contexto no A2A Server...");
    const timelineRes = await getJson<{ status: string; contextId: string; tasks: any[] }>(`${A2A_SERVICE_URL}/v1/a2a/contexts/${contextId}/timeline`, {
      Authorization: "Bearer MIND_INSTITUTIONAL_ADMIN"
    });

    console.log(`\n============================================`);
    console.log(`🎯 STATUS FINAL DO CONTEXTO: ${timelineRes.data.status.toUpperCase()}`);
    console.log(`============================================`);
    
    if (timelineRes.data.status === "accepted") {
      console.log("✅ SUCESSO ABSOLUTO! O fluxo HITL (Telegram -> Gateway -> A2A) funcionou perfeitamente e alterou o estado final da máquina.");
    } else {
      console.log("❌ FALHA: O contexto não mudou para 'accepted'. Algo deu errado na integração.");
    }

  } catch (error: any) {
    console.error("❌ Erro durante a simulação:", error.message || error);
    if (error.body) console.error("Detalhes:", error.body);
  }
}

runE2ESimulation();
