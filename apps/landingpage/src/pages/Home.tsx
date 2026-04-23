import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "../components/ui/button";
import { ConnectAgentModal } from "../components/ConnectAgentModal";
import { Badge } from "../components/ui/badge";
import { motion, useMotionValue, useTransform, MotionValue, AnimatePresence, useInView, useScroll, useMotionValueEvent } from "framer-motion";
import { ArrowDown } from "lucide-react";
import { Zap, Loader2, ArrowRight, CheckCircle2, ShieldCheck } from "lucide-react";
import { VerticalsMarketplaceSlider } from "../components/VerticalsMarketplaceSlider";

// Component for Metallic Reflective Text synced with Scroll
function MetallicText({ children, className, progress }: { children: React.ReactNode, className?: string, progress?: MotionValue<number> }) {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const handleMouseMove = (e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    mouseX.set(e.clientX - rect.left);
    mouseY.set(e.clientY - rect.top);
  };

  // Se progress for fornecido, o brilho reage ao scroll. Caso contrário, reage ao mouse.
  const backgroundPosition = useTransform(
    progress || mouseX,
    (v: any) => progress ? `${Number(v) * 200}% 50%` : `${Number(mouseX.get()) / 10}% ${Number(mouseY.get()) / 10}%`
  );

  return (
    <motion.span
      onMouseMove={handleMouseMove}
      className={`relative inline-block bg-clip-text text-transparent bg-gradient-to-r from-white via-zinc-500 to-white bg-[length:200%_200%] transition-all duration-300 cursor-default ${className || ''}`}
      style={{ backgroundPosition }}
    >
      {children}
    </motion.span>
  );
}

