import { useState } from "react";
import { Bot, ShieldCheck, Wallet, ArrowRight, CheckCircle2 } from "lucide-react";
import { Button } from "../components/ui/button";

export function RegisterPage() {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    agentName: "",
    walletAddress: "",
    agentRole: "trading",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Simulate backend registration
    setStep(3);
  };

  return (
    <div className="min-h-screen pt-32 pb-16 px-6 flex items-center justify-center relative">
      {/* Background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-500/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-medium tracking-tight mb-3">Initialize Agent</h1>
          <p className="text-gray-400">Securely onboard your agent to the A2A Dark Pools.</p>
        </div>

        <div className="bg-white/[0.02] border border-white/10 p-8 rounded-3xl backdrop-blur-md">
          {/* Progress Bar */}
          <div className="flex items-center justify-between mb-8 relative">
            <div className="absolute top-1/2 left-0 right-0 h-px bg-white/10 -translate-y-1/2 z-0" />
            {[1, 2, 3].map((num) => (
              <div 
                key={num}
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium relative z-10 transition-colors ${
                  step >= num ? "bg-blue-500 text-white" : "bg-black border border-white/20 text-gray-500"
                }`}
              >
                {step > num ? <CheckCircle2 className="w-4 h-4" /> : num}
              </div>
            ))}
          </div>

          {step === 1 && (
            <form onSubmit={() => setStep(2)} className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
              <div className="space-y-2">
                <label className="text-sm text-gray-400 font-medium flex items-center gap-2">
                  <Bot className="w-4 h-4" /> Agent Designation
                </label>
                <input 
                  required
                  type="text" 
                  placeholder="e.g. SolClaw_Alpha"
                  value={formData.agentName}
                  onChange={(e) => setFormData({...formData, agentName: e.target.value})}
                  className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm text-gray-400 font-medium flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4" /> Primary Role
                </label>
                <select 
                  value={formData.agentRole}
                  onChange={(e) => setFormData({...formData, agentRole: e.target.value})}
                  className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors appearance-none"
                >
                  <option value="trading">Trading & Arbitrage</option>
                  <option value="oracle">Data Oracle (A2A Provider)</option>
                  <option value="treasury">Treasury Vault Manager</option>
                </select>
              </div>

              <Button type="submit" className="w-full bg-white text-black hover:bg-gray-200 rounded-xl py-6 font-medium">
                Continue <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </form>
          )}

          {step === 2 && (
            <form onSubmit={handleSubmit} className="space-y-6 animate-in fade-in slide-in-from-right-4">
              <div className="space-y-2">
                <label className="text-sm text-gray-400 font-medium flex items-center gap-2">
                  <Wallet className="w-4 h-4" /> Solana Treasury Wallet
                </label>
                <p className="text-xs text-gray-500 mb-2">This is the public address where the agent will receive funds and execute proofs via Metaplex.</p>
                <input 
                  required
                  type="text" 
                  placeholder="Paste Solana Address (e.g. 7nxB...4vP9)"
                  value={formData.walletAddress}
                  onChange={(e) => setFormData({...formData, walletAddress: e.target.value})}
                  className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors font-mono text-sm"
                />
              </div>

              <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 flex gap-3">
                <ShieldCheck className="w-5 h-5 text-blue-400 shrink-0" />
                <p className="text-xs text-blue-200/80 leading-relaxed">
                  By connecting this wallet, MIND will deploy ZK Compressed State notes to shield your transactions from MEV bots and public orderbooks.
                </p>
              </div>

              <div className="flex gap-3">
                <Button type="button" variant="outline" onClick={() => setStep(1)} className="w-1/3 rounded-xl py-6 border-white/10 hover:bg-white/5">
                  Back
                </Button>
                <Button type="submit" className="w-2/3 bg-blue-600 text-white hover:bg-blue-500 rounded-xl py-6 font-medium">
                  Deploy On-Chain
                </Button>
              </div>
            </form>
          )}

          {step === 3 && (
            <div className="text-center py-8 animate-in zoom-in-95 space-y-4">
              <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-6">
                <CheckCircle2 className="w-8 h-8 text-green-400" />
              </div>
              <h3 className="text-xl font-medium text-white">Agent Registered</h3>
              <p className="text-gray-400 text-sm">
                Identity minted via Metaplex. Your agent is now ready for A2A execution.
              </p>
              
              <div className="bg-black/50 rounded-xl p-4 mt-6 border border-white/5 text-left font-mono text-xs text-gray-300">
                <p><span className="text-gray-500">ID:</span> mind_ag_{Math.random().toString(36).substr(2, 6)}</p>
                <p className="mt-1"><span className="text-gray-500">Status:</span> SECURE_POOL_ACTIVE</p>
              </div>

              <Button 
                onClick={() => window.open('https://t.me/Mind_Agent_Protocol_bot?start=connect', '_blank')}
                className="w-full bg-white text-black hover:bg-gray-200 rounded-xl py-6 mt-6 font-medium"
              >
                Open Telegram Bot
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}