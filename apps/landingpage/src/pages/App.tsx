import { useState, useEffect } from "react";
import { Shield, Lock, Terminal, Loader2, EyeOff, KeyRound, Zap, ArrowRightLeft, History, Coins, Activity, TrendingUp, ArrowUpRight, ShieldCheck } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Connection, PublicKey, LAMPORTS_PER_SOL } from "@solana/web3.js";

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

// Limpando os logs mocados para iniciar a demo de forma orgânica e "em branco".
const fallbackIntents: IntentItem[] = [];

const shortenAddress = (address: string) => `${address.slice(0, 4)}...${address.slice(-4)}`;
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
  const usdcPrice = data[USDC_MINT_ADDRESS]?.usdPrice || 1; // Default to 1 if USDC fetch fails

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

type A2AContext = {
  id: string;
  intent: string;
  status: "open" | "accepted" | "cancelled" | "expired";
  createdAt: string;
};

type A2ATask = {
  id: string;
  contextId: string;
  status: "scanning" | "routing" | "risk_check" | "approval_required" | "approved" | "executing" | "settling" | "completed" | "failed";
  executor: string;
  payload: any;
};

const mockContexts: A2AContext[] = [
  { id: "ctx_1", intent: "Swap 250k USDC to SOL", status: "open", createdAt: "2 mins ago" },
  { id: "ctx_2", intent: "JIT Liquidity Activation", status: "accepted", createdAt: "15 mins ago" },
  { id: "ctx_3", intent: "Rebalance Treasury", status: "cancelled", createdAt: "1 hour ago" }
];

