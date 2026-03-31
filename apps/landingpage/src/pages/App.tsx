import { useState, useEffect } from "react";
import { Shield, Lock, Terminal, Wallet, Loader2, EyeOff, KeyRound, Zap, ArrowRightLeft, History } from "lucide-react";
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

const DEFAULT_RPC_URL = "https://api.mainnet-beta.solana.com";
const DEFAULT_AGENT_PUBLIC_KEY = "FHk1jqFwoVBudRSaNB9N4kKewyaS5k8hqc2ctm8Q1zah";
const FALLBACK_BALANCE_SOL = 14.2051;
const ACTIVITY_LIMIT = 8;
const REFRESH_INTERVAL_MS = 20_000;

const configuredRpcUrl = (import.meta.env.VITE_HELIUS_RPC_URL || "").trim();
const configuredAgentPublicKey = (import.meta.env.VITE_AGENT_PUBLIC_KEY || "").trim();
const sseEndpointUrl = (import.meta.env.VITE_SSE_ENDPOINT || "http://localhost:3009/v1/events").trim();
const rpcUrl = configuredRpcUrl || DEFAULT_RPC_URL;
const agentPublicKeyText = configuredAgentPublicKey || DEFAULT_AGENT_PUBLIC_KEY;

const fallbackIntents: IntentItem[] = [
  { action: "ZK Stealth Swap", status: "Executed", amount: "+$45.20", time: "2m ago", icon: EyeOff, color: "text-gray-300", isOnchain: false },
  { action: "A2A Oracle Payment", status: "Pending", amount: "-$0.50", time: "15m ago", icon: KeyRound, color: "text-gray-400", isOnchain: false },
  { action: "Shielded Vault Route", status: "Executed", amount: "~$1,200.00", time: "1h ago", icon: Shield, color: "text-gray-300", isOnchain: false },
  { action: "Public DEX Trade", status: "Blocked (MEV Risk)", amount: "$5,000.00", time: "3h ago", icon: Lock, color: "text-gray-500", isOnchain: false },
];

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

