import { type ComponentType, useState, useMemo } from "react";

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

  const maxIndex = Math.max(0, verticals.length - 1);
  const safeIndex = Math.max(0, Math.min(activeIndex, Math.max(0, verticals.length - 1)));
  const active = verticals[safeIndex] ?? null;

  const scrollToIndex = (idx: number) => {
    const clampedIdx = Math.max(0, Math.min(maxIndex, idx));
    setActiveIndex(clampedIdx);
  };

  const headerMeta = useMemo(() => {
    if (!active) return { vertical: "", count: "" };
    const count = String(verticals.length).padStart(2, "0");
    const current = String(safeIndex + 1).padStart(2, "0");
    return { vertical: `${current}/${count}`, count };
  }, [active, safeIndex, verticals.length]);

  return (
    <div className="relative">
      <div className="flex flex-col gap-4 md:gap-8 pb-4 md:pb-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 md:gap-8 border-b border-white/20 pb-4 md:pb-6 shrink-0">
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

        <div className="relative rounded-[2rem] md:rounded-[2.5rem] border border-white/20 bg-white/[0.02] overflow-hidden w-full">
          {active ? (
            <div className="p-4 sm:p-6 md:p-8 lg:p-6 xl:p-8 grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6 lg:gap-6 xl:gap-8">
              <div className="lg:col-span-5 space-y-3 sm:space-y-4 lg:space-y-5 flex flex-col justify-center py-3 lg:py-0">
                <div className="inline-flex w-fit items-center rounded-full border border-white/20 bg-white/[0.02] px-3 py-1 text-[8px] md:text-[9px] font-mono uppercase tracking-[0.3em] text-zinc-500">
                  Vertical {active.indexLabel} · Discovery
                </div>

                <div className="space-y-2 md:space-y-3">
                  <div className="text-2xl sm:text-3xl md:text-3xl lg:text-4xl font-bold text-white tracking-tight font-mono uppercase leading-[0.95]">
                    {active.title}
                  </div>
                  <div className="text-2xl sm:text-3xl md:text-3xl lg:text-4xl font-bold text-zinc-600 tracking-tight font-mono uppercase italic leading-[0.95]">
                    {active.subtitle}.
                  </div>
                  <p className="text-zinc-500 leading-relaxed font-light text-xs sm:text-sm md:text-base max-w-xl">
                    {active.description}
                  </p>
                </div>

                <div className="rounded-xl border border-white/[0.08] bg-black/30 p-3 space-y-2">
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-[8px] md:text-[9px] font-mono uppercase tracking-[0.28em] text-zinc-500">
                      Market Signals
                    </div>
                    <div className="text-[8px] md:text-[9px] font-mono uppercase tracking-[0.22em] text-zinc-600">
                      {active.signal?.classification_layer ?? "public_ecosystem_signal"}
                    </div>
                  </div>
                  <div className="text-[11px] md:text-xs text-zinc-400 font-light leading-relaxed">
                    {active.signal?.headline ?? "Feed indisponivel. Exibindo ultimo snapshot valido."}
                  </div>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[9px] md:text-[10px] font-mono uppercase tracking-[0.2em] text-zinc-600">
                    <span>As Of {active.signal?.published_at ?? "N/A"}</span>
                    <span>Conf {active.signal ? active.signal.confidence_score.toFixed(2) : "0.00"}</span>
                    <span>{active.signal?.claim_type ?? "company_claim"}</span>
                    {active.signal?.stale ? <span>Stale</span> : null}
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

                <div className="space-y-2 sm:space-y-3">
                  {active.stats.slice(0, 2).map((s) => (
                    <div key={s.label} className="flex items-start gap-3 rounded-xl border border-white/[0.08] bg-black/30 px-3 py-2.5">
                      <div className="mt-0.5 h-5 w-5 rounded-full border border-white/25 flex items-center justify-center text-[8px] font-mono text-zinc-400">
                        +
                      </div>
                      <div className="space-y-0.5">
                        <div className="text-[8px] md:text-[9px] font-mono uppercase tracking-[0.25em] text-zinc-400">{s.label}</div>
                        <div className="text-[11px] md:text-xs text-zinc-500 font-light">
                          {s.value} · {s.hint}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-2 md:pt-0">
                  <button
                    type="button"
                    className="bg-white text-black hover:bg-zinc-200 text-[8px] md:text-[9px] font-mono uppercase tracking-[0.25em] px-4 md:px-6 py-2 rounded-full transition-colors w-full sm:w-auto"
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
                    className="text-[8px] md:text-[9px] font-mono uppercase tracking-[0.25em] text-zinc-500 hover:text-white transition-colors px-4 md:px-6 py-2 border border-white/20 rounded-full w-full sm:w-auto text-center"
                    onClick={onExploreRegistry}
                  >
                    View on Registry
                  </button>
                </div>
              </div>

              <div className="lg:col-span-7 flex flex-col justify-center w-full py-4 lg:py-0">
                <div
                  className="group cursor-pointer w-full h-[210px] sm:h-[250px] md:h-[290px] lg:h-[300px] xl:h-[340px] 2xl:h-[380px] flex flex-col"
                  onClick={onExploreRegistry}
                  onMouseEnter={() => setHoveredCardId(active.card.id)}
                  onMouseLeave={() => setHoveredCardId((cur) => (cur === active.card.id ? null : cur))}
                >
                  <div className="relative rounded-[1.5rem] md:rounded-[2.5rem] overflow-hidden border border-white/20 bg-[#050505] flex-1 flex flex-col">
                    <div className="flex-1 relative">
                      <active.card.Art isHovered={hoveredCardId === active.card.id} />
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/25 pointer-events-none" />
                    <div className="absolute bottom-0 left-0 right-0 p-3 sm:p-4 md:p-5">
                      <div className="flex items-end justify-between gap-4 md:gap-6">
                        <div className="space-y-1 md:space-y-2">
                          <div className="text-[8px] md:text-[10px] font-mono uppercase tracking-[0.35em] text-zinc-600">Featured Card</div>
                          <div className="text-xl md:text-2xl font-mono uppercase text-white tracking-tight">{active.card.name}</div>
                          <div className="text-[8px] md:text-[10px] font-mono uppercase tracking-[0.35em] text-zinc-600">{active.card.type}</div>
                        </div>
                        <div className="text-right space-y-1 md:space-y-2">
                          <div className="text-[8px] md:text-[10px] font-mono uppercase tracking-[0.35em] text-zinc-600">Price</div>
                          <div className="text-[9px] md:text-[11px] font-mono text-zinc-300">{active.card.price}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
