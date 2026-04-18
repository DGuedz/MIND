import { config } from "dotenv";
import { randomBytes } from "node:crypto";
import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

config({ override: true });

type Decision = "GO" | "NO_GO";
type ReasonCode =
  | "RC_POLICY_VIOLATION"
  | "RC_PROMPT_INJECTION"
  | "RC_SECRET_EXFIL_ATTEMPT"
  | "RC_UNTRUSTED_OVERRIDE_ATTEMPT"
  | "RC_MISSING_EVIDENCE"
  | "RC_HIGH_RISK_NO_APPROVAL"
  | "RC_TOOL_FAILURE"
  | "RC_RATE_LIMIT_OR_RPC_BLOCKED";

type VerifyResponse = {
  verified?: boolean;
  internalVerified?: boolean;
  strictMetaplexAnchor?: boolean;
  externalAnchorStatus?: "pending" | "confirmed" | "failed";
  externalProvider?: string | null;
  metaplexConfirmed?: boolean;
  metaplexProofTx?: string | null;
  metaplexRegistryRef?: string | null;
  metaplex_proof_tx?: string | null;
  metaplex_registry_ref?: string | null;
  reason?: string | null;
};

type DemoOutput = {
  proofVerified?: boolean;
  externalAnchorStatus?: "pending" | "confirmed" | "failed" | null;
  metaplexConfirmed?: boolean | null;
  metaplexProofTx?: string | null;
  metaplex_proof_tx?: string | null;
  strictModeEffective?: boolean | null;
  strictModeLocal?: boolean;
  decision?: string | null;
  error?: string;
};

const API_GATEWAY_URL = process.env.API_GATEWAY_URL ?? "http://localhost:3000";
const PROOF_SERVICE_URL = process.env.PROOF_SERVICE_URL ?? "http://localhost:3005";

const METAPLEX_PROOF_ENDPOINT = process.env.METAPLEX_PROOF_ENDPOINT?.trim() ?? "";
const METAPLEX_PROOF_AUTH = process.env.METAPLEX_PROOF_AUTH?.trim() ?? "";
const METAPLEX_REGISTRY_ENDPOINT = process.env.METAPLEX_REGISTRY_ENDPOINT?.trim() ?? "";
const STRICT_ENV_VALUE = (process.env.STRICT_METAPLEX_ANCHOR ?? "").trim();

const nowIso = () => new Date().toISOString();

const httpJson = async <T>(
  method: "GET" | "POST",
  url: string,
  body?: unknown
): Promise<{ status: number; data: T }> => {
  const response = await fetch(url, {
    method,
    headers: {
      "content-type": "application/json"
    },
    body: body === undefined ? undefined : JSON.stringify(body)
  });

  const raw = await response.text();
  const data = raw ? (JSON.parse(raw) as T) : ({} as T);

  if (!response.ok) {
    throw new Error(`http_${method}_${url}_failed_${response.status}`);
  }

  return { status: response.status, data };
};

const randomHash = () => randomBytes(32).toString("hex");

const createAndVerifyProof = async (input: {
  externalAnchorStatus?: "pending" | "confirmed" | "failed";
  metaplex_proof_tx?: string;
  metaplex_registry_ref?: string;
}) => {
  const anchors = [
    { type: "strict_check_anchor", hash: randomHash() },
    { type: "strict_check_route", hash: randomHash() }
  ];

  const compose = await httpJson<{ proofId: string }>("POST", `${PROOF_SERVICE_URL}/v1/proofs/compose`, {
    intentId: `strict-go-no-go-${Date.now()}-${Math.floor(Math.random() * 100000)}`,
    anchors,
    ...input
  });

  const verify = await httpJson<VerifyResponse>(
    "POST",
    `${API_GATEWAY_URL}/v1/proofs/${compose.data.proofId}/verify`,
    { anchors }
  );

  return {
    proofId: compose.data.proofId,
    verify: verify.data
  };
};

