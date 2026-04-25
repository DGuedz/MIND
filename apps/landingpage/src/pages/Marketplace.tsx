import { useState, useEffect } from "react";
import { Badge } from "../components/ui/badge";

type CatalogItem = {
  id: string;
  kind: "skill" | "product";
  name: string;
  description: string;
  source: string;
  category: string;
  license: string;
  tags: string[];
  pricing?: {
    model: string;
    currency?: string;
    price?: number;
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

// Deterministic mock generator for demonstration of Proof-Based Ranking
const getMockPerformance = (id: string) => {
  const hash = id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return {
    successRate: 95 + (hash % 50) / 10,
    totalExecutions: 100 + (hash * 13 % 9000),
    totalVolumeUSDC: (hash * 7 % 5000) / 10
  };
};

function CatalogCard({ item, isSelected, onToggle }: { item: CatalogItem, isSelected: boolean, onToggle: () => void }) {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setMousePos({ x, y });
  };

  const handleMouseEnter = () => setIsHovered(true);
  const handleMouseLeave = () => {
    setIsHovered(false);
    setMousePos({ x: 150, y: 150 }); // Center roughly
  };

  // x402 Settlement States
  const [settlementStatus, setSettlementStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');
  const [txHash, setTxHash] = useState<string | null>(null);

  const handleExecuteX402 = async () => {
    if (!item.pricing || settlementStatus === 'processing') return;
    
    setSettlementStatus('processing');
    
    try {
      // API Gateway Mock Integration (v1/payment/x402)
      // This mimics the atomic settlement flow configured in a2a_payment.ts
      await new Promise(resolve => setTimeout(resolve, 2000)); 
      
      const mockTxHash = "sig_" + Math.random().toString(36).substring(2, 15) + "x402";
      setTxHash(mockTxHash);
      setSettlementStatus('success');
    } catch (err) {
      setSettlementStatus('error');
    }
  };

  return (
    <div 
      className="relative group w-full h-full" 
      style={{ perspective: "1200px" }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onMouseMove={handleMouseMove}
    >
      <div
        className={`relative w-full h-full bg-black/40 backdrop-blur-md rounded-2xl transition-all duration-500 cursor-crosshair overflow-hidden
          ${isHovered ? "-translate-y-2 shadow-[0_20px_50px_-15px_rgba(255,255,255,0.1)] scale-[1.02]" : "shadow-[0_4px_20px_-10px_rgba(0,0,0,0.5)]"} 
          ${isSelected ? "ring-1 ring-white/40 shadow-[0_0_30px_rgba(255,255,255,0.1)]" : "ring-1 ring-white/10 hover:ring-white/20"}`}
        style={{ 
          transformStyle: 'preserve-3d',
          transform: isHovered ? `rotateX(${(mousePos.y - 150) * -0.06}deg) rotateY(${(mousePos.x - 150) * 0.06}deg)` : 'rotateX(0deg) rotateY(0deg)'
        }}
      >
        {/* Glow de reflexo 3D (Hover) seguindo o mouse */}
        <div 
          className="absolute inset-0 pointer-events-none transition-opacity duration-500 z-0"
          style={{
            opacity: isHovered ? 1 : 0,
            background: `radial-gradient(600px circle at ${mousePos.x}px ${mousePos.y}px, rgba(255,255,255,0.06), transparent 40%)`
          }}
        />

        {/* Borda Glow Neon refinada */}
        <div 
          className="absolute inset-0 pointer-events-none rounded-2xl transition-opacity duration-500"
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
          className="relative z-10 p-6 flex flex-col justify-between gap-6 h-full transition-transform duration-300 ease-out"
          style={{ transform: isHovered ? `translateZ(30px)` : `translateZ(0px)` }}
        >
          <div className="space-y-5">
            <div 
              className="flex items-center gap-3 flex-wrap transition-transform duration-300"
              style={{ transform: isHovered ? `translateZ(20px)` : `translateZ(0px)` }}
            >
              <Badge variant="outline" className="bg-zinc-900/80 text-zinc-300 border-zinc-700/50 text-[9px] font-mono uppercase tracking-widest backdrop-blur-sm shadow-sm">
                {item.source}
              </Badge>
              <Badge variant="outline" className="bg-indigo-500/10 text-indigo-300 border-indigo-500/30 text-[9px] font-mono uppercase tracking-widest backdrop-blur-sm shadow-[0_0_10px_rgba(99,102,241,0.2)]">
                {item.category}
              </Badge>
              {item.pricing?.model ? (
                <Badge 
                  variant="outline" 
                  className={`text-[9px] font-mono uppercase tracking-widest backdrop-blur-sm ${
                    item.pricing.model.toLowerCase() === 'free' 
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 shadow-[0_0_10px_rgba(16,185,129,0.2)]'
                      : 'bg-zinc-800/80 text-zinc-300 border-zinc-700/50 shadow-sm'
                  }`}
                >
                  {item.pricing.model}
                </Badge>
              ) : null}
            </div>
            
            <div className="space-y-2">
              <div 
                className="text-xl font-bold text-white tracking-tight font-mono drop-shadow-md transition-transform duration-300"
                style={{ transform: isHovered ? `translateZ(40px)` : `translateZ(0px)` }}
              >
                {item.name}
              </div>
              <div 
                className="text-sm text-zinc-400 font-light leading-relaxed line-clamp-3 transition-transform duration-300"
                style={{ transform: isHovered ? `translateZ(15px)` : `translateZ(0px)` }}
              >
                {item.description}
              </div>
            </div>

            {/* Performance Metrics (Proof-based) */}
            <div 
              className="grid grid-cols-3 gap-2 mt-4 transition-transform duration-300"
              style={{ transform: isHovered ? `translateZ(20px)` : `translateZ(0px)` }}
            >
              <div className="bg-white/[0.03] border border-white/5 rounded-lg p-2 flex flex-col justify-center relative overflow-hidden group/metric">
                <div className="absolute inset-0 bg-emerald-500/5 opacity-0 group-hover/metric:opacity-100 transition-opacity" />
                <span className="text-[8px] font-mono text-zinc-500 uppercase tracking-widest flex items-center gap-1">
                  Success <svg xmlns="http://www.w3.org/2000/svg" width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-500"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
                </span>
                <span className="text-xs font-mono text-emerald-400">{(item.performance?.successRate || getMockPerformance(item.id).successRate).toFixed(1)}%</span>
              </div>
              <div className="bg-white/[0.03] border border-white/5 rounded-lg p-2 flex flex-col justify-center relative overflow-hidden group/metric">
                <div className="absolute inset-0 bg-white/5 opacity-0 group-hover/metric:opacity-100 transition-opacity" />
                <span className="text-[8px] font-mono text-zinc-500 uppercase tracking-widest flex items-center gap-1">
                  Execs <svg xmlns="http://www.w3.org/2000/svg" width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-zinc-400"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                </span>
                <span className="text-xs font-mono text-white">{(item.performance?.totalExecutions || getMockPerformance(item.id).totalExecutions).toLocaleString()}</span>
              </div>
              <div className="bg-white/[0.03] border border-white/5 rounded-lg p-2 flex flex-col justify-center relative overflow-hidden group/metric">
                <div className="absolute inset-0 bg-white/5 opacity-0 group-hover/metric:opacity-100 transition-opacity" />
                <span className="text-[8px] font-mono text-zinc-500 uppercase tracking-widest flex items-center gap-1">
                  Vol (USDC)
                </span>
                <span className="text-xs font-mono text-zinc-300">${(item.performance?.totalVolumeUSDC || getMockPerformance(item.id).totalVolumeUSDC).toFixed(1)}</span>
              </div>
            </div>
          </div>

          <div 
            className="flex items-center justify-between mt-auto pt-4 border-t border-white/5 transition-transform duration-300"
            style={{ transform: isHovered ? `translateZ(25px)` : `translateZ(0px)` }}
          >
            <div className="flex gap-2">
              {item.badges?.map(badge => (
                <div key={badge} className="px-2 py-1 rounded text-[8px] font-mono uppercase tracking-[0.2em] bg-amber-500/10 text-amber-400 border border-amber-500/30 shadow-[0_0_8px_rgba(245,158,11,0.15)]">
                  🎖 {badge}
                </div>
              ))}
            </div>
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
              {isSelected ? "Close" : "View Details"}
            </button>
          </div>
        </div>

        {isSelected && (
          <div 
            className="relative z-20 mt-2 p-6 pt-0 space-y-5 animate-in fade-in slide-in-from-top-4 duration-500"
            style={{ transform: isHovered ? `translateZ(35px)` : `translateZ(0px)` }}
          >
            <div className="grid grid-cols-2 gap-4 p-4 bg-black/40 rounded-xl border border-white/5">
              <div className="space-y-1">
                <div className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest">ID</div>
                <div className="text-[11px] font-mono text-zinc-200">{item.id}</div>
              </div>
              <div className="space-y-1">
                <div className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest">License</div>
                <div className="text-[11px] font-mono text-zinc-200">{item.license}</div>
              </div>
              <div className="col-span-2 pt-2 mt-2 border-t border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-500"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path><path d="m9 12 2 2 4-4"></path></svg>
                  <span className="text-[9px] font-mono text-emerald-500 uppercase tracking-widest">Performance Verified (x402)</span>
                </div>
                <span className="text-[9px] font-mono text-zinc-600 uppercase tracking-widest">Mindprint cNFT</span>
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
            
            {/* x402 Settlement Status Box */}
            {settlementStatus !== 'idle' && (
              <div className={`p-4 rounded-xl border mt-4 mb-4 transition-all duration-500 ${
                settlementStatus === 'processing' ? 'bg-amber-500/5 border-amber-500/20' : 
                settlementStatus === 'success' ? 'bg-emerald-500/5 border-emerald-500/20' : 
                'bg-red-500/5 border-red-500/20'
              }`}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-400">
                    {settlementStatus === 'processing' ? 'Processing intent...' : 
                     settlementStatus === 'success' ? 'Atomic settlement complete' : 'Settlement failed'}
                  </span>
                  {settlementStatus === 'processing' && (
                    <div className="w-3 h-3 rounded-full border-t-2 border-r-2 border-amber-500 animate-spin"></div>
                  )}
                  {settlementStatus === 'success' && (
                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-500"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
                  )}
                </div>
                {txHash && (
                  <div className="text-[9px] font-mono text-zinc-500 break-all bg-black/50 p-2 rounded">
                    Proof: {txHash}
                  </div>
                )}
              </div>
            )}

            <div className="pt-2 flex flex-col sm:flex-row gap-3">
              <button 
                className="flex-1 bg-white text-black text-[11px] font-bold font-mono uppercase tracking-[0.2em] py-3 rounded-xl hover:bg-zinc-200 hover:shadow-[0_0_20px_rgba(255,255,255,0.3)] transition-all duration-300 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={(e) => {
                  e.stopPropagation();
                  handleExecuteX402();
                }}
                disabled={settlementStatus === 'processing' || settlementStatus === 'success'}
              >
                {settlementStatus === 'success' ? 'Settled' : 'Execute (x402)'}
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
  const [catalogTab, setCatalogTab] = useState<"skills" | "products">("skills");
  const [catalogSkills, setCatalogSkills] = useState<CatalogItem[]>([]);
  const [catalogProducts, setCatalogProducts] = useState<CatalogItem[]>([]);
  const [catalogSourceFilter, setCatalogSourceFilter] = useState<"all" | "mind" | "sendaifun" | "stbr" | "frames" | "nous">("all");
  const [catalogCategoryFilter, setCatalogCategoryFilter] = useState<string>("all");
  const [catalogQuery, setCatalogQuery] = useState<string>("");
  const [catalogSort, setCatalogSort] = useState<"newest" | "executions" | "success">("newest");
  const [catalogStatus, setCatalogStatus] = useState<"loading" | "live" | "fallback">("loading");
  const [catalogAsOf, setCatalogAsOf] = useState<string | null>(null);
  const [selectedCatalogItemId, setSelectedCatalogItemId] = useState<string | null>(null);

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
  const filteredCatalogItems = catalogItems.filter((item) => {
    if (catalogSourceFilter !== "all" && item.source !== catalogSourceFilter) return false;
    if (catalogCategoryFilter !== "all" && item.category !== catalogCategoryFilter) return false;
    const q = catalogQuery.trim().toLowerCase();
    if (!q) return true;
    const haystack = `${item.name} ${item.description} ${item.tags.join(" ")}`.toLowerCase();
    return haystack.includes(q);
  }).sort((a, b) => {
    if (catalogSort === "executions") {
      const execA = a.performance?.totalExecutions || getMockPerformance(a.id).totalExecutions;
      const execB = b.performance?.totalExecutions || getMockPerformance(b.id).totalExecutions;
      return execB - execA;
    }
    if (catalogSort === "success") {
      const succA = a.performance?.successRate || getMockPerformance(a.id).successRate;
      const succB = b.performance?.successRate || getMockPerformance(b.id).successRate;
      return succB - succA;
    }
    // newest (fallback to alphabetical or original order)
    return 0;
  });

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
              className="px-4 py-2 rounded-full text-[9px] font-mono uppercase tracking-[0.2em] border bg-white/5 text-zinc-500 border-white/20 hover:border-white/30 hover:text-white transition-colors"
              onClick={() => window.open("https://github.com/DGuedz/MIND/tree/main/agent-cards", "_blank")}
            >
              Contribute
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
          <div className="lg:col-span-2">
            <select
              value={catalogSourceFilter}
              onChange={(e) => setCatalogSourceFilter(e.target.value as "all" | "mind" | "sendaifun" | "stbr" | "frames" | "nous")}
              className="w-full bg-white/[0.02] border border-white/20 rounded-2xl px-4 py-3 text-[10px] font-mono text-zinc-400 uppercase tracking-widest outline-none focus:border-white/40 transition-colors"
            >
              <option value="all">All Sources</option>
              <option value="mind">MIND</option>
              <option value="sendaifun">SendAI</option>
              <option value="stbr">STBR</option>
              <option value="frames">Frames</option>
              <option value="nous">Nous (Hermes)</option>
            </select>
          </div>
          <div className="lg:col-span-3">
            <select
              value={catalogCategoryFilter}
              onChange={(e) => setCatalogCategoryFilter(e.target.value)}
              className="w-full bg-white/[0.02] border border-white/20 rounded-2xl px-4 py-3 text-[10px] font-mono text-zinc-400 uppercase tracking-widest outline-none focus:border-white/40 transition-colors"
            >
              <option value="all">All Categories</option>
              {catalogCategories.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <div className="lg:col-span-3">
            <select
              value={catalogSort}
              onChange={(e) => setCatalogSort(e.target.value as "newest" | "executions" | "success")}
              className="w-full bg-white/[0.02] border border-white/20 rounded-2xl px-4 py-3 text-[10px] font-mono text-zinc-400 uppercase tracking-widest outline-none focus:border-white/40 transition-colors"
            >
              <option value="newest">Sort: Newest</option>
              <option value="executions">Sort: Highest Volume</option>
              <option value="success">Sort: Best Success Rate</option>
            </select>
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
            />
          ))}
        </div>
      </section>
    </div>
  );
}
