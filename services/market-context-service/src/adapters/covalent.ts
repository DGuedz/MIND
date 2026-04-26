import { createHash } from "node:crypto";
import { postJson } from "./http.js";
import { GoldRushClient } from "@covalenthq/client-sdk";

const canonicalize = (value: unknown): string => {
  if (value === null || value === undefined) {
    return "null";
  }
  if (Array.isArray(value)) {
    return `[${value.map(canonicalize).join(",")}]`;
  }
  if (typeof value === "object") {
    const obj = value as Record<string, unknown>;
    const keys = Object.keys(obj).sort();
    return `{${keys.map((key) => `${JSON.stringify(key)}:${canonicalize(obj[key])}`).join(",")}}`;
  }
  return JSON.stringify(value);
};

const hashValue = (value: unknown): string => {
  return createHash("sha256").update(canonicalize(value)).digest("hex");
};

type CovalentFetchedResult = {
  status: "fetched";
  statusCode: number;
  snapshotHash: string;
  raw: unknown;
};

type CovalentSkippedResult = {
  status: "skipped";
  reason: "missing_endpoint" | "missing_api_key";
};

type CovalentFailedResult = {
  status: "failed";
  reason: "http_error" | "sdk_error";
  statusCode?: number;
  raw: unknown;
};

export type CovalentContextResult =
  | CovalentFetchedResult
  | CovalentSkippedResult
  | CovalentFailedResult;

export const fetchCovalentContext = async (payload: Record<string, unknown>): Promise<CovalentContextResult> => {
  const apiKey = process.env.COVALENT_API_KEY;
  if (!apiKey) {
    return { status: "skipped", reason: "missing_api_key" } as CovalentSkippedResult;
  }

  try {
    const client = new GoldRushClient(apiKey);
    let rawData: Record<string, unknown> = {};

    // Covalent SDK Integration for Solana (solana-mainnet)
    if (payload.action === "get_balances" && typeof payload.wallet === "string") {
      const resp = await client.BalanceService.getTokenBalancesForWalletAddress("solana-mainnet", payload.wallet);
      rawData = resp.data ?? {};
    } else if (payload.action === "get_portfolio" && typeof payload.wallet === "string") {
      const resp = await client.BalanceService.getHistoricalPortfolioForWalletAddress("solana-mainnet", payload.wallet);
      rawData = resp.data ?? {};
    } else if (payload.action === "check_credential_nft" && typeof payload.wallet === "string" && typeof payload.nftMint === "string") {
      // Only Agents: Check if the wallet owns the specific Metaplex Credential NFT
      const resp = await client.NftService.getNftsForAddress("solana-mainnet", payload.wallet);
      const nfts = resp.data?.items ?? [];
      const hasNft = nfts.some(nft => nft.nft_data?.some(data => data.token_id === payload.nftMint));
      rawData = { ownsCredential: hasNft, wallet: payload.wallet, nftMint: payload.nftMint };
    } else {
      // Fallback or generic Covalent endpoint logic if needed
      rawData = { message: "unsupported_covalent_action", payload };
    }

    const snapshotHash = hashValue({ payload, response: rawData });

    return {
      status: "fetched",
      statusCode: 200,
      snapshotHash,
      raw: rawData
    };
  } catch (error: unknown) {
    const statusCode = (error as { status?: number }).status || 500;
    const message = (error as { message?: string }).message || String(error);
    
    return {
      status: "failed",
      reason: "sdk_error",
      statusCode,
      raw: message
    };
  }
};

export const computeSnapshotHash = (payload: Record<string, unknown>, raw: string) => {
  return hashValue({ payload, response: raw });
};