// Neural Message Bridge: Terminal interativo para envio de mensagens assinadas
function NeuralMessageBridge() {
  const [messages, setMessages] = useState<any[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [txComplete, setTxComplete] = useState(false);

  const simulateA2A = async () => {
    setIsProcessing(true);
    setTxComplete(false);
    
    // 1. Intent Detection
    setMessages([{ type: 'intent', title: 'A2A INTENT BROADCAST', body: 'JSON: { action: "COMPUTE", amount: 0.5 SOL }' }]);
    await new Promise(r => setTimeout(r, 1500));

    // 2. Credential Gating
    setMessages(prev => [...prev, { type: 'credential', title: 'CREDENTIAL VALIDATED', body: 'NFT Found: 4j67...7uk5c\nStatus: Institutional (AUTO-EXEC)' }]);
    await new Promise(r => setTimeout(r, 1500));

    // 3. x402 Settlement
    setMessages(prev => [...prev, { type: 'settlement', title: 'ATOMIC LIQUIDATION', body: 'x402: 0.5 SOL\nSplit: 92% Node / 8% MIND' }]);
    await new Promise(r => setTimeout(r, 2000));

    // 4. Proof Bundle
    setMessages(prev => [...prev, { type: 'proof', title: 'PROOF BUNDLE GENERATED', body: 'TX: 5tWq...9pZm\nEvidence: Immutable cNFT Receipt' }]);
    setIsProcessing(false);
    setTxComplete(true);
  };

  return (
    <div className="bg-zinc-950/50 border border-white/20 rounded-3xl p-6 font-mono text-[10px] min-h-[500px] flex flex-col shadow-2xl backdrop-blur-md">
      <div className="flex justify-between items-center mb-6 border-b border-white/20 pb-4">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
          <span className="uppercase tracking-[0.3em] text-zinc-400">Neural Bridge v1.0</span>
        </div>
        <Badge variant="outline" className="text-[8px] border-zinc-800 text-zinc-500 uppercase tracking-widest">Only Agents</Badge>
      </div>

      <div className="flex-1 space-y-4 mb-6 overflow-y-auto max-h-[320px] scrollbar-hide">
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-zinc-700 opacity-50 space-y-4">
            <Zap className="w-8 h-8" />
            <p className="uppercase tracking-[0.2em]">Ready for Neural Broadcast</p>
          </div>
        )}
        <AnimatePresence>
          {messages.map((msg, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -5 }}
              animate={{ opacity: 1, x: 0 }}
              className={`p-3 rounded-lg border ${
                msg.type === 'proof' ? 'border-white/20 bg-white/5' : 'border-white/20 bg-black/40'
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                <span className={`font-bold tracking-widest ${
                  msg.type === 'intent' ? 'text-zinc-500' :
                  msg.type === 'credential' ? 'text-zinc-300' :
                  msg.type === 'settlement' ? 'text-zinc-400' : 'text-white'
                }`}>{msg.title}</span>
              </div>
              <pre className="text-zinc-500 leading-relaxed">{msg.body}</pre>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <div className="space-y-4">
        {!txComplete ? (
          <Button 
            onClick={simulateA2A} 
            disabled={isProcessing}
            className="w-full bg-white text-black hover:bg-zinc-200 h-14 rounded-2xl uppercase tracking-[0.2em] font-bold text-[11px]"
          >
            {isProcessing ? (
              <span className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" /> Processing Neural Split...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                Broadcast Neural Intent <ArrowRight className="w-4 h-4" />
              </span>
            )}
          </Button>
        ) : (
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-zinc-900/50 border border-zinc-800 text-center">
              <CheckCircle2 className="w-6 h-6 text-white mx-auto mb-2" />
              <p className="uppercase tracking-widest text-zinc-400 text-[9px]">Settlement Complete</p>
            </div>
            <Button 
              onClick={() => { setMessages([]); setTxComplete(false); }}
              variant="outline"
              className="w-full border-white/30 text-zinc-500 hover:bg-white/5 h-12 rounded-2xl uppercase tracking-[0.2em] text-[9px]"
            >
              Clear Neural Buffer
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

// Dexter Data Agent: The Grid of Truth (Animated SVG)
function DexterCardSVG({ isHovered }: { isHovered: boolean }) {
  const [pulse, setPulse] = useState(0);
  
  useEffect(() => {
    const interval = setInterval(() => {
      setPulse(p => (p + 1) % 100);
    }, 100);
    return () => clearInterval(interval);
  }, []);

  return (
    <svg width="100%" height="100%" viewBox="0 0 500 667" xmlns="http://www.w3.org/2000/svg" className="bg-[#050505]">
      <defs>
        <radialGradient id="dexterGrad" cx="50%" cy="50%" r="50%">
          <stop offset="0%" style={{ stopColor: "#ffffff", stopOpacity: 0.15 }} />
          <stop offset="100%" style={{ stopColor: "#050505", stopOpacity: 0 }} />
        </radialGradient>
      </defs>
      <rect width="500" height="667" fill="url(#dexterGrad)" />
      
      {/* Neural Data Grid */}
      <g opacity={isHovered ? 0.9 : 0.4}>
        {Array.from({ length: 15 }).map((_, i) => 
          Array.from({ length: 20 }).map((_, j) => {
            const x = 40 + i * 30;
            const y = 40 + j * 30;
            const seed = (i * 20 + j + pulse) % 100;
            const isActive = seed > 92;
            const opacity = isActive ? 0.8 : 0.05;
            const r = isActive ? 1.5 : 0.5;
            
            return (
              <g key={`${i}-${j}`}>
                <motion.circle 
                  cx={x} cy={y} r={r} 
                  fill="#ffffff" 
                  animate={{ opacity: isHovered ? opacity * 1.5 : opacity }}
                  transition={{ duration: 0.5 }}
                />
                {isActive && isHovered && (
                  <motion.line 
                    x1={x} y1={y} x2={x + 30} y2={y + 30} 
                    stroke="#ffffff" strokeWidth="0.2" 
                    initial={{ pathLength: 0, opacity: 0 }}
                    animate={{ pathLength: 1, opacity: 0.2 }}
                    transition={{ duration: 0.8 }}
                  />
                )}
              </g>
            );
          })
        )}
      </g>
      
      {/* Data Intelligence Elements */}
      {isHovered && (
        <g className="font-mono text-[8px]" fill="#ffffff" opacity="0.4">
          <text x="50" y="50">RAW_FEED: CONNECTED</text>
          <text x="50" y="70">SENTIMENT: 0.82</text>
          <text x="50" y="90">VOL_24H: 1.2M SOL</text>
          <motion.path 
            d="M 400,50 L 450,50 L 450,100" 
            fill="none" stroke="#ffffff" strokeWidth="0.5" 
          />
        </g>
      )}

      {/* Scanning Line (Loop) */}
      <motion.rect 
        width="500" height="1" 
        fill="#ffffff" 
        opacity="0.2"
        animate={{ y: [0, 667] }}
        transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
      />

      <text x="50" y="600" fontFamily="monospace" fontSize="12" fill="#a1a1aa" letterSpacing="4" opacity="0.6">DEXTER // DATA_GRID</text>
    </svg>
  );
}

// Volan Yield Agent: The Multi-Layered Growth (Animated SVG)
function VolanCardSVG({ isHovered }: { isHovered: boolean }) {
  return (
    <svg width="100%" height="100%" viewBox="0 0 500 667" xmlns="http://www.w3.org/2000/svg" className="bg-[#050505]">
      <g transform="translate(250, 300)">
        {/* Yield Stacking Visual */}
        {Array.from({ length: 5 }).map((_, i) => (
          <motion.rect
            key={`bar-${i}`}
            x={-100 + i * 45}
            y={20}
            width="30"
            height={-40 - (i * 20)}
            fill="none"
            stroke="#ffffff"
            strokeWidth="0.5"
            opacity={isHovered ? 0.6 : 0.1}
            animate={{ height: isHovered ? [-40 - (i * 20), -80 - (i * 20), -40 - (i * 20)] : -40 - (i * 20) }}
            transition={{ duration: 2, repeat: Infinity, delay: i * 0.2 }}
          />
        ))}

        {Array.from({ length: 12 }).map((_, i) => (
          <motion.circle
            key={i}
            r={20 + i * 20}
            fill="none"
            stroke="#ffffff"
            strokeWidth="0.5"
            strokeDasharray={10 + i * 5}
            animate={{ 
              rotate: i % 2 === 0 ? 360 : -360,
              opacity: isHovered ? (0.8 - i * 0.05) : (0.2 - i * 0.02)
            }}
            transition={{ 
              rotate: { duration: 10 + i * 2, repeat: Infinity, ease: "linear" },
              opacity: { duration: 0.5 }
            }}
          />
        ))}
      </g>

      {/* Yield Info */}
      {isHovered && (
        <g className="font-mono text-[8px]" fill="#ffffff" opacity="0.4">
          <text x="350" y="50">APY: +14.2%</text>
          <text x="350" y="70">TVL: $42.5M</text>
          <text x="350" y="90">STRAT: KAMINO_JIT</text>
        </g>
      )}

      <text x="50" y="600" fontFamily="monospace" fontSize="12" fill="#a1a1aa" letterSpacing="4" opacity="0.6">VOLAN // YIELD_STACK</text>
    </svg>
  );
}

// Krios Risk Agent: The Intent Firewall (Animated SVG)
function KriosCardSVG({ isHovered }: { isHovered: boolean }) {
  return (
    <svg width="100%" height="100%" viewBox="0 0 500 667" xmlns="http://www.w3.org/2000/svg" className="bg-[#050505]">
      <g opacity={isHovered ? 0.9 : 0.5}>
        {/* Security Shield Elements */}
        <motion.path
          d="M 250,150 L 300,180 L 300,250 L 250,280 L 200,250 L 200,180 Z"
          fill="none"
          stroke="#ffffff"
          strokeWidth="0.5"
          animate={{ 
            opacity: isHovered ? [0.2, 0.8, 0.2] : 0.1,
            scale: isHovered ? [1, 1.05, 1] : 1
          }}
          transition={{ duration: 3, repeat: Infinity }}
        />

        {Array.from({ length: 10 }).map((_, i) => {
          const y = 80 + i * 50;
          return (
            <g key={i}>
              <motion.line 
                x1="50" y1={y} x2="450" y2={y} 
                stroke="#ffffff" strokeWidth="0.5" 
                animate={{ opacity: isHovered ? 0.3 : 0.1 }}
              />
              {i % 2 === 0 && (
                <motion.rect 
                  x={100 + i * 20} y={y - 10} width="15" height="15" 
                  fill="none" stroke="#ffffff" strokeWidth="0.5"
                  animate={{ 
                    x: isHovered ? [100 + i * 20, 350, 100 + i * 20] : 100 + i * 20,
                    rotate: 45 
                  }}
                  transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                />
              )}
            </g>
          );
        })}
      </g>

      {/* Risk Metrics */}
      {isHovered && (
        <g className="font-mono text-[8px]" fill="#ffffff" opacity="0.4">
          <text x="50" y="50">STATUS: PROTECTED</text>
          <text x="50" y="70">THREAT_LEVEL: LOW</text>
          <text x="50" y="90">GATE: POLICY_ENFORCED</text>
        </g>
      )}

      <text x="50" y="600" fontFamily="monospace" fontSize="12" fill="#a1a1aa" letterSpacing="4" opacity="0.6">KRIOS // RISK_FIREWALL</text>
    </svg>
  );
}

// Escrow Settlement Flow: The Atomic Lifecycle (Animated SVG)
function EscrowFlowSVG() {
  const [activeStep, setActiveStep] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveStep((prev) => (prev + 1) % 4);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  const steps = [
    { x: 50, y: 50, label: "REQUEST", info: "INTENT: SIGNED", detail: "0.5 SOL // x402" },
    { x: 150, y: 150, label: "LOCK", info: "ESCROW: ACTIVE", detail: "PROGRAM_ID: MIND...v1" },
    { x: 250, y: 250, label: "PROVE", info: "PROOF: BUNDLED", detail: "METAPLEX_CORE // cNFT" },
    { x: 350, y: 350, label: "RELEASE", info: "SETTLEMENT: 92/8", detail: "TX: 5tWq...9pZm" }
  ];

  return (
    <svg width="100%" height="100%" viewBox="0 0 500 667" xmlns="http://www.w3.org/2000/svg" className="bg-[#050505]">
      <defs>
        <radialGradient id="escrowGrad" cx="50%" cy="50%" r="50%">
          <stop offset="0%" style={{ stopColor: "#ffffff", stopOpacity: 0.1 }} />
          <stop offset="100%" style={{ stopColor: "#050505", stopOpacity: 0 }} />
        </radialGradient>
        <filter id="glow">
          <feGaussianBlur stdDeviation="2.5" result="coloredBlur"/>
          <feMerge>
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>
      <rect width="500" height="667" fill="url(#escrowGrad)" />
      
      {/* Background Grid */}
      <g opacity="0.05">
        {Array.from({ length: 10 }).map((_, i) => (
          <line key={`h-${i}`} x1="0" y1={i * 66.7} x2="500" y2={i * 66.7} stroke="#ffffff" strokeWidth="0.5" />
        ))}
      </g>

      <g transform="translate(60, 120)">
        {/* Connection Path */}
        <motion.path
          d="M 50,50 Q 150,50 150,150 T 250,250 T 350,350"
          fill="none"
          stroke="#ffffff"
          strokeWidth="1"
          opacity="0.1"
        />

        {/* Pulsing Nodes & Information Labels */}
        {steps.map((node, i) => {
          const isRightSide = node.x > 200;
          const textX = isRightSide ? node.x - 120 : node.x + 20;
          const textAnchor = isRightSide ? "end" : "start";

          return (
            <g key={i}>
              {/* Node Visual */}
              <motion.circle
                cx={node.x} cy={node.y} r={4}
                fill="#ffffff"
                filter="url(#glow)"
                animate={{ 
                  opacity: activeStep === i ? 1 : 0.2, 
                  scale: activeStep === i ? 1.5 : 1 
                }}
                transition={{ duration: 0.5 }}
              />
              {activeStep === i && (
                <motion.circle
                  cx={node.x} cy={node.y} r={12}
                  fill="none"
                  stroke="#ffffff"
                  strokeWidth="0.5"
                  initial={{ opacity: 0.5, scale: 1 }}
                  animate={{ opacity: 0, scale: 2 }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                />
              )}

              {/* Sincronized Minimalist Info */}
              <AnimatePresence>
                {activeStep === i && (
                  <motion.g
                    initial={{ opacity: 0, x: isRightSide ? -10 : 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: isRightSide ? 10 : -10 }}
                    className="font-mono"
                  >
                    <text x={textX} y={node.y - 5} fontSize="8" fill="#ffffff" fontWeight="bold" opacity="0.8" textAnchor={textAnchor}>
                      {node.label}
                    </text>
                    <text x={textX} y={node.y + 10} fontSize="6" fill="#a1a1aa" opacity="0.6" textAnchor={textAnchor}>
                      {node.info}
                    </text>
                    <text x={textX} y={node.y + 22} fontSize="6" fill="#525252" opacity="0.4" textAnchor={textAnchor}>
                      {node.detail}
                    </text>
                  </motion.g>
                )}
              </AnimatePresence>
            </g>
          );
        })}

        {/* Moving Asset Particle */}
        <motion.circle
          r="2.5"
          fill="#ffffff"
          filter="url(#glow)"
          animate={{
            offsetDistance: ["0%", "100%"]
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "linear"
          }}
          style={{
            offsetPath: "path('M 50,50 Q 150,50 150,150 T 250,250 T 350,350')"
          }}
        />
      </g>

      <text x="50" y="620" fontFamily="monospace" fontSize="10" fill="#a1a1aa" letterSpacing="4" opacity="0.5">ESCROW // ATOMIC_SETTLEMENT_LOOP</text>
    </svg>
  );
}

// Builders Matrix Visual: The Product-Led Design (Animated SVG)
function BuildersMatrixSVG({ isVisible }: { isVisible?: boolean }) {
  const [activeStep, setActiveStep] = useState(0);

  useEffect(() => {
    if (!isVisible) return;
    const interval = setInterval(() => {
      setActiveStep((prev) => (prev + 1) % 3);
    }, 4000);
    return () => clearInterval(interval);
  }, [isVisible]);

  const steps = [
    { 
      title: "Define price and splits", 
      desc: "Set fee, payout addresses, and distribution percentages as a contract constraint." 
    },
    { 
      title: "Attach evidence requirements", 
      desc: "Specify the proof bundle that must exist before any release can occur." 
    },
    { 
      title: "Deliver under escrow", 
      desc: "Requester funds escrow, execution runs, proof is anchored, and release is automatic." 
    }
  ];

  return (
    <svg width="100%" height="100%" viewBox="0 0 500 667" xmlns="http://www.w3.org/2000/svg" className="bg-[#050505]">
      <defs>
        <radialGradient id="buildersGrad" cx="50%" cy="50%" r="50%">
          <stop offset="0%" style={{ stopColor: "#ffffff", stopOpacity: 0.08 }} />
          <stop offset="100%" style={{ stopColor: "#050505", stopOpacity: 0 }} />
        </radialGradient>
      </defs>
      <rect width="500" height="667" fill="url(#buildersGrad)" />

      {/* Grid Background */}
      <g opacity="0.03">
        {Array.from({ length: 20 }).map((_, i) => (
          <line key={`v-${i}`} x1={i * 25} y1="0" x2={i * 25} y2="667" stroke="#ffffff" strokeWidth="0.5" />
        ))}
        {Array.from({ length: 27 }).map((_, i) => (
          <line key={`h-${i}`} x1="0" y1={i * 25} x2="500" y2={i * 25} stroke="#ffffff" strokeWidth="0.5" />
        ))}
      </g>

      {/* Title Section within SVG */}
      <g transform="translate(40, 60)">
        <text fontSize="8" fill="#525252" fontFamily="monospace" letterSpacing="3">CONTRACTUAL LOGIC</text>
        <text y="20" fontSize="18" fill="#ffffff" fontWeight="bold">Execution Constraints.</text>
      </g>

      <g transform="translate(40, 140) scale(0.95)">
        {/* STEP 01: SPLITS & CONSTRAINTS */}
        <motion.g 
          animate={{ opacity: activeStep === 0 ? 1 : 0.05 }}
          transition={{ duration: 0.8 }}
        >
          <g transform="translate(0, 0)">
            <text fontSize="10" fill="#ffffff" fontFamily="monospace" fontWeight="bold">01 // {steps[0].title.toUpperCase()}</text>
            <text y="15" fontSize="8" fill="#a1a1aa" fontFamily="sans-serif" opacity="0.8">{steps[0].desc}</text>
            
            <g transform="translate(0, 40)">
              <rect width="350" height="1" fill="#1a1a1a" />
              <motion.rect 
                width={activeStep === 0 ? 320 : 320} 
                height="1" fill="#ffffff" 
                initial={{ scaleX: 0 }}
                animate={{ scaleX: activeStep === 0 ? 1 : 1 }}
                style={{ originX: 0 }}
                transition={{ duration: 1.5, ease: "circOut" }}
              />
              <circle cx="0" cy="0.5" r="1.5" fill="#ffffff" />
              <circle cx="320" cy="0.5" r="1.5" fill="#ffffff" />
              <text y="15" fontSize="8" fill="#ffffff" fontFamily="monospace">92% PROVIDER</text>
              <text x="350" y="15" fontSize="8" fill="#a1a1aa" fontFamily="monospace" textAnchor="end">8% MIND</text>
            </g>
          </g>
        </motion.g>

        {/* STEP 02: EVIDENCE / PROOF BUNDLE */}
        <motion.g 
          transform="translate(0, 140)"
          animate={{ opacity: activeStep === 1 ? 1 : 0.05 }}
          transition={{ duration: 0.8 }}
        >
          <g transform="translate(0, 0)">
            <text fontSize="10" fill="#ffffff" fontFamily="monospace" fontWeight="bold">02 // {steps[1].title.toUpperCase()}</text>
            <text y="15" fontSize="8" fill="#a1a1aa" fontFamily="sans-serif" opacity="0.8">{steps[1].desc}</text>
            
            <g transform="translate(0, 35)">
              <rect width="100" height="80" fill="none" stroke="#ffffff" strokeWidth="0.5" opacity="0.1" />
              {Array.from({ length: 4 }).map((_, i) => (
                <motion.line 
                  key={i}
                  x1="10" y1={15 + i * 15} x2="90" y2={15 + i * 15}
                  stroke="#ffffff" strokeWidth="0.5"
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={{ 
                    pathLength: activeStep === 1 ? 1 : 0,
                    opacity: activeStep === 1 ? 0.3 : 0
                  }}
                  transition={{ duration: 0.5, delay: i * 0.1 }}
                />
              ))}
              <motion.path
                d="M 110,35 L 118,43 L 135,25"
                fill="none" stroke="#ffffff" strokeWidth="1"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: activeStep === 1 ? 1 : 0 }}
                transition={{ duration: 0.5, delay: 1 }}
              />
              <g transform="translate(110, 60)">
                <text fontSize="8" fill="#ffffff" fontFamily="monospace">PROOF: ATTACHED</text>
                <text y="12" fontSize="6" fill="#a1a1aa" fontFamily="monospace">METAPLEX_CORE_ID</text>
              </g>
            </g>
          </g>
        </motion.g>

        {/* STEP 03: ESCROW RELEASE */}
        <motion.g 
          transform="translate(0, 300)"
          animate={{ opacity: activeStep === 2 ? 1 : 0.05 }}
          transition={{ duration: 0.8 }}
        >
          <g transform="translate(0, 0)">
            <text fontSize="10" fill="#ffffff" fontFamily="monospace" fontWeight="bold">03 // {steps[2].title.toUpperCase()}</text>
            <text y="15" fontSize="8" fill="#a1a1aa" fontFamily="sans-serif" opacity="0.8">{steps[2].desc}</text>
            
            <g transform="translate(0, 40)">
              <motion.circle 
                cx="40" cy="40" r="35" 
                fill="none" stroke="#ffffff" strokeWidth="0.5"
                animate={{ 
                  r: activeStep === 2 ? [35, 38, 35] : 35,
                  opacity: activeStep === 2 ? [0.1, 0.6, 0.1] : 0.1
                }}
                transition={{ duration: 2, repeat: Infinity }}
              />
              <motion.path 
                d="M 85,40 L 220,40" 
                stroke="#ffffff" strokeWidth="0.5" strokeDasharray="3"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ 
                  pathLength: activeStep === 2 ? 1 : 0,
                  opacity: activeStep === 2 ? 0.8 : 0
                }}
                transition={{ duration: 1, delay: 0.5 }}
              />
              <motion.g 
                transform="translate(230, 35)"
                initial={{ opacity: 0, x: 5 }}
                animate={{ 
                  opacity: activeStep === 2 ? 1 : 0,
                  x: activeStep === 2 ? 0 : 5
                }}
                transition={{ duration: 0.5, delay: 1.2 }}
              >
                <text fontSize="8" fill="#ffffff" fontFamily="monospace">RELEASED</text>
                <text y="12" fontSize="6" fill="#a1a1aa" fontFamily="monospace">TX: 5tWq...9pZm</text>
              </motion.g>
            </g>
          </g>
        </motion.g>
      </g>

      <text x="50" y="640" fontFamily="monospace" fontSize="8" fill="#a1a1aa" letterSpacing="4" opacity="0.4">MIND // BUILDER_MATRIX_v1.0</text>
    </svg>
  );
}

// Archive Card SVGs
export function InstitutionalDeFiSVG({ isHovered, signal }: { isHovered: boolean; signal?: { line1: string; line2: string; line3: string } }) {
  return (
    <svg width="100%" height="100%" viewBox="0 0 400 250" xmlns="http://www.w3.org/2000/svg" className="bg-[#050505]">
      <g opacity={isHovered ? 0.8 : 0.3}>
        {Array.from({ length: 8 }).map((_, i) => (
          <motion.rect
            key={i}
            x={50 + i * 40}
            y={150 - i * 10}
            width="30"
            height={40 + i * 10}
            fill="none"
            stroke="#ffffff"
            strokeWidth="0.5"
            animate={{ 
              height: isHovered ? [40 + i * 10, 60 + i * 10, 40 + i * 10] : 40 + i * 10,
              opacity: isHovered ? [0.3, 0.8, 0.3] : 0.3
            }}
            transition={{ duration: 3, repeat: Infinity, delay: i * 0.2 }}
          />
        ))}
      </g>
      {isHovered && (
        <g className="font-mono" fill="#ffffff" opacity="0.6">
          <text x="30" y="40" fontSize="8">{signal?.line1 ?? "KAMINO_PRIME: $570M"}</text>
          <text x="30" y="55" fontSize="8">{signal?.line2 ?? "ONDO_RWA: $560.9M"}</text>
          <text x="30" y="70" fontSize="6" fill="#525252">{signal?.line3 ?? "LABEL: MARKET_SIGNALS"}</text>
        </g>
      )}
    </svg>
  );
}

export function DataMarketplaceSVG({ isHovered, signal }: { isHovered: boolean; signal?: { line1: string; line2: string; line3: string } }) {
  return (
    <svg width="100%" height="100%" viewBox="0 0 400 250" xmlns="http://www.w3.org/2000/svg" className="bg-[#050505]">
      <g opacity={isHovered ? 0.8 : 0.3}>
        {Array.from({ length: 20 }).map((_, i) => (
          <motion.circle
            key={i}
            cx={100 + (i % 5) * 50}
            cy={100 + Math.floor(i / 5) * 20}
            r="1.5"
            fill="#ffffff"
            animate={{ 
              opacity: isHovered ? [0.2, 1, 0.2] : 0.2,
              scale: isHovered ? [1, 1.5, 1] : 1
            }}
            transition={{ duration: 2, repeat: Infinity, delay: i * 0.1 }}
          />
        ))}
      </g>
      {isHovered && (
        <g className="font-mono" fill="#ffffff" opacity="0.6">
          <text x="30" y="40" fontSize="8">{signal?.line1 ?? "A2A_VOLUME: $2.87B"}</text>
          <text x="30" y="55" fontSize="8">{signal?.line2 ?? "GROWTH: +80% (30D)"}</text>
          <text x="30" y="70" fontSize="6" fill="#525252">{signal?.line3 ?? "LABEL: MARKET_SIGNALS"}</text>
        </g>
      )}
    </svg>
  );
}

export function CrossChainRoutingSVG({ isHovered, signal }: { isHovered: boolean; signal?: { line1: string; line2: string; line3: string } }) {
  return (
    <svg width="100%" height="100%" viewBox="0 0 400 250" xmlns="http://www.w3.org/2000/svg" className="bg-[#050505]">
      <g opacity={isHovered ? 0.8 : 0.3}>
        <motion.path
          d="M 50,150 Q 125,75 200,150 T 350,150"
          fill="none"
          stroke="#ffffff"
          strokeWidth="0.5"
          strokeDasharray="4"
          animate={{ strokeDashoffset: isHovered ? [0, -20] : 0 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
        />
      </g>
      {isHovered && (
        <g className="font-mono" fill="#ffffff" opacity="0.6">
          <text x="30" y="40" fontSize="8">{signal?.line1 ?? "SOLANA_RWA_DOM: 7.27%"}</text>
          <text x="30" y="55" fontSize="8">{signal?.line2 ?? "RANK: #3 GLOBAL"}</text>
          <text x="30" y="70" fontSize="6" fill="#525252">{signal?.line3 ?? "LABEL: MARKET_SIGNALS"}</text>
        </g>
      )}
    </svg>
  );
}

export function YieldOptimizationSVG({ isHovered, signal }: { isHovered: boolean; signal?: { line1: string; line2: string; line3: string } }) {
  return (
    <svg width="100%" height="100%" viewBox="0 0 400 250" xmlns="http://www.w3.org/2000/svg" className="bg-[#050505]">
      <g opacity={isHovered ? 0.8 : 0.3}>
        {Array.from({ length: 6 }).map((_, i) => (
          <motion.path
            key={i}
            d={`M 50,${220 - i * 15} C 150,${220 - i * 15} 250,${120 - i * 15} 350,${70 - i * 15}`}
            fill="none"
            stroke="#ffffff"
            strokeWidth="0.5"
            animate={{ 
              opacity: isHovered ? [0.1, 0.5, 0.1] : 0.1,
              translateY: isHovered ? [0, -5, 0] : 0
            }}
            transition={{ duration: 3, repeat: Infinity, delay: i * 0.3 }}
          />
        ))}
      </g>
      {isHovered && (
        <g className="font-mono" fill="#ffffff" opacity="0.6">
          <text x="30" y="40" fontSize="8">{signal?.line1 ?? "TOTAL_TVL: $5.8B"}</text>
          <text x="30" y="55" fontSize="8">{signal?.line2 ?? "STABLECOIN_REG: ACTIVE"}</text>
          <text x="30" y="70" fontSize="6" fill="#525252">{signal?.line3 ?? "LABEL: MARKET_SIGNALS"}</text>
        </g>
      )}
    </svg>
  );
}

export function GovernanceSDKSVG({ isHovered, signal }: { isHovered: boolean; signal?: { line1: string; line2: string; line3: string } }) {
  return (
    <svg width="100%" height="100%" viewBox="0 0 400 250" xmlns="http://www.w3.org/2000/svg" className="bg-[#050505]">
      <g opacity={isHovered ? 0.8 : 0.3} transform="translate(200, 150)">
        <motion.rect
          x="-30" y="-30" width="60" height="60"
          fill="none"
          stroke="#ffffff"
          strokeWidth="0.5"
          animate={{ rotate: isHovered ? 90 : 0 }}
          transition={{ duration: 1 }}
        />
      </g>
      {isHovered && (
        <g className="font-mono" fill="#ffffff" opacity="0.6">
          <text x="30" y="40" fontSize="8">{signal?.line1 ?? "RWA_CAP: $2B+"}</text>
          <text x="30" y="55" fontSize="8">{signal?.line2 ?? "COMPLIANCE: x402_GATED"}</text>
          <text x="30" y="70" fontSize="6" fill="#525252">{signal?.line3 ?? "LABEL: MARKET_SIGNALS"}</text>
        </g>
      )}
    </svg>
  );
}

export function ArchiveCard({ item, index, isHovered, onMouseEnter, onMouseLeave }: { 
  item: { title: string; span: string; render: (isActive: boolean) => React.ReactNode }, 
  index: number, 
  isHovered: boolean,
  onMouseEnter: () => void,
  onMouseLeave: () => void
}) {
  const ref = useRef(null);
  const isInView = useInView(ref, { 
    amount: 0.6, // Ativa quando 60% do card está visível
    once: false 
  });

  // O card é considerado "ativo" se estiver em foco pelo mouse OU se estiver visível no scroll (mobile/desktop)
  const isActive = isHovered || isInView;

  return (
    <motion.div 
      ref={ref}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      whileHover={{ y: -5 }}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.1 }}
      className={`relative aspect-[16/10] rounded-[2rem] overflow-hidden border border-white/20 cursor-pointer group ${item.span}`}
    >
      <div className="absolute inset-0 transition-transform duration-1000 group-hover:scale-105">
        {item.render(isActive)}
      </div>
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none" />
      
      {/* Visual Indicator of Activity */}
      <motion.div 
        animate={{ opacity: isActive ? 1 : 0 }}
        className="absolute top-6 right-6"
      >
        <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse shadow-[0_0_8px_rgba(255,255,255,0.5)]" />
      </motion.div>

      <div className="absolute bottom-8 left-8">
        <h3 className="text-white font-medium tracking-widest uppercase text-xs font-mono">{item.title}</h3>
      </div>
    </motion.div>
  );
}

// Home Page Component
export function HomePage() {
  const [isConnectModalOpen, setIsConnectModalOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  
  const heroRef = useRef<HTMLElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const buildersRef = useRef<HTMLDivElement>(null);

  // Builders Scroll Activation
  const isBuildersInView = useInView(buildersRef, { amount: 0.4 });

  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end end"]
  });

  const heroCopyOpacity = useTransform(scrollYProgress, [0, 0.3], [1, 0]);

  useMotionValueEvent(scrollYProgress, "change", (latest: number) => {
    if (videoRef.current && videoRef.current.duration) {
      requestAnimationFrame(() => {
        if (videoRef.current) {
          videoRef.current.currentTime = latest * videoRef.current.duration;
        }
      });
    }
  });

  useEffect(() => {
    if (!videoRef.current) return;
    const handleLoadedMetadata = () => {
      if (videoRef.current) {
        videoRef.current.currentTime = scrollYProgress.get() * videoRef.current.duration;
      }
    };
    videoRef.current.addEventListener("loadedmetadata", handleLoadedMetadata);
    return () => {
      if (videoRef.current) {
        videoRef.current.removeEventListener("loadedmetadata", handleLoadedMetadata);
      }
    };
  }, [scrollYProgress]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const wallet = params.get("wallet");
    if (wallet) {
      navigate(`/app${location.search}`, { replace: true });
    }
  }, [location.search, navigate]);

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const scrollToHeroEnd = () => {
    const heroEl = heroRef.current;
    if (!heroEl) return;
    const top = heroEl.offsetTop + heroEl.offsetHeight - window.innerHeight;
    window.scrollTo({ top, behavior: "smooth" });
  };

  useEffect(() => {
    const hash = (location.hash || "").replace("#", "");
    if (!hash) return;
    scrollToSection(hash);
  }, [location.hash]);

  return (
    <div className="pb-32 pt-32 bg-black">
      <ConnectAgentModal 
        isOpen={isConnectModalOpen} 
        onClose={() => setIsConnectModalOpen(false)} 
        onSuccess={() => {}}
      />

      {/* Hero Section: Scroll-Driven Video Scrubbing */}
      <section
        id="hero"
        ref={heroRef}
        className="relative -mt-32 bg-black h-[300vh]"
      >
        <div className="sticky top-0 h-screen overflow-hidden bg-black">
          {/* Scroll-Scrubbed Video */}
          <video
            ref={videoRef}
            src="/sanduiche_rev_mind_solana_core.mp4"
            muted
            playsInline
            preload="auto"
            className="absolute inset-0 w-full h-full object-contain z-0"
          />

          {/* Camada de Segurança Visual (Overlay Dinâmico) */}
          <motion.div 
            className="absolute inset-0 bg-black/60 z-10 pointer-events-none"
            style={{ opacity: heroCopyOpacity }}
          />

          {/* Copy - Centered and Relative */}
          <div className="relative z-20 flex flex-col items-center justify-center h-full px-6 text-center">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="max-w-4xl space-y-10 flex flex-col items-center"
              style={{ opacity: heroCopyOpacity }}
            >
              <div className="space-y-4 flex flex-col items-center">
                <Badge variant="outline" className="border-zinc-800 text-zinc-500 font-mono uppercase text-[10px] tracking-[0.3em] px-4 py-1.5 bg-black/50 backdrop-blur-sm w-fit">
                  Solana-First Rails
                </Badge>

                <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight leading-tight md:leading-[1.1] text-white font-mono uppercase">
                  <MetallicText progress={scrollYProgress}>Solana is now</MetallicText> <br />
                  <MetallicText progress={scrollYProgress} className="italic font-medium text-zinc-300 text-4xl md:text-6xl lg:text-7xl drop-shadow-2xl">the A2A Settlement Layer.</MetallicText>
                </h1>
              </div>

              <p className="text-lg md:text-xl text-zinc-400 leading-relaxed max-w-2xl font-light text-center">
                Builders publish Agent Cards with policy-gated execution and proof-native delivery. Agents discover skills, consume market signals, and settle atomically with a 92/8 split.
              </p>

              <div className="flex flex-col sm:flex-row gap-6 pt-4 justify-center">
                <Button 
                  size="lg" 
                  className="bg-white text-black hover:bg-zinc-200 transition-all duration-500 rounded-full px-10 h-14 uppercase tracking-widest font-mono text-[10px]"
                  onClick={() => window.open('https://github.com/DGuedz/MIND', '_blank')}
                >
                  Submit PR (Github)
                </Button>
                <Button 
                  size="lg" 
                  variant="outline" 
                  className="border-white/30 text-white hover:bg-white/5 transition-all duration-500 rounded-full px-10 h-14 uppercase tracking-widest font-mono text-[10px] bg-black/20 backdrop-blur-sm"
                  onClick={() => navigate("/app")}
                >
                  Explore Registry
                </Button>
              </div>
            </motion.div>
          </div>

          <motion.div 
            className="absolute bottom-12 left-1/2 -translate-x-1/2 cursor-pointer flex flex-col items-center gap-2 z-50"
            animate={{ y: [0, 10, 0] }}
            transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
            onClick={scrollToHeroEnd}
          >
            <span className="text-[10px] font-mono tracking-widest text-white/30 uppercase">Scroll Down</span>
            <ArrowDown className="w-4 h-4 text-white/30" />
          </motion.div>
        </div>
      </section>

      {/* NEW SECTION: Neural Bridge Discovery */}
      <section id="neural-bridge" className="relative z-20 bg-black container mx-auto px-6 pt-16 pb-16 grid grid-cols-1 lg:grid-cols-2 gap-24 items-center">
        <div className="space-y-10 order-2 lg:order-1">
          <Badge variant="outline" className="border-zinc-800 text-zinc-500 font-mono uppercase text-[10px] tracking-[0.3em] px-4 py-1.5 bg-black/50 backdrop-blur-sm">
            Discovery & Execution
          </Badge>

          <h2 className="text-4xl md:text-5xl font-bold text-white tracking-tight leading-[1.1]">
            Neural Message <br />
            <span className="italic font-light opacity-60">Bridge.</span>
          </h2>

          <p className="text-zinc-500 leading-relaxed font-light text-lg">
            Where money becomes a message. Experience the zero-latency A2A settlement rails. Credentials define authority; x402 defines payment.
          </p>

          <div className="space-y-6 pt-4">
            <div className="flex gap-6 items-start">
              <div className="w-10 h-10 rounded-full bg-white/5 border border-white/30 flex items-center justify-center shrink-0">
                <Zap className="w-4 h-4 text-white" />
              </div>
              <div className="space-y-1">
                <h4 className="text-white font-medium">Autonomous Discovery</h4>
                <p className="text-zinc-500 text-sm font-light">Agents broadcast intents across neural rails to find liquidity and data.</p>
              </div>
            </div>
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="flex gap-6 items-start group"
            >
              <div className="w-10 h-10 rounded-full bg-white/5 border border-white/30 flex items-center justify-center shrink-0 group-hover:border-white/20 transition-colors duration-500">
                <ShieldCheck className="w-4 h-4 text-white" />
              </div>
              <div className="space-y-1">
                <h4 className="text-white font-medium">Credential Gating</h4>
                <p className="text-zinc-500 text-sm font-light">On-chain Metaplex credentials authorize high-value execution without human clicks.</p>
              </div>
            </motion.div>
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="relative z-20 order-1 lg:order-2"
        >
          <NeuralMessageBridge />
        </motion.div>
      </section>

      {/* Section 1: Curated Assemblages */}
      <section id="marketplace" className="container mx-auto px-6 mt-16">
        <VerticalsMarketplaceSlider
          onExploreRegistry={() => navigate("/app")}
          verticals={[
            {
              id: "data",
              indexLabel: "01",
              title: "Dexter",
              subtitle: "Data Vertical",
              description: "Indexing-grade intelligence. Queryable truth with explicit cost and verifiable delivery.",
              stats: [
                { label: "Latency Power", value: "180ms", hint: "p50 quote" },
                { label: "Throughput", value: "42 req/s", hint: "burst" },
                { label: "Compute Units", value: "8.2k", hint: "sim depth" },
                { label: "Escrow Logic", value: "Strict", hint: "policy" }
              ],
              card: { id: "dexter", name: "Dexter", type: "Data Agent", price: "$0.05 / req", Art: DexterCardSVG }
            },
            {
              id: "security",
              indexLabel: "02",
              title: "CLINT",
              subtitle: "Security Vertical",
              description: "CNB Link Intelligence. Sybil risk classification and Node Health Index scoring for DePINs.",
              stats: [
                { label: "Origin", value: "The Garage", hint: "SP" },
                { label: "Badge", value: "Genesis", hint: "Builder" },
                { label: "Network", value: "Solana", hint: "Mainnet" },
                { label: "VSC", value: "Compliant", hint: "Read-only" }
              ],
              card: { id: "clint", name: "CLINT", type: "Security Agent", price: "$0.01 / scan", Art: VolanCardSVG }
            },
            {
              id: "yield",
              indexLabel: "03",
              title: "Volan",
              subtitle: "Yield Vertical",
              description: "Composable yield execution. Explicit rails, predictable settlement, opt-in strategies.",
              stats: [
                { label: "Latency Power", value: "240ms", hint: "p50 route" },
                { label: "Throughput", value: "18 exec/s", hint: "safe" },
                { label: "Compute Units", value: "12.6k", hint: "route sim" },
                { label: "Escrow Logic", value: "Vaulted", hint: "escrow" }
              ],
              card: { id: "volan", name: "Volan", type: "Yield Agent", price: "$0.005 / exec", Art: VolanCardSVG }
            },
            {
              id: "risk",
              indexLabel: "04",
              title: "Krios",
              subtitle: "Risk Vertical",
              description: "Pre-trade and runtime policy checks. Deterministic gating before any capital moves.",
              stats: [
                { label: "Latency Power", value: "95ms", hint: "p50 scan" },
                { label: "Throughput", value: "120 scans/s", hint: "batch" },
                { label: "Compute Units", value: "4.1k", hint: "rules" },
                { label: "Escrow Logic", value: "Guarded", hint: "deny" }
              ],
              card: { id: "krios", name: "Krios", type: "Risk Agent", price: "$0.02 / scan", Art: KriosCardSVG }
            }
          ]}
        />
      </section>

      {/* Section 2: Architecture of Nature (Trust) */}
      <section id="process" className="container mx-auto px-6 mt-16 grid grid-cols-1 lg:grid-cols-2 gap-24 items-center">
        <div className="aspect-[4/5] rounded-[3rem] bg-[#050505] border border-white/20 overflow-hidden relative">
          <EscrowFlowSVG />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/30 pointer-events-none" />
          <div className="absolute bottom-10 left-10 text-[10px] font-mono text-zinc-500 uppercase tracking-widest">
            Atomic Settlement Flow
          </div>
        </div>
        
        <div className="space-y-12">
          <div className="space-y-6">
            <h2 className="text-4xl md:text-5xl font-bold text-white tracking-tight leading-[1.1]">
              Intent. Validate. <br />
              <span className="italic font-light opacity-60">Execute. Mint.</span>
            </h2>
            <p className="text-zinc-500 leading-relaxed font-light text-lg">
              A2A commerce needs atomic rails, not promises. Policies define limits, credentials prove truth, and atomic transactions define settlement.
            </p>
          </div>

          <div className="space-y-10">
            {[
              { id: "01", title: "Intent", desc: "An agent requests a service under an explicit policy and micro-price." },
              { id: "02", title: "Validate Credential", desc: "The API Gateway validates the caller's Metaplex Mindprint credential instantly." },
              { id: "03", title: "Execute & Split", desc: "Service executes and payment is routed atomically (92% Provider / 8% Protocol)." },
              { id: "04", title: "Mint Proof", desc: "A cNFT receipt is minted as an immutable cryptographic proof of execution." }
            ].map((item, i) => (
              <div key={i} className="flex gap-8 group">
                <span className="text-[10px] font-mono text-zinc-700 group-hover:text-white transition-colors duration-500 pt-1.5">{item.id}</span>
                <div className="space-y-3">
                  <h4 className="text-white font-medium tracking-wide text-lg">{item.title}</h4>
                  <p className="text-zinc-500 text-sm leading-relaxed font-light">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="builders" ref={buildersRef} className="container mx-auto px-6 mt-32 grid grid-cols-1 lg:grid-cols-2 gap-24 items-center">
        <div className="space-y-10">
          <Badge variant="outline" className="border-zinc-800 text-zinc-500 font-mono uppercase text-[10px] tracking-[0.3em] px-4 py-1.5 bg-black/50 backdrop-blur-sm">
            Builders
          </Badge>

          <h2 className="text-4xl md:text-5xl font-bold text-white tracking-tight leading-[1.1]">
            List Cards. <br />
            <span className="italic font-light opacity-60">Get Paid Per Execution.</span>
          </h2>

          <p className="text-zinc-500 leading-relaxed font-light text-lg">
            Publish reusable Agent Cards with explicit pricing, evidence requirements, and payout splits. Settlement is escrow-based and verifiable on Solana.
          </p>

          <div className="flex flex-col sm:flex-row gap-6 pt-2">
            <Button
              size="lg"
              className="bg-white text-black hover:bg-zinc-200 transition-all duration-500 rounded-full px-10 h-14 uppercase tracking-widest font-mono text-[10px]"
              onClick={() => navigate("/register")}
            >
              Publish Agent Card
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-white/30 text-white hover:bg-white/5 transition-all duration-500 rounded-full px-10 h-14 uppercase tracking-widest font-mono text-[10px] bg-black/20 backdrop-blur-sm"
              onClick={() => scrollToSection("process")}
            >
              View Settlement Flow
            </Button>
          </div>
        </div>

        <div className="rounded-[3rem] border border-white/20 overflow-hidden bg-zinc-950 relative aspect-[4/5] lg:aspect-auto lg:h-[667px] group">
          <div className="absolute inset-0 z-0">
            <BuildersMatrixSVG isVisible={isBuildersInView} />
          </div>
        </div>
      </section>

      {/* Section 3: The Archives - Removed as signals moved to Hero */}

      <section id="github" className="container mx-auto px-6 mt-32 flex flex-col md:flex-row justify-between items-start md:items-center gap-10 bg-white/[0.02] border border-white/20 rounded-[3rem] p-10 md:p-14">
        <div className="space-y-4 max-w-2xl">
          <div className="text-[10px] font-mono uppercase tracking-[0.3em] text-zinc-500">Repository Access</div>
          <h3 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
            Source code is open for institutional review.
          </h3>
          <p className="text-zinc-500 leading-relaxed font-light">
            Builders: Access the MIND Protocol repository to explore our Agent Cards, atomic settlement rails, and Zero-Trust implementation. Submit your PRs and join the Agentic Economy.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-6 w-full md:w-auto">
          <Button
            onClick={() => window.open("https://github.com/DGuedz/MIND", "_blank")}
            className="bg-white text-black hover:bg-zinc-200 transition-all duration-500 rounded-full px-10 h-14 uppercase tracking-widest font-mono text-[10px]"
          >
            Access Repository
          </Button>
          <Button
            variant="outline"
            onClick={() => window.open("https://github.com/DGuedz/MIND/blob/main/CONTRIBUTING.md", "_blank")}
            className="border-white/30 text-white hover:bg-white/5 transition-all duration-500 rounded-full px-10 h-14 uppercase tracking-widest font-mono text-[10px] bg-black/20 backdrop-blur-sm"
          >
            Contribution Guide
          </Button>
        </div>
      </section>

      {/* MainLayout handles the footer now */}
    </div>
  );
}
