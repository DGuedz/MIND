import fs from "node:fs/promises";
import path from "node:path";

type JsonRecord = Record<string, unknown>;

const ROOT = process.cwd();
const ARTIFACTS_DIR = path.join(ROOT, "artifacts");
const UPDATES_DIR = path.join(ARTIFACTS_DIR, "colosseum_updates");
const OUT_FILE = path.join(ROOT, "governance", "COLOSSEUM_WEEKLY_PERFORMANCE_REPORT_AUTO.md");

const now = new Date();
const nowIso = () => new Date().toISOString();

const readJson = async <T>(filePath: string, fallback: T): Promise<T> => {
  try {
    return JSON.parse(await fs.readFile(filePath, "utf8")) as T;
  } catch {
    return fallback;
  }
};

const listJsonFilesNewestFirst = async (dirPath: string): Promise<string[]> => {
  try {
    const entries = await fs.readdir(dirPath, { withFileTypes: true });
    const files = entries.filter((e) => e.isFile() && e.name.endsWith(".json")).map((e) => path.join(dirPath, e.name));
    const withStats = await Promise.all(files.map(async (p) => ({ p, st: await fs.stat(p) })));
    withStats.sort((a, b) => b.st.mtimeMs - a.st.mtimeMs);
    return withStats.map((x) => x.p);
  } catch {
    return [];
  }
};

const latestByPrefix = async (prefix: string): Promise<string | null> => {
  try {
    const entries = await fs.readdir(ARTIFACTS_DIR, { withFileTypes: true });
    const matches = entries.filter((e) => e.name.startsWith(prefix));
    if (matches.length === 0) return null;
    const withStats = await Promise.all(
      matches.map(async (e) => {
        const full = path.join(ARTIFACTS_DIR, e.name);
        const st = await fs.stat(full);
        return { full, mtimeMs: st.mtimeMs };
      })
    );
    withStats.sort((a, b) => b.mtimeMs - a.mtimeMs);
    return withStats[0]?.full ?? null;
  } catch {
    return null;
  }
};

const rel = (p: string) => path.relative(ROOT, p).replace(/\\/g, "/");

const toDecision = (gate: { currentGate?: { decision?: string | null } } | null) => {
  const d = gate?.currentGate?.decision ?? null;
  if (d === "GO") return "ALLOW";
  if (d === "NO_GO") return "BLOCK";
  return "INSUFFICIENT_EVIDENCE";
};

async function main() {
  const generatedAt = nowIso();
  const sevenDaysAgoMs = now.getTime() - 7 * 24 * 60 * 60 * 1000;

  const updates = await listJsonFilesNewestFirst(UPDATES_DIR);
  const weeklyUpdates: Array<{ file: string; report: JsonRecord }> = [];
  for (const file of updates) {
    const st = await fs.stat(file);
    if (st.mtimeMs < sevenDaysAgoMs) break;
    weeklyUpdates.push({ file, report: await readJson<JsonRecord>(file, {}) });
  }

  const latestInstallDir = await latestByPrefix("install-and-test-");
  const latestInstallReport = latestInstallDir ? path.join(latestInstallDir, "install_and_test_report.json") : null;
  const install = latestInstallReport ? await readJson<JsonRecord>(latestInstallReport, {}) : null;

  const latestStrict = await latestByPrefix("strict-mode-go-no-go-");
  const strict = latestStrict ? await readJson<JsonRecord>(latestStrict, {}) : null;

  const latestRuntime = await latestByPrefix("runtime-metrics-");
  const runtime = latestRuntime ? await readJson<JsonRecord>(latestRuntime, {}) : null;

  const lastUpdate = weeklyUpdates[0]?.report ?? null;
  const decision = toDecision(lastUpdate as any);

  const reasonCodes: string[] = [];
  if (decision !== "ALLOW") reasonCodes.push("RC_MISSING_EVIDENCE");
  if (install && String(install.overall ?? "") === "FAIL") reasonCodes.push("RC_TOOL_FAILURE");

  const evidence = [
    weeklyUpdates[0]?.file ? rel(weeklyUpdates[0].file) : null,
    latestInstallReport ? rel(latestInstallReport) : null,
    latestStrict ? rel(latestStrict) : null,
    latestRuntime ? rel(latestRuntime) : null,
    "scripts/colosseum_update_log.ts",
    "services/market-context-service/src/adapters/colosseum.ts"
  ].filter((v): v is string => Boolean(v));

  const header = `# MIND Weekly Performance Report (Auto Snapshot)\n\nGenerated at: ${generatedAt} UTC\nWindow: last 7 days (by artifact mtime)\n\n`;
  const contract = {
    decision,
    reason_codes: reasonCodes,
    confidence: decision === "ALLOW" ? 0.85 : 0.99,
    assumptions: ["This file is derived from local artifacts and does not imply on-chain testnet proof."],
    required_followups: decision === "ALLOW" ? [] : ["Run strict stack from a clean, non-iCloud checkout and refresh Copilot auth."],
    evidence
  };

  const lines: string[] = [];
  lines.push(header);
  lines.push("```json");
  lines.push(JSON.stringify(contract, null, 2));
  lines.push("```\n");

  lines.push("## Weekly Cadence");
  lines.push(`Updates in last 7 days: ${weeklyUpdates.length}`);
  if (weeklyUpdates.length > 0) {
    lines.push("\nRecent updates:");
    for (const u of weeklyUpdates.slice(0, 10)) {
      const when = String(u.report.generatedAt ?? "unknown");
      const phase = String(u.report.phase ?? "unknown");
      const status = String(u.report.status ?? "unknown");
      lines.push(`- ${when} | ${phase} | ${status} | ${rel(u.file)}`);
    }
  }

  lines.push("\n## Gates (Latest)");
  lines.push(`Install+Test strict stack: ${install ? String(install.overall ?? "UNKNOWN") : "UNKNOWN"}`);
  lines.push(`Strict go/no-go: ${strict ? String(strict.decision ?? "UNKNOWN") : "UNKNOWN"}`);
  lines.push(`Runtime metrics snapshot: ${runtime ? String(runtime.generated_at ?? "UNKNOWN") : "UNKNOWN"}`);

  await fs.mkdir(path.dirname(OUT_FILE), { recursive: true });
  await fs.writeFile(OUT_FILE, lines.join("\n") + "\n", "utf8");

  console.log(JSON.stringify({ status: "ok", outputFile: rel(OUT_FILE) }, null, 2));
}

main().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error("[colosseum_weekly_performance_report] failed:", message);
  process.exit(1);
});

