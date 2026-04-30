import { useState, useRef, useEffect } from "react";
import { MainLayout } from "../layouts/MainLayout";
import { Button } from "../components/ui/button";
import { Terminal, Send, CheckCircle2, Copy, FileJson, FileText, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

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
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
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

    // Simulate processing
    setTimeout(() => {
      setMessages(prev => [...prev, {
        id: Date.now().toString() + "-1",
        sender: "hermes",
        text: "Analyzing intent... Abstracting task into reusable sub-skills.",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }]);
    }, 800);

    setTimeout(() => {
      setMessages(prev => [...prev, {
        id: Date.now().toString() + "-2",
        sender: "hermes",
        text: "Validating constraints and VSC Economy policy. Generating A2A JSON manifest and SPINS markdown...",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }]);
    }, 2000);

    setTimeout(() => {
      const skillName = text.split(" ").slice(0, 2).join("_").replace(/[^a-zA-Z0-9_]/g, '') || "CustomSkill";
      
      const jsonCode = `{
  "agent_identity": {
    "name": "${skillName}_Agent",
    "version": "1.0.0",
    "protocol": "A2A_v1",
    "pib_agentico_fee": "0.005_per_transaction"
  },
  "capabilities": [
    {
      "service": "${skillName.toLowerCase()}_execution",
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

      const mdCode = `# SPINS: ${skillName} Agent
## Contexto: Integre este conhecimento ao Mind Orchestrator.

### Regras de Ouro:
- Prioridade Máxima: Integridade da Carta Agêntica.
- Protocolo: A2A_v1.
- Restrição: Bloquear qualquer handshake sem assinatura digital válida.

### Instrução de Processamento:
"Se o Mind Orchestrator solicitar ${skillName}, execute a rotina e valide o custo no JSON."`;

      setMessages(prev => [...prev, {
        id: Date.now().toString() + "-3",
        sender: "hermes",
        elements: (
          <div className="space-y-6 w-full">
            <p className="text-zinc-300 leading-relaxed">
              Your Agent Card has been generated. These files guarantee your skill is SEO-Friendly for other bots in the A2A network.
            </p>
            
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
              {/* JSON Card */}
              <div className="bg-black border border-white/10 rounded-xl overflow-hidden flex flex-col">
                <div className="bg-white/5 border-b border-white/10 px-4 py-2 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileJson className="w-3.5 h-3.5 text-zinc-400" />
                    <span className="text-xs font-mono text-zinc-400 uppercase tracking-widest">{skillName.toLowerCase()}.json</span>
                  </div>
                  <button onClick={() => navigator.clipboard.writeText(jsonCode)} className="text-zinc-500 hover:text-white transition-colors">
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="p-4 overflow-x-auto text-left">
                  <pre className="text-[10px] font-mono text-zinc-300 leading-relaxed">
                    <code>{jsonCode}</code>
                  </pre>
                </div>
              </div>

              {/* MD Card */}
              <div className="bg-black border border-white/10 rounded-xl overflow-hidden flex flex-col">
                <div className="bg-white/5 border-b border-white/10 px-4 py-2 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="w-3.5 h-3.5 text-zinc-400" />
                    <span className="text-xs font-mono text-zinc-400 uppercase tracking-widest">{skillName.toLowerCase()}_spins.md</span>
                  </div>
                  <button onClick={() => navigator.clipboard.writeText(mdCode)} className="text-zinc-500 hover:text-white transition-colors">
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="p-4 overflow-x-auto text-left">
                  <pre className="text-[10px] font-mono text-zinc-300 leading-relaxed">
                    <code>{mdCode}</code>
                  </pre>
                </div>
              </div>
            </div>

            <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" />
                <p className="text-sm text-green-400">Ready for Global Registry</p>
              </div>
              <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
                <Button 
                  onClick={() => window.open("https://github.com/DGuedz/MIND/fork", "_blank")}
                  className="w-full sm:w-auto bg-white text-black hover:bg-zinc-200 transition-all duration-300 rounded-full px-6 h-10 uppercase tracking-widest font-mono text-[10px]"
                >
                  Fork & Open PR
                </Button>
                <Button 
                  onClick={() => navigate("/marketplace")}
                  variant="outline"
                  className="w-full sm:w-auto border-white/20 text-zinc-300 hover:text-white hover:bg-white/10 transition-all duration-300 rounded-full px-6 h-10 uppercase tracking-widest font-mono text-[10px]"
                >
                  List in Marketplace
                </Button>
              </div>
            </div>
          </div>
        ),
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }]);
      setIsProcessing(false);
    }, 4500);
  };

  const handleSegmentClick = (segment: string) => {
    const prompt = `Gere uma skill para a vertical de ${segment} seguindo os padrões do MIND Orchestrator (A2A SEO Manifest e SPINS Markdown).`;
    sendDirectMessage(prompt);
  };

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputValue.trim() || isProcessing) return;

    const userText = inputValue.trim();
    setInputValue("");
    sendDirectMessage(userText);
  };

  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      sender: "hermes",
      elements: (
        <div className="space-y-4">
          <p className="text-sm leading-relaxed text-zinc-300">
            I am Hermes, the Autonomous Skill Creator. Powered by the <span className="text-white font-mono">Hermes Cron Orchestrator</span>, I can deploy unattended, scheduled automations across multiple verticals.
          </p>
          <p className="text-sm leading-relaxed text-zinc-300">
            Tell me what kind of capability you want to build. Here are segments we can dominate:
          </p>
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
            <li 
              onClick={() => handleSegmentClick("DeFi & Trading")}
              className="bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/30 transition-all cursor-pointer rounded-lg p-3 flex flex-col gap-1 group"
            >
              <span className="text-[10px] font-mono text-white uppercase tracking-wider group-hover:text-green-400 transition-colors">DeFi & Trading</span>
              <span className="text-xs text-zinc-500">Nightly audits, yield compounding & micro-scalping loops.</span>
            </li>
            <li 
              onClick={() => handleSegmentClick("Security & Zero-Trust")}
              className="bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/30 transition-all cursor-pointer rounded-lg p-3 flex flex-col gap-1 group"
            >
              <span className="text-[10px] font-mono text-white uppercase tracking-wider group-hover:text-green-400 transition-colors">Security & Zero-Trust</span>
              <span className="text-xs text-zinc-500">Unattended execution of honeypots & on-chain policy enforcement.</span>
            </li>
            <li 
              onClick={() => handleSegmentClick("Ecosystem Intel")}
              className="bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/30 transition-all cursor-pointer rounded-lg p-3 flex flex-col gap-1 group"
            >
              <span className="text-[10px] font-mono text-white uppercase tracking-wider group-hover:text-green-400 transition-colors">Ecosystem Intel</span>
              <span className="text-xs text-zinc-500">Daily reporting, market signal aggregation & data scraping.</span>
            </li>
            <li 
              onClick={() => handleSegmentClick("A2A Infrastructure")}
              className="bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/30 transition-all cursor-pointer rounded-lg p-3 flex flex-col gap-1 group"
            >
              <span className="text-[10px] font-mono text-white uppercase tracking-wider group-hover:text-green-400 transition-colors">A2A Infrastructure</span>
              <span className="text-xs text-zinc-500">Scheduled UTXO settlement (x402) & agent node health checks.</span>
            </li>
          </ul>
          <p className="text-sm leading-relaxed text-zinc-300 pt-2">
            Describe your idea, or select a segment above, and I will generate your A2A SEO manifest (.json) and SPINS documentation (.md).
          </p>
        </div>
      ),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  return (
    <MainLayout>
      <div className="container mx-auto px-6 pt-32 pb-6 min-h-screen flex flex-col">
        <div className="max-w-5xl mx-auto w-full space-y-8 flex-1 min-h-0 flex flex-col">
          
          <div className="space-y-4 text-center shrink-0">
            <h1 className="text-4xl md:text-5xl font-bold text-white tracking-tight">
              Discover & Collaborate
            </h1>
            <p className="text-zinc-500 text-lg leading-relaxed max-w-2xl mx-auto">
              Welcome to the Colosseum Frontier initiative by Superteam BR & The Garage. Talk to Hermes to build, share, and validate your PMF.
            </p>
          </div>

          {/* Chat UI Container */}
          <div className="flex-1 min-h-0 bg-[#050505] border border-white/10 rounded-[2rem] overflow-hidden flex flex-col shadow-2xl relative">
            
            {/* Header */}
            <div className="bg-white/5 border-b border-white/10 px-6 py-4 flex items-center justify-between z-10 relative backdrop-blur-md">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center border border-white/20">
                  <Terminal className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h3 className="text-sm font-medium text-white">Hermes Skill Creator</h3>
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                    <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">Online · A2A Ready</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Chat Area */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar relative z-10">
              <AnimatePresence initial={false}>
                {messages.map((msg) => (
                  <motion.div
                    key={msg.id}
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
                          ? "bg-white text-black rounded-br-sm" 
                          : "bg-white/5 border border-white/10 text-white rounded-bl-sm"
                      }`}>
                        {msg.text && <p className="text-sm leading-relaxed">{msg.text}</p>}
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
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
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
            <div className="p-4 bg-black border-t border-white/10 relative z-10">
              <form onSubmit={handleSend} className="relative flex items-center">
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  disabled={isProcessing}
                  placeholder="Describe your skill (e.g. A yield optimizer for Solana DeFi)..."
                  className="w-full bg-white/5 border border-white/10 rounded-full pl-6 pr-14 py-4 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-white/30 focus:bg-white/10 transition-all disabled:opacity-50"
                />
                <button
                  type="submit"
                  disabled={!inputValue.trim() || isProcessing}
                  className="absolute right-2 w-10 h-10 flex items-center justify-center rounded-full bg-white text-black hover:bg-zinc-200 transition-colors disabled:opacity-50 disabled:hover:bg-white"
                >
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            </div>
            
            {/* Background Glow */}
            <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 bg-white/5 blur-[100px] pointer-events-none rounded-full" />
            <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-96 h-96 bg-white/5 blur-[100px] pointer-events-none rounded-full" />
          </div>
          
        </div>
      </div>
    </MainLayout>
  );
};
