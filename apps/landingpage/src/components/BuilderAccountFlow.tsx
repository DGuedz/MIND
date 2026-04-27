import { useMemo, useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  BUILDER_TRACK_STEPS,
  REQUIRED_TRACE_FIELDS,
  buildMarketplaceClaimPath,
  buildGithubOAuthStartPath,
  buildSkillScaffoldCommand,
  getBuilderRegistration,
  getInitialVoucherCode,
  isLikelySolanaWallet,
  isValidVoucherCode,
  normalizeGithubHandle,
  normalizeVoucherCode,
  saveBuilderRegistration,
  toBuilderAccount
} from "../lib/builderAccess";
import type { BuilderRegistration } from "../lib/builderAccess";

type BuilderRegistrationCardProps = {
  initialCode: string;
  nextRoute: string | null;
  githubAuth: {
    connected: boolean;
    login: string;
    id: string;
    avatarUrl: string;
    error: string;
  };
  onRegistered: (registration: BuilderRegistration) => void;
};

function GithubMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className} fill="currentColor">
      <path d="M12 1.5C6.2 1.5 1.5 6.2 1.5 12c0 4.65 3.02 8.6 7.2 9.99.52.1.72-.23.72-.5v-1.84c-2.93.64-3.55-1.25-3.55-1.25-.48-1.22-1.17-1.55-1.17-1.55-.96-.66.07-.65.07-.65 1.06.07 1.62 1.09 1.62 1.09.94 1.61 2.47 1.14 3.07.87.1-.68.37-1.14.67-1.4-2.34-.27-4.8-1.17-4.8-5.2 0-1.15.41-2.09 1.09-2.82-.11-.27-.47-1.34.1-2.79 0 0 .89-.28 2.9 1.08A10.07 10.07 0 0 1 12 6.68c.9 0 1.78.12 2.62.35 2.01-1.36 2.9-1.08 2.9-1.08.57 1.45.21 2.52.1 2.79.68.73 1.09 1.67 1.09 2.82 0 4.04-2.46 4.93-4.8 5.19.38.33.72.97.72 1.96v2.78c0 .28.19.61.73.5A10.51 10.51 0 0 0 22.5 12C22.5 6.2 17.8 1.5 12 1.5Z" />
    </svg>
  );
}

export function BuilderTrackOverview({ registration }: { registration: BuilderRegistration | null }) {
  const scaffoldCommand = registration
    ? toBuilderAccount(registration).scaffoldCommand
    : buildSkillScaffoldCommand();

  return (
    <div className="space-y-10">
      <div className="space-y-6">
        <div className="inline-flex border border-white/10 px-4 py-1 text-[10px] font-mono uppercase tracking-[0.32em] text-zinc-500">
          Builder Track • Initial Traction
        </div>
        <h1 className="max-w-4xl text-5xl md:text-7xl font-bold tracking-tight leading-[0.95] text-white">
          Contribute to MIND.
        </h1>
        <p className="max-w-3xl text-lg md:text-xl text-zinc-500 leading-relaxed font-light">
          MIND does not ask builders to ship another closed bot. Builders contribute reusable skills as Agent Cards: priced, traceable, policy-aware assets that other agents can discover and pay for.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {BUILDER_TRACK_STEPS.map((step) => (
          <div key={step.id} className="border border-white/10 bg-white/[0.025] p-6 rounded-xl">
            <div className="text-[10px] font-mono text-zinc-600 tracking-[0.28em] mb-5">{step.id}</div>
            <h2 className="text-xl font-semibold text-white mb-3">{step.title}</h2>
            <p className="text-sm text-zinc-500 leading-relaxed">{step.body}</p>
          </div>
        ))}
      </div>

      <div className="border border-emerald-500/20 bg-emerald-500/[0.03] rounded-2xl p-6 md:p-8">
        <h2 className="text-2xl font-semibold text-white mb-4">The command that starts the track</h2>
        <code className="block rounded-xl border border-white/10 bg-black/70 p-4 text-xs md:text-sm font-mono text-emerald-300 leading-relaxed break-all">
          {scaffoldCommand}
        </code>
        <p className="mt-4 text-sm text-zinc-500 leading-relaxed">
          The scaffold writes the origin and payout fields into both templates so reviewers can verify The Garage provenance and builder receiving data before a skill is accepted.
        </p>
      </div>
    </div>
  );
}

