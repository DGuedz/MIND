/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { hydrateBuilderRegistrationFromGithubOAuth, getBuilderRegistration } from "../lib/builderAccess";
import { Search, Activity, Globe, Database, Shield, ArrowDownLeft, ArrowUpRight, RefreshCw, History, Wallet, Layers, Zap, Plus } from "lucide-react";
import { motion, AnimatePresence, useScroll, useTransform, useMotionValue, MotionValue } from "framer-motion";
import { AreaChart, Area, ResponsiveContainer } from "recharts";

// Component for Solana Metallic Reflective Text
export function SolanaMetallicText({ children, className, progress }: { children: React.ReactNode, className?: string, progress?: MotionValue<number> }) {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const handleMouseMove = (e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    mouseX.set(e.clientX - rect.left);
    mouseY.set(e.clientY - rect.top);
  };

  const backgroundPosition = useTransform(
    progress || mouseX,
    (v: any) => progress ? `${Number(v) * 200}% 50%` : `${Number(mouseX.get()) / 10}% ${Number(mouseY.get()) / 10}%`
  );

  return (
    <motion.span
      onMouseMove={handleMouseMove}
      className={`relative inline-block bg-clip-text text-transparent bg-[linear-gradient(110deg,#ffffff,40%,#d1fae5,48%,#ffffff,52%,#e9d5ff,60%,#ffffff)] bg-[length:200%_200%] transition-all duration-300 cursor-default drop-shadow-[0_0_10px_rgba(20,241,149,0.15)] ${className || ''}`}
      style={{ backgroundPosition }}
    >
      {children}
    </motion.span>
  );
}

// Spotlight Hover Card (Mouse Tracking Glow)
export function SpotlightCard({ children, className, glowColor = "rgba(20,241,149,0.15)" }: { children: React.ReactNode, className?: string, glowColor?: string }) {
  const divRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [opacity, setOpacity] = useState(0);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!divRef.current) return;
    const rect = divRef.current.getBoundingClientRect();
    setPosition({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  };

  return (
    <div
      ref={divRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setOpacity(1)}
      onMouseLeave={() => setOpacity(0)}
      className={`relative overflow-hidden ${className || ''}`}
    >
      <div
        className="pointer-events-none absolute inset-0 z-0 transition-opacity duration-500 ease-out"
        style={{
          opacity,
          background: `radial-gradient(600px circle at ${position.x}px ${position.y}px, ${glowColor}, transparent 40%)`,
        }}
      />
      <div className="relative z-10 h-full w-full">{children}</div>
    </div>
  );
}

