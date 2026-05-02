import { useState, useEffect, useRef, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "../components/ui/button";
import { ConnectAgentModal } from "../components/ConnectAgentModal";
import { Badge } from "../components/ui/badge";
import { motion, useMotionValue, useTransform, MotionValue, AnimatePresence, useInView, useScroll, useMotionValueEvent } from "framer-motion";
import { ArrowDown, Zap, ShieldCheck, Database, Search } from "lucide-react";
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


// Echo Indexer Agent: The Tactical Solana Radar (Animated SVG)
function IndexerRadarCardSVG({ isHovered }: { isHovered: boolean }) {
  // Generate deterministic points for radar targets
  const targets = useMemo(() => {
    const pts = [];
    for (let i = 0; i < 18; i++) {
      const angle = Math.random() * Math.PI * 2;
      const radius = 20 + Math.random() * 140; // 20 to 160 (inside 180)
      pts.push({
        x: Math.cos(angle) * radius,
        y: Math.sin(angle) * radius,
        color: Math.random() > 0.3 ? "#10B981" : "#9945FF", // Solana colors
        size: 1.5 + Math.random() * 2,
        delay: Math.random() * 3
      });
    }
    return pts;
  }, []);

  // Pre-calculate radial lines and degree labels for the tactical grid
  const radials = useMemo(() => {
    const lines = [];
    for (let i = 0; i < 360; i += 15) {
      const rad = (i * Math.PI) / 180;
      lines.push({
        deg: i,
        x1: Math.cos(rad) * 20,
        y1: Math.sin(rad) * 20,
        x2: Math.cos(rad) * 180,
        y2: Math.sin(rad) * 180,
        tx: Math.cos(rad) * 195,
        ty: Math.sin(rad) * 195,
        isMajor: i % 30 === 0
      });
    }
    return lines;
  }, []);

  return (
    <svg width="100%" height="100%" viewBox="0 0 500 500" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg" className="bg-transparent mix-blend-screen">
      <defs>
        <linearGradient id="sweepGrad" x1="1" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#10B981" stopOpacity="0.5" />
          <stop offset="60%" stopColor="#10B981" stopOpacity="0.1" />
          <stop offset="100%" stopColor="#10B981" stopOpacity="0" />
        </linearGradient>
        <filter id="radarGlow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Center Group */}
      <g transform="translate(250, 250)">
        
        {/* Tactical Grid: Concentric Rings */}
        {[20, 40, 60, 80, 100, 120, 140, 160, 180].map((r) => (
          <circle
            key={`ring-${r}`}
            r={r}
            fill="none"
            stroke="#10B981"
            strokeWidth={r === 180 ? 1 : 0.3}
            opacity={isHovered ? (r === 180 ? 0.6 : 0.3) : 0.1}
          />
        ))}

        {/* Tactical Grid: Radial Lines & Labels */}
        <g opacity={isHovered ? 0.5 : 0.1}>
          {radials.map((r, i) => (
            <g key={`radial-${i}`}>
              <line x1={r.x1} y1={r.y1} x2={r.x2} y2={r.y2} stroke="#10B981" strokeWidth={r.isMajor ? 0.5 : 0.2} />
              {r.isMajor && isHovered && (
                <text x={r.tx} y={r.ty} fill="#10B981" fontSize="6" fontFamily="monospace" textAnchor="middle" dominantBaseline="middle" opacity="0.8">
                  {r.deg}°
                </text>
              )}
            </g>
          ))}
        </g>

        {/* Radar Scan Sweep (Conic Gradient) */}
        {isHovered && (
          <motion.g
            animate={{ rotate: 360 }}
            transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
            style={{ transformOrigin: "0px 0px" }}
          >
            {/* 
              Using a massive circle with a conic-like dasharray trick 
              or a solid wedge with a radial sweep. 
              Since SVG 1.1 doesn't have conic-gradient natively, we use a 90-deg pie slice. 
            */}
            <path 
              d="M 0 0 L 0 -180 A 180 180 0 0 1 180 0 Z" 
              fill="url(#sweepGrad)" 
            />
            {/* The sweeping arm (the laser line itself) */}
            <line 
              x1="0" y1="0" x2="180" y2="0" 
              stroke="#10B981" 
              strokeWidth="2.5" 
              opacity="0.9" 
              filter="url(#radarGlow)" 
            />
          </motion.g>
        )}

        {/* Targets / Nodes */}
        {targets.map((t: {x: number, y: number, color: string, size: number, delay: number}, i: number) => (
          <g key={`target-${i}`} transform={`translate(${t.x}, ${t.y})`}>
            <motion.circle
              r={t.size}
              fill={isHovered ? t.color : "#ffffff"}
              opacity={isHovered ? 0.9 : 0.2}
              filter={isHovered ? "url(#radarGlow)" : "none"}
              animate={isHovered ? { scale: [1, 2, 1], opacity: [0.3, 1, 0.3] } : {}}
              transition={{ duration: 1.5, repeat: Infinity, delay: t.delay }}
            />
            {/* Ping rings */}
            {isHovered && i % 3 === 0 && (
              <motion.circle
                r={t.size * 3}
                fill="none"
                stroke={t.color}
                strokeWidth="0.5"
                initial={{ scale: 0, opacity: 1 }}
                animate={{ scale: 4, opacity: 0 }}
                transition={{ duration: 2, repeat: Infinity, delay: t.delay }}
              />
            )}
            {/* Hex Data Tags */}
            {isHovered && i % 4 === 0 && (
              <motion.g 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: t.delay + 0.5 }}
              >
                <text x="5" y="-3" className="font-mono" fontSize="5" fill={t.color} opacity="0.9">
                  {t.color === "#10B981" ? "NODE" : "SYNC"}
                </text>
                <line x1="0" y1="0" x2="4" y2="-4" stroke={t.color} strokeWidth="0.5" opacity="0.6" />
              </motion.g>
            )}
          </g>
        ))}
      </g>

      {/* HUD Info */}
      {isHovered && (
        <motion.g 
          className="font-mono text-[10px]" 
          fill="#ffffff" 
          opacity="0.8"
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 0.8, x: 0 }}
          transition={{ duration: 0.5 }}
        >
          <text x="40" y="60">INDEX_RADAR: <tspan fill="#10B981">ACTIVE</tspan></text>
          <text x="40" y="80">NETWORK: SOLANA_MAINNET</text>
          <text x="40" y="100">NODES_FOUND: 1,204</text>
          <text x="40" y="120">SYNC_RATE: 42ms</text>
        </motion.g>
      )}

      <text x="40" y="460" fontFamily="monospace" fontSize="12" fill="#a1a1aa" letterSpacing="4" opacity="0.6">ECHO // TACTICAL_RADAR</text>
    </svg>
  );
}

