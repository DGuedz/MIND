import { Zap, Database, Key, Shield, Network, ShieldCheck } from "lucide-react";
import { Badge } from "../components/ui/badge";
import { motion, useMotionValue, useTransform } from "framer-motion";
import { useState } from "react";

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

export function InfrastructurePage() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.8 } }
  };

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

  return (
    <div className="container mx-auto px-6 pt-48 pb-32 space-y-32">
      <motion.header 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="space-y-8 border-b border-white/20 pb-16 flex flex-col items-center text-center"
      >
        <Badge variant="outline" className="border-zinc-800 text-zinc-500 font-mono uppercase text-[10px] tracking-[0.3em] px-4 py-1.5 bg-black/50 backdrop-blur-sm w-fit">
          System Architecture
        </Badge>
        <h1 className="text-5xl md:text-7xl font-bold tracking-tight leading-tight md:leading-[1.1] text-white font-mono uppercase">
          <MetallicText>Infrastructure for</MetallicText> <br />
          <MetallicText className="italic font-medium text-zinc-300 text-4xl md:text-6xl lg:text-7xl drop-shadow-2xl">Autonomous Agents.</MetallicText>
        </h1>
        <p className="text-lg md:text-xl text-zinc-400 leading-relaxed max-w-2xl font-light text-center">
          The invisible toll for the Agentic Economy. We provide deterministic rails for A2A coordination, atomic settlement (x402), and Zero-Trust KMS security.
        </p>
      </motion.header>

      {/* Arch Diagram Abstraction */}
      <motion.section 
        initial={{ opacity: 0, scale: 0.98 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 1 }}
        className="bg-black/40 backdrop-blur-md rounded-[3rem] relative overflow-hidden group transition-all duration-500 cursor-crosshair ring-1 ring-white/10 hover:ring-white/20"
        style={{ 
          perspective: "1200px",
          transformStyle: "preserve-3d",
          transform: isHovered 
            ? `rotateX(${(mousePos.y - 300) * -0.02}deg) rotateY(${(mousePos.x - 600) * 0.02}deg)` 
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

        <div 
          className="grid grid-cols-1 lg:grid-cols-3 gap-12 relative z-10 p-12 lg:p-20 transition-transform duration-300 ease-out"
          style={{ transform: isHovered ? "translateZ(30px)" : "translateZ(0px)" }}
        >
          {/* Frontend / Input */}
          <div 
            className="space-y-8 transition-transform duration-300"
            style={{ transform: isHovered ? "translateZ(20px)" : "translateZ(0px)" }}
          >
            <div className="text-[10px] font-mono text-zinc-700 uppercase tracking-[0.3em]">01. A2A Coordination</div>
            <div className="bg-white/5 border border-white/10 rounded-2xl p-8 backdrop-blur-sm shadow-[0_8px_30px_-10px_rgba(0,0,0,0.5)]">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/20 flex items-center justify-center shadow-inner">
                  <Network className="w-4 h-4 text-zinc-400" />
                </div>
                <span className="text-xs font-mono uppercase tracking-widest text-zinc-300">Intent Layer</span>
              </div>
              <p className="text-[11px] text-zinc-500 leading-relaxed font-mono uppercase tracking-widest">Agnostic orchestration for autonomous agents to interact and transact.</p>
            </div>
          </div>

          {/* MIND Core / Logic */}
          <div 
            className="space-y-8 transition-transform duration-300"
            style={{ transform: isHovered ? "translateZ(40px)" : "translateZ(0px)" }}
          >
            <div className="text-[10px] font-mono text-white/40 uppercase tracking-[0.3em]">02. Zero-Trust KMS</div>
            <div className="bg-zinc-900/80 border border-white/20 rounded-2xl p-8 backdrop-blur-md relative shadow-[0_0_30px_rgba(255,255,255,0.05)] ring-1 ring-white/5">
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-transparent rounded-2xl pointer-events-none" />
              <div className="flex items-center gap-4 mb-6 relative z-10">
                <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/30 flex items-center justify-center shadow-[0_0_15px_rgba(255,255,255,0.1)]">
                  <ShieldCheck className="w-4 h-4 text-white opacity-90" />
                </div>
                <span className="text-xs font-mono uppercase tracking-widest text-white drop-shadow-md">Policy Enforcer</span>
              </div>
              <p className="text-[11px] text-zinc-400 leading-relaxed font-mono uppercase tracking-widest relative z-10">Turnkey integration ensures keys are never exposed. Strict policy-gated execution.</p>
            </div>
          </div>

          {/* On-chain / Output */}
          <div 
            className="space-y-8 transition-transform duration-300"
            style={{ transform: isHovered ? "translateZ(20px)" : "translateZ(0px)" }}
          >
            <div className="text-[10px] font-mono text-zinc-700 uppercase tracking-[0.3em]">03. Atomic Settlement</div>
            <div className="bg-white/5 border border-white/10 rounded-2xl p-8 backdrop-blur-sm shadow-[0_8px_30px_-10px_rgba(0,0,0,0.5)]">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/20 flex items-center justify-center shadow-inner">
                  <Zap className="w-4 h-4 text-zinc-400" />
                </div>
                <span className="text-xs font-mono uppercase tracking-widest text-zinc-300">x402 Protocol</span>
              </div>
              <p className="text-[11px] text-zinc-500 leading-relaxed font-mono uppercase tracking-widest">Real-time liquidation on Solana. Deterministic 92/8 revenue distribution.</p>
            </div>
          </div>
        </div>
      </motion.section>

      {/* Tech Stack Grid */}
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
        className="grid grid-cols-1 md:grid-cols-2 gap-8"
      >
        {[
          { title: "Key Management (KMS)", desc: "Signing is isolated in Zero-Trust KMS (Turnkey) and policy checks run before requests are finalized.", icon: Key },
          { title: "Atomic Settlement", desc: "Native on-chain primitives (x402). Every transaction validates ownership and sequence autonomously.", icon: Zap },
          { title: "Data Economy", desc: "We persist hash-linked artifacts for auditability: intent records, execution events, and proof anchors.", icon: Database },
          { title: "Active Defense", desc: "Defense modules are integrated into the execution rail. Zero-Emoji policy enforced for institutional grade.", icon: Shield }
        ].map((item, i) => (
          <motion.div 
            key={i} 
            variants={itemVariants} 
            className="bg-black/40 backdrop-blur-md border border-white/10 hover:border-white/30 p-12 rounded-[2.5rem] group transition-all duration-700 hover:-translate-y-2 hover:shadow-[0_20px_50px_-15px_rgba(255,255,255,0.05)] relative overflow-hidden"
          >
            {/* Hover Glow Background */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
            
            <div className="relative z-10">
              <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/20 flex items-center justify-center mb-8 group-hover:scale-110 transition-transform duration-500 shadow-inner">
                <item.icon className="w-5 h-5 text-zinc-600 group-hover:text-white transition-colors" />
              </div>
              <h3 className="text-white font-medium tracking-widest uppercase text-[10px] font-mono mb-4 drop-shadow-sm">{item.title}</h3>
              <p className="text-zinc-500 text-sm leading-relaxed font-light group-hover:text-zinc-400 transition-colors">
                {item.desc}
              </p>
            </div>
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}
