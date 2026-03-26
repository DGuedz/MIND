import { ShieldCheck, Network, LockKeyhole, Cpu, ArrowRightLeft, FileDigit } from "lucide-react";
import { Badge } from "../components/ui/badge";

export function FeaturesPage() {
  return (
    <div className="pt-32 pb-48 min-h-screen relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,_var(--tw-gradient-stops))] from-purple-900/10 via-black to-black -z-10" />

      <div className="container mx-auto px-6">
        <header className="mb-20 max-w-3xl">
          <Badge variant="outline" className="bg-purple-500/10 text-purple-400 border-purple-500/30 mb-6">
            Agent Capabilities
          </Badge>
          <h1 className="text-4xl md:text-6xl font-medium tracking-tight mb-6">
            Designed for <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-fuchsia-500">Autonomy</span>
          </h1>
          <p className="text-xl text-gray-400 leading-relaxed">
            MIND isn't just an interface, it's a protocol. We provide the primitive building blocks for Agents to transact, verify, and operate securely on-chain.
          </p>
        </header>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          
          <div className="bg-glass p-8 rounded-3xl border border-white/10 hover:bg-white/5 transition-all group">
            <div className="w-12 h-12 rounded-2xl bg-purple-500/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <Network className="w-6 h-6 text-purple-400" />
            </div>
            <h3 className="text-xl font-medium mb-3 text-white">A2A Micropayments (x402)</h3>
            <p className="text-gray-400 text-sm leading-relaxed">
              Native integration with Solana's x402 standards. Agents can pay other agents for API calls, data scraping, or specialized compute with zero human intervention.
            </p>
          </div>

          <div className="bg-glass p-8 rounded-3xl border border-white/10 hover:bg-white/5 transition-all group">
            <div className="w-12 h-12 rounded-2xl bg-blue-500/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <ShieldCheck className="w-6 h-6 text-blue-400" />
            </div>
            <h3 className="text-xl font-medium mb-3 text-white">Intent Validation Firewall</h3>
            <p className="text-gray-400 text-sm leading-relaxed">
              Strict schema checks before execution. If an agent tries to move funds outside whitelisted parameters (e.g. &gt; 5% drawdown), the transaction is atomically blocked.
            </p>
          </div>

          <div className="bg-glass p-8 rounded-3xl border border-white/10 hover:bg-white/5 transition-all group">
            <div className="w-12 h-12 rounded-2xl bg-green-500/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <LockKeyhole className="w-6 h-6 text-green-400" />
            </div>
            <h3 className="text-xl font-medium mb-3 text-white">ZK Compressed State</h3>
            <p className="text-gray-400 text-sm leading-relaxed">
              MIND acts as an on-chain private computer. By using ZK commitments and nullifiers, intents are shielded from public orderbooks, eliminating MEV predators and front-running bots to preserve your maximum edge.
            </p>
          </div>

          <div className="bg-glass p-8 rounded-3xl border border-white/10 hover:bg-white/5 transition-all group">
            <div className="w-12 h-12 rounded-2xl bg-orange-500/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <FileDigit className="w-6 h-6 text-orange-400" />
            </div>
            <h3 className="text-xl font-medium mb-3 text-white">Human-in-the-Loop (HITL)</h3>
            <p className="text-gray-400 text-sm leading-relaxed">
              Telegram-based approval flows. Set thresholds where your agent must ping you on TG with "Approve $5k Arb Trade?" before finalizing the on-chain signature.
            </p>
          </div>

          <div className="bg-glass p-8 rounded-3xl border border-white/10 hover:bg-white/5 transition-all group">
            <div className="w-12 h-12 rounded-2xl bg-pink-500/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <Cpu className="w-6 h-6 text-pink-400" />
            </div>
            <h3 className="text-xl font-medium mb-3 text-white">On-chain Execution Proofs</h3>
            <p className="text-gray-400 text-sm leading-relaxed">
              Powered by Metaplex Core. Every significant agent action mints an immutable, cheap NFT proof containing the intent hash, providing a permanent audit trail.
            </p>
          </div>

          <div className="bg-glass p-8 rounded-3xl border border-white/10 hover:bg-white/5 transition-all group">
            <div className="w-12 h-12 rounded-2xl bg-cyan-500/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <ArrowRightLeft className="w-6 h-6 text-cyan-400" />
            </div>
            <h3 className="text-xl font-medium mb-3 text-white">Yield & Capital Allocation</h3>
            <p className="text-gray-400 text-sm leading-relaxed">
              Idle agent capital doesn't just sit. Opt-in modules allow agents to route unused USDC to safe, blue-chip DeFi vaults, earning yield while awaiting intents.
            </p>
          </div>

          <div className="bg-glass p-8 rounded-3xl border border-white/10 hover:bg-white/5 transition-all group relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4">
              <span className="flex h-3 w-3 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-cyan-500"></span>
              </span>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-cyan-500/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <ArrowRightLeft className="w-6 h-6 text-cyan-400" />
            </div>
            <h3 className="text-xl font-medium mb-3 text-white">Decentralized Delegation</h3>
            <p className="text-gray-400 text-sm leading-relaxed">
              Your agent can securely hire other agents. Need data analysis before a trade? Your agent delegates 0.5 SOL to a specialized data agent, atomically settled.
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}
