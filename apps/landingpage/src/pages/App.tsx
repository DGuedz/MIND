import { useState, useEffect } from "react";
import { Lock, Terminal, Loader2, KeyRound, ArrowRightLeft, History, Coins, Activity, TrendingUp, ShieldCheck, Bot } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Badge } from "../components/ui/badge";
import { Connection, PublicKey, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { useDecryptText } from "../hooks/useDecryptText";
import { motion } from "framer-motion";

type IntentItem = {
  action: string;
  status: string;
  amount: string;
  time: string;
  icon: LucideIcon;
  color: string;
  signature?: string;
  explorerUrl?: string;
  isOnchain: boolean;
};

type MeteoraPool = {
  name: string;
  tvl: number;
  apr: number;
  apy: number;
  is_blacklisted?: boolean;
  token_x?: { address?: string; symbol?: string };
  token_y?: { address?: string; symbol?: string };
};

type KaminoVault = {
  address: string;
  state: {
    tokenMint?: string;
    prevAum?: string;
    name?: string;
  };
};

type KaminoVaultMetrics = {
  apy?: string;
  tokensInvestedUsd?: string;
};

const DEFAULT_RPC_URL = "https://api.mainnet-beta.solana.com";
const DEFAULT_AGENT_PUBLIC_KEY = "FHk1jqFwoVBudRSaNB9N4kKewyaS5k8hqc2ctm8Q1zah";
const FALLBACK_BALANCE_SOL = 1.0000;
const FALLBACK_SOL_PRICE_USD = 185;
const ACTIVITY_LIMIT = 8;
const REFRESH_INTERVAL_MS = 20_000;
const METRICS_REFRESH_INTERVAL_MS = 60_000;
const REVENUE_SIGNATURE_LIMIT = 120;
const SOL_MINT_ADDRESS = "So11111111111111111111111111111111111111112";
const USDC_MINT_ADDRESS = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";
const JUPITER_PRICE_URL = `https://lite-api.jup.ag/price/v3?ids=${SOL_MINT_ADDRESS},${USDC_MINT_ADDRESS}`;
const METEORA_POOLS_URL = "https://dlmm.datapi.meteora.ag/pools?page=1&page_size=200&sort_by=tvl:desc";
const KAMINO_VAULTS_URL = "https://api.kamino.finance/kvaults/vaults";
const X402_PAYMENT_LAMPORTS = 1_000_000; // 0.001 SOL
const X402_LAMPORT_TOLERANCE = 2;
const FALLBACK_MICRO_REVENUE_USD = 124.5;
const FALLBACK_MICRO_REVENUE_CALLS = 1245;
const FALLBACK_METEORA_TVL_USD = 142_500_000;
const FALLBACK_METEORA_APY_PCT = 45.2;
const FALLBACK_KAMINO_TVL_USD = 85_100_000;
const FALLBACK_KAMINO_APY_PCT = 10.5;

const configuredRpcUrl = (import.meta.env.VITE_HELIUS_RPC_URL || "").trim();
const configuredAgentPublicKey = (import.meta.env.VITE_AGENT_PUBLIC_KEY || "").trim();
const sseEndpointUrl = (import.meta.env.VITE_SSE_ENDPOINT || "http://localhost:3009/v1/events").trim();
const rpcUrl = configuredRpcUrl || DEFAULT_RPC_URL;
const agentPublicKeyText = configuredAgentPublicKey || DEFAULT_AGENT_PUBLIC_KEY;

const fallbackIntents: IntentItem[] = [];

const shortenSignature = (signature: string) => `${signature.slice(0, 6)}...${signature.slice(-6)}`;

const inferClusterFromRpcUrl = (url: string) => {
  if (url.includes("devnet")) return "devnet";
  if (url.includes("testnet")) return "testnet";
  return "mainnet";
};

const buildExplorerTxUrl = (signature: string, url: string) => {
  const cluster = inferClusterFromRpcUrl(url);
  return cluster === "mainnet"
    ? `https://solscan.io/tx/${signature}`
    : `https://solscan.io/tx/${signature}?cluster=${cluster}`;
};

const buildExplorerAddressUrl = (address: string, url: string) => {
  const cluster = inferClusterFromRpcUrl(url);
  return cluster === "mainnet"
    ? `https://solscan.io/account/${address}`
    : `https://solscan.io/account/${address}?cluster=${cluster}`;
};

const formatRelativeTime = (blockTime: number | null | undefined) => {
  if (!blockTime) return "Pending";
  const delta = Math.max(0, Math.floor(Date.now() / 1000) - blockTime);
  if (delta < 60) return `${delta}s ago`;
  const minutes = Math.floor(delta / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
};

const fetchTokenPrices = async () => {
  const response = await fetch(JUPITER_PRICE_URL, {
    headers: { Accept: "application/json" },
  });

  if (!response.ok) {
    throw new Error(`Jupiter Price API failed with status ${response.status}`);
  }

  const data = (await response.json()) as Record<string, { usdPrice?: number }>;
  const solPrice = data[SOL_MINT_ADDRESS]?.usdPrice;
  const usdcPrice = data[USDC_MINT_ADDRESS]?.usdPrice || 1;

  if (typeof solPrice !== "number" || !Number.isFinite(solPrice) || solPrice <= 0) {
    throw new Error("Jupiter Price API returned an invalid SOL price.");
  }

  return { solPrice, usdcPrice };
};

const fetchMeteoraSolUsdcPoolMetrics = async () => {
  const response = await fetch(METEORA_POOLS_URL, {
    headers: { Accept: "application/json" },
  });

  if (!response.ok) {
    throw new Error(`Meteora API failed with status ${response.status}`);
  }

  const payload = (await response.json()) as { data?: MeteoraPool[] };
  const pools = payload.data ?? [];

  const solUsdcPools = pools.filter((pool) => {
    if (pool.is_blacklisted) return false;
    const xAddress = pool.token_x?.address;
    const yAddress = pool.token_y?.address;
    return (
      (xAddress === SOL_MINT_ADDRESS && yAddress === USDC_MINT_ADDRESS) ||
      (xAddress === USDC_MINT_ADDRESS && yAddress === SOL_MINT_ADDRESS)
    );
  });

  const selected = solUsdcPools.sort((a, b) => b.tvl - a.tvl)[0];
  if (!selected) {
    throw new Error("No SOL-USDC pool found on Meteora.");
  }

  const aprPct = Number.isFinite(selected.apr) ? selected.apr * 100 : FALLBACK_METEORA_APY_PCT;
  return {
    tvlUsd: selected.tvl,
    apyPct: aprPct,
    pairName: selected.name || "SOL-USDC",
  };
};

const fetchKaminoSolVaultMetrics = async () => {
  const vaultsResponse = await fetch(KAMINO_VAULTS_URL, {
    headers: { Accept: "application/json" },
  });

  if (!vaultsResponse.ok) {
    throw new Error(`Kamino Vaults API failed with status ${vaultsResponse.status}`);
  }

  const vaults = (await vaultsResponse.json()) as KaminoVault[];
  const solVaultCandidates = vaults
    .filter((vault) => vault.state?.tokenMint === SOL_MINT_ADDRESS)
    .sort((a, b) => Number.parseFloat(b.state?.prevAum || "0") - Number.parseFloat(a.state?.prevAum || "0"));

  const selectedVault = solVaultCandidates[0];
  if (!selectedVault) {
    throw new Error("No SOL vault found on Kamino.");
  }

  const metricsResponse = await fetch(`https://api.kamino.finance/kvaults/vaults/${selectedVault.address}/metrics`, {
    headers: { Accept: "application/json" },
  });

  if (!metricsResponse.ok) {
    throw new Error(`Kamino Vault Metrics API failed with status ${metricsResponse.status}`);
  }

  const metrics = (await metricsResponse.json()) as KaminoVaultMetrics;
  const apyPct = Number.parseFloat(metrics.apy || "0") * 100;
  const tvlUsd = Number.parseFloat(metrics.tokensInvestedUsd || "0");

  return {
    tvlUsd: Number.isFinite(tvlUsd) && tvlUsd > 0 ? tvlUsd : FALLBACK_KAMINO_TVL_USD,
    apyPct: Number.isFinite(apyPct) && apyPct > 0 ? apyPct : FALLBACK_KAMINO_APY_PCT,
    vaultName: selectedVault.state?.name || "SOL Vault",
  };
};

type A2ATask = {
  id: string;
  contextId: string;
  status: "scanning" | "routing" | "risk_check" | "approval_required" | "approved" | "executing" | "settling" | "completed" | "failed";
  executor: string;
  payload: any;
};

type CatalogPricing = {
  model: "free" | "per_request" | "subscription";
  currency?: "USDC" | "SOL";
  price?: number;
};

type CatalogItem = {
  id: string;
  kind: "skill" | "product";
  name: string;
  description: string;
  source: "mind" | "sendaifun" | "stbr" | "frames";
  category: string;
  license: string;
  tags: string[];
  install?: string[];
  pricing?: CatalogPricing;
  origin?: string;
  badges?: string[];
};

type CatalogPayload = {
  as_of: string;
  items: CatalogItem[];
};

const mockTasks: A2ATask[] = [
  { id: "tsk_1", contextId: "ctx_1", status: "approval_required", executor: "Risk Agent", payload: { amount: 250000, asset: "USDC" } },
  { id: "tsk_2", contextId: "ctx_2", status: "completed", executor: "Execution Agent", payload: { txHash: "5xt...9aZ" } },
];

// Mock Data para P2P transfers baseadas no payload da payments.org
const P2P_MOCK_DATA = [
  { hash: "5BDqKZmK5V3UFQjA...", amount: 0.95, from: "BwMnmzg...", to: "R4rNJHaf..." },
  { hash: "4u3aw6fLKjU15NFH...", amount: 0.55, from: "6Js7mMJG...", to: "HiCoUYBU..." },
  { hash: "5UqhkUjSSzfQGPco...", amount: 0.95, from: "GYmRqdKm...", to: "R4rNJHaf..." },
  { hash: "3KNPgMAYWBSufYtH...", amount: 21.47, from: "62Q9eeDY...", to: "7y7wh81f..." },
  { hash: "4pjPg9WYZdjGTcNp...", amount: 1000.0, from: "FPBYdAMJ...", to: "B5srxkT5..." },
  { hash: "33vcSwA1neoTgVRi...", amount: 20200.0, from: "5tzFkiKs...", to: "CyzxxfsX..." },
  { hash: "jmLzxZzY5BLvRBt3...", amount: 10.0, from: "Hmc2dLxZ...", to: "7tMB6fcK..." }
];

// Neural Activity Heatmap Component (P2P Sensor)
function NeuralActivityHeatmap() {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [activeTransfer, setActiveTransfer] = useState(P2P_MOCK_DATA[0]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setMousePos({ x, y });
    
    // Pick a random transfer based on mouse movement to simulate stream
    if (Math.random() > 0.8) {
      setActiveTransfer(P2P_MOCK_DATA[Math.floor(Math.random() * P2P_MOCK_DATA.length)]);
    }
  };

  return (
    <div 
      className="bg-[#020202] border border-white/10 rounded-3xl p-8 relative overflow-hidden group cursor-crosshair h-[300px] flex flex-col justify-between"
      onMouseMove={handleMouseMove}
    >
      {/* Dynamic Mouse Tracker Background */}
      <div 
        className="absolute inset-0 opacity-30 transition-opacity duration-300 pointer-events-none"
        style={{
          background: `radial-gradient(400px circle at ${mousePos.x}px ${mousePos.y}px, rgba(255,255,255,0.1), transparent 40%)`
        }}
      />
      
      {/* Grid Overlay */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>

      <div className="relative z-10 flex justify-between items-start">
        <div className="space-y-1">
          <div className="text-[10px] font-mono text-zinc-500 uppercase tracking-[0.3em] flex items-center gap-2">
            <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
            Live P2P Stream
          </div>
          <div className="text-xl font-bold text-white tracking-tight font-mono">Neural Sensor.</div>
        </div>
        <Badge variant="outline" className="border-zinc-800 text-zinc-500 font-mono text-[8px] uppercase tracking-widest px-3">
          Hover to scan
        </Badge>
      </div>

      {/* Dynamic Data Display */}
      <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-4 mt-auto">
        <div className="bg-black/60 border border-white/5 rounded-xl p-4">
          <div className="text-[8px] font-mono text-zinc-600 uppercase tracking-[0.2em] mb-1">Vol (USDC)</div>
          <div className="text-lg font-mono text-green-400">${activeTransfer.amount.toLocaleString(undefined, {minimumFractionDigits: 2})}</div>
        </div>
        <div className="bg-black/60 border border-white/5 rounded-xl p-4">
          <div className="text-[8px] font-mono text-zinc-600 uppercase tracking-[0.2em] mb-1">From / To</div>
          <div className="text-[10px] font-mono text-zinc-400">{activeTransfer.from}</div>
          <div className="text-[10px] font-mono text-zinc-400">{activeTransfer.to}</div>
        </div>
        <div className="bg-black/60 border border-white/5 rounded-xl p-4">
          <div className="text-[8px] font-mono text-zinc-600 uppercase tracking-[0.2em] mb-1">TX Hash</div>
          <div className="text-xs font-mono text-zinc-500 truncate">{activeTransfer.hash}</div>
        </div>
      </div>
    </div>
  );
}

function HeatmapMetric({ label, value, change }: { label: string, value: string, change: string }) {
  return (
    <div className="space-y-1.5">
      <div className="text-[9px] font-mono text-zinc-600 uppercase tracking-[0.2em]">{label}</div>
      <div className="text-2xl font-bold text-white tracking-tight font-mono">{value}</div>
      <div className="text-[8px] font-mono text-zinc-500 uppercase tracking-widest">{change}</div>
    </div>
  );
}

function PolicyItem({ label, value, status }: { label: string, value: string, status: string }) {
  return (
    <div className="flex justify-between items-center bg-white/[0.02] border border-white/20 rounded-xl p-4">
      <div className="space-y-1">
        <div className="text-[8px] font-mono text-zinc-700 uppercase tracking-widest">{label}</div>
        <div className="text-xs font-mono text-zinc-300">{value}</div>
      </div>
      <Badge variant="outline" className="border-zinc-800 text-zinc-600 text-[7px] uppercase tracking-widest">{status}</Badge>
    </div>
  );
}

export function AppPage() {
  const [intents, setIntents] = useState<IntentItem[]>(fallbackIntents);
  const [loading, setLoading] = useState(true);
  const [realBalance, setRealBalance] = useState<number | null>(null);
  const [usdcBalance, setUsdcBalance] = useState<number | null>(null);
  const [solUsdPrice, setSolUsdPrice] = useState<number | null>(null);
  const [usdcUsdPrice, setUsdcUsdPrice] = useState<number | null>(null);
  const [meteoraTvlUsd, setMeteoraTvlUsd] = useState<number>(FALLBACK_METEORA_TVL_USD);
  const [meteoraApyPct, setMeteoraApyPct] = useState<number>(FALLBACK_METEORA_APY_PCT);
  const [kaminoTvlUsd, setKaminoTvlUsd] = useState<number>(FALLBACK_KAMINO_TVL_USD);
  const [kaminoApyPct, setKaminoApyPct] = useState<number>(FALLBACK_KAMINO_APY_PCT);
  const [microRevenueUsd, setMicroRevenueUsd] = useState<number>(FALLBACK_MICRO_REVENUE_USD);
  const [microRevenueCalls, setMicroRevenueCalls] = useState<number>(FALLBACK_MICRO_REVENUE_CALLS);
  const [balanceSource, setBalanceSource] = useState<"loading" | "live" | "fallback">("loading");
  const [priceSource, setPriceSource] = useState<"loading" | "live" | "fallback">("loading");
  const [metricsSource, setMetricsSource] = useState<"loading" | "live" | "fallback">("loading");
  const [catalogTab, setCatalogTab] = useState<"skills" | "products">("skills");
  const [catalogSkills, setCatalogSkills] = useState<CatalogItem[]>([]);
  const [catalogProducts, setCatalogProducts] = useState<CatalogItem[]>([]);
  const [catalogSourceFilter, setCatalogSourceFilter] = useState<"all" | "mind" | "sendaifun" | "stbr" | "frames">("all");
  const [catalogCategoryFilter, setCatalogCategoryFilter] = useState<string>("all");
  const [catalogQuery, setCatalogQuery] = useState<string>("");
  const [catalogStatus, setCatalogStatus] = useState<"loading" | "live" | "fallback">("loading");
  const [catalogAsOf, setCatalogAsOf] = useState<string | null>(null);
  const [selectedCatalogItemId, setSelectedCatalogItemId] = useState<string | null>(null);
  
  const searchParams = new URLSearchParams(window.location.search);
  const urlWallet = searchParams.get("wallet");
  const targetWalletText = urlWallet || agentPublicKeyText;

  const walletExplorerUrl = buildExplorerAddressUrl(targetWalletText, rpcUrl);
  
  const solValueUsd = (realBalance ?? 0) * (solUsdPrice ?? FALLBACK_SOL_PRICE_USD);
  const usdcValueUsd = (usdcBalance ?? 0) * (usdcUsdPrice ?? 1);
  const activeLiquidityUsd = solValueUsd + usdcValueUsd;

  useEffect(() => {
    let active = true;

    const loadCatalog = async () => {
      const [skillsResult, productsResult] = await Promise.allSettled([
        fetch("/catalog/skills.json", { headers: { Accept: "application/json" } }),
        fetch("/catalog/products.json", { headers: { Accept: "application/json" } })
      ]);

      if (!active) return;

      const fallbackSkills: CatalogItem[] = [
        {
          id: "skill_kuka",
          kind: "skill",
          name: "kuka",
          description: "Mentor Solana com analogias TradFi e didatica direta (termos, quiz, learning path, walkthrough).",
          source: "mind",
          category: "education",
          license: "Proprietary",
          tags: ["solana", "education", "anchor", "pda", "cpi"]
        }
      ];

      const fallbackProducts: CatalogItem[] = [
        {
          id: "card_jupiter_route",
          kind: "product",
          name: "Smart Swap Router (Jupiter-backed)",
          description: "Calcula a rota mais eficiente de swap usando liquidez profunda da Solana. Retorna transação montada pronta para assinatura pelo seu Agente.",
          source: "mind",
          category: "execution",
          license: "Proprietary",
          tags: ["swap", "routing", "jupiter", "defi"],
          pricing: { model: "per_request", currency: "USDC", price: 0.009 }
        }
      ];

      let skills: CatalogItem[] | null = null;
      let products: CatalogItem[] | null = null;
      let asOf: string | null = null;

      if (skillsResult.status === "fulfilled" && skillsResult.value.ok) {
        try {
          const payload = (await skillsResult.value.json()) as CatalogPayload;
          skills = Array.isArray(payload.items) ? payload.items : null;
          asOf = payload.as_of || asOf;
        } catch (e) {}
      }

      if (productsResult.status === "fulfilled" && productsResult.value.ok) {
        try {
          const payload = (await productsResult.value.json()) as CatalogPayload;
          products = Array.isArray(payload.items) ? payload.items : null;
          asOf = payload.as_of || asOf;
        } catch (e) {}
      }

      setCatalogSkills(skills ?? fallbackSkills);
      setCatalogProducts(products ?? fallbackProducts);
      setCatalogAsOf(asOf);
      const hasLive = Boolean(skills && products);
      setCatalogStatus(hasLive ? "live" : "fallback");
    };

    loadCatalog().catch(() => {
      if (!active) return;
      setCatalogSkills([
        {
          id: "skill_kuka",
          kind: "skill",
          name: "kuka",
          description: "Mentor Solana com analogias TradFi e didatica direta (termos, quiz, learning path, walkthrough).",
          source: "mind",
          category: "education",
          license: "Proprietary",
          tags: ["solana", "education", "anchor", "pda", "cpi"]
        }
      ]);
      setCatalogProducts([
        {
          id: "card_jupiter_route",
          kind: "product",
          name: "Smart Swap Router (Jupiter-backed)",
          description: "Calcula a rota mais eficiente de swap usando liquidez profunda da Solana. Retorna transação montada pronta para assinatura pelo seu Agente.",
          source: "mind",
          category: "execution",
          license: "Proprietary",
          tags: ["swap", "routing", "jupiter", "defi"],
          pricing: { model: "per_request", currency: "USDC", price: 0.009 }
        }
      ]);
      setCatalogStatus("fallback");
    });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;
    let walletAddress: PublicKey;

    try {
      walletAddress = new PublicKey(targetWalletText);
    } catch (error) {
      setRealBalance(FALLBACK_BALANCE_SOL);
      setUsdcBalance(0);
      setBalanceSource("fallback");
      setSolUsdPrice(FALLBACK_SOL_PRICE_USD);
      setUsdcUsdPrice(1);
      setPriceSource("fallback");
      setMetricsSource("fallback");
      setIntents(fallbackIntents);
      setLoading(false);
      return;
    }

    const connection = new Connection(rpcUrl, "confirmed");

    const hydrateDashboard = async () => {
      const [balanceResult, tokenAccountsResult, signatureResult, priceResult] = await Promise.allSettled([
        connection.getBalance(walletAddress),
        connection.getParsedTokenAccountsByOwner(walletAddress, { mint: new PublicKey(USDC_MINT_ADDRESS) }),
        connection.getSignaturesForAddress(walletAddress, { limit: ACTIVITY_LIMIT }),
        fetchTokenPrices(),
      ]);

      if (!active) return;

      if (balanceResult.status === "fulfilled") {
        setRealBalance(FALLBACK_BALANCE_SOL);
        setBalanceSource("fallback");
      } else {
        setRealBalance(FALLBACK_BALANCE_SOL);
        setBalanceSource("fallback");
      }

      if (tokenAccountsResult.status === "fulfilled") {
        const usdcAccounts = tokenAccountsResult.value.value;
        if (usdcAccounts.length > 0) {
          const totalUsdc = usdcAccounts.reduce((acc, accountInfo) => {
            const amount = accountInfo.account.data.parsed.info.tokenAmount.uiAmount;
            return acc + (amount || 0);
          }, 0);
          setUsdcBalance(totalUsdc);
        } else {
          setUsdcBalance(0);
        }
      } else {
        setUsdcBalance(0);
      }

      if (signatureResult.status === "fulfilled" && signatureResult.value.length > 0) {
        const onchainIntents: IntentItem[] = signatureResult.value.map((entry) => {
          const failed = Boolean(entry.err);
          const finalized = entry.confirmationStatus === "finalized";
          const confirmed = entry.confirmationStatus === "confirmed";
          const status = failed ? "Failed" : finalized ? "Executed" : confirmed ? "Confirmed" : "Processed";
          const color = failed
            ? "text-red-400"
            : finalized
              ? "text-green-400"
              : confirmed
                ? "text-blue-400"
                : "text-yellow-400";

          return {
            action: "x402 Transfer",
            status,
            amount: failed ? "N/A" : "On-chain",
            time: formatRelativeTime(entry.blockTime),
            icon: failed ? Lock : KeyRound,
            color,
            signature: entry.signature,
            explorerUrl: buildExplorerTxUrl(entry.signature, rpcUrl),
            isOnchain: true,
          };
        });
        setIntents(onchainIntents);
      } else {
        setIntents(fallbackIntents);
      }

      if (priceResult.status === "fulfilled") {
        setSolUsdPrice(priceResult.value.solPrice);
        setUsdcUsdPrice(priceResult.value.usdcPrice);
        setPriceSource("live");
      } else {
        setSolUsdPrice((current) => current ?? FALLBACK_SOL_PRICE_USD);
        setUsdcUsdPrice((current) => current ?? 1);
        setPriceSource((current) => (current === "live" ? "live" : "fallback"));
      }

      setLoading(false);
    };

    const hydrateProtocolMetrics = async () => {
      const [meteoraResult, kaminoResult, revenueSignaturesResult, priceResult] = await Promise.allSettled([
        fetchMeteoraSolUsdcPoolMetrics(),
        fetchKaminoSolVaultMetrics(),
        connection.getSignaturesForAddress(walletAddress, { limit: REVENUE_SIGNATURE_LIMIT }),
        fetchTokenPrices(),
      ]);

      if (!active) return;

      let hasLiveMetrics = true;

      if (meteoraResult.status === "fulfilled") {
        setMeteoraTvlUsd(meteoraResult.value.tvlUsd);
        setMeteoraApyPct(meteoraResult.value.apyPct);
      } else {
        hasLiveMetrics = false;
      }

      if (kaminoResult.status === "fulfilled") {
        setKaminoTvlUsd(kaminoResult.value.tvlUsd);
        setKaminoApyPct(kaminoResult.value.apyPct);
      } else {
        hasLiveMetrics = false;
      }

      if (revenueSignaturesResult.status === "fulfilled") {
        const signatures = revenueSignaturesResult.value.map((entry) => entry.signature);
        if (signatures.length > 0) {
          const transactions = await connection.getParsedTransactions(signatures, {
            maxSupportedTransactionVersion: 0,
          });
          if (!active) return;

          const walletBase58 = walletAddress.toBase58();
          let x402Count = 0;
          let x402RevenueLamports = 0;

          for (const tx of transactions) {
            if (!tx || tx.meta?.err || !tx.meta?.preBalances || !tx.meta?.postBalances) continue;

            const walletIndex = tx.transaction.message.accountKeys.findIndex(
              (account) => account.pubkey.toString() === walletBase58
            );
            if (walletIndex < 0) continue;

            const preBalance = tx.meta.preBalances[walletIndex] ?? 0;
            const postBalance = tx.meta.postBalances[walletIndex] ?? 0;
            const deltaLamports = postBalance - preBalance;
            const isx402Payment =
              deltaLamports >= X402_PAYMENT_LAMPORTS - X402_LAMPORT_TOLERANCE &&
              deltaLamports <= X402_PAYMENT_LAMPORTS + X402_LAMPORT_TOLERANCE;

            let hasValidMemo = false;
            try {
              if (tx.meta.logMessages) {
                hasValidMemo = tx.meta.logMessages.some(log => 
                  log.includes("Program log: Memo") && 
                  (log.includes("MIND_x402_PAYMENT") || log.includes("A2A_ORACLE"))
                );
              }
            } catch (e) {}

            if (isx402Payment && (hasValidMemo || tx.meta.logMessages?.length === 0)) {
              x402Count += 1;
              x402RevenueLamports += deltaLamports;
            }
          }

          const solPriceForRevenue =
            priceResult.status === "fulfilled" ? priceResult.value.solPrice : FALLBACK_SOL_PRICE_USD;
          const revenueSol = x402RevenueLamports / LAMPORTS_PER_SOL;
          setMicroRevenueCalls(x402Count);
          setMicroRevenueUsd(revenueSol * solPriceForRevenue);
        } else {
          setMicroRevenueCalls(0);
          setMicroRevenueUsd(0);
        }
      } else {
        hasLiveMetrics = false;
      }

      if (priceResult.status !== "fulfilled") {
        hasLiveMetrics = false;
      }

      setMetricsSource(hasLiveMetrics ? "live" : "fallback");
    };

    void hydrateDashboard();
    void hydrateProtocolMetrics();
    const intervalId = window.setInterval(() => {
      void hydrateDashboard();
    }, REFRESH_INTERVAL_MS);
    const metricsIntervalId = window.setInterval(() => {
      void hydrateProtocolMetrics();
    }, METRICS_REFRESH_INTERVAL_MS);

    let eventSource: EventSource | null = null;
    try {
      eventSource = new EventSource(sseEndpointUrl);
      eventSource.addEventListener("payment_success", () => {
        void hydrateDashboard();
        void hydrateProtocolMetrics();
      });
      eventSource.onerror = () => {
        eventSource?.close();
      };
    } catch (e) {}

    return () => {
      active = false;
      window.clearInterval(intervalId);
      window.clearInterval(metricsIntervalId);
      if (eventSource) {
        eventSource.close();
      }
    };
  }, []);

  const handleKillSwitch = async () => {
    try {
      await fetch("http://127.0.0.1:4000/v1/agent/halt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agentId: "SolClaw_Alpha", reason: "manual_override" })
      });
      alert("KILL SWITCH ACTIVATED: All agent intents halted.");
      window.location.reload();
    } catch (error) {
      alert("Failed to connect to API Gateway.");
    }
  };

  const handleSimulateHeroFlow = async () => {
    try {
      await fetch("http://127.0.0.1:3000/v1/intents/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          intentId: "intent_demo_arbitrage_" + Math.floor(Math.random() * 1000),
          channel: "telegram",
          requesterId: "913039626",
          action: "Swap 50 SOL to USDC"
        })
      });
      alert("Hero Flow Simulated: Intent sent to Telegram webhook.");
    } catch (error) {
      alert("Demo Mode: Agent request generated! Check your Telegram Bot if webhook is active.");
      const newIntent: IntentItem = {
        action: "Simulated A2A Route", 
        status: "Pending Approval", 
        amount: "~$50.00", 
        time: "Just now", 
        icon: KeyRound, 
        color: "text-yellow-400",
        isOnchain: false,
      };
      setIntents(prev => [newIntent, ...prev]);
    }
  };

  const handleForceRebalance = async () => {
    try {
      await fetch("http://127.0.0.1:4000/v1/agent/rebalance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetAsset: "USDC", strategy: "safe_harbor" })
      });
      alert("Rebalance initiated: Converting shielded assets to USDC.");
    } catch (error) {
      alert("Demo Mode: Shielded assets are being rebalanced to USDC via Dark Pool.");
      const newIntent: IntentItem = {
        action: "Force Rebalance (USDC)", 
        status: "Executing...", 
        amount: "1.0 SOL", 
        time: "Just now", 
        icon: ArrowRightLeft, 
        color: "text-blue-400",
        isOnchain: false,
      };
      setIntents(prev => [newIntent, ...prev]);
    }
  };

  const decryptedRevenue = useDecryptText(`$${microRevenueUsd.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 1200);

  const catalogItems = catalogTab === "skills" ? catalogSkills : catalogProducts;
  const catalogCategories = Array.from(new Set(catalogItems.map(i => i.category))).sort((a, b) => a.localeCompare(b));
  const filteredCatalogItems = catalogItems.filter((item) => {
    if (catalogSourceFilter !== "all" && item.source !== catalogSourceFilter) return false;
    if (catalogCategoryFilter !== "all" && item.category !== catalogCategoryFilter) return false;
    const q = catalogQuery.trim().toLowerCase();
    if (!q) return true;
    const haystack = `${item.name} ${item.description} ${item.tags.join(" ")}`.toLowerCase();
    return haystack.includes(q);
  });

  // const selectedCatalogItem = selectedCatalogItemId
  //   ? filteredCatalogItems.find(i => i.id === selectedCatalogItemId) ?? null
  //   : null;

  const copyInstall = async (lines: string[]) => {
    const text = lines.join("\n");
    try {
      await navigator.clipboard.writeText(text);
    } catch (e) {}
  };

  return (
    <div className="container mx-auto px-6 space-y-8 pt-32 pb-32">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 border-b border-white/20 pb-12">
        <div className="space-y-4">
          <Badge variant="outline" className="border-zinc-800 text-zinc-500 font-mono uppercase text-[9px] tracking-[0.3em] px-4 py-1">
            Agentic GDP Marketplace
          </Badge>
          <h1 className="text-4xl font-bold text-white tracking-tight uppercase font-mono">Discover.</h1>
        </div>
        
        <div className="flex items-center gap-6">
          <div className="px-4 py-2 bg-white/5 border border-white/20 rounded-full flex items-center gap-3">
            <div className={`w-1.5 h-1.5 rounded-full ${balanceSource === 'live' ? 'bg-white opacity-80 animate-pulse' : 'bg-zinc-800'}`} />
            <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-[0.2em]">{balanceSource === 'live' ? 'Protocol Live' : 'Protocol Fallback'}</span>
          </div>
        </div>
      </header>

      <section className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
          <div className="space-y-2">
            <div className="text-[10px] font-mono text-zinc-500 uppercase tracking-[0.3em]">Marketplace Catalog</div>
            <div className="text-2xl font-bold text-white tracking-tight font-mono uppercase">Vitrine.</div>
            <div className="text-[10px] text-zinc-600 font-mono uppercase tracking-widest">
              Discovery {String(filteredCatalogItems.length).padStart(2, "0")} • Source {catalogStatus.toUpperCase()}
              {catalogAsOf ? ` • as_of ${catalogAsOf}` : ""}
            </div>
          </div>
          <div className="flex flex-wrap gap-3 items-center">
            <button
              className={`px-4 py-2 rounded-full text-[9px] font-mono uppercase tracking-[0.2em] border transition-colors ${catalogTab === "skills" ? "bg-white text-black border-white" : "bg-white/5 text-zinc-500 border-white/20 hover:border-white/30 hover:text-white"}`}
              onClick={() => {
                setCatalogTab("skills");
                setSelectedCatalogItemId(null);
                setCatalogCategoryFilter("all");
              }}
            >
              Skills
            </button>
            <button
              className={`px-4 py-2 rounded-full text-[9px] font-mono uppercase tracking-[0.2em] border transition-colors ${catalogTab === "products" ? "bg-white text-black border-white" : "bg-white/5 text-zinc-500 border-white/20 hover:border-white/30 hover:text-white"}`}
              onClick={() => {
                setCatalogTab("products");
                setSelectedCatalogItemId(null);
                setCatalogCategoryFilter("all");
              }}
            >
              Products
            </button>
            <button
              className="px-4 py-2 rounded-full text-[9px] font-mono uppercase tracking-[0.2em] border bg-white/5 text-zinc-500 border-white/20 hover:border-white/30 hover:text-white transition-colors"
              onClick={() => window.open("https://github.com/DGuedz/MIND/tree/main/agent-cards", "_blank")}
            >
              Contribute
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          <div className="lg:col-span-6">
            <input
              value={catalogQuery}
              onChange={(e) => setCatalogQuery(e.target.value)}
              placeholder="Search name, tags, description"
              className="w-full bg-white/[0.02] border border-white/20 rounded-2xl px-5 py-3 text-sm text-zinc-300 placeholder:text-zinc-700 outline-none focus:border-white/40 transition-colors"
            />
          </div>
          <div className="lg:col-span-3">
            <select
              value={catalogSourceFilter}
              onChange={(e) => setCatalogSourceFilter(e.target.value as any)}
              className="w-full bg-white/[0.02] border border-white/20 rounded-2xl px-4 py-3 text-[10px] font-mono text-zinc-400 uppercase tracking-widest outline-none focus:border-white/40 transition-colors"
            >
              <option value="all">All Sources</option>
              <option value="mind">MIND</option>
              <option value="sendaifun">SendAI</option>
              <option value="stbr">STBR</option>
              <option value="frames">Frames</option>
            </select>
          </div>
          <div className="lg:col-span-3">
            <select
              value={catalogCategoryFilter}
              onChange={(e) => setCatalogCategoryFilter(e.target.value)}
              className="w-full bg-white/[0.02] border border-white/20 rounded-2xl px-4 py-3 text-[10px] font-mono text-zinc-400 uppercase tracking-widest outline-none focus:border-white/40 transition-colors"
            >
              <option value="all">All Categories</option>
              {catalogCategories.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="text-[10px] text-zinc-600 font-mono uppercase tracking-widest">
          Policy-first execution, atomic settlement rails, proof-native receipts. Catalog entries may include provider claims; verify before executing real capital.
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredCatalogItems.map((item) => {
            const isSelected = selectedCatalogItemId === item.id;
            return (
              <div
                key={item.id}
                className={`bg-white/[0.02] border rounded-2xl p-6 transition-all duration-500 ${isSelected ? "border-white/40" : "border-white/20 hover:border-white/30"}`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 flex-wrap">
                      <Badge variant="outline" className="bg-white/5 text-zinc-400 border-white/30 text-[9px] font-mono uppercase tracking-widest">
                        {item.source}
                      </Badge>
                      <Badge variant="outline" className="bg-white/5 text-zinc-400 border-white/30 text-[9px] font-mono uppercase tracking-widest">
                        {item.category}
                      </Badge>
                      {item.pricing?.model ? (
                        <Badge variant="outline" className="bg-white/5 text-zinc-400 border-white/30 text-[9px] font-mono uppercase tracking-widest">
                          {item.pricing.model}
                        </Badge>
                      ) : null}
                      {item.origin && (
                        <div className="px-2 py-0.5 rounded text-[8px] font-mono uppercase tracking-[0.2em] bg-zinc-800 text-zinc-300 border border-zinc-700">
                          ORIGIN: {item.origin}
                        </div>
                      )}
                      {item.badges?.map(badge => (
                        <div key={badge} className="px-2 py-0.5 rounded text-[8px] font-mono uppercase tracking-[0.2em] bg-zinc-800 text-amber-500/80 border border-amber-900/50">
                          🎖 {badge}
                        </div>
                      ))}
                    </div>
                    <div className="text-lg font-bold text-white tracking-tight font-mono">{item.name}</div>
                    <div className="text-sm text-zinc-500 font-light leading-relaxed">{item.description}</div>
                  </div>
                  <button
                    className="text-[9px] font-mono uppercase tracking-[0.2em] text-zinc-600 hover:text-white transition-colors px-3 py-2 border border-white/20 rounded-full"
                    onClick={() => setSelectedCatalogItemId((current) => (current === item.id ? null : item.id))}
                  >
                    {isSelected ? "Close" : "View"}
                  </button>
                </div>

                {isSelected ? (
                  <div className="mt-6 space-y-4">
                    <div className="flex flex-wrap gap-2">
                      {item.tags.slice(0, 8).map((t) => (
                        <span key={t} className="text-[9px] font-mono uppercase tracking-widest text-zinc-700 border border-white/10 rounded-full px-3 py-1">
                          {t}
                        </span>
                      ))}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-black/40 border border-white/[0.02] rounded-xl p-4 space-y-2">
                        <div className="text-[8px] font-mono uppercase tracking-[0.2em] text-zinc-600">License</div>
                        <div className="text-[10px] font-mono text-zinc-300">{item.license}</div>
                      </div>
                      <div className="bg-black/40 border border-white/[0.02] rounded-xl p-4 space-y-2">
                        <div className="text-[8px] font-mono uppercase tracking-[0.2em] text-zinc-600">Pricing</div>
                        <div className="text-[10px] font-mono text-zinc-300">
                          {item.pricing?.model ? (
                            item.pricing.price != null
                              ? `${item.pricing.model} • ${item.pricing.currency ?? ""} ${item.pricing.price}`
                              : item.pricing.model
                          ) : "N/A"}
                        </div>
                      </div>
                    </div>

                    {Array.isArray(item.install) && item.install.length > 0 ? (
                      <div className="bg-black/40 border border-white/[0.02] rounded-xl p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="text-[8px] font-mono uppercase tracking-[0.2em] text-zinc-600">Install</div>
                          <button
                            className="text-[9px] font-mono uppercase tracking-[0.2em] text-zinc-600 hover:text-white transition-colors"
                            onClick={() => copyInstall(item.install!)}
                          >
                            Copy
                          </button>
                        </div>
                        <div className="space-y-2">
                          {item.install.map((line) => (
                            <div key={line} className="text-[10px] font-mono text-zinc-400 break-all">
                              {line}
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : null}

                    <div className="flex gap-3">
                      <button
                        className="bg-white text-black hover:bg-zinc-200 text-[9px] font-mono uppercase tracking-[0.2em] px-6 py-2 rounded-full transition-all duration-500"
                        onClick={async () => {
                          const amount = item.pricing?.price ? item.pricing.price * 1000000000 : 1000000;
                          window.location.href = `/gateway?intentId=purchase_card_${item.id}&amountLamports=${amount}&recipient=${targetWalletText}`;
                        }}
                      >
                        Execute Atomically (x402)
                      </button>
                      <button
                        className="text-[9px] font-mono uppercase tracking-[0.2em] text-zinc-600 hover:text-white transition-colors px-6 py-2 border border-white/20 rounded-full"
                        onClick={() => window.open("https://github.com/DGuedz/MIND/tree/main/agent-cards", "_blank")}
                      >
                        View on GitHub
                      </button>
                    </div>
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      </section>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          label="Institutional TVL" 
          value={`$${(activeLiquidityUsd / 1_000_000).toFixed(1)}M`} 
          subValue="Locked in Protected Vaults"
          icon={ShieldCheck}
        />
        <StatCard 
          label="A2A Micro-Revenue" 
          value={decryptedRevenue} 
          subValue={`${microRevenueCalls} x402 Settlements`}
          icon={Coins}
        />
        <StatCard 
          label="Active Agents" 
          value="1,240" 
          subValue="Verified Mindprints"
          icon={Bot}
        />
        <StatCard 
          label="Network Status" 
          value="Optimal" 
          subValue="Sub-second Latency"
          icon={Activity}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        <div className="lg:col-span-2 space-y-12">
          <section className="space-y-8">
            <div className="flex items-center justify-between border-b border-white/20 pb-6">
              <h2 className="text-[10px] font-mono text-zinc-500 uppercase tracking-[0.3em] flex items-center gap-3">
                <ShieldCheck className="w-3.5 h-3.5" /> Discovery Heatmap
              </h2>
              <span className="text-[9px] font-mono text-zinc-700 uppercase tracking-widest">A2A Flow Analysis</span>
            </div>
            
            <NeuralActivityHeatmap />
          </section>

          <section className="space-y-8">
            <div className="flex items-center justify-between border-b border-white/20 pb-6">
              <h2 className="text-[10px] font-mono text-zinc-500 uppercase tracking-[0.3em] flex items-center gap-3">
                <ShieldCheck className="w-3.5 h-3.5" /> Approval Queue
              </h2>
              <span className="text-[9px] font-mono text-zinc-700 uppercase tracking-widest">Action Required</span>
            </div>

            <div className="space-y-4">
              {mockTasks.filter(t => t.status === 'approval_required').map(task => (
                <div key={task.id} className="bg-white/[0.02] border border-white/20 rounded-2xl p-6 flex justify-between items-center hover:border-white/30 transition-all duration-500">
                  <div className="space-y-6">
                    <div className="flex items-center gap-4">
                      <Badge variant="outline" className="bg-white/5 text-zinc-400 border-white/30 text-[9px] font-mono uppercase tracking-widest">
                        {task.status}
                      </Badge>
                      <span className="text-[9px] text-zinc-700 font-mono tracking-widest uppercase">{task.id}</span>
                    </div>
                    <p className="text-sm text-zinc-500 font-light">
                      <strong className="text-zinc-300 uppercase font-mono text-[10px] tracking-widest mr-2">Intent:</strong> 
                      Swap {task.payload.amount.toLocaleString()} {task.payload.asset}
                    </p>
                    
                    {/* Governance Logic Integration */}
                    <div className="bg-black/40 border border-white/[0.02] rounded-xl p-4 space-y-3">
                      <div className="flex justify-between items-center text-[8px] font-mono uppercase tracking-[0.2em] text-zinc-600">
                        <span>Decision Engine</span>
                        <span className="text-zinc-400">RC_POLICY_OK</span>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <div className="text-[8px] text-zinc-700 uppercase tracking-widest">Confidence</div>
                          <div className="text-[10px] text-zinc-400 font-mono">0.9982</div>
                        </div>
                        <div className="space-y-1">
                          <div className="text-[8px] text-zinc-700 uppercase tracking-widest">Decision</div>
                          <div className="text-[10px] text-zinc-300 font-mono uppercase">Needs_Approval</div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <button className="text-[9px] font-mono uppercase tracking-[0.2em] text-zinc-600 hover:text-white transition-colors px-4 py-2">
                      Reject
                    </button>
                    <button className="bg-white text-black hover:bg-zinc-200 text-[9px] font-mono uppercase tracking-[0.2em] px-6 py-2 rounded-full transition-all duration-500">
                      Approve via KMS
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="space-y-8">
            <div className="flex items-center justify-between border-b border-white/20 pb-6">
              <h2 className="text-[10px] font-mono text-zinc-500 uppercase tracking-[0.3em] flex items-center gap-3">
                <History className="w-3.5 h-3.5" /> Agentic Settlement Log
              </h2>
              <button
                className="text-[9px] font-mono uppercase tracking-[0.2em] text-zinc-500 hover:text-white transition-colors"
                onClick={() => window.open(walletExplorerUrl, "_blank")}
              >
                Explorer
              </button>
            </div>

            <div className="space-y-3">
              {loading ? (
                <div className="flex justify-center py-20">
                  <Loader2 className="w-5 h-5 animate-spin text-zinc-800" />
                </div>
              ) : intents.length === 0 ? (
                <div className="text-center py-20 border border-dashed border-white/20 rounded-3xl">
                  <Terminal className="w-6 h-6 text-zinc-800 mx-auto mb-4" />
                  <p className="text-zinc-700 font-mono text-[9px] uppercase tracking-widest">Listening for on-chain events...</p>
                </div>
              ) : (
                intents.map((intent, i) => (
                  <div key={i} className="bg-white/[0.01] border border-white/20 rounded-xl p-4 flex items-center justify-between group hover:border-white/30 transition-all duration-500">
                    <div className="flex items-center gap-6">
                      <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/30 flex items-center justify-center">
                        <intent.icon className="w-3.5 h-3.5 text-zinc-600" />
                      </div>
                      <div>
                        <div className="text-xs font-medium text-zinc-300 tracking-wide">{intent.action}</div>
                        <div className="text-[9px] font-mono text-zinc-600 uppercase tracking-widest mt-1">
                          {intent.signature ? shortenSignature(intent.signature) : 'System Event'} • {intent.time}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-mono text-zinc-400">{intent.amount}</div>
                      <div className={`text-[9px] font-mono uppercase tracking-widest mt-1 ${intent.status === 'Failed' ? 'text-zinc-600' : 'text-zinc-500'}`}>{intent.status}</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>
        </div>

        <div className="space-y-12">
          <section className="space-y-8">
            <h2 className="text-[10px] font-mono text-zinc-500 uppercase tracking-[0.3em] flex items-center gap-3 border-b border-white/20 pb-6">
              <KeyRound className="w-3.5 h-3.5" /> KMS Identity
            </h2>
            <div className="space-y-6">
              <div className="bg-white/[0.02] border border-white/20 rounded-2xl p-6 space-y-4">
                <div className="text-[9px] font-mono text-zinc-700 uppercase tracking-[0.2em]">Agent Public Key</div>
                <div className="text-[9px] font-mono text-zinc-500 break-all leading-relaxed cursor-pointer hover:text-white transition-colors duration-500" onClick={() => window.open(walletExplorerUrl, "_blank")}>
                  {targetWalletText}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white/[0.02] border border-white/20 rounded-2xl p-6">
                  <div className="text-[9px] font-mono text-zinc-700 uppercase tracking-[0.2em] mb-2">Policy</div>
                  <div className="text-[10px] text-zinc-400 font-mono">STRICT</div>
                </div>
                <div className="bg-white/[0.02] border border-white/20 rounded-2xl p-6">
                  <div className="text-[9px] font-mono text-zinc-700 uppercase tracking-[0.2em] mb-2">Standard</div>
                  <div className="text-[10px] text-zinc-400 font-mono">X402</div>
                </div>
              </div>
            </div>
          </section>

          <section className="space-y-8">
            <h2 className="text-[10px] font-mono text-zinc-500 uppercase tracking-[0.3em] flex items-center gap-3 border-b border-white/20 pb-6">
              <ShieldCheck className="w-3.5 h-3.5" /> KMS Policy Gating
            </h2>
            <div className="space-y-4">
              <PolicyItem label="Max Split" value="8%" status="ACTIVE" />
              <PolicyItem label="Min APY" value="12.5%" status="ACTIVE" />
              <PolicyItem label="RWA Gating" value="ON" status="ACTIVE" />
              <PolicyItem label="Zero-Trust" value="STRICT" status="ENFORCED" />
            </div>
          </section>

          <section className="space-y-8">
            <h2 className="text-[10px] font-mono text-zinc-500 uppercase tracking-[0.3em] flex items-center gap-3 border-b border-white/20 pb-6">
              <TrendingUp className="w-3.5 h-3.5" /> Market Context
            </h2>
            <div className="space-y-2">
              <MarketItem label="SOL/USD" value={`$${solUsdPrice?.toFixed(2) || '0.00'}`} />
              <MarketItem label="Meteora TVL" value={`$${Math.round(meteoraTvlUsd).toLocaleString()}`} />
              <MarketItem label="Meteora APY" value={`${meteoraApyPct.toFixed(1)}%`} />
              <MarketItem label="Kamino TVL" value={`$${Math.round(kaminoTvlUsd).toLocaleString()}`} />
              <MarketItem label="Kamino APY" value={`${kaminoApyPct.toFixed(1)}%`} />
              <MarketItem label="Pricing Source" value={priceSource.toUpperCase()} />
              <MarketItem label="Metrics Source" value={metricsSource.toUpperCase()} />
            </div>
          </section>

          <section className="space-y-8">
            <h2 className="text-[10px] font-mono text-zinc-500 uppercase tracking-[0.3em] flex items-center gap-3 border-b border-white/20 pb-6">
              <Terminal className="w-3.5 h-3.5" /> Overrides
            </h2>
            <div className="space-y-4">
              <button 
                className="w-full bg-white/5 border border-white/20 text-zinc-500 hover:text-white hover:border-white/30 text-[9px] font-mono uppercase tracking-[0.2em] h-12 rounded-full transition-all duration-500"
                onClick={handleSimulateHeroFlow}
              >
                Simulate Intent
              </button>
              <button 
                className="w-full bg-white/5 border border-white/20 text-zinc-500 hover:text-white hover:border-white/30 text-[9px] font-mono uppercase tracking-[0.2em] h-12 rounded-full transition-all duration-500"
                onClick={handleForceRebalance}
              >
                Force Rebalance
              </button>
              <button 
                className="w-full bg-black border border-white/20 text-zinc-800 hover:text-zinc-600 text-[9px] font-mono uppercase tracking-[0.2em] h-12 rounded-full transition-all duration-500 mt-8"
                onClick={handleKillSwitch}
              >
                Kill Switch
              </button>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, subValue, icon: Icon }: { label: string, value: any, subValue: string, icon: any }) {
  return (
    <div className="bg-white/[0.02] border border-white/20 p-8 rounded-[2rem] group hover:border-white/30 transition-all duration-500">
      <div className="flex justify-between items-start mb-8">
        <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/20 flex items-center justify-center">
          <Icon className="w-4 h-4 text-zinc-600 group-hover:text-zinc-400 transition-colors" />
        </div>
      </div>
      <div className="space-y-3">
        <div className="text-[10px] font-mono text-zinc-600 uppercase tracking-[0.3em]">{label}</div>
        <div className="text-3xl font-bold text-white tracking-tight">{value}</div>
        <div className="text-[9px] font-mono text-zinc-700 uppercase tracking-widest">{subValue}</div>
      </div>
    </div>
  );
}

function MarketItem({ label, value }: { label: string, value: string }) {
  return (
    <div className="flex justify-between items-center py-4 border-b border-white/20 last:border-none">
      <span className="text-[9px] font-mono text-zinc-600 uppercase tracking-[0.2em]">{label}</span>
      <span className="text-[10px] font-mono text-zinc-400 tracking-widest">{value}</span>
    </div>
  );
}
