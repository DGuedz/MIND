#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";

const args = process.argv.slice(2);
const nameArgIndex = args.findIndex((arg) => arg === "--name" || arg === "-n");
const rawName = nameArgIndex >= 0 ? args[nameArgIndex + 1] : args[0];

const getArg = (longName, fallback = "") => {
  const index = args.findIndex((arg) => arg === longName);
  return index >= 0 ? args[index + 1] || fallback : fallback;
};

if (!rawName) {
  console.error('Usage: pnpm run create-skill -- --name "sua-skill"');
  process.exit(1);
}

const slug = rawName
  .trim()
  .toLowerCase()
  .normalize("NFD")
  .replace(/[\u0300-\u036f]/g, "")
  .replace(/[^a-z0-9]+/g, "-")
  .replace(/^-+|-+$/g, "");

if (!slug) {
  console.error("Invalid skill name.");
  process.exit(1);
}

const root = process.cwd();
const skillDir = path.join(root, "agent-cards", "skills", "community", slug);
const sourceCommit = (() => {
  try {
    return execSync("git rev-parse HEAD", { cwd: root, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim();
  } catch {
    return "TODO_FILL_BASE_COMMIT";
  }
})();

if (fs.existsSync(skillDir)) {
  console.error(`Skill already exists: ${path.relative(root, skillDir)}`);
  process.exit(1);
}

fs.mkdirSync(skillDir, { recursive: true });

const title = rawName.trim();
const builderGithub = getArg("--github");
const builderWallet = getArg("--wallet");
const builderDisplayName = getArg("--builder", title);

if (!builderGithub || !builderWallet) {
  console.error('Usage: pnpm run create-skill -- --name "sua-skill" --github "seu-github" --wallet "SUA_WALLET_SOLANA"');
  console.error("Missing required builder trace data: --github and --wallet.");
  process.exit(1);
}
const manifest = {
  name: slug,
  displayName: title,
  description: "Community-submitted MIND skill. Replace this with the concrete service value.",
  category: "community",
  origin: {
    campaign: "the_garage_frontier_sp",
    community: "superteam_br",
    sourceEvent: "the_garage_solana_house_sp",
    referralCodes: ["THEGARAGE", "SUPERTEAMBR"]
  },
  builder: {
    displayName: builderDisplayName,
    github: builderGithub,
    contact: "TODO_EMAIL_OR_TELEGRAM",
    solanaReceiveAddress: builderWallet
  },
  payout: {
    currency: "USDC",
    chain: "solana",
    recipientAddress: builderWallet,
    providerShareBps: 9200,
    protocolShareBps: 800
  },
  provenance: {
    sourceRepository: "https://github.com/DGuedz/MIND",
    sourceCommit,
    pullRequestUrl: "TODO_PR_URL",
    submittedAt: "TODO_ISO_8601",
    attestation: "I confirm this skill was submitted through the The Garage / Superteam BR builder flow."
  },
  pricing: {
    model: "community_free",
    currency: "USDC",
    price: 0,
    originalModel: "per_request",
    originalPrice: 0.01,
    sponsoredBy: "MIND Protocol",
    phase: "the_garage_community",
    eligibleVoucherCodes: ["THEGARAGE", "SUPERTEAMBR", "COLOSSEUM"],
    settlementRequired: false
  },
  lifecycle: {
    currentPhase: "the_garage_community",
    nextPhase: "open_interest",
    x402RealSettlementEnabled: false,
    activationGates: [
      "minimum_builder_supply_reached",
      "community_flows_tested",
      "policy_check_passed",
      "kms_wallet_ready",
      "x402_payment_verified",
      "proof_bundle_verified"
    ]
  },
  validation: {
    policy: {
      requiredChecks: [
        "hash_integrity",
        "builder_identity",
        "payout_wallet_present",
        "policy_gate",
        "voucher_or_x402_reference",
        "proof_bundle"
      ],
      decisionContract: "governance/spec_runtime/x402_phase_contract.json"
    },
    proof: {
      requiredArtifacts: [
        "manifest_json_hash",
        "skill_md_hash",
        "builder_github",
        "payout_wallet",
        "voucher_receipt_or_x402_tx",
        "policy_decision"
      ]
    }
  },
  cnftPreset: {
    standard: "Metaplex Core",
    mintPhase: "open_interest",
    currentPhaseDelivery: "metadata_preset_only",
    attributes: [
      { key: "MIND Phase", value: "the_garage_community" },
      { key: "Next Phase", value: "open_interest" },
      { key: "x402 Real Settlement", value: "disabled_until_open_interest" },
      { key: "Validation Contract", value: "mind_x402_phase_contract_v1" },
      { key: "Builder GitHub", value: builderGithub },
      { key: "Payout Wallet", value: builderWallet }
    ]
  },
  traction: {
    objective: "community_builder_engagement",
    phase: "the_garage_community",
    successMetrics: ["builder_registration", "voucher_claim", "skill_pr_opened"],
    paidConversion: "post_traction_only"
  },
  campaign: "the_garage_frontier_sp",
  entrypoint: "SKILL.md",
  tags: ["mind", "community", "the-garage"]
};

const skillMd = `---
name: ${slug}
description: Community-submitted MIND skill.
origin_campaign: the_garage_frontier_sp
origin_event: the_garage_solana_house_sp
builder_github: ${builderGithub}
builder_solana_receive_address: ${builderWallet}
source_commit: ${sourceCommit}
---

# ${title}

## Builder And Payout

- Builder name: ${builderDisplayName}
- GitHub handle: ${builderGithub}
- Solana receive address: ${builderWallet}
- Revenue split: 92% builder / 8% MIND protocol
- Origin: The Garage / Superteam BR
- Base commit: ${sourceCommit}

## What It Does

Describe the task this skill performs for another agent or builder.

## Inputs

- Define required inputs.

## Outputs

- Define the returned artifact, command, analysis, or transaction plan.

## Safety

- Do not request secrets.
- Do not execute financial actions without explicit policy checks.
- Return INSUFFICIENT_EVIDENCE when required data is missing.

## Validation Preset

- Current phase: the_garage_community.
- Real x402 settlement: disabled until open_interest.
- Required checks: hash_integrity, builder_identity, payout_wallet_present, policy_gate, voucher_or_x402_reference, proof_bundle.
- Decision contract: governance/spec_runtime/x402_phase_contract.json.
- cNFT preset: Metaplex Core attributes are defined in manifest.json before minting is enabled.

## Open Interest Readiness

- x402 real settlement opens only after builder supply exists and community flows are tested.
- Required evidence before paid execution: confirmed_tx_hash, payment_reference, policy_decision, receipt_hash, mindprint_asset_id.
- If any evidence is missing, return INSUFFICIENT_EVIDENCE.

## Submission Checklist

- [ ] I filled builder.github and builder.solanaReceiveAddress in manifest.json.
- [ ] I filled payout.recipientAddress in manifest.json.
- [ ] I kept origin.campaign as the_garage_frontier_sp.
- [ ] I preserved validation.policy.requiredChecks in manifest.json.
- [ ] I preserved cnftPreset.attributes in manifest.json.
- [ ] I linked the final pull request in provenance.pullRequestUrl.
`;

fs.writeFileSync(path.join(skillDir, "manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`);
fs.writeFileSync(path.join(skillDir, "SKILL.md"), skillMd);

console.log(`Created ${path.relative(root, skillDir)}`);
console.log("Next: edit SKILL.md and manifest.json, then open a PR.");
