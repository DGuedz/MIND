# PRD: Builder Signup, Voucher Claim and Skill Marketplace Flow

Status: draft for traction week
Owner: MIND Protocol
Surface: landingpage, marketplace, GitHub contribution flow, Colosseum Copilot

## Decision

Use GitHub as the primary registration and provenance layer for traction week.

Colosseum Copilot should not be the signup source of truth yet. It should act as an assistive intelligence layer for routing, scoring, PMF analysis and ecosystem context after the required API credentials are available.

Rationale:
- GitHub gives verifiable builder identity, pull request trail, commit history and review status.
- Voucher claims need auditability before they need advanced intelligence.
- Skill cards become marketplace assets only when their source, builder and review path are traceable.
- Colosseum Copilot can enrich the process, but should not block the basic builder funnel.

## Problem

The Garage campaign needs a credible path for builders to:
1. register as participants;
2. claim a sponsored marketplace skill through a voucher;
3. create and submit their own skill card;
4. become part of the MIND skill portfolio;
5. prove that the builder originated from The Garage or Superteam BR campaign.

The flow must support PMF learning around A2A, Solana DeFi, x402-style payment intents and skill monetization without overclaiming production readiness.

## PMF Thesis

MIND proves demand when builders use the protocol to move from "I can install an agent skill" to "I can publish a skill asset that other agents can discover, install and eventually pay for."

The first PMF signal is not token volume. The first signal is a repeatable builder loop:

Register -> Claim -> Install -> Build -> Submit PR -> Review -> List in Marketplace.

The second signal is whether these skills cluster around high-value A2A use cases:
- Solana DeFi execution and routing;
- x402 or payment-gated agent services;
- credentialed agent actions;
- market intelligence and data access;
- workflow automation for builders.

## Goals

- Make registration simple enough for a one-week campaign.
- Bind every voucher claim to a builder identity and source campaign.
- Bind every skill submission to GitHub provenance and payout metadata.
- Give the community a clear "how to contribute to MIND" path.
- Keep the marketplace claim flow truthful: free claim by voucher now, paid x402/USDC settlement later when verified.
- Produce measurable PMF signals from real builder activity.

## Non-Goals

- Do not make Colosseum Copilot the mandatory auth system.
- Do not claim on-chain payment settlement unless a transaction or verified proof exists.
- Do not depend on a public `@mindprotocol/cli` package until it is published and verified.
- Do not accept anonymous skill submissions into the marketplace.

## Actors

- Builder: community member creating or claiming skills.
- MIND Reviewer: validates metadata, security, pricing and marketplace fit.
- Marketplace User: installs or claims a listed skill.
- GitHub: identity, PR review and provenance layer.
- Colosseum Copilot: optional analysis layer for opportunity, scoring and PMF insights.
- MIND Protocol: voucher issuer, marketplace operator and policy layer.

## Core Flow

### 1. Entry

Builder lands on `/the-garage` or `/contribute`.

Primary actions:
- Register builder
- Claim sponsored skill
- Submit skill card
- Read contribution rules

### 2. Builder Registration

Required fields:
- GitHub handle
- Solana receive wallet
- campaign source: `THE_GARAGE_SP`
- referral code: `THEGARAGE` or `SUPERTEAMBR`
- consent to publish builder attribution in marketplace metadata

Registration creates a builder record with status `registered`.

### 3. Voucher Activation

Voucher claim is allowed only when:
- GitHub handle is present;
- wallet is present;
- referral code is valid;
- builder has not exceeded claim limit;
- marketplace item is eligible for sponsored claim.

Initial campaign codes:
- `THEGARAGE`
- `SUPERTEAMBR`
- `COLOSSEUM`

Claim result:
- marketplace CTA changes from pay to claim;
- claim receipt is stored;
- install command is shown only for verified local or published package path.

### 4. Skill Creation

Builder creates a skill scaffold from the repository:

```bash
pnpm run create-skill -- --name "my-skill" --builder "Builder Name" --github "githubHandle" --wallet "solanaWallet"
```

The scaffold must write provenance into both files:
- `SKILL.md`
- `manifest.json`

Required metadata:
- builder GitHub handle;
- Solana receive wallet;
- origin campaign;
- origin event;
- source commit;
- pricing model;
- payout metadata;
- review status.

### 5. Pull Request Submission

Builder opens a GitHub PR with:
- skill folder path;
- generated `SKILL.md`;
- generated `manifest.json`;
- campaign code used;
- intended pricing model;
- security notes.

The PR is the canonical proof that the builder entered through the campaign and contributed a marketplace candidate.

### 6. Review

Reviewer checks:
- metadata completeness;
- no secrets;
- no prompt-injection instructions;
- no false production claims;
- install instructions work;
- payout metadata is present;
- marketplace category is correct.

Valid PRs move to `approved_for_marketplace`.

### 7. Marketplace Listing

Approved skill becomes a marketplace card with:
- builder attribution;
- campaign origin;
- install instructions;
- pricing model;
- voucher eligibility;
- review state.

The listing can be claimed for free during the campaign if the user has a valid registration and voucher.

### 8. Colosseum Copilot Enrichment

