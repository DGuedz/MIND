export const BUILDER_REGISTRATION_STORAGE_KEY = "mind.builderRegistration.v1";
export const VOUCHER_CLAIMS_STORAGE_KEY = "mind.voucherClaims.v1";

export const VALID_VOUCHER_CODES = ["THEGARAGE", "SUPERTEAMBR", "COLOSSEUM"] as const;
export const DEFAULT_VOUCHER_CODE = "THEGARAGE";

export const BUILDER_TRACK_STEPS = [
  {
    id: "01",
    title: "Connect GitHub",
    body: "Start with builder identity. GitHub is your builder identity and your storage layer."
  },
  {
    id: "02",
    title: "Create Skill",
    body: "Generate a SKILL.md. This creates a monetizable unit (Agent Card), not just code."
  },
  {
    id: "03",
    title: "Open PR",
    body: "Submit the skill under agent-cards/skills/community. Your PR is your listing request."
  },
  {
    id: "04",
    title: "Get Listed",
    body: "Approved skills become revenue-generating assets in the MIND Marketplace with explicit pricing."
  }
] as const;

export const REQUIRED_TRACE_FIELDS = [
  "origin.campaign",
  "origin.sourceEvent",
  "builder.github",
  "builder.solanaReceiveAddress.beforePayout",
  "payout.recipientAddress.beforeSettlement",
  "provenance.sourceCommit",
  "provenance.pullRequestUrl"
] as const;

export type VoucherCode = (typeof VALID_VOUCHER_CODES)[number];

export type BuilderRegistration = {
  id: string;
  githubHandle: string;
  githubUserId?: string;
  githubAvatarUrl?: string;
  githubConnectedAt?: string;
  solanaReceiveWallet: string;
  campaignSource: "THE_GARAGE_SP";
  referralCode: VoucherCode;
  status: "registered" | "verified" | "blocked";
  consentMarketplaceAttribution: boolean;
  createdAt: string;
};

export type BuilderRegistrationDraft = {
  githubHandle: string;
  githubUserId?: string;
  githubAvatarUrl?: string;
  githubConnectedAt?: string;
  solanaReceiveWallet: string;
  referralCode: string;
  consentMarketplaceAttribution: boolean;
};

export type VoucherClaim = {
  id: string;
  builderRegistrationId: string;
  githubHandle: string;
  voucherCode: VoucherCode;
  marketplaceItemId: string;
  claimStatus: "claimed" | "rejected" | "revoked";
  claimReason: string;
  createdAt: string;
};

export type BuilderAccount = {
  accountId: string;
  githubHandle: string;
  githubUserId?: string;
  githubAvatarUrl?: string;
  solanaReceiveWallet: string;
  campaignSource: "THE_GARAGE_SP";
  referralCode: VoucherCode;
  registrationStatus: BuilderRegistration["status"];
  scaffoldCommand: string;
  marketplaceClaimPath: string;
  contributionPath: string;
};

const BASE58_RE = /^[1-9A-HJ-NP-Za-km-z]+$/;

export function normalizeVoucherCode(code: string) {
  return code.trim().toUpperCase();
}

export function isValidVoucherCode(code: string): code is VoucherCode {
  return VALID_VOUCHER_CODES.includes(normalizeVoucherCode(code) as VoucherCode);
}

export function getInitialVoucherCode(code: string | null | undefined): VoucherCode {
  const normalized = normalizeVoucherCode(code ?? "");
  return isValidVoucherCode(normalized) ? normalized : DEFAULT_VOUCHER_CODE;
}

export function normalizeGithubHandle(handle: string) {
  return handle.trim().replace(/^@+/, "");
}

export function isLikelySolanaWallet(wallet: string) {
  const value = wallet.trim();
  return value.length >= 32 && value.length <= 44 && BASE58_RE.test(value);
}

export function buildMarketplaceClaimPath(code: string) {
  return `/marketplace?voucher=${getInitialVoucherCode(code)}&claim=1`;
}

export function buildContributionPath(code: string = DEFAULT_VOUCHER_CODE) {
  return `/contribute?code=${getInitialVoucherCode(code)}&next=marketplace`;
}

export function buildGithubOAuthStartPath(code: string, next: string | null | undefined = "marketplace") {
  return `/api/github/oauth/start?code=${getInitialVoucherCode(code)}&next=${encodeURIComponent(next || "marketplace")}`;
}

export function buildGithubOAuthStartPathForSurface(
  code: string,
  next: string | null | undefined = "marketplace",
  returnTo: "contribute" | "register" = "contribute"
) {
  return `/api/github/oauth/start?code=${getInitialVoucherCode(code)}&next=${encodeURIComponent(next || "marketplace")}&return_to=${returnTo}`;
}

export function buildSkillScaffoldCommand(params?: {
  githubHandle?: string;
  solanaReceiveWallet?: string;
  skillName?: string;
}) {
  const githubHandle = normalizeGithubHandle(params?.githubHandle ?? "");
  const wallet = params?.solanaReceiveWallet?.trim() || "WALLET_PENDING_AFTER_GITHUB_REVIEW";
  const skillName = params?.skillName?.trim() || "sua-skill";
  const builder = githubHandle || "Seu Nome";
  const github = githubHandle || "seu-github";

  return `pnpm run create-skill -- --name "${skillName}" --builder "${builder}" --github "${github}" --wallet "${wallet}"`;
}

