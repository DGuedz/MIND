/**
 * MIND API Client - Cliente oficial para integração com a MIND API
 * Fornece acesso real aos serviços de Autonomous Execution, Market Intelligence e Risk Scoring
 */

import { getEnv } from '../../services/shared/env.js';

export interface MINDAPIConfig {
  baseURL: string;
  apiKey?: string;
  timeout?: number;
}

export interface APIResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  code?: string;
}

export interface DiscoveryQuery {
  query: string;
  filters?: {
    tags?: string[];
    category?: string;
    minRevenue?: number;
    maxPrice?: number;
    compatibleFrameworks?: string[];
  };
  limit?: number;
  offset?: number;
}

export interface AgentCard {
  id: string;
  name: string;
  description: string;
  tags: string[];
  pricing: {
    model: 'free' | 'per_request' | 'subscription';
    currency: string;
    price: number;
    tieredPricing?: any;
  };
  endpoints: {
    discovery: string;
    metadata: string;
    data: string;
    payment: string;
  };
  economicMetrics: {
    monthlyRevenue?: number;
    profitMargin?: number;
    lifetimeValue?: number;
    acquisitionCost?: number;
    growthRate?: number;
  };
  provenance: {
    source: string;
    createdAt: string;
    updatedAt: string;
    signature: string;
  };
}

export interface ExecutionRequest {
  strategy: string;
  parameters: Record<string, any>;
  riskProfile: 'low' | 'medium' | 'high';
  chain: 'solana' | 'ethereum' | 'polygon';
  payment: {
    currency: string;
    amount: number;
    x402Endpoint: string;
  };
}

export interface AnalyticsEvent {
  eventType: 'discovery' | 'execution' | 'payment' | 'error';
  agentId?: string;
  cardId?: string;
  metadata?: Record<string, any>;
  timestamp: string;
}

export interface MarketIntelRequest {
  query: string;
  filters?: {
    projects?: boolean;
    archives?: boolean;
    marketData?: boolean;
  };
  limit?: number;
}

export interface RiskAssessmentRequest {
  transactionData: Record<string, any>;
  marketContext?: Record<string, any>;
  riskPreferences?: {
    maxDrawdown?: number;
    targetReturn?: number;
    riskTolerance?: 'low' | 'medium' | 'high';
  };
}

export class MINDAPIClient {
  private config: MINDAPIConfig;

