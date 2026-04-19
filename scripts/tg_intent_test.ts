import * as dotenv from "dotenv";
import { execFileSync } from "child_process";

dotenv.config();

const TOKEN = process.env.TELEGRAM_BOT_TOKEN;

if (!TOKEN) {
  console.error("❌ TELEGRAM_BOT_TOKEN não encontrado no .env");
  process.exit(1);
}

const TELEGRAM_API = `https://api.telegram.org/bot${TOKEN}`;
const SETTLEMENT_WALLET = process.env.NOAHAI_SETTLEMENT_WALLET || "";
const OPENCLAW_ENDPOINT =
  process.env.OPENCLAW_INFERENCE_ENDPOINT ||
  `${process.env.OPENCLAW_BASE_URL || ""}`.replace(/\/$/, "") + "/inference" ||
  "http://localhost:3009/v1/inference";
const OPENCLAW_TIMEOUT_MS = Number(process.env.OPENCLAW_TIMEOUT_MS ?? "15000");

type DecisionContract = {
  decision: "ALLOW" | "BLOCK" | "INSUFFICIENT_EVIDENCE" | "NEEDS_HUMAN_APPROVAL";
  reason_codes: string[];
  confidence: number;
  assumptions: string[];
  required_followups: string[];
  evidence: string[];
  artifacts?: {
    txHash?: string;
    receiptHash?: string;
    metaplexProofTxHash?: string;
  };
};

const extractDecisionFromOutput = (raw: string): DecisionContract | null => {
  const lines = raw.split(/\r?\n/);
  const startLine = lines.findIndex((line) => line.trim().startsWith("{"));
  if (startLine < 0) return null;
  const candidate = lines.slice(startLine).join("\n").trim();
  try {
    return JSON.parse(candidate) as DecisionContract;
  } catch {
    return null;
  }
};

const callNoahAI = async (intentId: string, decision: DecisionContract) => {
  const apiKey = process.env.OPENCLAW_API_KEY;
  if (!apiKey) {
    return {
      decision: "INSUFFICIENT_EVIDENCE" as const,
      reason_codes: ["RC_MISSING_EVIDENCE"],
      evidence: ["OPENCLAW_API_KEY ausente."]
    };
  }
  // Se nenhum endpoint for configurado, usa o mock local de SSE/Oráculo

  const response = await fetch(OPENCLAW_ENDPOINT, {
    method: "POST",
    signal: AbortSignal.timeout(OPENCLAW_TIMEOUT_MS),
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      intentId,
      prompt: "Forneca um resumo curto de risco para a liquidacao x402 executada.",
      paymentProof: {
        txHash: decision.artifacts?.txHash,
        receiptHash: decision.artifacts?.receiptHash,
        metaplexProofTxHash: decision.artifacts?.metaplexProofTxHash
      }
    })
  });

  const raw = await response.text();
  return {
    decision: response.ok ? ("ALLOW" as const) : ("INSUFFICIENT_EVIDENCE" as const),
    reason_codes: response.ok ? [] : ["RC_TOOL_FAILURE"],
    evidence: [`openclaw.status=${response.status}`, raw.slice(0, 500)]
  };
};

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
      console.error("Erro ao buscar atualizações:", e instanceof Error ? e.message : String(e));
    }
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
}

async function sendIntent(chatId: number) {
  const intentId = `MIND-INTENT-${Math.floor(Math.random() * 10000)}`;
  console.log(`\n📤 Enviando Intent de Aprovação (${intentId}) para o seu Telegram...`);
  
  const text = `🚨 *Aprovação Necessária*\n\n` +
               `*Agente:* NoahAI / Scan\n` +
               `*Ação:* Pagamento x402 A2A (0.001 SOL)\n` +
               `*Motivo:* Inferência de Dados e Risco\n` +
               `*Recibo:* Metaplex Core cNFT\n\n` +
               `Deseja autorizar esta liquidação on-chain?`;

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
      console.error("Erro ao buscar callback:", e instanceof Error ? e.message : String(e));
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
    console.log("\n🚀 Acionando a camada de Liquidação Atômica x402 (Solana)...");
    try {
      const args = !SETTLEMENT_WALLET
        ? [
            "tsx",
            "scripts/a2a_payment.ts",
            "--mode=dry-run",
            "--amount=0.001",
            "--memo=MIND_x402_PAYMENT: AI inference service (demo)",
            `--intent-id=${intentId}`,
            "--target=11111111111111111111111111111111"
          ]
        : [
            "tsx",
            "scripts/a2a_payment.ts",
            "--mode=real",
            "--human-approved=true",
            "--amount=0.001",
            "--memo=MIND_x402_PAYMENT: AI inference service",
            `--intent-id=${intentId}`,
            `--target=${SETTLEMENT_WALLET}`
          ];

      const raw = execFileSync("npx", args, { encoding: "utf8" });

      const decision = extractDecisionFromOutput(raw);
      if (!decision) {
        console.error("❌ Falha ao interpretar resposta do a2a_payment.ts.");
        console.error(raw);
        return;
      }

      console.log("\n📋 Decisão x402:");
      console.log(JSON.stringify(decision, null, 2));

      if (decision.decision !== "ALLOW") {
        console.error("❌ Liquidação bloqueada ou inconclusiva.");
        return;
      }
      // Em modo dry-run, pode não haver txHash real; seguimos para o oráculo mock mesmo assim.

      const aiDecision = await callNoahAI(intentId, decision);
      console.log("\n🤖 Resultado OpenClaw/NoahAI:");
      console.log(JSON.stringify(aiDecision, null, 2));
    } catch (e) {
      console.error("Erro ao executar liquidação:", e instanceof Error ? e.message : String(e));
    }
  } else {
    console.log("🛑 Execução cancelada com segurança.");
  }
}

runDemo().catch(console.error);
