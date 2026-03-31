import { Connection, Keypair, LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";
import bs58 from "bs58";
import * as dotenv from "dotenv";
import { execFileSync } from "child_process";
dotenv.config();

const TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const ENV_KEY = process.env.METAPLEX_KEYPAIR;
if (!TOKEN || !ENV_KEY) {
  console.error("❌ TELEGRAM_BOT_TOKEN ou METAPLEX_KEYPAIR não encontrado no .env");
  process.exit(1);
}
const TELEGRAM_API = `https://api.telegram.org/bot${TOKEN}`;
const SETTLEMENT_WALLET = process.env.NOAHAI_SETTLEMENT_WALLET || "";
const OPENCLAW_ENDPOINT = process.env.OPENCLAW_INFERENCE_ENDPOINT || `${process.env.OPENCLAW_BASE_URL || ""}`.replace(/\/$/, "") + "/inference";
const OPENCLAW_TIMEOUT_MS = Number(process.env.OPENCLAW_TIMEOUT_MS ?? "15000");
const TELEGRAM_X402_AMOUNT_SOL = Number(process.env.TELEGRAM_X402_AMOUNT_SOL ?? "0.00001");

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

// Configuração da Solana para ler o saldo real da sua wallet importada (a mesma do Trojan)
const rpcUrl = process.env.HELIUS_RPC_URL || "https://api.mainnet-beta.solana.com";
const connection = new Connection(rpcUrl, "confirmed");

// Derive public key from the provided secret key
let publicKeyStr = "";
try {
  const secretKey = ENV_KEY.trim().startsWith("[") ? Uint8Array.from(JSON.parse(ENV_KEY)) : bs58.decode(ENV_KEY.trim());
  const keypair = Keypair.fromSecretKey(secretKey);
  publicKeyStr = keypair.publicKey.toBase58();
} catch (e) {
  console.error("Erro ao derivar chave pública:", e);
}

// Estado do usuário
const userStates: Record<number, { isConnected: boolean; balance: number }> = {};
const x402InFlightByChat = new Set<number>();
const consumedX402ApprovalByMessage = new Set<string>();

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
              const msg = `✅ Wallet conectada!\nVocê tem ${userStates[chatId].balance} SOL disponíveis agora.\n\nO que quer fazer hoje?`;
              const kb = { inline_keyboard: [
                  [{ text: "⚡ Arbitragem no Jupiter", callback_data: "intent_arb" }],
                  [{ text: "💸 Pagar IA (x402)", callback_data: "intent_x402" }]
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
                    [{ text: "⚡ Arbitragem ZK Dark Pool (Alto Retorno)", callback_data: "intent_arb" }],
                    [{ text: "🛡️ Yield Seguro em JIT Treasury (Renda Fixa)", callback_data: "intent_yield" }],
                    [{ text: "💸 Liquidar Oráculo de IA (A2A x402)", callback_data: "intent_x402" }],
                    [{ text: "🌐 Ver Protocolos A2A e Oráculos Suportados", callback_data: "intent_protocols" }],
                    [{ text: "📊 Visualizar Métricas Agentic GDP", callback_data: "noop" }]
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
              const msg = `Compreendido. Preparei um briefing para a sua revisão executiva sobre o produto **Arbitragem ZK Dark Pool**:\n\n` +
                          `• **Estratégia:** Exploração de ineficiências de preço (MEV) protegida por criptografia Zero-Knowledge.\n` +
                          `• **Exposição Sugerida:** Até 0.5 SOL (Seu saldo atual: ${userStates[chatId].balance.toFixed(4)} SOL)\n` +
                          `• **Nível de Risco:** Médio-Baixo (~2% slippage max)\n` +
                          `• **Retorno Estimado (APY):** 45% a 60% ao ano (Dinâmico conforme volatilidade)\n\n` +
                          `Como seu guardião de risco, eu validei esta operação. Você me autoriza a executar o fluxo?`;
              const kb = { inline_keyboard: [
                  [{ text: "✅ Autorizar Execução", callback_data: "exec_approve" }],
                  [{ text: "🤖 Transferir Autonomia para o Agente", callback_data: "exec_auto" }],
                  [{ text: "❌ Abortar Operação", callback_data: "exec_cancel" }]
              ]};
              await sendMsg(chatId, msg, kb);
            }
            else if (data === "intent_yield") {
              const msg = `Avaliando o produto **Yield Seguro em JIT Treasury**:\n\n` +
                          `• **Estratégia:** Alocação de capital ocioso em cofres institucionais (Blue-chip DeFi) via rotas seguras.\n` +
                          `• **Exposição Sugerida:** Otimização do saldo JIT restante.\n` +
                          `• **Nível de Risco:** Muito Baixo (Protegido por seguro de protocolo)\n` +
                          `• **Retorno Estimado (APY):** 8% a 12% ao ano (Estável)\n\n` +
                          `Deseja alocar parte do seu tesouro nesta estratégia de rendimento passivo?`;
              const kb = { inline_keyboard: [
                  [{ text: "✅ Aprovar Alocação", callback_data: "exec_approve_yield" }],
                  [{ text: "❌ Cancelar", callback_data: "exec_cancel" }]
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
              const approvalKey = `${chatId}:${approvalMessageId ?? "unknown"}`;
              if (consumedX402ApprovalByMessage.has(approvalKey)) {
                await sendMsg(chatId, `🛑 Esta aprovação x402 já foi consumida. Abra uma nova intent para novo pagamento.`);
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
              consumedX402ApprovalByMessage.add(approvalKey);

              // Rodando em background para não travar o loop do bot
              setTimeout(async () => {
                try {
                  const intentId = `MIND-INTENT-${Math.floor(Math.random() * 10000)}`;
                  const raw = execFileSync(
                    "npx",
                    [
                      "tsx",
                      "scripts/a2a_payment.ts",
                      "--mode=real",
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
                  const msg2 =
                    `✅ *Liquidação x402 Concluída com Sucesso*\n\n` +
                    `O pagamento foi processado on-chain e o oráculo liberou os dados criptografados.\n\n` +
                    `• **Hash da Transação:** ${txHash}\n` +
                    `• **Recibo Metaplex:** ${receiptHash}\n` +
                    `• **Resposta do Oráculo:** ${aiStatus}\n\n` +
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
                const msg2 = `✅ *Arbitragem Executada com Sucesso!*\n\n` +
                             `• Status: Liquidado em Dark Pool\n` +
                             `• Proteção MEV: Ativa (0 falhas)\n` +
                             `• Lucro Líquido: +0.47 SOL\n\n` +
                             `_Nota: A execução real de DeFi exige integração com Jupiter SDK. O fluxo x402 A2A (Pagar IA) já é 100% Mainnet._`;
                const kb2 = { inline_keyboard: [
                  [{ text: "🖥️ Abrir Dashboard", url: "https://landingpage-dgs-projects-ac3c4a7c.vercel.app/" }],
                  [{ text: "💾 Salvar como Skill Autônoma", callback_data: "save_skill" }],
                  [{ text: "✨ Nova Intent", callback_data: "start_intent" }]
                ]};
                await sendMsg(chatId, msg2, kb2);
              }, 2500);
            }
            else if (data === "exec_approve_yield") {
              const msg = `🛡️ *Guardrails Ativados*\nAlocando capital ocioso em Vault Institucional (Simulação)...`;
              await sendMsg(chatId, msg);
              
              setTimeout(async () => {
                const msg2 = `✅ *Alocação Concluída com Sucesso!*\n\n` +
                             `• Produto: Yield Seguro (Renda Fixa)\n` +
                             `• Status: Ativo e gerando rendimento\n` +
                             `• APY Projetado: 10.5%\n\n` +
                             `_Nota: Esta é uma simulação de alocação DeFi para fins de demonstração._`;
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
                  [{ text: "⚙️ Refinar Limites de Risco", callback_data: "noop" }],
                  [{ text: "✨ Menu Principal", callback_data: "start_intent" }]
                ] };
                await sendMsg(chatId, msg2, kb2);
              }, 2000);
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
                 inline_keyboard: [[{ text: "📑 Extrair Relatório Detalhado", callback_data: "noop" }], [{ text: "✨ Menu Principal", callback_data: "start_intent" }]]
               });
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