  constructor(config?: Partial<MINDAPIConfig>) {
    this.config = {
      baseURL: config?.baseURL || getEnv('MIND_API_BASE_URL') || 'https://api.mindprotocol.ai',
      apiKey: config?.apiKey || getEnv('MIND_API_KEY'),
      timeout: config?.timeout || 30000,
    };

    if (!this.config.apiKey) {
      console.warn('⚠️ MIND_API_KEY não configurada. Algumas funcionalidades podem ser limitadas.');
    }
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<APIResponse<T>> {
    const url = `${this.config.baseURL}${endpoint}`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

    try {
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
        ...(this.config.apiKey && { 'Authorization': `Bearer ${this.config.apiKey}` }),
        ...options.headers,
      };

      const response = await fetch(url, {
        ...options,
        headers,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        return {
          success: false,
          error: `HTTP ${response.status}: ${response.statusText}`,
          code: `HTTP_${response.status}`,
        };
      }

      const data = await response.json();
      return {
        success: true,
        data,
      };
    } catch (error: any) {
      clearTimeout(timeoutId);
      
      if (error.name === 'AbortError') {
        return {
          success: false,
          error: 'Request timeout',
          code: 'TIMEOUT',
        };
      }

      return {
        success: false,
        error: error.message,
        code: 'NETWORK_ERROR',
      };
    }
  }

  /**
   * Registra um evento de analytics
   */
  async trackAnalytics(event: Omit<AnalyticsEvent, 'timestamp'>): Promise<APIResponse<void>> {
    return this.request<void>('/v1/analytics/track', {
      method: 'POST',
      body: JSON.stringify({
        ...event,
        timestamp: new Date().toISOString(),
      }),
    });
  }

  /**
   * Descobre Agent Cards disponíveis no marketplace
   */
  async discoverCards(query: DiscoveryQuery): Promise<APIResponse<AgentCard[]>> {
    const response = await this.request<AgentCard[]>('/v1/discovery/cards', {
      method: 'POST',
      body: JSON.stringify(query),
    });

    if (response.success) {
      await this.trackAnalytics({
        eventType: 'discovery',
        metadata: { query: query.query, resultsCount: response.data?.length },
      });
    }

    return response;
  }

  /**
   * Executa uma estratégia autônoma (multi-chain)
   */
  async executeStrategy(request: ExecutionRequest): Promise<APIResponse<{ transactionId: string; result: any; chain: string }>> {
    const response = await this.request<{ transactionId: string; result: any; chain: string }>('/v1/execute/autonomous', {
      method: 'POST',
      body: JSON.stringify(request),
    });

    if (response.success) {
      await this.trackAnalytics({
        eventType: 'execution',
        metadata: { strategy: request.strategy, chain: request.chain },
      });
    }

    return response;
  }

  /**
   * Obtém inteligência de mercado
   */
  async getMarketIntel(request: MarketIntelRequest): Promise<APIResponse<{ insights: any[]; projects: any[]; archives: any[] }>> {
    return this.request<{ insights: any[]; projects: any[]; archives: any[] }>('/v1/market/intel', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  /**
   * Avalia risco de uma transação
   */
  async assessRisk(request: RiskAssessmentRequest): Promise<APIResponse<{ score: number; assessment: string; recommendations: string[] }>> {
    return this.request<{ score: number; assessment: string; recommendations: string[] }>('/v1/risk/assess', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  /**
   * Processa pagamento x402 (multi-chain)
   */
  async processPayment(
    amount: number,
    currency: string,
    recipient: string,
    chain: 'solana' | 'ethereum' | 'polygon' = 'solana',
    metadata?: Record<string, any>
  ): Promise<APIResponse<{ paymentId: string; status: string; transactionHash?: string; chain: string }>> {
    const response = await this.request<{ paymentId: string; status: string; transactionHash?: string; chain: string }>('/v1/payment/x402', {
      method: 'POST',
      body: JSON.stringify({
        amount,
        currency,
        recipient,
        chain,
        metadata,
      }),
    });

    if (response.success) {
      await this.trackAnalytics({
        eventType: 'payment',
        metadata: { amount, currency, chain },
      });
    }

    return response;
  }

  /**
   * Obtém métricas de desempenho em tempo real
   */
  async getPerformanceMetrics(): Promise<APIResponse<{
    totalTransactions: number;
    monthlyRevenue: number;
    activeAgents: number;
    successRate: number;
    averageLatency: number;
    chainDistribution: Record<string, number>;
  }>> {
    return this.request<{
      totalTransactions: number;
      monthlyRevenue: number;
      activeAgents: number;
      successRate: number;
      averageLatency: number;
      chainDistribution: Record<string, number>;
    }>('/v1/analytics/performance', {
      method: 'GET',
    });
  }

  /**
   * Valida a integridade de um Agent Card
   */
  async validateCard(card: AgentCard): Promise<APIResponse<{ valid: boolean; errors: string[] }>> {
    return this.request<{ valid: boolean; errors: string[] }>('/v1/discovery/validate', {
      method: 'POST',
      body: JSON.stringify(card),
    });
  }

  /**
   * Registra um novo Agent Card no marketplace
   */
  async registerAgentCard(card: any): Promise<APIResponse<{ cardId: string; discoveryUrl: string }>> {
    return this.request<{ cardId: string; discoveryUrl: string }>('/v1/registry/agent-cards', {
      method: 'POST',
      body: JSON.stringify(card),
    });
  }
}

// Singleton instance for global use
export const mindAPI = new MINDAPIClient();

// Utility functions for common operations
export const MIND = {
  /**
   * Discover profitable Agent Cards
   */
  async discoverProfitableCards(minRevenue: number = 10000, maxPrice: number = 0.1) {
    return mindAPI.discoverCards({
      query: 'profitable high margin',
      filters: {
        minRevenue,
        maxPrice,
      },
      limit: 20,
    });
  },

  /**
   * Execute autonomous trading strategy
   */
  async executeTradingStrategy(strategy: string, parameters: Record<string, any>, chain: 'solana' | 'ethereum' | 'polygon' = 'solana') {
    return mindAPI.executeStrategy({
      strategy,
      parameters,
      riskProfile: 'medium',
      chain,
      payment: {
        currency: 'USDC',
        amount: 0.05,
        x402Endpoint: 'https://api.mindprotocol.ai/x402/payment',
      },
    });
  },

  /**
   * Get market intelligence for investment decisions
   */
  async getInvestmentIntel(query: string) {
    return mindAPI.getMarketIntel({
      query,
      filters: {
        projects: true,
        archives: true,
        marketData: true,
      },
      limit: 10,
    });
  },

  /**
   * Quick risk assessment
   */
  async quickRiskCheck(transactionData: Record<string, any>) {
    return mindAPI.assessRisk({
      transactionData,
      riskPreferences: {
        riskTolerance: 'medium',
        maxDrawdown: 10,
      },
    });
  },
};
