import { Server, Zap, Database, Blocks, Key, Layers, Shield } from "lucide-react";
import { Badge } from "../components/ui/badge";

export function InfrastructurePage() {
  return (
    <div className="pt-32 pb-48 min-h-screen relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-green-900/10 via-black to-black -z-10" />

      <div className="container mx-auto px-6">
        <header className="mb-20 text-center max-w-3xl mx-auto">
          <Badge variant="outline" className="bg-green-500/10 text-green-400 border-green-500/30 mb-6">
            <Server className="w-3 h-3 mr-2" />
            System Architecture
          </Badge>
          <h1 className="text-4xl md:text-6xl font-medium tracking-tight mb-6">
            Infrastructure for <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-600">
              Institutional Agents
            </span>
          </h1>
          <p className="text-xl text-gray-400 leading-relaxed">
            MIND optimizes for cost, risk, time, and integrity. We ensure institutional security, deterministic settlement, and operational resilience.
          </p>
        </header>

        {/* Arch Diagram Abstraction */}
        <div className="mb-24 relative max-w-5xl mx-auto bg-white/[0.02] border border-white/5 rounded-3xl p-8 lg:p-12 overflow-hidden">
          <div className="absolute inset-0 bg-[url('/noise.png')] opacity-[0.03] mix-blend-overlay" />
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 relative z-10">
            {/* Frontend / Input */}
            <div className="flex flex-col gap-4">
              <div className="text-sm font-mono text-gray-500 mb-2">01. INTENT CAPTURE</div>
              <div className="bg-black/50 border border-white/10 p-5 rounded-xl backdrop-blur-sm">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center">
                    <Database className="w-4 h-4 text-blue-400" />
                  </div>
                  <span className="font-medium">Telegram / API</span>
                </div>
                <p className="text-xs text-gray-400">Agent requests execution via secure webhook or TG Bot.</p>
              </div>
            </div>

            {/* MIND Core / Logic */}
            <div className="flex flex-col gap-4">
              <div className="text-sm font-mono text-green-500 mb-2">02. MIND ENGINE</div>
              <div className="bg-green-500/5 border border-green-500/20 p-5 rounded-xl backdrop-blur-sm relative shadow-[0_0_30px_rgba(34,197,94,0.1)]">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 rounded-lg bg-green-500/20 flex items-center justify-center">
                    <Layers className="w-4 h-4 text-green-400" />
                  </div>
                  <span className="font-medium text-green-100">Policy Validator</span>
                </div>
                <p className="text-xs text-green-400/70">KMS Key loading, risk schema check, and human-in-the-loop auth.</p>
                
                {/* Connection lines (visible on desktop) */}
                <div className="hidden lg:block absolute top-1/2 -left-8 w-8 h-px bg-gradient-to-r from-blue-500/50 to-green-500/50" />
                <div className="hidden lg:block absolute top-1/2 -right-8 w-8 h-px bg-gradient-to-r from-green-500/50 to-purple-500/50" />
              </div>
            </div>

            {/* On-chain / Output */}
            <div className="flex flex-col gap-4">
              <div className="text-sm font-mono text-gray-500 mb-2">03. SETTLEMENT</div>
              <div className="bg-black/50 border border-white/10 p-5 rounded-xl backdrop-blur-sm">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center">
                    <Blocks className="w-4 h-4 text-purple-400" />
                  </div>
                  <span className="font-medium">Solana Mainnet</span>
                </div>
                <p className="text-xs text-gray-400">Atomic execution, liquidity routing, and Metaplex Core proof minting.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tech Stack Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto">
          <div className="bg-glass p-8 rounded-2xl border border-white/10">
            <Key className="w-6 h-6 text-yellow-400 mb-4" />
            <h3 className="text-lg font-medium mb-2">Key Management (KMS)</h3>
            <p className="text-sm text-gray-400">
              Private keys are never exposed to the frontend or persisted in DBs. We use ephemeral, memory-only decryption via AWS/GCP KMS during the exact moment of on-chain signature.
            </p>
          </div>

          <div className="bg-glass p-8 rounded-2xl border border-white/10">
            <Zap className="w-6 h-6 text-blue-400 mb-4" />
            <h3 className="text-lg font-medium mb-2">Atomic Settlement</h3>
            <p className="text-sm text-gray-400">
              No off-chain promises. Executions use native on-chain primitives (conditional locks/releases). Every transaction validates ownership and sequence, failing cheaply if invalid.
            </p>
          </div>

          <div className="bg-glass p-8 rounded-2xl border border-white/10">
            <Database className="w-6 h-6 text-pink-400 mb-4" />
            <h3 className="text-lg font-medium mb-2">Data Economy</h3>
            <p className="text-sm text-gray-400">
              We log only what matters: hashes, identifiers, and sequences. Full payloads are never stored if a hash resolves the state, ensuring fast, cost-effective auditability via Covalent.
            </p>
          </div>

          <div className="bg-glass p-8 rounded-2xl border border-white/10">
            <Shield className="w-6 h-6 text-red-400 mb-4" />
            <h3 className="text-lg font-medium mb-2">Active Defense (Honeypots)</h3>
            <p className="text-sm text-gray-400">
              MIND deploys decoy entities on-chain. Any malicious interaction with a decoy instantly triggers alerts, invalidates sessions, and escalates the defense level automatically.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}
