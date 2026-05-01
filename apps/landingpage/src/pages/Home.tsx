import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "../components/ui/button";
import { ConnectAgentModal } from "../components/ConnectAgentModal";
import { Badge } from "../components/ui/badge";
import { motion, useMotionValue, useTransform, MotionValue, AnimatePresence, useInView, useScroll, useMotionValueEvent } from "framer-motion";
import { ArrowDown } from "lucide-react";
import { Zap, ShieldCheck } from "lucide-react";
import { VerticalsMarketplaceSlider } from "../components/VerticalsMarketplaceSlider";
import { MainLayout } from "../layouts/MainLayout";

// Component for Metallic Reflective Text synced with Scroll
function MetallicText({ children, className, progress }: { children: React.ReactNode, className?: string, progress?: MotionValue<number> }) {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const handleMouseMove = (e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    mouseX.set(e.clientX - rect.left);
    mouseY.set(e.clientY - rect.top);
  };

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

// Component for Solana Metallic Reflective Text
function SolanaMetallicText({ children, className, progress }: { children: React.ReactNode, className?: string, progress?: MotionValue<number> }) {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const handleMouseMove = (e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    mouseX.set(e.clientX - rect.left);
    mouseY.set(e.clientY - rect.top);
  };

  const backgroundPosition = useTransform(
    progress || mouseX,
    (v: any) => progress ? `${Number(v) * 200}% 50%` : `${Number(mouseX.get()) / 10}% ${Number(mouseY.get()) / 10}%`
  );

  return (
    <motion.span
      onMouseMove={handleMouseMove}
      className={`relative inline-block bg-clip-text text-transparent bg-[linear-gradient(110deg,#ffffff,40%,#d1fae5,48%,#ffffff,52%,#e9d5ff,60%,#ffffff)] bg-[length:200%_200%] transition-all duration-300 cursor-default drop-shadow-[0_0_10px_rgba(20,241,149,0.15)] ${className || ''}`}
      style={{ backgroundPosition }}
    >
      {children}
    </motion.span>
  );
}

// Neural Message Bridge: Terminal interativo para envio de mensagens assinadas


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
    <svg width="100%" height="100%" viewBox="0 0 500 500" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg" className="bg-[#050505]">
      <defs>
        <radialGradient id="dexterGrad" cx="50%" cy="50%" r="50%">
          <stop offset="0%" style={{ stopColor: "#ffffff", stopOpacity: 0.15 }} />
          <stop offset="100%" style={{ stopColor: "#050505", stopOpacity: 0 }} />
        </radialGradient>
      </defs>
      <rect width="500" height="500" fill="url(#dexterGrad)" />
      
      {/* Neural Data Grid */}
      <g opacity={isHovered ? 0.9 : 0.4} transform="translate(0, -50)">
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
        animate={{ y: [0, 500] }}
        transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
      />

      <text x="50" y="460" fontFamily="monospace" fontSize="12" fill="#a1a1aa" letterSpacing="4" opacity="0.6">DEXTER // DATA_GRID</text>
    </svg>
  );
}

