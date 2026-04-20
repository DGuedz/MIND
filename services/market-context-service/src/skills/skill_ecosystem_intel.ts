import { EcosystemIntelAdapter, EcosystemSignal } from "../adapters/ecosystem_intel.js";
import { upsertEcosystemSignal } from "../db/repository.js";

/**
 * Skill Nativa: Solana DeFi Ecosystem Intelligence
 * Acionada periodicamente ou sob demanda para atualizar os sinais de mercado do MIND.
 */
export async function runEcosystemIntelUpdate(query: string = "Solana DeFi", telegramChatId?: string): Promise<EcosystemSignal[]> {
  console.log(`\n🧠 [Skill: Ecosystem Intel] Iniciando atualização de sinais para: "${query}"...`);
  
  const adapter = new EcosystemIntelAdapter();
  
  // 1. Registro de Auditoria (Removido temporariamente para evitar erros de importação ESM)
  // if (telegramChatId) { ... }

  // 2. Coleta e Normalização
  const signals = await adapter.fetchLatestSignals(query);
  console.log(`   🔹 Coletados ${signals.length} sinais estruturados do ecossistema.`);

  // 3. Persistência e Deduplicação no Banco de Dados
  for (const signal of signals) {
    await upsertEcosystemSignal(signal);
  }
  
  console.log(`   ✅ Sinais sincronizados no banco de dados do MIND.`);

  return signals;
}
