import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const REPO_ROOT = process.cwd();

const SOURCE_FILES = [
  {
    sourceKey: "sendaifun",
    manifestPath: path.join(REPO_ROOT, "agent-cards/skills/sources/sendaifun-skills.v1.json")
  },
  {
    sourceKey: "mind",
    manifestPath: path.join(REPO_ROOT, "agent-cards/skills/sources/mind-skills.v1.json")
  },
  {
    sourceKey: "stbr",
    manifestPath: path.join(REPO_ROOT, "agent-cards/skills/sources/stbr-skills.v1.json")
  },
  {
    sourceKey: "frames",
    manifestPath: path.join(REPO_ROOT, "agent-cards/skills/sources/frames-skills.v1.json")
  },
  {
    sourceKey: "tamkaize",
    manifestPath: path.join(REPO_ROOT, "agent-cards/skills/sources/tamkaize-skills.v1.json")
  }
];

function nowIso() {
  return new Date().toISOString();
}

function slugToFilenamePart(name) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
}

function mapIntent(category) {
  if (category === "security") return { intent: "knowledge_base", domain: "security" };
  if (category === "ai-agents") return { intent: "orchestration", domain: "automation" };
  if (category === "devops") return { intent: "orchestration", domain: "infrastructure" };
  if (category === "infrastructure") return { intent: "api_integration", domain: "infrastructure" };
  if (category === "client-development") return { intent: "api_integration", domain: "developer-tools" };
  if (category === "program-development") return { intent: "api_integration", domain: "developer-tools" };
  if (category === "nft-tokens") return { intent: "api_integration", domain: "nft" };
  if (category === "cross-chain") return { intent: "api_integration", domain: "infrastructure" };
  if (category === "data-analytics") return { intent: "data_analysis", domain: "finance" };
  if (category === "oracles") return { intent: "api_integration", domain: "finance" };
  if (category === "trading") return { intent: "api_integration", domain: "finance" };
  if (category === "defi") return { intent: "api_integration", domain: "finance" };
  if (category === "ecosystem-intelligence") return { intent: "data_analysis", domain: "finance" };
  if (category === "education") return { intent: "knowledge_base", domain: "education" };
  return { intent: "api_integration", domain: "general" };
}

function buildCard({ source, sourceKey, skill, createdAt, updatedAt }) {
  const { intent, domain } = mapIntent(skill.category);
  const authorName =
    sourceKey === "sendaifun" ? "SendAI" :
    sourceKey === "mind" ? "MIND" :
    source.name;
  const contact = source.url;

  const tags = [
    "solana",
    "agent-skill",
    sourceKey,
    skill.category,
    skill.name
  ];

  const endpoints = {
    discovery: source.url,
    metadata: source.url,
    data: source.url,
    payment: ""
  };

  const card = {
    $schema: "https://mindprotocol.ai/schemas/agent-card/v1.json",
    metadata: {
      name: `${skill.name} (Skill)`,
      version: "1.0.0",
      description: skill.description,
      tags,
      license: source.license,
      author: { name: authorName, contact }
    },
    discovery: {
      intent,
      category: domain,
      keywords: tags,
      compatibleFrameworks: ["claude-code", "cursor", "codex", "trae"]
    },
    data: {
      type: "service",
      format: "agent-skill",
      schema: {
        fields: [
          { name: "skill_name", type: "string", description: "Nome da skill" },
          { name: "installation", type: "string", description: "Instrucoes de instalacao/ativacao" },
          { name: "usage", type: "string", description: "Como acionar a skill no agente" }
        ]
      },
      samples: [],
      qualityScore: 0.75
    },
    access: {
      authentication: "none",
      endpoints,
      rateLimit: { requests: 60, per: "minute" }
    },
    pricing: skill.pricing || {
      model: "free",
      currency: "USDC",
      price: 0
    },
    provenance: {
      source: source.name,
      createdAt,
      updatedAt,
      signature: "unsigned"
    },
    skill: {
      source_url: source.url,
      repo_path: skill.repoPath ?? null,
      install: sourceKey === "sendaifun"
        ? [
            "/plugin marketplace add sendaifun/skills",
            `/plugin install ${skill.name}`,
            "npx skills add sendaifun/skills"
          ]
        : []
    }
  };

  if (!endpoints.payment) {
    delete card.access.endpoints.payment;
  }
  if (!card.skill.install.length) {
    delete card.skill.install;
  }

  return card;
}

async function loadManifest(filePath) {
  const raw = await readFile(filePath, "utf8");
  return JSON.parse(raw);
}

async function ensureDir(dirPath) {
  await mkdir(dirPath, { recursive: true });
}

async function writeJson(filePath, obj) {
  const json = JSON.stringify(obj, null, 2) + "\n";
  await writeFile(filePath, json, "utf8");
}

async function main() {
  const write = process.argv.includes("--write");
  const createdAt = nowIso();
  const updatedAt = createdAt;

  const outputs = [];

  for (const src of SOURCE_FILES) {
    const manifest = await loadManifest(src.manifestPath);
    const outDir = path.join(REPO_ROOT, "agent-cards/skills", src.sourceKey);
    await ensureDir(outDir);

    for (const skill of manifest.skills ?? []) {
      const filename = `card_skill_${slugToFilenamePart(skill.name)}.json`;
      const outPath = path.join(outDir, filename);
      const card = buildCard({
        source: manifest.source,
        sourceKey: src.sourceKey,
        skill,
        createdAt,
        updatedAt
      });
      outputs.push({ outPath, cardName: card.metadata.name });
      if (write) await writeJson(outPath, card);
    }
  }

  const summary = {
    generatedAt: updatedAt,
    writeMode: write,
    outputCount: outputs.length,
    outputs
  };

  const summaryPath = path.join(REPO_ROOT, "agent-cards/skills", "generation.summary.json");
  if (write) await writeJson(summaryPath, summary);
  else process.stdout.write(JSON.stringify(summary, null, 2) + "\n");
}

main().catch((err) => {
  process.stderr.write(String(err?.stack ?? err) + "\n");
  process.exit(1);
});
