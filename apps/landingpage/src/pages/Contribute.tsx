import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import {
  BuilderRegistrationCard,
  BuilderTrackOverview,
  PublicBuilderFlowCard,
  TraceFieldsCard
} from "../components/BuilderAccountFlow";
import { getBuilderRegistration, getInitialVoucherCode } from "../lib/builderAccess";

export function ContributePage() {
  const [searchParams] = useSearchParams();
  const [registration, setRegistration] = useState(() => getBuilderRegistration());
  const initialCode = getInitialVoucherCode(searchParams.get("code"));
  const nextRoute = searchParams.get("next");
  const githubAuth = {
    connected: searchParams.get("github_connected") === "1",
    login: searchParams.get("github_login") ?? "",
    id: searchParams.get("github_id") ?? "",
    avatarUrl: searchParams.get("github_avatar") ?? "",
    error: searchParams.get("github_error") ?? ""
  };

  return (
    <div className="min-h-screen bg-[#050505] text-zinc-300 pt-32 pb-24">
      <section className="container mx-auto px-6">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_0.72fr] gap-16 items-start">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
          >
            <div className="mb-10">
              <div className="inline-flex items-center rounded-full border border-white/20 bg-white/[0.03] px-4 py-1.5 text-[9px] font-mono uppercase tracking-[0.35em] text-zinc-400 shadow-inner mb-6">
                Onboarding • Builder Track
              </div>
              <h1 className="text-5xl md:text-6xl font-bold text-white tracking-tighter mb-6 leading-[0.9]">
                Build and monetize <br/><span className="text-zinc-600 italic font-light">agent skills.</span>
              </h1>
              <p className="text-zinc-400 text-base md:text-lg leading-relaxed font-light max-w-2xl">
                MIND turns your code into an Agent Card: a priced, traceable capability that other agents can discover and pay for via atomic settlement.
              </p>
            </div>
            <BuilderTrackOverview registration={registration} />
          </motion.div>

          <motion.aside
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="lg:sticky lg:top-28 space-y-5"
          >
            <BuilderRegistrationCard
              initialCode={initialCode}
              nextRoute={nextRoute}
              githubAuth={githubAuth}
              onRegistered={setRegistration}
            />
            <TraceFieldsCard />
            <PublicBuilderFlowCard />
          </motion.aside>
        </div>
      </section>
    </div>
  );
}
