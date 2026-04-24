import { useState, useEffect } from "react";
import { Badge } from "../components/ui/badge";
import { useNavigate } from "react-router-dom";

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
  origin?: string;
  badges?: string[];
};

type CatalogPayload = {
  as_of: string;
  items: CatalogItem[];
};

export function MarketplacePage() {
  const navigate = useNavigate();
  const [catalogTab, setCatalogTab] = useState<"skills" | "products">("skills");
  const [catalogSkills, setCatalogSkills] = useState<CatalogItem[]>([]);
  const [catalogProducts, setCatalogProducts] = useState<CatalogItem[]>([]);
  const [catalogSourceFilter, setCatalogSourceFilter] = useState<"all" | "mind" | "sendaifun" | "stbr" | "frames">("all");
  const [catalogCategoryFilter, setCatalogCategoryFilter] = useState<string>("all");
  const [catalogQuery, setCatalogQuery] = useState<string>("");
  const [catalogStatus, setCatalogStatus] = useState<"loading" | "live" | "fallback">("loading");
  const [catalogAsOf, setCatalogAsOf] = useState<string | null>(null);
  const [selectedCatalogItemId, setSelectedCatalogItemId] = useState<string | null>(null);
  
  const searchParams = new URLSearchParams(window.location.search);
  const urlWallet = searchParams.get("wallet");
  const targetWalletText = urlWallet || "FHk1jqFwoVBudRSaNB9N4kKewyaS5k8hqc2ctm8Q1zah";

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
        } catch (e) {}
      }

      if (productsResult.status === "fulfilled" && productsResult.value.ok) {
        try {
          const payload = (await productsResult.value.json()) as CatalogPayload;
          products = Array.isArray(payload.items) ? payload.items : null;
          asOf = payload.as_of || asOf;
        } catch (e) {}
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
          <div className="lg:col-span-6">
            <input
              value={catalogQuery}
              onChange={(e) => setCatalogQuery(e.target.value)}
              placeholder="Search name, tags, description"
              className="w-full bg-white/[0.02] border border-white/20 rounded-2xl px-5 py-3 text-sm text-zinc-300 placeholder:text-zinc-700 outline-none focus:border-white/40 transition-colors"
            />
          </div>
          <div className="lg:col-span-3">
            <select
              value={catalogSourceFilter}
              onChange={(e) => setCatalogSourceFilter(e.target.value as any)}
              className="w-full bg-white/[0.02] border border-white/20 rounded-2xl px-4 py-3 text-[10px] font-mono text-zinc-400 uppercase tracking-widest outline-none focus:border-white/40 transition-colors"
            >
              <option value="all">All Sources</option>
              <option value="mind">MIND</option>
              <option value="sendaifun">SendAI</option>
              <option value="stbr">STBR</option>
              <option value="frames">Frames</option>
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
        </div>

        <div className="text-[10px] text-zinc-600 font-mono uppercase tracking-widest">
          Policy-first execution, atomic settlement rails, proof-native receipts. Catalog entries may include provider claims; verify before executing real capital.
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredCatalogItems.map((item) => {
            const isSelected = selectedCatalogItemId === item.id;
            return (
              <div
                key={item.id}
                className={`relative group bg-white/[0.02] border rounded-2xl p-6 transition-all duration-500 hover:-translate-y-1 hover:shadow-[0_10px_40px_-10px_rgba(255,255,255,0.05)] ${isSelected ? "border-white/40 shadow-[0_0_20px_rgba(255,255,255,0.05)]" : "border-white/10 hover:border-white/20"}`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 flex-wrap">
                      <Badge variant="outline" className="bg-zinc-900/50 text-zinc-400 border-zinc-800 text-[9px] font-mono uppercase tracking-widest shadow-sm">
                        {item.source}
                      </Badge>
                      <Badge variant="outline" className="bg-indigo-500/10 text-indigo-300 border-indigo-500/20 text-[9px] font-mono uppercase tracking-widest shadow-[0_0_8px_rgba(99,102,241,0.1)]">
                        {item.category}
                      </Badge>
                      {item.pricing?.model ? (
                        <Badge 
                          variant="outline" 
                          className={`text-[9px] font-mono uppercase tracking-widest ${
                            item.pricing.model.toLowerCase() === 'free' 
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 shadow-[0_0_8px_rgba(16,185,129,0.15)]'
                              : 'bg-zinc-800/50 text-zinc-300 border-zinc-700 shadow-sm'
                          }`}
                        >
                          {item.pricing.model}
                        </Badge>
                      ) : null}
                      {item.origin && (
                        <div className="px-2 py-0.5 rounded text-[8px] font-mono uppercase tracking-[0.2em] bg-zinc-800 text-zinc-300 border border-zinc-700">
                          ORIGIN: {item.origin}
                        </div>
                      )}
                      {item.badges?.map(badge => (
                        <div key={badge} className="px-2 py-0.5 rounded text-[8px] font-mono uppercase tracking-[0.2em] bg-zinc-800 text-amber-500/80 border border-amber-900/50">
                          🎖 {badge}
                        </div>
                      ))}
                    </div>
                    <div className="text-lg font-bold text-white tracking-tight font-mono">{item.name}</div>
                    <div className="text-sm text-zinc-500 font-light leading-relaxed">{item.description}</div>
                  </div>
                  <button
                    className={`text-[9px] font-mono uppercase tracking-[0.2em] transition-all duration-300 px-3 py-2 border rounded-full ${
                      isSelected 
                        ? "bg-white text-black border-white shadow-[0_0_15px_rgba(255,255,255,0.3)]" 
                        : "bg-transparent text-zinc-500 border-white/10 hover:border-white/30 hover:text-white hover:bg-white/5"
                    }`}
                    onClick={() => setSelectedCatalogItemId((current) => (current === item.id ? null : item.id))}
                  >
                    {isSelected ? "Close" : "View"}
                  </button>
                </div>

                {isSelected ? (
                  <div className="mt-6 space-y-4">
                    <div className="flex flex-wrap gap-2">
                      {item.tags.slice(0, 8).map((t) => (
                        <span key={t} className="text-[9px] font-mono uppercase tracking-widest text-zinc-700 border border-white/10 rounded-full px-3 py-1">
                          {t}
                        </span>
                      ))}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-black/40 border border-white/[0.02] rounded-xl p-4 space-y-2">
                        <div className="text-[8px] font-mono uppercase tracking-[0.2em] text-zinc-600">License</div>
                        <div className="text-[10px] font-mono text-zinc-300">{item.license}</div>
                      </div>
                      <div className="bg-black/40 border border-white/[0.02] rounded-xl p-4 space-y-2">
                        <div className="text-[8px] font-mono uppercase tracking-[0.2em] text-zinc-600">Pricing</div>
                        <div className="text-[10px] font-mono text-zinc-300">
                          {item.pricing?.model ? (
                            item.pricing.price != null
                              ? `${item.pricing.model} • ${item.pricing.currency ?? ""} ${item.pricing.price}`
                              : item.pricing.model
                          ) : "N/A"}
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <button
                        className="bg-white text-black hover:bg-zinc-200 text-[9px] font-mono uppercase tracking-[0.2em] px-6 py-2 rounded-full transition-all duration-500"
                        onClick={async () => {
                          const amount = item.pricing?.price ? item.pricing.price * 1000000000 : 1000000;
                          navigate(`/gateway?intentId=purchase_card_${item.id}&amountLamports=${amount}&recipient=${targetWalletText}`);
                        }}
                      >
                        Execute Atomically (x402)
                      </button>
                      <button
                        className="text-[9px] font-mono uppercase tracking-[0.2em] text-zinc-600 hover:text-white transition-colors px-6 py-2 border border-white/20 rounded-full"
                        onClick={() => window.open("https://github.com/DGuedz/MIND/tree/main/agent-cards", "_blank")}
                      >
                        View on GitHub
                      </button>
                    </div>
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
