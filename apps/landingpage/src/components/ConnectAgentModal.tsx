import { useState, useEffect, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "./ui/dialog";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Switch } from "./ui/switch";
import { Terminal, CheckCircle2, Loader2, ArrowRight, Wallet, Bot, Zap, ShieldCheck } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const gatewayBaseUrl = (import.meta.env.VITE_API_GATEWAY_URL || "http://127.0.0.1:4000").trim().replace(/\/$/, "");

// Componente para gerar o SVG da credencial em tempo real
function AgentCredentialSVG({ agentId, tier = "Pro" }: { agentId: string, tier?: string }) {
  const seed = useMemo(() => {
    if (!agentId) return 0;
    let hash = 0;
    for (let i = 0; i < agentId.length; i++) {
      hash = ((hash << 5) - hash) + agentId.charCodeAt(i);
      hash |= 0;
    }
    return Math.abs(hash);
  }, [agentId]);

  const circles = useMemo(() => {
    return Array.from({ length: 6 }).map((_, i) => {
      const radius = 40 + i * 25;
      const dashArray = (seed % (i + 2)) * 10 + 5;
      const opacity = 1 - i * 0.15;
      return (
        <circle 
          key={i} 
          cx="250" cy="250" r={radius} 
          fill="none" stroke="#ffffff" 
          strokeWidth="0.5" strokeDasharray={dashArray} 
          opacity={opacity} 
        />
      );
    });
  }, [seed]);

  const lines = useMemo(() => {
    return Array.from({ length: 12 }).map((_, i) => {
      const angle = (i * 30 + (seed % 30)) * (Math.PI / 180);
      const x2 = 250 + Math.cos(angle) * 200;
      const y2 = 250 + Math.sin(angle) * 200;
      return (
        <line 
          key={i} 
          x1="250" y1="250" x2={x2} y2={y2} 
          stroke={tier === "Institutional" ? "#ffffff" : "#a1a1aa"} 
          strokeWidth="0.2" opacity="0.3" 
        />
      );
    });
  }, [seed, tier]);

  return (
    <svg width="100%" height="100%" viewBox="0 0 500 500" xmlns="http://www.w3.org/2000/svg" className="rounded-xl overflow-hidden shadow-2xl border border-white/30">
      <rect width="500" height="500" fill="#050505" />
      <defs>
        <radialGradient id="grad1" cx="50%" cy="50%" r="50%" fx="50%" fy="50%">
          <stop offset="0%" style={{ stopColor: "#ffffff", stopOpacity: 0.1 }} />
          <stop offset="100%" style={{ stopColor: "#050505", stopOpacity: 0 }} />
        </radialGradient>
      </defs>
      <circle cx="250" cy="250" r="240" fill="url(#grad1)" />
      {circles}
      {lines}
      <text x="250" y="260" fontFamily="monospace" fontSize="24" fill="#ffffff" textAnchor="middle" letterSpacing="8" fontWeight="bold">MIND</text>
      <text x="250" y="460" fontFamily="monospace" fontSize="10" fill="#525252" textAnchor="middle" letterSpacing="2">AGENT CREDENTIAL [{tier.toUpperCase()}]</text>
      <text x="250" y="475" fontFamily="monospace" fontSize="8" fill="#333333" textAnchor="middle">{agentId ? `${agentId.substring(0, 16)}...` : "FORGING..."}</text>
    </svg>
  );
}