// Sybil Security Agent: The Electric Node (Animated SVG)
function SybilNodeCardSVG({ isHovered }: { isHovered: boolean }) {
  // Generate lightning rays
  const rays = useMemo(() => {
    const r = [];
    for (let i = 0; i < 6; i++) {
      const angle = (i * 60) * (Math.PI / 180);
      const points = [];
      let cx = 0, cy = 0;
      points.push(`${cx},${cy}`);
      for (let step = 1; step <= 5; step++) {
        const radius = step * 40;
        const jitterAngle = angle + (Math.random() - 0.5) * 0.5;
        cx = Math.cos(jitterAngle) * radius;
        cy = Math.sin(jitterAngle) * radius;
        points.push(`${cx},${cy}`);
      }
      r.push({ id: i, points: points.join(" "), delay: Math.random() });
    }
    return r;
  }, []);

  return (
    <svg width="100%" height="100%" viewBox="0 0 500 500" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg" className="bg-transparent mix-blend-screen">
      <defs>
        <radialGradient id="sybilGrad" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.1" />
          <stop offset="100%" stopColor="#050505" stopOpacity="0" />
        </radialGradient>
        <filter id="electricGlow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <rect width="500" height="500" fill="url(#sybilGrad)" />

      {/* Grid lines */}
      <g opacity={isHovered ? 0.2 : 0.05}>
        <line x1="250" y1="0" x2="250" y2="500" stroke="#ffffff" strokeWidth="0.5" strokeDasharray="4 8" />
        <line x1="0" y1="250" x2="500" y2="250" stroke="#ffffff" strokeWidth="0.5" strokeDasharray="4 8" />
      </g>

      <g transform="translate(250, 250)">
        {/* Core Node */}
        <motion.circle 
          r="15" 
          fill="#ffffff" 
          opacity="0.3" 
          filter="url(#electricGlow)"
          animate={{ scale: isHovered ? [1, 1.2, 1] : 1 }}
          transition={{ duration: 1.5, repeat: Infinity }}
        />
        
        {/* Rotating Outer Rings */}
        <motion.circle 
          r="30" fill="none" stroke="#ffffff" strokeWidth="1" strokeDasharray="4 12" opacity="0.1"
          animate={{ rotate: 360, scale: isHovered ? 1.2 : 1 }}
          transition={{ rotate: { duration: 20, repeat: Infinity, ease: "linear" }, scale: { duration: 0.5 } }}
        />
        <motion.circle 
          r="50" fill="none" stroke="#ffffff" strokeWidth="0.5" strokeDasharray="2 6" opacity="0.1"
          animate={{ rotate: -360 }}
          transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
        />

        {/* Electric Rays */}
        {rays.map((ray) => (
          <motion.polyline
            key={`ray-${ray.id}`}
            points={ray.points}
            fill="none"
            stroke="#ffffff"
            strokeWidth="1"
            filter={isHovered ? "url(#electricGlow)" : "none"}
            opacity={isHovered ? 0.6 : 0.1}
            initial={{ pathLength: 0 }}
            animate={isHovered ? { pathLength: [0, 1, 0], opacity: [0.1, 0.8, 0.1] } : { pathLength: 1 }}
            transition={{ duration: 1.5 + Math.random(), repeat: Infinity, delay: ray.delay }}
          />
        ))}

        {/* Connection Nodes */}
        {isHovered && rays.map((ray) => {
          const pts = ray.points.split(" ");
          const lastPt = pts[pts.length - 1].split(",");
          const lx = parseFloat(lastPt[0]);
          const ly = parseFloat(lastPt[1]);
          return (
            <motion.g key={`node-${ray.id}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: ray.delay + 0.5 }}>
              <circle cx={lx} cy={ly} r="3" fill="#10B981" filter="url(#electricGlow)" />
              <circle cx={lx} cy={ly} r="8" fill="none" stroke="#10B981" strokeWidth="0.5" />
              <text x={lx + 10} y={ly + 3} className="font-mono text-[6px]" fill="#10B981" opacity="0.8">VERIFIED</text>
            </motion.g>
          );
        })}
      </g>

      {/* HUD Info */}
      {isHovered && (
        <motion.g 
          className="font-mono text-[10px]" 
          fill="#ffffff" 
          opacity="0.8"
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 0.8, x: 0 }}
          transition={{ duration: 0.5 }}
        >
          <text x="40" y="60">SYBIL_CHECK: <tspan fill="#10B981">PASSED</tspan></text>
          <text x="40" y="80">PROOF_OF_HUMAN: VALID</text>
          <text x="40" y="100">LIVENESS_SCORE: 0.98</text>
          <text x="40" y="120">NODE_HEALTH: OPTIMAL</text>
        </motion.g>
      )}

      <text x="40" y="460" fontFamily="monospace" fontSize="12" fill="#a1a1aa" letterSpacing="4" opacity="0.6">SYBIL // SEC_NODE</text>
    </svg>
  );
}

// JIT Router Yield Agent: The Smart Money Graph (Animated SVG)
function JitRouterCardSVG({ isHovered }: { isHovered: boolean }) {
  // Generate deterministic points for the graph
  const points = useMemo(() => {
    const pts = [];
    let currentY = 320; // Start lower down (visually)
    for (let i = 0; i < 20; i++) {
      pts.push({ x: 50 + i * 21, y: currentY });
      
      const progress = i / 19;
      
      // Consolidation in the first half, breakout in the second half
      const trendBias = progress < 0.5 ? 0.45 : 0.7; // >0.5 means Y decreases (goes up visually)
      
      currentY += (Math.random() - trendBias) * 35;
      
      // Force a hard "moon" spike at the end of the chart
      if (i >= 15) {
        currentY -= 15 + Math.random() * 20;
      }

      // Clamp to viewBox bounds roughly
      currentY = Math.max(90, Math.min(380, currentY));
    }
    return pts;
  }, []);

  const pathD = points.map((p: {x: number, y: number}, i: number) => (i === 0 ? `M ${p.x} ${p.y}` : `L ${p.x} ${p.y}`)).join(" ");
  const areaD = `${pathD} L ${points[points.length - 1].x} 400 L ${points[0].x} 400 Z`;

  return (
    <svg width="100%" height="100%" viewBox="0 0 500 500" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg" className="bg-transparent mix-blend-screen">
      <defs>
        <linearGradient id="jitGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.1" />
          <stop offset="100%" stopColor="#050505" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="chartAreaGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#10B981" stopOpacity={isHovered ? 0.4 : 0.1} />
          <stop offset="100%" stopColor="#10B981" stopOpacity="0" />
        </linearGradient>
        <filter id="chartGlow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <rect width="500" height="500" fill="url(#jitGrad)" />

      {/* Grid Lines */}
      <g opacity={isHovered ? 0.3 : 0.1}>
        {Array.from({ length: 10 }).map((_, i) => (
          <line key={`h-${i}`} x1="50" y1={100 + i * 30} x2="450" y2={100 + i * 30} stroke="#ffffff" strokeWidth="0.5" strokeDasharray="2 4" />
        ))}
        {Array.from({ length: 10 }).map((_, i) => (
          <line key={`v-${i}`} x1={50 + i * 40} y1="100" x2={50 + i * 40} y2="370" stroke="#ffffff" strokeWidth="0.5" strokeDasharray="2 4" />
        ))}
      </g>

      {/* Chart Area */}
      <motion.path
        d={areaD}
        fill="url(#chartAreaGrad)"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1 }}
      />

      {/* Chart Line */}
      <motion.path
        d={pathD}
        fill="none"
        stroke={isHovered ? "#10B981" : "#ffffff"}
        strokeWidth={isHovered ? 2 : 1}
        filter={isHovered ? "url(#chartGlow)" : "none"}
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 2, ease: "easeInOut" }}
      />

      {/* Data Points (Smart Money Nodes) */}
      {points.map((p: {x: number, y: number}, i: number) => {
        // Highlight specific "trade" nodes
        const isTradeNode = i % 4 === 0 && i !== 0;
        return (
          <g key={`point-${i}`}>
            <motion.circle
              cx={p.x} cy={p.y} r={isTradeNode && isHovered ? 4 : 2}
              fill={isHovered ? "#10B981" : "#ffffff"}
              opacity={isTradeNode ? 1 : 0.5}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: i * 0.1, type: "spring" }}
            />
            {isTradeNode && isHovered && (
              <motion.circle
                cx={p.x} cy={p.y} r={12}
                fill="none" stroke="#10B981" strokeWidth="0.5"
                initial={{ scale: 0, opacity: 1 }}
                animate={{ scale: 2, opacity: 0 }}
                transition={{ duration: 1.5, repeat: Infinity }}
              />
            )}
            {/* Intel Tags */}
            {isTradeNode && isHovered && (
              <motion.g 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 + 0.5 }}
                className="font-mono text-[6px] md:text-[8px]" fill="#ffffff"
              >
                <text x={p.x - 10} y={p.y - 25}>TVL_SPIKE</text>
                <text x={p.x - 10} y={p.y - 15} fill="#a1a1aa">CONF: 0.92</text>
                <line x1={p.x} y1={p.y - 10} x2={p.x} y2={p.y - 2} stroke="#ffffff" strokeWidth="0.5" opacity="0.5" />
              </motion.g>
            )}
          </g>
        );
      })}

      {/* Terminal HUD */}
      {isHovered && (
        <motion.g 
          className="font-mono text-[10px]" 
          fill="#ffffff" 
          opacity="0.8"
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 0.8, x: 0 }}
          transition={{ duration: 0.5 }}
        >
          <text x="40" y="60">SIGNAL_FEED: <tspan fill="#10B981">LIVE</tspan></text>
          <text x="40" y="80">JUPITER_VOLUME: $1.2B</text>
          <text x="40" y="100">KAMINO_YIELD: 14.2%</text>
          <text x="40" y="120">SMART_MONEY_FLOW: INFLOW</text>
        </motion.g>
      )}

      <text x="40" y="460" fontFamily="monospace" fontSize="12" fill="#a1a1aa" letterSpacing="4" opacity="0.6">JIT // SMART_MONEY_GRAPH</text>
    </svg>
  );
}

// Krios Risk Agent: The Intent Firewall (Animated SVG)
function KriosCardSVG({ isHovered }: { isHovered: boolean }) {
  // Generate lock mechanisms for the vault
  const locks = useMemo(() => {
    const l = [];
    for (let i = 0; i < 3; i++) {
      l.push({
        radius: 60 + i * 40,
        dash: i % 2 === 0 ? "8 16" : "30 10",
        speed: 10 + i * 5,
        dir: i % 2 === 0 ? 1 : -1
      });
    }
    return l;
  }, []);

  return (
    <svg width="100%" height="100%" viewBox="0 0 500 500" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg" className="bg-transparent mix-blend-screen">
      <defs>
        <linearGradient id="kriosGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.08" />
          <stop offset="50%" stopColor="#ffffff" stopOpacity="0.15" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0.05" />
        </linearGradient>
        <linearGradient id="kriosHexGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#10B981" />
          <stop offset="50%" stopColor="#6366F1" />
          <stop offset="100%" stopColor="#10B981" />
        </linearGradient>
        <filter id="vaultGlow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="4" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <pattern id="gridPattern" width="40" height="40" patternUnits="userSpaceOnUse">
          <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#ffffff" strokeWidth="0.5" opacity="0.1" />
        </pattern>
      </defs>
      
      <rect width="500" height="500" fill="url(#kriosGrad)" />
      <rect width="500" height="500" fill="url(#gridPattern)" />

      {/* Security Perimeter Lasers */}
      <g opacity={isHovered ? 0.4 : 0.1}>
        <motion.line x1="0" y1="250" x2="500" y2="250" stroke="#10B981" strokeWidth="1" strokeDasharray="4 8"
          animate={{ strokeDashoffset: isHovered ? [-20, 0] : 0 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        />
        <motion.line x1="250" y1="0" x2="250" y2="500" stroke="#10B981" strokeWidth="1" strokeDasharray="4 8"
          animate={{ strokeDashoffset: isHovered ? [-20, 0] : 0 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        />
      </g>

      {/* Central Vault Mechanism */}
      <g transform="translate(250, 250)">
        
        {/* Policy Hexagon Core */}
        <motion.polygon
          points="0,-40 34.6,-20 34.6,20 0,40 -34.6,20 -34.6,-20"
          fill="none"
          stroke="url(#kriosHexGrad)"
          strokeWidth="3"
          filter={isHovered ? "url(#vaultGlow)" : "none"}
          animate={{ rotate: isHovered ? 90 : 0, scale: isHovered ? [1, 1.1, 1] : 1 }}
          transition={{ rotate: { duration: 1 }, scale: { duration: 2, repeat: Infinity } }}
        />
        <motion.circle cx="0" cy="0" r="10" fill={isHovered ? "#10B981" : "#ffffff"} opacity={isHovered ? 1 : 0.3} />

        {/* Rotating Lock Rings */}
        {locks.map((lock, i) => (
          <motion.circle
            key={`lock-${i}`}
            cx="0" cy="0"
            r={lock.radius}
            fill="none"
            stroke="#ffffff"
            strokeWidth={i === 1 && isHovered ? 2 : 0.5}
            strokeDasharray={lock.dash}
            opacity={isHovered ? 0.6 - i * 0.1 : 0.15}
            animate={{ rotate: 360 * lock.dir }}
            transition={{ duration: lock.speed, repeat: Infinity, ease: "linear" }}
          />
        ))}

        {/* Access Gates (Data entry points) */}
        {Array.from({ length: 4 }).map((_, i) => {
          const angle = (i * 90 + 45) * (Math.PI / 180);
          const x1 = Math.cos(angle) * 40;
          const y1 = Math.sin(angle) * 40;
          const x2 = Math.cos(angle) * 160;
          const y2 = Math.sin(angle) * 160;
          return (
            <g key={`gate-${i}`}>
              <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="#ffffff" strokeWidth="0.5" opacity="0.2" />
              {isHovered && (
                <motion.circle
                  cx={x2} cy={y2} r="4" fill="#10B981" filter="url(#vaultGlow)"
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: [0, 1, 0], scale: [0, 1.5, 0] }}
                  transition={{ duration: 2, repeat: Infinity, delay: i * 0.5 }}
                />
              )}
            </g>
          );
        })}
      </g>

      {/* Security Threat Blocks */}
      <g opacity={isHovered ? 0.8 : 0.2}>
        {Array.from({ length: 8 }).map((_, i) => (
          <motion.rect
            key={`block-${i}`}
            x={20 + (i % 2) * 420}
            y={80 + (i * 40) % 300}
            width="20" height="10"
            fill="none"
            stroke={i % 3 === 0 && isHovered ? "#ef4444" : "#ffffff"} // Red for blocked threats
            strokeWidth="1"
            initial={{ opacity: 0.2 }}
            animate={{ 
              opacity: isHovered ? (i % 3 === 0 ? [0.2, 0.8, 0.2] : 0.4) : 0.2,
              x: isHovered && i % 3 === 0 ? [0, (i % 2 === 0 ? 10 : -10), 0] : 0 // Bounce effect for blocked
            }}
            transition={{ duration: 0.5, repeat: Infinity, repeatDelay: Math.random() * 2 }}
          />
        ))}
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
          <text x="40" y="60">POLICY_ENGINE: <tspan fill="#10B981">ENFORCED</tspan></text>
          <text x="40" y="80">TX_BLOCKED: <tspan fill="#ef4444">12</tspan> (SYBIL)</text>
          <text x="40" y="100">ZERO_KNOWLEDGE: VERIFIED</text>
          <text x="40" y="120">INTENT_GATE: SECURE</text>
        </motion.g>
      )}

      <text x="40" y="460" fontFamily="monospace" fontSize="12" fill="#a1a1aa" letterSpacing="4" opacity="0.6">INTENT // RISK_FIREWALL</text>
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
    { x: 108, y: 156, label: "INTENT", info: "X402_PAYLOAD", detail: "0.05 USDC", value: "01" },
    { x: 235, y: 256, label: "VALIDATE", info: "KMS_SIGNATURE", detail: "ZERO_TRUST: PASS", value: "02" },
    { x: 326, y: 360, label: "SETTLE", info: "ATOMIC_ROUTER", detail: "92/8 SPLIT", value: "03" },
    { x: 390, y: 460, label: "MINT", info: "SKILL.MD/.JSON", detail: "VERIFIED_ASSET", value: "04" }
  ];

  const flowPath = "M 108 156 C 190 144 238 184 235 256 C 232 300 304 300 326 360 C 350 410 380 400 390 460";
  const flowDuration = 9.6;
  const nodeKeyPoints = "0;0.369;0.704;1;1";
  const onchainSignals = [
    { x: 78, y: 104, label: "REQ", value: "A2A_CALL" },
    { x: 344, y: 178, label: "FEE", value: "0.05_USDC" },
    { x: 84, y: 400, label: "SPLIT", value: "INSTANT" },
    { x: 328, y: 480, label: "OUT", value: "JSON/MD" },
  ];

  return (
    <svg width="100%" height="100%" viewBox="0 0 500 500" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg" className="bg-transparent mix-blend-screen">
      <defs>
        <radialGradient id="mindFlowAura" cx="50%" cy="46%" r="58%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.14" />
          <stop offset="42%" stopColor="#737373" stopOpacity="0.05" />
          <stop offset="100%" stopColor="#050505" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="mindFlowStroke" x1="70" y1="120" x2="420" y2="480" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.15" />
          <stop offset="48%" stopColor="#ffffff" stopOpacity="0.55" />
          <stop offset="100%" stopColor="#10B981" stopOpacity="0.8" />
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
              opacity: isHovered ? 1 : 0.35,
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
              strokeWidth="1"
              opacity="0.8"
            />
            <text x={signal.x} y={signal.y} fontSize="8" fill="#a1a1aa" letterSpacing="2" fontWeight="600">
              {signal.label}
            </text>
            <text x={signal.x} y={signal.y + 18} fontSize="9" fill="#ffffff" letterSpacing="1.4" fontWeight="700">
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
                    className="font-mono drop-shadow-md"
                  >
                    <text x={textX} y={node.y - 18} fontSize="9" fill="#a1a1aa" letterSpacing="3" textAnchor={textAnchor} fontWeight="600">
                      0{i + 1}
                    </text>
                    <text x={textX} y={node.y - 4} fontSize="12" fill="#ffffff" fontWeight="800" textAnchor={textAnchor}>
                      {node.label}
                    </text>
                    <text x={textX} y={node.y + 12} fontSize="8" fill="#d4d4d8" textAnchor={textAnchor}>
                      {node.info}
                    </text>
                    <text x={textX} y={node.y + 25} fontSize="7" fill="#a1a1aa" textAnchor={textAnchor}>
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

      <g className="font-mono drop-shadow-md" opacity="0.9">
        <text x="52" y="460" fontSize="10" fill="#ffffff" letterSpacing="4" fontWeight="600">MIND_DATA_ART // ATOMIC_FLOW</text>
        <text x="52" y="480" fontSize="8" fill="#a1a1aa" letterSpacing="3">POLICY_SIGNALS_RENDERED_AS_SETTLEMENT_GEOMETRY</text>
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
    setMousePos({ x: 250, y: 300 });
  };

  return (
    <div className="relative group" style={{ perspective: "1000px" }}>
      <div 
        className="metallic-brushed-solana metallic-shine rounded-[3rem] p-0 min-h-[500px] md:min-h-[600px] w-full relative cursor-crosshair transition-all duration-500 group-hover:scale-[1.02] flex flex-col justify-between overflow-hidden"
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={{ 
          transformStyle: 'preserve-3d',
          transform: `rotateX(${(mousePos.y - 300) * -0.02}deg) rotateY(${(mousePos.x - 250) * 0.02}deg)`
        }}
      >
        <div 
          className="absolute inset-0 rounded-[3rem] border border-white/20 pointer-events-none transition-transform duration-500 ease-out z-20"
          style={{ transform: "translateZ(0px)" }}
        />
        <div 
          className="absolute inset-0 rounded-[3rem] border border-white/10 pointer-events-none transition-all duration-500 ease-out opacity-0 group-hover:opacity-100 group-hover:translate-z-[20px] z-20"
          style={{ transform: "translateZ(20px)" }}
        />
        <div 
          className="absolute inset-0 rounded-[3rem] border border-white/20 pointer-events-none transition-all duration-500 ease-out opacity-0 group-hover:opacity-100 group-hover:translate-z-[40px] z-20"
          style={{ transform: "translateZ(40px)", boxShadow: "0 0 30px rgba(255,255,255,0.08)" }}
        />
        
        {/* Camada de Fundo (Clipped) */}
        <div className="absolute inset-0 overflow-hidden rounded-3xl pointer-events-none">
          {/* Glow de reflexo 3D (Hover) */}
          <div 
            className="absolute inset-0 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-700 mix-blend-overlay z-0" 
            style={{
              background: `radial-gradient(circle 400px at ${mousePos.x}px ${mousePos.y}px, rgba(255,255,255,0.1), transparent)`
            }}
          />

          {/* Intelligence Discovery Graph */}
          <div className="absolute inset-0 opacity-50 pointer-events-none transition-all duration-700 group-hover:opacity-80">
            <svg width="100%" height="100%" viewBox="0 0 500 600" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <radialGradient id="glowIntelligence" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#14F195" stopOpacity="0.15" />
                  <stop offset="50%" stopColor="#9945FF" stopOpacity="0.05" />
                  <stop offset="100%" stopColor="#020202" stopOpacity="0" />
                </radialGradient>
                <linearGradient id="beamGrad" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#14F195" stopOpacity="0" />
                  <stop offset="50%" stopColor="#14F195" stopOpacity="0.8" />
                  <stop offset="100%" stopColor="#14F195" stopOpacity="0" />
                </linearGradient>
              </defs>

              {/* Core Neural Glow based on mouse */}
              <circle 
                cx={mousePos.x} 
                cy={mousePos.y} 
                r="350" 
                fill="url(#glowIntelligence)" 
                className="transition-all duration-300 ease-out"
              />

              {/* Orbital Rings representing Discovery Search Space */}
              <g style={{ transformOrigin: "250px 300px" }}>
                <motion.circle cx="250" cy="300" r="150" fill="none" stroke="#ffffff" strokeWidth="0.5" strokeDasharray="4 8" opacity="0.2"
                  animate={{ rotate: 360 }} transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
                />
                <motion.circle cx="250" cy="300" r="220" fill="none" stroke="#ffffff" strokeWidth="0.5" strokeDasharray="2 12" opacity="0.1"
                  animate={{ rotate: -360 }} transition={{ duration: 90, repeat: Infinity, ease: "linear" }}
                />
              </g>

              {/* Connecting Nodes (A2A Network) - Redesigned with Atomic Settlement Esthetics */}
              <g>
                {Array.from({ length: 8 }).map((_, i) => {
                  const angle = (i * 45) * (Math.PI / 180);
                  const radius = 120 + (i % 2) * 80;
                  const cx = 250 + Math.cos(angle) * radius;
                  const cy = 300 + Math.sin(angle) * radius;
                  
                  // Target for connection (forming a complex geometric network)
                  const targetAngle = ((i + 3) * 45) * (Math.PI / 180);
                  const targetRadius = 120 + ((i + 3) % 2) * 80;
                  const tx = 250 + Math.cos(targetAngle) * targetRadius;
                  const ty = 300 + Math.sin(targetAngle) * targetRadius;

                  return (
                    <g key={`intel-node-${i}`}>
                      {/* Atomic Connection Line (Dashed, High Tech) */}
                      <motion.line
                        x1={cx} y1={cy} x2={tx} y2={ty}
                        stroke="#14F195" strokeWidth="1" strokeDasharray="4 4" opacity="0.6"
                        initial={{ pathLength: 0, opacity: 0 }}
                        animate={{ pathLength: [0, 1, 0], opacity: [0, 0.6, 0] }}
                        transition={{ duration: 4 + (i % 2), repeat: Infinity, ease: "linear", delay: i * 0.2 }}
                      />
                      
                      {/* Hexagonal Node Base */}
                      <polygon 
                        points={`${cx},${cy-6} ${cx+5.2},${cy-3} ${cx+5.2},${cy+3} ${cx},${cy+6} ${cx-5.2},${cy+3} ${cx-5.2},${cy-3}`}
                        fill="#020202" stroke="#ffffff" strokeWidth="0.5" opacity="0.8"
                      />
                      
                      {/* Inner Atomic Core */}
                      <circle cx={cx} cy={cy} r="2" fill="#14F195" />
                      
                      {/* Rotating Targeting Reticle around Node */}
                      <motion.g style={{ transformOrigin: `${cx}px ${cy}px` }} animate={{ rotate: 360 }} transition={{ duration: 3 + i, repeat: Infinity, ease: "linear" }}>
                        <path d={`M ${cx-8} ${cy-8} L ${cx-5} ${cy-8} M ${cx-8} ${cy-8} L ${cx-8} ${cy-5}`} stroke="#9945FF" strokeWidth="1" fill="none" opacity="0.8" />
                        <path d={`M ${cx+8} ${cy+8} L ${cx+5} ${cy+8} M ${cx+8} ${cy+8} L ${cx+8} ${cy+5}`} stroke="#9945FF" strokeWidth="1" fill="none" opacity="0.8" />
                      </motion.g>

                      {/* Data Payload Packet (Moving along the line) */}
                      <motion.circle
                        cx={cx} cy={cy} r="1.5" fill="#ffffff"
                        animate={{
                          cx: [cx, tx],
                          cy: [cy, ty],
                          opacity: [0, 1, 0]
                        }}
                        transition={{ duration: 2 + (i % 2), repeat: Infinity, ease: "easeInOut", delay: i * 0.5 }}
                        style={{ filter: "drop-shadow(0 0 4px #ffffff)" }}
                      />

                      {/* Technical Label */}
                      <text x={cx + 12} y={cy + 3} fontSize="6" fill="#a1a1aa" fontFamily="monospace" letterSpacing="1">
                        TX_{i.toString().padStart(2, '0')}
                      </text>
                      <text x={cx + 12} y={cy + 10} fontSize="5" fill="#14F195" fontFamily="monospace" opacity="0.7">
                        SETTLED
                      </text>
                    </g>
                  );
                })}
              </g>

              {/* Grid overlay for tactical feel */}
              <g opacity="0.05">
                {Array.from({ length: 10 }).map((_, i) => (
                  <line key={`v-${i}`} x1={i * 50} y1="0" x2={i * 50} y2="600" stroke="#ffffff" strokeWidth="1" />
                ))}
                {Array.from({ length: 12 }).map((_, i) => (
                  <line key={`h-${i}`} x1="0" y1={i * 50} x2="500" y2={i * 50} stroke="#ffffff" strokeWidth="1" />
                ))}
              </g>
            </svg>
          </div>
        </div>

        {/* Foreground Content - Pops out in 3D */}
          <div 
            className="relative z-10 h-full flex flex-col justify-between transition-transform duration-200 drop-shadow-md p-6"
            style={{ transform: `translateZ(40px)` }}
          >
            {/* Top Bar */}
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <div className="text-[10px] font-mono text-[#14F195] uppercase tracking-[0.3em] flex items-center gap-2 font-bold drop-shadow-md">
                  <span className="w-1.5 h-1.5 bg-[#14F195] rounded-full animate-pulse shadow-[0_0_8px_#14F195]"></span>
                  A2A Intelligence Discovery
                </div>
                <div className="text-xl font-bold text-white tracking-tight font-mono">MIND_CORE Network.</div>
              </div>
              <Badge variant="outline" className="border-[#9945FF]/40 bg-[#9945FF]/10 text-[#9945FF] font-mono text-[8px] uppercase tracking-widest px-3 backdrop-blur-md">
                Live Map
              </Badge>
            </div>

            <div className="flex-1" />

            {/* Bottom Bar: 4 Metrics Distributed */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pointer-events-none items-end">
              <div className="space-y-1">
                <div className="text-[8px] font-mono uppercase tracking-[0.2em] text-zinc-500 font-bold">Indexed Skills</div>
                <div className="flex items-baseline gap-2">
                  <div className="text-2xl font-mono tracking-tight text-white font-bold drop-shadow-md">8,402</div>
                  <div className="text-[10px] font-mono text-[#14F195] font-bold drop-shadow-[0_0_8px_rgba(20,241,149,0.5)]">Live</div>
                </div>
              </div>
              
              <div className="space-y-1">
                <div className="text-[8px] font-mono uppercase tracking-[0.2em] text-zinc-500 font-bold">Semantic Match</div>
                <div className="flex items-baseline gap-2">
                  <div className="text-2xl font-mono tracking-tight text-white font-bold drop-shadow-md">99.8%</div>
                  <div className="text-[10px] font-mono text-[#14F195] font-bold drop-shadow-[0_0_8px_rgba(20,241,149,0.5)]">Optimal</div>
                </div>
              </div>

              <div className="space-y-1">
                <div className="text-[8px] font-mono uppercase tracking-[0.2em] text-zinc-500 font-bold">Schema Status</div>
                <div className="flex items-baseline gap-2">
                  <div className="text-2xl font-mono tracking-tight text-white font-bold drop-shadow-md">JSON-LD</div>
                  <div className="text-[10px] font-mono text-[#14F195] font-bold drop-shadow-[0_0_8px_rgba(20,241,149,0.5)]">Verified</div>
                </div>
              </div>

              <div className="space-y-1 md:text-right">
                <div className="text-[8px] font-mono uppercase tracking-[0.2em] text-zinc-500 font-bold">Discovery Ping</div>
                <div className="flex items-baseline md:justify-end gap-2">
                  <div className="text-2xl font-mono tracking-tight text-white font-bold drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]">&lt; 45ms</div>
                  <div className="text-[10px] font-mono text-[#14F195] font-bold drop-shadow-[0_0_8px_rgba(20,241,149,0.5)]">Global</div>
                </div>
              </div>
            </div>
            
          </div>
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
    <svg width="100%" height="100%" viewBox="0 0 500 500" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg" className="bg-[#050505]">
      <defs>
        <radialGradient id="buildersGrad" cx="50%" cy="50%" r="50%">
          <stop offset="0%" style={{ stopColor: "#ffffff", stopOpacity: 0.08 }} />
          <stop offset="100%" style={{ stopColor: "#050505", stopOpacity: 0 }} />
        </radialGradient>
      </defs>
      <rect width="500" height="500" fill="url(#buildersGrad)" />

      {/* Grid Background */}
      <g opacity="0.03">
        {Array.from({ length: 20 }).map((_, i) => (
          <line key={`v-${i}`} x1={i * 25} y1="0" x2={i * 25} y2="500" stroke="#ffffff" strokeWidth="0.5" />
        ))}
        {Array.from({ length: 20 }).map((_, i) => (
          <line key={`h-${i}`} x1="0" y1={i * 25} x2="500" y2={i * 25} stroke="#ffffff" strokeWidth="0.5" />
        ))}
      </g>

      {/* Title Section within SVG */}
      <g transform="translate(40, 60)" className="drop-shadow-md">
        <text fontSize="10" fill="#a1a1aa" fontFamily="monospace" letterSpacing="3" fontWeight="600">CONTRACTUAL LOGIC</text>
        <text y="24" fontSize="24" fill="#ffffff" fontWeight="800">Execution Constraints.</text>
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
                height="1" fill="#10B981" 
                initial={{ scaleX: 0 }}
                animate={{ scaleX: activeStep === 0 ? 1 : 1 }}
                style={{ originX: 0 }}
                transition={{ duration: 1.5, ease: "circOut" }}
              />
              <circle cx="0" cy="0.5" r="2.5" fill="#10B981" />
              <circle cx="320" cy="0.5" r="2.5" fill="#10B981" />
              <text y="15" fontSize="10" fill="#ffffff" fontFamily="monospace" fontWeight="bold">92% PROVIDER</text>
              <text x="350" y="15" fontSize="10" fill="#a1a1aa" fontFamily="monospace" textAnchor="end" fontWeight="bold">8% MIND</text>
            </g>
          </g>
        </motion.g>

        {/* STEP 02: EVIDENCE / PROOF BUNDLE */}
        <motion.g 
          transform="translate(0, 120)"
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
                fill="none" stroke="#10B981" strokeWidth="2"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: activeStep === 1 ? 1 : 0 }}
                transition={{ duration: 0.5, delay: 1 }}
              />
              <g transform="translate(110, 60)">
                <text fontSize="10" fill="#ffffff" fontFamily="monospace" fontWeight="bold">PROOF: ATTACHED</text>
                <text y="12" fontSize="8" fill="#10B981" fontFamily="monospace" fontWeight="bold">METAPLEX_CORE_ID</text>
              </g>
            </g>
          </g>
        </motion.g>

        {/* STEP 03: ESCROW RELEASE */}
        <motion.g 
          transform="translate(0, 260)"
          animate={{ opacity: activeStep === 2 ? 1 : 0.05 }}
          transition={{ duration: 0.8 }}
        >
          <g transform="translate(0, 0)">
            <text fontSize="10" fill="#ffffff" fontFamily="monospace" fontWeight="bold">03 // {steps[2].title.toUpperCase()}</text>
            <text y="15" fontSize="8" fill="#a1a1aa" fontFamily="sans-serif" opacity="0.8">{steps[2].desc}</text>
            
            <g transform="translate(0, 40)">
              <motion.circle 
                cx="40" cy="40" r="35" 
                fill="none" stroke="#10B981" strokeWidth="1"
                animate={{ 
                  r: activeStep === 2 ? [35, 38, 35] : 35,
                  opacity: activeStep === 2 ? [0.2, 1, 0.2] : 0.1
                }}
                transition={{ duration: 2, repeat: Infinity }}
              />
              <motion.path 
                d="M 85,40 L 220,40" 
                stroke="#10B981" strokeWidth="1" strokeDasharray="3"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ 
                  pathLength: activeStep === 2 ? 1 : 0,
                  opacity: activeStep === 2 ? 1 : 0
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
                <text fontSize="10" fill="#ffffff" fontFamily="monospace" fontWeight="bold">RELEASED</text>
                <text y="12" fontSize="8" fill="#10B981" fontFamily="monospace" fontWeight="bold">TX: 5tWq...9pZm</text>
              </motion.g>
            </g>
          </g>
        </motion.g>
      </g>

      <text x="50" y="640" fontFamily="monospace" fontSize="10" fill="#a1a1aa" letterSpacing="4" opacity="0.6" fontWeight="600">MIND // BUILDER_MATRIX_v1.0</text>
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
  const [videoSrc, setVideoSrc] = useState<string>("/sanduiche_rev_mind_solana_core.mp4");

  // Fetch the video once and cache it in memory to prevent net::ERR_ABORTED during scrub
  useEffect(() => {
    // @ts-ignore - store on window to prevent strict mode double-fetch or unmount issues
    if (window.__cachedVideoBlobUrl) {
      // @ts-ignore
      setVideoSrc(window.__cachedVideoBlobUrl);
      return;
    }

    fetch("/sanduiche_rev_mind_solana_core.mp4")
      .then(res => res.blob())
      .then(blob => {
        const url = URL.createObjectURL(blob);
        // @ts-ignore
        window.__cachedVideoBlobUrl = url;
        setVideoSrc(url);
      })
      .catch(console.error);
  }, []);

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

  const targetTime = useRef<number | null>(null);

  useMotionValueEvent(scrollYProgress, "change", (latest: number) => {
    if (videoRef.current && videoRef.current.duration && !Number.isNaN(videoRef.current.duration)) {
      const time = latest * videoRef.current.duration;
      requestAnimationFrame(() => {
        if (videoRef.current) {
          if (!videoRef.current.seeking) {
            videoRef.current.currentTime = time;
          } else {
            targetTime.current = time;
          }
        }
      });
    }
  });

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const onSeeked = () => {
      if (targetTime.current !== null && video) {
        video.currentTime = targetTime.current;
        targetTime.current = null;
      }
    };

    video.addEventListener("seeked", onSeeked);
    return () => video.removeEventListener("seeked", onSeeked);
  }, []);

  useEffect(() => {
    if (!videoRef.current) return;
    const handleLoadedMetadata = () => {
      if (videoRef.current && !Number.isNaN(videoRef.current.duration)) {
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
            src={videoSrc}
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
            MIND Agent Economy
          </Badge>

          <h2 className="text-4xl md:text-5xl font-bold text-white tracking-tight leading-[1.1] font-mono uppercase">
            A2A SEO & <br />
            <span className="italic font-light opacity-60 text-zinc-400">Discovery.</span>
          </h2>

          <p className="text-zinc-500 leading-relaxed font-light text-lg">
            O SEO para Bots (A2A SEO) não foca em palavras-chave para humanos, mas em legibilidade de máquina e prova de autoridade. Em um mundo onde o Agente A pergunta ao Agente B se ele é confiável, o ranking é decidido pela precisão dos metadados e contratos atômicos on-chain.
          </p>

          <div className="space-y-6 pt-4">
            {/* Pillar 1: Agent-Discovery e ai-txt */}
            <div className="flex gap-6 items-start">
              <div className="w-10 h-10 rounded-full bg-white/5 border border-white/30 flex items-center justify-center shrink-0">
                <Search className="w-4 h-4 text-white" />
              </div>
              <div className="space-y-1">
                <h4 className="text-white font-medium font-mono uppercase text-sm tracking-widest">Agent-Discovery & ai-txt</h4>
                <p className="text-zinc-500 text-sm font-light">Arquivos de configuração (A2A Protocol) onde o agente declara capacidades, endpoints e termos. Legibilidade instantânea para máquinas.</p>
              </div>
            </div>

            {/* Pillar 2: Structured Data */}
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="flex gap-6 items-start group"
            >
              <div className="w-10 h-10 rounded-full bg-white/5 border border-white/30 flex items-center justify-center shrink-0 group-hover:border-white/20 transition-colors duration-500">
                <Database className="w-4 h-4 text-white" />
              </div>
              <div className="space-y-1">
                <h4 className="text-white font-medium font-mono uppercase text-sm tracking-widest">Structured Data (JSON-LD)</h4>
                <p className="text-zinc-500 text-sm font-light">Para um bot, texto bonito é ruído. Atributos técnicos e metadados estruturados permitem mapeamento milissegundo de serviços e comparativos.</p>
              </div>
            </motion.div>

            {/* Pillar 3: Agent Cards */}
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
                <h4 className="text-white font-medium font-mono uppercase text-sm tracking-widest">Agent Cards (Capability)</h4>
                <p className="text-zinc-500 text-sm font-light">A confiança exige verificabilidade. Exposição de chaves públicas, histórico de sucesso e reputação via transações atômicas on-chain.</p>
              </div>
            </motion.div>

            {/* Pillar 4: API-First Indexing */}
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
              className="flex gap-6 items-start group"
            >
              <div className="w-10 h-10 rounded-full bg-white/5 border border-white/30 flex items-center justify-center shrink-0 group-hover:border-white/20 transition-colors duration-500">
                <Zap className="w-4 h-4 text-white" />
              </div>
              <div className="space-y-1">
                <h4 className="text-white font-medium font-mono uppercase text-sm tracking-widest">API-First Indexing</h4>
                <p className="text-zinc-500 text-sm font-light">Documentação técnica impecável para LLMs. Se o modelo não sabe como chamar sua função via OpenAPI, você é invisível para a rede.</p>
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
              title: "ECHO_INDEXER",
              subtitle: "Data Vertical",
              description: "Indexing-grade intelligence. Queryable truth with explicit cost and verifiable delivery.",
              stats: [
                { label: "Latency Power", value: "180ms", hint: "p50 quote" },
                { label: "Throughput", value: "42 req/s", hint: "burst" },
                { label: "Compute Units", value: "8.2k", hint: "sim depth" },
                { label: "Settlement", value: "Darkpool UTXO", hint: "x402 cloak" }
              ],
              card: { id: "echo", name: "ECHO_INDEXER", type: "Data Agent", price: "$0.05 / req", Art: IndexerRadarCardSVG }
            },
            {
              id: "security",
              indexLabel: "02",
              title: "SYBIL_NODE",
              subtitle: "Security Vertical",
              description: "CNB Link Intelligence. Sybil risk classification and Node Health Index scoring for DePINs.",
              stats: [
                { label: "Origin", value: "The Garage", hint: "SP" },
                { label: "Badge", value: "Genesis", hint: "Builder" },
                { label: "Network", value: "Solana", hint: "Mainnet" },
                { label: "VSC", value: "Compliant", hint: "Read-only" }
              ],
              card: { id: "sybil", name: "SYBIL_NODE", type: "Security Agent", price: "$0.01 / scan", Art: SybilNodeCardSVG }
            },
            {
              id: "yield",
              indexLabel: "03",
              title: "JIT_ROUTER",
              subtitle: "Yield Vertical",
              description: "Composable yield execution. Explicit rails, predictable settlement, opt-in strategies.",
              stats: [
                { label: "Latency Power", value: "240ms", hint: "p50 route" },
                { label: "Throughput", value: "18 exec/s", hint: "safe" },
                { label: "Compute Units", value: "12.6k", hint: "route sim" },
                { label: "Settlement", value: "Atomic", hint: "opt-in" }
              ],
              card: { id: "jit", name: "JIT_ROUTER", type: "Yield Agent", price: "$0.005 / exec", Art: JitRouterCardSVG }
            },
            {
              id: "risk",
              indexLabel: "04",
              title: "INTENT_GATE",
              subtitle: "Risk Vertical",
              description: "Pre-trade and runtime policy checks. Deterministic gating before any capital moves.",
              stats: [
                { label: "Latency Power", value: "95ms", hint: "p50 scan" },
                { label: "Throughput", value: "120 scans/s", hint: "batch" },
                { label: "Compute Units", value: "4.1k", hint: "rules" },
                { label: "Settlement", value: "Gated", hint: "policy" }
              ],
              card: { id: "intent", name: "INTENT_GATE", type: "Risk Agent", price: "$0.02 / scan", Art: KriosCardSVG }
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
            className="metallic-brushed-solana aspect-[4/5] rounded-[3rem] bg-[#020202] border border-white/20 overflow-hidden relative cursor-crosshair shadow-[0_0_30px_rgba(0,0,0,0.5)]"
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
              Money as a message. <br />
              <span className="italic font-light opacity-60">Liquid skills.</span>
            </h2>
            <p className="text-zinc-500 leading-relaxed font-light text-lg">
              Value flows atomically, transforming an intent into a verifiable execution. Money travels as a payload, unlocking intelligence and settling in milliseconds to deliver standard <code className="text-zinc-400 font-mono bg-white/5 px-1 py-0.5 rounded">.md</code> and <code className="text-zinc-400 font-mono bg-white/5 px-1 py-0.5 rounded">.json</code> agent skills.
            </p>
          </div>

          <div className="space-y-10">
            {[
              { id: "01", title: "Intent Payload (x402)", desc: "An agent requests a skill execution attaching a micro-payment as a message payload." },
              { id: "02", title: "KMS Validation", desc: "The API Gateway applies Zero-Trust verification of the payload and wallet signature." },
              { id: "03", title: "Atomic Settlement", desc: "Funds are routed (92% Creator / 8% Protocol) at the exact millisecond of execution." },
              { id: "04", title: "Manifest Generation", desc: "The final intelligence is minted as verifiable .md (logic) and .json (schema) artifacts." }
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
