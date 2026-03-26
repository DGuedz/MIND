import { useState, useEffect } from "react";
import { Shield, Lock, Terminal, Wallet, Loader2, EyeOff, KeyRound, Zap } from "lucide-react";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Connection, PublicKey, LAMPORTS_PER_SOL } from "@solana/web3.js";

export function AppPage() {
  const [intents, setIntents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [realBalance, setRealBalance] = useState<number | null>(null);

  useEffect(() => {
    // Busca o saldo real da sua wallet da Solana Mainnet (a mesma do Trojan)
    const fetchBalance = async () => {
      try {
        const connection = new Connection("https://api.mainnet-beta.solana.com", "confirmed");
        // A sua carteira pública (derivada da chave privada que usamos no script do Telegram)
        const walletAddress = new PublicKey("FHk1jqFwoVBudRSaNB9N4kKewyaS5k8hqc2ctm8Q1zah");
        const balance = await connection.getBalance(walletAddress);
        setRealBalance(balance / LAMPORTS_PER_SOL);
      } catch (error) {
        console.error("Erro ao buscar saldo real na Solana:", error);
      }
    };

    fetchBalance();

    const fetchIntents = async () => {
      try {
        // Since we are running the UI without the full microservices backend in this demo,
        // we'll just use the fallback intents directly to avoid the connection error.
        setIntents(fallbackIntents);
        setLoading(false);
      } catch (error) {
        console.error("Failed to fetch intents, using fallback data", error);
        setIntents(fallbackIntents);
        setLoading(false);
      }
    };

    fetchIntents();
  }, []);

  const handleKillSwitch = async () => {
    try {
      // Calls the API Gateway to halt agent execution
      await fetch("http://127.0.0.1:4000/v1/agent/halt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agentId: "SolClaw_Alpha", reason: "manual_override" })
      });
      alert("KILL SWITCH ACTIVATED: All agent intents halted.");
      // Refresh intents to show them as Blocked
      window.location.reload();
    } catch (error) {
      console.error("Kill switch failed:", error);
      alert("Failed to connect to API Gateway.");
    }
  };

  const fallbackIntents = [
    { action: "ZK Stealth Swap", status: "Executed", amount: "+$45.20", time: "2m ago", icon: EyeOff, color: "text-green-400" },
    { action: "A2A Oracle Payment", status: "Pending", amount: "-$0.50", time: "15m ago", icon: KeyRound, color: "text-yellow-400" },
    { action: "Shielded Vault Route", status: "Executed", amount: "~$1,200.00", time: "1h ago", icon: Shield, color: "text-blue-400" },
    { action: "Public DEX Trade", status: "Blocked (MEV Risk)", amount: "$5,000.00", time: "3h ago", icon: Lock, color: "text-red-400" },
  ];
  return (
    <div className="pt-24 md:pt-32 pb-32 md:pb-48 min-h-screen relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-900/20 via-black to-black -z-10" />
      
      <div className="container mx-auto px-4 sm:px-6">
        <header className="mb-12 md:mb-16">
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <Badge variant="outline" className="bg-blue-500/10 text-blue-400 border-blue-500/30">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse mr-2" />
              ZK Dark Pool Active
            </Badge>
            <span className="text-xs sm:text-sm text-gray-500 font-mono break-all">/app/treasury-vault</span>
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-medium tracking-tight mb-4">MIND Control Center</h1>
          <p className="text-sm sm:text-base text-gray-400 max-w-2xl">
            Your agent is operating in stealth mode. Capital is shielded via ZK Compressed State, executing P2P trades without MEV exposure.
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Main Chart Area */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-glass rounded-2xl p-4 sm:p-6 border border-white/10 hover:border-white/20 transition-colors">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4 sm:gap-0">
                <div>
                  <h3 className="font-medium text-lg">Shielded Treasury</h3>
                  <p className="text-xs sm:text-sm text-gray-400">Live Balance from Solana Mainnet</p>
                </div>
                <div className="text-left sm:text-right w-full sm:w-auto">
                  <div className="text-2xl font-light text-white bg-white/5 sm:bg-transparent p-3 sm:p-0 rounded-xl sm:rounded-none border border-white/5 sm:border-none">
                    {realBalance !== null ? (
                      <span className="flex items-center gap-2">
                        <Wallet className="w-5 h-5 text-blue-400" />
                        {realBalance.toFixed(4)} <span className="text-sm text-gray-500">SOL</span>
                      </span>
                    ) : (
                      <span className="flex items-center gap-2 text-gray-500 text-base sm:text-lg">
                        <Loader2 className="w-4 h-4 animate-spin" /> Fetching real balance...
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-green-400 flex items-center justify-start sm:justify-end gap-1 mt-2 sm:mt-1">
                    <Lock className="w-3 h-3" /> ZK Compressed Notes
                  </div>
                </div>
              </div>
              
              {/* Mock Chart Area */}
              <div className="h-64 w-full bg-white/[0.02] border border-white/5 rounded-xl flex items-end p-4 gap-2 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-t from-blue-500/10 to-transparent" />
                {Array.from({ length: 24 }).map((_, i) => (
                  <div 
                    key={i} 
                    className="flex-1 bg-blue-500/40 rounded-t-sm hover:bg-blue-400 transition-colors"
                    style={{ height: `${Math.max(20, Math.random() * 100)}%` }}
                  />
                ))}
              </div>
            </div>

            {/* Recent Intents */}
            <div className="bg-glass rounded-2xl border border-white/10 overflow-hidden">
              <div className="p-6 border-b border-white/5 flex justify-between items-center">
                <h3 className="font-medium text-lg">A2A Operations Log</h3>
                <Badge variant="outline" className="text-gray-400 border-white/10">Last 24h</Badge>
              </div>
              <div className="divide-y divide-white/5">
                {loading ? (
                  <div className="p-8 flex justify-center items-center">
                    <Loader2 className="w-6 h-6 animate-spin text-blue-400" />
                  </div>
                ) : (
                  intents.map((intent, i) => (
                    <div key={i} className="p-4 flex items-center justify-between hover:bg-white/5 transition-colors cursor-default">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
                          <intent.icon className="w-4 h-4 text-gray-400" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">{intent.action}</p>
                          <p className="text-xs text-gray-500">{intent.time}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-mono">{intent.amount}</p>
                        <p className={`text-xs ${intent.color}`}>{intent.status}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Agent Status */}
            <div className="bg-glass rounded-2xl p-6 border border-white/10">
              <div className="flex items-center gap-4 mb-6">
                <div className="relative">
                  <div className="w-12 h-12 rounded-full bg-blue-500/20 border border-blue-500/30 flex items-center justify-center">
                    <Terminal className="w-6 h-6 text-blue-400" />
                  </div>
                  <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-black rounded-full" />
                </div>
                <div>
                  <h3 className="font-medium">SolClaw_Alpha</h3>
                  <p className="text-xs text-green-400">Online & Searching</p>
                </div>
              </div>
              
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Strategy</span>
                  <span className="text-white">Aggressive Arb</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Risk Limit</span>
                  <span className="text-white">2.5% / trade</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Network</span>
                  <span className="text-white">Solana Mainnet</span>
                </div>
              </div>
            </div>

            {/* Security Policies */}
            <div className="bg-glass rounded-2xl p-6 border border-white/10">
              <h3 className="font-medium mb-4 flex items-center gap-2">
                <Lock className="w-4 h-4 text-gray-400" />
                Active Intent Policies
              </h3>
              <div className="space-y-3">
                <div className="p-3 bg-white/5 border border-white/10 rounded-lg text-sm">
                  <div className="flex justify-between mb-1">
                    <span className="text-gray-300">Max Slippage</span>
                    <span className="text-red-400">0.5%</span>
                  </div>
                  <div className="w-full bg-black/50 rounded-full h-1">
                    <div className="bg-red-500 h-1 rounded-full" style={{ width: '20%' }} />
                  </div>
                </div>
                <div className="p-3 bg-white/5 border border-white/10 rounded-lg text-sm">
                  <div className="flex justify-between mb-1">
                    <span className="text-gray-300">Dark Pool Volume Limit</span>
                    <span className="text-blue-400">$10k</span>
                  </div>
                  <div className="w-full bg-black/50 rounded-full h-1">
                    <div className="bg-blue-500 h-1 rounded-full" style={{ width: '45%' }} />
                  </div>
                </div>
              </div>
            </div>

            {/* Agent Skills / Usability */}
            <div className="bg-glass rounded-2xl p-6 border border-white/10">
              <h3 className="font-medium mb-4 flex items-center gap-2">
                <Zap className="w-4 h-4 text-gray-400" />
                Enabled Skills
              </h3>
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary" className="bg-green-500/10 text-green-400 border-green-500/20">ZK Stealth Swap</Badge>
                <Badge variant="secondary" className="bg-blue-500/10 text-blue-400 border-blue-500/20">x402 Micro-Pay</Badge>
                <Badge variant="secondary" className="bg-purple-500/10 text-purple-400 border-purple-500/20">Yield Shield</Badge>
                <Badge variant="secondary" className="bg-orange-500/10 text-orange-400 border-orange-500/20">Metaplex Proofs</Badge>
              </div>
              <Button className="w-full mt-4 bg-white/5 hover:bg-white/10 text-xs border border-white/10">
                Deploy New Skill
              </Button>
            </div>

            {/* Quick Actions */}
            <div className="bg-gradient-to-br from-blue-900/40 to-purple-900/40 rounded-2xl p-6 border border-white/10">
              <h3 className="font-medium mb-4 text-white">Manual Override & Tests</h3>
              <div className="space-y-3">
                <button 
                  onClick={async () => {
                    try {
                      // Simula uma Intent real batendo no backend e indo pro Telegram
                      await fetch("http://127.0.0.1:3000/v1/approvals/request", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                          intentId: "intent_demo_arbitrage_" + Math.floor(Math.random() * 1000),
                          channel: "telegram",
                          requesterId: "913039626" // ID do usuário
                        })
                      });
                      alert("Intent de Teste disparada! Verifique seu Telegram.");
                    } catch (error) {
                      console.error("Erro ao simular hero flow", error);
                    }
                  }}
                  className="w-full flex items-center justify-between p-3 rounded-xl bg-purple-500/20 text-purple-300 hover:bg-purple-500/30 transition-colors text-sm font-medium border border-purple-500/30"
                >
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4" />
                    <span>Simulate Hero Flow (Telegram)</span>
                  </div>
                </button>
                <button 
                  onClick={handleKillSwitch}
                  className="w-full py-2.5 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg text-sm font-medium border border-red-500/30 transition-colors"
                >
                  Halt All Activity (Kill Switch)
                </button>
                <button className="w-full py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-lg text-sm font-medium transition-colors">
                  Force Rebalance to USDC
                </button>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