const mockTasks: A2ATask[] = [
  { id: "tsk_1", contextId: "ctx_1", status: "approval_required", executor: "Risk Agent", payload: { amount: 250000, asset: "USDC" } },
  { id: "tsk_2", contextId: "ctx_2", status: "completed", executor: "Execution Agent", payload: { txHash: "5xt...9aZ" } },
];

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
  
  // Lê a wallet da URL (query parameter) se existir
  const searchParams = new URLSearchParams(window.location.search);
  const urlWallet = searchParams.get("wallet");
  const targetWalletText = urlWallet || agentPublicKeyText;

  const walletExplorerUrl = buildExplorerAddressUrl(targetWalletText, rpcUrl);
  
  // Calcula o valor total em USD da carteira (SOL + USDC)
  const solValueUsd = (realBalance ?? 0) * (solUsdPrice ?? FALLBACK_SOL_PRICE_USD);
  const usdcValueUsd = (usdcBalance ?? 0) * (usdcUsdPrice ?? 1);
  const activeLiquidityUsd = solValueUsd + usdcValueUsd;

  useEffect(() => {
    let active = true;
    let walletAddress: PublicKey;

    try {
      walletAddress = new PublicKey(targetWalletText);
    } catch (error) {
      console.error("Invalid Public Key; falling back to demo dashboard.", error);
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
        const liveBalance = balanceResult.value / LAMPORTS_PER_SOL;
        // Estratégia B2B Pitch: Se o saldo for poeira (< 0.1 SOL), forçamos o valor mockado institucional.
        if (liveBalance < 0.1) {
          setRealBalance(FALLBACK_BALANCE_SOL);
          setBalanceSource("fallback");
        } else {
          setRealBalance(liveBalance);
          setBalanceSource("live");
        }
      } else {
        console.error("Failed to fetch live Solana balance:", balanceResult.reason);
        setRealBalance(FALLBACK_BALANCE_SOL);
        setBalanceSource("fallback");
      }

      // Process USDC Balance
      if (tokenAccountsResult.status === "fulfilled") {
        const usdcAccounts = tokenAccountsResult.value.value;
        if (usdcAccounts.length > 0) {
          // Soma os saldos de todas as contas USDC que a carteira possuir
          const totalUsdc = usdcAccounts.reduce((acc, accountInfo) => {
            const amount = accountInfo.account.data.parsed.info.tokenAmount.uiAmount;
            return acc + (amount || 0);
          }, 0);
          setUsdcBalance(totalUsdc);
        } else {
          setUsdcBalance(0);
        }
      } else {
        console.warn("Failed to fetch USDC token accounts, defaulting to 0");
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
        if (signatureResult.status === "rejected") {
          console.error("Failed to fetch on-chain signatures:", signatureResult.reason);
        }
        setIntents(fallbackIntents);
      }

      if (priceResult.status === "fulfilled") {
        setSolUsdPrice(priceResult.value.solPrice);
        setUsdcUsdPrice(priceResult.value.usdcPrice);
        setPriceSource("live");
      } else {
        console.error("Failed to fetch live prices from Jupiter:", priceResult.reason);
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
        console.error("Failed to fetch Meteora metrics:", meteoraResult.reason);
        hasLiveMetrics = false;
      }

      if (kaminoResult.status === "fulfilled") {
        setKaminoTvlUsd(kaminoResult.value.tvlUsd);
        setKaminoApyPct(kaminoResult.value.apyPct);
      } else {
        console.error("Failed to fetch Kamino metrics:", kaminoResult.reason);
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

            // Extra institutional precision: filter by memo if available
            let hasValidMemo = false;
            try {
              if (tx.meta.logMessages) {
                hasValidMemo = tx.meta.logMessages.some(log => 
                  log.includes("Program log: Memo") && 
                  (log.includes("MIND_x402_PAYMENT") || log.includes("A2A_ORACLE"))
                );
              }
            } catch (e) {
              // Ignore memo parse errors, fallback to just delta check
            }

            // Consider it a valid payment if it has the right amount AND (has valid memo OR no memos were parsed but we trust the delta)
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
        console.error("Failed to fetch signatures for micro-revenue:", revenueSignaturesResult.reason);
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

    // Setup SSE for real-time updates (Sprint 3)
    let eventSource: EventSource | null = null;
    try {
      eventSource = new EventSource(sseEndpointUrl);
      eventSource.addEventListener("payment_success", (e) => {
        console.log("Real-time update received: payment_success", e.data);
        // Refresh dashboard instantly
        void hydrateDashboard();
        void hydrateProtocolMetrics();
      });
      eventSource.onerror = () => {
        // Silently fail if mock server is not running
        eventSource?.close();
      };
    } catch (e) {
      console.log("SSE not available, falling back to polling.");
    }

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
      console.error("Kill switch failed:", error);
      alert("Failed to connect to API Gateway.");
    }
  };

  const handleSimulateHeroFlow = async () => {
    try {
      // Tenta bater no backend local (gateway) se estiver rodando para disparar o webhook do Telegram
      await fetch("http://127.0.0.1:3000/v1/intents/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          intentId: "intent_demo_arbitrage_" + Math.floor(Math.random() * 1000),
          channel: "telegram",
          requesterId: "913039626", // ID do usuário
          action: "Swap 50 SOL to USDC"
        })
      });
      alert("Hero Flow Simulated: Intent sent to Telegram webhook.");
    } catch (error) {
      console.warn("Local backend not running, simulating UI fallback...", error);
      alert("Demo Mode: Agent request generated! Check your Telegram Bot if webhook is active.");
      
      // Adiciona uma nova intent simulada no topo da lista para efeito visual
      const newIntent: IntentItem = {
        action: "Simulated A2A Route", 
        status: "Pending User Approval", 
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
      // Simula uma chamada de rebalanceamento de portfólio
      await fetch("http://127.0.0.1:4000/v1/agent/rebalance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetAsset: "USDC", strategy: "safe_harbor" })
      });
      alert("Rebalance initiated: Converting shielded assets to USDC.");
    } catch (error) {
      console.warn("Local backend not running, simulating UI fallback...", error);
      alert("Demo Mode: Shielded assets are being rebalanced to USDC via Dark Pool.");
      
      const newIntent: IntentItem = {
        action: "Force Rebalance (USDC)", 
        status: "Executing...", 
        amount: "14.2 SOL", 
        time: "Just now", 
        icon: ArrowRightLeft, 
        color: "text-blue-400",
        isOnchain: false,
      };
      setIntents(prev => [newIntent, ...prev]);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-black text-gray-200 font-sans">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-white/[0.03] via-black to-black -z-10" />
      
      {/* ========================================================================= */}
      {/* MOBILE WALLET VIEW (Shown only on small screens)                          */}
      {/* ========================================================================= */}
      <div className="md:hidden block pt-6 pb-24 px-4">
        <header className="mb-6 flex justify-between items-center">
          <Badge variant="outline" className="bg-white/5 text-gray-300 border-white/10 font-mono text-[10px] uppercase tracking-wider">
            <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse mr-2" />
            ZK Dark Pool
          </Badge>
          <div className="flex items-center gap-2 text-xs text-gray-400 font-mono">
            <Terminal className="w-3 h-3" /> SolClaw_Alpha
          </div>
        </header>

        {/* Big Balance Card (Wallet Style) */}
        <div className="bg-black rounded-3xl p-6 border border-white/10 mb-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <Shield className="w-24 h-24 text-white" />
          </div>
          <p className="text-gray-500 text-sm mb-2 relative z-10 font-mono uppercase tracking-wider text-[10px]">KMS Protected TVL</p>
          <div className="text-4xl font-light text-white mb-1 flex items-baseline gap-2 relative z-10 tracking-tight">
            {realBalance !== null ? (
              <>
                {realBalance.toFixed(4)} <span className="text-xl text-gray-500 font-medium">SOL</span>
              </>
            ) : (
              <Loader2 className="w-6 h-6 animate-spin text-gray-500" />
            )}
          </div>
          <p className="text-[10px] text-gray-500 mb-3 font-mono uppercase tracking-wider">
            {balanceSource === "live" ? "Source: Solana RPC" : balanceSource === "fallback" ? "Source: Demo Fallback" : "Source: Loading"}
          </p>
          <p className="text-xs text-gray-400 flex items-center gap-1 relative z-10 mb-6 font-mono uppercase tracking-wider text-[9px]">
            <Lock className="w-3 h-3" /> ZK Compressed
          </p>

          {/* Quick Actions Horizontal Scroll */}
          <div className="flex gap-3 relative z-10">
            <button className="flex-1 bg-white/5 hover:bg-white/10 transition-colors rounded-2xl py-3 flex flex-col items-center justify-center gap-2 border border-white/5">
              <ArrowRightLeft className="w-5 h-5 text-white" />
              <span className="text-[10px] font-medium text-gray-400">Swap</span>
            </button>
            <button className="flex-1 bg-white/5 hover:bg-white/10 transition-colors rounded-2xl py-3 flex flex-col items-center justify-center gap-2 border border-white/5">
              <History className="w-5 h-5 text-white" />
              <span className="text-[10px] font-medium text-gray-400">History</span>
            </button>
            <button className="flex-1 bg-white/5 hover:bg-white/10 transition-colors rounded-2xl py-3 flex flex-col items-center justify-center gap-2 border border-white/5" onClick={handleKillSwitch}>
              <Zap className="w-5 h-5 text-white" />
              <span className="text-[10px] font-medium text-gray-400">Halt</span>
            </button>
          </div>
        </div>

        {/* Recent Intents Feed */}
        <div>
          <div className="flex justify-between items-center mb-4 px-2">
            <h3 className="font-medium text-lg text-white">Recent Intents</h3>
            <span className="text-xs text-gray-500 font-mono uppercase tracking-wider text-[9px]">Last 24h</span>
          </div>
          <div className="space-y-3">
            {loading ? (
              <div className="p-8 flex justify-center items-center">
                <Loader2 className="w-6 h-6 animate-spin text-white/50" />
              </div>
            ) : (
              intents.map((intent, i) => (
                <div key={i} className="bg-black rounded-2xl p-4 border border-white/10 flex items-center justify-between hover:border-white/20 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                      <intent.icon className="w-4 h-4 text-gray-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium leading-tight text-white">{intent.action}</p>
                      <p className="text-xs text-gray-500 mt-0.5 font-mono">{intent.time}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-mono leading-tight text-white">{intent.amount}</p>
                    <p className={`text-[10px] mt-0.5 font-mono uppercase tracking-wider ${intent.color}`}>{intent.status}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* DESKTOP DASHBOARD VIEW (Shown only on medium screens and up)              */}
      {/* ========================================================================= */}
      <div className="hidden md:block pt-32 pb-48 container mx-auto px-6">
        <header className="mb-12">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-4xl font-medium tracking-tight text-white">Agent Hub</h1>
            <div className="flex items-center gap-4 bg-black border border-white/10 rounded-full py-2 px-4">
              <span className="text-sm text-gray-500 uppercase tracking-wider font-mono text-[10px]">Wallet:</span>
              <span className="text-sm font-mono text-gray-300" title={targetWalletText}>{shortenAddress(targetWalletText)}</span>
              <div className="w-px h-4 bg-white/20 mx-2" />
              <Badge variant="outline" className="bg-white/5 text-gray-300 border-white/10 font-mono text-[10px] uppercase tracking-wider">
                Connected
              </Badge>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <p className="text-gray-400 max-w-2xl text-sm">
              Monitor your connected AI agent's performance, manage permissions, and track shielded liquidity in real-time.
            </p>
            <div className="px-4 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm font-medium flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Mainnet Active
            </div>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 animate-in fade-in duration-500">
          
          {/* Main Content Area */}
          <div className="lg:col-span-3 space-y-6">
            
            {/* Top Stat Cards (DeFi Theme) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Card 1 */}
              <div className="bg-gradient-to-br from-emerald-900/20 to-black p-6 rounded-[2rem] border border-emerald-500/20 hover:border-emerald-500/40 transition-all group relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-50 group-hover:opacity-100 transition-opacity">
                  <ArrowUpRight className="w-5 h-5 text-emerald-400" />
                </div>
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center">
                    <Coins className="w-5 h-5 text-emerald-400" />
                  </div>
                  <span className="text-lg font-medium text-white">SOL (Treasury)</span>
                </div>
                <div className="space-y-1 mb-6">
                  <div className="text-sm text-gray-400">
                    {balanceSource === "live" ? "Real Balance (Live)" : balanceSource === "fallback" ? "Demo Balance" : "Loading..."}
                  </div>
                  <div className="text-3xl font-bold text-white flex items-baseline gap-2">
                    {realBalance !== null ? (
                      <>
                        ${solValueUsd.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} <span className="text-lg text-gray-500 font-normal">USD</span>
                      </>
                    ) : (
                      <Loader2 className="w-6 h-6 animate-spin text-emerald-500" />
                    )}
                  </div>
                </div>
                <div className="flex items-center justify-between pt-4 border-t border-white/5">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-sm text-gray-300">Kamino Vault</span>
                  </div>
                  <div className="flex items-center gap-1 bg-emerald-500/10 px-2 py-1 rounded-lg">
                    <TrendingUp className="w-3 h-3 text-emerald-400" />
                    <span className="text-xs font-medium text-emerald-400">{kaminoApyPct.toFixed(2)}% APY</span>
                  </div>
                </div>
              </div>

              {/* Card 2 */}
              <div className="bg-gradient-to-br from-blue-900/20 to-black p-6 rounded-[2rem] border border-blue-500/20 hover:border-blue-500/40 transition-all group relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-50 group-hover:opacity-100 transition-opacity">
                  <ArrowUpRight className="w-5 h-5 text-blue-400" />
                </div>
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center">
                    <Zap className="w-5 h-5 text-blue-400" />
                  </div>
                  <span className="text-lg font-medium text-white">USDC-SOL (DLMM)</span>
                </div>
                <div className="space-y-1 mb-6">
                  <div className="text-sm text-gray-400">
                    Active Liquidity ({priceSource === "live" ? "Jupiter Live" : priceSource === "fallback" ? "Fallback" : "Loading"})
                  </div>
                  <div className="text-3xl font-bold text-white">
                    ${activeLiquidityUsd.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                </div>
                <div className="flex items-center justify-between pt-4 border-t border-white/5">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-blue-400" />
                    <span className="text-sm text-gray-300">Meteora Pool</span>
                  </div>
                  <div className="flex items-center gap-1 bg-blue-500/10 px-2 py-1 rounded-lg">
                    <TrendingUp className="w-3 h-3 text-blue-400" />
                    <span className="text-xs font-medium text-blue-400">{meteoraApyPct.toFixed(2)}% APY</span>
                  </div>
                </div>
              </div>

              {/* Card 3 */}
              <div className="bg-gradient-to-br from-purple-900/20 to-black p-6 rounded-[2rem] border border-purple-500/20 hover:border-purple-500/40 transition-all group relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-50 group-hover:opacity-100 transition-opacity">
                  <ArrowUpRight className="w-5 h-5 text-purple-400" />
                </div>
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center">
                    <ShieldCheck className="w-5 h-5 text-purple-400" />
                  </div>
                  <span className="text-lg font-medium text-white">Risk Oracle (A2A)</span>
                </div>
                <div className="space-y-1 mb-6">
                  <div className="text-sm text-gray-400">
                    A2A Data Sales ({metricsSource === "live" ? "On-chain Live" : metricsSource === "fallback" ? "Fallback" : "Loading"})
                  </div>
                  <div className="text-3xl font-bold text-white">
                    ${microRevenueUsd.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                </div>
                <div className="flex items-center justify-between pt-4 border-t border-white/5">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-purple-400" />
                    <span className="text-sm text-gray-300">x402 Router</span>
                  </div>
                  <div className="flex items-center gap-1 bg-purple-500/10 px-2 py-1 rounded-lg">
                    <Activity className="w-3 h-3 text-purple-400" />
                    <span className="text-xs font-medium text-purple-400">{microRevenueCalls.toLocaleString()} calls</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Approval Queue (Human-in-the-Loop) */}
            <div className="bg-black border border-yellow-900/50 rounded-2xl p-6">
              <h2 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-yellow-500" />
                Approval Queue (HITL)
              </h2>
              <div className="space-y-3">
                {mockTasks.filter(t => t.status === 'approval_required').map(task => (
                  <div key={task.id} className="bg-white/5 border border-white/10 p-4 rounded-xl flex justify-between items-center hover:border-yellow-500/30 transition-colors">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline" className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20 text-xs font-mono uppercase">
                          {task.status}
                        </Badge>
                        <span className="text-[10px] text-gray-500 font-mono">{task.id} (Ctx: {task.contextId})</span>
                      </div>
                      <p className="text-sm text-gray-300">
                        <strong className="text-white">Intent:</strong> Swap {task.payload.amount.toLocaleString()} {task.payload.asset}
                      </p>
                      <p className="text-[10px] text-gray-500 mt-1 font-mono">Blocked by: IntentFirewall ({">"} 10 SOL Limit)</p>
                    </div>
                    <div className="flex gap-3">
                      <Button variant="outline" className="border-red-900/50 text-red-400 hover:bg-red-900/20 hover:text-red-300 text-xs h-8">
                        Reject
                      </Button>
                      <Button className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs h-8">
                        Approve via KMS
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Active Contexts */}
            <div className="bg-black border border-white/10 rounded-2xl overflow-hidden">
              <div className="p-6 border-b border-white/5">
                <h2 className="text-lg font-medium text-white flex items-center gap-2">
                  <Activity className="w-5 h-5 text-blue-400" />
                  Active A2A Contexts
                </h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-[10px] text-gray-500 uppercase font-mono bg-white/5 border-b border-white/10">
                    <tr>
                      <th className="px-6 py-4 font-medium">Context ID</th>
                      <th className="px-6 py-4 font-medium">Intent</th>
                      <th className="px-6 py-4 font-medium">Status</th>
                      <th className="px-6 py-4 font-medium">Created</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {mockContexts.map(ctx => (
                      <tr key={ctx.id} className="hover:bg-white/5 transition-colors group">
                        <td className="px-6 py-4 font-mono text-gray-400 text-xs">{ctx.id}</td>
                        <td className="px-6 py-4 text-gray-200">{ctx.intent}</td>
                        <td className="px-6 py-4">
                          <Badge variant="outline" className={`text-[10px] uppercase font-mono border-white/10 ${
                            ctx.status === 'open' ? 'bg-blue-500/10 text-blue-400' :
                            ctx.status === 'accepted' ? 'bg-emerald-500/10 text-emerald-400' :
                            'bg-gray-500/10 text-gray-400'
                          }`}>
                            {ctx.status}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 text-gray-500 font-mono text-[10px]">{ctx.createdAt}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Agent Activity Log */}
            <div className="bg-black rounded-2xl border border-white/10 overflow-hidden">
              <div className="p-6 border-b border-white/5 flex justify-between items-center">
                <h3 className="font-medium text-lg text-white">Agentic Settlement Log</h3>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 text-xs bg-transparent border-white/10 text-gray-300 hover:text-white hover:bg-white/5 uppercase tracking-wider font-mono text-[10px]"
                  onClick={() => window.open(walletExplorerUrl, "_blank", "noopener,noreferrer")}
                >
                  View Explorer
                </Button>
              </div>
              <div className="divide-y divide-white/5">
                {loading ? (
                  <div className="p-12 flex justify-center items-center">
                    <Loader2 className="w-8 h-8 animate-spin text-white/50" />
                  </div>
                ) : (
                  intents.map((intent, i) => (
                    <div key={i} className="p-4 px-6 flex items-center justify-between hover:bg-white/5 transition-colors cursor-default">
                      <div className="flex items-center gap-4 w-1/3">
                        <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
                          <intent.icon className="w-4 h-4 text-gray-400" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-white">{intent.action}</p>
                          <p className="text-xs text-gray-500 font-mono">{intent.time}</p>
                        </div>
                      </div>
                      <div className="w-1/3 text-center">
                        {intent.signature && intent.explorerUrl ? (
                          <a
                            href={intent.explorerUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-2 py-1 rounded-full bg-white/5 border border-white/10 text-[10px] font-mono text-blue-300 uppercase tracking-wider hover:text-white hover:border-white/20 transition-colors"
                          >
                            TX: {shortenSignature(intent.signature)}
                          </a>
                        ) : (
                          <span className="px-2 py-1 rounded-full bg-white/5 border border-white/10 text-[10px] font-mono text-gray-400 uppercase tracking-wider">
                            DEMO ENTRY
                          </span>
                        )}
                      </div>
                      <div className="w-1/3 text-right">
                        <p className="text-sm font-mono text-white">{intent.amount}</p>
                        <p className={`text-[10px] font-mono uppercase tracking-wider ${intent.color}`}>{intent.status}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Solana Ecosystem Opportunities Table */}
            <div className="bg-black/40 border border-white/10 rounded-3xl overflow-hidden backdrop-blur-md">
              <div className="p-6 border-b border-white/5 flex items-center justify-between">
                <h2 className="text-xl font-medium text-white">JIT Liquidity & A2A Routing Pools</h2>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="bg-white/5 text-gray-300 border-white/10">All Networks</Badge>
                  <Badge variant="outline" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20">High Yield</Badge>
                </div>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-white/5 text-sm text-gray-400">
                      <th className="p-6 font-medium">Assets</th>
                      <th className="p-6 font-medium">Provider</th>
                      <th className="p-6 font-medium">Strategy</th>
                      <th className="p-6 font-medium">Risk Score</th>
                      <th className="p-6 font-medium">TVL</th>
                      <th className="p-6 font-medium text-right">APY</th>
                      <th className="p-6 font-medium text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="text-sm">
                    {/* Row 1 */}
                    <tr className="border-b border-white/5 hover:bg-white/5 transition-colors group">
                      <td className="p-6">
                        <div className="flex items-center gap-3">
                          <div className="flex -space-x-2">
                            <div className="w-8 h-8 rounded-full bg-[#14F195] flex items-center justify-center border-2 border-black"><span className="text-black font-bold text-[10px]">SOL</span></div>
                            <div className="w-8 h-8 rounded-full bg-[#2775CA] flex items-center justify-center border-2 border-black"><span className="text-white font-bold text-[10px]">USDC</span></div>
                          </div>
                          <span className="font-medium text-white">SOL - USDC</span>
                        </div>
                      </td>
                      <td className="p-6 text-gray-300">Meteora DLMM</td>
                      <td className="p-6"><Badge variant="outline" className="bg-blue-500/10 text-blue-400 border-blue-500/20">Active Market Maker</Badge></td>
                      <td className="p-6 text-emerald-400">Low (IL Protected)</td>
                      <td className="p-6 text-gray-300">
                        ${meteoraTvlUsd.toLocaleString(undefined, { maximumFractionDigits: 1 })}
                      </td>
                      <td className="p-6 text-right font-medium text-white">{meteoraApyPct.toFixed(2)}%</td>
                      <td className="p-6 text-right">
                        <button className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-medium transition-all opacity-0 group-hover:opacity-100">
                          Delegate Agent
                        </button>
                      </td>
                    </tr>
                    
                    {/* Row 2 */}
                    <tr className="border-b border-white/5 hover:bg-white/5 transition-colors group">
                      <td className="p-6">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-[#14F195] flex items-center justify-center border-2 border-black"><span className="text-black font-bold text-[10px]">SOL</span></div>
                          <span className="font-medium text-white">JIT SOL</span>
                        </div>
                      </td>
                      <td className="p-6 text-gray-300">Kamino Finance</td>
                      <td className="p-6"><Badge variant="outline" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20">Single-Sided Vault</Badge></td>
                      <td className="p-6 text-emerald-400">Very Low</td>
                      <td className="p-6 text-gray-300">
                        ${kaminoTvlUsd.toLocaleString(undefined, { maximumFractionDigits: 1 })}
                      </td>
                      <td className="p-6 text-right font-medium text-white">{kaminoApyPct.toFixed(2)}%</td>
                      <td className="p-6 text-right">
                        <button className="px-4 py-2 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 rounded-xl text-xs font-medium transition-all">
                          Manage Vault
                        </button>
                      </td>
                    </tr>

                    {/* Row 3 */}
                    <tr className="hover:bg-white/5 transition-colors group">
                      <td className="p-6">
                        <div className="flex items-center gap-3">
                          <div className="flex -space-x-2">
                            <div className="w-8 h-8 rounded-full bg-[#14F195] flex items-center justify-center border-2 border-black"><span className="text-black font-bold text-[10px]">SOL</span></div>
                            <div className="w-8 h-8 rounded-full bg-[#9945FF] flex items-center justify-center border-2 border-black"><span className="text-white font-bold text-[10px]">PYTH</span></div>
                          </div>
                          <span className="font-medium text-white">SOL - PYTH</span>
                        </div>
                      </td>
                      <td className="p-6 text-gray-300">Raydium</td>
                      <td className="p-6"><Badge variant="outline" className="bg-purple-500/10 text-purple-400 border-purple-500/20">Dark Pool Arb</Badge></td>
                      <td className="p-6 text-orange-400">Medium (High IL)</td>
                      <td className="p-6 text-gray-300">$12.4M</td>
                      <td className="p-6 text-right font-medium text-white">82.4%</td>
                      <td className="p-6 text-right">
                        <button className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-medium transition-all opacity-0 group-hover:opacity-100">
                          Delegate Agent
                        </button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* Connected Agent Card */}
            <div className="bg-black rounded-2xl p-6 border border-white/10">
              <div className="flex flex-col items-center text-center mb-6">
                <div className="relative mb-4">
                  <div className="w-20 h-20 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
                    <Terminal className="w-8 h-8 text-white" />
                  </div>
                  <div className="absolute bottom-1 right-1 w-3 h-3 bg-white border-2 border-black rounded-full shadow-[0_0_10px_rgba(255,255,255,0.5)]" />
                </div>
                <h3 className="font-medium text-lg text-white">SolClaw_Alpha</h3>
                <p className="text-[10px] text-gray-400 mt-2 bg-white/5 px-2 py-1 rounded-full border border-white/10 font-mono uppercase tracking-wider">Status: Autonomous</p>
              </div>
              
              <div className="space-y-4 pt-4 border-t border-white/5">
                <div>
                  <div className="flex justify-between text-[10px] font-mono uppercase tracking-wider mb-2">
                    <span className="text-gray-500">Daily Limit</span>
                    <span className="text-gray-300">45% used</span>
                  </div>
                  <div className="w-full bg-white/5 rounded-full h-1">
                    <div className="bg-white h-1 rounded-full" style={{ width: "45%" }}></div>
                  </div>
                </div>
                
                <div className="flex justify-between text-xs border-b border-white/5 pb-2">
                  <span className="text-gray-500 font-mono uppercase tracking-wider text-[10px]">Strategy</span>
                  <span className="text-gray-300">A2A Routing & JIT</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500 font-mono uppercase tracking-wider text-[10px]">Risk Profile</span>
                    <span className="text-gray-300">KMS Enforced (Strict)</span>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-black rounded-2xl p-6 border border-white/10">
              <h3 className="font-medium mb-4 text-white text-sm">Manual Override</h3>
              <div className="space-y-3">
                <button 
                  onClick={handleSimulateHeroFlow}
                  className="w-full flex items-center justify-between p-3 rounded-xl bg-white/5 text-gray-300 hover:bg-white/10 hover:text-white transition-colors text-sm font-medium border border-white/10"
                >
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4" />
                    <span>Simulate Hero Flow</span>
                  </div>
                </button>
                <button 
                  onClick={handleForceRebalance}
                  className="w-full py-2.5 bg-white text-black hover:bg-gray-200 rounded-lg text-sm font-medium transition-colors"
                >
                  Force Rebalance to USDC
                </button>
                <div className="pt-2 border-t border-white/5 mt-2">
                  <button 
                    onClick={handleKillSwitch}
                    className="w-full py-2.5 bg-transparent hover:bg-white/10 text-gray-400 hover:text-white rounded-lg text-sm font-medium border border-white/10 hover:border-white/20 transition-colors"
                  >
                    Halt All Activity
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
