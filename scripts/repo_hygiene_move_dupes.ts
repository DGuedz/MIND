import fs from "node:fs/promises";
import path from "node:path";

type MoveAction = {
  from: string;
  to: string;
  kind: "dir" | "file";
  category: "code" | "docs" | "artifact";
};

const repoRoot = process.cwd();

const hasFlag = (flag: string) => process.argv.includes(flag);

const rel = (p: string) => path.relative(repoRoot, p).split(path.sep).join("/");

const isWithin = (relPath: string, prefixes: string[]) =>
  prefixes.some((prefix) => relPath === prefix || relPath.startsWith(`${prefix}/`));

const anchors = [
  ".agents/skills/kuka",
  ".agents/skills/colosseum-copilot",
  "agent-cards/skills/mind"
];

const ignoreDirs = new Set([
  ".git",
  ".vercel",
  "backup",
  "dist",
  "build",
  "node_modules",
  "node_modules 2",
  "artifacts/_local_dupes",
  "apps/landingpage/node_modules",
  "apps/landingpage/dist"
]);

const codeExt = new Set(["ts", "tsx", "js", "jsx", "mjs", "cjs", "rs", "go"]);
const docsExt = new Set(["md", "mdx", "txt"]);

const isDupeName = (name: string) => /\s2(\.[^./]+)?$/.test(name);
const isDupeFile = (name: string) => /\s2\.[^./]+$/.test(name);
const isDupeDir = (name: string) => name.endsWith(" 2");

const scanRoots = [
  "agent-cards",
  "apps",
  "services",
  "packages",
  "programs",
  "scripts",
  "shared",
  "governance",
  "sqls",
  "prompts",
  "artifacts",
  "assets",
  "covers_"
];

const ensureDir = async (absDir: string) => {
  await fs.mkdir(absDir, { recursive: true });
};

const pathExists = async (absPath: string) => {
  try {
    await fs.lstat(absPath);
    return true;
  } catch {
    return false;
  }
};

const resolveCollision = async (absTargetPath: string) => {
  if (!(await pathExists(absTargetPath))) return absTargetPath;
  const dir = path.dirname(absTargetPath);
  const ext = path.extname(absTargetPath);
  const base = path.basename(absTargetPath, ext);
  for (let i = 1; i <= 999; i++) {
    const candidate = path.join(dir, `${base}__dup_${i}${ext}`);
    if (!(await pathExists(candidate))) return candidate;
  }
  throw new Error(`collision_unresolved:${absTargetPath}`);
};

const classify = (name: string): MoveAction["category"] => {
  const ext = name.includes(".") ? name.split(".").pop()!.toLowerCase() : "";
  if (codeExt.has(ext)) return "code";
  if (docsExt.has(ext)) return "docs";
  return "artifact";
};

const targetBase = (category: MoveAction["category"]) => {
  if (category === "code") return "backup/_shadow_code";
  if (category === "docs") return "docs/_archive";
  return "artifacts/_local_dupes";
};

const walk = async (absDir: string, actions: MoveAction[]) => {
  const entries = await fs.readdir(absDir, { withFileTypes: true });
  for (const entry of entries) {
    const absPath = path.join(absDir, entry.name);
    const relPath = rel(absPath);

    if (isWithin(relPath, anchors)) continue;

    if (entry.isDirectory()) {
      if (ignoreDirs.has(relPath)) continue;
      if (ignoreDirs.has(entry.name)) continue;

      if (isDupeDir(entry.name)) {
        actions.push({
          from: absPath,
          to: path.join(repoRoot, "backup/_shadow_code", relPath),
          kind: "dir",
          category: "code"
        });
        continue;
      }

      await walk(absPath, actions);
      continue;
    }

    if (!entry.isFile()) continue;
    if (!isDupeName(entry.name)) continue;
    if (!isDupeFile(entry.name)) continue;

    const category = classify(entry.name);
    const base = targetBase(category);

    actions.push({
      from: absPath,
      to: path.join(repoRoot, base, relPath),
      kind: "file",
      category
    });
  }
};

const run = async () => {
  const apply = hasFlag("--apply");

  const actions: MoveAction[] = [];
  for (const root of scanRoots) {
    const absRoot = path.join(repoRoot, root);
    if (!(await pathExists(absRoot))) continue;
    await walk(absRoot, actions);
  }

  const counts = actions.reduce(
    (acc, a) => {
      acc.total++;
      acc[a.kind]++;
      acc[a.category]++;
      return acc;
    },
    { total: 0, file: 0, dir: 0, code: 0, docs: 0, artifact: 0 } as Record<string, number>
  );

  if (!apply) {
    process.stdout.write(
      JSON.stringify(
        {
          mode: "dry-run",
          counts,
          sample: actions.slice(0, 50).map((a) => ({
            kind: a.kind,
            category: a.category,
            from: rel(a.from),
            to: rel(a.to)
          }))
        },
        null,
        2
      ) + "\n"
    );
    return;
  }

  for (const action of actions) {
    const absFrom = action.from;
    let absTo = action.to;

    await ensureDir(path.dirname(absTo));
    absTo = await resolveCollision(absTo);
    await fs.rename(absFrom, absTo);
  }

  process.stdout.write(
    JSON.stringify(
      {
        mode: "apply",
        counts,
        moved: actions.length
      },
      null,
      2
    ) + "\n"
  );
};

run().catch((err) => {
  process.stderr.write(String(err instanceof Error ? err.message : err) + "\n");
  process.exitCode = 1;
});

