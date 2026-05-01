import * as dotenv from "dotenv";
import { execFileSync } from "child_process";
import { evaluateOperationIntent } from "./ops_orchestrator.js";

dotenv.config();

const TOKEN = process.env.TELEGRAM_BOT_TOKEN;
if (!TOKEN) {
  console.error("TELEGRAM_BOT_TOKEN ausente");
  process.exit(1);
}

const TELEGRAM_API = `https://api.telegram.org/bot${TOKEN}`;
const SETTLEMENT_WALLET = process.env.NOAHAI_SETTLEMENT_WALLET || "";
const OPENCLAW_ENDPOINT =
  process.env.OPENCLAW_INFERENCE_ENDPOINT ||
  `${process.env.OPENCLAW_BASE_URL || ""}`.replace(/\/$/, "") + "/inference" ||
  "http://localhost:3009/v1/inference";
const OPENCLAW_TIMEOUT_MS = Number(process.env.OPENCLAW_TIMEOUT_MS ?? "15000");
const TELEGRAM_ALLOW_GROUPS = process.env.TELEGRAM_ALLOW_GROUPS === "true";

type DecisionContract = {
  decision: "ALLOW" | "BLOCK" | "INSUFFICIENT_EVIDENCE" | "NEEDS_HUMAN_APPROVAL";
  reason_codes: string[];
  confidence: number;
  assumptions: string[];
  required_followups: string[];
  evidence: string[];
  artifacts?: { txHash?: string; receiptHash?: string; metaplexProofTxHash?: string };
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

const sendApprovalCard = async (chatId: number, intentId: string) => {
  const text =
    `🚨 Approval Required\n\n` +
    `Agent: NoahAI / Scan\n` +
    `Action: x402 A2A Payment (0.001 SOL)\n` +
    `Reason: Data Inference & Risk\n` +
    `Receipt: Metaplex Core cNFT\n\n` +
    `Do you want to authorize this on-chain settlement?`;
  const keyboard = { inline_keyboard: [[{ text: "✅ Approve & Settle", callback_data: `approve:${intentId}` }, { text: "❌ Reject", callback_data: `reject:${intentId}` }]] };
  await fetch(`${TELEGRAM_API}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text, reply_markup: keyboard })
  });
};

const answerCallback = async (callbackQueryId: string, text: string) => {
  await fetch(`${TELEGRAM_API}/answerCallbackQuery`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ callback_query_id: callbackQueryId, text })
  });
};

const sendMessage = async (chatId: number, text: string) => {
  await fetch(`${TELEGRAM_API}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text })
  });
};

const callOraculo = async (intentId: string, decision: DecisionContract) => {
  const apiKey = process.env.OPENCLAW_API_KEY || "demo";
  const response = await fetch(OPENCLAW_ENDPOINT, {
    method: "POST",
    signal: AbortSignal.timeout(OPENCLAW_TIMEOUT_MS),
    headers: { "content-type": "application/json", authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
        intentId,
        prompt: "Short risk summary for the executed x402 settlement.",
        paymentProof: { txHash: decision.artifacts?.txHash, receiptHash: decision.artifacts?.receiptHash, metaplexProofTxHash: decision.artifacts?.metaplexProofTxHash }
      })
  });
  const raw = await response.text();
  return { ok: response.ok, status: response.status, body: raw };
};