// --- MOCK DATA GENERATORS ---
const generateId = (prefix: string) => `${prefix}_${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
const randomInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
const randomFloat = (min: number, max: number) => (Math.random() * (max - min) + min).toFixed(2);

const AGENTS = ["Jupiter_Arb", "Kamino_Audit", "Meteora_DLMM", "Sybil_Node", "Echo_Indexer", "JIT_Router", "Intent_Gate"];
const ASSETS = ["USDC", "SOL", "JitoSOL", "WIF", "BONK", "MIND"];

const generateExecutions = (count: number) => Array.from({ length: count }, () => ({
  hash: generateId("0x"),
  intentId: randomInt(399782000, 399782999).toString(),
  actions: randomInt(1, 5),
  status: Math.random() > 0.1 ? "success" : Math.random() > 0.5 ? "pending" : "failed",
  cost: randomFloat(0.000001, 0.0005),
  timestamp: new Date(Date.now() - randomInt(1000, 60000)).toISOString(),
}));

const generateIntents = (count: number) => Array.from({ length: count }, () => ({
  id: randomInt(417108600, 417108999).toString(),
  agent: AGENTS[randomInt(0, AGENTS.length - 1)],
  actions: randomInt(100, 1500),
  timestamp: new Date(Date.now() - randomInt(1000, 60000)).toISOString(),
}));

const generateAssets = () => ASSETS.map(asset => ({
  asset,
  type: asset === "USDC" ? "Stablecoin" : asset === "MIND" ? "Governance" : "Yield/Volatile",
  liquidity: randomFloat(10, 500) + "M",
  utilization: randomFloat(40, 95) + "%",
  yield: randomFloat(2, 25) + "%",
  riskScore: randomInt(1, 10),
}));

export const Dashboard = () => {
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState<"overview" | "wallet" | "agents" | "intents" | "executions" | "assets">("overview");
  const [currentSectionTitle, setCurrentSectionTitle] = useState("Command Center");
  const [registration, setRegistration] = useState(() => getBuilderRegistration());

  // Handle GitHub OAuth return and hydration
  useEffect(() => {
    const githubAuth = {
      connected: searchParams.get("github_connected") === "1",
      login: searchParams.get("github_login") ?? "",
      id: searchParams.get("github_id") ?? "",
      avatarUrl: searchParams.get("github_avatar") ?? ""
    };

    if (githubAuth.connected && githubAuth.login) {
      const hydrated = hydrateBuilderRegistrationFromGithubOAuth({
        campaignCode: searchParams.get("code"),
        connected: githubAuth.connected,
        login: githubAuth.login,
        id: githubAuth.id,
        avatarUrl: githubAuth.avatarUrl
      });
      if (hydrated) {
        setRegistration(hydrated);
        // Automatically switch to wallet tab after successful login
        setActiveTab("wallet");
      }
    }
  }, [searchParams]);

  // Real-time states
  const [currentCycle, setCurrentCycle] = useState(965);
  const [cycleTime, setCycleTime] = useState(0.37);
  const [tps, setTps] = useState(4203);

  // Initialize pure data to avoid react-hooks/purity errors
  const [chartData, setChartData] = useState<{time: string, value: number}[]>([]);
  const [recentExecutions, setRecentExecutions] = useState<any[]>([]);
  const [recentIntents, setRecentIntents] = useState<any[]>([]);
  const [agentsList, setAgentsList] = useState<any[]>([]);
  const [assetsList, setAssetsList] = useState<any[]>([]);

  // Early Fade Out Setup (Hero Expert Skill)
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: containerRef, offset: ["start start", "end start"] });
  const heroOpacity = useTransform(scrollYProgress, [0, 0.25], [1, 0]);

  // Intersection Observer for dynamic header
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const title = entry.target.getAttribute("data-title");
            if (title) setCurrentSectionTitle(title);
          }
        });
      },
      { rootMargin: "-20% 0px -60% 0px" } // trigger when element is in the upper half of screen
    );

    setTimeout(() => {
      const sections = document.querySelectorAll("[data-title]");
      sections.forEach((s) => observer.observe(s));
    }, 100);

    return () => observer.disconnect();
  }, [activeTab]);

  const [walletSkills, setWalletSkills] = useState<any[]>([]);
  const [walletSyncStatus, setWalletSyncStatus] = useState<string>("");

  // Initial mount data population
  useEffect(() => {
    setChartData(Array.from({ length: 60 }, (_, i) => ({ time: i.toString(), value: randomInt(20, 100) })));
    setRecentExecutions(generateExecutions(15));
    setRecentIntents(generateIntents(10));
    setAgentsList(AGENTS.map(id => ({
      id,
      reputation: randomInt(70, 99),
      successRate: randomFloat(80, 99.9) + "%",
      capital: "$" + randomFloat(10, 100) + "k",
      avgTime: randomInt(100, 500) + "ms",
      fees: "$" + randomFloat(100, 5000),
    })));
    setAssetsList(generateAssets());

    // Load wallet skills from simulated DB
    try {
      const savedSkills = JSON.parse(localStorage.getItem('mind_wallet_skills') || '[]');
      setWalletSkills(savedSkills);
    } catch(e) {}
  }, []);

  const syncWalletFromGithub = async () => {
    setWalletSyncStatus("Syncing GitHub wallet...");
    try {
      const res = await fetch("/api/github/wallet/assets");
      if (!res.ok) {
        setWalletSyncStatus("GitHub wallet sync blocked.");
        return;
      }
      const payload = await res.json();
      const assets = Array.isArray(payload.assets) ? payload.assets : [];
      const merged = (() => {
        const existing = JSON.parse(localStorage.getItem("mind_wallet_skills") || "[]") as any[];
        const byId = new Map<string, any>(existing.map((s: any) => [s.id, s]));
        for (const asset of assets) {
          const id = asset.marketplaceItemId || asset.id;
          if (!id) continue;
          const prev = (byId.get(id) as any) || {};
          byId.set(id, {
            ...prev,
            id,
            timestamp: asset.claimedAt || prev.timestamp || new Date().toISOString(),
            amountSol: prev.amountSol || "0.0000",
            receipt: asset.paymentId || prev.receipt || "",
            githubProof: asset.githubProof || prev.githubProof
          });
        }
        return Array.from(byId.values());
      })();
      localStorage.setItem("mind_wallet_skills", JSON.stringify(merged));
      setWalletSkills(merged);
      setWalletSyncStatus(`GitHub wallet synced: ${assets.length} asset(s).`);
    } catch {
      setWalletSyncStatus("GitHub wallet sync failed.");
    }
  };

  // WebSocket Simulation
  useEffect(() => {
    const interval = setInterval(() => {
      setCycleTime(prev => Number((prev + 0.01 > 0.5 ? 0.35 : prev + 0.01).toFixed(2)));
      setTps(randomInt(3800, 4500));

      setChartData(prev => {
        const next = [...prev.slice(1), { time: Date.now().toString(), value: randomInt(20, 100) }];
        return next;
      });

      if (Math.random() > 0.5) {
        setRecentExecutions(prev => [generateExecutions(1)[0], ...prev].slice(0, 15));
      }
      if (Math.random() > 0.7) {
        setRecentIntents(prev => [generateIntents(1)[0], ...prev].slice(0, 10));
        setCurrentCycle(prev => prev + 1);
      }
    }, 800);
    return () => clearInterval(interval);
  }, []);

  const StatusBadge = ({ status }: { status: string }) => {
    switch (status) {
      case "success":
        return <span className="bg-[#00FFA3]/10 text-[#00FFA3] border border-[#00FFA3]/20 px-2 py-0.5 rounded text-[9px] uppercase tracking-wider">Success</span>;
      case "pending":
        return <span className="bg-[#FFB800]/10 text-[#FFB800] border border-[#FFB800]/20 px-2 py-0.5 rounded text-[9px] uppercase tracking-wider">Pending</span>;
      case "failed":
        return <span className="bg-[#FF4D4D]/10 text-[#FF4D4D] border border-[#FF4D4D]/20 px-2 py-0.5 rounded text-[9px] uppercase tracking-wider">Failed</span>;
      default:
        return null;
    }
  };

  return (
    <>
      <div ref={containerRef} className="min-h-screen bg-[#05050A] text-[#E5E5E5] font-sans selection:bg-[#14F195] selection:text-black relative overflow-hidden">

      {/* Background glows for Solana Premium Vibe */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-[#9945FF]/10 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-[#14F195]/10 blur-[120px] rounded-full pointer-events-none" />

      {/* Top Navigation Bar & Hero Text (With Early Fade Out) */}
      <div className="sticky top-0 z-40 bg-[#05050A]/80 backdrop-blur-2xl border-b border-[#9945FF]/20 pt-24 pb-4 px-6 shadow-[0_4px_30px_rgba(0,0,0,0.5)] metallic-dark-premium">
        <motion.div style={{ opacity: heroOpacity }} className="max-w-[1600px] mx-auto mb-6">
          <h1 className="text-3xl md:text-5xl font-mono uppercase tracking-tighter flex items-center flex-wrap">
              <AnimatePresence mode="wait">
                <motion.span
                  key={currentSectionTitle}
                  initial={{ opacity: 0, y: 10, filter: "blur(4px)" }}
                  animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                  exit={{ opacity: 0, y: -10, filter: "blur(4px)" }}
                  transition={{ duration: 0.3 }}
                  className="text-[#E5E5E5] ml-4 font-light"
                >
                  {currentSectionTitle}
                </motion.span>
              </AnimatePresence>
            </h1>
            <p className="text-[#888888] font-mono text-[10px] uppercase tracking-widest mt-2">
              Observability Layer // Intents • Executions • Proofs
            </p>
          </motion.div>
          <div className="max-w-[1600px] mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-6">

            {/* Tabs */}
            <div className="flex items-center gap-6 overflow-x-auto w-full md:w-auto custom-scrollbar pb-2 md:pb-0">
              {[
                { id: "overview", label: "Overview" },
                { id: "wallet", label: "My Wallet & Skills" },
                { id: "agents", label: "Agents (Nodes)" },
                { id: "intents", label: "Intents (Slots)" },
                { id: "executions", label: "Executions (Tx)" },
                { id: "assets", label: "Assets (Tokens)" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`text-[11px] font-mono uppercase tracking-widest pb-1 border-b-2 transition-colors whitespace-nowrap ${
                    activeTab === tab.id
                      ? "border-[#66FFDD] text-[#E5E5E5]"
                      : "border-transparent text-[#888888] hover:text-[#E5E5E5]"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Global Search */}
            <div className="relative w-full md:w-96">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#888888]" />
              <input
                type="text"
                placeholder="Search for intents, executions, agents, assets..."
                className="w-full bg-[#111111] border border-[#1F1F1F] rounded-lg pl-10 pr-4 py-2.5 text-xs font-mono text-[#E5E5E5] placeholder:text-[#888888] focus:outline-none focus:border-[#66FFDD]/50 transition-colors"
              />
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="max-w-[1600px] mx-auto px-6 py-8">

          <AnimatePresence mode="wait">
            {activeTab === "overview" && (
              <motion.div
                key="overview"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6"
              >
                {/* Row 1: Global Stats */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" data-title="Global Network Stats">

                  {/* Execution Cycle Card */}
                  <SpotlightCard glowColor="rgba(153,69,255,0.2)" className="metallic-brushed metallic-shine metallic-brushed-solana rounded-xl p-6 col-span-1 lg:col-span-2 flex flex-col md:flex-row justify-between gap-8 backdrop-blur-md">
                    <div className="space-y-1 relative z-10">
                      <div className="text-[10px] font-mono text-[#888888] uppercase tracking-widest flex items-center gap-2">
                        Intent Height
                        <Globe className="w-3 h-3" />
                      </div>
                      <div className="text-4xl md:text-5xl font-mono text-white font-light tracking-tight">
                        {currentCycle.toLocaleString()}
                      </div>
                    </div>

                    <div className="space-y-1">
                      <div className="text-[10px] font-mono text-[#888888] uppercase tracking-widest">
                        Current Cycle Time
                      </div>
                      <div className="text-4xl md:text-5xl font-mono text-[#66FFDD] font-light tracking-tight">
                        {cycleTime} <span className="text-xl text-[#888888]">s</span>
                      </div>
                    </div>

                    <div className="space-y-2 flex-1 max-w-xs">
                      <div className="flex justify-between text-[10px] font-mono text-[#888888] uppercase tracking-widest">
                        <span>Execution Cycle</span>
                        <span>ETA 22h 17m</span>
                      </div>
                      <div className="h-1.5 w-full bg-[#1F1F1F] rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-[#66FFDD] to-[#00FFA3] w-[53%]" />
                      </div>
                      <div className="flex justify-between text-[10px] font-mono text-[#888888]">
                        <span>965</span>
                        <span>966</span>
                      </div>
                    </div>
                  </SpotlightCard>

                  {/* Network Health */}
                  <SpotlightCard glowColor="rgba(20,241,149,0.2)" className="metallic-brushed metallic-shine metallic-brushed-emerald rounded-xl p-6 flex flex-col justify-between backdrop-blur-md">
                    <div className="space-y-4 relative z-10">
                      <div className="flex justify-between items-end">
                        <span className="text-2xl font-mono text-white font-light">770</span>
                        <span className="text-[10px] font-mono text-[#888888] uppercase tracking-widest">Active Agents</span>
                      </div>
                      <div className="flex justify-between items-end">
                        <span className="text-2xl font-mono text-white font-light">4199</span>
                        <span className="text-[10px] font-mono text-[#888888] uppercase tracking-widest">A2A Nodes</span>
                      </div>
                    </div>
                    <div className="mt-6 pt-4 border-t border-[#1F1F1F] flex items-center justify-between">
                      <span className="text-[10px] font-mono text-[#888888] uppercase tracking-widest">Network Status</span>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-[#00FFA3] animate-pulse shadow-[0_0_8px_rgba(0,255,163,0.6)]" />
                        <span className="text-[10px] font-mono text-[#00FFA3] uppercase tracking-widest">Optimal</span>
                      </div>
                    </div>
                  </SpotlightCard>
                </div>

                {/* Row 2: Throughput & Capital */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6" data-title="Throughput & Capital">

                  {/* Throughput A2A (TPS) */}
                  <SpotlightCard glowColor="rgba(0,194,255,0.2)" className="metallic-brushed metallic-shine metallic-brushed-sapphire rounded-xl p-6 flex flex-col md:flex-row gap-8 backdrop-blur-md">
                    <div className="space-y-1 min-w-[120px] relative z-10">
                      <div className="text-[10px] font-mono text-[#888888] uppercase tracking-widest">Current Throughput</div>
                      <div className="text-4xl font-mono text-white font-light">{tps.toLocaleString()}</div>
                      <div className="text-[9px] font-mono text-[#888888] mt-2">
                        <span className="text-[#00C2FF]">1288</span> Shielded • <span className="text-white">1889</span> Public
                      </div>
                    </div>
                    <div className="flex-1 flex flex-col justify-end h-32 md:h-auto relative z-10">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={chartData}>
                          <defs>
                            <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#00C2FF" stopOpacity={0.8}/>
                              <stop offset="95%" stopColor="#00C2FF" stopOpacity={0}/>
                            </linearGradient>
                            <filter id="chartGlow" x="-20%" y="-20%" width="140%" height="140%">
                              <feGaussianBlur stdDeviation="3" result="blur" />
                              <feMerge>
                                <feMergeNode in="blur" />
                                <feMergeNode in="SourceGraphic" />
                              </feMerge>
                            </filter>
                          </defs>
                          <Area type="step" dataKey="value" stroke="#00C2FF" strokeWidth={2} fillOpacity={1} fill="url(#colorValue)" isAnimationActive={false} style={{ filter: "url(#chartGlow)" }} />
                        </AreaChart>
                      </ResponsiveContainer>
                      <div className="flex justify-between text-[9px] font-mono text-[#888888] mt-2 pt-2 border-t border-[#1F1F1F] uppercase tracking-widest">
                        <span>A2A Executions / sec</span>
                        <span>Real-time</span>
                      </div>
                    </div>
                  </SpotlightCard>

                  {/* Capital / Value */}
                  <SpotlightCard glowColor="rgba(255,255,255,0.1)" className="metallic-brushed metallic-shine rounded-xl p-6 flex flex-col justify-between backdrop-blur-md">
                     <div className="grid grid-cols-2 gap-4 relative z-10">
                        <div>
                          <div className="text-[10px] font-mono text-[#888888] uppercase tracking-widest mb-1">Circulating Assets</div>
                          <div className="text-2xl font-mono text-white font-light">576.2 <span className="text-sm text-[#888888]">M</span></div>
                          <div className="text-[9px] font-mono text-[#888888] mt-1">of 625.6M: <span className="text-white">92.1%</span></div>
                        </div>
                        <div>
                          <div className="text-[10px] font-mono text-[#888888] uppercase tracking-widest mb-1">Active Capital (Stake)</div>
                          <div className="text-2xl font-mono text-white font-light">426.9 <span className="text-sm text-[#888888]">M</span></div>
                          <div className="text-[9px] font-mono text-[#888888] mt-1">of 625.6M: <span className="text-white">68.2%</span></div>
                        </div>
                     </div>
                     <div className="mt-4 pt-4 border-t border-[#1F1F1F] flex justify-between items-end relative z-10">
                        <div>
                          <div className="text-[10px] font-mono text-[#888888] uppercase tracking-widest mb-1">Base Asset Price</div>
                          <div className="text-xl font-mono text-white font-light">$ 145.91 <span className="text-[10px] text-[#FF4D4D] ml-2">-1.0%</span></div>
                        </div>
                        <div className="text-right">
                          <div className="text-[10px] font-mono text-[#888888] uppercase tracking-widest mb-1">24H Volume</div>
                          <div className="text-xl font-mono text-white font-light">3.0 <span className="text-sm text-[#888888]">B</span></div>
                        </div>
                     </div>
                  </SpotlightCard>

                </div>

                {/* Row 3: Tables (Recent Intents & Executions) */}
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6" data-title="Recent Activity Logs">

                  {/* Recent Intents (Slots) */}
                  <SpotlightCard glowColor="rgba(102,255,221,0.15)" className="metallic-brushed metallic-shine rounded-xl overflow-hidden flex flex-col backdrop-blur-md">
                    <div className="p-4 border-b border-[#1F1F1F] flex justify-between items-center bg-[#0A0A0A]/50 relative z-10">
                      <h3 className="text-xs font-mono uppercase tracking-widest text-[#E5E5E5]">Recent Intents</h3>
                      <Activity className="w-3 h-3 text-[#888888]" />
                    </div>
                    <div className="overflow-x-auto relative z-10">
                      <table className="w-full text-left">
                        <thead>
                          <tr className="border-b border-[#1F1F1F] text-[#888888] font-mono text-[9px] uppercase tracking-widest bg-[#0A0A0A]/20">
                            <th className="py-3 px-4 font-normal">Intent ID</th>
                            <th className="py-3 px-4 font-normal">Agent</th>
                            <th className="py-3 px-4 font-normal">Actions</th>
                            <th className="py-3 px-4 font-normal text-right">Time</th>
                          </tr>
                        </thead>
                        <tbody className="font-mono text-xs divide-y divide-[#1F1F1F]">
                          {recentIntents.map((intent, i) => (
                            <tr key={i} className="hover:bg-[#1F1F1F]/50 transition-colors">
                              <td className="py-2.5 px-4 text-[#66FFDD] cursor-pointer">{intent.id}</td>
                              <td className="py-2.5 px-4 flex items-center gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-[#00C2FF]" />
                                <span className="text-[#E5E5E5]">{intent.agent}</span>
                              </td>
                              <td className="py-2.5 px-4 text-[#888888]">{intent.actions}</td>
                              <td className="py-2.5 px-4 text-right text-[#888888]">1m ago</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </SpotlightCard>

                  {/* Recent Executions (Transactions) */}
                  <SpotlightCard glowColor="rgba(255,255,255,0.1)" className="metallic-brushed metallic-shine rounded-xl overflow-hidden flex flex-col backdrop-blur-md">
                    <div className="p-4 border-b border-[#1F1F1F] flex justify-between items-center bg-[#0A0A0A]/50 relative z-10">
                      <h3 className="text-xs font-mono uppercase tracking-widest text-[#E5E5E5]">Recent Executions</h3>
                      <Database className="w-3 h-3 text-[#888888]" />
                    </div>
                    <div className="overflow-x-auto relative z-10">
                      <table className="w-full text-left">
                        <thead>
                          <tr className="border-b border-[#1F1F1F] text-[#888888] font-mono text-[9px] uppercase tracking-widest bg-[#0A0A0A]/20">
                            <th className="py-3 px-4 font-normal">Proof Hash</th>
                            <th className="py-3 px-4 font-normal">Intent ID</th>
                            <th className="py-3 px-4 font-normal">Status</th>
                            <th className="py-3 px-4 font-normal">Fee (USDC)</th>
                          </tr>
                        </thead>
                        <tbody className="font-mono text-xs divide-y divide-[#1F1F1F]">
                          {recentExecutions.slice(0, 10).map((exec, i) => (
                            <tr key={i} className="hover:bg-[#1F1F1F]/50 transition-colors">
                              <td className="py-2.5 px-4 text-[#E5E5E5] flex items-center gap-2">
                                <Shield className="w-3 h-3 text-[#888888]" />
                                {exec.hash}
                              </td>
                              <td className="py-2.5 px-4 text-[#66FFDD]">{exec.intentId}</td>
                              <td className="py-2.5 px-4">
                                <StatusBadge status={exec.status} />
                              </td>
                              <td className="py-2.5 px-4 text-[#888888]">{exec.cost}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </SpotlightCard>

                </div>
              </motion.div>
            )}

            {activeTab === "wallet" && (
              <motion.div
                key="wallet"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                data-title="My Wallet & Skills"
                className="space-y-6"
              >
                {/* Wallet Balance & Quick Actions */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <SpotlightCard glowColor="rgba(20,241,149,0.2)" className="metallic-dark-premium rounded-xl p-6 lg:col-span-2 flex flex-col justify-between backdrop-blur-md">
                    <div className="flex justify-between items-start mb-6">
                      <div className="space-y-1">
                        <div className="text-[10px] font-mono text-[#888888] uppercase tracking-widest flex items-center gap-2">
                          Available Balance
                          <div className="w-2 h-2 rounded-full bg-[#00FFA3] animate-pulse" />
                        </div>
                        <div className="text-4xl md:text-5xl font-mono text-white font-light tracking-tight">
                          $ 1,240<span className="text-2xl text-[#888888]">.50</span>
                        </div>
                      </div>
                      <div className="text-right space-y-1">
                        <div className="text-[10px] font-mono text-[#888888] uppercase tracking-widest">Network</div>
                        <div className="text-sm font-mono text-[#66FFDD]">Solana Mainnet</div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-6 border-t border-white/5">
                      <button className="flex flex-col items-center justify-center gap-2 bg-white/5 hover:bg-white/10 border border-white/5 rounded-lg p-4 transition-colors">
                        <ArrowDownLeft className="w-4 h-4 text-[#00FFA3]" />
                        <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-400">Deposit</span>
                      </button>
                      <button className="flex flex-col items-center justify-center gap-2 bg-white/5 hover:bg-white/10 border border-white/5 rounded-lg p-4 transition-colors">
                        <ArrowUpRight className="w-4 h-4 text-[#FF4D4D]" />
                        <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-400">Withdraw</span>
                      </button>
                      <button className="flex flex-col items-center justify-center gap-2 bg-white/5 hover:bg-white/10 border border-white/5 rounded-lg p-4 transition-colors">
                        <RefreshCw className="w-4 h-4 text-[#00C2FF]" />
                        <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-400">Swap</span>
                      </button>
                      <button className="flex flex-col items-center justify-center gap-2 bg-white/5 hover:bg-white/10 border border-white/5 rounded-lg p-4 transition-colors">
                        <History className="w-4 h-4 text-[#9945FF]" />
                        <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-400">History</span>
                      </button>
                    </div>
                  </SpotlightCard>

                  {/* Connected Wallet Info */}
                  <SpotlightCard glowColor="rgba(153,69,255,0.2)" className="metallic-dark-premium rounded-xl p-6 flex flex-col justify-between backdrop-blur-md">
                    <div className="space-y-4">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-full bg-zinc-900 border border-white/10 flex items-center justify-center overflow-hidden">
                          {registration?.githubAvatarUrl ? (
                            <img src={registration.githubAvatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                          ) : (
                            <Wallet className="w-5 h-5 text-zinc-400" />
                          )}
                        </div>
                        <div>
                          <div className="text-[10px] font-mono text-[#888888] uppercase tracking-widest">Connected Builder</div>
                          <div className="text-xs font-mono text-zinc-300">
                            {registration ? `@${registration.githubHandle}` : "Not Connected"}
                          </div>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between items-center text-[10px] font-mono">
                          <span className="text-zinc-500 uppercase tracking-widest">Status</span>
                          <span className={registration ? "text-[#00FFA3]" : "text-zinc-500"}>
                            {registration ? "Verified" : "Pending"}
                          </span>
                        </div>
                        <div className="flex justify-between items-center text-[10px] font-mono">
                          <span className="text-zinc-500 uppercase tracking-widest">Type</span>
                          <span className="text-zinc-300">
                            {registration ? "GitHub Wallet" : "Session Key (Turnkey)"}
                          </span>
                        </div>
                        <div className="flex justify-between items-center text-[10px] font-mono">
                          <span className="text-zinc-500 uppercase tracking-widest">Voucher</span>
                          <span className="text-zinc-300">
                            {registration?.referralCode || "None"}
                          </span>
                        </div>
                      </div>
                    </div>
                    {!registration ? (
                      <button
                        onClick={() => window.location.href = "/api/github/oauth/start?code=THEGARAGE&next=dashboard&return_to=dashboard"}
                        className="w-full mt-6 py-2 border border-[#66FFDD]/30 rounded text-[10px] font-mono uppercase tracking-widest text-[#66FFDD] hover:bg-[#66FFDD]/10 transition-colors"
                      >
                        Connect GitHub
                      </button>
                    ) : (
                      <button className="w-full mt-6 py-2 border border-white/10 rounded text-[10px] font-mono uppercase tracking-widest text-zinc-400 hover:text-white hover:bg-white/5 transition-colors">
                        Manage Keys
                      </button>
                    )}
                  </SpotlightCard>
                </div>

                {/* Indexed Skills Collection */}
                <SpotlightCard glowColor="rgba(0,194,255,0.15)" className="metallic-dark-premium rounded-xl overflow-hidden flex flex-col backdrop-blur-md mt-6">
                  <div className="p-4 border-b border-white/5 flex justify-between items-center bg-[#0A0A0A]/50 relative z-10">
                    <h3 className="text-xs font-mono uppercase tracking-widest text-[#E5E5E5] flex items-center gap-2">
                      <Layers className="w-4 h-4 text-[#00C2FF]" />
                      My Indexed Skills
                    </h3>
                    <div className="flex items-center gap-4">
                      <button
                        onClick={syncWalletFromGithub}
                        className="text-[10px] font-mono text-[#66FFDD] hover:text-white transition-colors uppercase tracking-widest"
                      >
                        Sync GitHub Wallet
                      </button>
                      <button
                        onClick={() => window.location.href = "/marketplace"}
                        className="text-[10px] font-mono text-[#00C2FF] hover:text-white transition-colors uppercase tracking-widest"
                      >
                        Go to Marketplace →
                      </button>
                    </div>
                  </div>
                  {walletSyncStatus ? (
                    <div className="px-6 pt-4 text-[9px] font-mono uppercase tracking-widest text-zinc-500">
                      {walletSyncStatus}
                    </div>
                  ) : null}
                  <div className="p-6 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 relative z-10">
                    {walletSkills.map((skill, i) => (
                      <div key={i} className="bg-black/40 border border-white/5 rounded-lg p-4 hover:border-white/10 transition-colors group cursor-pointer">
                        <div className="flex justify-between items-start mb-3">
                          <div className="w-8 h-8 rounded bg-[#9945FF]/10 flex items-center justify-center border border-[#9945FF]/20">
                            <Zap className="w-4 h-4 text-[#9945FF]" />
                          </div>
                          <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest border border-white/10 px-2 py-0.5 rounded">Active</span>
                        </div>
                        <h4 className="text-sm font-mono text-white mb-1 group-hover:text-[#66FFDD] transition-colors">{skill.id}</h4>
                        <p className="text-[10px] font-mono text-zinc-500 line-clamp-2 mb-4">
                          Purchased for {skill.amountSol} SOL. Receipt: {(skill.receipt || "").substring(0, 10)}...
                        </p>
                        {skill.githubProof?.repoHtmlUrl ? (
                          <a
                            href={skill.githubProof.repoHtmlUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="text-[10px] font-mono text-zinc-400 hover:text-white transition-colors underline"
                          >
                            GitHub Wallet: {skill.githubProof.repoFullName || "repo"}
                          </a>
                        ) : null}
                        <div className="flex justify-between items-center border-t border-white/5 pt-3">
                          <span className="text-[9px] font-mono text-zinc-600 uppercase tracking-widest">Executions: 0</span>
                          <button className="text-[10px] font-mono text-[#66FFDD] uppercase tracking-widest hover:underline">Configure</button>
                        </div>
                      </div>
                    ))}

                    {/* Skill Card (Empty State/Add New) */}
                    <div
                      onClick={() => window.location.href = '/marketplace'}
                      className="bg-white/[0.02] border border-white/5 border-dashed rounded-lg p-4 flex flex-col items-center justify-center text-center hover:bg-white/[0.04] transition-colors cursor-pointer min-h-[140px]"
                    >
                      <Plus className="w-6 h-6 text-zinc-500 mb-2" />
                      <span className="text-xs font-mono text-zinc-400">Acquire New Skill</span>
                      <span className="text-[9px] font-mono text-zinc-600 mt-1 uppercase tracking-widest">Browse Marketplace</span>
                    </div>
                  </div>
                </SpotlightCard>
              </motion.div>
            )}

            {activeTab === "agents" && (
              <motion.div
                key="agents"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                data-title="Active Agents (Nodes)"
              >
                <SpotlightCard glowColor="rgba(20,241,149,0.15)" className="metallic-brushed metallic-shine rounded-xl overflow-hidden flex flex-col backdrop-blur-md">
                  <div className="p-4 border-b border-[#1F1F1F] flex justify-between items-center bg-[#0A0A0A]/50 relative z-10">
                    <h3 className="text-xs font-mono uppercase tracking-widest text-[#E5E5E5]">Active Agents (Nodes)</h3>
                  </div>
                  <div className="overflow-x-auto relative z-10">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="border-b border-[#1F1F1F] text-[#888888] font-mono text-[9px] uppercase tracking-widest bg-[#0A0A0A]/20">
                          <th className="py-3 px-4 font-normal">Agent ID</th>
                          <th className="py-3 px-4 font-normal">Reputation</th>
                          <th className="py-3 px-4 font-normal">Success Rate</th>
                          <th className="py-3 px-4 font-normal">Capital Managed</th>
                          <th className="py-3 px-4 font-normal">Avg Execution Time</th>
                          <th className="py-3 px-4 font-normal text-right">Fees Generated</th>
                        </tr>
                      </thead>
                      <tbody className="font-mono text-xs divide-y divide-[#1F1F1F]">
                        {agentsList.map((agent, i) => (
                          <tr key={i} className="hover:bg-[#1F1F1F]/50 transition-colors">
                            <td className="py-3 px-4 text-[#66FFDD] flex items-center gap-2">
                              <div className="w-2 h-2 rounded-full bg-[#00FFA3]" />
                              {agent.id}
                            </td>
                            <td className="py-3 px-4 text-[#E5E5E5]">{agent.reputation}</td>
                            <td className="py-3 px-4 text-[#00FFA3]">{agent.successRate}</td>
                            <td className="py-3 px-4 text-[#E5E5E5]">{agent.capital}</td>
                            <td className="py-3 px-4 text-[#888888]">{agent.avgTime}</td>
                            <td className="py-3 px-4 text-right text-[#00C2FF]">{agent.fees}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </SpotlightCard>
              </motion.div>
            )}

            {activeTab === "intents" && (
              <motion.div
                key="intents"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                data-title="Intents Log"
              >
                <SpotlightCard glowColor="rgba(102,255,221,0.15)" className="metallic-brushed metallic-shine rounded-xl overflow-hidden flex flex-col backdrop-blur-md">
                  <div className="p-4 border-b border-[#1F1F1F] flex justify-between items-center bg-[#0A0A0A]/50 relative z-10">
                    <h3 className="text-xs font-mono uppercase tracking-widest text-[#E5E5E5]">Intents Log</h3>
                  </div>
                  <div className="overflow-x-auto relative z-10">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="border-b border-[#1F1F1F] text-[#888888] font-mono text-[9px] uppercase tracking-widest bg-[#0A0A0A]/20">
                          <th className="py-3 px-4 font-normal">Intent ID</th>
                          <th className="py-3 px-4 font-normal">Status</th>
                          <th className="py-3 px-4 font-normal">Agent</th>
                          <th className="py-3 px-4 font-normal">Actions</th>
                          <th className="py-3 px-4 font-normal text-right">Time</th>
                        </tr>
                      </thead>
                      <tbody className="font-mono text-xs divide-y divide-[#1F1F1F]">
                        {recentIntents.map((intent, i) => (
                          <tr key={i} className="hover:bg-[#1F1F1F]/50 transition-colors">
                            <td className="py-3 px-4 text-[#E5E5E5]">{intent.id}</td>
                            <td className="py-3 px-4"><StatusBadge status="success" /></td>
                            <td className="py-3 px-4 text-[#66FFDD]">{intent.agent}</td>
                            <td className="py-3 px-4 text-[#888888]">{intent.actions}</td>
                            <td className="py-3 px-4 text-right text-[#888888]">{intent.timestamp.split('T')[1].substring(0,8)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </SpotlightCard>
              </motion.div>
            )}

            {activeTab === "executions" && (
              <motion.div
                key="executions"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                data-title="Execution Proofs"
              >
                <SpotlightCard glowColor="rgba(153,69,255,0.15)" className="metallic-brushed metallic-shine rounded-xl overflow-hidden flex flex-col backdrop-blur-md">
                  <div className="p-4 border-b border-[#1F1F1F] flex justify-between items-center bg-[#0A0A0A]/50 relative z-10">
                    <h3 className="text-xs font-mono uppercase tracking-widest text-[#E5E5E5]">Execution Proofs</h3>
                  </div>
                  <div className="overflow-x-auto relative z-10">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="border-b border-[#1F1F1F] text-[#888888] font-mono text-[9px] uppercase tracking-widest bg-[#0A0A0A]/20">
                          <th className="py-3 px-4 font-normal">Proof Hash</th>
                          <th className="py-3 px-4 font-normal">Intent ID</th>
                          <th className="py-3 px-4 font-normal">Result</th>
                          <th className="py-3 px-4 font-normal">Fee (USDC)</th>
                          <th className="py-3 px-4 font-normal text-right">Timestamp</th>
                        </tr>
                      </thead>
                      <tbody className="font-mono text-xs divide-y divide-[#1F1F1F]">
                        {recentExecutions.map((exec, i) => (
                          <tr key={i} className="hover:bg-[#1F1F1F]/50 transition-colors">
                            <td className="py-3 px-4 text-[#E5E5E5] flex items-center gap-2">
                              <Shield className="w-3 h-3 text-[#888888]" />
                              {exec.hash}
                            </td>
                            <td className="py-3 px-4 text-[#66FFDD]">{exec.intentId}</td>
                            <td className="py-3 px-4"><StatusBadge status={exec.status} /></td>
                            <td className="py-3 px-4 text-[#888888]">{exec.cost}</td>
                            <td className="py-3 px-4 text-right text-[#888888]">{exec.timestamp.split('T')[1].substring(0,8)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </SpotlightCard>
              </motion.div>
            )}

            {activeTab === "assets" && (
              <motion.div
                key="assets"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                data-title="Assets & Strategies"
              >
                <SpotlightCard glowColor="rgba(255,255,255,0.1)" className="metallic-brushed metallic-shine rounded-xl overflow-hidden flex flex-col backdrop-blur-md">
                  <div className="p-4 border-b border-[#1F1F1F] flex justify-between items-center bg-[#0A0A0A]/50 relative z-10">
                    <h3 className="text-xs font-mono uppercase tracking-widest text-[#E5E5E5]">Assets & Strategies</h3>
                  </div>
                  <div className="overflow-x-auto relative z-10">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="border-b border-[#1F1F1F] text-[#888888] font-mono text-[9px] uppercase tracking-widest bg-[#0A0A0A]/20">
                          <th className="py-3 px-4 font-normal">Asset</th>
                          <th className="py-3 px-4 font-normal">Type</th>
                          <th className="py-3 px-4 font-normal">Liquidity</th>
                          <th className="py-3 px-4 font-normal">Utilization</th>
                          <th className="py-3 px-4 font-normal">Yield (APY)</th>
                          <th className="py-3 px-4 font-normal text-right">Risk Score</th>
                        </tr>
                      </thead>
                      <tbody className="font-mono text-xs divide-y divide-[#1F1F1F]">
                        {assetsList.map((asset, i) => (
                          <tr key={i} className="hover:bg-[#1F1F1F]/50 transition-colors">
                            <td className="py-3 px-4 text-[#E5E5E5] font-bold">{asset.asset}</td>
                            <td className="py-3 px-4 text-[#888888]">{asset.type}</td>
                            <td className="py-3 px-4 text-[#E5E5E5]">${asset.liquidity}</td>
                            <td className="py-3 px-4 text-[#00C2FF]">{asset.utilization}</td>
                            <td className="py-3 px-4 text-[#00FFA3]">{asset.yield}</td>
                            <td className="py-3 px-4 text-right">
                              <span className={`px-2 py-1 rounded text-[9px] uppercase tracking-widest border ${
                                asset.riskScore < 4 ? 'bg-[#00FFA3]/10 text-[#00FFA3] border-[#00FFA3]/20' :
                                asset.riskScore < 7 ? 'bg-[#FFB800]/10 text-[#FFB800] border-[#FFB800]/20' :
                                'bg-[#FF4D4D]/10 text-[#FF4D4D] border-[#FF4D4D]/20'
                              }`}>
                                {asset.riskScore}/10
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </SpotlightCard>
              </motion.div>
            )}
          </AnimatePresence>

        </div>
      </div>
    </>
  );
};
