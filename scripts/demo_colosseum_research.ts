import { ColosseumAdapter } from "../services/market-context-service/src/adapters/colosseum.js";
import { logOpenClawProgressEvent } from "./audit_logger.js";

async function main() {
  console.log("==========================================");
  console.log("🧠 MIND - COLOSSEUM COPILOT INTEGRATION");
  console.log("==========================================");

  const adapter = new ColosseumAdapter();

  try {
    // 1. Status Check
    console.log("1. Validando autenticação (Pre-Flight)...");
    const status = await adapter.checkStatus();
    console.log(`✅ Status: ${status.authenticated ? "Autenticado" : "Falhou"} | Expira: ${status.expiresAt}`);
    
    // Log para auditoria Spec-Driven
    await logOpenClawProgressEvent({
      intentId: "colosseum-test",
      source: "colosseum-adapter",
      phase: "execution",
      item: "colosseum_auth",
      status: "completed",
      metadata: { scope: status.scope }
    });

    // 2. Buscando Projetos Builders
    const ideaQuery = "privacy wallet for stablecoin users";
    console.log(`\n2. Pesquisando projetos builder para a tese: "${ideaQuery}"`);
    const projects = await adapter.searchProjects(ideaQuery, 3);
    
    if (projects.length === 0) {
      console.log("❌ Nenhum projeto encontrado.");
    } else {
      projects.forEach((p: any, i: number) => {
        console.log(`   [${i + 1}] ${p.name} (${p.slug}) - Score: ${p.similarityScore || 'N/A'}`);
        const tags = Array.isArray(p.tags) ? p.tags.join(", ") : (typeof p.tags === 'string' ? p.tags : "N/A");
        console.log(`       Tags: ${tags}`);
      });
    }

    // 3. Buscando Arquivos (Literatura/Protocolos)
    console.log(`\n3. Consultando arquivos (Literatura Cypherpunk/Docs) sobre a tese...`);
    const archives = await adapter.searchArchives(ideaQuery, 2);
    
    if (archives.length === 0) {
      console.log("❌ Nenhum documento encontrado.");
    } else {
      archives.forEach((a: any, i: number) => {
        console.log(`   [${i + 1}] Documento: ${a.title} (${a.sourceType})`);
        console.log(`       ID: ${a.documentId}`);
        // Mostrar apenas um resumo do conteúdo
        console.log(`       Preview: ${a.content?.substring(0, 100)}...`);
      });
    }

    console.log("\n✅ Teste de integração concluído. O Colosseum Copilot está agora pronto para alimentar as skills de 'skill_compile_knowledge' e 'skill_assemble_context'.");

  } catch (error) {
    console.error("❌ Falha na integração:", error);
  }
}

main();
