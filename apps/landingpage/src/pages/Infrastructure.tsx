import { Zap, Database, Key, Shield, Network, ShieldCheck } from "lucide-react";
import { Badge } from "../components/ui/badge";

export function InfrastructurePage() {
  return (
    <div className="container mx-auto px-6 pt-48 pb-32 space-y-32">
      <header className="space-y-8 border-b border-white/5 pb-16">
        <Badge variant="outline" className="border-zinc-800 text-zinc-500 font-mono uppercase text-[9px] tracking-[0.3em] px-4 py-1">
          System Architecture
        </Badge>
        <h1 className="text-5xl md:text-7xl font-bold text-white tracking-tight leading-[0.9]">
          Infrastructure for <br />
          <span className="italic font-light opacity-60 text-zinc-400">Autonomous Agents.</span>
        </h1>
        <p className="text-xl text-zinc-500 leading-relaxed max-w-2xl font-light">
          The invisible toll for the Agentic Economy. We provide deterministic rails for A2A coordination, atomic settlement (x402), and Zero-Trust KMS security.
        </p>
      </header>

      {/* Arch Diagram Abstraction */}
      <section className="bg-white/[0.02] border border-white/5 p-12 lg:p-20 rounded-[3rem] relative overflow-hidden group">
        <div className="absolute inset-0 bg-gradient-to-br from-zinc-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 relative z-10">
          {/* Frontend / Input */}
          <div className="space-y-8">
            <div className="text-[10px] font-mono text-zinc-700 uppercase tracking-[0.3em]">01. A2A Coordination</div>
            <div className="bg-white/5 border border-white/10 rounded-2xl p-8 backdrop-blur-sm">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center">
                  <Network className="w-4 h-4 text-zinc-500" />
                </div>
                <span className="text-xs font-mono uppercase tracking-widest text-zinc-300">Intent Layer</span>
              </div>
              <p className="text-[11px] text-zinc-500 leading-relaxed font-mono uppercase tracking-widest">Agnostic orchestration for autonomous agents to interact and transact.</p>
            </div>
          </div>

          {/* MIND Core / Logic */}
          <div className="space-y-8">
            <div className="text-[10px] font-mono text-zinc-500 uppercase tracking-[0.3em]">02. Zero-Trust KMS</div>
            <div className="bg-white/10 border border-white/20 rounded-2xl p-8 backdrop-blur-sm relative shadow-[0_0_50px_rgba(255,255,255,0.02)]">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/10 flex items-center justify-center">
                  <ShieldCheck className="w-4 h-4 text-white opacity-80" />
                </div>
                <span className="text-xs font-mono uppercase tracking-widest text-white">Policy Enforcer</span>
              </div>
              <p className="text-[11px] text-zinc-400 leading-relaxed font-mono uppercase tracking-widest">Turnkey integration ensures keys are never exposed. Strict policy-gated execution.</p>
            </div>
          </div>

          {/* On-chain / Output */}
          <div className="space-y-8">
            <div className="text-[10px] font-mono text-zinc-700 uppercase tracking-[0.3em]">03. Atomic Settlement</div>
            <div className="bg-white/5 border border-white/10 rounded-2xl p-8 backdrop-blur-sm">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center">
                  <Zap className="w-4 h-4 text-zinc-500" />
                </div>
                <span className="text-xs font-mono uppercase tracking-widest text-zinc-300">x402 Protocol</span>
              </div>
              <p className="text-[11px] text-zinc-500 leading-relaxed font-mono uppercase tracking-widest">Real-time liquidation on Solana. Deterministic 92/8 revenue distribution.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Tech Stack Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {[
          { title: "Key Management (KMS)", desc: "Signing is isolated in Zero-Trust KMS (Turnkey) and policy checks run before requests are finalized.", icon: Key },
          { title: "Atomic Settlement", desc: "Native on-chain primitives (x402). Every transaction validates ownership and sequence autonomously.", icon: Zap },
          { title: "Data Economy", desc: "We persist hash-linked artifacts for auditability: intent records, execution events, and proof anchors.", icon: Database },
          { title: "Active Defense", desc: "Defense modules are integrated into the execution rail. Zero-Emoji policy enforced for institutional grade.", icon: Shield }
        ].map((item, i) => (
          <div key={i} className="bg-white/[0.02] border border-white/5 p-12 rounded-[2.5rem] group hover:border-white/10 transition-all duration-700">
            <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-center mb-8 group-hover:scale-110 transition-transform duration-500">
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