export function AppPage() {
  const [intents, setIntents] = useState<IntentItem[]>(fallbackIntents);
  const [loading, setLoading] = useState(true);
  const [realBalance, setRealBalance] = useState<number | null>(null);
  const [balanceSource, setBalanceSource] = useState<"loading" | "live" | "fallback">("loading");
  const walletExplorerUrl = buildExplorerAddressUrl(agentPublicKeyText, rpcUrl);

  useEffect(() => {
    let active = true;
    let walletAddress: PublicKey;

    try {
      walletAddress = new PublicKey(agentPublicKeyText);
    } catch (error) {
      console.error("Invalid VITE_AGENT_PUBLIC_KEY; falling back to demo dashboard.", error);
      setRealBalance(FALLBACK_BALANCE_SOL);
      setBalanceSource("fallback");
      setIntents(fallbackIntents);
      setLoading(false);
      return;
    }

    const connection = new Connection(rpcUrl, "confirmed");

    const hydrateDashboard = async () => {
      const [balanceResult, signatureResult] = await Promise.allSettled([
        connection.getBalance(walletAddress),
        connection.getSignaturesForAddress(walletAddress, { limit: ACTIVITY_LIMIT }),
      ]);

      if (!active) return;

      if (balanceResult.status === "fulfilled") {
        setRealBalance(balanceResult.value / LAMPORTS_PER_SOL);
        setBalanceSource("live");
      } else {
        console.error("Failed to fetch live Solana balance:", balanceResult.reason);
        setRealBalance(FALLBACK_BALANCE_SOL);
        setBalanceSource("fallback");
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

      setLoading(false);
    };

    void hydrateDashboard();
    const intervalId = window.setInterval(() => {
      void hydrateDashboard();
    }, REFRESH_INTERVAL_MS);

    // Setup SSE for real-time updates (Sprint 3)
    let eventSource: EventSource | null = null;
    try {
      eventSource = new EventSource(sseEndpointUrl);
      eventSource.addEventListener("payment_success", (e) => {
        console.log("Real-time update received: payment_success", e.data);
        // Refresh dashboard instantly
        void hydrateDashboard();
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
      await fetch("http://127.0.0.1:4000/v1/intents/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          intentId: "intent_demo_arbitrage_" + Math.floor(Math.random() * 1000),
          channel: "telegram",
          requesterId: "913039626", // ID do usuário
          action: "A2A Oracle Payment",
          amount: "-$0.50"
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
          <p className="text-gray-500 text-sm mb-2 relative z-10 font-mono uppercase tracking-wider text-[10px]">Shielded Balance</p>
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
              <span className="text-sm font-mono text-gray-300" title={agentPublicKeyText}>{shortenAddress(agentPublicKeyText)}</span>
              <div className="w-px h-4 bg-white/20 mx-2" />
              <Badge variant="outline" className="bg-white/5 text-gray-300 border-white/10 font-mono text-[10px] uppercase tracking-wider">
                Connected
              </Badge>
            </div>
          </div>
          <p className="text-gray-400 max-w-2xl text-sm">
            Monitor your connected AI agent's performance, manage permissions, and track shielded liquidity in real-time.
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          
          {/* Main Content Area */}
          <div className="lg:col-span-3 space-y-6">
            {/* Top Stats Row */}
            <div className="grid grid-cols-3 gap-6">
              <div className="bg-black rounded-2xl p-6 border border-white/10 hover:border-white/20 transition-colors">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-xs text-gray-500 font-mono uppercase tracking-wider">Total Shielded Value</h3>
                  <Wallet className="w-4 h-4 text-gray-400" />
                </div>
                <div className="text-3xl font-light text-white mb-2 tracking-tight">
                  {realBalance !== null ? (
                    <span>{realBalance.toFixed(2)} <span className="text-lg text-gray-500 font-medium">SOL</span></span>
                  ) : (
                    <Loader2 className="w-5 h-5 animate-spin text-gray-500" />
                  )}
                </div>
                <div className="text-[10px] text-gray-500 mb-2 font-mono uppercase tracking-wider">
                  {balanceSource === "live" ? "Source: Solana RPC" : balanceSource === "fallback" ? "Source: Demo Fallback" : "Source: Loading"}
                </div>
                <div className="text-[10px] text-gray-400 flex items-center gap-1 font-mono uppercase tracking-wider">
                  <Lock className="w-3 h-3" /> Protected by ZK State
                </div>
              </div>

              <div className="bg-black rounded-2xl p-6 border border-white/10 hover:border-white/20 transition-colors">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-xs text-gray-500 font-mono uppercase tracking-wider">Total Intents Executed</h3>
                  <Zap className="w-4 h-4 text-gray-400" />
                </div>
                <div className="text-3xl font-light text-white mb-2 tracking-tight">1,248</div>
                <div className="text-[10px] text-gray-400 flex items-center gap-1 font-mono uppercase tracking-wider">
                  +12 in the last 24h
                </div>
              </div>

              <div className="bg-black rounded-2xl p-6 border border-white/10 hover:border-white/20 transition-colors">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-xs text-gray-500 font-mono uppercase tracking-wider">Est. MEV Saved</h3>
                  <Shield className="w-4 h-4 text-gray-400" />
                </div>
                <div className="text-3xl font-light text-white mb-2 tracking-tight">$420.50</div>
                <div className="text-[10px] text-gray-500 flex items-center gap-1 font-mono uppercase tracking-wider">
                  Via Dark Pool routing
                </div>
              </div>
            </div>

            {/* Recent Intents Table */}
            <div className="bg-black rounded-2xl border border-white/10 overflow-hidden">
              <div className="p-6 border-b border-white/5 flex justify-between items-center">
                <h3 className="font-medium text-lg text-white">Agent Activity Log</h3>
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
                  <span className="text-gray-300">Aggressive Arb</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500 font-mono uppercase tracking-wider text-[10px]">Risk Profile</span>
                  <span className="text-gray-300">Medium</span>
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
