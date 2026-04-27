import React from "react";
import { motion, useMotionValue, useTransform } from "framer-motion";
import { Link } from "react-router-dom";
import { RealQrCode } from "../components/RealQrCode";

const builderSteps = [
  { id: "01", title: "Claim", body: "Use THEGARAGE or SUPERTEAMBR to validate the sponsored Marketplace path." },
  { id: "02", title: "Scaffold", body: "Generate SKILL.md and manifest.json with origin, payout and provenance fields." },
  { id: "03", title: "Submit", body: "Open a PR under agent-cards/skills/community with your builder data filled." },
  { id: "04", title: "Route", body: "Approved skills become discoverable Agent Cards with explicit settlement terms." }
];

const traceFields = ["origin", "builder", "payout", "provenance"];

function GaragePass() {
  return (
    <div className="relative w-full max-w-[360px] mx-auto">
      <div className="absolute inset-0 translate-y-8 scale-90 border border-white/10 rounded-[2rem] opacity-40" />
      <div className="relative overflow-hidden rounded-[2rem] border border-white/15 bg-white text-black p-6 shadow-[0_30px_90px_rgba(255,255,255,0.08)]">
        <div className="flex items-center justify-between pb-5 border-b border-black/10">
          <div>
            <div className="text-[10px] font-mono uppercase tracking-[0.28em] text-black/45">Builder Pass</div>
            <div className="text-2xl font-semibold tracking-tight">MIND</div>
          </div>
          <div className="text-[10px] font-mono uppercase tracking-[0.24em] text-black/45">SP</div>
        </div>

        <div className="my-8 mx-auto max-w-[220px]">
          <RealQrCode
            path="https://mindprotocol.xyz/contribute"
            label="Open The Garage builder registration"
            className="block"
          />
          <a
            href="https://mindprotocol.xyz/contribute"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-6 flex w-full items-center justify-center rounded-xl bg-black py-3.5 text-[11px] font-bold font-mono uppercase tracking-[0.24em] text-white hover:bg-black/80 transition-colors shadow-sm"
          >
            Mint Builder Pass
          </a>
        </div>

        <div className="grid grid-cols-2 gap-3 border-t border-black/10 pt-5">
          <div>
            <div className="text-[9px] font-mono uppercase tracking-[0.24em] text-black/40">Voucher</div>
            <div className="text-sm font-mono">THEGARAGE</div>
          </div>
          <div>
            <div className="text-[9px] font-mono uppercase tracking-[0.24em] text-black/40">Subsidy</div>
            <div className="text-sm font-mono">100%</div>
          </div>
        </div>
      </div>
    </div>
  );
}

export const TheGaragePage: React.FC = () => {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotateX = useTransform(y, [-0.5, 0.5], [4, -4]);
  const rotateY = useTransform(x, [-0.5, 0.5], [-4, 4]);

  const handleMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    x.set((event.clientX - rect.left) / rect.width - 0.5);
    y.set((event.clientY - rect.top) / rect.height - 0.5);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <div className="min-h-screen overflow-hidden bg-[#050505] text-zinc-300">
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.045)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.035)_1px,transparent_1px)] bg-[size:80px_80px] opacity-25" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(16,185,129,0.12),transparent_42%),linear-gradient(180deg,rgba(255,255,255,0.04),transparent_30%)]" />

      <section className="relative container mx-auto px-6 pt-32 md:pt-36 pb-20">
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_420px] gap-12 xl:gap-20 items-start">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="space-y-9"
          >
            <div className="space-y-6">
              <div className="inline-flex border border-emerald-500/25 bg-emerald-500/5 px-4 py-1.5 text-[10px] font-mono uppercase tracking-[0.32em] text-emerald-300">
                The Garage / Superteam BR
              </div>
              <h1 className="max-w-5xl text-5xl md:text-7xl xl:text-8xl font-bold tracking-tight leading-[0.9] text-white">
                Build the intelligence layer.
              </h1>
              <p className="max-w-3xl text-lg md:text-xl text-zinc-500 leading-relaxed font-light">
                MIND builds the rails for the Agent Economy on Solana. Builders bring the skills, strategies and copilots that turn those rails into a live marketplace.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-[1fr_0.74fr] gap-4">
              <div className="border border-white/10 bg-white/[0.025] p-6 rounded-2xl">
                <h2 className="text-white text-lg font-semibold mb-3">Community alpha</h2>
                <p className="text-sm leading-relaxed text-zinc-500">
                  Choose a premium skill in the Marketplace and apply <span className="font-mono text-emerald-300">THEGARAGE</span> or <span className="font-mono text-emerald-300">SUPERTEAMBR</span>. The protocol sponsors access so builders can validate MIND before opening a PR.
                </p>
              </div>
              <div className="border border-white/10 bg-black/40 p-6 rounded-2xl">
                <h2 className="text-white text-lg font-semibold mb-3">Builder proof</h2>
                <p className="text-sm leading-relaxed text-zinc-500">
                  Every contributed skill carries origin, payout and source commit data in both MD and JSON templates.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {builderSteps.map((step) => (
                <div key={step.id} className="min-h-[160px] border border-white/10 bg-black/35 p-5 rounded-2xl">
                  <div className="text-[10px] font-mono text-zinc-600 tracking-[0.28em] mb-5">{step.id}</div>
                  <h3 className="text-white text-lg font-semibold mb-3">{step.title}</h3>
                  <p className="text-xs leading-relaxed text-zinc-500">{step.body}</p>
                </div>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <Link to="/marketplace" className="inline-flex justify-center border border-emerald-500/35 bg-emerald-500/10 px-6 py-4 text-[11px] font-mono uppercase tracking-[0.24em] text-emerald-300 hover:bg-emerald-500/20 transition-colors rounded-xl">
                Go to Marketplace
              </Link>
              <a href="https://mindprotocol.xyz/contribute" target="_blank" rel="noopener noreferrer" className="inline-flex justify-center border border-white/10 bg-white/5 px-6 py-4 text-[11px] font-mono uppercase tracking-[0.24em] text-zinc-300 hover:bg-white/10 hover:text-white transition-colors rounded-xl">
                Read Contributing
              </a>
            </div>
          </motion.div>

          <motion.aside
            style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            initial={{ opacity: 0, x: 28 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.08 }}
            className="lg:sticky lg:top-28 space-y-5"
          >
            <GaragePass />

            <div className="rounded-2xl border border-white/10 bg-black/45 p-5">
              <div className="mb-4 flex items-center justify-between gap-4">
                <span className="text-[10px] font-mono uppercase tracking-[0.28em] text-zinc-500">Trace Pack</span>
                <span className="text-[10px] font-mono uppercase tracking-[0.24em] text-emerald-400">Required</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {traceFields.map((field) => (
                  <div key={field} className="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-3 font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-400">
                    {field}
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-5">
              <div className="text-[10px] font-mono uppercase tracking-[0.28em] text-zinc-500 mb-3">Start command</div>
              <code className="block rounded-xl border border-white/10 bg-black/70 p-4 text-[10px] leading-relaxed font-mono text-emerald-300">
                <span className="block">pnpm run create-skill --</span>
                <span className="block pl-3">--name "sua-skill"</span>
                <span className="block pl-3">--builder "Seu Nome"</span>
                <span className="block pl-3">--github "seu-github"</span>
                <span className="block pl-3 break-all">--wallet "SUA_WALLET_SOLANA"</span>
              </code>
            </div>
          </motion.aside>
        </div>
      </section>
    </div>
  );
};
