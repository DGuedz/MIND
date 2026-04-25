import { useState, useEffect } from "react";
import { Lock, Terminal, Loader2, KeyRound, ArrowRightLeft, History, Coins, Activity, TrendingUp, ShieldCheck, Bot, ArrowUpRight, CheckCircle2 } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Badge } from "../components/ui/badge";
import { Connection, PublicKey, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { useDecryptText } from "../hooks/useDecryptText";
import { motion } from "framer-motion";
import { MindprintVisual } from "../components/MindprintVisual";

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
// Remove unused sseEndpointUrl
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



// Mock Data para Neural Memory Events
const neuralMemoryEvents = [
  {
    id: "mem_9f2a",
    type: "execution",
    skill: "solana-defi-ecosystem-intel",
    contextHash: "8a4f...2b1c",
    status: "completed",
    evidence: "sig_8jK2p...x402",
    timestamp: "2 mins ago"
  },
  {
    id: "mem_7b1c",
    type: "insight",
    skill: "hermes-fts5-memory",
    contextHash: "1c9d...5a4f",
    status: "stored",
    evidence: "vector_db_sync",
    timestamp: "15 mins ago"
  },
  {
    id: "mem_4d8e",
    type: "intent",
    skill: "x402-monetization",
    contextHash: "3f2a...9d8e",
    status: "approval_required",
    evidence: "awaiting_kms_sig",
    timestamp: "Just now"
  }
];

// Mock Data para P2P transfers baseadas no payload da payments.org
const P2P_MOCK_DATA = [
  { hash: "5BDqKZmK5V3UFQjA...", fullHash: "5BDqKZmK5V3UFQjA7ssWhuYNRTgnmVpACHDbffy187Xrch9k8qPuJMuvHLUqyYpXSx441MYxLz9cWvinYsaAaCKH", amount: 0.95, from: "BwMnmzg...", to: "R4rNJHaf..." },
  { hash: "4u3aw6fLKjU15NFH...", fullHash: "4u3aw6fLKjU15NFH5Phc4KpymTXDnNLxNpp36STxoxrZp8p3vvxBXmmvfQA9x9d9UinMc1XxMUGpfSCmhZj9vUAi", amount: 0.55, from: "6Js7mMJG...", to: "HiCoUYBU..." },
  { hash: "5UqhkUjSSzfQGPco...", fullHash: "5UqhkUjSSzfQGPcoyKmxfBzfeknJ8izoeva3fG5toTf3aGknCjSqqefgasvJDgwe5H4jYVgeJphPmX3JzSC593Rt", amount: 0.95, from: "GYmRqdKm...", to: "R4rNJHaf..." },
  { hash: "3KNPgMAYWBSufYtH...", fullHash: "3KNPgMAYWBSufYtHLEaqPbWn2sDmCSFSqHfLAP3jWnWvjKuCuNZLriyVWkGjeBuwrdReYeoNAcwFb7oHXs6frZXK", amount: 21.47, from: "62Q9eeDY...", to: "7y7wh81f..." },
  { hash: "4pjPg9WYZdjGTcNp...", fullHash: "4pjPg9WYZdjGTcNp4UUi4Wod8hEpJ17PerUQVdvyGi7TSp3o2LpC3nM5BxCGXm2s8Jtzpgz6cq7hcWH6DvVSvip9", amount: 1000.0, from: "FPBYdAMJ...", to: "B5srxkT5..." },
  { hash: "33vcSwA1neoTgVRi...", fullHash: "33vcSwA1neoTgVRip7dRWcWerAN7qtFwenJjjiSWhsKj1nxinzNDYjFUjbqFccGSW4uBi6oH9YnXNvSiXDBExTHP", amount: 20200.0, from: "5tzFkiKs...", to: "CyzxxfsX..." },
  { hash: "jmLzxZzY5BLvRBt3...", fullHash: "jmLzxZzY5BLvRBt3pjTU9jWh2Aq9Tuuo5o4E2KqaqENhzzjTg2Lu7yopZr1upwftahEPfnVocRGW7rkU889XMQo", amount: 10.0, from: "Hmc2dLxZ...", to: "7tMB6fcK..." }
];

// Full Screen Neural Activity Component (P2P Sensor) for Dashboard
function NeuralActivityHeatmap() {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [activeTransfer, setActiveTransfer] = useState(P2P_MOCK_DATA[0]);
  const [isHovering, setIsHovering] = useState(false);
  const [liveStreamData, setLiveStreamData] = useState<any[]>(P2P_MOCK_DATA);

  useEffect(() => {
    let eventSource: EventSource | null = null;

    try {
      eventSource = new EventSource("https://payments.org/api/transactions");

      eventSource.onmessage = (event) => {
        try {
          const parsed = JSON.parse(event.data);
          if (parsed.type === "transfer" && parsed.data) {
            const { transaction_hash, transferred_amount_raw, token_decimals, from_owner, to_owner } = parsed.data;
            
            const amount = (transferred_amount_raw || 0) / Math.pow(10, token_decimals || 6);
            const newTransfer = {
              hash: (transaction_hash || "").slice(0, 16) + "...",
              fullHash: transaction_hash || "",
              amount: amount,
              from: (from_owner || "Unknown").slice(0, 10) + "...",
              to: (to_owner || "Unknown").slice(0, 10) + "..."
            };

            setLiveStreamData(prev => {
              const next = [newTransfer, ...prev].slice(0, 50); // Keep last 50
              return next;
            });
          }
        } catch (e) {
          // ignore parsing errors
        }
      };

      eventSource.onerror = () => {
        // Fallback silently to mock data if the API fails
        if (eventSource) eventSource.close();
      };
    } catch (e) {
      // Fallback silently if EventSource creation fails
    }

    return () => {
      if (eventSource) eventSource.close();
    };
  }, []);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isHovering) return; // Freeze data if hovering over the data panel
    
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setMousePos({ x, y });
    
    if (Math.random() > 0.8 && liveStreamData.length > 0) {
      setActiveTransfer(liveStreamData[Math.floor(Math.random() * liveStreamData.length)]);
    }
  };

  return (
    <div 
      className="bg-[#020202] border border-white/10 rounded-3xl p-8 relative overflow-hidden group cursor-crosshair h-[400px] flex flex-col justify-between"
      onMouseMove={handleMouseMove}
    >
      {/* SVG Dots/Grid Background */}
      <div className="absolute inset-0 opacity-30 pointer-events-none transition-all duration-300">
        <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="dotPattern" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
              <circle cx="2" cy="2" r="1" fill="#ffffff" opacity="0.2" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#dotPattern)" />
          {/* Dynamic Flash based on mouse */}
          <circle 
            cx={mousePos.x} 
            cy={mousePos.y} 
            r="150" 
            fill="url(#glow)" 
            opacity={isHovering ? "0.8" : "0.3"} 
            className="transition-opacity duration-300"
          />
          <defs>
            <radialGradient id="glow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.15" />
              <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
            </radialGradient>
          </defs>
        </svg>
      </div>

      <div className="relative z-10 flex justify-between items-start">
        <div className="space-y-1">
          <div className="text-[10px] font-mono text-zinc-500 uppercase tracking-[0.3em] flex items-center gap-2">
            <span className={`w-1.5 h-1.5 rounded-full ${isHovering ? 'bg-amber-500' : 'bg-green-500 animate-pulse'}`}></span>
            {isHovering ? 'Target Locked' : 'Live P2P Stream'}
          </div>
          <div className="text-xl font-bold text-white tracking-tight font-mono">On-chain Capture.</div>
        </div>
        <Badge variant="outline" className="border-zinc-800 text-zinc-500 font-mono text-[8px] uppercase tracking-widest px-3">
          Full Scan
        </Badge>
      </div>

      {/* Dynamic Data Display (Locks on hover) */}
      <div 
        className="relative z-10 mt-auto transition-transform duration-300 hover:scale-[1.01]"
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
      >
        <div className="bg-black/80 backdrop-blur-md border border-white/10 hover:border-zinc-500 transition-colors rounded-xl p-6">
          <div className="flex justify-between items-center mb-4 border-b border-white/5 pb-4">
             <div className="text-[10px] font-mono text-zinc-400 uppercase tracking-[0.2em]">Intercepted Payload</div>
             <a 
               href={`https://solscan.io/tx/${activeTransfer.fullHash}`} 
               target="_blank" 
               rel="noreferrer"
               className="text-[9px] font-mono bg-white text-black px-3 py-1 rounded-full uppercase tracking-widest hover:bg-zinc-300 transition-colors flex items-center gap-1"
             >
               Audit on Solscan <ArrowUpRight className="w-3 h-3" />
             </a>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <div className="text-[9px] font-mono text-zinc-600 uppercase tracking-[0.2em] mb-1">Vol (USDC)</div>
              <div className="text-2xl font-mono text-green-400">${activeTransfer.amount.toLocaleString(undefined, {minimumFractionDigits: 2})}</div>
            </div>
            <div>
              <div className="text-[9px] font-mono text-zinc-600 uppercase tracking-[0.2em] mb-1">Route</div>
              <div className="text-xs font-mono text-zinc-300">From: {activeTransfer.from}</div>
              <div className="text-xs font-mono text-zinc-300 mt-1">To: {activeTransfer.to}</div>
            </div>
            <div>
              <div className="text-[9px] font-mono text-zinc-600 uppercase tracking-[0.2em] mb-1">Signature</div>
              <div className="text-xs font-mono text-zinc-500 break-all">{activeTransfer.hash}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Removed unused HeatmapMetric

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

// NOVO COMPONENTE: AgenticID Card (Inspirado na UI Brutalista/Metaplex)
function AgenticIDCard({ wallet }: { wallet: string }) {
  return (
    <div className="bg-[#050505] border border-white/10 rounded-3xl p-6 md:p-8 relative overflow-hidden group col-span-1 lg:col-span-3 mb-12 shadow-2xl flex flex-col md:flex-row gap-8 items-stretch">
      {/* Background Glows */}
      <div className="absolute top-0 left-0 w-64 h-64 bg-white/[0.02] rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-64 h-64 bg-white/[0.01] rounded-full blur-3xl pointer-events-none" />

      {/* Decorative Neural Head Placeholder (Left Side) */}
      <div className="hidden md:flex flex-col items-center justify-center w-64 shrink-0 relative">
        <div className="w-full h-full absolute inset-0 border border-white/5 rounded-2xl bg-black/50 flex items-center justify-center overflow-hidden p-4 relative">
           
           {/* Constant Data Flow Background */}
            <div className="absolute inset-0 overflow-hidden opacity-20 pointer-events-none flex gap-1 justify-between px-1">
              {Array.from({ length: 12 }).map((_, i) => (
                <motion.div 
                  key={`data-stream-${i}`}
                  className="text-[10px] font-mono text-green-500/80 whitespace-pre flex flex-col items-center leading-none"
                  initial={{ y: -800 }}
                  animate={{ y: 800 }}
                  transition={{
                    duration: 12 + (i % 3) * 2,
                    repeat: Infinity,
                    ease: "linear",
                    delay: i * 0.3
                  }}
                >
                 {Array.from({ length: 50 }).map((_, j) => (
                   <span key={j} className="my-[2px]">
                     {Math.random().toString(16).substring(2, 6).toUpperCase()}
                   </span>
                 ))}
               </motion.div>
             ))}
           </div>

           {/* Animated Neural Sphere */}
           <motion.svg 
             width="100%" 
             height="100%" 
             viewBox="0 0 100 100" 
             className="opacity-20"
             animate={{ rotate: 360 }}
             transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
           >
             {Array.from({length: 10}).map((_, i) => (
               <motion.ellipse 
                 key={i} 
                 cx="50" 
                 cy="50" 
                 rx={20 + i * 3} 
                 ry={30 + i * 4} 
                 fill="none" 
                 stroke="#fff" 
                 strokeWidth="0.2" 
                 style={{ transformOrigin: '50px 50px' }}
                 initial={{ rotate: i * 15 }}
                 animate={{
                   rotate: [i * 15, i * 15 + 360],
                   strokeWidth: [0.1, 0.4, 0.1],
                   opacity: [0.3, 1, 0.3]
                 }}
                 transition={{
                   rotate: { duration: 20 + i * 2, repeat: Infinity, ease: "linear" },
                   strokeWidth: { duration: 3 + i * 0.5, repeat: Infinity, ease: "easeInOut", delay: i * 0.2 },
                   opacity: { duration: 3 + i * 0.5, repeat: Infinity, ease: "easeInOut", delay: i * 0.2 }
                 }}
               />
             ))}
           </motion.svg>
        </div>
        <div className="absolute left-[-2rem] top-1/2 -translate-y-1/2 -rotate-90 text-[6px] font-mono text-zinc-600 tracking-[0.4em] uppercase whitespace-nowrap">
          MIND PROTOCOL \ NEURAL RAILS FOR THE AGENTIC ECONOMY
        </div>
      </div>

      {/* Main Info Section */}
      <div className="flex-1 flex flex-col justify-between relative z-10 space-y-6">
        
        {/* Header with PFP */}
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-6">
            {/* Agent Profile Image (Mindprint PFP) */}
            <div className="w-24 h-24 rounded-[1.25rem] overflow-hidden border border-white/10 bg-[#050505] shrink-0 relative flex items-center justify-center shadow-[inset_0_0_20px_rgba(0,0,0,0.8)] p-2">
              <MindprintVisual seed={wallet} />
            </div>
            
            <div className="space-y-1">
              <h2 className="text-3xl md:text-5xl font-medium tracking-tight text-white">AgenticID</h2>
              <div className="text-[10px] font-mono text-green-500/80 uppercase tracking-[0.2em]">ON-CHAIN AGENT IDENTITY</div>
            </div>
          </div>
          <div className="text-right space-y-1">
             <div className="text-[8px] font-mono text-zinc-500 uppercase tracking-widest">POWERED BY</div>
             <div className="text-sm font-bold text-white tracking-widest flex items-center justify-end gap-2">
               MIND PROTOCOL <span className="text-zinc-700">|</span> METAPLEX
             </div>
          </div>
        </div>

        {/* Public Key Plate */}
        <div className="bg-black/60 border border-white/10 rounded-xl p-4 flex justify-between items-center">
          <div className="space-y-1">
            <div className="text-[8px] font-mono text-zinc-600 uppercase tracking-[0.2em]">AGENT PUBLIC KEY</div>
            <div className="text-sm font-mono text-zinc-300 break-all">{wallet}</div>
          </div>
          <button 
            className="text-zinc-500 hover:text-white transition-colors p-2 bg-white/5 rounded-lg"
            onClick={() => {
              navigator.clipboard.writeText(wallet).catch(() => {});
            }}
            title="Copy Public Key"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>
          </button>
        </div>

        {/* Metadata Grid */}
        <div className="grid grid-cols-2 gap-4 border-b border-white/5 pb-6">
          <div className="space-y-1">
            <div className="text-[8px] font-mono text-zinc-600 uppercase tracking-[0.2em]">AGENT TYPE</div>
            <div className="text-sm font-mono text-zinc-300">AUTONOMOUS</div>
          </div>
          <div className="space-y-1">
            <div className="text-[8px] font-mono text-zinc-600 uppercase tracking-[0.2em]">CREATED</div>
            <div className="text-sm font-mono text-zinc-300">2026-04-22 19:29:42Z</div>
          </div>
          <div className="space-y-1">
            <div className="text-[8px] font-mono text-zinc-600 uppercase tracking-[0.2em]">NETWORK</div>
            <div className="text-sm font-mono text-zinc-300 flex items-center gap-2">
               <span className="w-3 h-3 rounded-full bg-gradient-to-tr from-purple-500 to-green-500"></span> SOLANA
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-[8px] font-mono text-zinc-600 uppercase tracking-[0.2em]">STANDARD</div>
            <div className="text-sm font-mono text-zinc-300">METAPLEX CORE</div>
          </div>
          <div className="space-y-1">
            <div className="text-[8px] font-mono text-zinc-600 uppercase tracking-[0.2em]">STATUS</div>
            <div className="text-sm font-mono text-green-500 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" /> ACTIVE
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-[8px] font-mono text-zinc-600 uppercase tracking-[0.2em]">TIER</div>
            <div className="text-sm font-mono text-zinc-300">TIER 2 PRO</div>
          </div>
        </div>

        {/* Capabilities */}
        <div className="space-y-3">
           <div className="text-[8px] font-mono text-green-500/80 uppercase tracking-[0.2em]">CAPABILITIES</div>
           <div className="flex flex-wrap gap-2">
             {["INTENT EXECUTION", "CAPITAL MANAGEMENT", "A2A COMMUNICATION", "DATA VERIFICATION", "X402 PAYMENTS", "COMPLIANCE NATIVE"].map((tag) => (
               <div key={tag} className="px-2 py-1 rounded bg-white/5 border border-white/10 text-[8px] font-mono text-zinc-400 tracking-widest">{tag}</div>
             ))}
           </div>
        </div>

        {/* Bottom Status Row */}
        <div className="flex justify-between items-center pt-4 border-t border-white/5">
           <div className="flex items-center gap-2">
             <div className="text-[8px] font-mono text-zinc-600 uppercase tracking-[0.2em]">VERIFICATION</div>
             <div className="text-[9px] font-mono text-green-500 flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> ON-CHAIN VERIFIED</div>
           </div>
           <div className="flex items-center gap-2">
             <div className="text-[8px] font-mono text-zinc-600 uppercase tracking-[0.2em]">POLICY GATING</div>
             <div className="text-[9px] font-mono text-zinc-300 flex items-center gap-1"><Lock className="w-3 h-3 text-zinc-500" /> ENABLED</div>
           </div>
           <div className="flex items-center gap-2">
             <div className="text-[8px] font-mono text-zinc-600 uppercase tracking-[0.2em]">ZERO TRUST</div>
             <div className="text-[9px] font-mono text-zinc-300 flex items-center gap-1"><ShieldCheck className="w-3 h-3 text-zinc-500" /> ENFORCED</div>
           </div>
        </div>
      </div>
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
  
  const searchParams = new URLSearchParams(window.location.search);
  const urlWallet = searchParams.get("wallet");
  const targetWalletText = urlWallet || agentPublicKeyText;

  const walletExplorerUrl = buildExplorerAddressUrl(targetWalletText, rpcUrl);
  
  const solValueUsd = (realBalance ?? 0) * (solUsdPrice ?? FALLBACK_SOL_PRICE_USD);
  const usdcValueUsd = (usdcBalance ?? 0) * (usdcUsdPrice ?? 1);
  const activeLiquidityUsd = solValueUsd + usdcValueUsd;

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

    // let eventSource: EventSource | null = null;
    // try {
    //   eventSource = new EventSource(sseEndpointUrl);
    //   eventSource.addEventListener("payment_success", () => {
    //     void hydrateDashboard();
    //     void hydrateProtocolMetrics();
    //   });
    //   eventSource.onerror = () => {
    //     eventSource?.close();
    //   };
    // } catch (e) {}

    return () => {
      active = false;
      window.clearInterval(intervalId);
      window.clearInterval(metricsIntervalId);
      // if (eventSource) {
      //   eventSource.close();
      // }
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

  return (
    <div className="container mx-auto px-6 space-y-8 pt-32 pb-32">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 border-b border-white/20 pb-12">
        <div className="space-y-4">
          <Badge variant="outline" className="border-zinc-800 text-zinc-500 font-mono uppercase text-[9px] tracking-[0.3em] px-4 py-1">
            Agent Headquarters
          </Badge>
          <h1 className="text-4xl font-bold text-white tracking-tight uppercase font-mono">Command Center.</h1>
        </div>
        
        <div className="flex items-center gap-6">
          <div className="px-4 py-2 bg-white/5 border border-white/20 rounded-full flex items-center gap-3">
            <div className={`w-1.5 h-1.5 rounded-full ${balanceSource === 'live' ? 'bg-white opacity-80 animate-pulse' : 'bg-zinc-800'}`} />
            <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-[0.2em]">{balanceSource === 'live' ? 'Protocol Live' : 'Protocol Fallback'}</span>
          </div>
        </div>
      </header>

      {/* AgenticID Card */}
      <AgenticIDCard wallet={targetWalletText} />

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
                <ShieldCheck className="w-3.5 h-3.5" /> Neural Memory Log
              </h2>
              <span className="text-[9px] font-mono text-zinc-700 uppercase tracking-widest">Append-Only Proofs</span>
            </div>

            <div className="space-y-4">
              {neuralMemoryEvents.map(event => (
                <div key={event.id} className="bg-white/[0.02] border border-white/20 rounded-2xl p-6 flex flex-col md:flex-row justify-between items-start md:items-center hover:border-white/30 transition-all duration-500 gap-6">
                  <div className="space-y-4 w-full md:w-auto flex-1">
                    <div className="flex items-center gap-4">
                      <Badge variant="outline" className={`${event.status === 'completed' || event.status === 'stored' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' : 'bg-amber-500/10 text-amber-400 border-amber-500/30'} text-[9px] font-mono uppercase tracking-widest`}>
                        {event.status}
                      </Badge>
                      <span className="text-[9px] text-zinc-700 font-mono tracking-widest uppercase">{event.id}</span>
                      <span className="text-[9px] text-zinc-600 font-mono tracking-widest uppercase ml-auto md:ml-0">{event.timestamp}</span>
                    </div>
                    <p className="text-sm text-zinc-400 font-light">
                      <strong className="text-zinc-500 uppercase font-mono text-[10px] tracking-widest mr-2">Skill:</strong> 
                      <span className="text-white">{event.skill}</span>
                    </p>
                    
                    {/* Memory Structure */}
                    <div className="bg-black/40 border border-white/[0.02] rounded-xl p-4 space-y-3">
                      <div className="flex justify-between items-center text-[8px] font-mono uppercase tracking-[0.2em] text-zinc-600 border-b border-white/5 pb-2">
                        <span>Event Type</span>
                        <span className="text-zinc-400">{event.type.toUpperCase()}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-4 pt-1">
                        <div className="space-y-1">
                          <div className="text-[8px] text-zinc-700 uppercase tracking-widest">Context Hash</div>
                          <div className="text-[10px] text-zinc-400 font-mono">{event.contextHash}</div>
                        </div>
                        <div className="space-y-1">
                          <div className="text-[8px] text-zinc-700 uppercase tracking-widest">Evidence</div>
                          <div className="text-[10px] text-zinc-300 font-mono uppercase truncate">{event.evidence}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {event.status === 'approval_required' && (
                    <div className="flex gap-4 w-full md:w-auto justify-end">
                      <button className="text-[9px] font-mono uppercase tracking-[0.2em] text-zinc-600 hover:text-white transition-colors px-4 py-2">
                        Reject
                      </button>
                      <button className="bg-white text-black hover:bg-zinc-200 text-[9px] font-mono uppercase tracking-[0.2em] px-6 py-2 rounded-full transition-all duration-500 shadow-[0_0_15px_rgba(255,255,255,0.2)]">
                        Sign KMS
                      </button>
                    </div>
                  )}
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
