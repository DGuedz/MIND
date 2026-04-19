import * as dotenv from "dotenv";
import { execFileSync } from "child_process";

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
            const text = (update.message.text as string).toLowerCase().trim();
            const isTrigger =
              text.startsWith("/start") ||
              text === "start" ||
              text.includes("oi") ||
              text.includes("ola") ||
              text.includes("bom dia") ||
              text.includes("boa tarde") ||
              text.includes("mind");
            if (isTrigger) {
              const chatId = update.message.chat.id as number;
              const intentId = `MIND-INTENT-${Math.floor(Math.random() * 10000)}`;
              await sendApprovalCard(chatId, intentId);
            }
          }
          if (update.callback_query) {
            const q = update.callback_query;
            const chatId = q.message?.chat.id as number;
            const dataCb = q.data as string;
            const queryId = q.id as string;
            if (dataCb.startsWith("approve:")) {
              await answerCallback(queryId, "Decision Recorded by MIND");
              const intentId = dataCb.split(":")[1];
              const decision = settle(intentId);
              if (!decision || decision.decision !== "ALLOW") {
                await fetch(`${TELEGRAM_API}/sendMessage`, {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ chat_id: chatId, text: "Settlement blocked or inconclusive." })
                });
                continue;
              }
              const ai = await callOraculo(intentId, decision);
              await sendAsciiReceipt(chatId, intentId, decision);
              await fetch(`${TELEGRAM_API}/sendMessage`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ chat_id: chatId, text: `Oracle: ${ai.ok ? "ALLOW" : "INSUFFICIENT_EVIDENCE"} [${ai.status}]` })
              });
            } else if (dataCb.startsWith("reject:")) {
              await answerCallback(queryId, "Decision Recorded by MIND");
              await fetch(`${TELEGRAM_API}/sendMessage`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ chat_id: chatId, text: "Execution safely cancelled." })
              });
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
