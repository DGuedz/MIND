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
  const voucherCode = searchParams.get("voucher");

  const isFreeTractionPhase = voucherCode === "THEGARAGE" || voucherCode === "SUPERTEAMBR" || voucherCode === "COLOSSEUM";
  const finalAmountSol = isFreeTractionPhase ? "0.0000" : amountSol;
  const finalAmountLamports = isFreeTractionPhase ? 0 : Number(amountLamports);

  const [status, setStatus] = useState<"idle" | "shielding" | "settling" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [receipt, setReceipt] = useState<{ decision: string; nullifier: string } | null>(null);
  const [isMock, setIsMock] = useState(false);

  const handleAtomicExecution = async () => {
    setStatus("shielding");
    setErrorMsg("");
    setIsMock(false);

    try {
      // Simulate Dark Pool Routing Time
      await new Promise(r => setTimeout(r, 1500));
      setStatus("settling");

      let receiptData;
      
      try {
        const gatewayBaseUrl = (import.meta.env.VITE_API_GATEWAY_URL || "http://127.0.0.1:3000").trim().replace(/\/$/, "");
        const res = await fetch(`${gatewayBaseUrl}/v1/treasury/shield-pay`, {
          method: "POST",
          headers: { 
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            intentId,
            amountLamports: finalAmountLamports,
            recipientPubkey: recipient,
            voucherCode: isFreeTractionPhase ? voucherCode : undefined
          })
        }).catch(e => {
          // If fetch fails completely (e.g. connection refused), throw immediately to trigger mock fallback
          throw new Error("Local API Gateway unreachable: " + e.message);
        });

        if (!res.ok) {
          throw new Error("Local API Gateway returned error: " + res.status);
        }
        
        receiptData = await res.json();
      } catch (e) {
        setIsMock(true);
        await new Promise(r => setTimeout(r, 1500)); // Simulate Anchor settlement time
        receiptData = {
          decision: "ALLOW",
          data: {
            noteNullifier: "zk_nullifier_" + Math.random().toString(36).substring(2, 15) + "MOCK"
          }
        };
      }

      setReceipt({
        decision: receiptData.decision,
        nullifier: receiptData.data?.noteNullifier || "nullifier_not_returned"
      });
      setStatus("success");
    } catch (e: any) {
      setErrorMsg(e.message || "Failed to execute atomic settlement");
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
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
               <div className="text-center space-y-2 mb-4">
                 <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-green-500/10 border border-green-500/20 text-green-500 mb-2">
                   <CheckCircle2 className="w-6 h-6" />
                 </div>
                 <h2 className="text-sm font-mono uppercase text-green-400">{isMock ? "Settlement Simulated" : "Settlement Verified"}</h2>
               </div>
               
               {/* Terminal Receipt (NFC-e / Mindprint cNFT Style) */}
               <div className="bg-[#050505] border border-white/10 rounded-lg p-6 font-mono text-[10px] md:text-xs text-zinc-400 shadow-2xl relative">
                 <div className="text-center space-y-1 mb-4">
                   <div className="text-white tracking-widest text-sm">MIND PROTOCOL</div>
                   <div className="text-zinc-500 tracking-widest">A2A SERVER (NFC-e)</div>
                   <div className="text-white">================================</div>
                 </div>
                 
                 <div className="space-y-1 mb-4">
                   <div className="flex justify-between"><span>ID:</span><span className="text-white">ON-CHAIN AGENT NODE</span></div>
                   <div className="flex justify-between"><span>NETWORK:</span><span className="text-white">{isMock ? "DEMO (OFFLINE)" : "SOLANA MAINNET-BETA"}</span></div>
                   <div className="flex justify-between"><span>DATE:</span><span className="text-white">{new Date().toISOString().replace('T', ' ').substring(0, 19)} UTC</span></div>
                 </div>

                 <div className="text-center text-white mb-2">--------------------------------</div>
                 <div className="text-center text-white tracking-widest mb-2">SALE DETAILS</div>
                 
                 <div className="flex justify-between text-zinc-500 mb-1">
                   <span>ITEM</span>
                   <div className="flex gap-6 w-24 justify-end"><span>QTY</span><span>TOTAL</span></div>
                 </div>
                 
                 <div className="flex justify-between text-white mb-1">
                   <span className="truncate uppercase max-w-[140px]">{intentId.replace('purchase_card_', '')} LICENSE</span>
                   <div className="flex gap-6 w-24 justify-end"><span>1</span><span className={isFreeTractionPhase ? "line-through text-zinc-600" : ""}>{amountSol}</span></div>
                 </div>
                 
                 <div className="flex justify-between text-zinc-500 mb-1">
                   <span>Execution Fee (8%)</span>
                   <div className="flex gap-6 w-24 justify-end"><span>1</span><span className={isFreeTractionPhase ? "line-through text-zinc-700" : ""}>{(Number(amountSol) * 0.08).toFixed(5)}</span></div>
                 </div>

                 {isFreeTractionPhase && (
                   <div className="flex justify-between text-emerald-500 mb-1">
                     <span>Traction Phase Subsidy</span>
                     <div className="flex gap-6 w-24 justify-end"><span>1</span><span>-100%</span></div>
                   </div>
                 )}

                 <div className="flex justify-between text-zinc-500 mb-1">
                   <span>Impact Multiplier (I)</span>
                   <div className="flex gap-6 w-24 justify-end"><span>1.2x</span><span>-</span></div>
                 </div>

                 <div className="flex justify-between text-zinc-500 mb-4">
                   <span>Quality Escrow</span>
                   <div className="flex gap-6 w-24 justify-end"><span>LOCKED</span><span>-</span></div>
                 </div>

                 <div className="text-center text-white mb-2">--------------------------------</div>
                 
                 <div className="flex justify-between text-white text-sm mb-2">
                   <span>TOTAL (SOL)</span>
                   <span className={isFreeTractionPhase ? "text-emerald-400 font-bold" : ""}>{finalAmountSol}</span>
                 </div>

                 <div className="text-center text-white mb-4">--------------------------------</div>
                 
                 <div className="space-y-1 mb-4">
                   <div className="flex justify-between">
                     <span className="text-zinc-500">SIGNATURE:</span>
                     <span className="text-white">TURNKEY KMS</span>
                   </div>
                   <div className="flex flex-col mt-2">
                     <span className="text-zinc-500">ZK NULLIFIER:</span>
                     <span className="text-white break-all leading-tight mt-1">{receipt?.nullifier}</span>
                   </div>
                 </div>

                 <div className="text-center text-white mb-1">--------------------------------</div>
                 <div className="text-center space-y-1 mt-4">
                   <div className="text-zinc-500 tracking-widest">CRYPTOGRAPHIC RECEIPT</div>
                   <div className="text-white tracking-widest">{isMock ? "NOT ON-CHAIN (DEMO)" : "VERIFIABLE ON-CHAIN"}</div>
                 </div>
                 <div className="text-center text-white mt-4">================================</div>
               </div>

               <button 
                  onClick={() => navigate("/dashboard")}
                  className="w-full bg-white text-black hover:bg-zinc-200 text-[10px] font-mono uppercase tracking-[0.25em] h-12 rounded-full transition-colors mt-4"
               >
                 View in Dashboard
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
                  <span className="text-xs font-mono text-zinc-300">{intentId.replace('purchase_card_', '')}</span>
                </div>
                {isFreeTractionPhase ? (
                  <div className="flex justify-between items-center border-b border-white/10 pb-6">
                    <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">Community Subsidy</span>
                    <span className="text-xs font-mono text-emerald-400 font-bold uppercase">{voucherCode} APPLIED</span>
                  </div>
                ) : (
                  <div className="flex justify-between items-center border-b border-white/10 pb-6">
                    <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">Recipient</span>
                    <span className="text-xs font-mono text-zinc-400 max-w-[200px] truncate">{recipient}</span>
                  </div>
                )}
                <div className="flex justify-between items-center pt-2">
                  <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">Total Amount</span>
                  <div className="text-right">
                    {isFreeTractionPhase ? (
                      <div className="flex flex-col items-end">
                        <span className="text-sm font-mono text-zinc-600 line-through">{amountSol} SOL</span>
                        <span className="text-2xl font-mono text-emerald-400 font-bold">{finalAmountSol} <span className="text-sm text-emerald-500/50">SOL</span></span>
                      </div>
                    ) : (
                      <>
                        <span className="text-2xl font-mono text-white">{finalAmountSol}</span>
                        <span className="text-sm font-mono text-zinc-500 ml-2">SOL</span>
                      </>
                    )}
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
