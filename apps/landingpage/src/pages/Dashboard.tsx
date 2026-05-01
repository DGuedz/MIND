import { useEffect, useState } from "react";
import { MainLayout } from "../layouts/MainLayout";
import { motion, AnimatePresence } from "framer-motion";

type AgentAsset = {
  id: string;
  created_at: string;
  builderId: string;
  skillName: string;
  category: string;
  executions: number;
  computeSaved: number;
  yieldGenerated: number;
  status: "minting" | "active" | "deprecated";
  txHash: string;
  githubRepo: string;
  metaplexAssetId: string;
};

export const Dashboard = () => {
  const [data, setData] = useState<AgentAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"human" | "ai">("human");
  const [isMindScanOpen, setIsMindScanOpen] = useState(false);

  useEffect(() => {
    async function fetchData() {
      // Simulate fetching from A2A Telemetry PDA / x402 Graph
      setTimeout(() => {
        setData([
          {
            id: "mind_card_001",
            created_at: new Date().toISOString(),
            builderId: "0xGarageHacker",
            skillName: "DeFi_Yield_Optimizer",
            category: "DeFi",
            executions: 14205,
            computeSaved: 850000,
            yieldGenerated: 1250.45,
            status: "active",
            txHash: "5Kt...9pX",
            githubRepo: "TheGarage/yield-optimizer-skill",
            metaplexAssetId: "Core...8xV2"
          },
          {
            id: "mind_card_002",
            created_at: new Date(Date.now() - 86400000).toISOString(),
            builderId: "0xColosseumDev",
            skillName: "Kamino_Nightly_Audit",
            category: "Audit",
            executions: 450,
            computeSaved: 120000,
            yieldGenerated: 0,
            status: "active",
            txHash: "2Mz...4bY",
            githubRepo: "colosseum-copilot/kamino-audit",
            metaplexAssetId: "Core...3mP9"
          },
          {
            id: "mind_card_003",
            created_at: new Date(Date.now() - 172800000).toISOString(),
            builderId: "0xSuperteamBR",
            skillName: "Jupiter_Arb_Sniper",
            category: "Trading",
            executions: 89034,
            computeSaved: 2100000,
            yieldGenerated: 4530.20,
            status: "active",
            txHash: "7Rq...1wZ",
            githubRepo: "SuperteamBR/jup-sniper-agent",
            metaplexAssetId: "Core...7yK1"
          }
        ]);
        setLoading(false);
      }, 800);
    }
    fetchData();
  }, []);

  const totalAssets = data.length;
  const totalExecutions = data.reduce((acc, curr) => acc + curr.executions, 0);
  const totalYield = data.reduce((acc, curr) => acc + curr.yieldGenerated, 0);
  const totalCompute = data.reduce((acc, curr) => acc + curr.computeSaved, 0);

  return (
    <MainLayout>
      <div className="container mx-auto px-6 pt-32 pb-24 min-h-[80vh]">
        <div className="max-w-6xl mx-auto space-y-12">
          
          <div className="space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                <span className="text-[10px] font-mono uppercase tracking-[0.3em] text-green-500">MIND Neural Bridge Connected</span>
              </div>
              <div className="flex items-center gap-2 bg-[#050505] border border-cyan-500/20 px-3 py-1.5 rounded-full">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="text-cyan-500" strokeWidth="2">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                </svg>
                <span className="text-[10px] font-mono text-cyan-400 tracking-widest uppercase">Metaplex Core Provenance Active</span>
              </div>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-white tracking-tight">
              Ecosystem God View
            </h1>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <p className="text-zinc-500 text-lg leading-relaxed max-w-2xl">
                Visão global e telemetria em tempo real do ecossistema MIND. Acompanhe a performance das suas Agent Cards, volume da rede e liquidação atômica (x402).
              </p>
              
              {/* View Toggle */}
              <div className="flex items-center bg-white/5 border border-white/10 rounded-full p-1 self-start">
                <button 
                  onClick={() => setViewMode("human")}
                  className={`px-4 py-2 rounded-full text-xs font-mono tracking-widest uppercase transition-all ${viewMode === "human" ? "bg-white text-black" : "text-zinc-500 hover:text-white"}`}
                >
                  Human UI
                </button>
                <button 
                  onClick={() => setViewMode("ai")}
                  className={`px-4 py-2 rounded-full text-xs font-mono tracking-widest uppercase transition-all ${viewMode === "ai" ? "bg-cyan-500 text-black shadow-[0_0_15px_rgba(34,211,238,0.4)]" : "text-zinc-500 hover:text-cyan-400"}`}
                >
                  Data Matrix (AI)
                </button>
              </div>
            </div>
          </div>

          {viewMode === "human" ? (
            <>
              {/* Top Section: Agentic Wallet & A2A Flow */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Agent Wallet Profile */}
                <div className="bg-[#050505] border border-white/10 rounded-[2rem] p-6 md:p-8 flex flex-col justify-between shadow-[0_0_30px_rgba(34,211,238,0.02)]">
                  <div className="flex items-center justify-between mb-6 border-b border-white/5 pb-6">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-cyan-500/10 flex items-center justify-center border border-cyan-500/30">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="text-cyan-400" strokeWidth="2">
                          <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4" />
                          <path d="M3 5v14a2 2 0 0 0 2 2h16v-5" />
                          <path d="M18 12a2 2 0 0 0 0 4h4v-4Z" />
                        </svg>
                      </div>
                      <div>
                        <h3 className="text-white font-medium text-sm">Agentic Wallet</h3>
                        <p className="text-zinc-500 font-mono text-[9px] uppercase tracking-widest mt-0.5">Turnkey KMS</p>
                      </div>
                    </div>
                    <div className="bg-green-500/10 border border-green-500/20 text-green-400 font-mono text-[9px] px-2 py-1 rounded uppercase tracking-wider">
                      Active
                    </div>
                  </div>

                  <div className="space-y-5 font-mono">
                    <div className="flex justify-between items-end border-b border-white/5 pb-2">
                      <span className="text-zinc-500 text-xs uppercase">PubKey</span>
                      <span className="text-zinc-300 text-xs">7xKX...3bQm</span>
                    </div>
                    <div className="flex justify-between items-end border-b border-white/5 pb-2">
                      <span className="text-zinc-500 text-xs uppercase">Network</span>
                      <div className="flex items-center gap-1.5">
                        <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                        <span className="text-zinc-300 text-xs">Solana Mainnet</span>
                      </div>
                    </div>
                    <div className="flex justify-between items-end border-b border-white/5 pb-2">
                      <span className="text-zinc-500 text-xs uppercase">Balance (SOL)</span>
                      <span className="text-white text-sm font-bold">14.205 <span className="text-zinc-500 text-[10px] font-normal">SOL</span></span>
                    </div>
                    <div className="flex justify-between items-end border-b border-white/5 pb-2">
                      <span className="text-zinc-500 text-xs uppercase">Settlement</span>
                      <span className="text-green-400 text-sm font-bold">4,250.00 <span className="text-green-500/50 text-[10px] font-normal">USDC</span></span>
                    </div>
                    <div className="flex justify-between items-end">
                      <span className="text-zinc-500 text-xs uppercase">Shielded (Cloak)</span>
                      <span className="text-cyan-400 text-sm font-bold">1,250.00 <span className="text-cyan-500/50 text-[10px] font-normal">USDC</span></span>
                    </div>
                  </div>
                </div>

                {/* Global Ecosystem View - Interactive A2A Flow */}
                <div 
                  className="lg:col-span-2 w-full h-full min-h-[300px] bg-[#050505] border border-white/5 rounded-[2rem] overflow-hidden relative flex items-center justify-center cursor-pointer group shadow-[inset_0_0_50px_rgba(255,255,255,0.02)]"
                  onClick={() => setIsMindScanOpen(true)}
                >
                  {/* Background Grid */}
                  <div className="absolute inset-0 opacity-10 transition-opacity group-hover:opacity-20" style={{ backgroundImage: 'radial-gradient(circle at center, #ffffff 1px, transparent 1px)', backgroundSize: '24px 24px' }}></div>
                  
                  {/* Flowing Rails (A2A Paths) - Dark/Grey theme */}
                  <svg className="absolute inset-0 w-full h-full opacity-80" preserveAspectRatio="none">
                    {/* Core Data Highways */}
                    <motion.path d="M -100,80 C 200,80 300,150 500,150 C 700,150 800,80 1200,80" stroke="rgba(255,255,255,0.15)" strokeWidth="1.5" fill="none" />
                    <motion.path d="M -100,220 C 200,220 300,150 500,150 C 700,150 800,220 1200,220" stroke="rgba(255,255,255,0.15)" strokeWidth="1.5" fill="none" />
                    <motion.path d="M -100,150 L 1200,150" stroke="rgba(255,255,255,0.1)" strokeWidth="1" strokeDasharray="4 4" fill="none" />
                    <motion.path d="M 500,-100 C 500,50 600,100 600,300" stroke="rgba(255,255,255,0.05)" strokeWidth="1" strokeDasharray="2 2" fill="none" />
                    
                    {/* New Rails for higher density */}
                    <motion.path d="M -100,40 C 300,40 400,120 500,150 C 600,180 900,40 1200,40" stroke="rgba(255,255,255,0.08)" strokeWidth="1" fill="none" />
                    <motion.path d="M -100,260 C 300,260 400,180 500,150 C 600,120 900,260 1200,260" stroke="rgba(255,255,255,0.08)" strokeWidth="1" fill="none" />
                    <motion.path d="M 300,-100 C 400,50 450,100 500,150 C 550,200 600,300 700,400" stroke="rgba(255,255,255,0.05)" strokeWidth="1" strokeDasharray="3 6" fill="none" />

                    {/* Extreme Rails - Diagonals and sharp curves */}
                    <motion.path d="M -100,-50 C 200,100 300,200 1200,400" stroke="rgba(255,255,255,0.06)" strokeWidth="1" fill="none" />
                    <motion.path d="M -100,400 C 200,300 300,200 1200,-50" stroke="rgba(255,255,255,0.06)" strokeWidth="1" fill="none" />
                    <motion.path d="M 200,-100 Q 400,150 500,150 T 800,400" stroke="rgba(255,255,255,0.04)" strokeWidth="1" strokeDasharray="5 5" fill="none" />
                    <motion.path d="M 800,-100 Q 600,150 500,150 T 200,400" stroke="rgba(255,255,255,0.04)" strokeWidth="1" strokeDasharray="5 5" fill="none" />
                    <motion.path d="M -100,20 L 1200,20" stroke="rgba(255,255,255,0.03)" strokeWidth="2" fill="none" />
                    <motion.path d="M -100,280 L 1200,280" stroke="rgba(255,255,255,0.03)" strokeWidth="2" fill="none" />

                    {/* Intense A2A Flow Particles (White/Grey scale) */}
                    {/* Path 1: Fast data */}
                    <motion.circle cx="0" cy="0" r="1.5" fill="#ffffff" filter="blur(0.5px)">
                      <animateMotion dur="1.2s" repeatCount="indefinite" path="M -100,80 C 200,80 300,150 500,150 C 700,150 800,80 1200,80" />
                    </motion.circle>
                    <motion.circle cx="0" cy="0" r="2" fill="#a1a1aa">
                      <animateMotion dur="1.8s" repeatCount="indefinite" begin="0.5s" path="M -100,80 C 200,80 300,150 500,150 C 700,150 800,80 1200,80" />
                    </motion.circle>
                    <motion.circle cx="0" cy="0" r="1" fill="#e4e4e7">
                      <animateMotion dur="2.1s" repeatCount="indefinite" begin="0.8s" path="M -100,80 C 200,80 300,150 500,150 C 700,150 800,80 1200,80" />
                    </motion.circle>
                    <motion.circle cx="0" cy="0" r="2.5" fill="#ffffff" opacity="0.8">
                      <animateMotion dur="1.4s" repeatCount="indefinite" begin="1.1s" path="M -100,80 C 200,80 300,150 500,150 C 700,150 800,80 1200,80" />
                    </motion.circle>
                    
                    {/* Path 2: Heavy settlement */}
                    <motion.circle cx="0" cy="0" r="3" fill="#d4d4d8" filter="blur(1px)">
                      <animateMotion dur="2.5s" repeatCount="indefinite" path="M -100,220 C 200,220 300,150 500,150 C 700,150 800,220 1200,220" />
                    </motion.circle>
                    <motion.circle cx="0" cy="0" r="1.5" fill="#ffffff">
                      <animateMotion dur="1.5s" repeatCount="indefinite" begin="1.2s" path="M -100,220 C 200,220 300,150 500,150 C 700,150 800,220 1200,220" />
                    </motion.circle>
                    <motion.circle cx="0" cy="0" r="2" fill="#71717a">
                      <animateMotion dur="1.9s" repeatCount="indefinite" begin="0.3s" path="M -100,220 C 200,220 300,150 500,150 C 700,150 800,220 1200,220" />
                    </motion.circle>
                    <motion.circle cx="0" cy="0" r="2" fill="#e4e4e7">
                      <animateMotion dur="2.2s" repeatCount="indefinite" begin="0.7s" path="M -100,220 C 200,220 300,150 500,150 C 700,150 800,220 1200,220" />
                    </motion.circle>

                    {/* Path 3: Straight rapid fire */}
                    <motion.circle cx="0" cy="0" r="1" fill="#ffffff">
                      <animateMotion dur="0.8s" repeatCount="indefinite" path="M -100,150 L 1200,150" />
                    </motion.circle>
                    <motion.circle cx="0" cy="0" r="2" fill="#52525b">
                      <animateMotion dur="1.1s" repeatCount="indefinite" begin="0.4s" path="M -100,150 L 1200,150" />
                    </motion.circle>
                    <motion.circle cx="0" cy="0" r="1.5" fill="#a1a1aa">
                      <animateMotion dur="0.9s" repeatCount="indefinite" begin="0.2s" path="M -100,150 L 1200,150" />
                    </motion.circle>

                    {/* Path 4: New Top Rail */}
                    <motion.circle cx="0" cy="0" r="1.5" fill="#d4d4d8">
                      <animateMotion dur="1.6s" repeatCount="indefinite" path="M -100,40 C 300,40 400,120 500,150 C 600,180 900,40 1200,40" />
                    </motion.circle>
                    <motion.circle cx="0" cy="0" r="2" fill="#ffffff" filter="blur(0.5px)">
                      <animateMotion dur="2.0s" repeatCount="indefinite" begin="0.8s" path="M -100,40 C 300,40 400,120 500,150 C 600,180 900,40 1200,40" />
                    </motion.circle>

                    {/* Path 5: New Bottom Rail */}
                    <motion.circle cx="0" cy="0" r="2" fill="#71717a">
                      <animateMotion dur="2.3s" repeatCount="indefinite" path="M -100,260 C 300,260 400,180 500,150 C 600,120 900,260 1200,260" />
                    </motion.circle>
                    <motion.circle cx="0" cy="0" r="1" fill="#ffffff">
                      <animateMotion dur="1.7s" repeatCount="indefinite" begin="1.1s" path="M -100,260 C 300,260 400,180 500,150 C 600,120 900,260 1200,260" />
                    </motion.circle>

                    {/* Path 6: Diagonal Cross Rail */}
                    <motion.circle cx="0" cy="0" r="1.5" fill="#a1a1aa">
                      <animateMotion dur="3.0s" repeatCount="indefinite" path="M 300,-100 C 400,50 450,100 500,150 C 550,200 600,300 700,400" />
                    </motion.circle>

                    {/* Path 7: Steep Diagonal Down */}
                    <motion.circle cx="0" cy="0" r="1" fill="#ffffff">
                      <animateMotion dur="2.1s" repeatCount="indefinite" path="M -100,-50 C 200,100 300,200 1200,400" />
                    </motion.circle>
                    <motion.circle cx="0" cy="0" r="1.5" fill="#a1a1aa">
                      <animateMotion dur="2.8s" repeatCount="indefinite" begin="0.9s" path="M -100,-50 C 200,100 300,200 1200,400" />
                    </motion.circle>
                    
                    {/* Path 8: Steep Diagonal Up */}
                    <motion.circle cx="0" cy="0" r="1.5" fill="#e4e4e7" filter="blur(0.5px)">
                      <animateMotion dur="2.4s" repeatCount="indefinite" path="M -100,400 C 200,300 300,200 1200,-50" />
                    </motion.circle>
                    <motion.circle cx="0" cy="0" r="2" fill="#71717a">
                      <animateMotion dur="3.2s" repeatCount="indefinite" begin="1.5s" path="M -100,400 C 200,300 300,200 1200,-50" />
                    </motion.circle>

                    {/* Path 9: Left Wavy */}
                    <motion.circle cx="0" cy="0" r="1.5" fill="#d4d4d8">
                      <animateMotion dur="3.5s" repeatCount="indefinite" path="M 200,-100 Q 400,150 500,150 T 800,400" />
                    </motion.circle>

                    {/* Path 10: Right Wavy */}
                    <motion.circle cx="0" cy="0" r="1" fill="#ffffff">
                      <animateMotion dur="3.1s" repeatCount="indefinite" begin="0.4s" path="M 800,-100 Q 600,150 500,150 T 200,400" />
                    </motion.circle>

                    {/* Path 11: Ultra Fast Top Line */}
                    <motion.circle cx="0" cy="0" r="2" fill="#ffffff" opacity="0.6">
                      <animateMotion dur="0.6s" repeatCount="indefinite" path="M -100,20 L 1200,20" />
                    </motion.circle>
                    <motion.circle cx="0" cy="0" r="1" fill="#ffffff">
                      <animateMotion dur="0.9s" repeatCount="indefinite" begin="0.3s" path="M -100,20 L 1200,20" />
                    </motion.circle>
                    <motion.circle cx="0" cy="0" r="3" fill="#a1a1aa" filter="blur(1px)">
                      <animateMotion dur="1.2s" repeatCount="indefinite" begin="0.7s" path="M -100,20 L 1200,20" />
                    </motion.circle>

                    {/* Path 12: Ultra Fast Bottom Line */}
                    <motion.circle cx="0" cy="0" r="1.5" fill="#e4e4e7">
                      <animateMotion dur="0.7s" repeatCount="indefinite" path="M -100,280 L 1200,280" />
                    </motion.circle>
                    <motion.circle cx="0" cy="0" r="2" fill="#52525b">
                      <animateMotion dur="1.1s" repeatCount="indefinite" begin="0.2s" path="M -100,280 L 1200,280" />
                    </motion.circle>
                    <motion.circle cx="0" cy="0" r="1" fill="#ffffff">
                      <animateMotion dur="0.8s" repeatCount="indefinite" begin="0.6s" path="M -100,280 L 1200,280" />
                    </motion.circle>

                    {/* Central Settlement Hub - Removed from SVG to use HTML overlay */}
                  </svg>

                  {/* MIND Central Neural Node */}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
                    <div className="relative flex items-center justify-center">
                      {/* Pulsing neural glows */}
                      <motion.div 
                        className="absolute w-40 h-40 bg-white/[0.03] rounded-full blur-2xl"
                        animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0.8, 0.5] }} 
                        transition={{ duration: 3, repeat: Infinity }} 
                      />
                      <motion.div 
                        className="absolute w-24 h-24 bg-white/[0.05] rounded-full blur-md"
                        animate={{ scale: [1, 1.2, 1], opacity: [0.8, 1, 0.8] }} 
                        transition={{ duration: 2, repeat: Infinity }} 
                      />
                      
                      {/* Synaptic Rings */}
                      <motion.div 
                        className="absolute w-32 h-32 border border-white/10 rounded-full border-t-white/40 border-r-white/20"
                        animate={{ rotate: 360 }}
                        transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                      />
                      <motion.div 
                        className="absolute w-48 h-48 border border-white/5 rounded-full border-b-white/30 border-l-white/10"
                        animate={{ rotate: -360 }}
                        transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                      />
                      
                      {/* Core Node */}
                      <div className="relative w-16 h-16 bg-[#050505] border border-white/20 rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(255,255,255,0.1)] backdrop-blur-sm">
                        <img src="/m-logo.svg" alt="MIND" className="w-8 h-8 opacity-90" />
                      </div>
                    </div>
                  </div>

                  {/* Overlay UI - Moved to bottom right */}
                  <div className="absolute bottom-6 right-6 z-10 text-right space-y-1.5 backdrop-blur-xl bg-black/60 p-4 rounded-xl border border-white/10 group-hover:border-white/30 transition-colors shadow-2xl">
                    <div className="text-white font-mono text-xs tracking-widest flex items-center justify-end gap-2">
                      A2A SETTLEMENT LIVE
                      <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                    </div>
                    <div className="text-zinc-400 font-mono text-[11px]">TPS: <span className="text-white font-bold">4,203</span></div>
                    <div className="text-zinc-500 font-mono text-[9px] uppercase mt-1 group-hover:text-white transition-colors">Click for MIND Scan ↗</div>
                  </div>
                </div>
              </div>

              {/* Core Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-zinc-950 border border-white/10 rounded-[2rem] p-8 relative overflow-hidden group hover:border-white/20 transition-colors flex flex-col justify-between">
                  <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="space-y-2">
                    <div className="text-[10px] font-mono uppercase tracking-widest text-zinc-500">Your Agent Cards</div>
                    <div className="text-4xl font-bold text-white">{totalAssets}</div>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-6 pt-4 border-t border-white/5">
                    {Array.from(new Set(data.map(d => d.category))).map(cat => (
                      <span key={cat} className="text-[9px] font-mono uppercase tracking-wider text-zinc-400 bg-white/5 px-2 py-1 rounded-md border border-white/10">
                        {cat}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="bg-zinc-950 border border-white/10 rounded-[2rem] p-8 space-y-2 relative overflow-hidden group hover:border-white/20 transition-colors">
                  <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="text-[10px] font-mono uppercase tracking-widest text-zinc-500">A2A Executions</div>
                  <div className="text-4xl font-bold text-white">{(totalExecutions / 1000).toFixed(1)}k</div>
                </div>
                <div className="bg-zinc-950 border border-green-500/20 rounded-[2rem] p-8 space-y-2 relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-transparent pointer-events-none" />
                  <div className="text-[10px] font-mono uppercase tracking-widest text-green-500/70">Yield Generated (USDC)</div>
                  <div className="text-4xl font-bold text-white">${totalYield.toLocaleString()}</div>
                </div>
                <div className="bg-zinc-950 border border-blue-500/20 rounded-[2rem] p-8 space-y-2 relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-transparent pointer-events-none" />
                  <div className="text-[10px] font-mono uppercase tracking-widest text-blue-500/70 flex items-center justify-between">
                    Compute Saved
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                  </div>
                  <div className="text-4xl font-bold text-white">{(totalCompute / 1000000).toFixed(1)}M</div>
                  <div className="text-[9px] font-mono text-zinc-500 mt-2">RPC cycles optimized</div>
                </div>
              </div>

              {/* Market Signals Feed */}
              <div className="bg-zinc-950 border border-white/10 rounded-[2rem] overflow-hidden p-8 space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-cyan-500 shadow-[0_0_8px_rgba(34,211,238,0.8)] animate-pulse" />
                    <h3 className="text-xl font-medium text-white">Market Signals & Alpha Feed</h3>
                  </div>
                  <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-500 bg-white/5 px-3 py-1 rounded-full border border-white/10">Live Firecrawl Ingestion</span>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-[#050505] border border-white/5 rounded-xl p-5 space-y-3 hover:border-cyan-500/30 transition-colors">
                    <div className="flex justify-between items-start">
                      <span className="text-xs font-mono text-cyan-400 bg-cyan-500/10 px-2 py-1 rounded">Jupiter</span>
                      <span className="text-[10px] text-zinc-600 font-mono">2m ago</span>
                    </div>
                    <p className="text-sm text-zinc-300">Spike de volume detectado em JUP/USDC (+340%). Arbitragem Sniper Agent Card acionado 124 vezes nos últimos 5 min.</p>
                  </div>
                  <div className="bg-[#050505] border border-white/5 rounded-xl p-5 space-y-3 hover:border-green-500/30 transition-colors">
                    <div className="flex justify-between items-start">
                      <span className="text-xs font-mono text-green-400 bg-green-500/10 px-2 py-1 rounded">Kamino</span>
                      <span className="text-[10px] text-zinc-600 font-mono">15m ago</span>
                    </div>
                    <p className="text-sm text-zinc-300">Nova vault de liquidez JitoSOL/SOL listada. Yield Optimizer ajustando pesos para capturar 18.5% APY de bootstrapping.</p>
                  </div>
                  <div className="bg-[#050505] border border-white/5 rounded-xl p-5 space-y-3 hover:border-purple-500/30 transition-colors">
                    <div className="flex justify-between items-start">
                      <span className="text-xs font-mono text-purple-400 bg-purple-500/10 px-2 py-1 rounded">Meteora</span>
                      <span className="text-[10px] text-zinc-600 font-mono">1h ago</span>
                    </div>
                    <p className="text-sm text-zinc-300">DLMM pool imbalance detectado (WIF/SOL). Oportunidade de rebalanceamento via Agentic Swaps.</p>
                  </div>
                </div>
              </div>

              {/* Builder Feed */}
              <div className="bg-[#050505] border border-white/10 rounded-[2rem] overflow-hidden">
                <div className="p-8 border-b border-white/5 flex items-center justify-between">
                  <h3 className="text-xl font-medium text-white">Seus Ativos (Skills Adquiridas)</h3>
                  <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-500 bg-white/5 px-3 py-1 rounded-full border border-white/10">Ready for A2A</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-white/5 text-zinc-500 font-mono text-[10px] uppercase tracking-widest">
                      <tr>
                        <th className="px-8 py-4 font-normal">Asset (Skill)</th>
                        <th className="px-8 py-4 font-normal">Builder (Owner)</th>
                        <th className="px-8 py-4 font-normal">Volume (Exec)</th>
                        <th className="px-8 py-4 font-normal">Value Generated</th>
                        <th className="px-8 py-4 font-normal">Provenance (GitHub & Metaplex)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 text-zinc-300">
                      {loading ? (
                        <tr>
                          <td colSpan={5} className="px-8 py-8 text-center text-zinc-600 font-mono text-xs animate-pulse">Syncing x402 settlement graph...</td>
                        </tr>
                      ) : data.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="px-8 py-8 text-center text-zinc-600 font-mono text-xs">Nenhuma skill adquirida ainda.</td>
                        </tr>
                      ) : (
                        data.map((asset) => (
                          <tr key={asset.id} className="hover:bg-white/[0.02] transition-colors group">
                            <td className="px-8 py-4">
                              <div className="flex items-center gap-3">
                                <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]" />
                                <div className="flex flex-col">
                                  <span className="font-mono text-white text-xs">{asset.skillName}</span>
                                  <span className="font-mono text-zinc-500 text-[9px] uppercase mt-0.5">{asset.category}</span>
                                </div>
                              </div>
                            </td>
                            <td className="px-8 py-4 font-mono text-zinc-400 text-xs">
                              {asset.builderId}
                            </td>
                            <td className="px-8 py-4 font-mono text-white text-xs">
                              {asset.executions.toLocaleString()} <span className="text-zinc-600">reqs</span>
                            </td>
                            <td className="px-8 py-4 font-mono text-green-400 text-xs">
                              ${asset.yieldGenerated > 0 ? asset.yieldGenerated.toLocaleString() : "0.00"}
                            </td>
                            <td className="px-8 py-4">
                              <div className="flex flex-col gap-1.5">
                                <a href={`https://github.com/${asset.githubRepo}`} target="_blank" rel="noreferrer" className="text-zinc-400 hover:text-white transition-colors font-mono text-[10px] flex items-center gap-1.5">
                                  <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
                                  {asset.githubRepo.split('/')[1]}
                                </a>
                                <div className="flex items-center gap-1.5 text-[9px] font-mono text-cyan-500/80">
                                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                                  {asset.metaplexAssetId}
                                </div>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          ) : (
            <div className="bg-[#0a0a0a] border border-cyan-500/20 rounded-[2rem] p-8 overflow-hidden shadow-[0_0_50px_rgba(34,211,238,0.05)]">
              <div className="flex items-center justify-between mb-6 border-b border-cyan-500/10 pb-4">
                <div className="flex items-center gap-4">
                  <div className="w-3 h-3 bg-cyan-500 shadow-[0_0_10px_rgba(34,211,238,0.8)]" />
                  <span className="font-mono text-cyan-400 text-sm tracking-widest">MIND_OS // TERMINAL_OUTPUT</span>
                </div>
                <div className="font-mono text-zinc-600 text-xs">FORMAT: JSON_STREAM</div>
              </div>
              <pre className="font-mono text-[11px] text-cyan-500/80 overflow-x-auto whitespace-pre-wrap leading-relaxed">
                {JSON.stringify({
                  timestamp: new Date().toISOString(),
                  network_status: "OPTIMAL",
                  global_tps: 4203,
                  x402_settlement_active: true,
                  aggregated_metrics: {
                    total_assets: totalAssets,
                    total_executions: totalExecutions,
                    total_yield_usdc: totalYield,
                    compute_optimized: totalCompute
                  },
                  market_signals: [
                    { source: "Jupiter", type: "VOL_SPIKE", asset: "JUP/USDC", change: "+340%", action: "TRIGGER_ARB_SNIPER" },
                    { source: "Kamino", type: "NEW_VAULT", asset: "JitoSOL/SOL", yield: "18.5%", action: "REBALANCE_YIELD" },
                    { source: "Meteora", type: "IMBALANCE", asset: "WIF/SOL", action: "AGENTIC_SWAP" }
                  ],
                  assets_payload: data.map(d => ({
                    id: d.id,
                    skillName: d.skillName,
                    category: d.category,
                    github_repo: d.githubRepo,
                    metaplex_core_id: d.metaplexAssetId,
                    metrics: {
                      executions: d.executions,
                      compute_saved: d.computeSaved,
                      yield_generated: d.yieldGenerated
                    }
                  }))
                }, null, 2)}
              </pre>
            </div>
          )}

        </div>
      </div>

      {/* MIND Scan Modal */}
      <AnimatePresence>
        {isMindScanOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-4xl bg-[#050505] border border-cyan-500/30 rounded-2xl overflow-hidden shadow-[0_0_50px_rgba(34,211,238,0.1)] flex flex-col max-h-[80vh]"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between p-6 border-b border-white/5 bg-zinc-950/50">
                <div className="flex items-center gap-4">
                  <div className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse" />
                  <h2 className="text-xl font-bold text-white font-mono">MIND Scan // Live x402 Explorer</h2>
                </div>
                <button 
                  onClick={() => setIsMindScanOpen(false)}
                  className="text-zinc-500 hover:text-white transition-colors"
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M18 6L6 18M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Modal Content - Fake Terminal/Logs */}
              <div className="p-6 overflow-y-auto font-mono text-xs flex-1 space-y-4">
                {[...Array(10)].map((_, i) => (
                  <div key={i} className="border-l-2 border-cyan-500/50 pl-4 py-1 space-y-1">
                    <div className="text-zinc-500">[{new Date(Date.now() - i * 1500).toISOString()}]</div>
                    <div className="text-cyan-400">
                      <span className="text-white">x402_SETTLEMENT:</span> ATOMIC_TRANSFER_INITIATED
                    </div>
                    <div className="text-zinc-400">
                      From: <span className="text-green-400">Agent_Yield_Optimizer</span> <br/>
                      To: <span className="text-purple-400">Protocol_Treasury (8%)</span> & <span className="text-yellow-400">Builder_Wallet (92%)</span>
                    </div>
                    <div className="text-zinc-600 truncate">
                      Hash: {Math.random().toString(36).substring(2, 15)}...{Math.random().toString(36).substring(2, 15)}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </MainLayout>
  );
};
