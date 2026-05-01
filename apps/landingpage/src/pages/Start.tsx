import { useState, useRef, useEffect } from "react";
import { MainLayout } from "../layouts/MainLayout";
import { Button } from "../components/ui/button";
import { Terminal, Copy, FileJson, FileText, ArrowRight, Database, Activity, TrendingUp, ShieldCheck, Zap, Search } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

const SynapseEffect = () => (
  <div className="relative h-12 w-full max-w-sm overflow-hidden rounded-lg bg-black/40 border border-white/5 mt-3">
    <svg className="absolute inset-0 w-full h-full" viewBox="0 0 400 50" preserveAspectRatio="none">
      {/* Core Energy Line */}
      <motion.path
        d="M0 25 L 40 10 L 80 40 L 120 15 L 160 35 L 200 20 L 240 30 L 280 15 L 320 35 L 360 20 L 400 25"
        stroke="rgba(34,211,238,0.8)"
        strokeWidth="1.5"
        fill="none"
        animate={{ opacity: [0, 1, 0, 0.8, 0, 1, 0] }}
        transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
        style={{ filter: "drop-shadow(0 0 4px rgba(34,211,238,0.8))" }}
      />
      {/* Branching Neural Synapse */}
      <motion.path
        d="M0 25 L 50 35 L 100 15 L 150 40 L 200 10 L 250 35 L 300 15 L 350 40 L 400 25"
        stroke="rgba(168,85,247,0.6)"
        strokeWidth="1"
        fill="none"
        animate={{ opacity: [0, 0.8, 0, 1, 0] }}
        transition={{ duration: 1.2, repeat: Infinity, delay: 0.3, ease: "linear" }}
        style={{ filter: "drop-shadow(0 0 6px rgba(168,85,247,0.6))" }}
      />
      {/* Background Pulse */}
      <motion.path
        d="M0 25 Q 100 5, 200 25 T 400 25"
        stroke="rgba(34,211,238,0.3)"
        strokeWidth="4"
        fill="none"
        animate={{ opacity: [0.2, 0.6, 0.2] }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        style={{ filter: "blur(4px)" }}
      />
    </svg>
  </div>
);

type Message = {
  id: string;
  sender: "user" | "hermes";
  text?: string;
  elements?: React.ReactNode;
  timestamp: string;
};

export const Start = () => {
  const navigate = useNavigate();
  const [inputValue, setInputValue] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [chatStarted, setChatStarted] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  };

  const sendDirectMessage = (text: string) => {
    if (isProcessing) return;
    
    // Add user message
    setMessages(prev => [...prev, {
      id: Date.now().toString(),
      sender: "user",
      text: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }]);

    setIsProcessing(true);

    // Stage 1: Searching Context/Source
    setTimeout(() => {
      setMessages(prev => [...prev, {
        id: Date.now().toString() + "-1",
        sender: "hermes",
        elements: (
          <div className="flex items-center gap-3 text-zinc-400">
            <Database className="w-4 h-4 animate-pulse text-blue-400" />
            <span className="text-sm font-mono">Buscando na fonte (MIND Orchestrator)...</span>
          </div>
        ),
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }]);
    }, 600);

    // Stage 2: Building/Processing
    setTimeout(() => {
      setMessages(prev => {
        const newMessages = prev.filter(m => !m.id.endsWith("-1")); // Remove previous thought
        return [...newMessages, {
          id: Date.now().toString() + "-2",
          sender: "hermes",
          elements: (
            <div className="flex flex-col text-zinc-400 w-full">
              <div className="flex items-center gap-3">
                <div className="relative flex items-center justify-center">
                  <motion.div 
                    animate={{ scale: [1, 1.4, 1], opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 1, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute w-4 h-4 bg-cyan-500/30 rounded-full blur-sm"
                  />
                  <Zap className="w-4 h-4 text-cyan-400 relative z-10" />
                </div>
                <span className="text-sm font-mono text-cyan-400">Synthesizing Neural Pathways...</span>
              </div>
              <SynapseEffect />
            </div>
          ),
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }];
      });
    }, 2500);

    // Stage 3: Final Delivery
    setTimeout(async () => {
      // Call backend to generate files physically using AI
      let generatedJson = "";
      let generatedMd = "";
      let generatedMindprint = "";
      let generatedX402 = "";
      let upperSlug = "SKILL";

      try {
        const response = await fetch("/api/generate-skill", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt: text })
        });
        
        if (response.ok) {
          const data = await response.json();
          generatedJson = data.jsonCode;
          generatedMd = data.mdCode;
          generatedMindprint = data.mindprintCode;
          generatedX402 = data.x402Code;
          upperSlug = data.slug.toUpperCase();
        } else {
          throw new Error("API error");
        }
      } catch (err) {
        console.error("Failed to generate skill files on backend", err);
        // Fallback if local backend fails
        const cleaned = text.replace(/[^a-zA-Z0-9_ ]/g, '').trim();
        const words = cleaned.split(" ");
        const skillName = words.slice(0, 2).join("_") || "Custom_Skill";
        const slug = skillName.toLowerCase();
        upperSlug = slug.toUpperCase();
        
        generatedJson = `{
  "agent_identity": {
    "name": "${skillName}_Agent",
    "version": "1.0.0",
    "protocol": "A2A_v1",
    "pib_agentico_fee": "0.005_per_transaction"
  },
  "capabilities": [
    {
      "service": "${slug}_execution",
      "methods": ["GET", "POST"],
      "auth_required": true,
      "encryption": "AES-256"
    }
  ],
  "compliance": {
    "standard": "A2A_Agentic_Safety_Card",
    "guarantees": "Zero-knowledge_proofs"
  }
}`;

        generatedMd = `# SPINS: ${skillName} Agent
## Contexto: Integre este conhecimento ao Mind Orchestrator.

### Regras de Ouro:
- Prioridade Máxima: Integridade da Carta Agêntica.
- Protocolo: A2A_v1.
- Restrição: Bloquear qualquer handshake sem assinatura digital válida.

### Instrução de Processamento:
"Se o Mind Orchestrator solicitar ${skillName}, execute a rotina e valide o custo no JSON."`;

        generatedMindprint = `{
  "asset_id": "metaplex_core_sim_fallback",
  "checksums": {
    "manifest_json": "fallback_hash",
    "spins_md": "fallback_hash"
  },
  "lineage": {
    "parent_hash": "genesis",
    "prompt_vector": "fallback_vector"
  },
  "zk_proof_ready": true,
  "timestamp": "${new Date().toISOString()}"
}`;

        generatedX402 = `# X402 Atomic Settlement Policy
policy_id: "x402_fallback"
mindprint_ref: "fallback"
split:
  creator: 0.92
  protocol: 0.08
settlement_layer: "Cloak_Darkpool"
trigger: "on_execution_success"
currency: "SOL"
enforcement: "strict"`;
      }

      // Final delivery replaces previous loading messages
      setMessages(prev => {
        const newMessages = prev.filter(m => !m.id.endsWith("-2"));
        return [...newMessages, {
          id: Date.now().toString() + "-3",
          sender: "hermes",
          elements: (
            <div className="space-y-6 w-full">
            <p className="text-sm font-light text-zinc-300 leading-relaxed">
              Your Agent Card has been generated. These files guarantee your skill is SEO-Friendly for other bots in the A2A network.
            </p>
            
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
              {/* JSON Card */}
              <div className="bg-[#0a0a0a] border border-white/10 rounded-xl overflow-hidden flex flex-col shadow-lg">
                <div className="bg-white/5 border-b border-white/5 px-4 py-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <FileJson className="w-4 h-4 text-zinc-400" />
                    <span className="text-[10px] font-mono text-zinc-300 uppercase tracking-widest">{upperSlug}.JSON</span>
                  </div>
                  <button onClick={() => navigator.clipboard.writeText(generatedJson)} className="text-zinc-500 hover:text-white transition-colors p-1 hover:bg-white/10 rounded-md">
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="p-5 overflow-x-auto text-left custom-scrollbar">
                  <pre className="text-[11px] font-mono text-zinc-400 leading-relaxed">
                    <code>{generatedJson}</code>
                  </pre>
                </div>
              </div>

              {/* MD Card */}
              <div className="bg-[#0a0a0a] border border-white/10 rounded-xl overflow-hidden flex flex-col shadow-lg">
                <div className="bg-white/5 border-b border-white/5 px-4 py-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <FileText className="w-4 h-4 text-zinc-400" />
                    <span className="text-[10px] font-mono text-zinc-300 uppercase tracking-widest">{upperSlug}_SPINS.MD</span>
                  </div>
                  <button onClick={() => navigator.clipboard.writeText(generatedMd)} className="text-zinc-500 hover:text-white transition-colors p-1 hover:bg-white/10 rounded-md">
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="p-5 overflow-x-auto text-left custom-scrollbar">
                  <pre className="text-[11px] font-mono text-zinc-400 leading-relaxed">
                    <code>{generatedMd}</code>
                  </pre>
                </div>
              </div>

              {/* MINDPRINT Card */}
              <div className="bg-[#0a0a0a] border border-cyan-500/20 rounded-xl overflow-hidden flex flex-col shadow-lg">
                <div className="bg-cyan-500/5 border-b border-cyan-500/10 px-4 py-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <ShieldCheck className="w-4 h-4 text-cyan-400" />
                    <span className="text-[10px] font-mono text-cyan-300 uppercase tracking-widest">{upperSlug}.MINDPRINT</span>
                  </div>
                  <button onClick={() => navigator.clipboard.writeText(generatedMindprint)} className="text-cyan-500/50 hover:text-cyan-400 transition-colors p-1 hover:bg-cyan-500/10 rounded-md">
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="p-5 overflow-x-auto text-left custom-scrollbar">
                  <pre className="text-[11px] font-mono text-cyan-400/80 leading-relaxed">
                    <code>{generatedMindprint}</code>
                  </pre>
                </div>
              </div>

              {/* X402 Policy Card */}
              <div className="bg-[#0a0a0a] border border-purple-500/20 rounded-xl overflow-hidden flex flex-col shadow-lg">
                <div className="bg-purple-500/5 border-b border-purple-500/10 px-4 py-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <ShieldCheck className="w-4 h-4 text-purple-400" />
                    <span className="text-[10px] font-mono text-purple-300 uppercase tracking-widest">{upperSlug}.X402</span>
                  </div>
                  <button onClick={() => navigator.clipboard.writeText(generatedX402)} className="text-purple-500/50 hover:text-purple-400 transition-colors p-1 hover:bg-purple-500/10 rounded-md">
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="p-5 overflow-x-auto text-left custom-scrollbar">
                  <pre className="text-[11px] font-mono text-purple-400/80 leading-relaxed">
                    <code>{generatedX402}</code>
                  </pre>
                </div>
              </div>
            </div>

            <div className="border border-white/10 bg-white/5 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 backdrop-blur-sm">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse shadow-[0_0_10px_rgba(34,197,94,0.5)]" />
                <p className="text-xs font-mono uppercase tracking-widest text-zinc-300">Ready for Registry</p>
              </div>
              <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
                <Button 
                  onClick={() => window.open("https://github.com/DGuedz/MIND/fork", "_blank")}
                  className="w-full sm:w-auto bg-white text-black hover:bg-zinc-200 transition-all duration-300 rounded-full px-6 h-9 uppercase tracking-widest font-mono text-[10px] shadow-lg"
                >
                  Fork & Open PR
                </Button>
                <Button 
                  onClick={() => navigate("/marketplace")}
                  variant="outline"
                  className="w-full sm:w-auto border-white/10 bg-transparent text-zinc-400 hover:text-white hover:bg-white/5 transition-all duration-300 rounded-full px-6 h-9 uppercase tracking-widest font-mono text-[10px]"
                >
                  Marketplace
                </Button>
              </div>
            </div>
          </div>
        ),
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }];
      });
      setIsProcessing(false);
    }, 6000);
  };

  const handleSegmentClick = (segment: string) => {
    const prompt = `Como o Hermes Cron Orchestrator, gere uma skill autônoma para a vertical de ${segment}. Crie o manifesto A2A e as regras SPINS (.md) para listagem no ecossistema.`;
    setInputValue(prompt);
  };

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputValue.trim() || isProcessing) return;

    if (!chatStarted) setChatStarted(true);

    const userText = inputValue.trim();
    setInputValue("");
    sendDirectMessage(userText);
  };

  const [messages, setMessages] = useState<Message[]>([]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  return (
    <MainLayout>
      <div className="container mx-auto px-6 flex-1 flex flex-col min-h-screen pt-32 pb-12">
        <div className="max-w-5xl mx-auto w-full space-y-8 flex-1 flex flex-col">
          {/* Header */}
          <div className="space-y-3 text-center shrink-0">
            <h1 className="text-3xl md:text-4xl font-bold text-white tracking-tight">
              Builder Access & Skill Factory
            </h1>
            <p className="text-zinc-500 text-sm md:text-base leading-relaxed max-w-2xl mx-auto">
              You are entering the core engineering environment. Use the MIND Orchestrator to generate standard A2A manifests, validate logic, and prepare your Agentic Skill for the Marketplace.
            </p>
          </div>

          {/* Main Layout Container */}
          <div className="flex-1 flex flex-col items-center justify-start relative w-full max-w-5xl mx-auto pt-8 pb-16">
            
            {!chatStarted ? (
              // Initial State (Google-like Search UI)
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="w-full flex flex-col items-center gap-8 px-4"
              >
                {/* Logo Area */}
                <div className="flex flex-col items-center gap-4">
                  <div className="w-20 h-20 rounded-full border border-white/20 bg-white/5 p-1 shadow-2xl relative">
                    <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-white/10 to-transparent blur-md" />
                    <img src="/mind_logo_profile.png" alt="MIND" className="w-full h-full rounded-full object-cover" />
                    <div className="absolute -bottom-2 -right-2 bg-black border border-white/20 rounded-full p-1.5">
                      <Terminal className="w-4 h-4 text-white" />
                    </div>
                  </div>
                  <div className="text-center">
                    <h2 className="text-2xl font-bold tracking-tight text-white">MIND Protocol</h2>
                    <p className="text-sm font-mono text-zinc-500 mt-1">MIND Skill Creator</p>
                  </div>
                </div>

                {/* Main Input */}
                <form onSubmit={handleSend} className="w-full relative group">
                  <div className="absolute inset-0 bg-gradient-to-r from-white/5 via-white/10 to-white/5 rounded-full blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  <div className="relative flex items-center bg-[#1a1a1a] border border-white/10 hover:border-white/30 rounded-full transition-all duration-300 shadow-xl">
                    <div className="pl-6 pr-3">
                      <Search className="w-5 h-5 text-zinc-400" />
                    </div>
                    <input
                      type="text"
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      placeholder="Descreva a sua Skill ou selecione um hype card acima..."
                      className="w-full bg-transparent py-4 text-base text-white placeholder:text-zinc-500 focus:outline-none"
                    />
                    <div className="pr-2">
                      <button
                        type="submit"
                        disabled={!inputValue.trim()}
                        className="w-10 h-10 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 text-white transition-colors disabled:opacity-30"
                      >
                        <ArrowRight className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </form>

                {/* Quick Action Chips (Hype Cards Style) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 w-full mt-4">
                  {/* DeFi Card */}
                  <div 
                    onClick={() => handleSegmentClick("DeFi & Trading")}
                    className="metallic-brushed-solana metallic-shine cursor-pointer rounded-2xl p-4 flex flex-col gap-3 group relative overflow-hidden text-left"
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    <div className="flex items-start justify-between relative z-10">
                      <div className="p-2 rounded-xl bg-white/5 border border-white/10 group-hover:border-green-500/30 transition-colors">
                        <TrendingUp className="w-4 h-4 text-zinc-400 group-hover:text-green-400 transition-colors" />
                      </div>
                      <span className="text-[9px] font-mono text-green-400 bg-green-500/10 px-2 py-0.5 rounded-full border border-green-500/20">HIGH DEMAND</span>
                    </div>
                    <div className="relative z-10">
                      <h3 className="text-sm font-medium text-white mb-1 group-hover:text-green-400 transition-colors">DeFi & Trading</h3>
                      <p className="text-xs text-zinc-500 leading-relaxed">Nightly audits, yield compounding & micro-scalping loops.</p>
                    </div>
                    <div className="flex items-center justify-between mt-auto pt-3 border-t border-white/5 relative z-10">
                      <div className="flex flex-col gap-1">
                        <span className="text-[9px] font-mono text-zinc-600 uppercase">Avg. Yield</span>
                        <span className="text-xs font-mono text-zinc-300">12.4% APY</span>
                      </div>
                      <div className="flex flex-col gap-1 text-right">
                        <span className="text-[9px] font-mono text-zinc-600 uppercase">Exec. Cost</span>
                        <span className="text-xs font-mono text-zinc-300">0.005 SOL</span>
                      </div>
                    </div>
                  </div>

                  {/* Security Card */}
                  <div 
                    onClick={() => handleSegmentClick("Security & Zero-Trust")}
                    className="metallic-brushed-solana metallic-shine cursor-pointer rounded-2xl p-4 flex flex-col gap-3 group relative overflow-hidden text-left"
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    <div className="flex items-start justify-between relative z-10">
                      <div className="p-2 rounded-xl bg-white/5 border border-white/10 group-hover:border-blue-500/30 transition-colors">
                        <ShieldCheck className="w-4 h-4 text-zinc-400 group-hover:text-blue-400 transition-colors" />
                      </div>
                      <span className="text-[9px] font-mono text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-full border border-blue-500/20">PREMIUM</span>
                    </div>
                    <div className="relative z-10">
                      <h3 className="text-sm font-medium text-white mb-1 group-hover:text-blue-400 transition-colors">Zero-Trust</h3>
                      <p className="text-xs text-zinc-500 leading-relaxed">Unattended execution of honeypots & on-chain policy enforcement.</p>
                    </div>
                    <div className="flex items-center justify-between mt-auto pt-3 border-t border-white/5 relative z-10">
                      <div className="flex flex-col gap-1">
                        <span className="text-[9px] font-mono text-zinc-600 uppercase">Success</span>
                        <span className="text-xs font-mono text-zinc-300">99.98%</span>
                      </div>
                      <div className="flex flex-col gap-1 text-right">
                        <span className="text-[9px] font-mono text-zinc-600 uppercase">Blocked</span>
                        <span className="text-xs font-mono text-zinc-300">2.4k+</span>
                      </div>
                    </div>
                  </div>

                  {/* Intel Card */}
                  <div 
                    onClick={() => handleSegmentClick("Ecosystem Intel")}
                    className="metallic-brushed-solana metallic-shine cursor-pointer rounded-2xl p-4 flex flex-col gap-3 group relative overflow-hidden text-left"
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    <div className="flex items-start justify-between relative z-10">
                      <div className="p-2 rounded-xl bg-white/5 border border-white/10 group-hover:border-purple-500/30 transition-colors">
                        <Activity className="w-4 h-4 text-zinc-400 group-hover:text-purple-400 transition-colors" />
                      </div>
                    </div>
                    <div className="relative z-10">
                      <h3 className="text-sm font-medium text-white mb-1 group-hover:text-purple-400 transition-colors">Ecosystem Intel</h3>
                      <p className="text-xs text-zinc-500 leading-relaxed">Daily reporting, market signal aggregation & data scraping.</p>
                    </div>
                    <div className="flex items-center justify-between mt-auto pt-3 border-t border-white/5 relative z-10">
                      <div className="flex flex-col gap-1">
                        <span className="text-[9px] font-mono text-zinc-600 uppercase">Data Points</span>
                        <span className="text-xs font-mono text-zinc-300">1.2M/day</span>
                      </div>
                      <div className="flex flex-col gap-1 text-right">
                        <span className="text-[9px] font-mono text-zinc-600 uppercase">Latency</span>
                        <span className="text-xs font-mono text-zinc-300">~400ms</span>
                      </div>
                    </div>
                  </div>

                  {/* Infra Card */}
                  <div 
                    onClick={() => handleSegmentClick("A2A Infrastructure")}
                    className="metallic-brushed-solana metallic-shine cursor-pointer rounded-2xl p-4 flex flex-col gap-3 group relative overflow-hidden text-left"
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    <div className="flex items-start justify-between relative z-10">
                      <div className="p-2 rounded-xl bg-white/5 border border-white/10 group-hover:border-orange-500/30 transition-colors">
                        <Zap className="w-4 h-4 text-zinc-400 group-hover:text-orange-400 transition-colors" />
                      </div>
                      <span className="text-[9px] font-mono text-orange-400 bg-orange-500/10 px-2 py-0.5 rounded-full border border-orange-500/20">CORE</span>
                    </div>
                    <div className="relative z-10">
                      <h3 className="text-sm font-medium text-white mb-1 group-hover:text-orange-400 transition-colors">A2A Infra</h3>
                      <p className="text-xs text-zinc-500 leading-relaxed">Scheduled UTXO settlement (x402) & agent node health checks.</p>
                    </div>
                    <div className="flex items-center justify-between mt-auto pt-3 border-t border-white/5 relative z-10">
                      <div className="flex flex-col gap-1">
                        <span className="text-[9px] font-mono text-zinc-600 uppercase">Settlement</span>
                        <span className="text-xs font-mono text-zinc-300">Atomic x402</span>
                      </div>
                      <div className="flex flex-col gap-1 text-right">
                        <span className="text-[9px] font-mono text-zinc-600 uppercase">Privacy</span>
                        <span className="text-xs font-mono text-zinc-300">Darkpool</span>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ) : (
              // Chat State (Expands to full container)
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full h-full flex flex-col metallic-brushed-solana metallic-shine rounded-[2rem] overflow-hidden shadow-2xl relative"
              >
                {/* Header */}
                <div className="bg-transparent border-b border-white/5 px-6 py-4 flex items-center justify-between z-10 relative">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center border border-white/10">
                      <Terminal className="w-3.5 h-3.5 text-zinc-400" />
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-white">MIND Skill Creator</h3>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.5)]" />
                        <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest">Online · A2A Ready</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Chat Area */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar relative z-10">
                  <AnimatePresence initial={false} mode="sync">
                    {messages.map((msg) => (
                      <motion.div
                        key={msg.id}
                        layout
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`flex flex-col ${msg.sender === "user" ? "items-end" : "items-start"}`}
                      >
                        <div className="flex items-end gap-2 max-w-[90%] md:max-w-[80%]">
                          {msg.sender === "hermes" && (
                            <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center shrink-0 border border-white/20 mb-1">
                              <Terminal className="w-3 h-3 text-white" />
                            </div>
                          )}
                          
                          <div className={`p-4 rounded-2xl ${
                          msg.sender === "user" 
                            ? "bg-[#111] border border-white/10 text-zinc-300 rounded-tr-sm" 
                            : "bg-transparent text-zinc-300"
                        }`}>
                          {msg.text && <p className="text-sm font-light leading-relaxed">{msg.text}</p>}
                            {msg.elements && msg.elements}
                          </div>
                        </div>
                        <span className="text-[9px] font-mono text-zinc-600 mt-2 px-8 uppercase tracking-widest">
                          {msg.timestamp}
                        </span>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                  
                  {isProcessing && (
                    <motion.div
                      layout
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="flex items-end gap-2"
                    >
                      <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center shrink-0 border border-white/20 mb-1">
                        <Terminal className="w-3 h-3 text-white" />
                      </div>
                      <div className="bg-white/5 border border-white/10 p-4 rounded-2xl rounded-bl-sm flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-zinc-500 animate-bounce" />
                        <span className="w-1.5 h-1.5 rounded-full bg-zinc-500 animate-bounce" style={{ animationDelay: "150ms" }} />
                        <span className="w-1.5 h-1.5 rounded-full bg-zinc-500 animate-bounce" style={{ animationDelay: "300ms" }} />
                      </div>
                    </motion.div>
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                <div className="p-4 bg-transparent border-t border-white/5 relative z-10">
                  <form onSubmit={handleSend} className="relative flex items-center group max-w-4xl mx-auto">
                    <div className="absolute inset-0 bg-gradient-to-r from-white/5 via-white/10 to-white/5 rounded-full blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    <div className="relative flex items-center w-full bg-[#111] border border-white/10 hover:border-white/20 rounded-full transition-all duration-300 shadow-xl">
                      <input
                        type="text"
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        disabled={isProcessing}
                        placeholder="Descreva a sua Skill ou envie um novo comando..."
                        className="w-full bg-transparent pl-6 pr-14 py-3.5 text-sm text-white placeholder:text-zinc-600 focus:outline-none disabled:opacity-50 font-light"
                      />
                      <div className="absolute right-2">
                        <button
                          type="submit"
                          disabled={!inputValue.trim() || isProcessing}
                          className="w-9 h-9 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 text-white transition-colors disabled:opacity-30"
                        >
                          <ArrowRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </form>
                </div>
                
                {/* Background Glow */}
                <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 bg-white/5 blur-[100px] pointer-events-none rounded-full" />
                <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-96 h-96 bg-white/5 blur-[100px] pointer-events-none rounded-full" />
              </motion.div>
            )}
          </div>
          
        </div>
      </div>
    </MainLayout>
  );
};
