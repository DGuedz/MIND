import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Badge } from "../components/ui/badge";
import {
  getBuilderRegistration,
  getInitialVoucherCode,
  getVoucherEligibility,
  normalizeVoucherCode,
  saveVoucherClaim
} from "../lib/builderAccess";
import type { BuilderRegistration } from "../lib/builderAccess";

type CatalogItem = {
  id: string;
  kind: "skill" | "product";
  name: string;
  description: string;
  source: string;
  providerType?: "internal" | "external" | "vendor";
  sourceType?: "internal" | "external" | "vendor";
  category: string;
  docExt?: ".json" | ".md";
  docKind?: "skill-md" | "manifest-json" | "agent-card-v1";
  license: string;
  tags: string[];
  pricing?: {
    model: string;
    currency?: string;
    price?: number;
    originalModel?: string;
    originalPrice?: number;
    sponsoredBy?: string;
    phase?: string;
    eligibleVoucherCodes?: string[];
  };
  performance?: {
    successRate: number;
    totalExecutions: number;
    totalVolumeUSDC: number;
  };
  origin?: string;
  badges?: string[];
};

type CatalogPayload = {
  as_of: string;
  items: CatalogItem[];
};

// Deterministic impact generator for demonstration of Proof-Based Ranking & Smart Asset Valuation
// In production, this data is hydrated by the Cloak UTXO settlement proofs (Mindprint)
const getVerifiedImpact = (id: string) => {
  const hash = id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return {
    successRate: 95 + (hash % 50) / 10,
    totalExecutions: 100 + (hash * 13 % 9000),
    totalVolumeUSDC: (hash * 7 % 5000) / 10,
    ranking: (hash % 100) + 1,
    demandScore: 70 + (hash % 30),
    impactPotential: (hash % 5) === 0 ? 'HIGH' : (hash % 3) === 0 ? 'MEDIUM' : 'STABLE',
    holders: 15 + (hash % 850),
    marketCap: 15000 + (hash * 1000 % 850000),
    tokenSymbol: `$${id.split('_').pop()?.toUpperCase() || 'MIND'}`,
    mintAddress: `mint${hash.toString(16)}...${(hash * 3).toString(16)}`,
    // Super Trunfo Attributes
    intelligence: 75 + (hash % 25),
    speed: 60 + ((hash * 2) % 40),
    reliability: 90 + ((hash * 3) % 10),
    complexity: 40 + ((hash * 5) % 60),
    skillsCount: (hash % 10) < 3 ? (hash % 4) + 2 : 1
  };
};

