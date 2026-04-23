import { type ComponentType, type KeyboardEventHandler, useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";

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
  const trackRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [hoveredCardId, setHoveredCardId] = useState<string | null>(null);

  const safeIndex = Math.max(0, Math.min(activeIndex, Math.max(0, verticals.length - 1)));
  const active = verticals[safeIndex] ?? null;

  const trackWidth = () => trackRef.current?.clientWidth ?? 1;

  const scrollToIndex = (idx: number) => {
    const el = trackRef.current;
    if (!el) return;
    const w = trackWidth();
    el.scrollTo({ left: idx * w, behavior: "smooth" });
  };

  const onTrackKeyDown: KeyboardEventHandler<HTMLDivElement> = (e) => {
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      scrollToIndex(Math.max(0, safeIndex - 1));
      return;
    }
    if (e.key === "ArrowRight") {
      e.preventDefault();
      scrollToIndex(Math.min(verticals.length - 1, safeIndex + 1));
    }
  };

  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;

    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      rafRef.current = requestAnimationFrame(() => {
        ticking = false;
        const w = trackWidth();
        const idx = Math.round(el.scrollLeft / w);
        setActiveIndex((current) => (current === idx ? current : idx));
      });
    };

    el.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      el.removeEventListener("scroll", onScroll);
      if (rafRef.current != null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    const onResize = () => scrollToIndex(activeIndex);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [activeIndex]);

  const headerMeta = useMemo(() => {
    if (!active) return { vertical: "", count: "" };
    const count = String(verticals.length).padStart(2, "0");
    const current = String(safeIndex + 1).padStart(2, "0");
    return { vertical: `${current}/${count}`, count };
  }, [active, safeIndex, verticals.length]);

  return (
    <div className="space-y-10">
      <div className="flex flex-col md:flex-row justify-between items-end gap-8 border-b border-white/20 pb-10">
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

      <div
        ref={trackRef}
        tabIndex={0}
        role="region"
        aria-label="Marketplace de verticais"
        onKeyDown={onTrackKeyDown}
        className="flex overflow-x-auto snap-x snap-mandatory scroll-smooth custom-scrollbar rounded-[2.5rem] border border-white/20 bg-white/[0.02]"
        style={{ WebkitOverflowScrolling: "touch" }}
      >
        {verticals.map((v) => (
          <div key={v.id} className="w-full shrink-0 snap-center">
            <div className="p-8 md:p-12 grid grid-cols-1 lg:grid-cols-12 gap-10 items-stretch">
              <div className="lg:col-span-5 space-y-8">
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

                <div className="grid grid-cols-2 gap-4">
                  {v.stats.slice(0, 4).map((s) => (
                    <div key={s.label} className="bg-black/40 border border-white/[0.06] rounded-2xl p-4 space-y-2">
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
                    onClick={onExploreRegistry}
                  >
                    Ver cards
                  </button>
                  <button
                    type="button"
                    className="text-[9px] font-mono uppercase tracking-[0.25em] text-zinc-500 hover:text-white transition-colors px-6 py-2 border border-white/20 rounded-full"
                    onClick={onExploreRegistry}
                  >
                    Comparar
                  </button>
                </div>
              </div>

              <motion.div
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.7 }}
                className="lg:col-span-7"
              >
                <div
                  className="group cursor-pointer"
                  onClick={onExploreRegistry}
                  onMouseEnter={() => setHoveredCardId(v.card.id)}
                  onMouseLeave={() => setHoveredCardId((cur) => (cur === v.card.id ? null : cur))}
                >
                  <div className="relative rounded-[2.5rem] overflow-hidden border border-white/20 bg-[#050505]">
                    <div className="aspect-[16/10] md:aspect-[16/9]">
                      <v.card.Art isHovered={hoveredCardId === v.card.id} />
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/25 pointer-events-none" />
                    <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8">
                      <div className="flex items-end justify-between gap-6">
                        <div className="space-y-2">
                          <div className="flex flex-col gap-2">
                            <div className="text-[10px] font-mono uppercase tracking-[0.35em] text-zinc-600">Featured Card</div>
                            <div className="flex flex-wrap items-center gap-2">
                              <div className="px-2 py-0.5 rounded text-[8px] font-mono uppercase tracking-[0.2em] bg-zinc-800 text-zinc-300 border border-zinc-700">
                                ORIGIN: The Garage
                              </div>
                              <div className="px-2 py-0.5 rounded text-[8px] font-mono uppercase tracking-[0.2em] bg-zinc-800 text-amber-500/80 border border-amber-900/50">
                                🎖 Genesis Builder
                              </div>
                            </div>
                          </div>
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
              </motion.div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
