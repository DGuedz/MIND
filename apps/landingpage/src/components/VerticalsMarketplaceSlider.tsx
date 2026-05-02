import { type ComponentType, useState, useMemo, useEffect, useRef } from "react";
import { motion, AnimatePresence, useScroll } from "framer-motion";

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
  const [mousePos, setMousePos] = useState({ x: 250, y: 300 });
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setMousePos({ x, y });
  };

  const handleMouseLeave = () => {
    setMousePos({ x: 250, y: 300 });
    setHoveredCardId(null);
  };
  
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
      <div className="sticky top-20 md:top-24 flex flex-col gap-3 md:gap-4 pb-4 md:pb-8 pt-8 md:pt-0 max-h-[calc(100vh-4rem)] h-screen overflow-hidden">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-3 md:gap-4 border-b border-white/20 pb-4 md:pb-5 shrink-0">
          <div className="space-y-1.5 md:space-y-2 max-w-2xl">
            <div className="text-[9px] font-mono uppercase tracking-[0.35em] text-zinc-600">
              Agent Cards Marketplace
            </div>
            <h2 className="text-2xl md:text-4xl font-bold text-white tracking-tight">
              Verticals <span className="italic font-light opacity-60">Slider.</span>
            </h2>
            <p className="text-zinc-500 leading-relaxed font-light text-xs md:text-sm">
              Cada vertical é um deck de execução. Compare capacidades operacionais como se fossem atributos de um Cypher Car.
            </p>
          </div>

          <div className="flex flex-col items-start md:items-end gap-3">
            <div className="text-[9px] font-mono uppercase tracking-[0.3em] text-zinc-600">
              Vertical {headerMeta.vertical}
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                className="px-3 py-1.5 rounded-full text-[8px] font-mono uppercase tracking-[0.25em] border border-white/20 bg-white/[0.02] text-zinc-500 hover:text-white hover:border-white/30 transition-colors"
                onClick={() => scrollToIndex(Math.max(0, safeIndex - 1))}
                aria-label="Vertical anterior"
              >
                Anterior
              </button>
              <button
                type="button"
                className="px-3 py-1.5 rounded-full text-[8px] font-mono uppercase tracking-[0.25em] border border-white/20 bg-white/[0.02] text-zinc-500 hover:text-white hover:border-white/30 transition-colors"
                onClick={() => scrollToIndex(Math.min(verticals.length - 1, safeIndex + 1))}
                aria-label="Próxima vertical"
              >
                Próximo
              </button>
              <button
                type="button"
                className="px-3 py-1.5 rounded-full text-[8px] font-mono uppercase tracking-[0.25em] border border-white/20 bg-white/[0.02] text-zinc-400 hover:text-white hover:border-white/30 transition-colors"
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
                className={`px-3 py-1.5 md:px-4 md:py-2 rounded-full text-[8px] font-mono uppercase tracking-[0.25em] border transition-colors ${
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
                className="p-3 sm:p-5 md:p-6 lg:p-5 xl:p-6 grid grid-cols-1 lg:grid-cols-12 gap-3 sm:gap-4 lg:gap-4 xl:gap-6 h-full overflow-y-auto overflow-x-hidden custom-scrollbar items-stretch"
              >
                <motion.div 
                  initial={{ opacity: 0, x: -30 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
                  className="lg:col-span-4 space-y-3 flex flex-col justify-center py-2 lg:py-0 w-full"
                >
                <div className="inline-flex w-fit items-center gap-2 rounded-full border border-white/20 bg-gradient-to-r from-white/5 to-[#14F195]/5 px-4 py-1.5 text-[8px] md:text-[9px] font-mono uppercase tracking-[0.35em] text-zinc-300 shadow-[0_0_15px_rgba(20,241,149,0.02)] backdrop-blur-sm">
                  <span className="w-1.5 h-1.5 rounded-full bg-gradient-to-r from-[#10B981] to-[#6366F1] shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                  Vertical {active.indexLabel} · Discovery
                </div>

                <div className="space-y-1 pt-1">
                  <div className="text-2xl sm:text-3xl md:text-4xl lg:text-4xl font-bold tracking-tighter font-mono uppercase leading-[0.9]">
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-zinc-300 via-zinc-500 to-[#10B981]">
                      {active.title}
                    </span>
                  </div>
                  <div className="text-lg sm:text-xl md:text-2xl lg:text-2xl font-bold text-zinc-600 tracking-tighter font-mono uppercase italic leading-[0.9]">
                    {active.subtitle}.
                  </div>
                  <p className="text-zinc-400 leading-relaxed font-light text-[10px] md:text-[11px] max-w-sm pt-1">
                    {active.description}
                  </p>
                </div>

                <div className="metallic-brushed-solana rounded-xl border border-white/20 bg-[#020202]/80 backdrop-blur-md p-4 space-y-2 shadow-inner">
                  <div className="flex items-center justify-between gap-3 border-b border-white/5 pb-2">
                    <div className="text-[8px] font-mono uppercase tracking-[0.3em] text-zinc-500">
                      Market Signals
                    </div>
                    <div className="text-[8px] font-mono uppercase tracking-[0.2em] text-zinc-400">
                      {active.signal?.classification_layer ?? "public_ecosystem_signal"}
                    </div>
                  </div>
                  <div className="text-xs text-zinc-300 font-mono font-light leading-relaxed">
                    {active.signal?.headline ?? "Feed indisponível. Exibindo último snapshot válido."}
                  </div>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[8px] md:text-[9px] font-mono uppercase tracking-[0.25em] text-zinc-500 pt-1">
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
                      className="inline-flex text-[8px] md:text-[9px] font-mono uppercase tracking-[0.2em] text-zinc-500 hover:text-[#10B981] transition-colors"
                    >
                      Source URL
                    </a>
                  ) : null}
                </div>

                <div className="space-y-2 sm:space-y-3">
                  {active.stats.slice(0, 2).map((s) => (
                    <div key={s.label} className="metallic-brushed-solana flex items-start gap-3 rounded-xl border border-white/20 bg-[#050505]/80 backdrop-blur-md px-4 py-2.5 shadow-[0_0_15px_rgba(255,255,255,0.02)]">
                      <div className="mt-1 h-3 w-3 rounded-full border border-white/20 bg-gradient-to-r from-white/5 to-[#10B981]/10 flex items-center justify-center text-[7px] font-mono text-[#10B981] shadow-[0_0_8px_rgba(16,185,129,0.2)]">
                        +
                      </div>
                      <div className="space-y-0.5">
                        <div className="text-[7px] md:text-[8px] font-mono uppercase tracking-[0.3em] text-zinc-500">{s.label}</div>
                        <div className="text-[10px] md:text-xs text-zinc-300 font-mono">
                          {s.value} <span className="text-zinc-600">· {s.hint}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex flex-col sm:flex-row gap-2 pt-2 md:pt-1">
                  <button
                    type="button"
                    className="bg-gradient-to-r from-zinc-100 to-zinc-300 text-black hover:from-white hover:to-zinc-200 text-[7px] md:text-[8px] font-mono uppercase tracking-[0.3em] px-4 py-2.5 rounded-full transition-all w-full sm:w-auto shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:shadow-[0_0_30px_rgba(255,255,255,0.2)] font-bold"
                    onClick={async () => {
                      if (active.card.id === "sybil" || active.card.id === "jit" || active.card.id === "echo" || active.card.id === "intent") {
                        // Roteamento temporário para o Gateway x402 de teste (simulando a compra)
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
                    className="text-[7px] md:text-[8px] font-mono uppercase tracking-[0.3em] text-zinc-400 hover:text-white transition-all px-4 py-2.5 border border-white/20 hover:border-white/40 hover:bg-white/[0.05] rounded-full w-full sm:w-auto text-center shadow-[0_0_15px_rgba(255,255,255,0.02)]"
                    onClick={() => {
                      // O Botão "View on Registry" agora abre o checkout de publicação
                      // para simular a criação/validação do Agent Card via x402
                      window.location.href = '/agent-checkout';
                    }}
                  >
                    View on Registry
                  </button>
                </div>
              </motion.div>

                <motion.div 
                  initial={{ opacity: 0, x: 30 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6, delay: 0.4, ease: "easeOut" }}
                  className="lg:col-span-8 flex flex-col justify-center w-full py-4 lg:py-0 min-h-[300px] h-full"
                >
                <div
                  className="group cursor-pointer w-full flex-1 flex flex-col min-h-[300px] lg:min-h-0 relative h-full"
                  style={{ perspective: "1000px" }}
                  onClick={async () => {
                    if (active.card.id === "sybil" || active.card.id === "jit" || active.card.id === "echo" || active.card.id === "intent") {
                      window.location.href = `/gateway?intentId=purchase_card_${active.card.id}&amountLamports=10000000&recipient=FHk1jqFwoVBudRSaNB9N4kKewyaS5k8hqc2ctm8Q1zah`;
                    } else {
                      onExploreRegistry();
                    }
                  }}
                  onMouseEnter={() => setHoveredCardId(active.card.id)}
                  onMouseLeave={handleMouseLeave}
                  onMouseMove={handleMouseMove}
                >
                  <div 
                    className="metallic-brushed-solana relative rounded-[1.5rem] md:rounded-[2.5rem] overflow-hidden border border-white/20 bg-[#020202] flex-1 flex flex-col h-full min-h-[300px] lg:min-h-0 transition-transform duration-500 ease-out shadow-[0_0_30px_rgba(0,0,0,0.5)]"
                    style={{ 
                      transformStyle: 'preserve-3d',
                      transform: `rotateX(${(mousePos.y - 300) * -0.015}deg) rotateY(${(mousePos.x - 250) * 0.015}deg)`
                    }}
                  >
                    {/* Borda 3D no Hover */}
                    <div 
                      className="absolute inset-0 rounded-[1.5rem] md:rounded-[2.5rem] border border-white/20 pointer-events-none transition-transform duration-500 ease-out z-10"
                      style={{ transform: "translateZ(0px)" }}
                    />
                    <div 
                      className="absolute inset-0 rounded-[1.5rem] md:rounded-[2.5rem] border border-white/10 pointer-events-none transition-all duration-500 ease-out opacity-0 group-hover:opacity-100 group-hover:translate-z-[15px] z-10"
                      style={{ transform: "translateZ(15px)" }}
                    />
                    <div 
                      className="absolute inset-0 rounded-[1.5rem] md:rounded-[2.5rem] border border-white/20 pointer-events-none transition-all duration-500 ease-out opacity-0 group-hover:opacity-100 group-hover:translate-z-[30px] z-10"
                      style={{ transform: "translateZ(30px)", boxShadow: "0 0 30px rgba(255,255,255,0.05)" }}
                    />

                    {/* Reflexo Dinâmico (Glow) */}
                    <div className="absolute inset-0 overflow-hidden pointer-events-none z-10 rounded-[1.5rem] md:rounded-[2.5rem]">
                      <div 
                        className="absolute inset-0 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-700 mix-blend-overlay" 
                        style={{
                          background: `radial-gradient(circle 400px at ${mousePos.x}px ${mousePos.y}px, rgba(255,255,255,0.15), transparent)`
                        }}
                      />
                    </div>

                    {/* Fundo do SVG */}
                    <div className="flex-1 relative w-full h-full flex items-center justify-center p-0 min-h-[300px] lg:min-h-0 z-0 bg-transparent mix-blend-screen scale-[0.91] transform-origin-center">
                      <active.card.Art isHovered={hoveredCardId === active.card.id} />
                    </div>

                    {/* Footer / Informações em 3D */}
                    <div className="absolute inset-0 bg-gradient-to-t from-[#020202]/95 via-[#020202]/40 to-transparent pointer-events-none z-10" />
                    <div 
                      className="absolute bottom-0 left-0 right-0 p-4 sm:p-6 md:p-8 z-20 transition-transform duration-500 ease-out"
                      style={{ transform: `translateZ(40px)` }}
                    >
                      <div className="flex items-end justify-between gap-4 md:gap-6 border-t border-white/10 pt-4">
                        <div className="space-y-1 md:space-y-2">
                          <div className="text-[9px] md:text-[10px] font-mono uppercase tracking-[0.4em] text-zinc-500">A2A Capability Card</div>
                          <div className="text-2xl md:text-3xl font-mono uppercase text-white tracking-tight drop-shadow-md">{active.card.name}</div>
                          <div className="text-[9px] md:text-[10px] font-mono uppercase tracking-[0.4em] text-zinc-500">{active.card.type}</div>
                        </div>
                        <div className="text-right space-y-1 md:space-y-2">
                          <div className="text-[9px] md:text-[10px] font-mono uppercase tracking-[0.4em] text-zinc-500">Atomic Settlement</div>
                          <div className="text-[10px] md:text-[12px] font-mono text-zinc-300 tracking-wider bg-white/[0.05] border border-white/10 px-3 py-1 rounded-full">{active.card.price}</div>
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