const sendAsciiReceipt = async (chatId: number, intentId: string, decision: DecisionContract) => {
  const tx = decision.artifacts?.txHash || "dry-run";
  const receipt = decision.artifacts?.receiptHash || "mock-receipt";
  const text =
    "================================\n" +
    "      MIND A2A RECEIPT      \n" +
    "================================\n" +
    "Status:   SUCCESS [x402]\n" +
    "Amount:   0.001 SOL\n" +
    "From:     MIND Treasury\n" +
    "To:       NoahAI\n" +
    `Hash:     ${tx}\n` +
    `Receipt:  ${receipt}\n` +
    "--------------------------------\n" +
    "✓ Policy Enforced\n" +
    "✓ Cryptographic Proof Generated\n" +
    "================================";
  await fetch(`${TELEGRAM_API}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: "Markdown" })
  });
};

const settle = (intentId: string) => {
  const args = !SETTLEMENT_WALLET
    ? ["tsx", "scripts/a2a_payment.ts", "--mode=dry-run", "--amount=0.001", "--memo=MIND_x402_PAYMENT: demo", `--intent-id=${intentId}`, "--target=11111111111111111111111111111111"]
    : ["tsx", "scripts/a2a_payment.ts", "--mode=real", "--human-approved=true", "--amount=0.001", "--memo=MIND_x402_PAYMENT: demo", `--intent-id=${intentId}`, `--target=${SETTLEMENT_WALLET}`];
  const raw = execFileSync("npx", args, { encoding: "utf8" });
  return extractDecisionFromOutput(raw);
};

async function main() {
  await fetch(`${TELEGRAM_API}/deleteWebhook`);
  let lastUpdateId = 0;
  while (true) {
    try {
      const r = await fetch(`${TELEGRAM_API}/getUpdates?offset=${lastUpdateId}&timeout=15`);
      const data = await r.json();
      if (data.ok && data.result.length > 0) {
        for (const update of data.result) {
          lastUpdateId = update.update_id + 1;
          if (update.message && update.message.text) {
            const chatId = update.message.chat.id as number;
            const chatType = String(update.message.chat.type ?? "private");
            const rawText = String(update.message.text || "").trim();
            const tokens = rawText.split(/\s+/).filter(Boolean);
            const command = (tokens[0] || "/status").toLowerCase();

            if (!TELEGRAM_ALLOW_GROUPS && (chatType === "group" || chatType === "supergroup")) {
              await sendMessage(chatId, "BLOCK: grupos desabilitados para operacao interna.");
              continue;
            }

            const decision = evaluateOperationIntent({
              channel: "telegram",
              actorId: `tg:${chatId}`,
              chatId: String(chatId),
              command,
              args: tokens.slice(1),
              metadata: { chatType }
            });

            if (decision.decision !== "ALLOW") {
              const reason = decision.reason_codes.join(",") || "n/a";
              await sendMessage(chatId, `Decision=${decision.decision}; reason_codes=${reason}`);
              continue;
            }

            if (command === "/status" || command === "/health") {
              await sendMessage(chatId, "status=ok; channel=telegram_internal; mode=guarded");
              continue;
            }

            if (command === "/hermes" || command === "/start") {
              const intentId = `MIND-INTENT-${Math.floor(Math.random() * 10000)}`;
              await sendApprovalCard(chatId, intentId);
              continue;
            }

            if (command === "/deploy_status") {
              await sendMessage(chatId, "deploy_status=gated; execute via Trae IDE com aprovacao humana");
              continue;
            }

            if (command === "/demo_secure_intent") {
              await sendMessage(chatId, "demo_secure_intent=ready; execute via Trae: pnpm demo:secure-intent");
              continue;
            }

            if (command === "/run_check") {
              const gate = tokens[1] || "event-router-service";
              await sendMessage(chatId, `run_check accepted; gate=${gate}; execute via Trae para evidencia completa`);
              continue;
            }
          }
          if (update.callback_query) {
            const q = update.callback_query;
            const chatId = q.message?.chat.id as number;
            const dataCb = q.data as string;
            const queryId = q.id as string;
            if (dataCb.startsWith("approve:")) {
              const policyDecision = evaluateOperationIntent({
                channel: "telegram",
                actorId: `tg:${chatId}`,
                chatId: String(chatId),
                command: "/approve",
                args: [dataCb.split(":")[1]]
              });
              if (policyDecision.decision !== "ALLOW") {
                await answerCallback(queryId, "Operacao bloqueada por policy");
                await sendMessage(chatId, `Decision=${policyDecision.decision}; reason_codes=${policyDecision.reason_codes.join(",") || "n/a"}`);
                continue;
              }
              await answerCallback(queryId, "Decision Recorded by MIND");
              const intentId = dataCb.split(":")[1];
              const settlementDecision = settle(intentId);
              if (!settlementDecision || settlementDecision.decision !== "ALLOW") {
                await sendMessage(chatId, "Settlement blocked or inconclusive.");
                continue;
              }
              const ai = await callOraculo(intentId, settlementDecision);
              await sendAsciiReceipt(chatId, intentId, settlementDecision);
              await sendMessage(chatId, `Oracle: ${ai.ok ? "ALLOW" : "INSUFFICIENT_EVIDENCE"} [${ai.status}]`);
            } else if (dataCb.startsWith("reject:")) {
              const decision = evaluateOperationIntent({
                channel: "telegram",
                actorId: `tg:${chatId}`,
                chatId: String(chatId),
                command: "/reject",
                args: [dataCb.split(":")[1]]
              });
              if (decision.decision !== "ALLOW") {
                await answerCallback(queryId, "Operacao bloqueada por policy");
                await sendMessage(chatId, `Decision=${decision.decision}; reason_codes=${decision.reason_codes.join(",") || "n/a"}`);
                continue;
              }
              await answerCallback(queryId, "Decision Recorded by MIND");
              await sendMessage(chatId, "Execution safely cancelled.");
            }
          }
        }
      }
    } catch (e) {
      console.error(e instanceof Error ? e.message : String(e));
    }
  }
}

main().catch(console.error);
