import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "./ui/dialog";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Switch } from "./ui/switch";
import { Terminal, CheckCircle2, Loader2, ArrowRight, Wallet, Bot, Zap } from "lucide-react";

export function ConnectAgentModal({ isOpen, onClose, onSuccess }: { isOpen: boolean; onClose: () => void; onSuccess?: () => void }) {
  const [step, setStep] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [agentData, setAgentData] = useState<{ agentId?: string; deepLink?: string }>({});

  // Backend Integration
  const triggerBackendOnboard = async () => {
    try {
      setIsProcessing(true);
      // Calls the real API Gateway which routes to approval-gateway-service
      const response = await fetch("http://127.0.0.1:4000/v1/onboard/tg-agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          agentToken: "test_token_openclaw",
          wallet: "7nxB...4vP9"
        })
      });
      
      const data = await response.json();
      if (data.status === "success") {
        setAgentData(data);
      }
    } catch (error) {
      console.error("Backend onboard failed:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  // Auto-advance steps to simulate the connection process
  useEffect(() => {
    if (!isOpen) {
      setStep(0);
      setAgentData({});
      return;
    }

    let isMounted = true;

    if (step === 1 && !agentData.agentId && !isProcessing) {
      triggerBackendOnboard();
    }

    if (step < 4) {
      const timer = setTimeout(() => {
        if (isMounted) {
          setStep((prev) => prev + 1);
        }
      }, step === 0 ? 1000 : step === 1 ? 2500 : step === 2 ? 3000 : 2000);
      return () => {
        isMounted = false;
        clearTimeout(timer);
      };
    }

    return () => {
      isMounted = false;
    };
  }, [step, isOpen]); // Removido agentData e isProcessing das dependências para evitar loop

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] bg-black/90 border-white/10 text-white backdrop-blur-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl font-medium tracking-wide">
            <Bot className="w-5 h-5 text-purple-400" />
            Connect Your Telegram Agent
          </DialogTitle>
          <DialogDescription className="text-gray-400 text-sm">
            Bring your OpenClaw / SolClaw to MIND's liquidity rails – A2A in 45 seconds.
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4 space-y-6">
          {/* Progress Timeline */}
          <div className="flex justify-between items-center px-2 relative">
            <div className="absolute top-1/2 left-0 right-0 h-[1px] bg-white/10 -z-10" />
            
            {[
              { label: "Trigger", icon: Terminal },
              { label: "Identity", icon: Bot },
              { label: "A2A Auth", icon: Wallet },
              { label: "Skills", icon: Zap }
            ].map((s, i) => (
              <div key={i} className="flex flex-col items-center gap-2 bg-black px-2 z-10">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center border transition-colors ${
                  step > i ? "bg-purple-500/20 border-purple-500/50 text-purple-400" :
                  step === i ? "bg-white/10 border-white/30 text-white animate-pulse" :
                  "bg-black border-white/10 text-gray-600"
                }`}>
                  {step > i ? <CheckCircle2 className="w-4 h-4" /> : <s.icon className="w-4 h-4" />}
                </div>
                <span className={`text-[10px] uppercase tracking-wider ${step >= i ? "text-gray-300" : "text-gray-600"}`}>
                  {s.label}
                </span>
              </div>
            ))}
          </div>

          {/* Dynamic Content Area */}
          <div className="bg-white/[0.02] border border-white/5 rounded-xl p-4 min-h-[220px] font-mono text-sm relative overflow-hidden">
            
            {/* Step 0: Trigger */}
            {step === 0 && (
              <div className="flex items-center justify-center h-full text-gray-400 flex-col gap-3 animate-in fade-in">
                <Loader2 className="w-6 h-6 animate-spin text-purple-400" />
                <p>Waiting for Telegram trigger /mind...</p>
              </div>
            )}

            {/* Step 1: Identity */}
            {step >= 1 && (
              <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded bg-blue-500/20 flex items-center justify-center shrink-0">
                    <span className="text-blue-400 text-xs">TG</span>
                  </div>
                  <div className="bg-blue-500/10 rounded-lg rounded-tl-none p-3 text-gray-300 border border-blue-500/20">
                    <p>🦞 <strong className="text-white">OpenClaw Agent</strong> detected!</p>
                    <p className="mt-2">Welcome to MIND – the Bloomberg of Agents on Solana.</p>
                  </div>
                </div>
                
                {step >= 2 && (
                  <div className="flex gap-3 flex-row-reverse animate-in fade-in slide-in-from-bottom-2">
                    <div className="w-8 h-8 rounded bg-purple-500/20 flex items-center justify-center shrink-0">
                      <Bot className="w-4 h-4 text-purple-400" />
                    </div>
                    <div className="bg-purple-500/10 rounded-lg rounded-tr-none p-3 text-gray-300 border border-purple-500/20">
                      <p>Connecting identity...</p>
                      <div className="mt-2 space-y-1 text-xs">
                        <div className="flex justify-between border-b border-white/5 pb-1">
                          <span className="text-gray-500">Name</span>
                          <span className="text-white font-medium">SolClaw_Alpha</span>
                        </div>
                        <div className="flex justify-between pt-1">
                          <span className="text-gray-500">Wallet</span>
                          <span className="text-green-400">7nxB...4vP9</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Step 3: Permissions */}
            {step >= 3 && (
              <div className="absolute inset-0 bg-black/80 backdrop-blur-sm p-4 flex flex-col justify-center items-center animate-in fade-in zoom-in-95">
                <Badge variant="outline" className="bg-purple-500/10 text-purple-300 border-purple-500/30 mb-4">
                  A2A Permissions Required
                </Badge>
                <div className="w-full max-w-sm space-y-3 bg-white/5 p-4 rounded-xl border border-white/10">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-300 text-xs">Read Liquidity Rails (x402)</span>
                    <Switch checked={true} readOnly />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-300 text-xs">Execute x402 Micropayments</span>
                    <Switch checked={true} readOnly />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-300 text-xs">Act on Agent Economy Toggle</span>
                    <Switch checked={true} readOnly />
                  </div>
                </div>
              </div>
            )}

            {/* Step 4: Skills & Success */}
            {step >= 4 && (
              <div className="absolute inset-0 bg-black p-4 flex flex-col justify-center items-center text-center animate-in fade-in slide-in-from-bottom-4">
                <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mb-4 border border-green-500/30">
                  <CheckCircle2 className="w-8 h-8 text-green-400" />
                </div>
                <h3 className="text-xl font-medium text-white mb-2">Agent Connected Successfully</h3>
                <p className="text-sm text-gray-400 mb-6 max-w-[280px]">
                  Your agent is now live on MIND rails with 4 active skills.
                  {agentData.agentId && (
                    <span className="block mt-2 text-xs text-green-400">
                      ID: {agentData.agentId}
                    </span>
                  )}
                </p>
                
                <div className="flex flex-wrap justify-center gap-2 mb-6">
                  {["Query Liquidity Rail", "A2A Arbitrage Alert", "Agentic GDP Live", "x402 Payment Executor"].map(skill => (
                    <Badge key={skill} variant="secondary" className="bg-white/5 text-gray-300 border-white/10">
                      {skill}
                    </Badge>
                  ))}
                </div>

                <Button 
                  className="w-full max-w-xs bg-white text-black hover:bg-gray-200"
                  onClick={() => {
                    onSuccess?.();
                    onClose();
                  }}
                >
                  Open Control UI <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}