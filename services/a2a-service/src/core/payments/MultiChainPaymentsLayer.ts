import { SolanaPaymentsLayer } from "./SolanaPaymentsLayer.js";

export type ChainType = 'solana' | 'ethereum' | 'polygon';

export interface MultiChainPaymentRequest {
  chain: ChainType;
  recipient: string;
  asset: string;
  amount: number;
  memo?: string;
}

export interface MultiChainPaymentResult {
  chain: ChainType;
  paymentUrl: string;
  reference: string;
  amount: number;
  asset: string;
}

export class MultiChainPaymentsLayer {
  private solanaLayer: SolanaPaymentsLayer;

  constructor(solanaLayer: SolanaPaymentsLayer) {
    this.solanaLayer = solanaLayer;
  }

  public async createPaymentRequest(request: MultiChainPaymentRequest): Promise<MultiChainPaymentResult> {
    switch (request.chain) {
      case 'solana':
        const solResult = this.solanaLayer.createPaymentRequest(
          request.recipient,
          request.asset,
          request.amount,
          request.memo
        );
        return {
          chain: 'solana',
          paymentUrl: solResult.url,
          reference: solResult.reference,
          amount: solResult.amount,
          asset: request.asset,
        };

      case 'ethereum':
      case 'polygon':
        // Mocking EVM payment request (EIP-681)
        const chainId = request.chain === 'ethereum' ? 1 : 137;
        const evmUrl = `ethereum:${request.recipient}@${chainId}?value=${request.amount}e18`;
        const evmReference = `evm_ref_${Math.random().toString(36).substring(7)}`;
        
        return {
          chain: request.chain,
          paymentUrl: evmUrl,
          reference: evmReference,
          amount: request.amount,
          asset: request.asset,
        };

      default:
        throw new Error(`Chain ${request.chain} not supported`);
    }
  }

  public async verifyPayment(
    chain: ChainType,
    reference: string,
    recipient: string,
    asset: string,
    amount: number
  ) {
    switch (chain) {
      case 'solana':
        return this.solanaLayer.verifyPayment(reference, recipient, asset, amount);
      
      case 'ethereum':
      case 'polygon':
        // Mocking EVM verification
        console.log(`[MultiChain] Verificando pagamento em ${chain} para ${recipient}...`);
        return { status: "confirmed", txHash: `0x${Math.random().toString(16).slice(2)}` };

      default:
        throw new Error(`Chain ${chain} not supported`);
    }
  }
}