const runDemoFlow = async (): Promise<{
  ok: boolean;
  exitCode: number;
  output: DemoOutput | null;
  parseError: string | null;
  stdoutTail: string;
  stderrTail: string;
}> => {
  return new Promise((resolve) => {
    const child = spawn("pnpm", ["exec", "tsx", "scripts/demo_a2a_value_flow.ts"], {
      cwd: process.cwd(),
      env: process.env,
      stdio: ["ignore", "pipe", "pipe"]
    });

    let stdout = "";
    let stderr = "";

    child.stdout.on("data", (chunk) => {
      stdout += chunk.toString();
    });
    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });

    child.on("close", (code) => {
      const cleaned = stdout.trim();
      const jsonStart = cleaned.lastIndexOf("\n{");
      const candidate = jsonStart >= 0 ? cleaned.slice(jsonStart + 1).trim() : cleaned;
      let parsed: DemoOutput | null = null;
      let parseError: string | null = null;

      try {
        parsed = JSON.parse(candidate) as DemoOutput;
      } catch {
        parseError = "unable_to_parse_demo_json_output";
      }

      resolve({
        ok: code === 0 && parsed !== null,
        exitCode: code ?? 1,
        output: parsed,
        parseError,
        stdoutTail: stdout.split("\n").slice(-40).join("\n"),
        stderrTail: stderr.split("\n").slice(-40).join("\n")
      });
    });
  });
};

