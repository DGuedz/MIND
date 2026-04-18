import { useState, useEffect } from "react";
import { Bot, ShieldCheck, Wallet, ArrowRight, CheckCircle2, Sparkles } from "lucide-react";
import { Badge } from "../components/ui/badge";
import { motion } from "framer-motion";

// Procedural Agent Identity Visual (The "Mindprint")
function MindprintVisual({ seed }: { seed: string }) {
  const [rotation, setRotation] = useState(0);
  
  useEffect(() => {
    const interval = setInterval(() => {
      setRotation(r => (r + 1) % 360);
    }, 50);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="w-48 h-48 mx-auto relative group">
      <svg width="100%" height="100%" viewBox="0 0 200 200" className="drop-shadow-[0_0_30px_rgba(255,255,255,0.1)]">
        <defs>
          <filter id="glow">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>
        
        {/* Background neural rings */}
        {[1, 2, 3].map((r) => (
          <motion.circle
            key={r}
            cx="100" cy="100" r={40 + r * 20}
            fill="none" stroke="#ffffff" strokeWidth="0.2"
            initial={{ opacity: 0.05 }}
            animate={{ 
              opacity: [0.05, 0.15, 0.05],
              scale: [1, 1.05, 1]
            }}
            transition={{ duration: 4, repeat: Infinity, delay: r * 0.5 }}
          />
        ))}

        {/* Procedural elements based on seed */}
        <g transform={`rotate(${rotation} 100 100)`}>
          {Array.from({ length: 12 }).map((_, i) => {
            const angle = (i * 30) * (Math.PI / 180);
            const x = 100 + Math.cos(angle) * 60;
            const y = 100 + Math.sin(angle) * 60;
            return (
              <motion.line
                key={i}
                x1="100" y1="100" x2={x} y2={y}
                stroke="#ffffff" strokeWidth="0.5"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 0.4 }}
                transition={{ duration: 2, delay: i * 0.1 }}
              />
            );
          })}
        </g>

        <circle cx="100" cy="100" r="40" fill="#050505" stroke="#ffffff" strokeWidth="1" filter="url(#glow)" />
        <text x="100" y="105" textAnchor="middle" fill="#ffffff" fontSize="8" fontFamily="monospace" letterSpacing="2">
          {seed.substring(8, 14)}
        </text>
      </svg>
      
      <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
    </div>
  );
}

