import { mindAPI } from '../mind-api-client.js';
import { DynamicStructuredTool } from '@langchain/core/tools';
import { z } from 'zod';

/**
 * LangChain Tool para descoberta de Agent Cards no MIND Protocol
 */
export const mindDiscoveryTool = new DynamicStructuredTool({
  name: 'mind_discovery',
  description: 'Descobre Agent Cards no MIND Protocol baseado em critérios econômicos e funcionais.',
  schema: z.object({
    query: z.string().describe('A busca por agentes (ex: "high yield trading", "risk assessment")'),
    category: z.string().optional().describe('Categoria do agente'),
    minRevenue: z.number().optional().describe('Receita mensal mínima esperada'),
  }),
  func: async ({ query, category, minRevenue }: { query: string; category?: string; minRevenue?: number }) => {
    const response = await mindAPI.discoverCards({
      query,
      filters: {
        category,
        minRevenue,
      },
    });
    return JSON.stringify(response.data || response.error);
  },
});

/**
 * LangChain Tool para execução autônoma via MIND
 */
export const mindExecutionTool = new DynamicStructuredTool({
  name: 'mind_execution',
  description: 'Executa uma estratégia autônoma no MIND Protocol com liquidação on-chain.',
  schema: z.object({
    strategy: z.string().describe('Nome da estratégia a ser executada'),
    parameters: z.record(z.any()).describe('Parâmetros da estratégia'),
    chain: z.enum(['solana', 'ethereum', 'polygon']).default('solana'),
  }),
  func: async ({ strategy, parameters, chain }: { strategy: string; parameters: Record<string, any>; chain: string }) => {
    const response = await mindAPI.executeStrategy({
      strategy,
      parameters,
      chain: chain as any,
      riskProfile: 'medium',
      payment: {
        currency: 'USDC',
        amount: 0.05,
        x402Endpoint: 'https://api.mindprotocol.ai/x402/payment',
      },
    });
    return JSON.stringify(response.data || response.error);
  },
});

/**
 * LangChain Tool para inteligência de mercado
 */
export const mindMarketIntelTool = new DynamicStructuredTool({
  name: 'mind_market_intel',
  description: 'Obtém inteligência de mercado em tempo real usando o Colosseum Copilot do MIND.',
  schema: z.object({
    query: z.string().describe('A consulta de mercado (ex: "top trending solana projects")'),
  }),
  func: async ({ query }: { query: string }) => {
    const response = await mindAPI.getMarketIntel({ query });
    return JSON.stringify(response.data || response.error);
  },
});
