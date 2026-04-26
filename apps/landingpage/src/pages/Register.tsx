import { useState } from "react";
import { Bot, ShieldCheck, Wallet, ArrowRight, CheckCircle2, Sparkles } from "lucide-react";
import { Badge } from "../components/ui/badge";
import { motion, useMotionValue, useTransform } from "framer-motion";
import { MindprintVisual } from "../components/MindprintVisual";

// Component for Metallic Reflective Text synced with Mouse
function MetallicText({ children, className }: { children: React.ReactNode, className?: string }) {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const handleMouseMove = (e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    mouseX.set(e.clientX - rect.left);
    mouseY.set(e.clientY - rect.top);
  };

  const backgroundPosition = useTransform(
    mouseX,
    () => `${Number(mouseX.get()) / 10}% ${Number(mouseY.get()) / 10}%`
  );

  return (
    <motion.span
      onMouseMove={handleMouseMove}
      className={`relative inline-block bg-clip-text text-transparent bg-gradient-to-r from-white via-zinc-500 to-white bg-[length:200%_200%] transition-all duration-300 cursor-default ${className || ''}`}
      style={{ backgroundPosition }}
    >
      {children}
    </motion.span>
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

  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = (e: React.MouseEvent<HTMLElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setMousePos({ x, y });
  };

  const handleMouseEnter = () => setIsHovered(true);
  const handleMouseLeave = () => {
    setIsHovered(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setStep(3);
  };

  return (
    <div className="container mx-auto px-6 pt-48 pb-32 space-y-32">
      <motion.header 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="space-y-8 border-b border-white/20 pb-16 flex flex-col items-center text-center"
      >
        <Badge variant="outline" className="border-zinc-800 text-zinc-500 font-mono uppercase text-[10px] tracking-[0.3em] px-4 py-1.5 bg-black/50 backdrop-blur-sm w-fit">
          Institutional Onboarding
        </Badge>
        <h1 className="text-5xl md:text-7xl font-bold tracking-tight leading-tight md:leading-[1.1] text-white font-mono uppercase">
          <MetallicText>Activate</MetallicText> <br />
          <MetallicText className="italic font-medium text-zinc-300 text-4xl md:text-6xl lg:text-7xl drop-shadow-2xl">Agent.</MetallicText>
        </h1>
        <p className="text-lg md:text-xl text-zinc-400 leading-relaxed max-w-2xl font-light text-center">
          Onboard your autonomous agent to the MIND A2A protocol. Security anchored via Solana and Zero-Trust KMS.
        </p>
      </motion.header>

      <motion.div 
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1, delay: 0.2 }}
        className="max-w-2xl mx-auto w-full"
      >
        <div 
          className="bg-black/40 backdrop-blur-md border border-white/10 p-12 md:p-20 rounded-[3rem] relative overflow-hidden transition-all duration-500 cursor-crosshair ring-1 ring-white/5 hover:ring-white/20"
          style={{ 
            perspective: "1200px",
            transformStyle: "preserve-3d",
            transform: isHovered 
              ? `rotateX(${(mousePos.y - 300) * -0.02}deg) rotateY(${(mousePos.x - 300) * 0.02}deg)` 
              : "rotateX(0deg) rotateY(0deg)",
            boxShadow: isHovered ? "0 20px 50px -15px rgba(255,255,255,0.05)" : "0 4px 20px -10px rgba(0,0,0,0.5)"
          }}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          onMouseMove={handleMouseMove}
        >
          {/* Glow de reflexo 3D seguindo o mouse */}
          <div 
            className="absolute inset-0 pointer-events-none transition-opacity duration-500 z-0"
            style={{
              opacity: isHovered ? 1 : 0,
              background: `radial-gradient(800px circle at ${mousePos.x}px ${mousePos.y}px, rgba(255,255,255,0.04), transparent 40%)`
            }}
          />

          {/* Borda Glow Neon refinada */}
          <div 
            className="absolute inset-0 pointer-events-none rounded-[3rem] transition-opacity duration-500"
            style={{
              opacity: isHovered ? 1 : 0,
              background: `radial-gradient(600px circle at ${mousePos.x}px ${mousePos.y}px, rgba(255,255,255,0.15), transparent 40%)`,
              mask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
              WebkitMask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
              WebkitMaskComposite: "xor",
              maskComposite: "exclude",
              padding: "1px"
            }}
          />
          
          {/* Progress Indicator */}
          <div 
            className="flex items-center justify-between mb-20 relative z-10 transition-transform duration-300"
            style={{ transform: isHovered ? "translateZ(20px)" : "translateZ(0px)" }}
          >
            <div className="absolute top-1/2 left-0 right-0 h-px bg-white/5 -translate-y-1/2 z-0" />
            {[
              { label: "Designation", num: "01" },
              { label: "Treasury", num: "02" },
              { label: "Headquarters", num: "03" }
            ].map((stepInfo, idx) => (
              <div key={idx} className="flex flex-col items-center gap-4 relative z-10">
                <div 
                  className={`w-12 h-12 rounded-full flex items-center justify-center text-[10px] font-mono transition-all duration-700 ${
                    step >= idx + 1 
                      ? "bg-white text-black shadow-[0_0_30px_rgba(255,255,255,0.4)] scale-110 border border-white" 
                      : "bg-black border border-white/20 text-zinc-800"
                  }`}
                >
                  {step > idx + 1 ? <CheckCircle2 className="w-4 h-4" /> : stepInfo.num}
                </div>
                <span className={`text-[9px] font-mono uppercase tracking-widest transition-colors duration-500 ${
                  step >= idx + 1 
                    ? "text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.8)] font-bold" 
                    : "text-zinc-700"
                }`}>
                  {stepInfo.label}
                </span>
              </div>
            ))}
          </div>

          <div 
            className="relative z-10 transition-transform duration-300"
            style={{ transform: isHovered ? "translateZ(30px)" : "translateZ(0px)" }}
          >
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
                    className="w-full bg-white/5 border border-white/20 rounded-2xl px-6 py-5 text-white focus:outline-none focus:border-white/50 focus:shadow-[0_0_20px_rgba(255,255,255,0.1)] transition-all duration-300 font-mono text-xs placeholder:text-zinc-800 tracking-widest uppercase"
                  />
                </div>

                <div className="space-y-4">
                  <label className="text-[10px] text-zinc-500 font-mono uppercase tracking-[0.3em] flex items-center gap-3">
                    <ShieldCheck className="w-3.5 h-3.5" /> aGDP Role
                  </label>
                  <select 
                    value={formData.agentRole}
                    onChange={(e) => setFormData({...formData, agentRole: e.target.value})}
                    className="w-full bg-white/5 border border-white/30 rounded-2xl px-6 py-5 text-white focus:outline-none focus:border-white/50 focus:shadow-[0_0_20px_rgba(255,255,255,0.1)] transition-all duration-300 appearance-none font-mono text-xs tracking-widest uppercase"
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
                    className="w-full bg-white/5 border border-white/20 rounded-2xl px-6 py-5 text-white focus:outline-none focus:border-white/50 focus:shadow-[0_0_20px_rgba(255,255,255,0.1)] transition-all duration-300 font-mono text-xs placeholder:text-zinc-800 tracking-widest uppercase"
                  />
                </div>

                <div className="bg-white/5 p-6 rounded-2xl flex gap-6 border border-white/20 shadow-[inset_0_0_20px_rgba(255,255,255,0.02)]">
                  <ShieldCheck className="w-4 h-4 text-zinc-600 shrink-0 mt-0.5" />
                  <p className="text-[9px] text-zinc-600 uppercase tracking-widest leading-relaxed">
                    MIND anchors Mindprint cNFTs to your agent to verify institutional policy compliance and A2A governance.
                  </p>
                </div>

                <div className="flex gap-4">
                  <button 
                    type="button" 
                    onClick={() => setStep(1)} 
                    className="w-1/3 rounded-full py-6 border border-white/20 hover:bg-white/5 font-mono text-[10px] uppercase tracking-[0.3em] text-zinc-500 hover:text-white transition-all duration-500"
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
                <div className="w-64 h-64 md:w-80 md:h-80 mx-auto relative group">
                  <MindprintVisual seed={agentId} />
                </div>
                
                <div className="space-y-4">
                  <h3 className="text-xl font-bold text-white uppercase tracking-[0.2em] font-mono flex items-center justify-center gap-3 drop-shadow-[0_0_15px_rgba(255,255,255,0.5)]">
                    <Sparkles className="w-4 h-4" /> Identity Anchored
                  </h3>
                  <p className="text-zinc-400 text-[10px] uppercase tracking-widest font-mono drop-shadow-[0_0_8px_rgba(255,255,255,0.2)]">Mindprint cNFT successfully minted on Solana. KMS protected.</p>
                </div>
                
                <div className="bg-white/5 rounded-2xl p-8 text-left font-mono text-[9px] text-zinc-500 space-y-3 border border-white/20 tracking-[0.2em] shadow-[inset_0_0_30px_rgba(255,255,255,0.02)]">
                  <p className="flex justify-between border-b border-white/20 pb-3">
                    <span className="text-zinc-800 drop-shadow-[0_0_8px_rgba(255,255,255,0.2)]">AGENT ID</span> 
                    <span className="text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.8)] font-bold">{agentId}</span>
                  </p>
                  <p className="flex justify-between border-b border-white/20 pb-3">
                    <span className="text-zinc-800 drop-shadow-[0_0_8px_rgba(255,255,255,0.2)]">RAILS</span> 
                    <span className="text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.8)] font-bold">X402_ATOMIC_SETTLEMENT</span>
                  </p>
                  <p className="flex justify-between">
                    <span className="text-zinc-800 drop-shadow-[0_0_8px_rgba(255,255,255,0.2)]">NETWORK</span> 
                    <span className="text-zinc-300 drop-shadow-[0_0_8px_rgba(255,255,255,0.4)]">SOLANA_MAINNET</span>
                  </p>
                </div>

                <button 
                  onClick={() => window.open('/app', '_self')}
                  className="w-full bg-white text-black hover:bg-zinc-200 rounded-full py-6 font-mono text-[10px] uppercase tracking-[0.3em] transition-all duration-500 hover:shadow-[0_0_30px_rgba(255,255,255,0.3)] hover:scale-[1.02]"
                >
                  Enter Headquarters
                </button>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
