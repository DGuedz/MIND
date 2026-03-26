import { Connection, LAMPORTS_PER_SOL } from "@solana/web3.js";
import bs58 from "bs58";
import * as dotenv from "dotenv";
import { execSync } from "child_process";
dotenv.config();

const TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const ENV_KEY = process.env.METAPLEX_KEYPAIR;
if (!TOKEN || !ENV_KEY) {
  console.error("❌ TELEGRAM_BOT_TOKEN ou METAPLEX_KEYPAIR não encontrado no .env");
  process.exit(1);
}
const TELEGRAM_API = `https://api.telegram.org/bot${TOKEN}`;

// Configuração da Solana para ler o saldo real da sua wallet importada (a mesma do Trojan)
const rpcUrl = process.env.HELIUS_RPC_URL || "https://api.mainnet-beta.solana.com";
const connection = new Connection(rpcUrl, "confirmed");

// Derive public key from the provided secret key
let publicKeyStr = "";
try {
  const secretKey = ENV_KEY.trim().startsWith("[") ? new Uint8Array(JSON.parse(ENV_KEY)) : bs58.decode(ENV_KEY);
  // Simplificação: apenas precisamos extrair a public key.
  // Em uma implementação completa importaríamos Keypair de @solana/web3.js
  const { Keypair } = require("@solana/web3.js");
  const keypair = Keypair.fromSecretKey(secretKey);
  publicKeyStr = keypair.publicKey.toBase58();
} catch (e) {
  console.error("Erro ao derivar chave pública:", e);
}

// Estado do usuário
const userStates: Record<number, { isConnected: boolean; balance: number }> = {};

async function getRealBalance(): Promise<number> {
  if (!publicKeyStr) return 0;
  try {
    const { PublicKey } = require("@solana/web3.js");
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

async function startBot() {
  console.log("🧠 Protocolo MIND-INTENT-GUARDIAN (Humanizado) ativado. Escutando...\n");
  await fetch(`${TELEGRAM_API}/deleteWebhook`);
  let lastUpdateId = 0;
  
  while (true) {
    try {
      const response = await fetch(`${TELEGRAM_API}/getUpdates?offset=${lastUpdateId}&timeout=10`);
      const data = await response.json();
      
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
               const msg = `Olá, bom dia! Eu sou o MIND, em que posso te ajudar hoje?`;
               const kb = {
                 inline_keyboard: [
                   [{ text: "✨ Nova Intent", callback_data: "start_intent" }],
                   [{ text: "📈 Ver status", callback_data: "check_status" }],
                   userStates[chatId].isConnected 
                     ? [{ text: "✅ Wallet Conectada", callback_data: "noop" }]
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
                  [{ text: "💸 Pagar IA (x402)", callback_data: "intent_x402" }],
                  [{ text: "📈 Monitorar Agentic GDP", callback_data: "intent_gdp" }]
              ]};
              await sendMsg(chatId, msg, kb);
            }
            else if (data === "start_intent") {
              if (!userStates[chatId].isConnected) {
                 await sendMsg(chatId, `Antes de começarmos, preciso conectar sua wallet na Solana. Isso é rápido e seguro — o Metaplex vai criar a identidade oficial do seu agent on-chain.`, {
                   inline_keyboard: [[{ text: "🦊 Conectar Wallet com Metaplex", callback_data: "wallet_connected" }]]
                 });
              } else {
                const msg = `Legal! Qual intenção você quer hoje?`;
                const kb = { inline_keyboard: [
                    [{ text: "⚡ Arbitragem no Jupiter", callback_data: "intent_arb" }],
                    [{ text: "💸 Pagar IA (x402)", callback_data: "intent_x402" }],
                    [{ text: "📈 Monitorar Agentic GDP", callback_data: "intent_gdp" }]
                ]};
                await sendMsg(chatId, msg, kb);
              }
            }
            else if (data === "intent_arb") {
              const msg = `Entendi. Resumo simples:\n\n• Arbitragem no Jupiter\n• Usar até 0.5 SOL (do seu saldo de ${userStates[chatId].balance} SOL)\n• Risco bem baixo (~2%)\n\nTudo certo? Quer executar agora?`;
              const kb = { inline_keyboard: [
                  [{ text: "🚀 Sim, executa", callback_data: "exec_approve" }],
                  [{ text: "🤖 Deixa o agent decidir sozinho", callback_data: "exec_auto" }],
                  [{ text: "❌ Não, cancela", callback_data: "exec_cancel" }]
              ]};
              await sendMsg(chatId, msg, kb);
            }
            else if (data === "exec_approve") {
              const msg = `Beleza! Executando agora...`;
              await sendMsg(chatId, msg);
              
              // Execução de verdade ou simulada?
              // Como combinamos, aqui o código poderia chamar executeRealArbitrage(0.01)
              // Mas deixamos a simulação para o demo seguro:
              setTimeout(async () => {
                // Aqui simularíamos o lucro de uma arbitragem. 
                // Num ambiente real, isso leria o saldo novamente após a transação real.
                userStates[chatId].balance += 0.47; 
                const msg2 = `✅ Executado!\n\n+0.47 SOL de lucro\nSaldo atualizado (simulado): ${userStates[chatId].balance.toFixed(4)} SOL\n\nQuer ver o dashboard ou criar uma skill automática com isso?`;
                const kb2 = { inline_keyboard: [
                  [{ text: "🖥️ Abrir Dashboard", url: "https://mind.app/app?agent=SolClaw_Alpha" }],
                  [{ text: "💾 Criar skill automática", callback_data: "save_skill" }],
                  [{ text: "✨ Nova intent", callback_data: "start_intent" }]
                ]};
                await sendMsg(chatId, msg2, kb2);
              }, 2500);
            }
            else if (data === "exec_auto") {
              const msg = `Entendi. Ativei o modo autônomo.\n\nO agent agora decide sozinho quando aparecer oportunidade boa, mas eu fico de olho e te aviso se precisar. Primeira execução já rodando...`;
              await sendMsg(chatId, msg);
              
              setTimeout(async () => {
                const msg2 = `Pronto! Quer ajustar algum limite?`;
                const kb2 = { inline_keyboard: [[{ text: "⚙️ Ajustar Limites", callback_data: "noop" }]] };
                await sendMsg(chatId, msg2, kb2);
              }, 2000);
            }
            else if (data === "exec_cancel") {
              await sendMsg(chatId, `Cancelado! O capital está seguro. Em que mais posso ajudar?`);
            }
            else if (data === "save_skill") {
              await sendMsg(chatId, `💾 Skill 'Jupiter Arb Auto' salva! O agent agora sabe fazer isso sozinho. Você pode alterar isso no painel.`);
            }
            else if (data === "check_status") {
               await sendMsg(chatId, `Tudo tranquilo. Seu agent já fez +1.84 SOL hoje. Quer ver detalhes?`, {
                 inline_keyboard: [[{ text: "📊 Ver Detalhes", callback_data: "metrics" }]]
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