const run = async () => {
  const generatedAt = nowIso();
  const reasonCodes = new Set<ReasonCode>();
  const requiredFollowups = new Set<string>();
  const evidence: string[] = [];

  let health: unknown = null;
  let healthOk = false;
  try {
    const healthResp = await httpJson<{ status?: string; services?: Array<{ name: string; status: string }> }>(
      "GET",
      `${API_GATEWAY_URL}/v1/health/services`
    );
    health = healthResp.data;
    healthOk =
      healthResp.data.status === "ok" &&
      Array.isArray(healthResp.data.services) &&
      healthResp.data.services.every((service) => service.status === "ok");
    if (healthOk) {
      evidence.push("All local services reported healthy via /v1/health/services.");
    } else {
      reasonCodes.add("RC_TOOL_FAILURE");
      requiredFollowups.add("Bring all services to status=ok before strict gate validation.");
    }
  } catch (error) {
    reasonCodes.add("RC_TOOL_FAILURE");
    requiredFollowups.add("Start API/proof services and rerun strict gate validation.");
    evidence.push(`Health check failed: ${error instanceof Error ? error.message : String(error)}`);
  }

  const envConfigured = {
    metaplexProofEndpointConfigured: METAPLEX_PROOF_ENDPOINT.length > 0,
    metaplexProofAuthConfigured: METAPLEX_PROOF_AUTH.length > 0,
    strictEnvValue: STRICT_ENV_VALUE || null
  };

  if (!envConfigured.metaplexProofEndpointConfigured || !envConfigured.metaplexProofAuthConfigured) {
    reasonCodes.add("RC_MISSING_EVIDENCE");
    requiredFollowups.add("Set METAPLEX_PROOF_ENDPOINT and METAPLEX_PROOF_AUTH.");
  }

  const pendingCheck = await createAndVerifyProof({});
  const confirmedCheck = await createAndVerifyProof({
    externalAnchorStatus: "confirmed",
    metaplex_proof_tx: `strict-check-${Date.now()}`,
    metaplex_registry_ref: METAPLEX_REGISTRY_ENDPOINT || "metaplex://strict-check"
  });

  const strictEffective = pendingCheck.verify.strictMetaplexAnchor === true;
  const pendingBlocked =
    pendingCheck.verify.externalAnchorStatus === "pending" &&
    pendingCheck.verify.verified === false;
  const confirmedAllowed =
    confirmedCheck.verify.externalAnchorStatus === "confirmed" &&
    confirmedCheck.verify.metaplexConfirmed === true &&
    confirmedCheck.verify.verified === true;

  if (!strictEffective) {
    reasonCodes.add("RC_MISSING_EVIDENCE");
    requiredFollowups.add("Run proof-service with STRICT_METAPLEX_ANCHOR=true for promotion checks.");
  }

  if (!pendingBlocked || !confirmedAllowed) {
    reasonCodes.add("RC_POLICY_VIOLATION");
    requiredFollowups.add("Fix strict gating behavior: pending must block, confirmed must allow.");
  }

  const demoRun = await runDemoFlow();
  const demoOutput = demoRun.output;
  const demoMetaplexTx = demoOutput?.metaplexProofTx ?? demoOutput?.metaplex_proof_tx ?? null;
  const demoExternalConfirmed =
    demoOutput?.externalAnchorStatus === "confirmed" &&
    demoOutput?.metaplexConfirmed === true &&
    Boolean(demoMetaplexTx);

  if (!demoRun.ok) {
    reasonCodes.add("RC_TOOL_FAILURE");
    requiredFollowups.add("Fix demo flow execution before promotion.");
  } else {
    evidence.push(`Demo flow executed with decision=${demoOutput?.decision ?? "unknown"}.`);
  }

  if (!demoExternalConfirmed) {
    reasonCodes.add("RC_MISSING_EVIDENCE");
    requiredFollowups.add(
      "Provide real external anchor evidence in demo output: externalAnchorStatus=confirmed + metaplexProofTx."
    );
  }

  const allChecksPassed =
    healthOk &&
    envConfigured.metaplexProofEndpointConfigured &&
    envConfigured.metaplexProofAuthConfigured &&
    strictEffective &&
    pendingBlocked &&
    confirmedAllowed &&
    demoRun.ok &&
    demoOutput?.proofVerified === true &&
    demoExternalConfirmed;

  const decision: Decision = allChecksPassed ? "GO" : "NO_GO";
  if (decision === "GO") {
    evidence.push("Strict behavior and real external proof outcomes meet promotion gate.");
  } else {
    evidence.push("Promotion gate not satisfied; keep STRICT_METAPLEX_ANCHOR default disabled.");
  }

  const confidence = allChecksPassed ? 0.95 : 0.99;

  const report = {
    reportType: "strict_metaplex_go_no_go",
    generatedAt,
    decision,
    decisionContract: {
      decision: decision === "GO" ? "ALLOW" : "BLOCK",
      reason_codes: Array.from(reasonCodes),
      confidence,
      assumptions: [
        "Promotion means enabling strict external anchor mode by default in target environment."
      ],
      required_followups: Array.from(requiredFollowups),
      evidence
    },
    checks: {
      env: envConfigured,
      health,
      strictBehavior: {
        strictEffective,
        pendingCheck: {
          proofId: pendingCheck.proofId,
          verified: pendingCheck.verify.verified ?? null,
          internalVerified: pendingCheck.verify.internalVerified ?? null,
          externalAnchorStatus: pendingCheck.verify.externalAnchorStatus ?? null,
          metaplexConfirmed: pendingCheck.verify.metaplexConfirmed ?? null,
          reason: pendingCheck.verify.reason ?? null
        },
        confirmedCheck: {
          proofId: confirmedCheck.proofId,
          verified: confirmedCheck.verify.verified ?? null,
          internalVerified: confirmedCheck.verify.internalVerified ?? null,
          externalAnchorStatus: confirmedCheck.verify.externalAnchorStatus ?? null,
          metaplexConfirmed: confirmedCheck.verify.metaplexConfirmed ?? null,
          reason: confirmedCheck.verify.reason ?? null
        }
      },
      finalProofOutcome: {
        demoExitCode: demoRun.exitCode,
        demoParseError: demoRun.parseError,
        proofVerified: demoOutput?.proofVerified ?? null,
        externalAnchorStatus: demoOutput?.externalAnchorStatus ?? null,
        metaplexConfirmed: demoOutput?.metaplexConfirmed ?? null,
        metaplexProofTxPresent: Boolean(demoMetaplexTx),
        strictModeLocal: demoOutput?.strictModeLocal ?? null,
        strictModeEffective: demoOutput?.strictModeEffective ?? null,
        demoStdoutTail: demoRun.stdoutTail,
        demoStderrTail: demoRun.stderrTail
      }
    }
  };

  const outputDir = path.join(process.cwd(), "artifacts");
  fs.mkdirSync(outputDir, { recursive: true });
  const fileStamp = generatedAt.replace(/[:.]/g, "-");
  const reportPath = path.join(outputDir, `strict-mode-go-no-go-${fileStamp}.json`);
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

  console.log(`[strict-go-no-go] decision=${decision}`);
  console.log(`[strict-go-no-go] report=${reportPath}`);
  console.log(JSON.stringify(report, null, 2));

  if (decision !== "GO") {
    process.exitCode = 1;
  }
};

run().catch((error) => {
  const report = {
    reportType: "strict_metaplex_go_no_go",
    generatedAt: nowIso(),
    decision: "NO_GO",
    decisionContract: {
      decision: "BLOCK",
      reason_codes: ["RC_TOOL_FAILURE"],
      confidence: 0.99,
      assumptions: [],
      required_followups: ["Fix strict go/no-go script runtime failure and rerun."],
      evidence: [error instanceof Error ? error.message : String(error)]
    }
  };
  const outputDir = path.join(process.cwd(), "artifacts");
  fs.mkdirSync(outputDir, { recursive: true });
  const fileStamp = report.generatedAt.replace(/[:.]/g, "-");
  const reportPath = path.join(outputDir, `strict-mode-go-no-go-${fileStamp}.json`);
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(`[strict-go-no-go] decision=NO_GO`);
  console.log(`[strict-go-no-go] report=${reportPath}`);
  console.log(JSON.stringify(report, null, 2));
  process.exitCode = 1;
});
