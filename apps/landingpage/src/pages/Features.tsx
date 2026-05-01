import { ShieldCheck, Network, LockKeyhole, Cpu, ArrowRightLeft, FileDigit } from "lucide-react";
import { Badge } from "../components/ui/badge";
import { motion, useMotionValue, useTransform } from "framer-motion";

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

export function FeaturesPage() {
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

  return (
    <div className="container mx-auto px-6 pt-48 pb-32 space-y-32">
      <motion.header 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="space-y-8 border-b border-white/20 pb-16 flex flex-col items-center text-center"
      >
        <Badge variant="outline" className="border-zinc-800 text-zinc-500 font-mono uppercase text-[10px] tracking-[0.3em] px-4 py-1.5 bg-black/50 backdrop-blur-sm w-fit">
          Agent Capabilities
        </Badge>
        <h1 className="text-5xl md:text-7xl font-bold tracking-tight leading-tight md:leading-[1.1] text-white font-mono uppercase">
          <MetallicText>Designed for</MetallicText> <br />
          <MetallicText className="italic font-medium text-zinc-300 text-4xl md:text-6xl lg:text-7xl drop-shadow-2xl">Autonomy.</MetallicText>
        </h1>
        <p className="text-lg md:text-xl text-zinc-400 leading-relaxed max-w-2xl font-light text-center">
          MIND is strictly an agnostic orchestration infrastructure. We do not build bots; we build the invisible backend that makes them autonomous and institutional.
        </p>
      </motion.header>
      
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
      >
        {[
          { icon: Network, title: "A2A Settlement", desc: "Native integration with x402 standards. Agents pay other agents for sub-tasks, API calls, or data with zero human intervention." },
          { icon: ShieldCheck, title: "Programmatic Guardrails", desc: "Strict policy schema checks before execution. Capital safety is prioritized over speed through verifiable rules." },
          { icon: LockKeyhole, title: "Zero-Trust KMS", desc: "Institutional-grade key management via Turnkey. Private keys are never exposed, only enforced through cryptographic policies." },
          { icon: FileDigit, title: "Deterministic Revenue", desc: "The Invisible Toll. MIND automates the 92/8 revenue distribution between developers and the protocol rails." },
          { icon: Cpu, title: "Agentic Settlement Log", desc: "Every action emits hash-linked proof artifacts. Verify intent, policy compliance, and execution history on-chain." },
          { icon: ArrowRightLeft, title: "JIT Liquidity Pools", desc: "The execution lane for the agent economy. Seamlessly move value between agents with sub-second latency on Solana." }
        ].map((item, i) => (
          <motion.div key={i} variants={itemVariants} className="metallic-brushed-solana metallic-shine backdrop-blur-md p-10 rounded-[2.5rem] group transition-all duration-700 relative overflow-hidden">
            {/* Hover Glow Background - Optional extra shine */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />

            <div className="relative z-10">
              <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/20 flex items-center justify-center mb-8 group-hover:scale-110 transition-transform duration-500 shadow-inner">
                <item.icon className="w-5 h-5 text-zinc-400 group-hover:text-white transition-colors" />
              </div>
              <h3 className="text-white font-medium tracking-widest uppercase text-[10px] font-mono mb-4 drop-shadow-sm">{item.title}</h3>
              <p className="text-zinc-500 group-hover:text-zinc-400 text-sm leading-relaxed font-light transition-colors duration-500">
                {item.desc}
              </p>
            </div>
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}
