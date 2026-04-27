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
