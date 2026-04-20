import { ShieldCheck, Network, LockKeyhole, Cpu, ArrowRightLeft, FileDigit } from "lucide-react";
import { Badge } from "../components/ui/badge";

export function FeaturesPage() {
  return (
    <div className="container mx-auto px-6 pt-48 pb-32 space-y-32">
      <header className="space-y-8 border-b border-white/20 pb-16">
        <Badge variant="outline" className="border-zinc-800 text-zinc-500 font-mono uppercase text-[9px] tracking-[0.3em] px-4 py-1">
          Agent Capabilities
        </Badge>
        <h1 className="text-5xl md:text-7xl font-bold text-white tracking-tight leading-[0.9]">
          Designed for <br />
          <span className="italic font-light opacity-60 text-zinc-400">Autonomy.</span>
        </h1>
        <p className="text-xl text-zinc-500 leading-relaxed max-w-2xl font-light">
          MIND is strictly an agnostic orchestration infrastructure. We do not build bots; we build the invisible backend that makes them autonomous and institutional.
        </p>
      </header>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {[
          { icon: Network, title: "A2A Settlement", desc: "Native integration with x402 standards. Agents pay other agents for sub-tasks, API calls, or data with zero human intervention." },
          { icon: ShieldCheck, title: "Programmatic Guardrails", desc: "Strict policy schema checks before execution. Capital safety is prioritized over speed through verifiable rules." },
          { icon: LockKeyhole, title: "Zero-Trust KMS", desc: "Institutional-grade key management via Turnkey. Private keys are never exposed, only enforced through cryptographic policies." },
          { icon: FileDigit, title: "Deterministic Revenue", desc: "The Invisible Toll. MIND automates the 92/8 revenue distribution between developers and the protocol rails." },
          { icon: Cpu, title: "Agentic Settlement Log", desc: "Every action emits hash-linked proof artifacts. Verify intent, policy compliance, and execution history on-chain." },
          { icon: ArrowRightLeft, title: "JIT Liquidity Pools", desc: "The execution lane for the agent economy. Seamlessly move value between agents with sub-second latency on Solana." }
        ].map((item, i) => (
          <div key={i} className="bg-white/[0.02] border border-white/20 p-10 rounded-[2.5rem] group hover:border-white/30 transition-all duration-700">
            <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/20 flex items-center justify-center mb-8 group-hover:scale-110 transition-transform duration-500">
              <item.icon className="w-5 h-5 text-zinc-600 group-hover:text-zinc-400 transition-colors" />
            </div>
            <h3 className="text-white font-medium tracking-widest uppercase text-[10px] font-mono mb-4">{item.title}</h3>
            <p className="text-zinc-500 text-sm leading-relaxed font-light">
              {item.desc}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