After credentials are available, Copilot can score:
- project fit for Solana DeFi;
- x402 or payment-gated service relevance;
- A2A utility;
- builder history;
- comparable ecosystem opportunities;
- sponsor or grant alignment.

Copilot output should enrich review and PMF analysis, not replace GitHub provenance.

## Data Model

### builder_registrations

```json
{
  "id": "builder_registration_id",
  "githubHandle": "string",
  "solanaReceiveWallet": "string",
  "campaignSource": "THE_GARAGE_SP",
  "referralCode": "THEGARAGE|SUPERTEAMBR|COLOSSEUM",
  "status": "registered|verified|blocked",
  "consentMarketplaceAttribution": true,
  "createdAt": "iso_timestamp"
}
```

### voucher_claims

```json
{
  "id": "voucher_claim_id",
  "builderRegistrationId": "string",
  "githubHandle": "string",
  "voucherCode": "string",
  "marketplaceItemId": "string",
  "claimStatus": "claimed|rejected|revoked",
  "claimReason": "string",
  "createdAt": "iso_timestamp"
}
```

### skill_submissions

```json
{
  "id": "skill_submission_id",
  "skillSlug": "string",
  "builderRegistrationId": "string",
  "githubHandle": "string",
  "solanaReceiveWallet": "string",
  "originCampaign": "THE_GARAGE_SP",
  "sourceCommit": "git_sha",
  "pullRequestUrl": "string",
  "reviewStatus": "draft|submitted|changes_requested|approved_for_marketplace|rejected",
  "marketplaceListingId": "string|null",
  "createdAt": "iso_timestamp"
}
```

## Voucher Policy

Initial policy:
- one builder identity per GitHub handle;
- one wallet per builder registration for the campaign;
- one to three free claims per builder, final limit defined before launch;
- voucher codes are campaign-bound, not universal discounts;
- every claim must be logged;
- suspicious duplicate GitHub or wallet patterns move to `blocked`.

## Implementation Plan

### Phase 0: Current Alignment

- Keep `/the-garage`, `/contribute` and marketplace copy consistent.
- Keep repository-local skill creation as the verified path.
- Do not advertise public npm CLI until package availability is verified.

### Phase 1: Frontend Registration Gate

- Add builder registration form to `/contribute` or `/the-garage`.
- Store registration in local app state first if backend is not ready.
- Require GitHub handle, wallet and referral code before voucher claim.
- Show clear claim state: eligible, claimed, rejected.

### Phase 2: Persistent Claims

- Add API/storage for `builder_registrations` and `voucher_claims`.
- Enforce claim limits server-side.
- Add audit log for claim decisions.
- Connect marketplace voucher CTA to stored registration.

### Phase 3: Skill Submission Provenance

- Validate generated `SKILL.md` and `manifest.json` in CI.
- Reject missing GitHub, wallet, campaign source or source commit.
- Add PR template fields for campaign and payout metadata.
- Add marketplace ingestion from approved community skill folders.

### Phase 4: Copilot PMF Layer

- Enable Colosseum Copilot when API credentials are present.
- Score submitted skills by A2A utility, Solana DeFi relevance and x402 fit.
- Produce weekly PMF report from registrations, claims, PRs and listings.

### Phase 5: Verified Payment and Proof Layer

- Replace simulated claim receipts with signed proof or transaction evidence when ready.
- Add x402 or USDC settlement only after end-to-end verification.
- Expose proof status in marketplace cards.

## Acceptance Criteria

- A builder can understand the campaign from `/the-garage` or `/contribute`.
- A builder cannot claim a voucher without GitHub handle and wallet.
- A voucher claim is tied to a campaign code and builder registration.
- A generated skill card contains provenance in Markdown and JSON.
- A PR can be reviewed using metadata alone without private context.
- Marketplace listing distinguishes sponsored claim from paid settlement.
- PMF metrics can be calculated from registrations, claims, PRs and approved listings.

## Metrics

Traction week metrics:
- registered builders;
- valid voucher claims;
- marketplace skills claimed;
- skill scaffolds generated;
- PRs opened;
- PRs approved;
- marketplace listings created;
- unique Solana wallets registered;
- repeat builders submitting more than one skill;
- number of submissions mapped to A2A, Solana DeFi or x402 categories.

Do not count x402 payment volume unless verified settlement exists.

## Risks

- Fake registrations through duplicate GitHub or wallets.
- Builders misunderstanding voucher claim as production payment settlement.
- Unreviewed skills introducing unsafe instructions.
- Public CLI copy drifting ahead of actual package availability.
- Copilot dependency blocking the funnel before credentials are ready.

## Open Questions

- Final free-claim limit per builder for traction week.
- Whether GitHub OAuth is needed now or manual GitHub handle is enough.
- Which storage layer should persist registrations first.
- Whether approved community skills should be listed automatically or through manual review.
- Which marketplace categories are mandatory for A2A, Solana DeFi and x402.

## Immediate Tickets

1. Add registration state and form to `/contribute`.
2. Gate marketplace voucher claim by registered GitHub handle and wallet.
3. Add PR template for community skill submissions.
4. Add CI validation for community `manifest.json` and `SKILL.md` provenance.
5. Add marketplace ingestion rules for approved community skills.
6. Add Copilot scoring only after `COLOSSEUM_COPILOT_PAT` and API base are configured.