export function BuilderRegistrationCard({ initialCode, nextRoute, githubAuth, onRegistered }: BuilderRegistrationCardProps) {
  const navigate = useNavigate();
  const initialRegistration = getBuilderRegistration();
  const [registration, setRegistration] = useState(initialRegistration);
  const githubHandle = initialRegistration?.githubHandle ?? githubAuth.login;
  const githubConnected = Boolean(initialRegistration?.githubHandle || githubAuth.connected);
  const [githubUserId] = useState(initialRegistration?.githubUserId ?? githubAuth.id);
  const [githubAvatarUrl] = useState(initialRegistration?.githubAvatarUrl ?? githubAuth.avatarUrl);
  const [githubConnectedAt] = useState(initialRegistration?.githubConnectedAt ?? (githubAuth.connected ? new Date().toISOString() : ""));
  const [solanaReceiveWallet, setSolanaReceiveWallet] = useState(initialRegistration?.solanaReceiveWallet ?? "");
  const [referralCode, setReferralCode] = useState<string>(
    initialRegistration?.referralCode ?? getInitialVoucherCode(initialCode)
  );
  const [consentMarketplaceAttribution, setConsentMarketplaceAttribution] = useState(
    initialRegistration?.consentMarketplaceAttribution ?? true
  );
  const [formMessage, setFormMessage] = useState<string | null>(null);

  const normalizedGithubHandle = normalizeGithubHandle(githubHandle);
  const normalizedReferralCode = normalizeVoucherCode(referralCode);
  const account = registration ? toBuilderAccount(registration) : null;
  const canRegister = useMemo(() => {
    return Boolean(
      githubConnected &&
      normalizedGithubHandle &&
      isLikelySolanaWallet(solanaReceiveWallet) &&
      isValidVoucherCode(normalizedReferralCode) &&
      consentMarketplaceAttribution
    );
  }, [consentMarketplaceAttribution, githubConnected, normalizedGithubHandle, normalizedReferralCode, solanaReceiveWallet]);

  const handleConnectGithub = () => {
    window.location.href = buildGithubOAuthStartPath(referralCode, nextRoute || "marketplace");
  };

  const handleRegister = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    try {
      const nextRegistration = saveBuilderRegistration({
        githubHandle,
        githubUserId,
        githubAvatarUrl,
        githubConnectedAt,
        solanaReceiveWallet,
        referralCode,
        consentMarketplaceAttribution
      });
      setRegistration(nextRegistration);
      onRegistered(nextRegistration);
      setFormMessage("Builder registration saved. Voucher claim is now eligible in the Marketplace.");
      if (nextRoute === "marketplace") {
        navigate(buildMarketplaceClaimPath(nextRegistration.referralCode));
      }
    } catch (error) {
      const code = error instanceof Error ? error.message : "REGISTRATION_FAILED";
      const messages: Record<string, string> = {
        INVALID_VOUCHER_CODE: "Use THEGARAGE, SUPERTEAMBR or COLOSSEUM.",
        MISSING_GITHUB_HANDLE: "GitHub handle is required.",
        INVALID_SOLANA_WALLET: "Enter a valid Solana receive wallet.",
        MISSING_MARKETPLACE_CONSENT: "Marketplace attribution consent is required.",
        REGISTRATION_FAILED: "Registration failed. Check the fields and try again."
      };
      setFormMessage(messages[code] ?? messages.REGISTRATION_FAILED);
    }
  };

  return (
    <form onSubmit={handleRegister} className="border border-emerald-500/20 rounded-2xl bg-emerald-500/[0.035] p-6 space-y-5">
      {!account ? (
        <div>
          <div className="text-[10px] font-mono uppercase tracking-[0.28em] text-emerald-400 mb-3">
            Builder Account • Initial Traction
          </div>
          <h2 className="text-white text-lg font-semibold">Connect GitHub first</h2>
          <p className="mt-2 text-sm text-zinc-500 leading-relaxed">
            Connect your GitHub to unlock real builder access during MIND's initial traction period. This establishes your verified identity for PR provenance and ecosystem rewards.
          </p>
        </div>
      ) : (
        <div>
          <div className="text-[10px] font-mono uppercase tracking-[0.28em] text-emerald-400 mb-3">
            Access Unlocked
          </div>
          <h2 className="text-white text-lg font-semibold">Initial Traction Period</h2>
          <p className="mt-2 text-sm text-emerald-400/80 leading-relaxed">
            Your connection is established. You are now authorized to build, claim vouchers, and receive payouts during the MIND initial traction phase.
          </p>
        </div>
      )}

      {!account ? (
        <div className="space-y-3">
          <div className="rounded-2xl border border-white/10 bg-black/30 p-4 space-y-3">
            {githubConnected ? (
              <div className="flex items-center gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3">
                {githubAvatarUrl ? (
                  <img src={githubAvatarUrl} alt="" className="h-10 w-10 rounded-full border border-white/10" />
                ) : (
                  <div className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-black text-zinc-400">
                    <GithubMark className="h-5 w-5" />
                  </div>
                )}
                <div className="min-w-0">
                  <div className="truncate text-sm font-semibold text-white">@{normalizedGithubHandle}</div>
                  <div className="font-mono text-[9px] uppercase tracking-[0.2em] text-emerald-400">GitHub verified</div>
                </div>
              </div>
            ) : null}

            <button
              type="button"
              onClick={handleConnectGithub}
              className={`inline-flex w-full items-center justify-center gap-3 rounded-xl border px-4 py-3 text-[11px] font-bold font-mono uppercase tracking-[0.22em] transition-colors ${
                githubConnected
                  ? "border-emerald-500/40 bg-emerald-500/15 text-emerald-300"
                  : "border-transparent bg-zinc-300 text-black hover:bg-zinc-400"
              }`}
            >
              <GithubMark className="h-4 w-4" />
              {githubConnected ? "Reconnect GitHub" : "Connect GitHub"}
            </button>
            {githubAuth.error ? (
              <div className="rounded-xl border border-zinc-500/30 bg-zinc-400/10 px-4 py-3 text-xs leading-relaxed text-zinc-300">
                GitHub OAuth is not available yet. Configure `GITHUB_OAUTH_CLIENT_ID` and `GITHUB_OAUTH_CLIENT_SECRET` in Vercel to unlock real builder connection.
              </div>
            ) : null}
          </div>

          {githubConnected ? (
            <>
              <label className="block">
                <span className="block text-[9px] font-mono uppercase tracking-[0.24em] text-zinc-500 mb-2">Solana receive wallet</span>
                <input
                  value={solanaReceiveWallet}
                  onChange={(event) => setSolanaReceiveWallet(event.target.value)}
                  placeholder="Base58 wallet address"
                  className="w-full rounded-xl border border-white/10 bg-black/50 px-4 py-3 text-sm text-white outline-none focus:border-emerald-500/40"
                />
              </label>
              <label className="block">
                <span className="block text-[9px] font-mono uppercase tracking-[0.24em] text-zinc-500 mb-2">Campaign code</span>
                <select
                  value={referralCode}
                  onChange={(event) => setReferralCode(event.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-black/50 px-4 py-3 text-sm text-white outline-none focus:border-emerald-500/40"
                >
                  <option value="THEGARAGE">THEGARAGE</option>
                  <option value="SUPERTEAMBR">SUPERTEAMBR</option>
                  <option value="COLOSSEUM">COLOSSEUM</option>
                </select>
              </label>
              <label className="flex items-start gap-3 rounded-xl border border-white/10 bg-black/30 p-3">
                <input
                  type="checkbox"
                  checked={consentMarketplaceAttribution}
                  onChange={(event) => setConsentMarketplaceAttribution(event.target.checked)}
                  className="mt-1"
                />
                <span className="text-xs text-zinc-500 leading-relaxed">
                  Allow MIND to show builder attribution, campaign origin and payout metadata during review and marketplace listing.
                </span>
              </label>
            </>
          ) : null}

          <button
            type="submit"
            disabled={!githubConnected || !canRegister}
            className="w-full rounded-xl border border-emerald-500/40 bg-emerald-500/15 px-4 py-3 text-[11px] font-mono uppercase tracking-[0.24em] text-emerald-300 transition-colors hover:bg-emerald-500/25 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Save Registration
          </button>

          {formMessage ? (
            <div className={`rounded-xl border px-4 py-3 text-xs leading-relaxed ${registration ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-300" : "border-white/10 bg-black/30 text-zinc-400"}`}>
              {formMessage}
            </div>
          ) : null}
        </div>
      ) : null}

      {account ? (
        <div className="rounded-xl border border-white/10 bg-black/40 p-4 font-mono text-[10px] text-zinc-500 space-y-2">
          <div className="text-emerald-400 uppercase tracking-[0.2em]">Account Registered</div>
          <div>@{account.githubHandle}</div>
          <div>{account.referralCode}</div>
          <div>{account.registrationStatus}</div>
          <div className="break-all">{account.solanaReceiveWallet}</div>
        </div>
      ) : null}

      {account ? (
        <Link
          to={account.marketplaceClaimPath}
          className="block rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-center text-[11px] font-mono uppercase tracking-[0.24em] text-zinc-300 transition-colors hover:bg-white/10 hover:text-white"
        >
          Continue to Marketplace
        </Link>
      ) : null}
    </form>
  );
}

export function TraceFieldsCard() {
  return (
    <div className="border border-white/10 rounded-2xl bg-black/40 p-6">
      <h2 className="text-white text-lg font-semibold mb-4">Required Trace Fields</h2>
      <div className="space-y-2">
        {REQUIRED_TRACE_FIELDS.map((field) => (
          <div key={field} className="flex items-center justify-between gap-4 border-b border-white/5 py-2">
            <span className="font-mono text-[11px] text-zinc-400">{field}</span>
            <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-emerald-400">required</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function PublicBuilderFlowCard() {
  return (
    <div className="border border-white/10 rounded-2xl bg-white/[0.025] p-6 space-y-4">
      <h2 className="text-white text-lg font-semibold">Public Builder Flow</h2>
      <p className="text-sm text-zinc-500 leading-relaxed">
        Community members validate MIND by claiming a sponsored skill, creating their own skill, and submitting a PR that can be audited back to The Garage.
      </p>
      <div className="grid grid-cols-1 gap-3 pt-2">
        <Link to="/the-garage" className="block rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-center text-[11px] font-mono uppercase tracking-[0.24em] text-emerald-300 hover:bg-emerald-500/20 transition-colors">
          The Garage
        </Link>
        <Link to="/marketplace" className="block rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-center text-[11px] font-mono uppercase tracking-[0.24em] text-zinc-300 hover:bg-white/10 transition-colors">
          Marketplace
        </Link>
        <a href="https://github.com/DGuedz/MIND/blob/main/CONTRIBUTING.md" target="_blank" rel="noreferrer" className="block rounded-xl border border-white/10 bg-black/50 px-4 py-3 text-center text-[11px] font-mono uppercase tracking-[0.24em] text-zinc-400 hover:text-white hover:bg-white/5 transition-colors">
          Contributing.md
        </a>
      </div>
    </div>
  );
}
