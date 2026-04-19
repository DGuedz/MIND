import { getEnv } from "../../../shared/env.js";

/**
 * Adapter para a API do Colosseum Copilot.
 * Fornece a camada de Market Intelligence, conectando o MIND Protocol
 * à base de dados de 5.400+ projetos Solana e arquivos Cypherpunk.
 */
export class ColosseumAdapter {
  private apiBase: string;
  private pat: string | undefined;

  constructor() {
    this.apiBase = getEnv("COLOSSEUM_COPILOT_API_BASE") || "https://copilot.colosseum.com/api/v1";
    this.pat = getEnv("COLOSSEUM_COPILOT_PAT");
    
    if (!this.pat) {
      console.warn("⚠️ [ColosseumAdapter] COLOSSEUM_COPILOT_PAT ausente. O sistema operará em modo mock/safe (Demonstração).");
    }
  }

  /**
   * Pre-Flight Auth Check obrigatório.
   */
  async checkStatus(): Promise<{ authenticated: boolean; mock: boolean; message: string }> {
    if (!this.pat) {
      return { authenticated: false, mock: true, message: "Modo de simulação ativo (Sem PAT)" };
    }
    try {
      const res = await fetch(`${this.apiBase}/status`, {
        headers: { Authorization: `Bearer ${this.pat}` }
      });
      if (res.ok) {
        return { authenticated: true, mock: false, message: "Conectado ao Colosseum Copilot" };
      }
      return { authenticated: false, mock: false, message: `Erro HTTP ${res.status}` };
    } catch (e: any) {
      return { authenticated: false, mock: true, message: `Erro de rede: ${e.message}` };
    }
  }

  /**
   * Executa a pesquisa combinada (Deep Dive) em Projetos e Arquivos.
   */
  async deepDiveResearch(query: string, limit: number = 3): Promise<{ projects: any[]; archives: any[] }> {
    if (!this.pat) {
      // Retorna Mock Determinístico de Alto Nível Institucional se não houver PAT
      return {
        projects: [
          { name: "Stealf Wallet", slug: "stealf", tags: ["Privacy", "Payments", "DeFi"], score: 92 },
          { name: "Kalyna", slug: "kalyna", tags: ["Stablecoin", "ZK", "Infrastructure"], score: 85 }
        ],
        archives: [
          { title: "6 Myths about Privacy on Blockchains", author: "Cypherpunk Archives", relevance: "High" },
          { title: "The Sovereign Agent Manifesto", author: "BLCK MNDZ", relevance: "Critical" }
        ]
      };
    }

    try {
      const [projRes, archRes] = await Promise.all([
        fetch(`${this.apiBase}/search/projects`, {
          method: "POST",
          headers: { Authorization: `Bearer ${this.pat}`, "Content-Type": "application/json" },
          body: JSON.stringify({ query, limit })
        }),
        fetch(`${this.apiBase}/search/archives`, {
          method: "POST",
          headers: { Authorization: `Bearer ${this.pat}`, "Content-Type": "application/json" },
          body: JSON.stringify({ query, limit: 2 })
        })
      ]);

      const projects = projRes.ok ? (await projRes.json()).data : [];
      const archives = archRes.ok ? (await archRes.json()).data : [];

      return { projects, archives };
    } catch (error) {
      console.error("[ColosseumAdapter] Falha ao consultar API:", error instanceof Error ? error.message : String(error));
      return { projects: [], archives: [] };
    }
  }
}
