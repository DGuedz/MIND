import fs from "node:fs/promises";
import path from "node:path";

type Severity = "high" | "medium" | "low";

type LintIssue = {
  file: string;
  line: number;
  severity: Severity;
  code: string;
  message: string;
  excerpt: string;
};

const ROOT = process.cwd();
const SPEC_DIR = path.join(ROOT, "governance", "spec_runtime");

const FILES = [
  "thesis.md",
  "revenue_model.md",
  "pitch_hackathon.md",
  "execution_checklist.md",
  "mind_index.md",
  "skills_map.md",
  "PROMPT_ZERO_SPEC_DRIVEN.md"
].map((name) => path.join(SPEC_DIR, name));

const ABSOLUTE_PATTERNS = [
  { regex: /\bguaranteed?\b/i, code: "ABSOLUTE_GUARANTEE", message: "Avoid guarantee claims." },
  { regex: /\bzero slippage\b/i, code: "ABSOLUTE_ZERO_SLIPPAGE", message: "Avoid absolute slippage claims." },
  { regex: /\bperfect safety\b/i, code: "ABSOLUTE_PERFECT_SAFETY", message: "Avoid absolute safety claims." },
  { regex: /\bsem risco\b/i, code: "ABSOLUTE_NO_RISK", message: "Avoid no-risk claims." }
];

const VALUE_CLAIM_REGEX = /\b(capture|captures|capturar|captura|improve|improves|reduce|reduces|reduz|reduzir)\b/i;
const EVIDENCE_HINT_REGEX =
  /\b(\d+(\.\d+)?\s?(%|bps|ms|sol)|bps|ms|ev|ev_net|proof|report|artifact|tx|hash|rate)\b/i;

const strictMode = process.argv.includes("--strict");

const lintFile = async (file: string): Promise<LintIssue[]> => {
  const raw = await fs.readFile(file, "utf8");
  const lines = raw.split(/\r?\n/);
  const issues: LintIssue[] = [];
  let inDisallowedClaimsBlock = false;

  lines.forEach((line, idx) => {
    const lineNo = idx + 1;
    const trimmed = line.trim();
    if (/^##?\s*claims policy/i.test(trimmed) || /^do not claim:?$/i.test(trimmed)) {
      inDisallowedClaimsBlock = true;
    } else if (/^##\s+/.test(trimmed)) {
      inDisallowedClaimsBlock = false;
    }

    const lineIsProhibitionExample =
      inDisallowedClaimsBlock || /^-\s*(do not|avoid)\b/i.test(trimmed) || /^do not\b/i.test(trimmed);

    for (const rule of ABSOLUTE_PATTERNS) {
      if (rule.regex.test(line) && !lineIsProhibitionExample) {
        issues.push({
          file,
          line: lineNo,
          severity: "high",
          code: rule.code,
          message: rule.message,
          excerpt: line.trim()
        });
      }
    }

    if (VALUE_CLAIM_REGEX.test(line) && !EVIDENCE_HINT_REGEX.test(line) && !lineIsProhibitionExample) {
      issues.push({
        file,
        line: lineNo,
        severity: "medium",
        code: "CLAIM_WITHOUT_EVIDENCE_HINT",
        message: "Value claim has no explicit metric or evidence hint.",
        excerpt: line.trim()
      });
    }
  });

  return issues;
};

async function main() {
  const allIssues = (await Promise.all(FILES.map((file) => lintFile(file)))).flat();
  const high = allIssues.filter((i) => i.severity === "high").length;
  const medium = allIssues.filter((i) => i.severity === "medium").length;
  const low = allIssues.filter((i) => i.severity === "low").length;

  const output = {
    status: high === 0 ? "pass" : "fail",
    strictMode,
    summary: {
      filesScanned: FILES.length,
      high,
      medium,
      low,
      total: allIssues.length
    },
    issues: allIssues
  };

  console.log(JSON.stringify(output, null, 2));
  if ((strictMode && high > 0) || high > 0) {
    process.exit(1);
  }
}

main().catch((error) => {
  console.error("[spec_lint_claims] failed:", error);
  process.exit(1);
});
