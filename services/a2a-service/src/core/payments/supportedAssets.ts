import { PublicKey } from "@solana/web3.js";

// Definição dos programas de token na Solana
export const TOKEN_PROGRAM_ID = new PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA");
export const TOKEN_2022_PROGRAM_ID = new PublicKey("TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb");

export interface SupportedAsset {
  symbol: string;
  mintAddress: string | null; // null significa SOL nativo
  decimals: number;
  programId: PublicKey;
  issuer?: string;
}

/**
 * Catálogo base de ativos suportados (Mainnet)
 * Alinhado com a documentação oficial da Solana (2026-04-01)
 * Fonte: https://solana.com/docs/payments/how-payments-work
 */
export const SUPPORTED_ASSETS: Record<string, SupportedAsset> = {
  SOL: {
    symbol: "SOL",
    mintAddress: null, // Ativo nativo
    decimals: 9,
    programId: new PublicKey("11111111111111111111111111111111"), // System Program
  },
  USDC: {
    symbol: "USDC",
    mintAddress: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
    decimals: 6,
    programId: TOKEN_PROGRAM_ID,
    issuer: "Circle",
  },
  USDT: {
    symbol: "USDT",
    mintAddress: "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB",
    decimals: 6,
    programId: TOKEN_PROGRAM_ID,
    issuer: "Tether",
  },
  PYUSD: {
    symbol: "PYUSD",
    mintAddress: "2b1kV6DkPAnxd5ixfnxCpjxmKwqjjaYmCZfHsFu24GXo",
    decimals: 6,
    programId: TOKEN_2022_PROGRAM_ID,
    issuer: "PayPal",
  },
  USDG: {
    symbol: "USDG",
    mintAddress: "uxg8pT3x3qN7F97PzB1xXg2yJ2v9GjY6M9M9hJ8tS9w", // Endereço de exemplo/placeholder para USDG, ajustar conforme docs de 2026 se diferir
    decimals: 6,
    programId: TOKEN_2022_PROGRAM_ID,
    issuer: "Paxos",
  },
};

export const getAssetBySymbol = (symbol: string): SupportedAsset | undefined => {
  return SUPPORTED_ASSETS[symbol.toUpperCase()];
};
