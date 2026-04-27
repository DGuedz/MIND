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
    model: "per_request",
    currency: "USDC",
    price: 0.01
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

## Submission Checklist

- [ ] I filled builder.github and builder.solanaReceiveAddress in manifest.json.
- [ ] I filled payout.recipientAddress in manifest.json.
- [ ] I kept origin.campaign as the_garage_frontier_sp.
- [ ] I linked the final pull request in provenance.pullRequestUrl.
`;

fs.writeFileSync(path.join(skillDir, "manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`);
fs.writeFileSync(path.join(skillDir, "SKILL.md"), skillMd);

console.log(`Created ${path.relative(root, skillDir)}`);
console.log("Next: edit SKILL.md and manifest.json, then open a PR.");