export function RegisterPage() {
  const [step, setStep] = useState(1);
  const [agentId] = useState(() => `MIND_AG_${Math.random().toString(36).substr(2, 6).toUpperCase()}`);
  const [formData, setFormData] = useState({
    agentName: "",
    walletAddress: "",
    agentRole: "trading",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setStep(3);
  };

  return (
    <div className="container mx-auto px-6 pt-48 pb-32 space-y-32">
      <header className="space-y-8 border-b border-white/5 pb-16">
        <Badge variant="outline" className="border-zinc-800 text-zinc-500 font-mono uppercase text-[9px] tracking-[0.3em] px-4 py-1">
          Institutional Onboarding
        </Badge>
        <h1 className="text-5xl md:text-7xl font-bold text-white tracking-tight leading-[0.9]">
          Activate <br />
          <span className="italic font-light opacity-60 text-zinc-400">Agent.</span>
        </h1>
        <p className="text-xl text-zinc-500 leading-relaxed max-w-2xl font-light">
          Onboard your autonomous agent to the MIND A2A protocol. Security anchored via Solana and Zero-Trust KMS.
        </p>
      </header>

      <div className="max-w-2xl mx-auto w-full">
        <div className="bg-white/[0.02] border border-white/5 p-12 md:p-20 rounded-[3rem] relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-zinc-500/5 to-transparent opacity-50" />
          
          {/* Progress Indicator */}
          <div className="flex items-center justify-between mb-20 relative z-10">
            <div className="absolute top-1/2 left-0 right-0 h-px bg-white/5 -translate-y-1/2 z-0" />
            {[
              { label: "Designation", num: "01" },
              { label: "Treasury", num: "02" },
              { label: "Terminal", num: "03" }
            ].map((stepInfo, idx) => (
              <div key={idx} className="flex flex-col items-center gap-4 relative z-10">
                <div 
                  className={`w-12 h-12 rounded-full flex items-center justify-center text-[10px] font-mono transition-all duration-700 ${
                    step >= idx + 1 ? "bg-white text-black shadow-[0_0_30px_rgba(255,255,255,0.1)]" : "bg-black border border-white/5 text-zinc-800"
                  }`}
                >
                  {step > idx + 1 ? <CheckCircle2 className="w-4 h-4" /> : stepInfo.num}
                </div>
                <span className={`text-[9px] font-mono uppercase tracking-widest ${step >= idx + 1 ? "text-zinc-400" : "text-zinc-800"}`}>
                  {stepInfo.label}
                </span>
              </div>
            ))}
          </div>

          <div className="relative z-10">
            {step === 1 && (
              <form onSubmit={() => setStep(2)} className="space-y-10 animate-in fade-in slide-in-from-bottom-8 duration-1000">
                <div className="space-y-4">
                  <label className="text-[10px] text-zinc-500 font-mono uppercase tracking-[0.3em] flex items-center gap-3">
                    <Bot className="w-3.5 h-3.5" /> Agent Designation
                  </label>
                  <input 
                    required
                    type="text" 
                    placeholder="ALPHA_TERMINAL_01"
                    value={formData.agentName}
                    onChange={(e) => setFormData({...formData, agentName: e.target.value})}
                    className="w-full bg-white/5 border border-white/5 rounded-2xl px-6 py-5 text-white focus:outline-none focus:border-white/20 transition-all font-mono text-xs placeholder:text-zinc-800 tracking-widest uppercase"
                  />
                </div>

                <div className="space-y-4">
                  <label className="text-[10px] text-zinc-500 font-mono uppercase tracking-[0.3em] flex items-center gap-3">
                    <ShieldCheck className="w-3.5 h-3.5" /> aGDP Role
                  </label>
                  <select 
                    value={formData.agentRole}
                    onChange={(e) => setFormData({...formData, agentRole: e.target.value})}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-5 text-white focus:outline-none focus:border-white/20 transition-all appearance-none font-mono text-xs tracking-widest uppercase"
                  >
                    <option value="trading">JIT Liquidity Provision</option>
                    <option value="oracle">A2A Data Provider</option>
                    <option value="treasury">Autonomous Treasury Manager</option>
                  </select>
                </div>

                <button 
                  type="submit" 
                  className="w-full bg-white text-black hover:bg-zinc-200 rounded-full py-6 font-mono text-[10px] uppercase tracking-[0.3em] transition-all duration-500 flex items-center justify-center gap-4"
                >
                  Continue <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </form>
            )}

            {step === 2 && (
              <form onSubmit={handleSubmit} className="space-y-10 animate-in fade-in slide-in-from-right-8 duration-1000">
                <div className="space-y-4">
                  <label className="text-[10px] text-zinc-500 font-mono uppercase tracking-[0.3em] flex items-center gap-3">
                    <Wallet className="w-3.5 h-3.5" /> Solana Settlement Address
                  </label>
                  <input 
                    required
                    type="text" 
                    placeholder="7nxB...4vP9"
                    value={formData.walletAddress}
                    onChange={(e) => setFormData({...formData, walletAddress: e.target.value})}
                    className="w-full bg-white/5 border border-white/5 rounded-2xl px-6 py-5 text-white focus:outline-none focus:border-white/20 transition-all font-mono text-xs placeholder:text-zinc-800 tracking-widest uppercase"
                  />
                </div>

                <div className="bg-white/5 p-6 rounded-2xl flex gap-6 border border-white/5">
                  <ShieldCheck className="w-4 h-4 text-zinc-600 shrink-0 mt-0.5" />
                  <p className="text-[9px] text-zinc-600 uppercase tracking-widest leading-relaxed">
                    MIND anchors Mindprint cNFTs to your agent to verify institutional policy compliance and A2A governance.
                  </p>
                </div>

                <div className="flex gap-4">
                  <button 
                    type="button" 
                    onClick={() => setStep(1)} 
                    className="w-1/3 rounded-full py-6 border border-white/5 hover:bg-white/5 font-mono text-[10px] uppercase tracking-[0.3em] text-zinc-500 hover:text-white transition-all duration-500"
                  >
                    Back
                  </button>
                  <button 
                    type="submit" 
                    className="w-2/3 bg-white text-black hover:bg-zinc-200 rounded-full py-6 font-mono text-[10px] uppercase tracking-[0.3em] transition-all duration-500"
                  >
                    Initialize Rails
                  </button>
                </div>
              </form>
            )}

            {step === 3 && (
              <div className="text-center py-12 animate-in zoom-in-95 duration-1000 space-y-10">
                <MindprintVisual seed={agentId} />
                
                <div className="space-y-4">
                  <h3 className="text-xl font-bold text-white uppercase tracking-[0.2em] font-mono flex items-center justify-center gap-3">
                    <Sparkles className="w-4 h-4" /> Identity Anchored
                  </h3>
                  <p className="text-zinc-600 text-[10px] uppercase tracking-widest font-mono">Mindprint cNFT successfully minted on Solana. KMS protected.</p>
                </div>
                
                <div className="bg-white/5 rounded-2xl p-8 text-left font-mono text-[9px] text-zinc-500 space-y-3 border border-white/5 tracking-[0.2em]">
                  <p className="flex justify-between border-b border-white/5 pb-3"><span className="text-zinc-800">AGENT ID</span> <span className="text-zinc-400">{agentId}</span></p>
                  <p className="flex justify-between border-b border-white/5 pb-3"><span className="text-zinc-800">RAILS</span> <span className="text-zinc-300">X402_ATOMIC_SETTLEMENT</span></p>
                  <p className="flex justify-between"><span className="text-zinc-800">NETWORK</span> <span className="text-zinc-400">SOLANA_MAINNET</span></p>
                </div>

                <button 
                  onClick={() => window.open('https://t.me/Mind_Agent_Protocol_bot?start=connect', '_blank')}
                  className="w-full bg-white text-black hover:bg-zinc-200 rounded-full py-6 font-mono text-[10px] uppercase tracking-[0.3em] transition-all duration-500"
                >
                  Enter Terminal
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
