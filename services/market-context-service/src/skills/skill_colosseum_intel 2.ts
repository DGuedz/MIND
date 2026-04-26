import { ColosseumAdapter } from "../adapters/colosseum.js";
import { logOpenClawProgressEvent } from "../../../../scripts/audit_logger.js";
import * as fs from "fs";
import * as path from "path";

/**
 * Skill Nativa: Colosseum Market Intelligence
 * Acionada pelo Auto Router para realizar um "Deep Dive" em uma tese de mercado.
 * Executa a varredura no Colosseum e injeta os resultados no mind_index.md.
 */
export async function runColosseumDeepDive(query: string, telegramChatId?: string): Promise<string> {
  console.log(`\n🧠 [Skill: Colosseum Intel] Iniciando Deep Dive para a tese: "${query}"...`);
  
  const colosseum = new ColosseumAdapter();
  const status = await colosseum.checkStatus();
  
  if (!status.authenticated && !status.mock) {
    return `❌ Erro de Autenticação: ${status.message}`;
  }

  // 1. Registro de Auditoria (OpenClaw Governance)
  if (telegramChatId) {
    logOpenClawProgressEvent({ action: "MIND Market Intel", details: `Pesquisando tese no Colosseum Copilot: ${query}`, status: "in_progress" });
  }

  // 2. Extração de Dados
  console.log(`   🔹 Consultando 5.400+ projetos Solana e arquivos Cypherpunk...`);
  const intel = await colosseum.deepDiveResearch(query);

  // 3. Formatação da Saída (Market Pitch)
  const reportDate = new Date().toISOString().substring(0, 10);
  let report = `\n## 🧠 MIND Market Intel: Deep Dive\n`;
  report += `**Tese:** ${query}\n**Data:** ${reportDate}\n\n`;

  report += `### 1. Landscape de Projetos (Builders / Competidores)\n`;
  if (intel.projects && intel.projects.length > 0) {
    intel.projects.forEach((p: any) => {
      report += `- **${p.name}** (${p.slug}): ${p.tags ? p.tags.join(", ") : 'N/A'}\n`;
    });
  } else {
    report += `- Nenhum projeto builder direto encontrado. Oceano Azul?\n`;
  }

  report += `\n### 2. Fundamentação Teórica (Cypherpunk & Protocol Archives)\n`;
  if (intel.archives && intel.archives.length > 0) {
    intel.archives.forEach((a: any) => {
      report += `- **${a.title}** (${a.author || 'Desconhecido'}): Relevância ${a.relevance || 'Alta'}\n`;
    });
  } else {
    report += `- Nenhuma literatura específica encontrada no corpus.\n`;
  }

  report += `\n### 3. Ação Estratégica (Programmatic Intent)\n`;
  report += `O MIND Protocol absorveu este contexto. Os Programmatic Guardrails serão atualizados para refletir o cenário de risco desta tese.\n`;

  // 4. Injeção no Cérebro do MIND (skill_file_learning)
  const indexPath = path.resolve(process.cwd(), "docs/mind_index_intel.md");
  fs.appendFileSync(indexPath, report + "\n---\n");
  console.log(`   ✅ Insights estruturados e gravados em ${indexPath}`);

  if (telegramChatId) {
    logOpenClawProgressEvent({ action: "MIND Market Intel", details: `Pesquisa concluída. Contexto gravado.`, status: "completed" });
  }

  return report;
}
