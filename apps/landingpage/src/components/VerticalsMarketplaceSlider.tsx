import { type ComponentType, useRef, useState, useMemo } from "react";
import { motion, useScroll, useTransform, useMotionValueEvent } from "framer-motion";

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

export type MarketplaceVertical = {
  id: string;
  indexLabel: string;
  title: string;
  subtitle: string;
  description: string;
  stats: VerticalStat[];
  card: VerticalCard;
};

export function VerticalsMarketplaceSlider({
  verticals,
  onExploreRegistry
}: {
  verticals: MarketplaceVertical[];
  onExploreRegistry: () => void;
}) {
  const targetRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [hoveredCardId, setHoveredCardId] = useState<string | null>(null);

  const { scrollYProgress } = useScroll({
    target: targetRef,
    offset: ["start start", "end end"]
  });

  useMotionValueEvent(scrollYProgress, "change", (latest) => {
    const idx = Math.round(latest * (verticals.length - 1));
    setActiveIndex(idx);
  });

  const x = useTransform(
    scrollYProgress,
    [0, 1],
    ["0%", `-${100 * ((verticals.length - 1) / verticals.length)}%`]
  );

  const safeIndex = Math.max(0, Math.min(activeIndex, Math.max(0, verticals.length - 1)));
  const active = verticals[safeIndex] ?? null;

  const scrollToIndex = (idx: number) => {
    if (!targetRef.current) return;
    const rect = targetRef.current.getBoundingClientRect();
    const scrollPos = window.scrollY + rect.top + (idx / (verticals.length - 1)) * (rect.height - window.innerHeight);
    window.scrollTo({ top: scrollPos, behavior: "smooth" });
  };

  const headerMeta = useMemo(() => {
    if (!active) return { vertical: "", count: "" };
    const count = String(verticals.length).padStart(2, "0");
    const current = String(safeIndex + 1).padStart(2, "0");
    return { vertical: `${current}/${count}`, count };
  }, [active, safeIndex, verticals.length]);

  return (
    <div ref={targetRef} className="relative h-[400vh]">
      <div className="sticky top-24 flex flex-col gap-4 md:gap-10 overflow-y-auto overflow-x-hidden max-h-[calc(100vh-6rem)] pb-6 md:pb-12 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 md:gap-8 border-b border-white/20 pb-4 md:pb-10">
          <div className="space-y-3 max-w-2xl">
            <div className="text-[10px] font-mono uppercase tracking-[0.35em] text-zinc-600">
              Agent Cards Marketplace
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-white tracking-tight">
              Verticals <span className="italic font-light opacity-60">Slider.</span>
            </h2>
            <p className="text-zinc-500 leading-relaxed font-light">
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

        <div className="flex flex-wrap gap-2">
          {verticals.map((v, idx) => {
            const selected = idx === safeIndex;
            return (
              <button
                key={v.id}
                type="button"
                onClick={() => scrollToIndex(idx)}
                className={`px-4 py-2 rounded-full text-[9px] font-mono uppercase tracking-[0.25em] border transition-colors ${
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

        <div className="relative rounded-[2.5rem] border border-white/20 bg-white/[0.02] overflow-hidden">
          <motion.div
            className="flex"
            style={{
              x,
              width: `${verticals.length * 100}%`
            }}
          >
            {verticals.map((v) => (
              <div key={v.id} style={{ width: `${100 / verticals.length}%` }} className="shrink-0">
                <div className="p-6 md:p-8 lg:p-12 grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-10 items-stretch">
                  <div className="lg:col-span-5 space-y-6 lg:space-y-8">
                    <div className="space-y-4">
                      <div className="text-[10px] font-mono uppercase tracking-[0.35em] text-zinc-600">
                        Vertical {v.indexLabel}
                      </div>
                      <div className="space-y-2">
                        <div className="text-3xl md:text-4xl font-bold text-white tracking-tight font-mono uppercase">
                          {v.title}.
                        </div>
                        <div className="text-[10px] font-mono uppercase tracking-[0.35em] text-zinc-600">
                          {v.subtitle}
                        </div>
                      </div>
                      <p className="text-zinc-500 leading-relaxed font-light">
                        {v.description}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-2 sm:gap-4">
                      {v.stats.slice(0, 4).map((s) => (
                        <div key={s.label} className="bg-black/40 border border-white/[0.06] rounded-xl sm:rounded-2xl p-3 sm:p-4 space-y-1 sm:space-y-2">
                          <div className="text-[8px] font-mono uppercase tracking-[0.25em] text-zinc-700">{s.label}</div>
                          <div className="text-xl font-mono text-white tracking-tight">{s.value}</div>
                          <div className="text-[9px] font-mono uppercase tracking-[0.25em] text-zinc-600">{s.hint}</div>
                        </div>
                      ))}
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3">
                      <button
                        type="button"
                        className="bg-white text-black hover:bg-zinc-200 text-[9px] font-mono uppercase tracking-[0.25em] px-6 py-2 rounded-full transition-colors"
                        onClick={async () => {
                          if (v.card.id === "clint" || v.card.id === "volan" || v.card.id === "dexter" || v.card.id === "krios") {
                            window.location.href = `/gateway?intentId=purchase_card_${v.card.id}&amountLamports=10000000&recipient=FHk1jqFwoVBudRSaNB9N4kKewyaS5k8hqc2ctm8Q1zah`;
                          } else {
                            onExploreRegistry();
                          }
                        }}
                      >
                        Execute Atomically
                      </button>
                      <button
                        type="button"
                        className="text-[9px] font-mono uppercase tracking-[0.25em] text-zinc-500 hover:text-white transition-colors px-6 py-2 border border-white/20 rounded-full"
                        onClick={onExploreRegistry}
                      >
                        View on Registry
                      </button>
                    </div>
                  </div>

                  <div className="lg:col-span-7 h-full">
                    <div
                      className="group cursor-pointer h-full"
                      onClick={onExploreRegistry}
                      onMouseEnter={() => setHoveredCardId(v.card.id)}
                      onMouseLeave={() => setHoveredCardId((cur) => (cur === v.card.id ? null : cur))}
                    >
                      <div className="relative rounded-[2.5rem] overflow-hidden border border-white/20 bg-[#050505] h-full flex flex-col">
                        <div className="aspect-[21/9] sm:aspect-[16/10] md:aspect-[16/9] grow relative">
                          <v.card.Art isHovered={hoveredCardId === v.card.id} />
                        </div>
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/25 pointer-events-none" />
                        <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8">
                          <div className="flex items-end justify-between gap-6">
                            <div className="space-y-2">
                              <div className="text-[10px] font-mono uppercase tracking-[0.35em] text-zinc-600">Featured Card</div>
                              <div className="text-2xl font-mono uppercase text-white tracking-tight">{v.card.name}</div>
                              <div className="text-[10px] font-mono uppercase tracking-[0.35em] text-zinc-600">{v.card.type}</div>
                            </div>
                            <div className="text-right space-y-2">
                              <div className="text-[10px] font-mono uppercase tracking-[0.35em] text-zinc-600">Price</div>
                              <div className="text-[11px] font-mono text-zinc-300">{v.card.price}</div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
