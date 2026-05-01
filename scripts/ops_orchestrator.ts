import * as fs from "node:fs";
import * as path from "node:path";

export type OperationChannel = "telegram" | "trae";

export type DecisionContract = {
  decision: "ALLOW" | "BLOCK" | "INSUFFICIENT_EVIDENCE" | "NEEDS_HUMAN_APPROVAL";
  reason_codes: string[];
  confidence: number;
  assumptions: string[];
  required_followups: string[];
  evidence: string[];
};

export type OperationIntent = {
  channel: OperationChannel;
  actorId: string;
  command: string;
  args?: string[];
  chatId?: string;
  metadata?: Record<string, unknown>;
};

const TELEGRAM_ALLOWLIST = new Set([
  "/status",
  "/health",
  "/hermes",
  "/demo_secure_intent",
  "/approve",
  "/reject",
  "/deploy_status",
  "/run_check"
]);

const TELEGRAM_BLOCKLIST = new Set([
  "/deploy_prod",
  "/change_policy",
  "/send_tx",
  "/print_env",
  "/reveal_secret",
  "/disable_guardrails"
]);

const TELEGRAM_NEEDS_APPROVAL = new Set([
  "/deploy_prod",
  "/change_policy",
  "/send_tx"
]);

const TRAE_STRONG_COMMANDS = new Set([
  "pnpm deploy:hermes:hostinger",
  "pnpm validate:hermes:hostinger",
  "pnpm spec:test-event-router-service",
  "pnpm demo:setup-telegram-webhook",
  "pnpm demo:secure-intent",
  "pnpm master-skill list-skills",
  "pnpm agent:router"
]);

const getRepoRoot = () => path.resolve(__dirname, "..");

const getSpecRuntimeDir = () =>
  process.env.OPS_ORCHESTRATOR_SPEC_DIR ??
  path.join(getRepoRoot(), "governance", "spec_runtime");

const parseCsv = (raw: string | undefined): string[] =>
  String(raw ?? "")
    .split(",")
    .map((v) => v.trim())
    .filter(Boolean);

export const isAllowedTelegramChat = (chatId?: string | number): boolean => {
  const internalOnly = process.env.TELEGRAM_INTERNAL_ONLY !== "false";
  if (!internalOnly) return true;

  const normalizedChatId = chatId === undefined || chatId === null ? "" : String(chatId).trim();
  const allowed = parseCsv(process.env.TELEGRAM_ALLOWED_CHAT_IDS);
  if (allowed.length === 0) {
    return false;
  }
  return allowed.includes(normalizedChatId);
};

const writeJsonl = (filename: string, payload: unknown) => {
  const dir = getSpecRuntimeDir();
  fs.mkdirSync(dir, { recursive: true });
  fs.appendFileSync(path.join(dir, filename), `${JSON.stringify(payload)}\n`, "utf8");
};

const normalizeTelegramCommand = (command: string) =>
  String(command || "")
    .trim()
    .toLowerCase()
    .split(/\s+/)[0];

const evaluateTelegramIntent = (intent: OperationIntent): DecisionContract => {
  const normalized = normalizeTelegramCommand(intent.command);
  const chatId = intent.chatId ?? "";

  if (!isAllowedTelegramChat(chatId)) {
    return {
      decision: "BLOCK",
      reason_codes: ["RC_POLICY_VIOLATION", "RC_UNTRUSTED_OVERRIDE_ATTEMPT"],
      confidence: 0.99,
      assumptions: ["Telegram deve operar apenas em chat interno allowlisted"],
      required_followups: ["Adicionar chat_id em TELEGRAM_ALLOWED_CHAT_IDS para liberar acesso"],
      evidence: [`channel=telegram`, `chat_id=${chatId || "missing"}`, `command=${normalized}`]
    };
  }

  if (TELEGRAM_BLOCKLIST.has(normalized)) {
    return {
      decision: "BLOCK",
      reason_codes: ["RC_POLICY_VIOLATION"],
      confidence: 0.99,
      assumptions: ["Comando proibido no canal Telegram"],
      required_followups: ["Executar somente via Trae IDE com checagem de policy"],
      evidence: [`channel=telegram`, `command=${normalized}`, "rule=telegram_blocklist"]
    };
  }

  if (TELEGRAM_NEEDS_APPROVAL.has(normalized)) {
    return {
      decision: "NEEDS_HUMAN_APPROVAL",
      reason_codes: ["RC_HIGH_RISK_NO_APPROVAL"],
      confidence: 0.96,
      assumptions: ["Comando sensivel nao pode executar sem aprovacao humana explicita"],
      required_followups: ["Registrar approvalId e aprovar em canal humano autorizado"],
      evidence: [`channel=telegram`, `command=${normalized}`, "rule=sensitive_command"]
    };
  }

  if (!TELEGRAM_ALLOWLIST.has(normalized)) {
    return {
      decision: "BLOCK",
      reason_codes: ["RC_POLICY_VIOLATION"],
      confidence: 0.95,
      assumptions: ["Apenas comandos whitelisted sao permitidos no Telegram interno"],
      required_followups: ["Usar um comando permitido ou atualizar whitelist com aprovacao humana"],
      evidence: [`channel=telegram`, `command=${normalized}`, "rule=allowlist_only"]
    };
  }

  return {
    decision: "ALLOW",
    reason_codes: [],
    confidence: 0.93,
    assumptions: ["Comando de operacao leve permitido em Telegram interno"],
    required_followups: [],
    evidence: [`channel=telegram`, `chat_id=${chatId}`, `command=${normalized}`]
  };
};