// Volan Yield Agent: The High Voltage Network (Animated SVG)
function VolanCardSVG({ isHovered }: { isHovered: boolean }) {
  return (
    <svg width="100%" height="100%" viewBox="0 0 500 500" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg" className="bg-[#050505]">
      <defs>
        <radialGradient id="volanGrad" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.1" />
          <stop offset="100%" stopColor="#050505" stopOpacity="0" />
        </radialGradient>
        <filter id="electricGlow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="2" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      
      <rect width="500" height="500" fill="url(#volanGrad)" />

      {/* Central Power Core */}
      <g transform="translate(250, 250)">
        <motion.circle 
          r="15" fill="#ffffff" opacity={isHovered ? 0.9 : 0.3}
          animate={{ scale: isHovered ? [1, 1.2, 0.9, 1.3, 1] : 1 }}
          transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
          filter="url(#electricGlow)"
        />
        <motion.circle 
          r="30" fill="none" stroke="#ffffff" strokeWidth="1" strokeDasharray="4 12"
          opacity={isHovered ? 0.5 : 0.1}
          animate={{ rotate: 360, scale: isHovered ? [1, 1.5, 1] : 1 }}
          transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
        />

        {/* High Voltage Arcs (Electricity) */}
        {Array.from({ length: 6 }).map((_, i) => {
          const angle = (i * 60) * (Math.PI / 180);
          
          // Generate a jagged electric path
          const generateArc = () => {
            let path = `M 0 0`;
            let currentX = 0;
            let currentY = 0;
            const segments = 5;
            const length = 150 + Math.random() * 100; // random length for arc
            
            for (let j = 1; j <= segments; j++) {
              const segmentLength = length / segments;
              const jitterX = (Math.random() - 0.5) * 40;
              const jitterY = (Math.random() - 0.5) * 40;
              
              currentX += Math.cos(angle) * segmentLength + jitterX;
              currentY += Math.sin(angle) * segmentLength + jitterY;
              
              path += ` L ${currentX} ${currentY}`;
            }
            return path;
          };

          return (
            <motion.path
              key={`arc-${i}`}
              d={generateArc()}
              fill="none"
              stroke="#ffffff"
              strokeWidth={isHovered ? 1.5 : 0.5}
              filter={isHovered ? "url(#electricGlow)" : "none"}
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ 
                pathLength: isHovered ? [0, 1, 0] : 0,
                opacity: isHovered ? [0, 1, 0] : 0.1,
                d: isHovered ? [generateArc(), generateArc()] : generateArc() // Jitter the path itself
              }}
              transition={{ 
                duration: 0.15 + Math.random() * 0.2, 
                repeat: Infinity, 
                repeatType: "mirror",
                delay: Math.random() * 2 
              }}
            />
          );
        })}

        {/* Static Background Circuit Lines */}
        {Array.from({ length: 8 }).map((_, i) => {
          const angle = (i * 45 + 22.5) * (Math.PI / 180);
          const x2 = Math.cos(angle) * 300;
          const y2 = Math.sin(angle) * 300;
          return (
            <motion.line
              key={`circuit-${i}`}
              x1="0" y1="0" x2={x2} y2={y2}
              stroke="#ffffff" strokeWidth="0.5" strokeDasharray="10 20"
              opacity="0.1"
              animate={{ strokeDashoffset: isHovered ? [0, -30] : 0 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            />
          );
        })}
      </g>

      {/* Energy Metrics */}
      {isHovered && (
        <motion.g 
          className="font-mono text-[10px]" 
          fill="#ffffff" 
          opacity="0.8"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 0.8, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <g transform="translate(320, 40)">
            <rect width="12" height="12" rx="2" fill="none" stroke="#ffffff" strokeWidth="0.5" opacity="0.5" />
            <path d="M 3,6 L 6,9 L 9,3" fill="none" stroke="#ffffff" strokeWidth="1" />
            <text x="20" y="10">APY: +14.2%</text>
          </g>
          
          <g transform="translate(320, 60)">
            <rect width="12" height="12" rx="2" fill="none" stroke="#ffffff" strokeWidth="0.5" opacity="0.5" />
            <path d="M 6,3 L 6,9 M 4,4 L 8,4 M 4,8 L 8,8" fill="none" stroke="#ffffff" strokeWidth="1" />
            <text x="20" y="10">TVL: $42.5M</text>
          </g>

          <g transform="translate(320, 80)">
            <rect width="12" height="12" rx="2" fill="none" stroke="#ffffff" strokeWidth="0.5" opacity="0.5" />
            <path d="M 4,6 L 8,6 M 6,4 L 8,6 L 6,8" fill="none" stroke="#ffffff" strokeWidth="1" />
            <text x="20" y="10">STRAT: KAMINO_JIT</text>
          </g>
        </motion.g>
      )}

      <text x="50" y="460" fontFamily="monospace" fontSize="12" fill="#a1a1aa" letterSpacing="4" opacity="0.6">VOLAN // YIELD_STACK</text>
    </svg>
  );
}

// Krios Risk Agent: The Intent Firewall (Animated SVG)
function KriosCardSVG({ isHovered }: { isHovered: boolean }) {
  return (
    <svg width="100%" height="100%" viewBox="0 0 500 500" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg" className="bg-[#050505]">
      <defs>
        <linearGradient id="kriosGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.08" />
          <stop offset="50%" stopColor="#ffffff" stopOpacity="0.15" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0.05" />
        </linearGradient>
      </defs>
      <rect width="500" height="500" fill="url(#kriosGrad)" />

      {/* Vertical Firewall Pillars */}
      <g opacity={isHovered ? 0.8 : 0.3}>
        {Array.from({ length: 14 }).map((_, i) => {
          const x = 40 + i * 32.3;
          const isGated = i % 3 === 0;
          return (
            <g key={`pillar-${i}`}>
              <line x1={x} y1="0" x2={x} y2="500" stroke="#ffffff" strokeWidth="0.5" opacity="0.15" />
              {/* Data stream going down */}
              <motion.line
                x1={x} y1="0" x2={x} y2="150"
                stroke="#ffffff" strokeWidth={isGated ? 1.5 : 0.5}
                opacity={isHovered ? 0.6 : 0.2}
                animate={{ y1: [-150, 500], y2: [0, 650] }}
                transition={{ duration: 3 + (i % 4), repeat: Infinity, ease: "linear", delay: i * 0.15 }}
              />
              {/* Intersecting Policy Gate */}
              {isHovered && isGated && (
                <motion.rect
                  x={x - 12} y={250 + (i % 2 === 0 ? 50 : -50)} width="24" height="2"
                  fill="#ffffff"
                  initial={{ opacity: 0, scaleX: 0 }}
                  animate={{ opacity: [0, 1, 0], scaleX: [0, 1, 0] }}
                  transition={{ duration: 2, repeat: Infinity, delay: i * 0.3 }}
                />
              )}
            </g>
          );
        })}
      </g>

      {/* Central Hexagon Shield Core */}
      <g transform="translate(250, 250)">
        {Array.from({ length: 5 }).map((_, i) => {
          const size = 50 + i * 35;
          return (
            <motion.polygon
              key={`hex-${i}`}
              points={`0,-${size} ${size*0.866},-${size*0.5} ${size*0.866},${size*0.5} 0,${size} -${size*0.866},${size*0.5} -${size*0.866},-${size*0.5}`}
              fill="none"
              stroke="#ffffff"
              strokeWidth={i === 0 ? 1.5 : 0.5}
              strokeDasharray={i % 2 !== 0 ? "4 8" : "none"}
              opacity={isHovered ? 0.7 - i * 0.1 : 0.15}
              animate={{ 
                rotate: i % 2 === 0 ? 360 : -360,
                scale: isHovered ? [1, 1.05, 1] : 1
              }}
              transition={{ 
                rotate: { duration: 40 + i * 10, repeat: Infinity, ease: "linear" },
                scale: { duration: 4, repeat: Infinity, ease: "easeInOut" }
              }}
            />
          );
        })}
        {/* Core Locking Mechanism */}
        <motion.circle cx="0" cy="0" r="12" fill="#ffffff" opacity={isHovered ? 0.9 : 0.2} 
          animate={{ scale: isHovered ? [1, 1.3, 1] : 1 }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        />
        {isHovered && (
          <motion.circle cx="0" cy="0" r="12" fill="none" stroke="#ffffff" strokeWidth="0.5"
            animate={{ scale: [1, 3.5], opacity: [0.8, 0] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "easeOut" }}
          />
        )}
      </g>

      {/* Metrics */}
      {isHovered && (
        <motion.g 
          className="font-mono text-[10px]" 
          fill="#ffffff" 
          opacity="0.8"
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 0.8, x: 0 }}
          transition={{ duration: 0.5 }}
        >
          <text x="40" y="60">STATUS: PROTECTED</text>
          <text x="40" y="80">THREAT_LEVEL: LOW</text>
          <text x="40" y="100">GATE: POLICY_ENFORCED</text>
          <text x="40" y="120">LATENCY: 95ms</text>
        </motion.g>
      )}

      <text x="40" y="460" fontFamily="monospace" fontSize="12" fill="#a1a1aa" letterSpacing="4" opacity="0.6">KRIOS // RISK_FIREWALL</text>
    </svg>
  );
}

// Private Agent Checkout Flow (Animated SVG)
function CheckoutFlowSVG({ isHovered }: { isHovered: boolean }) {
  const [activeStep, setActiveStep] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveStep((prev) => (prev + 1) % 4);
    }, 2400);
    return () => clearInterval(interval);
  }, []);

  const steps = [
    { x: 108, y: 156, label: "INTENT", info: "SIGNED_REQUEST", detail: "0.50 SOL // x402", value: "01" },
    { x: 235, y: 256, label: "VALIDATE", info: "MINDPRINT_OK", detail: "POLICY_LIMIT: PASS", value: "02" },
    { x: 326, y: 360, label: "EXECUTE", info: "ATOMIC_SPLIT", detail: "92 / 8 ROUTED", value: "03" },
    { x: 390, y: 460, label: "MINT", info: "PROOF_RECEIPT", detail: "cNFT_ANCHOR", value: "04" }
  ];

  const flowPath = "M 108 156 C 190 144 238 184 235 256 C 232 300 304 300 326 360 C 350 410 380 400 390 460";
  const flowDuration = 9.6;
  const nodeKeyPoints = "0;0.369;0.704;1;1";
  const onchainSignals = [
    { x: 78, y: 104, label: "SLOT", value: "+128" },
    { x: 344, y: 178, label: "CU", value: "4.1K" },
    { x: 84, y: 400, label: "FEE", value: "5K_LAMPORTS" },
    { x: 328, y: 480, label: "SIG", value: "5tWq..9pZm" },
  ];

  return (
    <svg width="100%" height="100%" viewBox="0 0 500 500" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg" className="bg-[#050505]">
      <defs>
        <radialGradient id="mindFlowAura" cx="50%" cy="46%" r="58%">
          <stop offset="0%" style={{ stopColor: "#ffffff", stopOpacity: 0.14 }} />
          <stop offset="42%" style={{ stopColor: "#737373", stopOpacity: 0.05 }} />
          <stop offset="100%" style={{ stopColor: "#050505", stopOpacity: 0 }} />
        </radialGradient>
        <linearGradient id="mindFlowStroke" x1="70" y1="120" x2="420" y2="480" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.15" />
          <stop offset="48%" stopColor="#ffffff" stopOpacity="0.55" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0.08" />
        </linearGradient>
        <linearGradient id="mindFlowPlate" x1="90" y1="90" x2="410" y2="480" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.07" />
          <stop offset="50%" stopColor="#ffffff" stopOpacity="0.015" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0.06" />
        </linearGradient>
        <filter id="mindSoftGlow">
          <feGaussianBlur stdDeviation="3.5" result="coloredBlur"/>
          <feMerge>
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
        <filter id="mindDeepBlur">
          <feGaussianBlur stdDeviation="18" />
        </filter>
      </defs>

      <rect width="500" height="500" fill="#050505" />
      <rect width="500" height="500" fill="url(#mindFlowAura)" />

      <g opacity="0.08">
        {Array.from({ length: 7 }).map((_, i) => (
          <line key={`h-${i}`} x1="34" y1={68 + i * 62} x2="466" y2={68 + i * 62} stroke="#ffffff" strokeWidth="0.5" />
        ))}
        {Array.from({ length: 6 }).map((_, i) => (
          <line key={`v-${i}`} x1={76 + i * 70} y1="72" x2={38 + i * 70} y2="480" stroke="#ffffff" strokeWidth="0.35" />
        ))}
      </g>

      <motion.g
        transform="translate(0 18)"
        animate={{ y: isHovered ? -4 : 0, opacity: isHovered ? 1 : 0.86 }}
        transition={{ duration: 0.7, ease: "easeOut" }}
      >
        <motion.ellipse
          cx="260"
          cy="250"
          rx="154"
          ry="180"
          fill="none"
          stroke="#ffffff"
          strokeWidth="0.4"
          opacity="0.12"
          animate={{ rotate: [0, 2.5, 0], opacity: [0.08, 0.18, 0.08] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          style={{ transformOrigin: "260px 250px" }}
        />
        <motion.ellipse
          cx="260"
          cy="250"
          rx="102"
          ry="130"
          fill="none"
          stroke="#ffffff"
          strokeWidth="0.35"
          opacity="0.12"
          animate={{ rotate: [0, -3, 0], opacity: [0.06, 0.14, 0.06] }}
          transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
          style={{ transformOrigin: "260px 250px" }}
        />
      </motion.g>

      <motion.g
        transform="translate(0 10)"
        animate={{ y: isHovered ? -8 : 0, scale: isHovered ? 1.018 : 1 }}
        transition={{ duration: 0.7, ease: "easeOut" }}
        style={{ transformOrigin: "260px 250px" }}
      >
        <motion.polygon
          points="92,122 388,90 438,450 128,480"
          fill="url(#mindFlowPlate)"
          stroke="#ffffff"
          strokeWidth="0.6"
          animate={{ opacity: isHovered ? 0.42 : 0.3 }}
          transition={{ duration: 0.6 }}
        />
        <motion.polygon
          points="126,176 360,150 397,420 151,450"
          fill="none"
          stroke="#ffffff"
          strokeWidth="0.35"
          animate={{ opacity: isHovered ? 0.24 : 0.16 }}
          transition={{ duration: 0.6 }}
        />
        <motion.polygon
          points="160,236 336,216 360,390 176,410"
          fill="none"
          stroke="#ffffff"
          strokeWidth="0.3"
          animate={{ opacity: isHovered ? 0.18 : 0.12 }}
          transition={{ duration: 0.6 }}
        />
      </motion.g>

      <g opacity="0.16" filter="url(#mindDeepBlur)">
        <circle cx="300" cy="300" r="100" fill="#ffffff" opacity="0.12" />
        <circle cx="168" cy="170" r="70" fill="#ffffff" opacity="0.06" />
      </g>

      <g>
        <motion.path
          d={flowPath}
          fill="none"
          stroke="url(#mindFlowStroke)"
          strokeWidth="1.2"
          strokeLinecap="round"
          opacity="0.8"
          strokeDasharray="8 14"
          animate={{ strokeDashoffset: [0, -88] }}
          transition={{ duration: flowDuration, repeat: Infinity, ease: "linear" }}
        />

        {onchainSignals.map((signal, i) => (
          <motion.g
            key={signal.label}
            className="font-mono"
            initial={false}
            animate={{
              opacity: isHovered ? 0.78 : 0.26,
              x: isHovered ? 0 : (i % 2 === 0 ? -4 : 4),
              y: isHovered ? 0 : 3,
            }}
            transition={{ duration: 0.45, delay: i * 0.04 }}
          >
            <line
              x1={signal.x}
              y1={signal.y + 6}
              x2={signal.x + (i % 2 === 0 ? 42 : -42)}
              y2={signal.y + 6}
              stroke="#ffffff"
              strokeWidth="0.35"
              opacity="0.35"
            />
            <text x={signal.x} y={signal.y} fontSize="7" fill="#737373" letterSpacing="2">
              {signal.label}
            </text>
            <text x={signal.x} y={signal.y + 18} fontSize="8" fill="#d4d4d8" letterSpacing="1.4">
              {signal.value}
            </text>
          </motion.g>
        ))}

        {steps.map((node, i) => {
          const isActive = activeStep === i;
          const isRightSide = node.x > 280;
          const textX = isRightSide ? node.x - 22 : node.x + 22;
          const textAnchor = isRightSide ? "end" : "start";

          return (
            <g key={i}>
              <motion.rect
                x={node.x - 6}
                y={node.y - 6}
                width="12"
                height="12"
                rx="3"
                fill="#ffffff"
                opacity={isActive ? 0.2 : 0.07}
                animate={{
                  rotate: isActive ? [0, 45, 0] : 0,
                  scale: isActive ? [1, 1.25, 1] : 1,
                }}
                transition={{ duration: 1.6, repeat: isActive ? Infinity : 0, ease: "easeInOut" }}
                style={{ transformOrigin: `${node.x}px ${node.y}px` }}
              />
              <motion.circle
                cx={node.x} cy={node.y} r={isActive ? 4.5 : 3}
                fill="#ffffff"
                filter="url(#mindSoftGlow)"
                animate={{ 
                  opacity: isActive ? 1 : 0.28, 
                  scale: isActive ? [1, 1.35, 1] : 1 
                }}
                transition={{ duration: 1.2, repeat: isActive ? Infinity : 0, ease: "easeInOut" }}
              />
              {isActive && (
                <motion.circle
                  cx={node.x} cy={node.y} r={16}
                  fill="none"
                  stroke="#ffffff"
                  strokeWidth="0.5"
                  initial={{ opacity: 0.45, scale: 0.7 }}
                  animate={{ opacity: 0, scale: 2.2 }}
                  transition={{ duration: 1.8, repeat: Infinity, ease: "easeOut" }}
                />
              )}

              <AnimatePresence>
                {isActive && (
                  <motion.g
                    initial={{ opacity: 0, x: isRightSide ? -10 : 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: isRightSide ? 10 : -10 }}
                    className="font-mono"
                  >
                    <text x={textX} y={node.y - 18} fontSize="8" fill="#737373" letterSpacing="3" textAnchor={textAnchor}>
                      {node.value}
                    </text>
                    <text x={textX} y={node.y - 4} fontSize="10" fill="#ffffff" fontWeight="700" opacity="0.92" textAnchor={textAnchor}>
                      {node.label}
                    </text>
                    <text x={textX} y={node.y + 12} fontSize="7" fill="#a1a1aa" opacity="0.7" textAnchor={textAnchor}>
                      {node.info}
                    </text>
                    <text x={textX} y={node.y + 25} fontSize="6" fill="#525252" opacity="0.7" textAnchor={textAnchor}>
                      {node.detail}
                    </text>
                  </motion.g>
                )}
              </AnimatePresence>
            </g>
          );
        })}

        <g filter="url(#mindSoftGlow)">
          <circle r="3.4" fill="#ffffff">
            <animateMotion
              dur={`${flowDuration}s`}
              repeatCount="indefinite"
              calcMode="linear"
              keyTimes="0;0.25;0.5;0.75;1"
              keyPoints={nodeKeyPoints}
              path={flowPath}
            />
          </circle>
          <circle r="1.4" fill="#ffffff" opacity="0.42">
            <animateMotion
              dur={`${flowDuration}s`}
              repeatCount="indefinite"
              begin="-0.18s"
              calcMode="linear"
              keyTimes="0;0.25;0.5;0.75;1"
              keyPoints={nodeKeyPoints}
              path={flowPath}
            />
          </circle>
        </g>
      </g>

      <g className="font-mono" opacity="0.7">
        <text x="52" y="460" fontSize="9" fill="#a1a1aa" letterSpacing="4">MIND_DATA_ART // ATOMIC_FLOW</text>
        <text x="52" y="480" fontSize="7" fill="#525252" letterSpacing="3">POLICY_SIGNALS_RENDERED_AS_SETTLEMENT_GEOMETRY</text>
      </g>
    </svg>
  );
}

// Mini SVG Grid Preview for Home (A2A Discovery Flow)
function SVGGridPreview() {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setMousePos({ x, y });
  };

  const handleMouseLeave = () => {
    setMousePos({ x: 300, y: 150 });
  };

  return (
    <div className="relative group" style={{ perspective: "1000px" }}>
      <div 
        className="metallic-brushed-solana metallic-shine rounded-3xl p-8 aspect-video relative cursor-crosshair transition-all duration-500 group-hover:scale-[1.02]"
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={{ 
          transformStyle: 'preserve-3d',
          transform: `rotateX(${(mousePos.y - 150) * -0.05}deg) rotateY(${(mousePos.x - 300) * 0.05}deg)`
        }}
      >
        {/* Borda 3D que salta no hover */}
        <div 
          className="absolute inset-0 rounded-3xl border border-white/20 pointer-events-none transition-transform duration-500 ease-out"
          style={{ transform: "translateZ(0px)" }}
        />
        <div 
          className="absolute inset-0 rounded-3xl border border-white/10 pointer-events-none transition-all duration-500 ease-out opacity-0 group-hover:opacity-100 group-hover:translate-z-[15px]"
          style={{ transform: "translateZ(15px)" }}
        />
        <div 
          className="absolute inset-0 rounded-3xl border border-white/20 pointer-events-none transition-all duration-500 ease-out opacity-0 group-hover:opacity-100 group-hover:translate-z-[30px]"
          style={{ transform: "translateZ(30px)", boxShadow: "0 0 20px rgba(255,255,255,0.05)" }}
        />
        
        {/* Camada de Fundo (Clipped) */}
        <div className="absolute inset-0 overflow-hidden rounded-3xl pointer-events-none">
          {/* Glow de reflexo 3D (Hover) */}
          <div 
            className="absolute inset-0 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-700 mix-blend-overlay z-0" 
            style={{
              background: `radial-gradient(circle 300px at ${mousePos.x}px ${mousePos.y}px, rgba(255,255,255,0.15), transparent)`
            }}
          />

          {/* Generative Neural Grid Background */}
          <div className="absolute inset-0 opacity-50 pointer-events-none transition-all duration-700 group-hover:opacity-80">
            <svg width="100%" height="100%" viewBox="0 0 600 300" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <radialGradient id="glowHome" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#ffffff" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
                </radialGradient>
                <linearGradient id="fadeGrid" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#ffffff" stopOpacity="0" />
                  <stop offset="20%" stopColor="#ffffff" stopOpacity="0.7" />
                  <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
                </linearGradient>
                <mask id="gridMask">
                  <rect width="600" height="300" fill="url(#fadeGrid)" />
                </mask>
              </defs>

              {/* Dynamic Flash based on mouse */}
              <circle 
                cx={mousePos.x * 1.5} 
                cy={mousePos.y * 1.5} 
                r="250" 
                fill="url(#glowHome)" 
                className="transition-all duration-200 ease-out"
              />

              <g mask="url(#gridMask)">
                {/* Deep Perspective Matrix */}
                <motion.g
                  animate={{ scale: [1, 1.05, 1], y: [0, 5, 0] }}
                  transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
                  style={{ transformOrigin: "300px 150px" }}
                >
                  {/* Vanishing Lines */}
                  {Array.from({ length: 40 }).map((_, i) => {
                    const x = i * 15;
                    const distFromCenter = x - 300;
                    return (
                      <line 
                        key={`v-${i}`}
                        x1={300 + distFromCenter * 0.1} y1="0" 
                        x2={300 + distFromCenter * 2.5} y2="300" 
                        stroke="#ffffff" strokeWidth="0.5" opacity="0.15"
                      />
                    );
                  })}
                  {/* Depth Lines */}
                  {Array.from({ length: 20 }).map((_, i) => {
                    const progress = i / 20;
                    const y = Math.pow(progress, 2) * 300;
                    return (
                      <line 
                        key={`h-${i}`}
                        x1="0" y1={y} x2="600" y2={y} 
                        stroke="#ffffff" strokeWidth="0.5" opacity={0.1 + progress * 0.3}
                      />
                    );
                  })}
                </motion.g>

                {/* Smooth Neural Paths */}
                <g>
                  {Array.from({ length: 15 }).map((_, i) => {
                    const startX = 50 + (i * 47) % 500;
                    const startY = 20 + (i * 31) % 260;
                    const endX = 100 + (i * 83) % 400;
                    const endY = 250 - (i * 19) % 150;
                    
                    const cp1X = startX + (i % 2 === 0 ? 50 : -50);
                    const cp1Y = startY + 100;
                    const cp2X = endX + (i % 2 === 0 ? -50 : 50);
                    const cp2Y = endY - 100;

                    const d = `M ${startX} ${startY} C ${cp1X} ${cp1Y}, ${cp2X} ${cp2Y}, ${endX} ${endY}`;
                    const duration = 3 + (i % 5);
                    const delay = i * 0.2;

                    return (
                      <g key={`path-${i}`}>
                        <path d={d} fill="none" stroke="#ffffff" strokeWidth="0.3" opacity="0.15" />
                        <motion.path
                          d={d}
                          fill="none"
                          stroke="#ffffff"
                          strokeWidth="1.2"
                          strokeDasharray="10 300"
                          initial={{ strokeDashoffset: 300 }}
                          animate={{ strokeDashoffset: -300 }}
                          transition={{ duration, repeat: Infinity, ease: "linear", delay }}
                          opacity="0.9"
                        />
                        <circle cx={endX} cy={endY} r="2" fill="#ffffff" opacity="0.2" />
                        <motion.circle
                          cx={endX} cy={endY} r="4" fill="#ffffff"
                          initial={{ opacity: 0, scale: 0 }}
                          animate={{ opacity: [0, 0.8, 0], scale: [0.5, 1.5, 0.5] }}
                          transition={{ duration, repeat: Infinity, ease: "easeInOut", delay: delay + (duration * 0.8) }}
                        />
                      </g>
                    );
                  })}
                </g>
              </g>
            </svg>
          </div>
        </div>

        <div 
          className="relative z-10 h-full flex flex-col justify-between transition-transform duration-200"
          style={{ transform: `translateZ(40px)` }}
        >
        <div className="flex justify-between items-start">
          <div className="space-y-1">
            <div className="text-[10px] font-mono text-zinc-500 uppercase tracking-[0.3em] flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-zinc-500 rounded-full animate-pulse"></span>
              A2A Flow Discovery
            </div>
            <div className="text-xl font-bold text-white tracking-tight font-mono">Neural Grid.</div>
          </div>
          <Badge variant="outline" className="border-zinc-800 text-zinc-500 font-mono text-[8px] uppercase tracking-widest px-3">
            Preview Mode
          </Badge>
        </div>

        <div className="grid grid-cols-3 gap-8">
          <HeatmapMetric label="Active Nodes" value="1,204" change="Live" />
          <HeatmapMetric label="Intent Density" value="0.92" change="Optimal" />
          <HeatmapMetric label="P2P Routing" value="Secured" change="Cloak ZK" />
        </div>
      </div>
      </div>
    </div>
  );
}

function HeatmapMetric({ label, value, change }: { label: string; value: string; change: string }) {
  return (
    <div className="space-y-1">
      <div className="text-[10px] font-mono uppercase tracking-[0.2em] text-zinc-600">{label}</div>
      <div className="flex items-baseline gap-2">
        <div className="text-2xl font-mono tracking-tight text-zinc-200">{value}</div>
        <div className="text-[10px] font-mono text-zinc-500">{change}</div>
      </div>
    </div>
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
      desc: "Define the proof bundle that must be minted after execution to finalize delivery." 
    },
    { 
      title: "Atomic private checkout", 
      desc: "Policy before spend, Cloak/x402 settlement, then proof minted as a receipt. No escrow." 
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
  const [isProcessCardHovered, setIsProcessCardHovered] = useState(false);
  const [processCardTilt, setProcessCardTilt] = useState({ x: 0, y: 0 });
  const navigate = useNavigate();
  const location = useLocation();

  const handleProcessCardMove = (event: React.MouseEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width - 0.5) * 2;
    const y = ((event.clientY - rect.top) / rect.height - 0.5) * 2;
    setProcessCardTilt({ x, y });
  };

  const handleProcessCardLeave = () => {
    setIsProcessCardHovered(false);
    setProcessCardTilt({ x: 0, y: 0 });
  };
  
  const heroRef = useRef<HTMLElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const buildersRef = useRef<HTMLDivElement>(null);

  // Removido o pré-fetch com Blob. Deixando o navegador gerenciar o cache nativamente
  // Isso previne que navegações rápidas entre páginas cancelem o download e disparem
  // net::ERR_ABORTED no console do Chromium.

  // Builders Scroll Activation
  const isBuildersInView = useInView(buildersRef, { amount: 0.4 });

  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end end"]
  });

  // We unify the fade out to ensure perfect synchronization.
  // The fade out starts at 15% and finishes completely by 35%.
  const heroCopyOpacity = useTransform(scrollYProgress, [0.15, 0.35], [1, 0], { clamp: true });
  const heroCopyVisibility = useTransform(heroCopyOpacity, (val) => val === 0 ? "hidden" : "visible");
  const heroCopyY = useTransform(scrollYProgress, [0.15, 0.35], [0, -50], { clamp: true });

  // Overlay opacity fades out *after* the text, revealing the video fully in evidence.
  // From 25% to 50% scroll.
  const overlayOpacity = useTransform(scrollYProgress, [0.25, 0.50], [1, 0], { clamp: true });
  const overlayVisibility = useTransform(overlayOpacity, (val) => val === 0 ? "hidden" : "visible");

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
    <MainLayout heroCopyOpacity={heroCopyOpacity} heroCopyVisibility={heroCopyVisibility}>
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
            className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,0,0,0.7)_0%,rgba(0,0,0,0.95)_100%)] z-10 pointer-events-none"
            style={{ opacity: overlayOpacity, visibility: overlayVisibility as any }}
          />

          {/* Copy - Centered and Relative */}
          <motion.div 
            className="relative z-20 flex flex-col items-center justify-center h-full px-6 text-center pointer-events-none"
            style={{ opacity: heroCopyOpacity, visibility: heroCopyVisibility as any, y: heroCopyY }}
          >
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="w-full max-w-4xl space-y-8 md:space-y-10 flex flex-col items-center mt-12 md:mt-0 pointer-events-auto"
            >
              <div className="space-y-4 md:space-y-6 flex flex-col items-center w-full">
                <h1 className="text-4xl sm:text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight leading-[1.15] md:leading-[1.1] text-white font-mono uppercase w-full">
                  <SolanaMetallicText progress={scrollYProgress} className="tracking-[0.02em]">Solana</SolanaMetallicText>
                  <MetallicText progress={scrollYProgress} className="tracking-[0.02em] ml-2 md:ml-4 text-2xl sm:text-4xl md:text-5xl lg:text-6xl align-middle md:align-baseline">is now</MetallicText> <br />
                  <MetallicText progress={scrollYProgress} className="italic font-medium text-zinc-300 text-[26px] sm:text-4xl md:text-6xl lg:text-7xl drop-shadow-2xl tracking-[0.01em] mt-2 md:mt-4 inline-block w-full">the A2A Settlement Layer.</MetallicText>
                </h1>
              </div>

              <p className="text-base sm:text-lg md:text-xl text-center max-w-xs sm:max-w-2xl transition-all duration-700 px-4 md:px-0">
                <MetallicText progress={scrollYProgress} className="leading-relaxed font-mono drop-shadow-[0_0_12px_rgba(255,255,255,0.25)] hover:text-white hover:drop-shadow-[0_0_20px_rgba(255,255,255,0.5)]">
                  We build the on-chain roads, you build the intelligence. Connect your GitHub to publish Agent Cards, monetize your skills, and settle atomically with a 92/8 split.
                </MetallicText>
              </p>

              <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 pt-2 md:pt-4 justify-center w-full sm:w-auto px-6 sm:px-0">
                <Button 
                  size="lg" 
                  className="bg-white text-black hover:bg-zinc-200 transition-all duration-500 rounded-full px-8 md:px-10 h-12 md:h-14 uppercase tracking-widest font-mono text-[9px] md:text-[10px] w-full sm:w-auto"
                  onClick={() => navigate("/contribute")}
                >
                  Connect GitHub
                </Button>
              </div>
            </motion.div>
          </motion.div>

          <motion.div 
            className="absolute bottom-12 left-1/2 -translate-x-1/2 cursor-pointer flex flex-col items-center gap-2 z-50"
            style={{ opacity: heroCopyOpacity, visibility: heroCopyVisibility as any }}
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
        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="space-y-10 order-2 lg:order-1"
        >
          <Badge variant="outline" className="border-zinc-800 text-zinc-500 font-mono uppercase text-[10px] tracking-[0.3em] px-4 py-1.5 bg-black/50 backdrop-blur-sm">
            Discovery & Execution
          </Badge>

          <h2 className="text-4xl md:text-5xl font-bold text-white tracking-tight leading-[1.1] font-mono uppercase">
            A2A Settlement <br />
            <span className="italic font-light opacity-60 text-zinc-400">Rails.</span>
          </h2>

          <p className="text-zinc-500 leading-relaxed font-light text-lg">
            Economic infrastructure that decides, executes, and proves for A2A flows. Protect capital with policy gates, route execution under constraints, and produce auditable proof bundles.
          </p>

          <div className="space-y-6 pt-4">
            <div className="flex gap-6 items-start">
              <div className="w-10 h-10 rounded-full bg-white/5 border border-white/30 flex items-center justify-center shrink-0">
                <Zap className="w-4 h-4 text-white" />
              </div>
              <div className="space-y-1">
                <h4 className="text-white font-medium font-mono uppercase text-sm tracking-widest">Autonomous Discovery</h4>
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
                <h4 className="text-white font-medium font-mono uppercase text-sm tracking-widest">Credential Gating</h4>
                <p className="text-zinc-500 text-sm font-light">On-chain Metaplex credentials authorize high-value execution without human clicks.</p>
              </div>
            </motion.div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 40, scale: 0.95 }}
          whileInView={{ opacity: 1, y: 0, scale: 1 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
          className="relative z-20 order-1 lg:order-2"
        >
          <SVGGridPreview />
        </motion.div>
      </section>

      {/* Section 1: Curated Assemblages */}
      <section id="marketplace" className="container mx-auto px-6 mt-16 md:mt-32">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
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
                { label: "Settlement", value: "Darkpool UTXO", hint: "x402 cloak" }
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
                { label: "Settlement", value: "Atomic", hint: "opt-in" }
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
                { label: "Settlement", value: "Gated", hint: "policy" }
              ],
              card: { id: "krios", name: "Krios", type: "Risk Agent", price: "$0.02 / scan", Art: KriosCardSVG }
            }
          ]}
        />
        </motion.div>
      </section>

      {/* Section 2: Architecture of Nature (Trust) */}
      <section id="process" className="container mx-auto px-6 mt-16 grid grid-cols-1 lg:grid-cols-2 gap-24 items-center">
        <motion.div 
          initial={{ opacity: 0, x: -40 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="relative" style={{ perspective: "1200px" }}
        >
          <motion.div
            className="aspect-[4/5] rounded-[3rem] bg-[#050505] border border-white/20 overflow-hidden relative cursor-crosshair"
            onMouseEnter={() => setIsProcessCardHovered(true)}
            onMouseMove={handleProcessCardMove}
            onMouseLeave={handleProcessCardLeave}
            animate={{
              rotateX: isProcessCardHovered ? processCardTilt.y * -3.5 : 0,
              rotateY: isProcessCardHovered ? processCardTilt.x * 3.5 : 0,
              y: isProcessCardHovered ? -6 : 0,
              scale: isProcessCardHovered ? 1.012 : 1,
              boxShadow: isProcessCardHovered
                ? "0 34px 90px rgba(255,255,255,0.08), 0 0 0 1px rgba(255,255,255,0.18)"
                : "0 0 0 rgba(255,255,255,0)",
            }}
            transition={{ type: "spring", stiffness: 120, damping: 20, mass: 0.8 }}
            style={{ transformStyle: "preserve-3d" }}
          >
            <motion.div
              className="absolute inset-0 pointer-events-none"
              animate={{ opacity: isProcessCardHovered ? 1 : 0 }}
              transition={{ duration: 0.35 }}
              style={{
                background: `radial-gradient(circle at ${(processCardTilt.x + 1) * 50}% ${(processCardTilt.y + 1) * 50}%, rgba(255,255,255,0.12), transparent 34%)`,
              }}
            />
            <CheckoutFlowSVG isHovered={isProcessCardHovered} />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/30 pointer-events-none" />
            <motion.div
              className="absolute inset-x-10 top-8 flex items-center justify-between text-[9px] font-mono uppercase tracking-[0.28em] text-zinc-600 pointer-events-none"
              animate={{ opacity: isProcessCardHovered ? 0.9 : 0.38, y: isProcessCardHovered ? 0 : 4 }}
              transition={{ duration: 0.4 }}
            >
              <span>Onchain Signal Layer</span>
              <span className="hidden sm:inline">Symbolic Telemetry</span>
            </motion.div>
            <div className="absolute bottom-10 left-10 text-[10px] font-mono text-zinc-500 uppercase tracking-widest">
              Atomic Settlement Flow
            </div>
          </motion.div>
        </motion.div>
        
        <motion.div 
          initial={{ opacity: 0, x: 40 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
          className="space-y-12"
        >
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
        </motion.div>
      </section>

      <section id="builders" ref={buildersRef} className="container mx-auto px-6 mt-32 grid grid-cols-1 lg:grid-cols-2 gap-24 items-center">
        <motion.div 
          initial={{ opacity: 0, x: -40 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="space-y-10"
        >
          <Badge variant="outline" className="border-zinc-800 text-zinc-500 font-mono uppercase text-[10px] tracking-[0.3em] px-4 py-1.5 bg-black/50 backdrop-blur-sm">
            Builders
          </Badge>

          <h2 className="text-4xl md:text-5xl font-bold text-white tracking-tight leading-[1.1]">
                Discover Skills. <br />
                <span className="italic font-light opacity-60">Collaborate with Superteam BR.</span>
              </h2>

              <p className="text-zinc-500 leading-relaxed font-light text-lg">
                Join the Colosseum Frontier Hackathon initiative. Connect your GitHub to discover Agent Cards like the Superteam Brasil Bounty Copilot. Build, share, and find the exact PMF for your project through mutual agent collaboration.
              </p>

          <div className="flex flex-col sm:flex-row gap-6 pt-2">
            <Button
              size="lg"
              className="bg-white text-black hover:bg-zinc-200 transition-all duration-500 rounded-full px-10 h-14 uppercase tracking-widest font-mono text-[10px]"
              onClick={() => navigate("/start")}
            >
              [Connect GitHub to Discover]
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
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, x: 40 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
          className="rounded-[3rem] border border-white/20 overflow-hidden bg-zinc-950 relative aspect-[4/5] lg:aspect-auto lg:h-[667px] group"
        >
          <div className="absolute inset-0 z-0">
            <BuildersMatrixSVG isVisible={isBuildersInView} />
          </div>
        </motion.div>
      </section>

      {/* Section 3: The Archives - Removed as signals moved to Hero */}

      <section id="github" className="container mx-auto px-6 mt-32 mb-16">
        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="flex flex-col md:flex-row justify-between items-start md:items-center gap-10 bg-white/[0.02] border border-white/20 rounded-[3rem] p-10 md:p-14"
        >
          <div className="space-y-4 max-w-2xl">
          <div className="text-[10px] font-mono uppercase tracking-[0.3em] text-zinc-500">Repository Access</div>
          <h3 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
            Source code is open for institutional review.
          </h3>
          <p className="text-zinc-500 leading-relaxed font-light">
            Builders: Access the MIND Protocol repository to explore our Agent Cards, atomic settlement rails, and Zero-Trust implementation. Submit your PRs and join the Agentic Economy.
            Current status: pre-testnet validation is enforced by strict gates; no claim of testnet or revenue without fresh tx/proof evidence.
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
        </motion.div>
      </section>

      {/* MainLayout handles the footer now */}
      </div>
    </MainLayout>
  );
}
