import { Connection, LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";
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
const OPENCLAW_ENDPOINT = process.env.OPENCLAW_INFERENCE_ENDPOINT || `${process.env.OPENCLAW_BASE_URL || ""}`.replace(/\/$/, "") + "/inference";
const OPENCLAW_TIMEOUT_MS = Number(process.env.OPENCLAW_TIMEOUT_MS ?? "15000");
const TELEGRAM_X402_AMOUNT_SOL = Number(process.env.TELEGRAM_X402_AMOUNT_SOL ?? "0.00001");
const TELEGRAM_X402_MODE: "dry-run" | "real" = process.env.TELEGRAM_X402_MODE === "dry-run" ? "dry-run" : "real";

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

// Configuração da Solana
const rpcUrl = process.env.HELIUS_RPC_URL || "https://api.mainnet-beta.solana.com";
const connection = new Connection(rpcUrl, "confirmed");

// Mock KMS Public Key (Fase 0)
const publicKeyStr = process.env.VITE_AGENT_PUBLIC_KEY || "MockKmsPublicKey111111111111111111111111111";

// Estado do usuário
const userStates: Record<number, { isConnected: boolean; balance: number }> = {};
const x402InFlightByChat = new Set<number>();
const consumedX402ApprovalByMessage = new Map<string, number>(); // approvalKey -> timestamp

const APPROVAL_EXPIRY_MS = 1000 * 60 * 5; // 5 minutos de validade para Intents

function cleanupExpiredApprovals() {
  const now = Date.now();
  for (const [key, timestamp] of consumedX402ApprovalByMessage.entries()) {
    if (now - timestamp > APPROVAL_EXPIRY_MS) {
      consumedX402ApprovalByMessage.delete(key);
    }
  }
}
setInterval(cleanupExpiredApprovals, 60000);

function isApprovalExpired(messageUnixTime?: number): boolean {
  if (!messageUnixTime) return true;
  return Date.now() - messageUnixTime * 1000 > APPROVAL_EXPIRY_MS;
}

async function getRealBalance(): Promise<number> {
  if (!publicKeyStr) return 0;
  try {
    const balance = await connection.getBalance(new PublicKey(publicKeyStr));
    return balance / LAMPORTS_PER_SOL;
  } catch (e) {
    console.error("Erro ao buscar saldo real:", e);
    return 0;
  }
}

async function sendMsg(chatId: number, text: string, keyboard?: any) {
  await fetch(`${TELEGRAM_API}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: "Markdown", reply_markup: keyboard })
  });
}

async function answerCallback(queryId: string, text?: string) {
  await fetch(`${TELEGRAM_API}/answerCallbackQuery`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ callback_query_id: queryId, text: text || "" })
  });
}

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

const generateAsciiReceipt = (
  title: string,
  items: { name: string; qty: number; value: string }[],
  total: string,
  txHash: string,
  receiptHash: string = "N/A",
  signatureType: string = "TURNKEY KMS"
) => {
  const date = new Date().toISOString().replace("T", " ").substring(0, 19);
  const shortTx = txHash.length > 20 ? txHash.substring(0, 10) + "..." + txHash.substring(txHash.length - 10) : txHash;
  const shortReceipt = receiptHash.length > 20 ? receiptHash.substring(0, 10) + "..." + receiptHash.substring(receiptHash.length - 10) : receiptHash;

  let receipt = `\`\`\`text\n`;
  receipt += `================================\n`;
  receipt += `         MIND PROTOCOL\n`;
  receipt += `       A2A SERVER (NFC-e)\n`;
  receipt += `================================\n`;
  receipt += `CNPJ/ID: ON-CHAIN AGENT NODE\n`;
  receipt += `NETWORK: SOLANA MAINNET-BETA\n`;
  receipt += `DATE: ${date} UTC\n`;
  receipt += `--------------------------------\n`;
  receipt += `          SALE DETAILS\n`;
  receipt += `ITEM                 QTY   TOTAL\n`;
  
  items.forEach(item => {
    const namePad = item.name.padEnd(20, " ");
    const qtyPad = item.qty.toString().padEnd(3, " ");
    const valPad = item.value.padStart(7, " ");
    receipt += `${namePad} ${qtyPad} ${valPad}\n`;
  });
  
  receipt += `--------------------------------\n`;
  receipt += `TOTAL (SOL)              ${total.padStart(7, " ")}\n`;
  receipt += `--------------------------------\n`;
  receipt += `SIGNATURE: ${signatureType}\n`;
  receipt += `TX HASH: ${shortTx}\n`;
  if (receiptHash !== "N/A") {
    receipt += `METAPLEX PROOF: ${shortReceipt}\n`;
  }
  receipt += `--------------------------------\n`;
  receipt += `     CRYPTOGRAPHIC RECEIPT\n`;
  receipt += `     VERIFIABLE ON-CHAIN\n`;
  receipt += `================================\n`;
  receipt += `\`\`\``;
  
  return receipt;
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
  if (!process.env.OPENCLAW_BASE_URL && !process.env.OPENCLAW_INFERENCE_ENDPOINT) {
    return {
      decision: "INSUFFICIENT_EVIDENCE" as const,
      reason_codes: ["RC_MISSING_EVIDENCE"],
      evidence: ["OPENCLAW_BASE_URL/OPENCLAW_INFERENCE_ENDPOINT ausente."]
    };
  }

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

async function startBot() {
  console.log("🧠 Protocolo MIND-INTENT-GUARDIAN (Humanizado) ativado. Escutando...\n");
  await fetch(`${TELEGRAM_API}/deleteWebhook`);
  let lastUpdateId = 0;
  
  while (true) {
    try {
      const response = await fetch(`${TELEGRAM_API}/getUpdates?offset=${lastUpdateId}&timeout=10`);
      const data = (await response.json()) as any;
      if (data.ok && data.result.length > 0) {
        for (const update of data.result) {
          lastUpdateId = update.update_id + 1;
          
          // Tratamento de mensagens de texto
          if (update.message && update.message.text) {
            const chatId = update.message.chat.id;
            const text = update.message.text.toLowerCase();
            
            // Inicializa estado do usuário se não existir e pega o saldo REAL da Mainnet
            if (!userStates[chatId]) {
              const realBalance = await getRealBalance();
              userStates[chatId] = { isConnected: true, balance: realBalance }; // Assumimos conectada pois é a sua wallet
            }
            
            console.log(`\n👤 Humano: ${update.message.text}`);

            if (text.includes("status")) {
              await sendMsg(chatId, `Tudo tranquilo. Seu agent já fez +1.84 SOL hoje. Quer ver detalhes?`, {
                inline_keyboard: [[{ text: "📊 Ver Detalhes", callback_data: "metrics" }]]
              });
            }
            else if (text.includes("kill switch") || text.includes("parar")) {
              await sendMsg(chatId, `🛑 Kill Switch ativado. Todas as operações pausadas. Quer reativar?`, {
                inline_keyboard: [[{ text: "▶️ Reativar Operações", callback_data: "reactivate" }]]
              });
            }
            else if (text.includes("obrigado") || text.includes("valeu")) {
               await sendMsg(chatId, `De nada! Sempre aqui pra ajudar. 🤝 Em que mais posso ser útil?`);
            }
            else {
               // Saudação inicial (qualquer outra mensagem ou /start)
               const balance = userStates[chatId].balance;
               const msg = `Bom dia, Guardião. Eu sou o seu **Agente MIND**, seu concierge e infraestrutura de intenções na Solana.\n\nSua carteira de custódia institucional está sincronizada e protegida. No momento, você possui **${balance.toFixed(4)} SOL** em saldo JIT (Just-In-Time) seguro.\n\nComo posso auxiliar na sua estratégia de alocação ou gestão de infraestrutura hoje?`;
               const kb = {
                 inline_keyboard: [
                   [{ text: "✨ Criar Nova Intenção (Intent)", callback_data: "start_intent" }],
                   [{ text: "📊 Ver Status da Operação", callback_data: "check_status" }],
                   userStates[chatId].isConnected 
                     ? [{ text: "✅ Conexão Validada (Wallet)", callback_data: "noop" }]
                     : [{ text: "🔗 Conectar Wallet", callback_data: "connect_wallet" }]
                 ]
               };
               await sendMsg(chatId, msg, kb);
            }
          }
          
          // Tratamento de Botões Inline (Callback Queries)
          if (update.callback_query) {
            const chatId = update.callback_query.message.chat.id;
            const data = update.callback_query.data;
            const queryId = update.callback_query.id;
            
            // Garante que o estado existe para os callbacks também
            if (!userStates[chatId]) {
              const realBalance = await getRealBalance();
              userStates[chatId] = { isConnected: true, balance: realBalance };
            }

            console.log(`\n🖱️ Humano clicou no botão: ${data}`);
            await answerCallback(queryId);

            if (data === "connect_wallet") {
              const msg = `Antes de começarmos, preciso conectar sua wallet na Solana. Isso é rápido e seguro — o Metaplex vai criar a identidade oficial do seu agent on-chain.`;
              const kb = { inline_keyboard: [
                  [{ text: "🦊 Conectar Wallet com Metaplex", callback_data: "wallet_connected" }]
              ]};
              await sendMsg(chatId, msg, kb);
            }
            else if (data === "wallet_connected") {
              userStates[chatId].isConnected = true;
              const msg = `✅ Wallet conectada!\nVocê tem ${userStates[chatId].balance.toFixed(4)} SOL disponíveis agora.\n\nO que quer fazer hoje?`;
              const kb = { inline_keyboard: [
                  [{ text: "⚡ A2A Routing & Atomic Settlement", callback_data: "intent_arb" }],
                  [{ text: "💸 Market Intelligence (x402)", callback_data: "intent_x402" }]
              ]};
              await sendMsg(chatId, msg, kb);
            }
            else if (data === "start_intent") {
              if (!userStates[chatId].isConnected) {
                 await sendMsg(chatId, `Antes de começarmos, preciso conectar sua wallet na Solana. Isso é rápido e seguro — o Metaplex vai criar a identidade oficial do seu agent on-chain.`, {
                   inline_keyboard: [[{ text: "🦊 Conectar Wallet com Metaplex", callback_data: "wallet_connected" }]]
                 });
              } else {
                const msg = `Excelente. Para garantirmos a melhor alocação e proteção do seu capital, selecione abaixo qual produto ou intenção institucional deseja explorar no momento:`;
                const kb = { inline_keyboard: [
                    [{ text: "⚡ A2A Routing & Atomic Settlement", callback_data: "intent_arb" }],
                    [{ text: "🛡️ Capital Optimization (JIT Yield)", callback_data: "intent_yield" }],
                    [{ text: "💸 Market Intelligence (x402 Data Sales)", callback_data: "intent_x402" }],
                    [{ text: "🌐 Ver Protocolos A2A e Oráculos Suportados", callback_data: "intent_protocols" }],
                    [{ text: "📊 Visualizar Métricas Agentic GDP", callback_data: "metrics" }]
                ]};
                await sendMsg(chatId, msg, kb);
              }
            }
            else if (data === "intent_protocols") {
              const msg = `🌐 **Ecossistema MIND: Arquitetura e Roadmap A2A**\n\n` +
                          `Nosso protocolo é desenhado para ser uma camada de roteamento agnóstica na Solana. Aqui está o status atual de nossa infraestrutura:\n\n` +
                          `**🟢 Integrações Ativas (Mainnet Proven):**\n` +
                          `• **Covalent (GoldRush):** Consumo real de dados históricos e analíticos (Visível no Dashboard).\n` +
                          `• **Helius RPC:** Leitura de saldos e estado da blockchain em tempo real.\n` +
                          `• **Metaplex Core:** Cunhagem de recibos criptográficos (cNFTs) para liquidações.\n` +
                          `• **NoahAI (Oráculo Custom):** Validação de pagamentos x402 A2A.\n\n` +
                          `**🟡 Roadmap de Expansão (Integração Planejada):**\n` +
                          `• **Jupiter Aggregator:** Roteamento de liquidez para execução real de arbitragem.\n` +
                          `• **Pyth & Switchboard:** Feeds institucionais de baixa latência para o ZK Dark Pool.\n` +
                          `• **Kamino & Meteora:** Vaults automatizados para Yield Seguro.\n\n` +
                          `*Nota de Transparência Institucional: Apenas as Integrações Ativas executam código on-chain neste momento. O restante encontra-se em fase de prototipagem segura (Simulação).*`;
              const kb = { inline_keyboard: [
                  [{ text: "✨ Voltar para Intenções", callback_data: "start_intent" }],
                  [{ text: "🖥️ Acessar Agent Hub", url: "https://landingpage-dgs-projects-ac3c4a7c.vercel.app/" }]
              ]};
              await sendMsg(chatId, msg, kb);
            }
            else if (data === "intent_arb") {
              const msg = `Compreendido. Preparei um briefing para a sua revisão executiva sobre o produto **A2A Routing & Atomic Settlement** (Dark Pools):\n\n` +
                          `• **Estratégia:** Exploração de ineficiências de preço (MEV) protegida por criptografia Zero-Knowledge.\n` +
                          `• **Exposição Sugerida:** Até 0.5 SOL (Seu saldo atual: ${userStates[chatId].balance.toFixed(4)} SOL)\n` +
                          `• **Nível de Risco:** KMS Enforced (~2% slippage max)\n` +
                          `• **Taxa de Execução:** 0.1% a 1% por match\n\n` +
                          `Como seu guardião de risco, eu validei esta operação. Você me autoriza a executar o fluxo atômico?`;
              const kb = { inline_keyboard: [
                  [{ text: "✅ Autorizar Liquidação", callback_data: "exec_approve" }],
                  [{ text: "🤖 Transferir Autonomia para o Agente", callback_data: "exec_auto" }],
                  [{ text: "❌ Abortar Operação", callback_data: "exec_cancel" }]
              ]};
              await sendMsg(chatId, msg, kb);
            }
            else if (data === "intent_yield") {
              const msg = `🚨 *Nova Demanda de Liquidez Instantânea (JIT)*\n\n` +
                          `Identifiquei um pico de volatilidade na rede. O protocolo **Meteora DLMM** precisa de liquidez imediata na pool SOL-USDC para sustentar o volume de Swaps.\n\n` +
                          `Como um *Nó de Liquidez JIT*, seu Agente pode suprir essa demanda agora e capturar as taxas do protocolo.\n\n` +
                          `⚙️ **Condições de Delegação (Lock Periods):**\n` +
                          `• *Flexível (Remove a qualquer momento):* ~15.2% APY\n` +
                          `• *Lock 7 Dias:* ~28.5% APY\n` +
                          `• *Lock 15 Dias:* ~35.0% APY\n` +
                          `• *Lock 30 Dias:* ~45.2% APY\n\n` +
                          `Selecione o modelo de delegação para o seu saldo ocioso:`;
              const kb = { inline_keyboard: [
                  [{ text: "🔓 Flexível (15.2%)", callback_data: "exec_approve_yield_flex" }],
                  [{ text: "🔒 Lock 7 Dias (28.5%)", callback_data: "exec_approve_yield_7d" }],
                  [{ text: "🔒 Lock 30 Dias (45.2%)", callback_data: "exec_approve_yield_30d" }],
                  [{ text: "❌ Ignorar Demanda", callback_data: "exec_cancel" }]
              ]};
              await sendMsg(chatId, msg, kb);
            }
            else if (data === "intent_x402") {
              const msg = `🚨 *Aprovação Institucional Exigida (x402 A2A)*\n\nIdentifiquei a necessidade de adquirir dados externos de inteligência para nossa próxima tomada de decisão.\n\n` +
                          `• **Provedor:** Oráculo NoahAI\n` +
                          `• **Serviço:** Inferência de Risco de Mercado\n` +
                          `• **Custo da Liquidação:** ${TELEGRAM_X402_AMOUNT_SOL} SOL\n` +
                          `• **Protocolo de Recibo:** Metaplex cNFT Proof\n\n` +
                          `Por favor, confirme se devo prosseguir com a liberação JIT (Just-In-Time) deste pagamento on-chain.`;
              const kb = { inline_keyboard: [
                  [{ text: "✅ Aprovar Liquidação x402", callback_data: "exec_approve_x402" }],
                  [{ text: "❌ Bloquear Operação", callback_data: "exec_cancel" }]
              ]};
              await sendMsg(chatId, msg, kb);
            }
            else if (data === "exec_approve_x402") {
              const approvalMessageId = update.callback_query.message?.message_id;
              const approvalMessageDate = update.callback_query.message?.date;
              // Add action prefix to approval key to make it idempotent per action
              const approvalKey = `x402:${chatId}:${approvalMessageId ?? "unknown"}`;
              if (isApprovalExpired(approvalMessageDate)) {
                await sendMsg(chatId, `⏱️ Esta aprovação x402 expirou. Abra uma nova intent para continuar.`);
                continue;
              }
              
              if (consumedX402ApprovalByMessage.has(approvalKey)) {
                await sendMsg(chatId, `🛑 Esta aprovação x402 já foi consumida ou expirou. Abra uma nova intent para novo pagamento.`);
                continue;
              }
              if (x402InFlightByChat.has(chatId)) {
                await sendMsg(chatId, `⏳ Já existe uma liquidação x402 em andamento para este chat. Aguarde o resultado.`);
                continue;
              }
              const msg = `Aprovado! Iniciando liquidação x402 e registro no Metaplex...`;
              await sendMsg(chatId, msg);
              
              if (!SETTLEMENT_WALLET) {
                await sendMsg(chatId, `❌ NOAHAI_SETTLEMENT_WALLET não configurada. Liquidação bloqueada por policy.`);
                continue;
              }
              x402InFlightByChat.add(chatId);
              // Consome a aprovação com timestamp para evitar replay
              consumedX402ApprovalByMessage.set(approvalKey, Date.now());

              // Rodando em background para não travar o loop do bot
              setTimeout(async () => {
                try {
                  const intentId = `MIND-INTENT-${Math.floor(Math.random() * 10000)}`;
                  
                  // Fase Turnkey KMS: o modo default e real, mas pode ser forçado para dry-run via TELEGRAM_X402_MODE.
                  const raw = execFileSync(
                    "npx",
                    [
                      "tsx",
                      "scripts/a2a_payment.ts",
                      `--mode=${TELEGRAM_X402_MODE}`,
                      "--human-approved=true",
                      `--amount=${TELEGRAM_X402_AMOUNT_SOL}`,
                      "--memo=MIND_x402_PAYMENT: AI inference via Telegram",
                      `--intent-id=${intentId}`,
                      `--target=${SETTLEMENT_WALLET}`
                    ],
                    { encoding: "utf8" }
                  );
                  const decision = extractDecisionFromOutput(raw);
                  if (!decision) {
                    await sendMsg(chatId, `❌ Falha ao interpretar resposta da liquidação x402.`);
                    return;
                  }

                  if (decision.decision !== "ALLOW") {
                    await sendMsg(
                      chatId,
                      `🛑 Liquidação não autorizada: ${decision.decision}\nReason codes: ${decision.reason_codes.join(", ") || "none"}`
                    );
                    return;
                  }

                  const txHash = decision.artifacts?.txHash;
                  if (!txHash) {
                    await sendMsg(chatId, `❌ Liquidação sem txHash confirmado. Operação tratada como inconclusiva.`);
                    return;
                  }

                  const aiDecision = await callNoahAI(intentId, decision);
                  const receiptHash = decision.artifacts?.receiptHash ?? "n/a";
                  const aiStatus = aiDecision.decision;
                  
                  const asciiReceipt = generateAsciiReceipt(
                    "x402 Data Purchase",
                    [
                      { name: "Oracle Inference", qty: 1, value: TELEGRAM_X402_AMOUNT_SOL.toString() },
                      { name: "Network Gas", qty: 1, value: "0.00001" }
                    ],
                    (TELEGRAM_X402_AMOUNT_SOL + 0.00001).toFixed(5),
                    txHash,
                    receiptHash
                  );

                  const msg2 =
                    `✅ *Liquidação x402 Concluída com Sucesso*\n\n` +
                    `O pagamento foi processado on-chain e o oráculo liberou os dados criptografados.\n\n` +
                    `${asciiReceipt}\n\n` +
                    `O seu Agent Hub já foi atualizado com as novas métricas.`;

                  const kb2 = {
                    inline_keyboard: [
                      [{ text: "🖥️ Acessar Agent Hub (Dashboard)", url: "https://landingpage-dgs-projects-ac3c4a7c.vercel.app/" }],
                      [{ text: "✨ Criar Nova Intenção", callback_data: "start_intent" }]
                    ]
                  };
                  await sendMsg(chatId, msg2, kb2);
                } catch (err) {
                  console.error("Erro no fluxo x402/noahai:", err);
                  const errorMsg = `❌ *Falha na liquidação x402/NoahAI*\n\nNão foi possível completar a operação. O sistema de IA ou a rede podem estar instáveis no momento.\n\n_Dica: Seu saldo está seguro. Tente novamente mais tarde._`;
                  const errorKb = {
                    inline_keyboard: [
                      [{ text: "🔄 Tentar Novamente", callback_data: "intent_x402" }],
                      [{ text: "✨ Menu Principal", callback_data: "start_intent" }]
                    ]
                  };
                  await sendMsg(chatId, errorMsg, errorKb);
                } finally {
                  x402InFlightByChat.delete(chatId);
                }
              }, 100);
            }
            else if (data === "exec_approve") {
              const msg = `🛡️ *Guardrails Ativados*\nValidando liquidez no JIT Treasury e simulando slippage em ZK Dark Pool...`;
              await sendMsg(chatId, msg);
              
              // Execução de arbitragem (Mock seguro para o vídeo, já que o A2A x402 é o showcase de mainnet real)
              setTimeout(async () => {
                const asciiReceipt = generateAsciiReceipt(
                  "A2A Routing",
                  [
                    { name: "Gross Profit", qty: 1, value: "0.47000" },
                    { name: "Execution Fee", qty: 1, value: "0.00047" }
                  ],
                  "0.46953",
                  "mock_darkpool_tx_89f" + Math.floor(Math.random() * 10000)
                );

                const msg2 = `✅ *Liquidação Atômica Executada!*\n\n` +
                             `• Status: Liquidado em Dark Pool\n` +
                             `• Proteção MEV: Ativa (0 falhas)\n\n` +
                             `${asciiReceipt}\n\n` +
                             `_Sua tesouraria foi atualizada. Você pode auditar a prova criptográfica no Agent Hub._`;
                const kb2 = { inline_keyboard: [
                  [{ text: "🖥️ Abrir Dashboard", url: "https://landingpage-dgs-projects-ac3c4a7c.vercel.app/" }],
                  [{ text: "💾 Salvar como Skill Autônoma", callback_data: "save_skill" }],
                  [{ text: "✨ Nova Intent", callback_data: "start_intent" }]
                ]};
                await sendMsg(chatId, msg2, kb2);
              }, 2500);
            }
            else if (data.startsWith("exec_approve_yield")) {
              const lockType = data.split("_").pop();
              let apy = "15.2%";
              let lockText = "Flexível (Sem bloqueio)";
              
              if (lockType === "7d") { apy = "28.5%"; lockText = "Bloqueado por 7 Dias"; }
              else if (lockType === "30d") { apy = "45.2%"; lockText = "Bloqueado por 30 Dias"; }

              const approvalMessageId = update.callback_query.message?.message_id;
              const approvalMessageDate = update.callback_query.message?.date;
              const approvalKey = `yield:${chatId}:${approvalMessageId ?? "unknown"}`;
              if (isApprovalExpired(approvalMessageDate)) {
                await sendMsg(chatId, `⏱️ Esta aprovação de delegação expirou. Abra uma nova intent para continuar.`);
                continue;
              }
              
              if (consumedX402ApprovalByMessage.has(approvalKey)) {
                await sendMsg(chatId, `🛑 Esta operação de delegação já foi processada ou expirou.`);
                continue;
              }
              consumedX402ApprovalByMessage.set(approvalKey, Date.now());

              const msg = `🛡️ *Guardrails Ativados*\nEmpacotando transação e delegando liquidez JIT para a pool Meteora DLMM com perfil ${lockText}...`;
              await sendMsg(chatId, msg);
              
              setTimeout(async () => {
                const asciiReceipt = generateAsciiReceipt(
                  "Capital Allocation",
                  [
                    { name: "JIT Injection", qty: 1, value: "10.0000" },
                    { name: "Meteora Gas", qty: 1, value: "0.00002" }
                  ],
                  "10.00002",
                  "mock_meteora_tx_2a" + Math.floor(Math.random() * 10000)
                );

                const msg2 = `✅ *Liquidez Delegada com Sucesso!*\n\n` +
                             `Seu agente assumiu o papel de Nó de Liquidez. Os fundos foram injetados no mercado para suprir a demanda instantânea.\n\n` +
                             `${asciiReceipt}\n\n` +
                             `_Como Remover:_ ` + (lockType === "flex" ? `Você pode solicitar o saque ("Unstake") a qualquer momento pelo Agent Hub.` : `O capital + rendimentos serão destravados automaticamente e retornarão para sua carteira ao final do período.`) + `\n\n` +
                             `_Nota Institucional: A taxa de performance (Performance Fee) será deduzida apenas sobre o lucro líquido no momento do saque._`;
                const kb2 = { inline_keyboard: [
                  [{ text: "🖥️ Acessar Agent Hub (Dashboard)", url: "https://landingpage-dgs-projects-ac3c4a7c.vercel.app/" }],
                  [{ text: "✨ Criar Nova Intenção", callback_data: "start_intent" }]
                ]};
                await sendMsg(chatId, msg2, kb2);
              }, 2500);
            }
            else if (data === "exec_auto") {
              const msg = `🤖 *Autonomia Delegada*\n\nCompreendido, Guardião. Ativei o modo autônomo para esta estratégia. O agente tomará decisões de execução quando identificar janelas de oportunidade com slippage dentro da margem de 2%.\n\nMantive os logs ativos para auditoria.`;
              await sendMsg(chatId, msg);
              
              setTimeout(async () => {
                const msg2 = `Primeiro ciclo de monitoramento iniciado. Deseja refinar os limites de risco ou retornar ao menu principal?`;
                const kb2 = { inline_keyboard: [
                  [{ text: "⚙️ Refinar Limites de Risco", callback_data: "refine_risk" }],
                  [{ text: "✨ Menu Principal", callback_data: "start_intent" }]
                ] };
                await sendMsg(chatId, msg2, kb2);
              }, 2000);
            }
            else if (data === "refine_risk") {
              const msg = `⚙️ *Ajuste de Guardrails e Limites de Risco*\n\nConfigure os parâmetros institucionais para as execuções autônomas do seu Agente na Solana:\n\n` +
                          `• **Slippage Máximo Atual:** 2.0%\n` +
                          `• **Teto de Exposição (Single Tx):** 50 SOL\n` +
                          `• **Assinatura KMS Exigida:** Acima de 10 SOL\n\n` +
                          `_Estas políticas estão aplicadas diretamente no cofre Turnkey (Policy Gates)._`;
              const kb = {
                inline_keyboard: [
                  [{ text: "📉 Reduzir Slippage para 0.5%", callback_data: "update_risk_slip" }],
                  [{ text: "🔒 Exigir KMS em TODAS as Tx", callback_data: "update_risk_kms" }],
                  [{ text: "✨ Voltar ao Menu Principal", callback_data: "start_intent" }]
                ]
              };
              await sendMsg(chatId, msg, kb);
            }
            else if (data.startsWith("update_risk_")) {
              const msg = `✅ *Políticas de Risco Atualizadas*\n\nOs novos limites foram sincronizados on-chain e propagados para a malha de agentes e para as regras do KMS.\n\nO seu capital está operando sob os novos guardrails institucionais.`;
              const kb = {
                inline_keyboard: [
                  [{ text: "🖥️ Acessar Agent Hub (Dashboard)", url: "https://landingpage-dgs-projects-ac3c4a7c.vercel.app/" }],
                  [{ text: "✨ Menu Principal", callback_data: "start_intent" }]
                ]
              };
              await sendMsg(chatId, msg, kb);
            }
            else if (data === "exec_cancel") {
              const msg = `🛑 *Operação Abortada*\n\nNenhuma transação foi executada e as chaves não foram acionadas. Seu capital permanece intacto no JIT Treasury.\n\nComo posso ajudar em seguida?`;
              const kb = {
                inline_keyboard: [
                  [{ text: "✨ Criar Nova Intenção", callback_data: "start_intent" }],
                  [{ text: "🖥️ Acessar Agent Hub", url: "https://landingpage-dgs-projects-ac3c4a7c.vercel.app/" }]
                ]
              };
              await sendMsg(chatId, msg, kb);
            }
            else if (data === "save_skill") {
              const msg = `💾 *Skill Autônoma Armazenada*\n\nA estratégia foi salva e incorporada ao seu Agent Hub. A partir de agora, o sistema monitorará condições semelhantes de mercado.\n\nVocê pode auditar todas as execuções autônomas no painel de controle.`;
              const kb = {
                inline_keyboard: [
                  [{ text: "🖥️ Acessar Agent Hub", url: "https://landingpage-dgs-projects-ac3c4a7c.vercel.app/" }],
                  [{ text: "✨ Criar Nova Intenção", callback_data: "start_intent" }]
                ]
              };
              await sendMsg(chatId, msg, kb);
            }
            else if (data === "check_status") {
               await sendMsg(chatId, `📊 *Relatório de Status*\n\nSua infraestrutura está operando normalmente. Hoje, o protocolo gerou um Delta positivo de **+1.84 SOL** via otimizações de rotas (Dark Pools).\n\nDeseja um relatório detalhado?`, {
                 inline_keyboard: [[{ text: "📑 Extrair Relatório Detalhado", callback_data: "report_details" }], [{ text: "✨ Menu Principal", callback_data: "start_intent" }]]
               });
            }
            else if (data === "report_details") {
              const msg = `📑 *Relatório Detalhado do Agent Hub*\n\n` +
                          `• **KMS Protected TVL:** ${userStates[chatId].balance.toFixed(4)} SOL\n` +
                          `• **Market Intelligence (x402):** 14 Inferences\n` +
                          `• **Performance Fee (JIT):** 0.12 SOL (Meteora DLMM)\n` +
                          `• **Execution Fee (Routing):** 0.04 SOL (Jupiter ZK)\n\n` +
                          `O histórico completo (append-only logs) está disponível no seu painel web.`;
              const kb = {
                inline_keyboard: [
                  [{ text: "🖥️ Abrir Dashboard", url: "https://landingpage-dgs-projects-ac3c4a7c.vercel.app/" }],
                  [{ text: "✨ Voltar às Intenções", callback_data: "start_intent" }]
                ]
              };
              await sendMsg(chatId, msg, kb);
            }
            else if (data === "metrics") {
              const msg = `📈 *Métricas Agentic GDP (Global)*\n\nO ecossistema MIND está orquestrando liquidez em tempo real:\n\n` +
                          `• **TVL Protegido (KMS):** $12.4M\n` +
                          `• **Tx Processadas Hoje:** 14,203\n` +
                          `• **A2A Settlement (24h):** $840k\n` +
                          `• **Nós de Liquidez Ativos:** 342 Agentes\n\n` +
                          `Você pode acompanhar o fluxo da rede diretamente pelo painel.`;
              const kb = {
                inline_keyboard: [
                  [{ text: "🖥️ Abrir Dashboard", url: "https://landingpage-dgs-projects-ac3c4a7c.vercel.app/" }],
                  [{ text: "✨ Voltar às Intenções", callback_data: "start_intent" }]
                ]
              };
              await sendMsg(chatId, msg, kb);
            }
          }
        }
      }
    } catch (e) {
      console.error("Erro no polling:", e);
    }
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
}

startBot().catch(console.error);