const evaluateTraeIntent = (intent: OperationIntent): DecisionContract => {
  const normalizedCommand = String(intent.command || "").trim();
  if (!normalizedCommand) {
    return {
      decision: "INSUFFICIENT_EVIDENCE",
      reason_codes: ["RC_MISSING_EVIDENCE"],
      confidence: 0.9,
      assumptions: ["Comando vazio nao pode ser roteado"],
      required_followups: ["Fornecer comando pnpm explicito"],
      evidence: ["channel=trae", "command=missing"]
    };
  }

  if (!TRAE_STRONG_COMMANDS.has(normalizedCommand)) {
    return {
      decision: "INSUFFICIENT_EVIDENCE",
      reason_codes: ["RC_MISSING_EVIDENCE"],
      confidence: 0.88,
      assumptions: ["Comando fora do escopo operacional atual"],
      required_followups: ["Registrar comando no catalogo de operacoes aprovadas"],
      evidence: ["channel=trae", `command=${normalizedCommand}`, "rule=approved_catalog_only"]
    };
  }

  const requiresApproval =
    normalizedCommand.includes("deploy:hermes:hostinger") ||
    normalizedCommand.includes("send_tx");

  if (requiresApproval && process.env.HUMAN_APPROVED !== "true") {
    return {
      decision: "NEEDS_HUMAN_APPROVAL",
      reason_codes: ["RC_HIGH_RISK_NO_APPROVAL"],
      confidence: 0.95,
      assumptions: ["Deploy/acao sensivel exige gate humano"],
      required_followups: ["Setar HUMAN_APPROVED=true somente apos aprovacao formal"],
      evidence: ["channel=trae", `command=${normalizedCommand}`, "gate=human_approval"]
    };
  }

  return {
    decision: "ALLOW",
    reason_codes: [],
    confidence: 0.94,
    assumptions: ["Comando operacional permitido no cockpit Trae IDE"],
    required_followups: [],
    evidence: ["channel=trae", `command=${normalizedCommand}`]
  };
};

export const evaluateOperationIntent = (intent: OperationIntent): DecisionContract => {
  const now = new Date().toISOString();
  writeJsonl("ops_intents.jsonl", {
    at: now,
    intent
  });

  const decision =
    intent.channel === "telegram"
      ? evaluateTelegramIntent(intent)
      : evaluateTraeIntent(intent);

  writeJsonl("ops_outcomes.jsonl", {
    at: now,
    actorId: intent.actorId,
    channel: intent.channel,
    command: intent.command,
    decision
  });

  return decision;
};

const parseCliArgs = (argv: string[]) => {
  const map = new Map<string, string>();
  for (const token of argv) {
    if (!token.startsWith("--")) continue;
    const [key, ...rest] = token.slice(2).split("=");
    map.set(key, rest.join("="));
  }
  return map;
};

if (import.meta.url === `file://${process.argv[1]}`) {
  const args = parseCliArgs(process.argv.slice(2));
  const channel = (args.get("channel") ?? "telegram") as OperationChannel;
  const command = args.get("command") ?? "";
  const chatId = args.get("chat-id");
  const actorId = args.get("actor-id") ?? "ops_orchestrator_cli";
  const intent: OperationIntent = {
    channel,
    actorId,
    command,
    chatId,
    args: parseCsv(args.get("args"))
  };
  const result = evaluateOperationIntent(intent);
  console.log(JSON.stringify(result, null, 2));
}