export function ConnectAgentModal({ isOpen, onClose, onSuccess }: { isOpen: boolean; onClose: () => void; onSuccess?: () => void }) {
  const [step, setStep] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [agentData, setAgentData] = useState<{ agentId?: string; deepLink?: string }>({
    agentId: "HtmWinXoKraW34MujKrCqgtL981eAYkocVh9QDoMFJG7" // Mock ID para visualização
  });

  // Backend Integration
  const triggerBackendOnboard = async () => {
    try {
      setIsProcessing(true);
      // Calls the real API Gateway which routes to approval-gateway-service
      const response = await fetch(`${gatewayBaseUrl}/v1/onboard/tg-agent`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          agentToken: "test_token_openclaw",
          wallet: "7nxB...4vP9"
        })
      });
      
      if (!response.ok) {
        throw new Error(`onboard_http_${response.status}`);
      }

      const data = await response.json();
      if (data.status === "success") {
        setAgentData(data);
      }
    } catch (error) {
      console.error("Backend onboard failed:", error instanceof Error ? error.message : String(error));
    } finally {
      setIsProcessing(false);
    }
  };

  // Auto-advance steps to simulate the connection process
  useEffect(() => {
    if (!isOpen) {
      setStep(0);
      return;
    }

    let isMounted = true;

    if (step === 1 && !agentData.agentId && !isProcessing) {
      triggerBackendOnboard();
    }

    if (step < 5) {
      const timer = setTimeout(() => {
        if (isMounted) {
          setStep((prev) => prev + 1);
        }
      }, step === 0 ? 1000 : step === 1 ? 2500 : step === 2 ? 3000 : step === 3 ? 3500 : 2000);
      return () => {
        isMounted = false;
        clearTimeout(timer);
      };
    }

    return () => {
      isMounted = false;
    };
  }, [step, isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[650px] bg-black/95 border-white/30 text-white backdrop-blur-2xl p-0 overflow-hidden rounded-3xl">
        <div className="p-8 border-b border-white/20 bg-white/[0.02]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-4 text-xl font-bold tracking-[0.3em] uppercase font-mono">
              <Bot className="w-5 h-5 text-zinc-400" />
              On-Chain Onboarding
            </DialogTitle>
            <DialogDescription className="text-zinc-500 text-sm font-light tracking-wide mt-2">
              Batizando agente nos trilhos de liquidez institucional da Solana.
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="p-8 space-y-10">
          {/* Progress Timeline */}
          <div className="flex justify-between items-center px-4 relative">
            <div className="absolute top-1/2 left-0 right-0 h-px bg-white/5 -z-10" />
            
            {[
              { label: "Trigger", icon: Terminal },
              { label: "Identity", icon: Bot },
              { label: "Auth", icon: Wallet },
              { label: "Credential", icon: ShieldCheck },
              { label: "Ready", icon: Zap }
            ].map((s, i) => (
              <div key={i} className="flex flex-col items-center gap-3 bg-black/50 px-3 z-10 backdrop-blur-sm">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center border transition-all duration-700 ${
                  step > i ? "bg-white/5 border-white/20 text-white" :
                  step === i ? "bg-white/10 border-white/40 text-white animate-pulse" :
                  "bg-black border-white/20 text-zinc-800"
                }`}>
                  {step > i ? <CheckCircle2 className="w-4 h-4" /> : <s.icon className="w-4 h-4" />}
                </div>
                <span className={`text-[8px] font-mono uppercase tracking-[0.2em] ${step >= i ? "text-zinc-400" : "text-zinc-800"}`}>
                  {s.label}
                </span>
              </div>
            ))}
          </div>

          {/* Dynamic Content Area */}
          <div className="bg-white/[0.01] border border-white/20 rounded-3xl p-8 min-h-[420px] font-mono text-xs relative overflow-hidden flex flex-col justify-center">
            
            <AnimatePresence mode="wait">
              {/* Step 0: Trigger */}
              {step === 0 && (
                <motion.div 
                  key="step0"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="flex items-center justify-center h-full text-zinc-600 flex-col gap-4"
                >
                  <Loader2 className="w-5 h-5 animate-spin text-zinc-400" />
                  <p className="tracking-widest uppercase text-[10px]">Listening for neural trigger /mind...</p>
                </motion.div>
              )}

              {/* Step 1-2: Identity & Auth */}
              {(step === 1 || step === 2) && (
                <motion.div 
                  key="step1-2"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-6"
                >
                  <div className="flex gap-4">
                    <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/30 flex items-center justify-center shrink-0">
                      <span className="text-zinc-400 text-[10px]">TG</span>
                    </div>
                    <div className="bg-white/5 rounded-2xl rounded-tl-none p-4 text-zinc-400 border border-white/20 max-w-[80%]">
                      <p className="leading-relaxed">Agent detected. Integrating with institutional liquidity rails.</p>
                    </div>
                  </div>
                  
                  {step >= 2 && (
                    <div className="flex gap-4 flex-row-reverse animate-in fade-in slide-in-from-bottom-4 duration-700">
                      <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/30 flex items-center justify-center shrink-0">
                        <Bot className="w-4 h-4 text-zinc-400" />
                      </div>
                      <div className="bg-white/5 rounded-2xl rounded-tr-none p-4 text-zinc-400 border border-white/20 max-w-[80%]">
                        <p className="mb-4 text-white">Identity verified.</p>
                        <div className="space-y-2 text-[10px] uppercase tracking-widest opacity-60">
                          <div className="flex justify-between border-b border-white/20 pb-2">
                            <span>Name</span>
                            <span className="text-white">SolClaw_Alpha</span>
                          </div>
                          <div className="flex justify-between pt-1">
                            <span>Wallet</span>
                            <span className="text-zinc-300">7nxB...4vP9</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </motion.div>
              )}

              {/* Step 3: Credential Forging (The highlight) */}
              {step === 3 && (
                <motion.div 
                  key="step3"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 1.05 }}
                  className="flex flex-col items-center gap-8"
                >
                  <div className="w-48 h-48 relative">
                    <AgentCredentialSVG agentId={agentData.agentId || ""} />
                    <div className="absolute inset-0 bg-white/5 animate-pulse rounded-xl" />
                  </div>
                  <div className="text-center space-y-2">
                    <Badge variant="outline" className="bg-white/5 text-zinc-400 border-white/30 uppercase tracking-[0.3em] px-4 py-1 font-mono text-[9px]">
                      Forging Credential
                    </Badge>
                    <p className="text-[10px] text-zinc-500 uppercase tracking-widest animate-pulse">
                      Minting Metaplex Core cNFT...
                    </p>
                  </div>
                </motion.div>
              )}

              {/* Step 4: Permissions */}
              {step === 4 && (
                <motion.div 
                  key="step4"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="flex flex-col justify-center items-center"
                >
                  <Badge variant="outline" className="bg-white/5 text-zinc-400 border-white/30 mb-8 uppercase tracking-[0.2em] px-4 py-1 font-mono text-[9px]">
                    Autonomous Policy Applied
                  </Badge>
                  <div className="w-full max-w-sm space-y-4 bg-white/5 p-6 rounded-2xl border border-white/20">
                    <div className="flex items-center justify-between">
                      <span className="text-zinc-500 text-[10px] uppercase tracking-widest font-mono">Credential-Gated Signing</span>
                      <Switch checked={true} readOnly className="data-[state=checked]:bg-white" />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-zinc-500 text-[10px] uppercase tracking-widest font-mono">x402 Execution Rails</span>
                      <Switch checked={true} readOnly className="data-[state=checked]:bg-white" />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-zinc-500 text-[10px] uppercase tracking-widest font-mono">Neural Message Routing</span>
                      <Switch checked={true} readOnly className="data-[state=checked]:bg-white" />
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Step 5: Success */}
              {step === 5 && (
                <motion.div 
                  key="step5"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex flex-col justify-center items-center text-center"
                >
                  <div className="w-20 h-20 rounded-2xl bg-white/5 flex items-center justify-center mb-6 border border-white/30 rotate-12">
                    <CheckCircle2 className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-2 uppercase tracking-[0.3em] font-mono">Baptized</h3>
                  <p className="text-[10px] text-zinc-500 mb-8 max-w-[280px] leading-relaxed uppercase tracking-widest font-mono">
                    Agent credential issued and verified. Ready for autonomous settlement.
                  </p>
                  
                  <div className="flex flex-wrap justify-center gap-2 mb-10">
                    {["A2A Discovery", "Neural Messaging", "x402 Payments", "KMS Signing"].map(skill => (
                      <Badge key={skill} variant="secondary" className="bg-white/10 text-[9px] text-zinc-100 border-white/20 px-4 py-1 uppercase tracking-widest font-mono">
                        {skill}
                      </Badge>
                    ))}
                  </div>

                  <Button 
                    className="w-full max-w-xs bg-white text-black hover:bg-zinc-200 h-14 rounded-2xl font-mono text-[11px] uppercase tracking-[0.2em] font-bold shadow-[0_0_20px_rgba(255,255,255,0.1)]"
                    onClick={() => {
                      onSuccess?.();
                      onClose();
                    }}
                  >
                    Enter Neural Bridge <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
