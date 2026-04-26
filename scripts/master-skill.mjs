#!/usr/bin/env node

import fs from "node:fs";
import fsp from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { execSync } from "node:child_process";
import { createInterface } from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";

const HOME = os.homedir();
const CONFIG_DIR = path.join(HOME, ".codex", "Config");
const CONFIG_FILE = path.join(CONFIG_DIR, "master-skill.config.json");
const LOG_FILE = path.join(CONFIG_DIR, "master-skill.log");
const REPOS_INDEX_FILE = path.join(CONFIG_DIR, "repos-index.json");

const DEFAULT_CONFIG = {
  agent: "codex-trae",
  skillsRoot: path.join(HOME, ".codex", "Skills"),
  reposRoot: path.join(HOME, "Repos"),
  projectsRoot: path.join(HOME, "Projects"),
  defaultProjectSkillFolder: "agents/skills",
  defaultProjectFrameworkFolder: "agents/frameworks",
  autoScanDepth: 3,
  allowedFrameworks: ["BMAD", "SpecKit", "AntigravityKit", "SkillCreator"],
  allowedSkillGroups: ["Superpowers", "YouTube", "Marketing", "Research", "Dev"],
};

const OFFICIAL_REPOS = {
  BMAD: {
    key: "BMAD",
    pathName: "bmad-method",
    type: "framework",
    repoUrl: "https://github.com/bmad-code-org/BMAD-METHOD.git",
    verifiedOfficial: true,
    source: "github.com/bmad-code-org/BMAD-METHOD",
    aliases: ["bmad", "bmad-method"],
    tags: ["agile", "framework", "workflow"],
  },
  SpecKit: {
    key: "SpecKit",
    pathName: "spec-kit",
    type: "framework",
    repoUrl: "https://github.com/github/spec-kit.git",
    verifiedOfficial: true,
    source: "github.com/github/spec-kit",
    aliases: ["spec", "speckit", "spec-kit"],
    tags: ["spec-driven", "framework", "planning"],
  },
  SkillCreator: {
    key: "SkillCreator",
    pathName: "anthropic-skills",
    type: "framework",
    repoUrl: "https://github.com/anthropics/skills.git",
    verifiedOfficial: true,
    source: "github.com/anthropics/skills",
    aliases: ["skill-creator", "skills", "anthropic-skills"],
    tags: ["skill", "creator", "claude-code"],
  },
  AntigravityKit: {
    key: "AntigravityKit",
    pathName: "antigravity-kit",
    type: "framework",
    repoUrl: null,
    verifiedOfficial: false,
    source: "unverified",
    aliases: ["antigravity", "antigravity-kit"],
    tags: ["agent-first", "framework"],
    notes: "Official GitHub repository not auto-verified.",
  },
  YouTube: {
    key: "YouTube",
    pathName: "youtube-skills",
    type: "skill-group",
    repoUrl: null,
    verifiedOfficial: false,
    source: "unverified",
    aliases: ["youtube", "yt-skills"],
    tags: ["content", "video", "skill-group"],
    notes: "Official GitHub repository not auto-verified.",
  },
};

const HELP_TEXT = `
Master Skill - Orchestrator

Usage:
  master-skill init
  master-skill bootstrap-official
  master-skill list-skills
  master-skill list-frameworks
  master-skill list-repos
  master-skill search <query>
  master-skill install <name> [--project <path>] [--force]
  master-skill show-config
  master-skill reset-config

Portuguese aliases:
  listar skills disponiveis
  listar frameworks disponiveis
  listar repositorios disponiveis
  buscar <query>
  instalar <nome>
  mostrar configuracao atual
  resetar configuracao
`;

const RAW_ARGS = process.argv
  .slice(2)
  .map((token) => String(token).trim())
  .filter(Boolean);

