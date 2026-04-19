import { Connection, Keypair, PublicKey, ParsedTransactionWithMeta } from "@solana/web3.js";
import { getAssetBySymbol, SupportedAsset, SUPPORTED_ASSETS } from "./supportedAssets.js";

export interface PaymentRequestResult {
  url: string;
  reference: string;
  asset: SupportedAsset;
  amount: number;
}

export interface VerificationResult {
  status: "pending" | "reference_not_found" | "confirmed" | "failed";
  reason?: string;
  txHash?: string;
}

export class SolanaPaymentsLayer {
  private connection: Connection;
  private network: string;

  constructor(connection: Connection, network: string = "mainnet-beta") {
    this.connection = connection;
    this.network = network;
  }

  /**
   * Step 1: Request
   * Generate a Solana Pay URL for an Agent (or human) to pay.
   * Includes a unique `reference` for on-chain reconciliation.
   */
  public createPaymentRequest(
    recipientStr: string,
    assetSymbol: string,
    amount: number,
    memo?: string,
    label: string = "MIND Protocol A2A"
  ): PaymentRequestResult {
    const asset = getAssetBySymbol(assetSymbol);
    if (!asset) {
      throw new Error(`Asset ${assetSymbol} is not supported.`);
    }

    // Generate a unique reference keypair (standard Solana Pay mechanism)
    const referenceKeypair = Keypair.generate();
    const referenceStr = referenceKeypair.publicKey.toBase58();

    // Base URL
    let url = `solana:${recipientStr}?amount=${amount}&reference=${referenceStr}&label=${encodeURIComponent(label)}`;

    // If it's an SPL token, append spl-token
    if (asset.mintAddress) {
      url += `&spl-token=${asset.mintAddress}`;
    }

    if (memo) {
      url += `&memo=${encodeURIComponent(memo)}`;
    }

    return {
      url,
      reference: referenceStr,
      asset,
      amount,
    };
  }

  /**
   * Step 2: Verify
   * Find the transaction on-chain using the `reference` public key,
   * then verify if the recipient received the correct amount of the correct asset.
   */
  public async verifyPayment(
    referenceStr: string,
    recipientStr: string,
    assetSymbol: string,
    expectedAmount: number
  ): Promise<VerificationResult> {
    const asset = getAssetBySymbol(assetSymbol);
    if (!asset) {
      return { status: "failed", reason: `Asset ${assetSymbol} not supported.` };
    }

    try {
      const referencePubkey = new PublicKey(referenceStr);
      
      // Find signatures for the reference address
      const signatures = await this.connection.getSignaturesForAddress(referencePubkey, { limit: 1 }, "confirmed");

      if (!signatures || signatures.length === 0 || !signatures[0]) {
        return { status: "pending", reason: "reference_not_found" };
      }

      const txSignature = signatures[0].signature;
      
      // Fetch the parsed transaction
      const tx = await this.connection.getParsedTransaction(txSignature, {
        commitment: "confirmed",
        maxSupportedTransactionVersion: 0,
      });

      if (!tx || !tx.meta) {
        return { status: "pending", reason: "transaction_not_fully_confirmed_or_unavailable" };
      }

      if (tx.meta.err) {
        return { status: "failed", reason: "transaction_failed_on_chain", txHash: txSignature };
      }

      // Verify the actual transfer matches our expectations
      const isValid = this.validateTransfer(tx, recipientStr, asset, expectedAmount);

      if (isValid) {
        return { status: "confirmed", txHash: txSignature };
      } else {
        return { status: "failed", reason: "transfer_validation_failed_amount_or_recipient_mismatch", txHash: txSignature };
      }

    } catch (error) {
      console.error("[SolanaPaymentsLayer] Verify Error:", error instanceof Error ? error.message : String(error));
      // RPC 429 or other network issues
      return { status: "failed", reason: `rpc_or_network_error: ${(error as Error).message}` };
    }
  }

  private validateTransfer(
    tx: ParsedTransactionWithMeta,
    recipientStr: string,
    asset: SupportedAsset,
    expectedAmount: number
  ): boolean {
    if (!tx || !tx.meta) return false;

    if (asset.mintAddress === null) {
      // Validate Native SOL transfer
      // Look at pre/post balances for the recipient
      const accountIndex = tx.transaction.message.accountKeys.findIndex(
        (k) => k.pubkey.toBase58() === recipientStr
      );
      if (accountIndex === -1) return false;

      const preBalance = tx.meta.preBalances[accountIndex] ?? 0;
      const postBalance = tx.meta.postBalances[accountIndex] ?? 0;
      
      const lamportsTransferred = postBalance - preBalance;
      const expectedLamports = expectedAmount * 1e9; // 9 decimals for SOL

      // Allow a small tolerance for rent if recipient was unfunded, or exact match
      return lamportsTransferred >= expectedLamports;
    } else {
      // Validate SPL Token transfer
      // Look at pre/post token balances for the recipient's ATA
      const preTokenBalances = tx.meta.preTokenBalances || [];
      const postTokenBalances = tx.meta.postTokenBalances || [];

      // Find the post-balance for the recipient and specific mint
      const recipientPostBalance = postTokenBalances.find(
        (tb) => tx.transaction.message.accountKeys[tb.accountIndex]?.pubkey.toBase58() === recipientStr || tb.owner === recipientStr
      );

      if (!recipientPostBalance || recipientPostBalance.mint !== asset.mintAddress || !recipientPostBalance.uiTokenAmount.uiAmountString) {
        return false;
      }

      // Find pre-balance
      const recipientPreBalance = preTokenBalances.find(
        (tb) => tb.accountIndex === recipientPostBalance.accountIndex
      );

      const preAmount = recipientPreBalance?.uiTokenAmount.uiAmountString ? Number(recipientPreBalance.uiTokenAmount.uiAmountString) : 0;
      const postAmount = Number(recipientPostBalance.uiTokenAmount.uiAmountString);

      const tokensTransferred = postAmount - preAmount;

      // Ensure they sent at least the expected amount
      // (Using >= handles rounding issues or someone sending slightly more)
      return tokensTransferred >= expectedAmount;
    }
  }
}
