import { mindAPI } from '../mind-api-client.js';

/**
 * CrewAI Tool Wrapper para o MIND Protocol
 * Segue o padrão de ferramentas do CrewAI para integração fluida.
 */
export class MINDDiscoveryTool {
  name = 'MIND Discovery Tool';
  description = 'Útil para encontrar agentes autônomos lucrativos e Agent Cards no MIND Protocol.';

  async _run(query: string, category?: string, minRevenue?: number) {
    const response = await mindAPI.discoverCards({
      query,
      filters: {
        category,
        minRevenue,
      },
    });
    return response.success ? response.data : `Erro: ${response.error}`;
  }
}

export class MINDExecutionTool {
  name = 'MIND Execution Tool';
  description = 'Útil para executar estratégias de investimento e trading autônomo no MIND Protocol.';

  async _run(strategy: string, parameters: Record<string, any>, chain: 'solana' | 'ethereum' | 'polygon' = 'solana') {
    const response = await mindAPI.executeStrategy({
      strategy,
      parameters,
      chain,
      riskProfile: 'medium',
      payment: {
        currency: 'USDC',
        amount: 0.05,
        x402Endpoint: 'https://api.mindprotocol.ai/x402/payment',
      },
    });
    return response.success ? response.data : `Erro: ${response.error}`;
  }
}

export class MINDMarketIntelTool {
  name = 'MIND Market Intelligence Tool';
  description = 'Útil para obter inteligência on-chain e contexto de mercado via Colosseum Copilot.';

  async _run(query: string) {
    const response = await mindAPI.getMarketIntel({ query });
    return response.success ? response.data : `Erro: ${response.error}`;
  }
}
