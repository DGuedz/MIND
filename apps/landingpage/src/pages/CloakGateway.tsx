import { useState } from "react";
import { motion } from "framer-motion";
import { ShieldCheck, ArrowRight, Loader2, KeyRound, Lock, CheckCircle2, XCircle } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";

export function CloakGatewayPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const searchParams = new URLSearchParams(location.search);
  
  const intentId = searchParams.get("intentId") || "unknown_intent";
  const amountLamports = searchParams.get("amountLamports") || "0";
  const amountSol = (Number(amountLamports) / 1e9).toFixed(4);
  const recipient = searchParams.get("recipient") || "unknown";

  const [status, setStatus] = useState<"idle" | "shielding" | "settling" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [receipt, setReceipt] = useState<{ decision: string; nullifier: string } | null>(null);

  const handleAtomicExecution = async () => {
    setStatus("shielding");
    setErrorMsg("");

    try {
      // Simulate Dark Pool Routing Time
      await new Promise(r => setTimeout(r, 1500));
      setStatus("settling");

      const res = await fetch("http://127.0.0.1:3000/v1/treasury/shield-pay", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "x-api-key": "EPHEMERAL_SESSION_KEY_MOCK"
        },
        body: JSON.stringify({
          intentId,
          amountLamports: Number(amountLamports),
          recipientPubkey: recipient
        })
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Shield-pay execution failed");
      }

      const data = await res.json();
      setReceipt({
        decision: data.decision,
        nullifier: data.data?.noteNullifier || "nullifier_not_returned"
      });
      setStatus("success");
    } catch (e: any) {
      console.error(e);
      setErrorMsg(e.message || "Failed to connect to API Gateway");
      setStatus("error");
    }
  };

  return (
    <div className="min-h-screen bg-[#020202] text-white pt-32 pb-20 px-6 flex flex-col items-center justify-center">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-xl"
      >
        {/* Header */}
        <div className="text-center mb-12 space-y-4">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-zinc-900 border border-white/10 mb-4">
            <ShieldCheck className="w-8 h-8 text-zinc-400" />
          </div>
          <h1 className="text-3xl font-mono uppercase tracking-tight">Atomic Settlement</h1>
          <p className="text-zinc-500 font-mono text-[10px] tracking-widest uppercase">
            Powered by Cloak Zero-Knowledge Engine
          </p>
        </div>

        {/* Receipt / Action Card */}
        <div className="bg-black/40 border border-white/10 rounded-3xl p-8 space-y-8 backdrop-blur-xl relative overflow-hidden">
          
          {/* Animated Background Gradient for active states */}
          {status === "shielding" && (
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full animate-[shimmer_2s_infinite]" />
          )}

          {status === "success" ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8 text-center py-8">
               <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-500/10 border border-green-500/20 text-green-500 mb-2">
                 <CheckCircle2 className="w-10 h-10" />
               </div>
               <div className="space-y-2">
                 <h2 className="text-xl font-mono uppercase text-green-400">Settlement Verified</h2>
                 <p className="text-zinc-500 text-sm">Mindprint cNFT successfully minted.</p>
               </div>
               
               <div className="bg-black/60 rounded-xl p-6 text-left space-y-4 border border-white/5">
                 <div className="space-y-1">
                   <div className="text-[9px] font-mono text-zinc-600 uppercase tracking-widest">Decision Engine</div>
                   <div className="text-sm font-mono text-zinc-300">{receipt?.decision}</div>
                 </div>
                 <div className="space-y-1">
                   <div className="text-[9px] font-mono text-zinc-600 uppercase tracking-widest">Zero-Knowledge Nullifier</div>
                   <div className="text-xs font-mono text-zinc-400 break-all">{receipt?.nullifier}</div>
                 </div>
               </div>

               <button 
                  onClick={() => navigate("/app")}
                  className="w-full bg-white text-black hover:bg-zinc-200 text-[10px] font-mono uppercase tracking-[0.25em] h-12 rounded-full transition-colors mt-4"
               >
                 Return to Registry
               </button>
            </motion.div>
          ) : status === "error" ? (
             <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8 text-center py-8">
               <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-red-500/10 border border-red-500/20 text-red-500 mb-2">
                 <XCircle className="w-10 h-10" />
               </div>
               <div className="space-y-2">
                 <h2 className="text-xl font-mono uppercase text-red-400">Execution Blocked</h2>
                 <p className="text-zinc-400 text-sm font-mono break-words">{errorMsg}</p>
               </div>
               <button 
                  onClick={() => setStatus("idle")}
                  className="w-full bg-white/10 text-white hover:bg-white/20 border border-white/20 text-[10px] font-mono uppercase tracking-[0.25em] h-12 rounded-full transition-colors mt-4"
               >
                 Try Again
               </button>
            </motion.div>
          ) : (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
              {/* Order Details */}
              <div className="space-y-6">
                <div className="flex justify-between items-center border-b border-white/10 pb-6">
                  <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">Intent ID</span>
                  <span className="text-xs font-mono text-zinc-300">{intentId}</span>
                </div>
                <div className="flex justify-between items-center border-b border-white/10 pb-6">
                  <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">Recipient</span>
                  <span className="text-xs font-mono text-zinc-400 max-w-[200px] truncate">{recipient}</span>
                </div>
                <div className="flex justify-between items-center pt-2">
                  <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">Total Amount</span>
                  <div className="text-right">
                    <span className="text-2xl font-mono text-white">{amountSol}</span>
                    <span className="text-sm font-mono text-zinc-500 ml-2">SOL</span>
                  </div>
                </div>
              </div>

              {/* Security Badges */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white/5 rounded-xl p-4 flex items-center gap-3">
                  <Lock className="w-4 h-4 text-zinc-400" />
                  <div>
                    <div className="text-[8px] font-mono text-zinc-500 uppercase tracking-widest">Privacy</div>
                    <div className="text-[10px] font-mono text-zinc-300">Shielded UTXO</div>
                  </div>
                </div>
                <div className="bg-white/5 rounded-xl p-4 flex items-center gap-3">
                  <KeyRound className="w-4 h-4 text-zinc-400" />
                  <div>
                    <div className="text-[8px] font-mono text-zinc-500 uppercase tracking-widest">Signer</div>
                    <div className="text-[10px] font-mono text-zinc-300">Session Key</div>
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <button
                onClick={handleAtomicExecution}
                disabled={status !== "idle"}
                className={`w-full relative flex items-center justify-center gap-3 h-14 rounded-full text-[10px] font-mono uppercase tracking-[0.25em] transition-all duration-500 ${
                  status === "idle" 
                    ? "bg-white text-black hover:bg-zinc-200" 
                    : "bg-zinc-800 text-zinc-500 cursor-not-allowed border border-white/10"
                }`}
              >
                {status === "idle" ? (
                  <>
                    Confirm & Shield Pay
                    <ArrowRight className="w-4 h-4" />
                  </>
                ) : status === "shielding" ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Generating Zero-Knowledge Proof...
                  </>
                ) : (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Settling on Anchor...
                  </>
                )}
              </button>
            </motion.div>
          )}
        </div>
        
        {/* Footer info */}
        <div className="mt-8 text-center">
          <p className="text-[9px] font-mono text-zinc-600 uppercase tracking-widest">
            100% On-chain • Non-Custodial • Policy Gated
          </p>
        </div>
      </motion.div>
    </div>
  );
}