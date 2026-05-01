const fs = require("fs");
const path = require("path");

const ROOT_DIR = path.join(__dirname, "..");
const PRODUCTS_DIR = path.join(ROOT_DIR, "agent-cards", "products");
const SKILLS_DIR = path.join(ROOT_DIR, "agent-cards", "skills");
const COMMUNITY_CODES = ["THEGARAGE", "SUPERTEAMBR", "COLOSSEUM"];
const REQUIRED_CHECKS = [
  "hash_integrity",
  "builder_identity",
  "payout_wallet_present",
  "policy_gate",
  "voucher_or_x402_reference",
  "proof_bundle"
];

const communityPricing = (pricing = {}) => ({
  model: "community_free",
  currency: pricing.currency || "USDC",
  price: 0,
  originalModel:
    pricing.originalModel && pricing.originalModel !== "community_free"
      ? pricing.originalModel
      : (pricing.model && pricing.model !== "community_free" ? pricing.model : "per_request"),
  originalPrice: Number.isFinite(Number(pricing.originalPrice))
    ? Number(pricing.originalPrice)
    : (Number.isFinite(Number(pricing.price)) ? Number(pricing.price) : 0),
  sponsoredBy: "MIND Protocol",
  phase: "the_garage_community",
  eligibleVoucherCodes: COMMUNITY_CODES,
  settlementRequired: false
});

const tractionBlock = {
  objective: "community_builder_engagement",
  phase: "the_garage_community",
  successMetrics: ["builder_registration", "voucher_claim", "skill_pr_opened"],
  paidConversion: "post_traction_only"
};

const lifecycleBlock = {
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
};

const validationBlock = {
  policy: {
    requiredChecks: REQUIRED_CHECKS,
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
};

const cnftPresetBlock = {
  standard: "Metaplex Core",
  mintPhase: "open_interest",
  currentPhaseDelivery: "metadata_preset_only",
  attributes: [
    { key: "MIND Phase", value: "the_garage_community" },
    { key: "Next Phase", value: "open_interest" },
    { key: "x402 Real Settlement", value: "disabled_until_open_interest" },
    { key: "Validation Contract", value: "mind_x402_phase_contract_v1" },
    { key: "Required Checks", value: REQUIRED_CHECKS.join(",") }
  ]
};

const readJson = (filePath) => JSON.parse(fs.readFileSync(filePath, "utf8"));
const writeJson = (filePath, data) => fs.writeFileSync(filePath, `${JSON.stringify(data, null, 2)}\n`);

const hasCommunityProvenance = (data) => {
  const badges = data.provenance?.badges || data.metadata?.badges || data.badges || [];
  const origin = data.provenance?.origin || data.metadata?.origin || data.origin || "";
  return (
    badges.includes("The Garage Premium") ||
    badges.includes("Superteam BR") ||
    origin.includes("Superteam") ||
    origin.includes("The Garage")
  );
};

let updatedCount = 0;

if (fs.existsSync(PRODUCTS_DIR)) {
  for (const file of fs.readdirSync(PRODUCTS_DIR).filter((name) => name.endsWith(".json"))) {
    const filePath = path.join(PRODUCTS_DIR, file);
    const data = readJson(filePath);
    data.pricing = communityPricing(data.pricing);
    data.traction = tractionBlock;
    data.lifecycle = lifecycleBlock;
    data.validation = validationBlock;
    data.cnftPreset = cnftPresetBlock;
    delete data.economicMetrics;
    delete data.economicModel;
    delete data.successStories;
    delete data.performanceMetrics;
    delete data.clientResults;
    writeJson(filePath, data);
    console.log(`Applied The Garage community pricing to ${file}`);
    updatedCount++;
  }
}

for (const dirName of ["mind", "stbr", "hostinger"]) {
  const dirPath = path.join(SKILLS_DIR, dirName);
  if (!fs.existsSync(dirPath)) continue;

  for (const file of fs.readdirSync(dirPath).filter((name) => name.endsWith(".json"))) {
    const filePath = path.join(dirPath, file);
    const data = readJson(filePath);
    if (!hasCommunityProvenance(data)) continue;

    data.pricing = communityPricing(data.pricing);
    data.traction = tractionBlock;
    data.lifecycle = lifecycleBlock;
    data.validation = validationBlock;
    data.cnftPreset = cnftPresetBlock;
    writeJson(filePath, data);
    console.log(`Applied The Garage community pricing to ${file}`);
    updatedCount++;
  }
}

console.log(`Applied The Garage community pricing to ${updatedCount} agent cards.`);