const NORMALIZED_ARGS = RAW_ARGS.map((token, index) => {
  const withoutPrefix = index === 0 ? token.replace(/^\//, "") : token;
  return withoutPrefix
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
});

const COMMAND_START_INDEX = ["master-skill", "masterskill"].includes(NORMALIZED_ARGS[0]) ? 1 : 0;
const COMMAND_RAW_ARGS = RAW_ARGS.slice(COMMAND_START_INDEX);
const COMMAND_NORMALIZED_ARGS = NORMALIZED_ARGS.slice(COMMAND_START_INDEX);

const SEARCH_STOPWORDS = new Set([
  "de",
  "do",
  "da",
  "dos",
  "das",
  "a",
  "o",
  "os",
  "as",
  "um",
  "uma",
  "para",
  "por",
  "com",
  "sem",
  "skill",
  "skills",
  "framework",
  "frameworks",
  "repo",
  "repos",
  "repositorio",
  "repositorios",
]);

const toSlug = (value) => value.toLowerCase().replace(/[^a-z0-9]+/g, "-");
const normalizeText = (value) =>
  String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();

function expandHomePath(value) {
  if (!value) return value;
  if (value === "~") return HOME;
  if (value.startsWith("~/")) return path.join(HOME, value.slice(2));
  return value;
}

function tokenizeQuery(query) {
  const normalized = normalizeText(query);
  return normalized
    .split(/[^a-z0-9]+/g)
    .map((token) => token.trim())
    .filter((token) => token.length > 1 && !SEARCH_STOPWORDS.has(token));
}

function commandIncludesAny(values, accepted) {
  return values.some((value) => accepted.includes(value));
}

async function ensureDir(dirPath) {
  await fsp.mkdir(dirPath, { recursive: true });
}

async function appendLog(message) {
  await ensureDir(CONFIG_DIR);
  const line = `${new Date().toISOString()} ${message}\n`;
  await fsp.appendFile(LOG_FILE, line, "utf8");
}

async function readJsonSafe(filePath, fallback) {
  try {
    const raw = await fsp.readFile(filePath, "utf8");
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

async function writeJson(filePath, data) {
  await ensureDir(path.dirname(filePath));
  await fsp.writeFile(filePath, `${JSON.stringify(data, null, 2)}\n`, "utf8");
}

function buildDefaultReposIndex(config) {
  return Object.values(OFFICIAL_REPOS).reduce((acc, item) => {
    acc[item.key] = {
      path: path.join(config.reposRoot, item.pathName),
      type: item.type,
      repoUrl: item.repoUrl,
      verifiedOfficial: item.verifiedOfficial,
      source: item.source,
      aliases: item.aliases,
      tags: item.tags,
      notes: item.notes ?? "",
    };
    return acc;
  }, {});
}

async function ensureConfig(force = false) {
  if (!force && fs.existsSync(CONFIG_FILE)) {
    return readJsonSafe(CONFIG_FILE, DEFAULT_CONFIG);
  }

  await writeJson(CONFIG_FILE, DEFAULT_CONFIG);
  await appendLog("config initialized");

  if (force || !fs.existsSync(REPOS_INDEX_FILE)) {
    const initialIndex = buildDefaultReposIndex(DEFAULT_CONFIG);
    await writeJson(REPOS_INDEX_FILE, initialIndex);
    await appendLog(force ? "repos index reset" : "repos index initialized");
  }

  return DEFAULT_CONFIG;
}

async function promptForConfig(baseConfig) {
  if (!process.stdin.isTTY || !process.stdout.isTTY) {
    return baseConfig;
  }

  const rl = createInterface({ input, output });
  const ask = async (label, fallback) => {
    const answer = await rl.question(`${label} [${fallback}]: `);
    return answer.trim() || fallback;
  };

  try {
    const agent = await ask("1. agente atual", baseConfig.agent);
    const skillsRoot = await ask("2. pasta global de skills", baseConfig.skillsRoot);
    const reposRoot = await ask("3. pasta de repositorios", baseConfig.reposRoot);
    const projectsRoot = await ask("4. pasta de projetos", baseConfig.projectsRoot);

    return {
      ...baseConfig,
      agent: normalizeText(agent) || baseConfig.agent,
      skillsRoot: path.resolve(expandHomePath(skillsRoot)),
      reposRoot: path.resolve(expandHomePath(reposRoot)),
      projectsRoot: path.resolve(expandHomePath(projectsRoot)),
    };
  } finally {
    rl.close();
  }
}

async function loadReposIndex(config) {
  const fallbackIndex = {};
  for (const item of Object.values(OFFICIAL_REPOS)) {
    fallbackIndex[item.key] = {
      path: path.join(config.reposRoot, item.pathName),
      type: item.type,
      repoUrl: item.repoUrl,
      verifiedOfficial: item.verifiedOfficial,
      source: item.source,
      aliases: item.aliases,
      tags: item.tags,
      notes: item.notes ?? "",
    };
  }
  return readJsonSafe(REPOS_INDEX_FILE, fallbackIndex);
}

function readManifest(dirPath) {
  const manifestPath = path.join(dirPath, "manifest.json");
  if (!fs.existsSync(manifestPath)) return null;
  try {
    return JSON.parse(fs.readFileSync(manifestPath, "utf8"));
  } catch {
    return null;
  }
}

function inferType(dirPath, manifest, config) {
  if (manifest?.type) return manifest.type;
  if (fs.existsSync(path.join(dirPath, "framework.md"))) return "framework";
  if (fs.existsSync(path.join(dirPath, "skill.md")) || fs.existsSync(path.join(dirPath, "SKILL.md"))) return "skill";
  const dirName = path.basename(dirPath);
  if (config.allowedFrameworks.some((fw) => fw.toLowerCase() === dirName.toLowerCase())) {
    return "framework";
  }
  return "skill";
}

function collectCandidates(rootPath, maxDepth, config, sourceLabel) {
  if (!fs.existsSync(rootPath)) return [];
  const results = [];
  const queue = [{ dir: rootPath, depth: 0 }];
  const seen = new Set();

  while (queue.length > 0) {
    const current = queue.shift();
    if (!current || seen.has(current.dir)) continue;
    seen.add(current.dir);

    let entries = [];
    try {
      entries = fs.readdirSync(current.dir, { withFileTypes: true });
    } catch {
      continue;
    }

    const manifest = readManifest(current.dir);
    const hasSkillMarker = fs.existsSync(path.join(current.dir, "skill.md")) || fs.existsSync(path.join(current.dir, "SKILL.md"));
    const hasFrameworkMarker = fs.existsSync(path.join(current.dir, "framework.md"));
    if (manifest || hasSkillMarker || hasFrameworkMarker) {
      const name = manifest?.name || path.basename(current.dir);
      results.push({
        name,
        type: inferType(current.dir, manifest, config),
        path: current.dir,
        aliases: manifest?.aliases || [],
        tags: manifest?.tags || [],
        description: manifest?.description || "",
        source: sourceLabel,
      });
    }

    if (current.depth >= maxDepth) continue;
    for (const entry of entries) {
      if (!entry.isDirectory()) continue;
      if (entry.name.startsWith(".") || entry.name === "node_modules" || entry.name === ".git") continue;
      queue.push({ dir: path.join(current.dir, entry.name), depth: current.depth + 1 });
    }
  }

  return results;
}

function scoreSingleTerm(term, candidate) {
  const t = normalizeText(term);
  if (!t) return 0;
  const name = normalizeText(candidate.name);
  const aliases = (candidate.aliases || []).map((alias) => normalizeText(alias));
  const tags = (candidate.tags || []).map((tag) => normalizeText(tag));

  if (name === t) return 100;
  if (aliases.includes(t)) return 90;
  if (tags.includes(t)) return 80;
  if (name.includes(t)) return 70;
  if (aliases.some((alias) => alias.includes(t))) return 60;
  if (tags.some((tag) => tag.includes(t))) return 50;
  return 0;
}

function scoreCandidate(query, candidate) {
  const normalizedQuery = normalizeText(query);
  const fullScore = scoreSingleTerm(normalizedQuery, candidate);
  const tokens = tokenizeQuery(query);

  if (tokens.length === 0) return fullScore;

  const tokenScores = tokens.map((token) => Math.max(0, scoreSingleTerm(token, candidate) - 5));
  const bestTokenScore = Math.max(...tokenScores, 0);
  const matchesAllTokens = tokens.every((token) => scoreSingleTerm(token, candidate) >= 50);

  return Math.max(fullScore, matchesAllTokens ? bestTokenScore + 3 : bestTokenScore);
}

function dedupeCandidates(candidates) {
  const seen = new Set();
  return candidates.filter((candidate) => {
    const key = `${normalizeText(candidate.name)}::${path.resolve(candidate.path)}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function reposIndexToCandidates(reposIndex) {
  return Object.entries(reposIndex).map(([key, value]) => ({
    name: key,
    type: value.type || "skill-group",
    path: value.path,
    aliases: value.aliases || [],
    tags: value.tags || [],
    description: value.notes || "",
    source: "repos-index",
  }));
}

async function listCandidates(typeFilter = null) {
  const config = await ensureConfig();
  const reposIndex = await loadReposIndex(config);
  const fromSkills = collectCandidates(config.skillsRoot, config.autoScanDepth, config, "skillsRoot");
  const fromRepos = collectCandidates(config.reposRoot, config.autoScanDepth, config, "reposRoot");
  const fromIndex = reposIndexToCandidates(reposIndex);
  const merged = dedupeCandidates([...fromSkills, ...fromRepos, ...fromIndex]);

  if (!typeFilter) return merged;
  return merged.filter((item) => item.type === typeFilter || (typeFilter === "skill" && item.type === "skill-group"));
}

async function findBestCandidate(name) {
  const candidates = await listCandidates();
  const withScore = candidates
    .map((candidate) => ({ candidate, score: scoreCandidate(name, candidate) }))
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score);

  return withScore[0]?.candidate ?? null;
}

async function cloneIfNeeded(indexEntry) {
  if (!indexEntry?.repoUrl) return false;
  if (fs.existsSync(indexEntry.path)) return false;
  await ensureDir(path.dirname(indexEntry.path));
  execSync(`git clone --depth 1 ${indexEntry.repoUrl} "${indexEntry.path}"`, { stdio: "inherit" });
  await appendLog(`repo cloned ${indexEntry.repoUrl} -> ${indexEntry.path}`);
  return true;
}

async function installItem(name, { projectPath, force }) {
  const config = await ensureConfig();
  const reposIndex = await loadReposIndex(config);
  const projectRoot = projectPath ? path.resolve(projectPath) : process.cwd();

  let candidate = await findBestCandidate(name);
  let indexHit = null;

  const scoredIndexEntries = Object.entries(reposIndex)
    .map(([key, value]) => ({ key, ...value }))
    .map((item) => ({ item, score: scoreCandidate(name, { name: item.key, aliases: item.aliases || [], tags: item.tags || [] }) }))
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score);

  if (!candidate) {
    indexHit = scoredIndexEntries[0]?.item ?? null;
    if (indexHit) {
      await cloneIfNeeded(indexHit);
      if (fs.existsSync(indexHit.path)) {
        candidate = {
          name: indexHit.key,
          type: indexHit.type,
          path: indexHit.path,
          aliases: indexHit.aliases || [],
          tags: indexHit.tags || [],
          source: "repos-index",
          description: indexHit.notes || "",
        };
      }
    }
  }

  if (candidate && !fs.existsSync(candidate.path)) {
    indexHit = scoredIndexEntries[0]?.item ?? null;
    if (indexHit) {
      await cloneIfNeeded(indexHit);
      if (fs.existsSync(indexHit.path)) {
        candidate = {
          name: indexHit.key,
          type: indexHit.type,
          path: indexHit.path,
          aliases: indexHit.aliases || [],
          tags: indexHit.tags || [],
          source: "repos-index",
          description: indexHit.notes || "",
        };
      }
    }
  }

  if (!candidate) {
    throw new Error(`Item "${name}" not found in skillsRoot, reposRoot, or repos-index.`);
  }

  if (!fs.existsSync(candidate.path)) {
    throw new Error(`Item "${name}" resolved but source path does not exist: ${candidate.path}`);
  }

  const isFramework = candidate.type === "framework";
  const relativeDestRoot = isFramework
    ? config.defaultProjectFrameworkFolder
    : config.defaultProjectSkillFolder;
  const destinationRoot = path.join(projectRoot, relativeDestRoot);
  const destination = path.join(destinationRoot, path.basename(candidate.path));
  const conflictsDetected = [];
  const warnings = [];

  await ensureDir(destinationRoot);
  if (fs.existsSync(destination)) {
    conflictsDetected.push(destination);
    if (!force) {
      throw new Error(`Destination already exists: ${destination}. Use --force to overwrite.`);
    }
    if (isFramework) {
      warnings.push("Recomendado instalar framework antes das skills customizadas.");
    }
    await fsp.rm(destination, { recursive: true, force: true });
  }

  await fsp.cp(candidate.path, destination, { recursive: true });
  await appendLog(`install ${candidate.name} from ${candidate.path} to ${destination}`);

  return {
    projectRoot,
    source: candidate.path,
    destination,
    name: candidate.name,
    sourceLabel: candidate.source || "unknown",
    clonedFromRepo: Boolean(indexHit?.repoUrl && fs.existsSync(candidate.path)),
    conflictsDetected,
    warnings,
  };
}

async function bootstrapOfficialRepos() {
  const config = await ensureConfig();
  const index = await loadReposIndex(config);

  for (const [key, repo] of Object.entries(index)) {
    if (repo.repoUrl) {
      await cloneIfNeeded(repo);
      console.log(`[bootstrap] ${key}: ${repo.path}`);
    } else {
      console.log(`[bootstrap] ${key}: skipped (official repo URL not verified)`);
    }
  }
}

async function handleAction() {
  const first = COMMAND_NORMALIZED_ARGS[0] || "";
  const second = COMMAND_NORMALIZED_ARGS[1] || "";
  const allJoined = COMMAND_NORMALIZED_ARGS.join(" ");
  const hasArgs = COMMAND_NORMALIZED_ARGS.length > 0;

  if (!hasArgs || commandIncludesAny([first], ["help", "--help", "-h"])) {
    console.log(HELP_TEXT.trim());
    return;
  }

  if (commandIncludesAny([first], ["init", "setup", "configurar"])) {
    const seeded = await ensureConfig(true);
    const cfg = await promptForConfig(seeded);
    await writeJson(CONFIG_FILE, cfg);
    await writeJson(REPOS_INDEX_FILE, buildDefaultReposIndex(cfg));
    await appendLog(`config updated by init (agent=${cfg.agent})`);

    console.log(JSON.stringify(cfg, null, 2));
    return;
  }

  if (
    commandIncludesAny([first], ["show-config", "mostrar-config", "mostrar-configuracao"]) ||
    (first === "mostrar" && (second.startsWith("config") || second === ""))
  ) {
    const cfg = await readJsonSafe(CONFIG_FILE, DEFAULT_CONFIG);
    console.log(JSON.stringify(cfg, null, 2));
    return;
  }

  if (commandIncludesAny([first], ["reset-config", "resetar-config", "resetar-configuracao"])) {
    await ensureConfig(true);
    console.log("Master Skill configuration reset.");
    return;
  }

  if (
    commandIncludesAny([first], ["list-skills", "listar-skills"]) ||
    (first === "listar" && commandIncludesAny([second], ["skills", "skill"]))
  ) {
    const skills = await listCandidates("skill");
    skills.forEach((item) => {
      console.log(`- ${item.name} [${item.type}] (${item.source}) -> ${item.path}`);
    });
    if (skills.length === 0) console.log("No skills found.");
    return;
  }

  if (
    commandIncludesAny([first], ["list-frameworks", "listar-frameworks"]) ||
    (first === "listar" && commandIncludesAny([second], ["frameworks", "framework"]))
  ) {
    const frameworks = await listCandidates("framework");
    frameworks.forEach((item) => {
      console.log(`- ${item.name} [framework] (${item.source}) -> ${item.path}`);
    });
    if (frameworks.length === 0) console.log("No frameworks found.");
    return;
  }

  if (
    commandIncludesAny([first], ["list-repos", "listar-repos"]) ||
    (first === "listar" &&
      commandIncludesAny([second], ["repos", "repo", "repositorios", "repositorio", "repositorios", "repositorio"]))
  ) {
    const config = await ensureConfig();
    const index = await loadReposIndex(config);
    for (const [key, repo] of Object.entries(index)) {
      console.log(`- ${key}: ${repo.path} | type=${repo.type} | official=${Boolean(repo.verifiedOfficial)} | url=${repo.repoUrl || "n/a"}`);
    }
    return;
  }

  if (commandIncludesAny([first], ["search", "buscar"])) {
    const query = COMMAND_RAW_ARGS.slice(1).join(" ").trim();
    if (!query) throw new Error("Usage: master-skill search <query>");
    const candidates = await listCandidates();
    const matches = candidates
      .map((candidate) => ({ candidate, score: scoreCandidate(query, candidate) }))
      .filter((item) => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 20);

    if (matches.length === 0) {
      console.log("No matches found.");
      return;
    }

    for (const match of matches) {
      console.log(`- ${match.candidate.name} [${match.candidate.type}] score=${match.score} (${match.candidate.source}) -> ${match.candidate.path}`);
    }
    return;
  }

  if (commandIncludesAny([first], ["bootstrap-official", "bootstrap-oficiais"])) {
    await bootstrapOfficialRepos();
    return;
  }

  if (commandIncludesAny([first], ["install", "instalar"])) {
    let projectPath = null;
    let force = false;
    const nameTokens = [];

    for (let i = 1; i < COMMAND_RAW_ARGS.length; i += 1) {
      const token = COMMAND_NORMALIZED_ARGS[i];
      if (token === "--project" || token === "--projeto") {
        projectPath = COMMAND_RAW_ARGS[i + 1] ? expandHomePath(COMMAND_RAW_ARGS[i + 1]) : null;
        i += 1;
        continue;
      }
      if (token === "--force" || token === "--forcar") {
        force = true;
        continue;
      }
      if (token.startsWith("--")) continue;
      nameTokens.push(COMMAND_RAW_ARGS[i]);
    }

    const itemName = nameTokens.join(" ").trim();
    if (!itemName) throw new Error("Usage: master-skill install <name> [--project <path>] [--force]");

    const result = await installItem(itemName, { projectPath, force });
    console.log("Master Skill:");
    console.log(`- projeto detectado: ${result.projectRoot}`);
    console.log(`- item encontrado: ${result.name}`);
    console.log(`- origem detectada: ${result.sourceLabel}`);
    console.log(`- origem: ${result.source}`);
    console.log(`- destino: ${result.destination}`);
    console.log(
      `- conflitos detectados: ${
        result.conflictsDetected.length > 0 ? result.conflictsDetected.join(", ") : "nenhum"
      }`,
    );
    if (result.warnings.length > 0) {
      result.warnings.forEach((warning) => console.log(`- aviso: ${warning}`));
    }
    console.log("- status: instalada com sucesso");
    return;
  }

  if (allJoined === "listar skills disponiveis") {
    const skills = await listCandidates("skill");
    skills.forEach((item) => {
      console.log(`- ${item.name} [${item.type}] (${item.source}) -> ${item.path}`);
    });
    if (skills.length === 0) console.log("No skills found.");
    return;
  }

  if (allJoined === "listar frameworks disponiveis") {
    const frameworks = await listCandidates("framework");
    frameworks.forEach((item) => {
      console.log(`- ${item.name} [framework] (${item.source}) -> ${item.path}`);
    });
    if (frameworks.length === 0) console.log("No frameworks found.");
    return;
  }

  if (allJoined.startsWith("buscar ")) {
    const query = COMMAND_RAW_ARGS.slice(1).join(" ").trim();
    const candidates = await listCandidates();
    const matches = candidates
      .map((candidate) => ({ candidate, score: scoreCandidate(query, candidate) }))
      .filter((item) => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 20);

    if (matches.length === 0) {
      console.log("No matches found.");
      return;
    }

    for (const match of matches) {
      console.log(`- ${match.candidate.name} [${match.candidate.type}] score=${match.score} (${match.candidate.source}) -> ${match.candidate.path}`);
    }
    return;
  }

  console.log(HELP_TEXT.trim());
}

handleAction().catch(async (error) => {
  await appendLog(`error ${error instanceof Error ? error.message : String(error)}`);
  console.error(`Master Skill error: ${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
});
