import React from "react";
import { motion, useMotionValue, useTransform } from "framer-motion";
import { Link } from "react-router-dom";
import { RealQrCode } from "../components/RealQrCode";

const builderSteps = [
  { id: "01", title: "Connect", body: "Use GitHub first to prove builder identity and source ownership." },
  { id: "02", title: "Claim", body: "Use THEGARAGE, COLOSSEUM or SUPERTEAMBR to validate the sponsored Marketplace path." },
  { id: "03", title: "Submit", body: "Open a PR under agent-cards/skills/community with commit and campaign data." },
  { id: "04", title: "Settle", body: "Add wallet or delegated KMS before payout, testnet settlement or x402 execution." }
];

const traceFields = ["origin", "github", "payout", "provenance"];

function GaragePass() {
  return (
    <div className="relative w-full max-w-[360px] mx-auto">
      <div className="absolute inset-0 translate-y-8 scale-90 border border-white/10 rounded-[2rem] opacity-40 bg-black" />
      <div className="relative overflow-hidden rounded-[2rem] border border-white/20 bg-[#020202]/80 backdrop-blur-md text-white p-6 shadow-[0_30px_90px_rgba(255,255,255,0.02)] metallic-brushed-solana">
        <div className="flex items-center justify-between pb-5 border-b border-white/10">
          <div>
            <div className="text-[10px] font-mono uppercase tracking-[0.28em] text-zinc-500">Builder Pass</div>
            <div className="text-2xl font-bold tracking-tight text-white">MIND</div>
          </div>
          <div className="text-[10px] font-mono uppercase tracking-[0.24em] text-zinc-500">SP</div>
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
            className="mt-6 flex w-full items-center justify-center rounded-full border border-white/20 bg-white/[0.05] py-3.5 text-[10px] font-bold font-mono uppercase tracking-[0.24em] text-white hover:bg-white/[0.08] transition-all shadow-[0_0_15px_rgba(255,255,255,0.02)]"
          >
            Mint Builder Pass
          </a>
        </div>

        <div className="grid grid-cols-2 gap-3 border-t border-white/10 pt-5">
          <div>
            <div className="text-[9px] font-mono uppercase tracking-[0.24em] text-zinc-500">Voucher</div>
            <div className="text-sm font-mono text-zinc-300">THEGARAGE</div>
          </div>
          <div>
            <div className="text-[9px] font-mono uppercase tracking-[0.24em] text-zinc-500">Subsidy</div>
            <div className="text-sm font-mono text-zinc-300">100%</div>
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
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(255,255,255,0.05),transparent_42%),linear-gradient(180deg,rgba(255,255,255,0.02),transparent_30%)]" />

      <section className="relative container mx-auto px-6 pt-32 md:pt-36 pb-20">
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_420px] gap-12 xl:gap-20 items-start">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="space-y-9"
          >
            <div className="space-y-6">
              <div className="inline-flex items-center gap-3 border border-white/20 bg-gradient-to-r from-white/5 to-[#14F195]/5 px-4 py-1.5 text-[10px] font-mono uppercase tracking-[0.32em] text-zinc-300 rounded-full backdrop-blur-sm shadow-[0_0_15px_rgba(20,241,149,0.02)]">
                <span className="w-1.5 h-1.5 rounded-full bg-gradient-to-r from-[#10B981] to-[#6366F1] shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                The Garage / Superteam BR
              </div>
              <h1 className="max-w-5xl text-5xl md:text-7xl xl:text-8xl font-bold tracking-tight leading-[0.9] text-white">
                Build the <span className="text-transparent bg-clip-text bg-gradient-to-r from-zinc-300 via-zinc-500 to-[#10B981]">intelligence layer.</span>
              </h1>
              <p className="max-w-3xl text-lg md:text-xl text-zinc-500 leading-relaxed font-light">
                MIND starts with GitHub-native builder onboarding, then adds wallet/KMS only when settlement is required.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-[1fr_0.74fr] gap-4">
              <div className="metallic-brushed-solana border border-white/20 bg-[#020202]/80 backdrop-blur-md p-8 rounded-[2rem] shadow-inner">
                <h2 className="text-white text-lg font-semibold mb-3 tracking-tight">Community alpha</h2>
                <p className="text-sm leading-relaxed text-zinc-400 font-light">
                  Choose a premium skill in the Marketplace and apply <span className="font-mono text-white">THEGARAGE</span>, <span className="font-mono text-white">COLOSSEUM</span> or <span className="font-mono text-white">SUPERTEAMBR</span>. The protocol sponsors access so builders can validate MIND before opening a PR.
                </p>
              </div>
              <div className="metallic-brushed-solana border border-white/20 bg-[#020202]/80 backdrop-blur-md p-8 rounded-[2rem] shadow-inner">
                <h2 className="text-white text-lg font-semibold mb-3 tracking-tight">Builder proof</h2>
                <p className="text-sm leading-relaxed text-zinc-400 font-light">
                  Every contributed skill carries GitHub, origin, payout status and source commit data in both MD and JSON templates.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {builderSteps.map((step) => (
                <div key={step.id} className="min-h-[160px] metallic-brushed-solana border border-white/20 bg-[#020202]/80 backdrop-blur-md p-6 rounded-[1.5rem] shadow-inner">
                  <div className="text-[10px] font-mono text-zinc-500 tracking-[0.28em] mb-5">{step.id}</div>
                  <h3 className="text-white text-lg font-semibold mb-3 tracking-tight">{step.title}</h3>
                  <p className="text-xs leading-relaxed text-zinc-400 font-light">{step.body}</p>
                </div>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row gap-4 pt-2">
              <Link to="/marketplace" className="inline-flex justify-center rounded-full border border-white/20 bg-white/[0.02] px-8 py-4 text-[10px] font-bold font-mono uppercase tracking-[0.24em] text-white transition-all hover:bg-white/[0.05] shadow-[0_0_15px_rgba(255,255,255,0.02)] hover:shadow-[0_0_25px_rgba(255,255,255,0.05)]">
                Go to Marketplace
              </Link>
              <a href="https://mindprotocol.xyz/contribute" target="_blank" rel="noopener noreferrer" className="inline-flex justify-center rounded-full border border-white/10 bg-transparent px-8 py-4 text-[10px] font-bold font-mono uppercase tracking-[0.24em] text-zinc-400 hover:text-white hover:border-white/30 transition-all">
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

            <div className="metallic-brushed-solana border border-white/20 bg-[#020202]/80 backdrop-blur-md p-6 rounded-[2rem] shadow-inner">
              <div className="mb-4 flex items-center justify-between gap-4">
                <span className="text-[10px] font-mono uppercase tracking-[0.28em] text-zinc-500">Trace Pack</span>
                <span className="text-[10px] font-mono uppercase tracking-[0.24em] text-white">Required</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {traceFields.map((field) => (
                  <div key={field} className="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-3 font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-400">
                    {field}
                  </div>
                ))}
              </div>
            </div>

            <div className="metallic-brushed-solana border border-white/20 bg-[#020202]/80 backdrop-blur-md p-6 rounded-[2rem] shadow-inner">
              <div className="text-[10px] font-mono uppercase tracking-[0.28em] text-zinc-500 mb-3">Start command</div>
              <code className="block rounded-xl border border-white/10 bg-black/80 p-4 text-[10px] leading-relaxed font-mono text-zinc-300 shadow-inner">
                <span className="block">pnpm run create-skill --</span>
                <span className="block pl-3">--name "sua-skill"</span>
                <span className="block pl-3">--builder "Seu Nome"</span>
                <span className="block pl-3">--github "seu-github"</span>
                <span className="block pl-3 break-all">--wallet "WALLET_PENDING_AFTER_GITHUB_REVIEW"</span>
              </code>
              <p className="mt-3 text-[10px] leading-relaxed text-zinc-600">
                Replace the wallet placeholder before payout, Solana testnet settlement or x402 execution.
              </p>
            </div>
          </motion.aside>
        </div>
      </section>
    </div>
  );
};
