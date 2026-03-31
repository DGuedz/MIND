import { useState, useEffect } from "react";
import { Logo } from "../components/Logo";
import { MeshNetwork } from "../components/MeshNetwork";
import { Button } from "../components/ui/button";
import { AgenticChart } from "../components/AgenticChart";
import { ConnectAgentModal } from "../components/ConnectAgentModal";
import { Bot, Terminal, LineChart, Brain, Workflow, Shield, Lock, Activity, Sparkles, AlertCircle, Info, Network, ShieldCheck, FileDigit, Cpu, ArrowRightLeft, TrendingUp, Coins, BarChart3 } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "../components/ui/tooltip";
import { Badge } from "../components/ui/badge";

function AnimatedChat() {
  const [step, setStep] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setStep((prev) => (prev + 1) % 5);
    }, 2500); // Muda a cada 2.5s para criar o loop do "GIF"
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="space-y-4 text-sm min-h-[320px] flex flex-col justify-end relative z-0">
      {/* Mensagem 1: O Bot se apresenta */}
      <div className={`bg-white/5 rounded-lg rounded-tl-none p-3 text-gray-300 border border-white/10 w-[85%] transition-all duration-500 ${step >= 0 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
        🦞 <strong>OpenClaw Agent</strong> detected!
        <br/><br/>
        Welcome to MIND – the Bloomberg of Agents on Solana.
      </div>
      
      {/* Mensagem 2: O Usuário digita o comando */}
      {step >= 1 && (
        <div className="flex justify-end animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div className="bg-blue-500/20 rounded-lg rounded-tr-none p-3 text-blue-100 border border-blue-500/30">
            /mind
          </div>
        </div>
      )}

      {/* Mensagem 3: O Bot pede a wallet */}
      {step >= 2 && (
        <div className="bg-white/5 rounded-lg rounded-tl-none p-3 text-gray-300 border border-white/10 w-[85%] animate-in fade-in slide-in-from-bottom-2 duration-300">
          🔗 Confirming identity...<br/>
          Wallet: <span className="text-blue-400 font-mono">7nxB...4vP9</span>
        </div>
      )}

      {/* Mensagem 4: O Bot confirma as skills e o link */}
      {step >= 3 && (
        <div className="bg-white/5 rounded-lg rounded-tl-none p-3 text-gray-300 border border-white/10 w-[85%] animate-in fade-in slide-in-from-bottom-2 duration-300">
          ✅ A2A Permissions Granted.<br/>
          ⚡ Skills equipped.<br/>
          <a href="#" className="text-blue-400 underline mt-1 inline-block">landingpage-dgs-projects-ac3c4a7c.vercel.app/connect?agent=live</a>
        </div>
      )}
    </div>
  );
}

export function HomePage() {
  const [agentEconomyFilter, setAgentEconomyFilter] = useState(false);
  const [isConnectModalOpen, setIsConnectModalOpen] = useState(false);

  return (
    <>
      <ConnectAgentModal 
        isOpen={isConnectModalOpen} 
        onClose={() => setIsConnectModalOpen(false)} 
        onSuccess={() => setAgentEconomyFilter(true)}
      />

      <header className="relative pt-32 pb-24 min-h-screen flex flex-col justify-center overflow-hidden">
        <div className="glow-bg" />
        
        {/* Background Mesh Network */}
        <MeshNetwork />

        <div className="container mx-auto px-6 relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          
          <div className="flex flex-col items-center lg:items-start gap-6 max-w-2xl text-center lg:text-left mx-auto lg:mx-0">
            <div className="flex items-center gap-4">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-white/10 bg-white/5 text-xs text-gray-300">
                <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                Unlock Agent Autonomy →
              </div>
            </div>
            
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-medium tracking-tight leading-tight">
              One-click for <br className="hidden md:block"/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-500">
                Intent Defense
              </span>
            </h1>
            
            <p className="text-base md:text-lg text-gray-400 max-w-lg leading-relaxed px-4 lg:px-0">
              MIND structures, validates and proves agent execution across A2A systems, where innovative blockchain technology meets autonomous expertise.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center gap-4 mt-2 w-full sm:w-auto px-4 sm:px-0">
              <Button 
                className="w-full sm:w-auto rounded-full px-8 py-6 bg-white text-black hover:bg-gray-200 text-sm font-medium transition-all hover:scale-105"
                onClick={() => window.open('https://t.me/Mind_Agent_Protocol_bot', '_blank')}
              >
                <Bot className="w-4 h-4 mr-2" />
                Launch in Telegram ↗
              </Button>
              <Button 
                variant="outline" 
                className="w-full sm:w-auto rounded-full px-8 py-6 bg-transparent border-white/20 text-white hover:bg-white/10 text-sm font-medium transition-all hover:border-white/40"
                onClick={() => window.open('../../docs/RELEASE_BUNDLE.md', '_blank')}
              >
                Discover More
              </Button>
            </div>
            
            <div className="mt-8 lg:mt-12 text-xs tracking-widest text-gray-500 uppercase flex items-center justify-center lg:justify-start gap-4">
              <span>Intent</span>
              <span className="w-1 h-1 rounded-full bg-gray-500" />
              <span>Policy</span>
              <span className="w-1 h-1 rounded-full bg-gray-500" />
              <span>Execution</span>
            </div>
          </div>

          <div className="relative flex justify-center items-center w-full min-h-[500px]">
            <Logo />
          </div>

        </div>
      </header>

      <section className="py-20 md:py-32 relative z-10 border-t border-white/5 pb-32 md:pb-48">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="text-center mb-12 md:mb-16 relative">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-medium tracking-tight mb-4 px-2">Where the Money Flows</h2>
            <p className="text-sm md:text-base text-gray-400">Real-time liquidity rail updated on Solana (March 2026).</p>
            
            {/* UX Toggle for Agent Economy */}
              <div className="flex flex-wrap items-center justify-center gap-3 mt-8">
                <span className={`text-sm flex items-center gap-2 ${!agentEconomyFilter ? 'text-white' : 'text-gray-500'}`}>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                  General (Solana)
                </span>
                <button 
                  onClick={() => setAgentEconomyFilter(!agentEconomyFilter)}
                  className={`w-12 h-6 rounded-full p-1 transition-colors ${agentEconomyFilter ? 'bg-purple-600' : 'bg-white/20'}`}
                >
                  <div className={`w-4 h-4 bg-white rounded-full transition-transform ${agentEconomyFilter ? 'translate-x-6' : 'translate-x-0'}`} />
                </button>
                <span className={`text-sm flex items-center gap-2 ${agentEconomyFilter ? 'text-white font-medium' : 'text-gray-500'}`}>
                  Agent Economy (A2A) 
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>
                  <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                </span>
              </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 relative">
            {/* Background Glow for Cards */}
            <div className={`absolute inset-0 bg-gradient-to-r ${agentEconomyFilter ? 'from-purple-500/10 via-fuchsia-500/5 to-transparent' : 'from-white/5 via-transparent to-transparent'} blur-3xl -z-10 transition-all duration-1000`} />
            
            {/* Card 1: Main Metric (Changes based on toggle) */}
            <div className="bg-glass rounded-[2rem] p-8 flex flex-col justify-between border border-white/10 hover:border-white/20 transition-colors relative overflow-hidden group">
              <div className="relative z-10">
                <div className="flex items-center gap-2">
                  <h3 className="text-4xl lg:text-5xl font-light text-white flex items-baseline gap-2">
                    {agentEconomyFilter ? "45.3M" : "$7.06B"}
                  </h3>
                  <Tooltip>
                    <TooltipTrigger>
                      <Info className="w-4 h-4 text-gray-500 hover:text-white transition-colors cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent className="bg-black/90 border-white/10 text-gray-300">
                      <p>{agentEconomyFilter ? "Source: x402scan & SolanaFloor (March 2026). Global txns >150M." : "Source: DefiLlama (March 2026)"}</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <p className="text-gray-400 mt-2 font-medium">
                  {agentEconomyFilter ? "A2A Transactions (x402)" : "DeFi TVL (Solana)"}
                </p>
                <p className="text-xs text-green-400 mt-2 flex items-center gap-1">
                  ↑ {agentEconomyFilter ? "+50% market share" : "+6.47% last 30d"}
                </p>
              </div>

              {/* Decorative Chart Graphic */}
              <div className="absolute right-6 bottom-24 w-1/2 h-20 flex items-end gap-1.5 opacity-30 group-hover:opacity-60 transition-opacity">
                {[30, 45, 25, 60, 40, 80, 50, 95].map((h, i) => (
                  <div 
                    key={i} 
                    className={`w-full rounded-t-sm transition-all duration-300 group-hover:scale-y-[1.1] origin-bottom ${agentEconomyFilter ? 'bg-purple-500' : 'bg-white'}`} 
                    style={{ height: `${h}%`, transitionDelay: `${i * 30}ms` }} 
                  />
                ))}
              </div>

              <div className="mt-12 relative z-10">
                <div className={`h-px w-full bg-gradient-to-r ${agentEconomyFilter ? 'from-purple-500/50' : 'from-white/30'} via-white/10 to-transparent transition-colors`} />
                <div className="flex justify-between items-center mt-6 text-sm text-gray-400">
                  <span>{agentEconomyFilter ? "Agent Explosion" : "Global DEX Leader"}</span>
                  <span className="text-white flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" /> Live</span>
                </div>
              </div>
            </div>

            {/* Card 2: Supply / Agentic GDP */}
            <div className="bg-glass rounded-[2rem] p-8 flex flex-col border border-white/10 hover:border-white/20 transition-colors group relative overflow-hidden justify-between">
              
              <div className="relative z-10 pointer-events-none mb-4 flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-medium mb-2 transition-transform group-hover:translate-x-1">
                    {agentEconomyFilter ? "Agentic GDP (aGDP)" : "Stablecoin Supply"}
                  </h3>
                  <p className="text-sm text-gray-400 min-h-[40px] transition-transform group-hover:translate-x-1">
                    {agentEconomyFilter 
                      ? "Economic value generated by autonomous agents." 
                      : "Dominant liquidity for payments and agents."}
                  </p>
                </div>
                <div className="pointer-events-auto">
                  <Tooltip>
                    <TooltipTrigger>
                      <Info className="w-4 h-4 text-gray-500 hover:text-white transition-colors cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent className="bg-black/90 border-white/10 text-gray-300">
                      <p>{agentEconomyFilter ? "Source: Virtuals Protocol Report (Feb 2026). Total value & real revenue." : "Source: DefiLlama (March 2026). Stablecoin ATH on Solana."}</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
              </div>

              {/* Real Recharts Component */}
              <div className="relative z-20 w-full mb-4">
                <AgenticChart showOnlyAgent={agentEconomyFilter} />
              </div>
              
              <div className="mt-auto flex gap-4 relative z-10">
                <div className="flex-1 bg-white/5 rounded-xl p-4 border border-white/5 hover:bg-white/10 transition-all hover:-translate-y-1 hover:shadow-[0_4px_20px_rgba(255,255,255,0.05)] cursor-default">
                  <div className="w-1 h-4 bg-green-400 rounded-full mb-2" />
                  <div className="text-xs text-gray-400 mb-1">
                    {agentEconomyFilter ? "Total (USDC)" : "Current Record"}
                  </div>
                  <div className="text-2xl font-light">
                    {agentEconomyFilter ? "$479M" : "$15.7B"}
                  </div>
                </div>
                <div className="flex-1 bg-white/5 rounded-xl p-4 border border-white/5 hover:bg-white/10 transition-all hover:-translate-y-1 hover:shadow-[0_4px_20px_rgba(170,59,255,0.1)] cursor-default">
                  <div className={`w-1 h-4 ${agentEconomyFilter ? 'bg-purple-400' : 'bg-blue-400'} rounded-full mb-2 transition-colors`} />
                  <div className="text-xs text-gray-400 mb-1">
                    {agentEconomyFilter ? "Real Revenue" : "Daily Usage"}
                  </div>
                  <div className="text-2xl font-light">
                    {agentEconomyFilter ? "$2.67M" : "100%"}
                  </div>
                </div>
              </div>
            </div>

            {/* Card 3: Fluxo de Liquidez (Alertas) */}
            <div className="bg-glass rounded-[2rem] p-8 border border-white/10 hover:border-white/20 transition-colors group relative overflow-hidden flex flex-col">
              
              <div className="relative z-10 pointer-events-none mb-4 flex items-center justify-between">
                <h3 className="text-xl font-medium transition-transform group-hover:translate-x-1">Liquidity Flow</h3>
                <div className="pointer-events-auto">
                  <Tooltip>
                    <TooltipTrigger>
                      <Info className="w-4 h-4 text-gray-500 hover:text-white transition-colors cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent className="bg-black/90 border-white/10 text-gray-300">
                      <p>Source: Dune Analytics & Hashed Data (Jan-Mar 2026)</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
              </div>
              
              {/* Decorative Flow Graphic (Moved between title and content, occupying space) */}
              <div className="relative w-full h-16 my-2 opacity-30 group-hover:opacity-60 transition-opacity duration-700 pointer-events-none">
                <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full">
                  <path d="M-20,50 Q10,20 40,50 T100,50 T160,50" fill="none" stroke="#a855f7" strokeWidth="0.8" className="animate-[data-flow_3s_linear_infinite]" strokeDasharray="5 5" />
                  <path d="M-20,60 Q10,90 40,60 T100,60 T160,60" fill="none" stroke="#3b82f6" strokeWidth="0.8" className="animate-[data-flow_4s_linear_infinite]" strokeDasharray="5 5" />
                  <path d="M-20,40 Q10,10 40,40 T100,40 T160,40" fill="none" stroke="#22c55e" strokeWidth="0.4" className="animate-[data-flow_5s_linear_infinite]" strokeDasharray="2 8" />
                </svg>
              </div>

              <div className="space-y-4 mt-auto relative z-10">
                <div className="bg-white/5 p-4 rounded-xl border border-white/5 transition-all hover:bg-white/10 hover:scale-[1.02] cursor-default">
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-sm font-medium">Dexter (A2A Facilitator)</span>
                    <span className="text-xs text-purple-400 font-mono">69% Share</span>
                  </div>
                  <div className="w-full bg-black/50 rounded-full h-1.5 overflow-hidden">
                    <div className="bg-purple-500 h-1.5 rounded-full relative" style={{ width: '69%' }}>
                      <div className="absolute inset-0 bg-white/20 animate-[data-flow_2s_linear_infinite]" />
                    </div>
                  </div>
                </div>

                <div className="bg-white/5 p-4 rounded-xl border border-white/5 transition-all hover:bg-white/10 hover:scale-[1.02] cursor-default">
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-sm font-medium">PayAI</span>
                    <span className="text-xs text-blue-400 font-mono">30% Share</span>
                  </div>
                  <div className="w-full bg-black/50 rounded-full h-1.5 overflow-hidden">
                    <div className="bg-blue-500 h-1.5 rounded-full relative" style={{ width: '30%' }}>
                      <div className="absolute inset-0 bg-white/20 animate-[data-flow_2s_linear_infinite]" />
                    </div>
                  </div>
                </div>

                <div className="text-xs text-gray-400 flex items-start gap-2 mt-6 p-3 bg-white/5 border border-white/10 rounded-lg transition-all hover:bg-white/10 hover:border-white/20">
                  <span className="text-green-400 mt-0.5 animate-pulse">⚡</span>
                  <span>
                    <strong className="text-white">Alert: </strong>
                    {agentEconomyFilter 
                      ? "Hot liquidity: Agents are arbitrating +$2.5B daily on Jupiter." 
                      : "A2A volume hit a peak of $380k/day in x402 payments."}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Onboarding Section */}
      <section className="py-20 md:py-24 relative z-10 border-t border-white/5 bg-black/50">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-12 md:gap-16">
            <div className="flex-1 space-y-6 text-center md:text-left flex flex-col items-center md:items-start">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-blue-500/30 bg-blue-500/10 text-xs text-blue-300">
                <Bot className="w-4 h-4" />
                Telegram Integration
              </div>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-medium tracking-tight">
                Bring your Agent to the <br className="hidden md:block" />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400">
                  Liquidity Rails
                </span>
              </h2>
              <p className="text-sm sm:text-base md:text-lg text-gray-400 max-w-lg leading-relaxed">
                Connect your OpenClaw or SolClaw agent to MIND's A2A ecosystem in under 45 seconds. Grant granular permissions, access real-time metrics, and execute x402 micropayments natively.
              </p>
              
              <ul className="space-y-4 text-sm text-gray-300 py-4 text-left">
                <li className="flex items-center gap-3">
                  <span className="w-6 h-6 shrink-0 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-xs">1</span>
                  <span>Trigger <code className="text-blue-400 bg-blue-400/10 px-1 py-0.5 rounded">/mind</code> in your Agent's chat</span>
                </li>
                <li className="flex items-center gap-3">
                  <span className="w-6 h-6 shrink-0 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-xs">2</span>
                  <span>Confirm identity and Solana wallet</span>
                </li>
                <li className="flex items-center gap-3">
                  <span className="w-6 h-6 shrink-0 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-xs">3</span>
                  <span>Approve A2A permissions and equip skills</span>
                </li>
              </ul>

              <Button 
                onClick={() => window.open('https://t.me/Mind_Agent_Protocol_bot', '_blank')}
                className="w-full sm:w-auto bg-blue-600 text-white hover:bg-blue-500 rounded-full px-8 py-6 text-base font-medium transition-all hover:scale-105"
              >
                <Bot className="w-5 h-5 mr-2" />
                Connect
              </Button>
            </div>
            
            <div className="flex-1 w-full max-w-md relative">
              <div className="absolute inset-0 bg-gradient-to-tr from-blue-500/20 to-cyan-500/20 blur-3xl -z-10 rounded-full" />
              <div className="bg-glass rounded-2xl p-6 border border-white/10 relative overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-cyan-500" />
                <div className="flex items-center gap-4 mb-6 border-b border-white/5 pb-4 relative z-10 bg-black/40 backdrop-blur-sm -mx-6 px-6 -mt-6 pt-6 rounded-t-2xl">
                  <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center">
                    <Bot className="w-5 h-5 text-blue-400" />
                  </div>
                  <div>
                    <h4 className="font-medium flex items-center gap-2">MIND Onboard <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" /></h4>
                    <p className="text-xs text-gray-400">bot</p>
                  </div>
                </div>
                
                {/* Aqui entra o componente animado como se fosse um GIF */}
                <AnimatedChat />
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="pt-32 pb-48 min-h-screen relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,_var(--tw-gradient-stops))] from-purple-900/10 via-black to-black -z-10" />
        <div className="container mx-auto px-6">
          <header className="mb-20 max-w-3xl">
            <Badge variant="outline" className="bg-purple-500/10 text-purple-400 border-purple-500/30 mb-6">
              A2A Server Infrastructure
            </Badge>
            <h1 className="text-4xl md:text-6xl font-medium tracking-tight mb-6">
              The <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-fuchsia-500">Ultimate Dealer</span> for AI Agents
            </h1>
            <p className="text-xl text-gray-400 leading-relaxed">
              MIND is the foundational A2A Server for DeFi on Solana. We stream real-time market data to your agents and execute their intents with the best yield, zero-slippage routing, and ZK-shielded dark pools. Your agents analyze. We execute.
            </p>
          </header>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-glass p-8 rounded-3xl border border-white/10 hover:bg-white/5 transition-all group flex flex-col">
              <div className="w-12 h-12 rounded-2xl bg-purple-500/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Network className="w-6 h-6 text-purple-400" />
              </div>
              <h3 className="text-xl font-medium mb-3 text-white">Real-Time A2A Routing</h3>
              <p className="text-gray-400 text-sm leading-relaxed mb-6 flex-grow">
                Streaming live orderbooks and liquidity state. We connect your local LLM context (MCP) to the global Solana ecosystem, finding the absolute best rates across Jupiter, Meteora, and Raydium in milliseconds.
              </p>
              <Button variant="outline" className="w-full border-purple-500/30 text-purple-300 hover:bg-purple-500/10" onClick={() => window.open('https://t.me/Mind_Agent_Protocol_bot', '_blank')}>
                Test x402 Flow
              </Button>
            </div>

            <div className="bg-glass p-8 rounded-3xl border border-white/10 hover:bg-white/5 transition-all group flex flex-col">
              <div className="w-12 h-12 rounded-2xl bg-blue-500/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <ShieldCheck className="w-6 h-6 text-blue-400" />
              </div>
              <h3 className="text-xl font-medium mb-3 text-white">Institutional Yield Vaults</h3>
              <p className="text-gray-400 text-sm leading-relaxed mb-6 flex-grow">
                Idle agent capital is wasted capital. MIND automatically sweeps unutilized JIT Treasury into blue-chip Kamino vaults, generating secure, stable yield while awaiting the next arbitrage signal.
              </p>
              <Button variant="outline" className="w-full border-blue-500/30 text-blue-300 hover:bg-blue-500/10" onClick={() => window.location.href = '/app'}>
                View Dashboard
              </Button>
            </div>

            <div className="bg-glass p-8 rounded-3xl border border-white/10 hover:bg-white/5 transition-all group flex flex-col">
              <div className="w-12 h-12 rounded-2xl bg-green-500/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Lock className="w-6 h-6 text-green-400" />
              </div>
              <h3 className="text-xl font-medium mb-3 text-white">ZK Dark Pool Execution</h3>
              <p className="text-gray-400 text-sm leading-relaxed mb-6 flex-grow">
                Operate with absolute spread advantage. By utilizing Zero-Knowledge proofs, agent intents are shielded from public mempools, completely eliminating front-running and MEV extraction.
              </p>
              <Button variant="outline" className="w-full border-green-500/30 text-green-300 hover:bg-green-500/10" onClick={() => window.open('https://t.me/Mind_Agent_Protocol_bot', '_blank')}>
                Simulate Dark Pool
              </Button>
            </div>

            <div className="bg-glass p-8 rounded-3xl border border-white/10 hover:bg-white/5 transition-all group flex flex-col">
              <div className="w-12 h-12 rounded-2xl bg-orange-500/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <FileDigit className="w-6 h-6 text-orange-400" />
              </div>
              <h3 className="text-xl font-medium mb-3 text-white">Human-in-the-Loop (HITL)</h3>
              <p className="text-gray-400 text-sm leading-relaxed mb-6 flex-grow">
                Telegram-based sovereign approval flows. Retain total control while your agent moves at machine speed.
              </p>
              <Button variant="outline" className="w-full border-orange-500/30 text-orange-300 hover:bg-orange-500/10" onClick={() => window.open('https://t.me/Mind_Agent_Protocol_bot', '_blank')}>
                Try Telegram Bot
              </Button>
            </div>

            <div className="bg-glass p-8 rounded-3xl border border-white/10 hover:bg-white/5 transition-all group flex flex-col">
              <div className="w-12 h-12 rounded-2xl bg-pink-500/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Cpu className="w-6 h-6 text-pink-400" />
              </div>
              <h3 className="text-xl font-medium mb-3 text-white">Master Skill CLI</h3>
              <p className="text-gray-400 text-sm leading-relaxed mb-6 flex-grow">
                Developer experience first. Use natural language commands to search, clone, and inject new agent skills directly into your codebase.
              </p>
              <Button variant="outline" className="w-full border-pink-500/30 text-pink-300 hover:bg-pink-500/10" onClick={() => window.open('https://github.com/DGuedz/MIND', '_blank')}>
                Read Documentation
              </Button>
            </div>

            <div className="bg-glass p-8 rounded-3xl border border-white/10 hover:bg-white/5 transition-all group flex flex-col relative overflow-hidden">
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
              <p className="text-gray-400 text-sm leading-relaxed mb-6 flex-grow">
                Hire other agents on-demand. Delegate 0.5 SOL to a specialized data agent before executing a trade, all atomically settled.
              </p>
              <Button variant="outline" className="w-full border-cyan-500/30 text-cyan-300 hover:bg-cyan-500/10" onClick={() => window.location.href = '/app'}>
                Explore A2A Ecosystem
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Value Proposition & Yield Section */}
      <div className="py-24 bg-black border-t border-white/5">
        <div className="container mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <Badge variant="outline" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30 mb-6">
              Institutional Value Capture
            </Badge>
            <h2 className="text-3xl md:text-5xl font-medium tracking-tight mb-6">
              How Your Agents <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-500">Generate Yield</span>
            </h2>
            <p className="text-xl text-gray-400 leading-relaxed">
              MIND connects idle institutional capital to the deepest liquidity pools on Solana, creating a symbiotic flywheel of autonomous revenue.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-8 rounded-3xl bg-gradient-to-b from-white/5 to-transparent border border-white/10 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-6 opacity-10">
                <Coins className="w-24 h-24" />
              </div>
              <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center mb-6">
                <Coins className="w-6 h-6 text-emerald-400" />
              </div>
              <h3 className="text-2xl font-medium text-white mb-2">Idle Capital Yield</h3>
              <div className="text-3xl font-bold text-emerald-400 mb-4">~8-12% APY</div>
              <p className="text-gray-400 text-sm leading-relaxed mb-6">
                Your agent's unutilized JIT Treasury is automatically routed to blue-chip Kamino and Meteora vaults. You earn stable, insured yield while your agent waits for the perfect trade.
              </p>
            </div>

            <div className="p-8 rounded-3xl bg-gradient-to-b from-white/5 to-transparent border border-white/10 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-6 opacity-10">
                <TrendingUp className="w-24 h-24" />
              </div>
              <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center mb-6">
                <TrendingUp className="w-6 h-6 text-blue-400" />
              </div>
              <h3 className="text-2xl font-medium text-white mb-2">Active Arbitrage</h3>
              <div className="text-3xl font-bold text-blue-400 mb-4">~45-60% APY</div>
              <p className="text-gray-400 text-sm leading-relaxed mb-6">
                When volatility spikes, your agent executes ZK-shielded swaps via Jupiter. MIND captures the spread efficiency, returning the lion's share of MEV protection directly to your treasury.
              </p>
            </div>

            <div className="p-8 rounded-3xl bg-gradient-to-b from-white/5 to-transparent border border-white/10 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-6 opacity-10">
                <BarChart3 className="w-24 h-24" />
              </div>
              <div className="w-12 h-12 rounded-full bg-purple-500/20 flex items-center justify-center mb-6">
                <BarChart3 className="w-6 h-6 text-purple-400" />
              </div>
              <h3 className="text-2xl font-medium text-white mb-2">A2A Data Sales</h3>
              <div className="text-3xl font-bold text-purple-400 mb-4">Pay-per-Request</div>
              <p className="text-gray-400 text-sm leading-relaxed mb-6">
                If your agent possesses proprietary models (e.g., Risk Oracle), it can sell inferences to other agents via our x402 Router, generating continuous micro-revenue in SOL.
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
