import { useEffect, useState } from "react";
import { MainLayout } from "../layouts/MainLayout";
import { supabase } from "../lib/supabase";

type AgentAsset = {
  id: string;
  created_at: string;
  builderId: string;
  skillName: string;
  executions: number;
  computeSaved: number;
  yieldGenerated: number;
  status: "minting" | "active" | "deprecated";
  txHash: string;
};

export const Dashboard = () => {
  const [data, setData] = useState<AgentAsset[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      // Simulate fetching from A2A Telemetry PDA / x402 Graph
      setTimeout(() => {
        setData([
          {
            id: "mind_card_001",
            created_at: new Date().toISOString(),
            builderId: "0xGarageHacker",
            skillName: "DeFi_Yield_Optimizer",
            executions: 14205,
            computeSaved: 850000,
            yieldGenerated: 1250.45,
            status: "active",
            txHash: "5Kt...9pX"
          },
          {
            id: "mind_card_002",
            created_at: new Date(Date.now() - 86400000).toISOString(),
            builderId: "0xColosseumDev",
            skillName: "Kamino_Nightly_Audit",
            executions: 450,
            computeSaved: 120000,
            yieldGenerated: 0,
            status: "active",
            txHash: "2Mz...4bY"
          },
          {
            id: "mind_card_003",
            created_at: new Date(Date.now() - 172800000).toISOString(),
            builderId: "0xSuperteamBR",
            skillName: "Jupiter_Arb_Sniper",
            executions: 89034,
            computeSaved: 2100000,
            yieldGenerated: 4530.20,
            status: "active",
            txHash: "7Rq...1wZ"
          }
        ]);
        setLoading(false);
      }, 800);
    }
    fetchData();
  }, []);

  const totalAssets = data.length;
  const totalExecutions = data.reduce((acc, curr) => acc + curr.executions, 0);
  const totalYield = data.reduce((acc, curr) => acc + curr.yieldGenerated, 0);
  const totalCompute = data.reduce((acc, curr) => acc + curr.computeSaved, 0);

  return (
    <MainLayout>
      <div className="container mx-auto px-6 pt-32 pb-24 min-h-[80vh]">
        <div className="max-w-6xl mx-auto space-y-12">
          
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-[10px] font-mono uppercase tracking-[0.3em] text-green-500">x402 Settlement Live</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-white tracking-tight">
              A2A Asset Telemetry
            </h1>
            <p className="text-zinc-500 text-lg leading-relaxed max-w-2xl">
              Real-time monitoring of Yield-Bearing Agent Cards. Watch skills travel as messages across the MIND Orchestrator, generating value and settling 92/8 royalties automatically via x402.
            </p>
          </div>

          {/* Core Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-zinc-950 border border-white/10 rounded-[2rem] p-8 space-y-2 relative overflow-hidden group hover:border-white/20 transition-colors">
              <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="text-[10px] font-mono uppercase tracking-widest text-zinc-500">Active Assets (Cards)</div>
              <div className="text-4xl font-bold text-white">{totalAssets}</div>
            </div>
            <div className="bg-zinc-950 border border-white/10 rounded-[2rem] p-8 space-y-2 relative overflow-hidden group hover:border-white/20 transition-colors">
              <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="text-[10px] font-mono uppercase tracking-widest text-zinc-500">A2A Executions</div>
              <div className="text-4xl font-bold text-white">{(totalExecutions / 1000).toFixed(1)}k</div>
            </div>
            <div className="bg-zinc-950 border border-green-500/20 rounded-[2rem] p-8 space-y-2 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-transparent pointer-events-none" />
              <div className="text-[10px] font-mono uppercase tracking-widest text-green-500/70">Cumulative Yield (USDC)</div>
              <div className="text-4xl font-bold text-white">${totalYield.toLocaleString()}</div>
            </div>
            <div className="bg-zinc-950 border border-blue-500/20 rounded-[2rem] p-8 space-y-2 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-transparent pointer-events-none" />
              <div className="text-[10px] font-mono uppercase tracking-widest text-blue-500/70 flex items-center justify-between">
                Compute Saved
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
              </div>
              <div className="text-4xl font-bold text-white">{(totalCompute / 1000000).toFixed(1)}M</div>
              <div className="text-[9px] font-mono text-zinc-500 mt-2">RPC cycles optimized</div>
            </div>
          </div>

          {/* Builder Feed */}
          <div className="bg-[#050505] border border-white/10 rounded-[2rem] overflow-hidden">
            <div className="p-8 border-b border-white/5 flex items-center justify-between">
              <h3 className="text-xl font-medium text-white">Yield-Bearing Assets (Secondary Market)</h3>
              <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-500 bg-white/5 px-3 py-1 rounded-full border border-white/10">92/8 Royalty Split</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-white/5 text-zinc-500 font-mono text-[10px] uppercase tracking-widest">
                  <tr>
                    <th className="px-8 py-4 font-normal">Asset (Skill)</th>
                    <th className="px-8 py-4 font-normal">Builder (Owner)</th>
                    <th className="px-8 py-4 font-normal">Volume (Exec)</th>
                    <th className="px-8 py-4 font-normal">Value Generated</th>
                    <th className="px-8 py-4 font-normal">On-Chain Proof</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-zinc-300">
                  {loading ? (
                    <tr>
                      <td colSpan={5} className="px-8 py-8 text-center text-zinc-600 font-mono text-xs animate-pulse">Syncing x402 settlement graph...</td>
                    </tr>
                  ) : data.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-8 py-8 text-center text-zinc-600 font-mono text-xs">No assets minted yet.</td>
                    </tr>
                  ) : (
                    data.map((asset) => (
                      <tr key={asset.id} className="hover:bg-white/[0.02] transition-colors group">
                        <td className="px-8 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]" />
                            <span className="font-mono text-white text-xs">{asset.skillName}</span>
                          </div>
                        </td>
                        <td className="px-8 py-4 font-mono text-zinc-400 text-xs">
                          {asset.builderId}
                        </td>
                        <td className="px-8 py-4 font-mono text-white text-xs">
                          {asset.executions.toLocaleString()} <span className="text-zinc-600">reqs</span>
                        </td>
                        <td className="px-8 py-4 font-mono text-green-400 text-xs">
                          ${asset.yieldGenerated > 0 ? asset.yieldGenerated.toLocaleString() : "0.00"}
                        </td>
                        <td className="px-8 py-4">
                          <a href={`https://solscan.io/tx/${asset.txHash}`} target="_blank" rel="noreferrer" className="text-zinc-500 group-hover:text-white transition-colors font-mono text-[10px] tracking-widest uppercase flex items-center gap-2">
                            <span>{asset.txHash}</span>
                            <span className="opacity-0 group-hover:opacity-100 transition-opacity">↗</span>
                          </a>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      </div>
    </MainLayout>
  );
};