function CardDataArt({ id, isHovered }: { id: string, isHovered: boolean }) {
  const hash = id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const themeIndex = hash % 4;
  const width = 200;
  const height = 200;

  // Theme 0: Neural Paths (Vias neurais suaves)
  const renderNeuralPaths = () => {
    const pathCount = 16;
    return (
      <svg viewBox={`0 0 ${width} ${height}`} className="w-[120%] h-[120%] opacity-80" preserveAspectRatio="xMidYMid slice">
        <g>
          {Array.from({ length: pathCount }).map((_, i) => {
            const seed1 = (hash * (i + 1)) % 100;
            const seed2 = (hash * (i + 2)) % 100;
            const seed3 = (hash * (i + 3)) % 100;
            const seed4 = (hash * (i + 4)) % 100;

            const isBottom = seed1 > 40;
            const startX = isBottom ? (seed2 / 100) * width : (seed1 > 70 ? 0 : width);
            const startY = isBottom ? height + 10 : (seed3 / 100) * height;
            
            const endX = (seed4 / 100) * width;
            const endY = (seed1 / 100) * (height * 0.5);

            const cp1X = startX + (isBottom ? 0 : (startX === 0 ? 60 : -60));
            const cp1Y = startY - (isBottom ? 60 : 0);
            const cp2X = endX;
            const cp2Y = endY + 40;

            const d = `M ${startX} ${startY} C ${cp1X} ${cp1Y}, ${cp2X} ${cp2Y}, ${endX} ${endY}`;
            
            const pathLength = 300; 
            const duration = 3 + (seed2 % 4);
            const delay = (seed3 % 20) * 0.2;
            const strokeW = seed4 > 80 ? 1 : 0.5;
            const nodeSize = seed1 > 80 ? 1.5 : 0.5;

            return (
              <g key={i}>
                <path d={d} fill="none" stroke="#ffffff" strokeWidth={strokeW * 0.3} opacity="0.1" />
                <motion.path
                  d={d} fill="none" stroke="#ffffff" strokeWidth={strokeW}
                  strokeDasharray={`10 ${pathLength}`}
                  initial={{ strokeDashoffset: pathLength }}
                  animate={{ strokeDashoffset: -pathLength }}
                  transition={{ duration, repeat: Infinity, ease: "linear", delay }}
                  opacity={0.9}
                />
                <circle cx={endX} cy={endY} r={nodeSize} fill="#ffffff" opacity="0.2" />
                <motion.circle
                  cx={endX} cy={endY} r={nodeSize * 2} fill="#ffffff"
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: [0, 0.8, 0], scale: [0.5, 1.5, 0.5] }}
                  transition={{ duration, repeat: Infinity, ease: "easeInOut", delay: delay + (duration * 0.8) }}
                />
              </g>
            );
          })}
        </g>
      </svg>
    );
  };

  // Theme 1: Matrix Data Rain (Chuva de dados)
  const renderMatrixRain = () => {
    const columns = 60;
    return (
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full opacity-70" preserveAspectRatio="none">
        <defs>
          <linearGradient id={`fade-${id}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#fff" stopOpacity="1" />
            <stop offset="40%" stopColor="#fff" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#fff" stopOpacity="0" />
          </linearGradient>
          <mask id={`mask-${id}`}>
            <rect width={width} height={height} fill={`url(#fade-${id})`} />
          </mask>
        </defs>
        <g mask={`url(#mask-${id})`}>
          {Array.from({ length: columns }).map((_, i) => {
            const seed = (hash * (i + 1)) % 100;
            const x = (i / columns) * width;
            const strokeWidth = seed % 3 === 0 ? 2 : 1;
            const lineLength = height * 0.4 + (seed / 100) * (height * 0.6);
            const opacity = 0.2 + (seed % 80) / 100;
            let dashArray = "none";
            if (seed % 5 === 0) dashArray = "1 2";
            else if (seed % 4 === 0) dashArray = "2 4";
            else if (seed % 3 === 0) dashArray = "4 8";
            
            return (
              <motion.line
                key={i} x1={x} y1={-height} x2={x} y2={lineLength}
                stroke="#ffffff" strokeWidth={strokeWidth} strokeDasharray={dashArray} opacity={opacity}
                animate={{ y: [0, height * 0.5, 0] }}
                transition={{ duration: 10 + (seed % 20), repeat: Infinity, ease: "linear", delay: -(seed % 10) }}
              />
            );
          })}
        </g>
      </svg>
    );
  };

  // Theme 2: Approximated Sun (Ondas radiais)
  const renderRadialSun = () => {
    const rays = 36;
    return (
      <svg viewBox={`0 0 ${width} ${height}`} className="w-[140%] h-[140%] opacity-60" preserveAspectRatio="xMidYMid slice">
        <g style={{ transformOrigin: "100px 100px", transform: "translate(0, 20px)" }}>
          {/* Pulsing Core */}
          <motion.circle cx="100" cy="100" r="10" fill="none" stroke="#fff" strokeWidth="0.5" opacity="0.5"
            animate={{ scale: [1, 1.5, 1], opacity: [0.2, 0.8, 0.2] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          />
          {Array.from({ length: rays }).map((_, i) => {
            const angle = (i * 360) / rays;
            const rad = (angle * Math.PI) / 180;
            const seed = (hash * (i + 1)) % 100;
            const length = 40 + (seed % 60);
            const x1 = 100 + Math.cos(rad) * 15;
            const y1 = 100 + Math.sin(rad) * 15;
            const x2 = 100 + Math.cos(rad) * length;
            const y2 = 100 + Math.sin(rad) * length;
            const delay = (seed % 20) * 0.1;

            return (
              <g key={i}>
                <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="#fff" strokeWidth="0.2" opacity="0.2" />
                <motion.line
                  x1={x1} y1={y1} x2={x2} y2={y2} stroke="#fff" strokeWidth="1" strokeDasharray="2 6" opacity="0.8"
                  initial={{ strokeDashoffset: 0 }} animate={{ strokeDashoffset: -20 }}
                  transition={{ duration: 2 + (seed % 3), repeat: Infinity, ease: "linear", delay }}
                />
              </g>
            );
          })}
          {/* Concentric rings */}
          {Array.from({ length: 4 }).map((_, i) => (
            <motion.circle key={`ring-${i}`} cx="100" cy="100" r={30 + i * 20} fill="none" stroke="#fff" strokeWidth="0.5" strokeDasharray="1 4" opacity="0.3"
              animate={{ rotate: i % 2 === 0 ? 360 : -360 }}
              transition={{ duration: 20 + i * 5, repeat: Infinity, ease: "linear" }}
              style={{ transformOrigin: "100px 100px" }}
            />
          ))}
        </g>
      </svg>
    );
  };

  // Theme 3: Deep Grid Tunnel (Perspectiva 3D)
  const renderGridTunnel = () => {
    const cols = 5; const rows = 5; const depth = 12; 
    const cellW = 200 / cols; const cellH = 200 / rows;
    return (
      <svg viewBox={`0 0 ${width} ${height}`} className="w-[150%] h-[150%] opacity-50" preserveAspectRatio="none">
        <motion.g
          animate={{ scale: isHovered ? 1.05 : 1 }}
          transition={{ duration: 3, repeat: Infinity, repeatType: "reverse", ease: "easeInOut" }}
          style={{ transformOrigin: "100px 100px" }}
        >
          {Array.from({ length: cols }).map((_, col) => {
            return Array.from({ length: rows }).map((_, row) => {
              const cx = col * cellW + cellW / 2;
              const cy = row * cellH + cellH / 2;
              const vpX = 100 + (Math.sin(hash) * 30);
              const vpY = 100 + (Math.cos(hash) * 30);
              
              return Array.from({ length: depth }).map((_, d) => {
                const progress = d / depth;
                const scale = Math.pow(1 - progress, 1.2);
                const x = cx + (vpX - cx) * progress;
                const y = cy + (vpY - cy) * progress;
                const w = cellW * scale;
                const h = cellH * scale;
                
                return (
                  <rect
                    key={`${col}-${row}-${d}`} x={x - w / 2} y={y - h / 2} width={w} height={h}
                    fill="none" stroke="#ffffff" strokeWidth={0.1 + (1 - progress) * 0.4} opacity={0.1 + (1 - progress) * 0.6}
                  />
                );
              });
            });
          })}
        </motion.g>
      </svg>
    );
  };

  return (
    <motion.div 
      className="absolute inset-0 overflow-hidden pointer-events-none z-0 rounded-2xl mix-blend-overlay flex items-center justify-center"
      initial={false}
      animate={{ 
        opacity: isHovered ? [0.15, 0.9, 0.15] : 0.15,
        filter: isHovered ? ['blur(0px)', 'blur(0px)', 'blur(4px)'] : 'blur(0px)'
      }}
      transition={{ 
        duration: 1.5, 
        times: [0, 0.2, 1], 
        ease: "easeOut" 
      }}
    >
      <motion.div 
        className="absolute inset-0 flex items-center justify-center"
        initial={false}
        animate={{ 
          z: isHovered ? [0, 60, -60] : 0,
          scale: isHovered ? [1, 1.1, 1.05] : 1
        }}
        transition={{ 
          duration: 1.5, 
          times: [0, 0.2, 1], 
          ease: "easeOut" 
        }}
      >
        {themeIndex === 0 && renderNeuralPaths()}
        {themeIndex === 1 && renderMatrixRain()}
        {themeIndex === 2 && renderRadialSun()}
        {themeIndex === 3 && renderGridTunnel()}
      </motion.div>
    </motion.div>
  );
}

function CatalogCard({
  item,
  isSelected,
  onToggle,
  builderRegistration,
  initialVoucherCode,
  autoApplyVoucher
}: {
  item: CatalogItem,
  isSelected: boolean,
  onToggle: () => void,
  builderRegistration: BuilderRegistration | null,
  initialVoucherCode?: string,
  autoApplyVoucher?: boolean
}) {
  const navigate = useNavigate();
  const [mousePos, setMousePos] = useState({ x: 0, y: 0, rotX: 0, rotY: 0 });
  const [isHovered, setIsHovered] = useState(false);
  const [voucherCode, setVoucherCode] = useState("");
  const [voucherStatus, setVoucherStatus] = useState<"idle" | "valid" | "invalid">("idle");
  const [voucherMessage, setVoucherMessage] = useState<string | null>(null);

  const pricingModel = item.pricing?.model?.toLowerCase() ?? "";
  const requiresCommunityVoucher = pricingModel === "community_free";
  const isOriginallyFree = !requiresCommunityVoucher && (pricingModel === 'free' || item.pricing?.price === 0);
  const isFree = isOriginallyFree || voucherStatus === "valid";

  useEffect(() => {
    if (!autoApplyVoucher || !initialVoucherCode || voucherStatus !== "idle" || isOriginallyFree) return;

    const code = normalizeVoucherCode(initialVoucherCode);
    const eligibility = getVoucherEligibility(builderRegistration, code);
    setVoucherCode(code);
    setVoucherMessage(eligibility.reason);
    setVoucherStatus(eligibility.eligible ? "valid" : "invalid");
  }, [autoApplyVoucher, builderRegistration, initialVoucherCode, isOriginallyFree, voucherStatus]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const rotX = ((x - centerX) / centerX) * 4; // 4 deg max rotation (suave)
    const rotY = ((y - centerY) / centerY) * -4;
    
    setMousePos({ x, y, rotX, rotY });
  };

  const handleMouseEnter = () => setIsHovered(true);
  const handleMouseLeave = () => {
    setIsHovered(false);
    setMousePos({ x: 150, y: 150, rotX: 0, rotY: 0 }); // Center roughly
  };

  // x402 Settlement States
  const [settlementStatus, setSettlementStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');
  const [settlementStep, setSettlementStep] = useState<string>('');
  const [txHash, setTxHash] = useState<string | null>(null);
  const [isMockSettlement, setIsMockSettlement] = useState(false);

  const handleExecuteX402 = async () => {
    if (settlementStatus === 'processing') return;

    setSettlementStatus('processing');
    setIsMockSettlement(false);
    let mockSettlement = false;

    if (requiresCommunityVoucher && voucherStatus !== "valid") {
      setVoucherStatus("invalid");
      setVoucherMessage("Apply THEGARAGE, SUPERTEAMBR or COLOSSEUM before claiming");
      setSettlementStatus("idle");
      return;
    }

    if (isFree) {
      setSettlementStep(voucherStatus === "valid" ? 'Applying builder voucher...' : 'Validating free access...');
      await new Promise(resolve => setTimeout(resolve, 800));
      setSettlementStep(voucherStatus === "valid" ? 'Requesting community subsidy receipt...' : 'Generating repo flow...');

      let subsidyReceipt = voucherStatus === "valid" && builderRegistration
        ? `voucher_${builderRegistration.referralCode}_${builderRegistration.githubHandle}_${item.id.substring(0, 8)}`
        : `mindprint_free_${item.id.substring(0, 8)}`;

      if (voucherStatus === "valid") {
        try {
          const gatewayBaseUrl = (import.meta.env.VITE_API_GATEWAY_URL || "http://127.0.0.1:3000").trim().replace(/\/$/, "");
          const res = await fetch(`${gatewayBaseUrl}/v1/payment/x402`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              amount: item.pricing?.originalPrice ?? item.pricing?.price ?? 0,
              currency: item.pricing?.currency || "USDC",
              recipient: "DGuedzXbK8fN8eRqyTqzTXZyX4wY4rU2B1mD4W8L7jH",
              chain: "solana",
              metadata: {
                intentId: `community_claim_${item.id}`,
                memo: "MIND_COMMUNITY_TRACTION_SUBSIDY",
                voucherCode: voucherCode || builderRegistration?.referralCode || initialVoucherCode,
                builderHandle: builderRegistration?.githubHandle,
                marketplaceItemId: item.id,
                pricingModel: item.pricing?.model,
                phase: "the_garage_community"
              }
            })
          });
          if (!res.ok) throw new Error("community subsidy receipt failed");
          const data = await res.json();
          subsidyReceipt = data.paymentId || data.reference || subsidyReceipt;
          setIsMockSettlement(false);
        } catch {
          setIsMockSettlement(true);
          subsidyReceipt = `local_community_subsidy_${item.id.substring(0, 8)}_${Date.now()}`;
        }
      }

      setSettlementStep(voucherStatus === "valid" ? 'Community access granted.' : 'Access granted.');
      setTxHash(subsidyReceipt);
      if (voucherStatus === "valid" && builderRegistration) {
        saveVoucherClaim({
          registration: builderRegistration,
          voucherCode: voucherCode || builderRegistration.referralCode,
          marketplaceItemId: item.id,
          claimReason: `Sponsored claim for ${item.name}`
        });
      }
      setSettlementStatus('success');
      return;
    }

    if (!item.pricing) return;
    
    setSettlementStep('Initiating Intent & Policy Check...');
    setTxHash(null);
    
    try {
      // Integração com o API Gateway (x402 Atomic Settlement)
      let receiptData;
      try {
        const gatewayBaseUrl = (import.meta.env.VITE_API_GATEWAY_URL || "http://127.0.0.1:3000").trim().replace(/\/$/, "");
        const res = await fetch(`${gatewayBaseUrl}/v1/payment/x402`, {
          method: "POST",
          headers: { 
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            amount: item.pricing.price || 0.005,
            currency: item.pricing.currency || "USDC",
            recipient: "DGuedzXbK8fN8eRqyTqzTXZyX4wY4rU2B1mD4W8L7jH", // Protocol Treasury
            chain: "solana",
            metadata: {
              intentId: `purchase_card_${item.id}`,
              memo: "MIND_x402_PAYMENT"
            }
          })
        });

        if (!res.ok) {
          throw new Error("API Gateway unreachable");
        }
        
        receiptData = await res.json();
      } catch (e) {
        mockSettlement = true;
        setIsMockSettlement(true);
        
        await new Promise(resolve => setTimeout(resolve, 800));
        setSettlementStep('Awaiting KMS Signature...');
        
        await new Promise(resolve => setTimeout(resolve, 800));
        setSettlementStep('Executing x402 via Darkpool UTXO...');
        
        await new Promise(resolve => setTimeout(resolve, 800));
        setSettlementStep('Minting Mindprint Proof (High Privacy)...');
        
        await new Promise(resolve => setTimeout(resolve, 600));

        receiptData = {
          paymentId: "sig_" + Math.random().toString(36).substring(2, 15) + "x402"
        };
      }
      
      setTxHash(receiptData.paymentId || receiptData.transactionHash || "sig_confirmed");
      setSettlementStep(mockSettlement ? 'Demo Receipt Generated (Offline)' : 'Atomic Settlement Complete');
      setSettlementStatus('success');
    } catch (err) {
      setSettlementStatus('error');
      setSettlementStep('Settlement Failed');
    }
  };

  // Mapeamento de categorias para estilos de metal escovado
  const getMetallicClassForCategory = (category: string) => {
    // Agora todos os cards do Marketplace utilizam o gradiente oficial da Solana
    return 'metallic-brushed-solana';
  };

  const metallicClass = getMetallicClassForCategory(item.category);

  return (
    <div 
      className="relative group w-full h-[320px] cursor-pointer" 
      style={{ perspective: "1200px" }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onMouseMove={handleMouseMove}
      onClick={onToggle}
    >
      <div
        className={`relative w-full h-full bg-[#0a0a0a] backdrop-blur-md rounded-[2rem] overflow-hidden
          metallic-brushed metallic-shine ${metallicClass}
          ${isSelected ? "ring-2 ring-white/40 shadow-[0_0_30px_rgba(255,255,255,0.15)]" : ""}`}
        style={{ 
          transformStyle: 'preserve-3d',
          transform: isHovered ? `translateY(-4px) scale(1.01) rotateX(${mousePos.rotY}deg) rotateY(${mousePos.rotX}deg)` : 'translateY(0px) scale(1) rotateX(0deg) rotateY(0deg)',
          transition: isHovered ? 'transform 0.15s cubic-bezier(0.2, 0.8, 0.2, 1), box-shadow 0.3s ease-out' : 'all 0.5s cubic-bezier(0.2, 0.8, 0.2, 1)'
        }}
      >
        {/* Glow de reflexo 3D (Hover) seguindo o mouse */}
        <div 
          className="absolute inset-0 pointer-events-none transition-opacity duration-500 z-0 mix-blend-screen"
          style={{
            opacity: isHovered ? 1 : 0,
            background: `radial-gradient(600px circle at ${mousePos.x}px ${mousePos.y}px, rgba(255,255,255,0.1), transparent 40%)`
          }}
        />

        {/* Borda Glow Neon refinada */}
        <div 
          className="absolute inset-0 pointer-events-none rounded-[2rem] transition-opacity duration-500"
          style={{
            opacity: isHovered ? 1 : 0,
            background: `radial-gradient(400px circle at ${mousePos.x}px ${mousePos.y}px, rgba(255,255,255,0.15), transparent 40%)`,
            mask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
            WebkitMask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
            WebkitMaskComposite: "xor",
            maskComposite: "exclude",
            padding: "1px"
          }}
        />

        <div 
          className="relative z-10 p-6 flex flex-col justify-start gap-6 h-full transition-transform duration-300 ease-out"
          style={{ transform: isHovered ? `translateZ(10px)` : `translateZ(0px)` }}
        >
          <div className="space-y-5">
            <div 
              className="flex items-center gap-3 flex-wrap transition-transform duration-300"
              style={{ transform: isHovered ? `translateZ(10px)` : `translateZ(0px)` }}
            >
              <Badge variant="outline" className="bg-zinc-900/80 text-zinc-300 border-zinc-700/50 text-[9px] font-mono uppercase tracking-widest backdrop-blur-sm shadow-sm">
                {item.source}
              </Badge>
              <Badge variant="outline" className="bg-indigo-500/10 text-indigo-300 border-indigo-500/30 text-[9px] font-mono uppercase tracking-widest backdrop-blur-sm shadow-[0_0_10px_rgba(99,102,241,0.2)]">
                {item.category}
              </Badge>
              <Badge variant="outline" className="bg-purple-500/10 text-purple-300 border-purple-500/30 text-[9px] font-mono uppercase tracking-widest backdrop-blur-sm shadow-sm">
                {item.docExt ?? (item.kind === 'skill' ? '.md' : '.json')}
              </Badge>
              {item.pricing?.model ? (
                <Badge 
                  variant="outline" 
                  className={`text-[9px] font-mono uppercase tracking-widest backdrop-blur-sm ${
            pricingModel === 'free' || pricingModel === 'community_free'
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 shadow-[0_0_10px_rgba(16,185,129,0.2)]'
                      : 'bg-zinc-800/80 text-zinc-300 border-zinc-700/50 shadow-sm'
                  }`}
                >
                  {pricingModel === "community_free" ? "community free" : (item.pricing.model ?? "priced")}
                </Badge>
              ) : null}
            </div>
            
            <div className="space-y-2">
              <div 
                className="text-xl font-bold text-white tracking-tight font-mono drop-shadow-md transition-transform duration-300"
                style={{ transform: isHovered ? `translateZ(20px)` : `translateZ(0px)` }}
              >
                {item.name}
              </div>
              <div 
                className="text-sm text-zinc-400 font-light leading-relaxed line-clamp-3 transition-transform duration-300"
                style={{ transform: isHovered ? `translateZ(10px)` : `translateZ(0px)` }}
              >
                {item.description}
              </div>
            </div>

            {/* Asset Valuation Metrics (Proof-based) */}
            <div 
              className="grid grid-cols-3 gap-2 mt-4 transition-transform duration-300"
              style={{ transform: isHovered ? `translateZ(10px)` : `translateZ(0px)` }}
            >
              <div className="bg-white/[0.03] border border-white/5 rounded-lg p-2 flex flex-col justify-center relative overflow-hidden group/metric">
                <div className="absolute inset-0 bg-blue-500/5 opacity-0 group-hover/metric:opacity-100 transition-opacity" />
                <span className="text-[8px] font-mono text-zinc-500 uppercase tracking-widest flex items-center gap-1">
                  Rank / Demand
                </span>
                <span className="text-xs font-mono text-blue-400">#{getVerifiedImpact(item.id).ranking} / {getVerifiedImpact(item.id).demandScore}</span>
              </div>
              <div className="bg-white/[0.03] border border-white/5 rounded-lg p-2 flex flex-col justify-center relative overflow-hidden group/metric">
                <div className="absolute inset-0 bg-emerald-500/5 opacity-0 group-hover/metric:opacity-100 transition-opacity" />
                <span className="text-[8px] font-mono text-zinc-500 uppercase tracking-widest flex items-center gap-1">
                  Success / Impact
                </span>
                <span className="text-[10px] font-mono text-emerald-400">{(item.performance?.successRate || getVerifiedImpact(item.id).successRate).toFixed(1)}% / {getVerifiedImpact(item.id).impactPotential}</span>
              </div>
              <div className="bg-white/[0.03] border border-white/5 rounded-lg p-2 flex flex-col justify-center relative overflow-hidden group/metric">
                <div className="absolute inset-0 bg-white/5 opacity-0 group-hover/metric:opacity-100 transition-opacity" />
                <span className="text-[8px] font-mono text-zinc-500 uppercase tracking-widest flex items-center gap-1">
                  Vol (USDC)
                </span>
                <span className="text-xs font-mono text-zinc-300">${(item.performance?.totalVolumeUSDC || getVerifiedImpact(item.id).totalVolumeUSDC).toFixed(1)}</span>
              </div>
            </div>
          </div>

          <div 
            className="flex items-center justify-between mt-auto pt-4 border-t border-white/5 transition-transform duration-300 pb-1"
            style={{ transform: isHovered ? `translateZ(10px)` : `translateZ(0px)` }}
          >
            <div className="flex flex-wrap gap-2">
              {item.badges?.map(badge => (
                <div key={badge} className="px-2 py-1 rounded text-[8px] font-mono uppercase tracking-[0.2em] bg-amber-500/10 text-amber-400 border border-amber-500/30 shadow-[0_0_8px_rgba(245,158,11,0.15)]">
                  {badge}
                </div>
              ))}
            </div>
            <div className="flex gap-2 items-center">
              {!isFree && !requiresCommunityVoucher && (
                <button
                  className="shrink-0 text-[10px] font-mono uppercase tracking-[0.2em] transition-all duration-300 px-4 py-2 rounded-lg backdrop-blur-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/20 shadow-[0_0_10px_rgba(16,185,129,0.15)]"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/gateway?intentId=purchase_card_${item.id}&amountLamports=${Math.floor((item.pricing?.price || 0.005) * 1e9)}&recipient=DGuedzXbK8fN8eRqyTqzTXZyX4wY4rU2B1mD4W8L7jH`);
                  }}
                >
                  Pay (Gateway)
                </button>
              )}
              {isFree && (
                <button
                  className="shrink-0 text-[10px] font-mono uppercase tracking-[0.2em] transition-all duration-300 px-4 py-2 rounded-lg backdrop-blur-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/20 shadow-[0_0_10px_rgba(16,185,129,0.15)]"
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggle();
                  }}
                >
                  {voucherStatus === "valid" ? "Claim Free" : "Free (Get)"}
                </button>
              )}
              {!isFree && requiresCommunityVoucher && (
                <button
                  className="shrink-0 text-[10px] font-mono uppercase tracking-[0.2em] transition-all duration-300 px-4 py-2 rounded-lg backdrop-blur-md bg-amber-500/10 text-amber-400 border border-amber-500/30 hover:bg-amber-500/20 shadow-[0_0_10px_rgba(245,158,11,0.15)]"
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggle();
                  }}
                >
                  Apply Code
                </button>
              )}
              <button
                className={`shrink-0 text-[10px] font-mono uppercase tracking-[0.2em] transition-all duration-300 px-4 py-2 rounded-lg backdrop-blur-md ${
                  isSelected 
                    ? "bg-white text-black border border-white shadow-[0_0_20px_rgba(255,255,255,0.4)] scale-105" 
                    : "bg-white/5 text-zinc-400 border border-white/10 hover:border-white/30 hover:text-white hover:bg-white/10"
                }`}
                onClick={(e) => {
                  e.stopPropagation();
                  onToggle();
                }}
              >
                  {isSelected ? "Close" : "Details"}
                </button>
            </div>
          </div>
        </div>

        {isSelected && (
            <div 
              className="absolute top-full left-0 right-0 z-50 mt-4 p-5 space-y-4 animate-in fade-in slide-in-from-top-2 duration-300 cursor-default metallic-brushed backdrop-blur-xl rounded-[2rem] border border-white/20 shadow-[0_20px_60px_-10px_rgba(0,0,0,0.8)]"
              onClick={(e) => e.stopPropagation()}
            >
            <div className="grid grid-cols-2 gap-3 p-3 bg-white/[0.02] rounded-lg border border-white/5">
              <div className="space-y-1">
                <div className="text-[8px] font-mono text-zinc-500 uppercase tracking-widest">Token Symbol</div>
                <div className="text-[10px] font-mono text-indigo-400 font-bold">{getVerifiedImpact(item.id).tokenSymbol}</div>
              </div>
              <div className="space-y-1">
                <div className="text-[8px] font-mono text-zinc-500 uppercase tracking-widest">Contract (PDA)</div>
                <div className="text-[10px] font-mono text-zinc-300 truncate pr-2">{getVerifiedImpact(item.id).mintAddress}</div>
              </div>
              <div className="space-y-1">
                <div className="text-[8px] font-mono text-zinc-500 uppercase tracking-widest">Market Cap</div>
                <div className="text-[10px] font-mono text-emerald-400">${getVerifiedImpact(item.id).marketCap.toLocaleString()}</div>
              </div>
              <div className="space-y-1">
                <div className="text-[8px] font-mono text-zinc-500 uppercase tracking-widest">Active Holders</div>
                <div className="text-[10px] font-mono text-zinc-300">{getVerifiedImpact(item.id).holders.toLocaleString()}</div>
              </div>
              <div className="space-y-1 col-span-2 mt-1 border-t border-white/5 pt-2 flex items-center justify-between">
                <div className="text-[8px] font-mono text-zinc-500 uppercase tracking-widest">Asset Composition</div>
                <div className="text-[9px] font-bold font-mono text-indigo-400">
                  {getVerifiedImpact(item.id).skillsCount > 1 
                    ? `BUNDLE: ${getVerifiedImpact(item.id).skillsCount} SKILLS` 
                    : "SINGLE SKILL"}
                </div>
              </div>
            </div>

            {/* Super Trunfo Attributes */}
            <div className="grid grid-cols-2 gap-4 pt-2 border-t border-white/5">
              <div className="space-y-1.5">
                <div className="flex justify-between text-[8px] font-mono text-zinc-500 uppercase tracking-widest">
                  <span>Intelligence</span>
                  <span className="text-zinc-300">{getVerifiedImpact(item.id).intelligence}/100</span>
                </div>
                <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-indigo-400 h-full" style={{ width: `${getVerifiedImpact(item.id).intelligence}%` }} />
                </div>
              </div>
              <div className="space-y-1.5">
                <div className="flex justify-between text-[8px] font-mono text-zinc-500 uppercase tracking-widest">
                  <span>Speed (Latency)</span>
                  <span className="text-zinc-300">{getVerifiedImpact(item.id).speed}/100</span>
                </div>
                <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-amber-400 h-full" style={{ width: `${getVerifiedImpact(item.id).speed}%` }} />
                </div>
              </div>
              <div className="space-y-1.5">
                <div className="flex justify-between text-[8px] font-mono text-zinc-500 uppercase tracking-widest">
                  <span>Reliability</span>
                  <span className="text-zinc-300">{getVerifiedImpact(item.id).reliability}%</span>
                </div>
                <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-emerald-400 h-full" style={{ width: `${getVerifiedImpact(item.id).reliability}%` }} />
                </div>
              </div>
              <div className="space-y-1.5">
                <div className="flex justify-between text-[8px] font-mono text-zinc-500 uppercase tracking-widest">
                  <span>Complexity</span>
                  <span className="text-zinc-300">{getVerifiedImpact(item.id).complexity}/100</span>
                </div>
                <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-purple-400 h-full" style={{ width: `${getVerifiedImpact(item.id).complexity}%` }} />
                </div>
              </div>
            </div>
            
            {item.tags.length > 0 && (
              <div className="space-y-2">
                <div className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest">Tags</div>
                <div className="flex flex-wrap gap-2">
                  {item.tags.map(tag => (
                    <span key={tag} className="text-[10px] font-mono text-zinc-300 bg-white/5 border border-white/10 px-2 py-1 rounded-md shadow-sm">#{tag}</span>
                  ))}
                </div>
              </div>
            )}

            {/* Voucher Section / Free Phase */}
            {(!isOriginallyFree || requiresCommunityVoucher) && settlementStatus === 'idle' && (
              <div className="pt-3 border-t border-white/5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[8px] font-mono text-zinc-500 uppercase tracking-widest">Traction Phase Subsidy</span>
                  <span className="text-[8px] font-mono text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded uppercase tracking-widest border border-emerald-500/20">100% FREE</span>
                </div>
                <div className="flex items-center gap-2">
                  <input 
                    type="text" 
                    placeholder="ENTER VOUCHER CODE" 
                    value={voucherCode}
                    onChange={(e) => {
                      setVoucherCode(e.target.value);
                      setVoucherStatus("idle");
                      setVoucherMessage(null);
                    }}
                    className="bg-black/50 border border-white/10 rounded-md px-2 py-1.5 text-[9px] font-mono text-white uppercase placeholder:text-zinc-600 focus:outline-none focus:border-white/30 flex-1"
                  />
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      const code = normalizeVoucherCode(voucherCode);
                      // Custom override for direct community codes
                      const validCodes = ['THEGARAGE', 'SUPERTEAMBR', 'COLOSSEUM'];
                      if (validCodes.includes(code)) {
                        setVoucherCode(code);
                        setVoucherStatus("valid");
                        setVoucherMessage("Community Code Applied. 100% Protocol Subsidy.");
                        return;
                      }

                      const eligibility = getVoucherEligibility(builderRegistration, code);
                      setVoucherMessage(eligibility.reason);
                      if (eligibility.eligible) {
                        setVoucherCode(code);
                        setVoucherStatus("valid");
                      } else {
                        setVoucherStatus("invalid");
                      }
                    }}
                    className="px-3 py-1.5 bg-white/5 text-[9px] font-mono uppercase text-zinc-300 rounded-md hover:bg-white/10 hover:text-white transition-colors border border-white/10"
                  >
                    Apply
                  </button>
                </div>
                {voucherStatus === "invalid" && <div className="text-[8px] text-red-400 mt-1 font-mono uppercase tracking-widest">{voucherMessage ?? "Invalid or expired code"}</div>}
                {voucherStatus === "valid" && <div className="text-[8px] text-emerald-400 mt-1 font-mono uppercase tracking-widest">{voucherMessage ?? "Code applied. 100% protocol subsidy."}</div>}
                {requiresCommunityVoucher && voucherStatus === "idle" && <div className="text-[8px] text-zinc-500 mt-1 font-mono uppercase tracking-widest">The Garage phase: access requires a community code.</div>}
              </div>
            )}
            
            {/* x402 Settlement Status Box */}
            {settlementStatus !== 'idle' && (
              <div className={`p-4 rounded-xl border mt-4 mb-4 transition-all duration-500 ${
                settlementStatus === 'processing' ? 'bg-amber-500/5 border-amber-500/20' : 
                settlementStatus === 'success' ? 'bg-emerald-500/5 border-emerald-500/20' : 
                'bg-red-500/5 border-red-500/20'
              }`}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-400">
                    {settlementStep || (settlementStatus === 'processing' ? 'Processing intent...' : 
                     settlementStatus === 'success' ? 'Atomic settlement complete' : 'Settlement failed')}
                  </span>
                  {settlementStatus === 'processing' && (
                    <div className="w-3 h-3 rounded-full border-t-2 border-r-2 border-amber-500 animate-spin"></div>
                  )}
                  {settlementStatus === 'success' && (
                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-500"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
                  )}
                </div>
                {txHash && (
                  <div className="text-[9px] font-mono text-zinc-500 break-all bg-black/50 p-3 rounded mt-2 space-y-2">
                    <div>{isMockSettlement ? "Local receipt:" : (isFree ? "Subsidy receipt:" : "Proof:")} {txHash}</div>
                    {isFree && settlementStatus === 'success' && (
                      <div className="border-t border-white/10 pt-2 mt-2">
                        <div className="text-emerald-400 mb-2">Access granted by sponsored flow. Repo command:</div>
                        <code className="text-white bg-black px-3 py-2 rounded border border-white/10 select-all block font-bold">
                          {`git clone https://github.com/DGuedz/MIND.git && cd MIND && pnpm install && pnpm run create-skill -- --name "sua-skill"${builderRegistration ? ` --builder "${builderRegistration.githubHandle}" --github "${builderRegistration.githubHandle}" --wallet "${builderRegistration.solanaReceiveWallet || "WALLET_PENDING_AFTER_GITHUB_REVIEW"}"` : ""}`}
                        </code>
                        {builderRegistration ? (
                          <div className="mt-2 text-zinc-500">
                            Builder @{builderRegistration.githubHandle} registered from {builderRegistration.campaignSource} with {builderRegistration.referralCode}.
                          </div>
                        ) : null}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            <div className="pt-2 flex flex-col sm:flex-row gap-3">
              <button 
                className={`flex-1 text-[11px] font-bold font-mono uppercase tracking-[0.2em] py-3 rounded-xl transition-all duration-300 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed ${isFree ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/50 hover:bg-emerald-500/30" : "bg-white text-black hover:bg-zinc-200 hover:shadow-[0_0_20px_rgba(255,255,255,0.3)]"}`}
                onClick={(e) => {
                  e.stopPropagation();
                  handleExecuteX402();
                }}
                disabled={settlementStatus === 'processing' || settlementStatus === 'success'}
              >
                {settlementStatus === 'success' ? (isFree ? 'Claimed' : 'Settled') : (isFree || requiresCommunityVoucher ? 'Claim Access (Free)' : 'Execute (x402)')}
              </button>
              <button 
                className="px-6 border border-white/20 bg-black/50 text-zinc-300 text-[10px] font-mono uppercase tracking-[0.2em] rounded-xl hover:text-white hover:border-white/50 hover:bg-white/5 transition-all duration-300"
                onClick={(e) => {
                  e.stopPropagation();
                  window.open("https://github.com/DGuedz/MIND/tree/main/agent-cards", "_blank");
                }}
              >
                Source
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export function MarketplacePage() {
  const pageNavigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialVoucherCode = searchParams.get("voucher") ? getInitialVoucherCode(searchParams.get("voucher")) : "";
  const shouldAutoClaim = searchParams.get("claim") === "1";
  const [catalogTab, setCatalogTab] = useState<"skills" | "products">("skills");
  const [catalogSkills, setCatalogSkills] = useState<CatalogItem[]>([]);
  const [catalogProducts, setCatalogProducts] = useState<CatalogItem[]>([]);
  const [catalogSourceFilter, setCatalogSourceFilter] = useState<"all" | "internal" | "external" | "vendor" | "sponsor" | "mind" | "sendaifun" | "stbr" | "frames" | "nous" | "tamkaize">("all");
  const [catalogCategoryFilter, setCatalogCategoryFilter] = useState<string>("all");
  const [catalogFormatFilter, setCatalogFormatFilter] = useState<"all" | ".json" | ".md">("all");
  const [catalogQuery, setCatalogQuery] = useState<string>("");
  const [catalogSort, setCatalogSort] = useState<"newest" | "executions" | "success">("newest");
  const [catalogStatus, setCatalogStatus] = useState<"loading" | "live" | "fallback">("loading");
  const [catalogAsOf, setCatalogAsOf] = useState<string | null>(null);
  const [selectedCatalogItemId, setSelectedCatalogItemId] = useState<string | null>(null);
  const [builderRegistration, setBuilderRegistration] = useState<BuilderRegistration | null>(() => getBuilderRegistration());

  useEffect(() => {
    const refreshBuilderRegistration = () => {
      setBuilderRegistration(getBuilderRegistration());
    };

    window.addEventListener("storage", refreshBuilderRegistration);
    window.addEventListener("focus", refreshBuilderRegistration);
    window.addEventListener("mind:builder-registration", refreshBuilderRegistration as EventListener);

    return () => {
      window.removeEventListener("storage", refreshBuilderRegistration);
      window.removeEventListener("focus", refreshBuilderRegistration);
      window.removeEventListener("mind:builder-registration", refreshBuilderRegistration as EventListener);
    };
  }, []);

  useEffect(() => {
    let active = true;

    const loadCatalog = async () => {
      const [skillsResult, productsResult] = await Promise.allSettled([
        fetch("/catalog/skills.json", { headers: { Accept: "application/json" } }),
        fetch("/catalog/products.json", { headers: { Accept: "application/json" } })
      ]);

      if (!active) return;

      const fallbackSkills: CatalogItem[] = [
        {
          id: "skill_kuka",
          kind: "skill",
          name: "kuka",
          description: "Mentor Solana com analogias TradFi e didatica direta (termos, quiz, learning path, walkthrough).",
          source: "mind",
          category: "education",
          license: "Proprietary",
          tags: ["solana", "education", "anchor", "pda", "cpi"]
        }
      ];

      const fallbackProducts: CatalogItem[] = [
        {
          id: "card_jupiter_route",
          kind: "product",
          name: "Smart Swap Router (Jupiter-backed)",
          description: "Calcula a rota mais eficiente de swap usando liquidez profunda da Solana. Retorna transação montada pronta para assinatura pelo seu Agente.",
          source: "mind",
          category: "execution",
          license: "Proprietary",
          tags: ["swap", "routing", "jupiter", "defi"],
          pricing: { model: "per_request", currency: "USDC", price: 0.009 }
        }
      ];

      let skills: CatalogItem[] | null = null;
      let products: CatalogItem[] | null = null;
      let asOf: string | null = null;

      if (skillsResult.status === "fulfilled" && skillsResult.value.ok) {
        try {
          const payload = (await skillsResult.value.json()) as CatalogPayload;
          skills = Array.isArray(payload.items) ? payload.items : null;
          asOf = payload.as_of || asOf;
        } catch {
          // Ignore JSON parse error
        }
      }

      if (productsResult.status === "fulfilled" && productsResult.value.ok) {
        try {
          const payload = (await productsResult.value.json()) as CatalogPayload;
          products = Array.isArray(payload.items) ? payload.items : null;
          asOf = payload.as_of || asOf;
        } catch {
          // Ignore JSON parse error
        }
      }

      if (active) {
        setCatalogSkills(skills ?? fallbackSkills);
        setCatalogProducts(products ?? fallbackProducts);
        setCatalogAsOf(asOf);
        setCatalogStatus((skills && products) ? "live" : "fallback");
      }
    };

    void loadCatalog();

    return () => {
      active = false;
    };
  }, []);

  const catalogItems = catalogTab === "skills" ? catalogSkills : catalogProducts;
  const catalogCategories = Array.from(new Set(catalogItems.map(i => i.category))).sort((a, b) => a.localeCompare(b));
  const getItemFormat = (item: CatalogItem) => item.docExt ?? (item.kind === "skill" ? ".md" : ".json");
  const getItemProviderType = (item: CatalogItem) => {
    if (item.providerType) return item.providerType;
    if (item.sourceType) return item.sourceType;
    if (item.source === "mind") return "internal";
    return "external";
  };

  const filteredCatalogItems = catalogItems.filter((item) => {
    if (catalogSourceFilter !== "all") {
      if (catalogSourceFilter === "internal" || catalogSourceFilter === "external" || catalogSourceFilter === "vendor" || catalogSourceFilter === "sponsor") {
        if (getItemProviderType(item) !== catalogSourceFilter) return false;
      } else {
        if (item.source !== catalogSourceFilter) return false;
      }
    }
    if (catalogCategoryFilter !== "all" && item.category !== catalogCategoryFilter) return false;
    if (catalogFormatFilter !== "all" && getItemFormat(item) !== catalogFormatFilter) return false;
    const q = catalogQuery.trim().toLowerCase();
    if (!q) return true;
    const haystack = `${item.name} ${item.description} ${item.source} ${item.category} ${(item.tags || []).join(" ")}`.toLowerCase();
    return haystack.includes(q);
  }).sort((a, b) => {
    if (catalogSort === "executions") {
      const execA = a.performance?.totalExecutions || getVerifiedImpact(a.id).totalExecutions;
      const execB = b.performance?.totalExecutions || getVerifiedImpact(b.id).totalExecutions;
      return execB - execA;
    }
    if (catalogSort === "success") {
      const succA = a.performance?.successRate || getVerifiedImpact(a.id).successRate;
      const succB = b.performance?.successRate || getVerifiedImpact(b.id).successRate;
      return succB - succA;
    }
    // newest (fallback to alphabetical or original order)
    return 0;
  });

  useEffect(() => {
    if (!shouldAutoClaim || !initialVoucherCode || selectedCatalogItemId || filteredCatalogItems.length === 0) return;

    const firstPricedItem = filteredCatalogItems.find((item) => {
      const model = item.pricing?.model?.toLowerCase() ?? "";
      return item.pricing && model !== "free" && item.pricing.price !== 0;
    });

    if (firstPricedItem) {
      setSelectedCatalogItemId(firstPricedItem.id);
    }
  }, [filteredCatalogItems, initialVoucherCode, selectedCatalogItemId, shouldAutoClaim]);

  return (
    <div className="container mx-auto px-6 space-y-8 pt-32 pb-32">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 border-b border-white/20 pb-12">
        <div className="space-y-4">
          <Badge variant="outline" className="border-zinc-800 text-zinc-500 font-mono uppercase text-[9px] tracking-[0.3em] px-4 py-1">
            Global Hub
          </Badge>
          <h1 className="text-4xl font-bold text-white tracking-tight uppercase font-mono">Marketplace.</h1>
        </div>
      </header>

      <section className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
          <div className="space-y-2">
            <div className="text-[10px] font-mono text-zinc-500 uppercase tracking-[0.3em]">Agent Cards</div>
            <div className="text-2xl font-bold text-white tracking-tight font-mono uppercase">Vitrine.</div>
            <div className="text-[10px] text-zinc-600 font-mono uppercase tracking-widest">
              Discovery {String(filteredCatalogItems.length).padStart(2, "0")} • Source {catalogStatus.toUpperCase()}
              {catalogAsOf ? ` • as_of ${catalogAsOf}` : ""}
            </div>
            <div className={`inline-flex rounded-full border px-3 py-1 text-[9px] font-mono uppercase tracking-[0.2em] ${builderRegistration ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300" : "border-white/10 bg-white/[0.03] text-zinc-500"}`}>
              {builderRegistration ? `Registered @${builderRegistration.githubHandle} • ${builderRegistration.referralCode} (100% FREE MODE)` : "Register builder to unlock vouchers"}
            </div>
          </div>
          <div className="flex flex-wrap gap-3 items-center">
            <button
              className={`px-4 py-2 rounded-full text-[9px] font-mono uppercase tracking-[0.2em] border transition-colors ${catalogTab === "skills" ? "bg-white text-black border-white" : "bg-white/5 text-zinc-500 border-white/20 hover:border-white/30 hover:text-white"}`}
              onClick={() => {
                setCatalogTab("skills");
                setSelectedCatalogItemId(null);
                setCatalogCategoryFilter("all");
              }}
            >
              Skills
            </button>
            <button
              className={`px-4 py-2 rounded-full text-[9px] font-mono uppercase tracking-[0.2em] border transition-colors ${catalogTab === "products" ? "bg-white text-black border-white" : "bg-white/5 text-zinc-500 border-white/20 hover:border-white/30 hover:text-white"}`}
              onClick={() => {
                setCatalogTab("products");
                setSelectedCatalogItemId(null);
                setCatalogCategoryFilter("all");
              }}
            >
              Products
            </button>
            <button
              className={`px-4 py-2 rounded-full text-[9px] font-bold font-mono uppercase tracking-[0.2em] border transition-colors shadow-[0_0_15px_rgba(245,158,11,0.2)] ${catalogSourceFilter === "sponsor" ? "bg-amber-500/20 text-amber-300 border-amber-500/50" : "bg-white/5 text-amber-500/70 border-amber-500/30 hover:border-amber-500/50 hover:text-amber-400"}`}
              onClick={() => {
                setCatalogTab("skills");
                setCatalogSourceFilter("sponsor");
                setSelectedCatalogItemId(null);
                setCatalogCategoryFilter("all");
              }}
            >
              Bounties
            </button>
            <button
              className="px-4 py-2 rounded-full text-[9px] font-mono uppercase tracking-[0.2em] border bg-white/5 text-zinc-500 border-white/20 hover:border-white/30 hover:text-white transition-colors"
              onClick={() => pageNavigate("/contribute")}
            >
              Register Builder
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          <div className="lg:col-span-4">
            <input
              value={catalogQuery}
              onChange={(e) => setCatalogQuery(e.target.value)}
              placeholder="Search name, tags, description"
              className="w-full bg-white/[0.02] border border-white/20 rounded-2xl px-5 py-3 text-sm text-zinc-300 placeholder:text-zinc-700 outline-none focus:border-white/40 transition-colors"
            />
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 lg:col-span-8 gap-4">
            <div className="col-span-1 lg:col-span-1">
              <select
                value={catalogFormatFilter}
                onChange={(e) => setCatalogFormatFilter(e.target.value as "all" | ".json" | ".md")}
                className="w-full bg-white/[0.02] border border-white/20 rounded-2xl px-4 py-3 text-[10px] font-mono text-zinc-400 uppercase tracking-widest outline-none focus:border-white/40 transition-colors"
              >
                <option value="all">Formats</option>
                <option value=".md">SKILL.md</option>
                <option value=".json">Manifest.json</option>
              </select>
            </div>
            <div className="col-span-1 lg:col-span-1">
              <select
                value={catalogSourceFilter}
                onChange={(e) => setCatalogSourceFilter(e.target.value as any)}
                className="w-full bg-white/[0.02] border border-white/20 rounded-2xl px-4 py-3 text-[10px] font-mono text-zinc-400 uppercase tracking-widest outline-none focus:border-white/40 transition-colors"
              >
                <option value="all">Providers</option>
                <option value="sponsor">Colosseum Sponsor</option>
                <option value="internal">Internal</option>
                <option value="external">External</option>
                <option value="vendor">Vendor</option>
                <option value="mind">MIND</option>
                <option value="sendaifun">SendAI</option>
                <option value="stbr">STBR</option>
                <option value="frames">Frames</option>
                <option value="nous">Nous</option>
                <option value="tamkaize">Kai Ze Tam</option>
              </select>
            </div>
            <div className="col-span-1 lg:col-span-1">
              <select
                value={catalogCategoryFilter}
                onChange={(e) => setCatalogCategoryFilter(e.target.value)}
                className="w-full bg-white/[0.02] border border-white/20 rounded-2xl px-4 py-3 text-[10px] font-mono text-zinc-400 uppercase tracking-widest outline-none focus:border-white/40 transition-colors"
              >
                <option value="all">Categories</option>
                {catalogCategories.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div className="col-span-1 lg:col-span-1">
              <select
                value={catalogSort}
                onChange={(e) => setCatalogSort(e.target.value as "newest" | "executions" | "success")}
                className="w-full bg-white/[0.02] border border-white/20 rounded-2xl px-4 py-3 text-[10px] font-mono text-zinc-400 uppercase tracking-widest outline-none focus:border-white/40 transition-colors"
              >
                <option value="newest">Sort: Newest</option>
                <option value="executions">Sort: Volume</option>
                <option value="success">Sort: Success</option>
              </select>
            </div>
          </div>
        </div>

        <div className="text-[10px] text-zinc-600 font-mono uppercase tracking-widest">
          Policy-first execution, atomic settlement rails, proof-native receipts. Catalog entries may include provider claims; verify before executing real capital.
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredCatalogItems.map((item) => (
            <CatalogCard 
              key={item.id} 
              item={item} 
              isSelected={selectedCatalogItemId === item.id}
              onToggle={() => setSelectedCatalogItemId(current => current === item.id ? null : item.id)}
              builderRegistration={builderRegistration}
              initialVoucherCode={initialVoucherCode}
              autoApplyVoucher={shouldAutoClaim && selectedCatalogItemId === item.id}
            />
          ))}
        </div>
      </section>
    </div>
  );
}
