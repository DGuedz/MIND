import { type ComponentType, useState, useMemo, useEffect, useRef } from "react";
import { motion, AnimatePresence, useScroll, useTransform } from "framer-motion";

type VerticalStat = {
  label: string;
  value: string;
  hint: string;
};

type VerticalCard = {
  id: string;
  name: string;
  type: string;
  price: string;
  Art: ComponentType<{ isHovered: boolean }>;
};

type VerticalSignal = {
  source_url: string;
  source_type: string;
  published_at: string;
  headline: string;
  claim_type: string;
  confidence_score: number;
  content_hash: string;
  classification_layer: "public_ecosystem_signal" | "verified_onchain_metric";
  stale?: boolean;
};

export type MarketplaceVertical = {
  id: string;
  indexLabel: string;
  title: string;
  subtitle: string;
  description: string;
  stats: VerticalStat[];
  card: VerticalCard;
  signal?: VerticalSignal;
};

export function VerticalsMarketplaceSlider({
  verticals,
  onExploreRegistry
}: {
  verticals: MarketplaceVertical[];
  onExploreRegistry: () => void;
}) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [hoveredCardId, setHoveredCardId] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Keep track of the latest index for the wheel event handler without re-binding
  const currentIndexRef = useRef(activeIndex);
  useEffect(() => {
    currentIndexRef.current = activeIndex;
  }, [activeIndex]);

  const maxIndex = Math.max(0, verticals.length - 1);
  const safeIndex = Math.max(0, Math.min(activeIndex, Math.max(0, verticals.length - 1)));
  const active = verticals[safeIndex] ?? null;

  const scrollToIndex = (idx: number) => {
    const clampedIdx = Math.max(0, Math.min(maxIndex, idx));
    
    // Forçamos o scroll físico da página para a âncora da seção 
    // mapeada pelo framer motion
    if (containerRef.current) {
      const containerTop = containerRef.current.offsetTop;
      const containerHeight = containerRef.current.offsetHeight;
      const targetScroll = containerTop + ((clampedIdx / verticals.length) * containerHeight);
      
      window.scrollTo({
        top: targetScroll,
        behavior: "smooth"
      });
    }
  };

  useEffect(() => {
    // Removemos o event listener de 'wheel' customizado que bloqueava a rolagem nativa.
    // Agora o scrollYProgress do framer-motion cuida da sincronia perfeitamente.
  }, []);

  const headerMeta = useMemo(() => {
    if (!active) return { vertical: "", count: "" };
    const count = String(verticals.length).padStart(2, "0");
    const current = String(safeIndex + 1).padStart(2, "0");
    return { vertical: `${current}/${count}`, count };
  }, [active, safeIndex, verticals.length]);

  // Hook para mapear o progresso do scroll do container para o índice do slide
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start center", "end center"]
  });

  // Mapeia o progresso do scroll (0 a 1) para o índice das verticais
  useEffect(() => {
    const unsubscribe = scrollYProgress.on("change", (latest) => {
      // Como o container tem h-[400vh], `latest` vai de 0 a 1 ao longo da rolagem.
      // Dividimos esse progresso pelo número de verticais para encontrar o slide atual.
      const progress = Math.min(Math.max(latest, 0), 0.99); // Evita bater em 1 cravado e pular pra fora do array
      const calculatedIndex = Math.floor(progress * verticals.length);
      
      if (calculatedIndex !== currentIndexRef.current) {
        setActiveIndex(calculatedIndex);
      }
    });

    return () => unsubscribe();
  }, [scrollYProgress, verticals.length]);

  return (
    <div className="relative h-[400vh]" ref={containerRef}>
      <div className="sticky top-20 md:top-24 flex flex-col gap-4 md:gap-8 pb-4 md:pb-8 pt-8 md:pt-0 max-h-[calc(100vh-6rem)] h-screen overflow-hidden">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 md:gap-8 border-b border-white/20 pb-6 md:pb-8 shrink-0">
          <div className="space-y-2 md:space-y-3 max-w-2xl">
            <div className="text-[10px] font-mono uppercase tracking-[0.35em] text-zinc-600">
              Agent Cards Marketplace
            </div>
            <h2 className="text-3xl md:text-5xl font-bold text-white tracking-tight">
              Verticals <span className="italic font-light opacity-60">Slider.</span>
            </h2>
            <p className="text-zinc-500 leading-relaxed font-light text-sm md:text-base">
              Cada vertical é um deck de execução. Compare capacidades operacionais como se fossem atributos de um Cypher Car.
            </p>
          </div>

          <div className="flex flex-col items-start md:items-end gap-4">
            <div className="text-[10px] font-mono uppercase tracking-[0.3em] text-zinc-600">
              Vertical {headerMeta.vertical}
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                className="px-4 py-2 rounded-full text-[9px] font-mono uppercase tracking-[0.25em] border border-white/20 bg-white/[0.02] text-zinc-500 hover:text-white hover:border-white/30 transition-colors"
                onClick={() => scrollToIndex(Math.max(0, safeIndex - 1))}
                aria-label="Vertical anterior"
              >
                Anterior
              </button>
              <button
                type="button"
                className="px-4 py-2 rounded-full text-[9px] font-mono uppercase tracking-[0.25em] border border-white/20 bg-white/[0.02] text-zinc-500 hover:text-white hover:border-white/30 transition-colors"
                onClick={() => scrollToIndex(Math.min(verticals.length - 1, safeIndex + 1))}
                aria-label="Próxima vertical"
              >
                Próximo
              </button>
              <button
                type="button"
                className="px-4 py-2 rounded-full text-[9px] font-mono uppercase tracking-[0.25em] border border-white/20 bg-white/[0.02] text-zinc-400 hover:text-white hover:border-white/30 transition-colors"
                onClick={onExploreRegistry}
              >
                Explore Registry
              </button>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 shrink-0">
          {verticals.map((v, idx) => {
            const selected = idx === safeIndex;
            return (
              <button
                key={v.id}
                type="button"
                onClick={() => scrollToIndex(idx)}
                className={`px-3 md:px-4 py-1.5 md:py-2 rounded-full text-[8px] md:text-[9px] font-mono uppercase tracking-[0.25em] border transition-colors ${
                  selected
                    ? "bg-white text-black border-white"
                    : "bg-white/[0.02] text-zinc-500 border-white/20 hover:border-white/30 hover:text-white"
                }`}
                aria-current={selected ? "true" : undefined}
              >
                {v.title}
              </button>
            );
          })}
        </div>

        <div className="relative rounded-[2rem] md:rounded-[2.5rem] border border-white/20 bg-white/[0.02] overflow-hidden w-full flex-1 min-h-0">
          <AnimatePresence mode="wait">
            {active ? (
              <motion.div 
                key={active.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className="p-4 sm:p-6 md:p-8 lg:p-6 xl:p-8 grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6 lg:gap-6 xl:gap-8 h-full overflow-y-auto overflow-x-hidden custom-scrollbar"
              >
                <motion.div 
                  initial={{ opacity: 0, x: -30 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
                  className="lg:col-span-5 space-y-3 sm:space-y-4 lg:space-y-5 flex flex-col justify-center py-3 lg:py-0"
                >
                <div className="inline-flex w-fit items-center rounded-full border border-white/20 bg-white/[0.03] px-4 py-1.5 text-[8px] md:text-[9px] font-mono uppercase tracking-[0.35em] text-zinc-400 shadow-inner">
                  Vertical {active.indexLabel} · Discovery
                </div>

                <div className="space-y-1 md:space-y-2 pt-2">
                  <div className="text-3xl sm:text-4xl md:text-5xl lg:text-5xl font-bold text-white tracking-tighter font-mono uppercase leading-[0.9]">
                    {active.title}
                  </div>
                  <div className="text-3xl sm:text-4xl md:text-5xl lg:text-5xl font-bold text-zinc-600 tracking-tighter font-mono uppercase italic leading-[0.9]">
                    {active.subtitle}.
                  </div>
                  <p className="text-zinc-400 leading-relaxed font-light text-sm md:text-base max-w-md pt-3">
                    {active.description}
                  </p>
                </div>

                <div className="rounded-xl border border-white/10 bg-[#020202]/80 backdrop-blur-md p-4 space-y-3 shadow-inner">
                  <div className="flex items-center justify-between gap-3 border-b border-white/5 pb-2">
                    <div className="text-[8px] md:text-[9px] font-mono uppercase tracking-[0.3em] text-zinc-500">
                      Market Signals
                    </div>
                    <div className="text-[8px] md:text-[9px] font-mono uppercase tracking-[0.2em] text-zinc-400">
                      {active.signal?.classification_layer ?? "public_ecosystem_signal"}
                    </div>
                  </div>
                  <div className="text-xs md:text-sm text-zinc-300 font-mono font-light leading-relaxed">
                    {active.signal?.headline ?? "Feed indisponível. Exibindo último snapshot válido."}
                  </div>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-[9px] md:text-[10px] font-mono uppercase tracking-[0.25em] text-zinc-500 pt-1">
                    <span className="text-zinc-400">As Of {active.signal?.published_at ?? "N/A"}</span>
                    <span>Conf {active.signal ? active.signal.confidence_score.toFixed(2) : "0.00"}</span>
                    <span>{active.signal?.claim_type ?? "company_claim"}</span>
                    {active.signal?.stale ? <span className="text-red-400">Stale</span> : null}
                  </div>
                  {active.signal?.source_url ? (
                    <a
                      href={active.signal.source_url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex text-[9px] md:text-[10px] font-mono uppercase tracking-[0.2em] text-zinc-500 hover:text-white transition-colors"
                    >
                      Source URL
                    </a>
                  ) : null}
                </div>

                <div className="space-y-3 sm:space-y-4">
                  {active.stats.slice(0, 2).map((s) => (
                    <div key={s.label} className="flex items-start gap-4 rounded-xl border border-white/5 bg-[#050505]/50 px-4 py-3">
                      <div className="mt-0.5 h-6 w-6 rounded-full border border-white/20 bg-white/[0.02] flex items-center justify-center text-[10px] font-mono text-zinc-300">
                        +
                      </div>
                      <div className="space-y-1">
                        <div className="text-[9px] md:text-[10px] font-mono uppercase tracking-[0.3em] text-zinc-500">{s.label}</div>
                        <div className="text-xs md:text-sm text-zinc-300 font-mono">
                          {s.value} <span className="text-zinc-600">· {s.hint}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex flex-col sm:flex-row gap-3 pt-4 md:pt-2">
                  <button
                    type="button"
                    className="bg-white text-black hover:bg-zinc-200 text-[9px] md:text-[10px] font-mono uppercase tracking-[0.3em] px-6 py-3 rounded-full transition-all w-full sm:w-auto shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:shadow-[0_0_30px_rgba(255,255,255,0.2)] font-bold"
                    onClick={async () => {
                      if (active.card.id === "clint" || active.card.id === "volan" || active.card.id === "dexter" || active.card.id === "krios") {
                        window.location.href = `/gateway?intentId=purchase_card_${active.card.id}&amountLamports=10000000&recipient=FHk1jqFwoVBudRSaNB9N4kKewyaS5k8hqc2ctm8Q1zah`;
                      } else {
                        onExploreRegistry();
                      }
                    }}
                  >
                    Execute Atomically
                  </button>
                  <button
                    type="button"
                    className="text-[9px] md:text-[10px] font-mono uppercase tracking-[0.3em] text-zinc-400 hover:text-white transition-all px-6 py-3 border border-white/20 hover:border-white/40 hover:bg-white/[0.02] rounded-full w-full sm:w-auto text-center"
                    onClick={onExploreRegistry}
                  >
                    View on Registry
                  </button>
                </div>
              </motion.div>

                <motion.div 
                  initial={{ opacity: 0, x: 30 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6, delay: 0.4, ease: "easeOut" }}
                  className="lg:col-span-7 flex flex-col justify-center w-full py-4 lg:py-0 min-h-[300px] h-full"
                >
                <div
                  className="group cursor-pointer w-full flex-1 flex flex-col min-h-[300px] sm:min-h-[350px] md:min-h-[400px]"
                  onClick={onExploreRegistry}
                  onMouseEnter={() => setHoveredCardId(active.card.id)}
                  onMouseLeave={() => setHoveredCardId((cur) => (cur === active.card.id ? null : cur))}
                >
                  <div className="relative rounded-[1.5rem] md:rounded-[2.5rem] overflow-hidden border border-white/20 bg-[#050505] flex-1 flex flex-col h-full min-h-[300px] sm:min-h-[350px] md:min-h-[400px]">
                    <div className="flex-1 relative w-full h-full min-h-[300px] sm:min-h-[350px] md:min-h-[400px]">
                      <active.card.Art isHovered={hoveredCardId === active.card.id} />
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/25 pointer-events-none" />
                    <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-6 md:p-8">
                      <div className="flex items-end justify-between gap-4 md:gap-6 border-t border-white/10 pt-4 bg-gradient-to-t from-black/80 to-transparent">
                        <div className="space-y-1 md:space-y-2">
                          <div className="text-[9px] md:text-[10px] font-mono uppercase tracking-[0.4em] text-zinc-500">Featured Card</div>
                          <div className="text-2xl md:text-3xl font-mono uppercase text-white tracking-tight">{active.card.name}</div>
                          <div className="text-[9px] md:text-[10px] font-mono uppercase tracking-[0.4em] text-zinc-500">{active.card.type}</div>
                        </div>
                        <div className="text-right space-y-1 md:space-y-2">
                          <div className="text-[9px] md:text-[10px] font-mono uppercase tracking-[0.4em] text-zinc-500">Price</div>
                          <div className="text-[10px] md:text-[12px] font-mono text-zinc-300 tracking-wider">{active.card.price}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                </motion.div>
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