export function toBuilderAccount(registration: BuilderRegistration): BuilderAccount {
  return {
    accountId: registration.id,
    githubHandle: registration.githubHandle,
    githubUserId: registration.githubUserId,
    githubAvatarUrl: registration.githubAvatarUrl,
    solanaReceiveWallet: registration.solanaReceiveWallet,
    campaignSource: registration.campaignSource,
    referralCode: registration.referralCode,
    registrationStatus: registration.status,
    scaffoldCommand: buildSkillScaffoldCommand({
      githubHandle: registration.githubHandle,
      solanaReceiveWallet: registration.solanaReceiveWallet
    }),
    marketplaceClaimPath: buildMarketplaceClaimPath(registration.referralCode),
    contributionPath: buildContributionPath(registration.referralCode)
  };
}

export function getBuilderRegistration(): BuilderRegistration | null {
  if (typeof window === "undefined") return null;

  const raw = window.localStorage.getItem(BUILDER_REGISTRATION_STORAGE_KEY);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as BuilderRegistration;
    if (!parsed.githubHandle || !isValidVoucherCode(parsed.referralCode)) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function saveBuilderRegistration(draft: BuilderRegistrationDraft): BuilderRegistration {
  const referralCode = normalizeVoucherCode(draft.referralCode);

  if (!isValidVoucherCode(referralCode)) {
    throw new Error("INVALID_VOUCHER_CODE");
  }

  const githubHandle = normalizeGithubHandle(draft.githubHandle);
  const solanaReceiveWallet = draft.solanaReceiveWallet.trim();

  if (!githubHandle) {
    throw new Error("MISSING_GITHUB_HANDLE");
  }

  if (solanaReceiveWallet && !isLikelySolanaWallet(solanaReceiveWallet)) {
    throw new Error("INVALID_SOLANA_WALLET");
  }

  if (!draft.consentMarketplaceAttribution) {
    throw new Error("MISSING_MARKETPLACE_CONSENT");
  }

  const registration: BuilderRegistration = {
    id: `builder_${githubHandle.toLowerCase()}_${Date.now()}`,
    githubHandle,
    githubUserId: draft.githubUserId,
    githubAvatarUrl: draft.githubAvatarUrl,
    githubConnectedAt: draft.githubConnectedAt,
    solanaReceiveWallet,
    campaignSource: "THE_GARAGE_SP",
    referralCode,
    status: "registered",
    consentMarketplaceAttribution: true,
    createdAt: new Date().toISOString()
  };

  window.localStorage.setItem(BUILDER_REGISTRATION_STORAGE_KEY, JSON.stringify(registration));
  window.dispatchEvent(new CustomEvent("mind:builder-registration", { detail: registration }));

  return registration;
}

export function getVoucherEligibility(registration: BuilderRegistration | null, voucherCode: string) {
  const normalizedCode = normalizeVoucherCode(voucherCode);

  if (!isValidVoucherCode(normalizedCode)) {
    return { eligible: false, reason: "Invalid or expired code" };
  }

  if (!registration) {
    return { eligible: false, reason: "Connect GitHub before claiming" };
  }

  if (registration.status === "blocked") {
    return { eligible: false, reason: "Builder registration is blocked" };
  }

  if (!registration.consentMarketplaceAttribution) {
    return { eligible: false, reason: "Marketplace attribution consent is required" };
  }

  if (!registration.githubHandle) {
    return { eligible: false, reason: "Builder registration is incomplete" };
  }

  if (registration.referralCode !== normalizedCode) {
    return { eligible: false, reason: `Use the registered campaign code: ${registration.referralCode}` };
  }

  const walletNote = isLikelySolanaWallet(registration.solanaReceiveWallet)
    ? "Wallet ready for settlement"
    : "Wallet/KMS required before payout or x402 execution";

  return { eligible: true, reason: `Eligible builder: @${registration.githubHandle}. ${walletNote}` };
}

export function getVoucherClaims(): VoucherClaim[] {
  if (typeof window === "undefined") return [];

  const raw = window.localStorage.getItem(VOUCHER_CLAIMS_STORAGE_KEY);
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw) as VoucherClaim[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveVoucherClaim(params: {
  registration: BuilderRegistration;
  voucherCode: string;
  marketplaceItemId: string;
  claimReason: string;
}) {
  const normalizedCode = normalizeVoucherCode(params.voucherCode);
  if (!isValidVoucherCode(normalizedCode)) {
    throw new Error("INVALID_VOUCHER_CODE");
  }

  const claims = getVoucherClaims();
  const claim: VoucherClaim = {
    id: `claim_${params.registration.githubHandle.toLowerCase()}_${params.marketplaceItemId}_${Date.now()}`,
    builderRegistrationId: params.registration.id,
    githubHandle: params.registration.githubHandle,
    voucherCode: normalizedCode,
    marketplaceItemId: params.marketplaceItemId,
    claimStatus: "claimed",
    claimReason: params.claimReason,
    createdAt: new Date().toISOString()
  };

  window.localStorage.setItem(VOUCHER_CLAIMS_STORAGE_KEY, JSON.stringify([...claims, claim]));
  window.dispatchEvent(new CustomEvent("mind:voucher-claim", { detail: claim }));

  return claim;
}
