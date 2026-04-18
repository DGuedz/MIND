import fs from "node:fs/promises";
import path from "node:path";

type Tier = 1 | 2 | 3;
type Args = {
  tier: Tier;
  topic?: string;
  write: boolean;
};

const ROOT = process.cwd();
const SPEC_DIR = path.join(ROOT, "governance", "spec_runtime");

const FILES = {
  index: path.join(SPEC_DIR, "mind_index.md"),
  thesis: path.join(SPEC_DIR, "thesis.md"),
  revenue: path.join(SPEC_DIR, "revenue_model.md"),
  pitch: path.join(SPEC_DIR, "pitch_hackathon.md"),
  execution: path.join(SPEC_DIR, "execution_checklist.md"),
  skills: path.join(SPEC_DIR, "skills_map.md")
} as const;

const parseArgs = (): Args => {
  const raw = process.argv.slice(2);
  const lookup = Object.fromEntries(
    raw
      .filter((v) => v.startsWith("--"))
      .map((v) => {
        const [k, ...rest] = v.slice(2).split("=");
        return [k, rest.join("=") || "true"];
      })
  );
  const tierRaw = Number(lookup.tier ?? "1");
  const tier: Tier = tierRaw === 2 ? 2 : tierRaw === 3 ? 3 : 1;
  const write = lookup.write !== "false";
  const topic = typeof lookup.topic === "string" ? lookup.topic.trim().toLowerCase() : undefined;
  return { tier, topic, write };
};

const read = async (file: string) => fs.readFile(file, "utf8");

const compact = (content: string, maxChars: number) => {
  if (content.length <= maxChars) return content;
  return `${content.slice(0, maxChars)}\n\n[truncated ${content.length - maxChars} chars]`;
};

const topicToFile = (topic?: string): string | null => {
  if (!topic) return null;
  if (topic.includes("revenue") || topic.includes("monet")) return FILES.revenue;
  if (topic.includes("pitch") || topic.includes("demo")) return FILES.pitch;
  if (topic.includes("exec") || topic.includes("roadmap") || topic.includes("checklist")) return FILES.execution;
  if (topic.includes("thesis") || topic.includes("position")) return FILES.thesis;
  if (topic.includes("skill")) return FILES.skills;
  if (topic.includes("index")) return FILES.index;
  return null;
};

async function main() {
  const args = parseArgs();
  const index = await read(FILES.index);
  const thesis = await read(FILES.thesis);
  const revenue = await read(FILES.revenue);
  const pitch = await read(FILES.pitch);
  const execution = await read(FILES.execution);
  const skills = await read(FILES.skills);

  const selectedTopicFile = topicToFile(args.topic);
  const now = new Date().toISOString();
  let context = "";
  let selectedFiles: string[] = [];

  if (args.tier === 1) {
    context = [
      "# Tier 1 Context",
      "",
      "## Index",
      compact(index, 1200),
      "",
      "## Core Summaries",
      compact(thesis, 700),
      "",
      compact(revenue, 700),
      "",
      compact(pitch, 700),
      "",
      compact(execution, 700)
    ].join("\n");
    selectedFiles = [FILES.index, FILES.thesis, FILES.revenue, FILES.pitch, FILES.execution];
  } else if (args.tier === 2) {
    const topicDoc = selectedTopicFile ? await read(selectedTopicFile) : "";
    context = [
      "# Tier 2 Context",
      "",
      "## Index",
      compact(index, 1200),
      "",
      "## Topic Context",
      selectedTopicFile ? topicDoc : "No topic matched. Use --topic=revenue|pitch|execution|thesis|skills."
    ].join("\n");
    selectedFiles = selectedTopicFile ? [FILES.index, selectedTopicFile] : [FILES.index];
  } else {
    context = [
      "# Tier 3 Context",
      "",
      "## Index",
      index,
      "",
      "## Thesis",
      thesis,
      "",
      "## Revenue",
      revenue,
      "",
      "## Pitch",
      pitch,
      "",
      "## Execution",
      execution,
      "",
      "## Skills",
      skills
    ].join("\n");
    selectedFiles = [FILES.index, FILES.thesis, FILES.revenue, FILES.pitch, FILES.execution, FILES.skills];
  }

  let outputFile: string | null = null;
  if (args.write) {
    const artifactsDir = path.join(ROOT, "artifacts");
    await fs.mkdir(artifactsDir, { recursive: true });
    outputFile = path.join(artifactsDir, `spec-runtime-context-tier${args.tier}-${now.replace(/[:.]/g, "-")}.md`);
    await fs.writeFile(outputFile, context, "utf8");
  }

  console.log(
    JSON.stringify(
      {
        status: "ok",
        tier: args.tier,
        topic: args.topic ?? null,
        selectedFiles,
        outputFile,
        assembledAt: now
      },
      null,
      2
    )
  );
}

main().catch((error) => {
  console.error("[spec_assemble_context] failed:", error);
  process.exit(1);
});
