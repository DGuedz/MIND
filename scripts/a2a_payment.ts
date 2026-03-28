import {
  Connection,
  Keypair,
  LAMPORTS_PER_SOL,
  PublicKey,
  sendAndConfirmTransaction,
  SystemProgram,
  Transaction,
  TransactionInstruction
} from "@solana/web3.js";
import { createHash } from "node:crypto";
import bs58 from "bs58";
import * as dotenv from "dotenv";

dotenv.config();

type DecisionCode = "ALLOW" | "BLOCK" | "INSUFFICIENT_EVIDENCE" | "NEEDS_HUMAN_APPROVAL";
type ReasonCode =
  | "RC_POLICY_VIOLATION"
  | "RC_PROMPT_INJECTION"
  | "RC_SECRET_EXFIL_ATTEMPT"
  | "RC_UNTRUSTED_OVERRIDE_ATTEMPT"
  | "RC_MISSING_EVIDENCE"
  | "RC_HIGH_RISK_NO_APPROVAL"
  | "RC_TOOL_FAILURE"
  | "RC_RATE_LIMIT_OR_RPC_BLOCKED";
type SettlementMode = "dry-run" | "real";

type DecisionArtifacts = {
  txHash?: string;
  explorerUrl?: string;
  receiptHash?: string;
  metaplexProofTxHash?: string;
  metaplexProofStatusCode?: number;
};

export interface DecisionContract {
  decision: DecisionCode;
  reason_codes: ReasonCode[];
  confidence: number;
  assumptions: string[];
  required_followups: string[];
  evidence: string[];
  artifacts?: DecisionArtifacts;
}

type SettlementInput = {
  targetPubkey: string;
  amountSol: number;
  contextMemo: string;
  mode?: SettlementMode;
  humanApproved?: boolean;
  intentId?: string;
};

type MetaplexProofInput = {
  intentId: string;
  settlementTxHash: string;
  settlementMemo: string;
  payerWallet: string;
  receiverWallet: string;
  amountSol: number;
  network: string;
};

type MetaplexProofResult =
  | { status: "anchored"; statusCode: number; receiptHash: string; proofTxHash?: string }
  | { status: "skipped"; reason: "missing_endpoint"; receiptHash: string }
  | { status: "failed"; reason: "http_error" | "request_error"; statusCode?: number; detail: string; receiptHash: string };

const MEMO_PROGRAM_ID = new PublicKey("MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr");
const DEFAULT_SOLANA_NETWORK = process.env.SOLANA_NETWORK ?? "mainnet-beta";
const DEFAULT_RPC_URL =
  process.env.HELIUS_RPC_URL ??
  (DEFAULT_SOLANA_NETWORK === "mainnet-beta" ? "https://api.mainnet-beta.solana.com" : "https://api.devnet.solana.com");
const MAX_X402_PAYMENT_SOL = Number(process.env.X402_MAX_PAYMENT_SOL ?? "0.05");
const REQUIRED_MIN_BALANCE_SOL = Number(process.env.X402_REQUIRED_MIN_BALANCE_SOL ?? "0.01");
const REQUIRE_HUMAN_APPROVAL_FOR_REAL_TX = (process.env.X402_REQUIRE_HUMAN_APPROVAL_FOR_REAL_TX ?? "true") !== "false";

const canonicalize = (value: unknown): string => {
  if (value === null || value === undefined) return "null";
  if (Array.isArray(value)) return `[${value.map((item) => canonicalize(item)).join(",")}]`;
  if (typeof value === "object") {
    const obj = value as Record<string, unknown>;
    const keys = Object.keys(obj).sort();
    return `{${keys.map((key) => `${JSON.stringify(key)}:${canonicalize(obj[key])}`).join(",")}}`;
  }
  return JSON.stringify(value);
};

const toHash = (value: unknown): string => createHash("sha256").update(canonicalize(value)).digest("hex");

const parseJsonSafe = (value: string): Record<string, unknown> | undefined => {
  try {
    return JSON.parse(value) as Record<string, unknown>;
  } catch {
    return undefined;
  }
};

const parseCliArgs = () => {
  const args = process.argv.slice(2);
  const parsed: Record<string, string> = {};
  for (const arg of args) {
    if (!arg.startsWith("--")) continue;
    const [k, ...rest] = arg.slice(2).split("=");
    parsed[k] = rest.length ? rest.join("=") : "true";
  }
  return parsed;
};

const parseBool = (value: string | undefined, fallback = false): boolean => {
  if (value === undefined) return fallback;
  return value === "1" || value.toLowerCase() === "true" || value.toLowerCase() === "yes";
};

const parseAmount = (value: string | undefined, fallback: number): number => {
  if (!value) return fallback;
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : Number.NaN;
};

const buildExplorerUrl = (txHash: string, network: string): string => {
  const cluster = network === "mainnet-beta" ? "" : `?cluster=${network}`;
  return `https://explorer.solana.com/tx/${txHash}${cluster}`;
};

const decodeSigner = (envKey: string): Keypair => {
  const secretKey = envKey.trim().startsWith("[")
    ? new Uint8Array(JSON.parse(envKey))
    : bs58.decode(envKey);
  return Keypair.fromSecretKey(secretKey);
};

const submitMetaplexProof = async (input: MetaplexProofInput): Promise<MetaplexProofResult> => {
  const payload = {
    intentId: input.intentId,
    settlement: {
      txHash: input.settlementTxHash,
      memo: input.settlementMemo,
      payerWallet: input.payerWallet,
      receiverWallet: input.receiverWallet,
      amountSol: input.amountSol,
      network: input.network,
      timestamp: new Date().toISOString()
    }
  };
  const receiptHash = toHash(payload);
  const endpoint = process.env.METAPLEX_PROOF_ENDPOINT;
  if (!endpoint) {
    return { status: "skipped", reason: "missing_endpoint", receiptHash };
  }

  const headers: Record<string, string> = { "content-type": "application/json" };
  if (process.env.METAPLEX_PROOF_AUTH) {
    headers.authorization = `Bearer ${process.env.METAPLEX_PROOF_AUTH}`;
  }

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers,
      body: JSON.stringify(payload)
    });
    const raw = await response.text();
    if (!response.ok) {
      return {
        status: "failed",
        reason: "http_error",
        statusCode: response.status,
        detail: raw,
        receiptHash
      };
    }
    const parsed = parseJsonSafe(raw);
    const proofTxHash =
      (parsed?.txHash as string | undefined) ??
      (parsed?.signature as string | undefined) ??
      (parsed?.proofTxHash as string | undefined);
    return { status: "anchored", statusCode: response.status, proofTxHash, receiptHash };
  } catch (error) {
    return {
      status: "failed",
      reason: "request_error",
      detail: error instanceof Error ? error.message : String(error),
      receiptHash
    };
  }
};

export async function executeX402Settlement(input: SettlementInput): Promise<DecisionContract> {
  const mode = input.mode ?? "dry-run";
  const humanApproved = input.humanApproved ?? false;
  const result: DecisionContract = {
    decision: "BLOCK",
    reason_codes: [],
    confidence: 0,
    assumptions: [],
    required_followups: [],
    evidence: []
  };

  if (!input.targetPubkey || !input.contextMemo || !Number.isFinite(input.amountSol) || input.amountSol <= 0) {
    result.decision = "INSUFFICIENT_EVIDENCE";
    result.reason_codes.push("RC_MISSING_EVIDENCE");
    result.confidence = 0.99;
    result.evidence.push("Missing or invalid targetPubkey, amountSol or contextMemo.");
    return result;
  }

  if (mode === "real" && REQUIRE_HUMAN_APPROVAL_FOR_REAL_TX && !humanApproved) {
    result.decision = "NEEDS_HUMAN_APPROVAL";
    result.reason_codes.push("RC_HIGH_RISK_NO_APPROVAL");
    result.confidence = 0.99;
    result.required_followups.push("Run again with explicit approval: --mode=real --human-approved=true");
    result.evidence.push("Real on-chain transfer requested without explicit human approval.");
    return result;
  }

  if (input.amountSol > MAX_X402_PAYMENT_SOL) {
    result.decision = "BLOCK";
    result.reason_codes.push("RC_POLICY_VIOLATION");
    result.confidence = 0.99;
    result.evidence.push(
      `Requested payment (${input.amountSol} SOL) exceeds policy max (${MAX_X402_PAYMENT_SOL} SOL).`
    );
    return result;
  }

  const envKey = process.env.METAPLEX_KEYPAIR;
  if (!envKey) {
    result.decision = "INSUFFICIENT_EVIDENCE";
    result.reason_codes.push("RC_MISSING_EVIDENCE");
    result.confidence = 0.99;
    result.evidence.push("Missing METAPLEX_KEYPAIR.");
    return result;
  }

  let payer: Keypair;
  try {
    payer = decodeSigner(envKey);
  } catch (error) {
    result.decision = "INSUFFICIENT_EVIDENCE";
    result.reason_codes.push("RC_TOOL_FAILURE");
    result.confidence = 0.98;
    result.evidence.push(`Unable to decode signer key: ${error instanceof Error ? error.message : String(error)}`);
    return result;
  }

  result.assumptions.push(`Using payer wallet ${payer.publicKey.toBase58()}.`);

  const connection = new Connection(DEFAULT_RPC_URL, "confirmed");
  let balanceLamports = 0;
  try {
    balanceLamports = await connection.getBalance(payer.publicKey);
  } catch (error) {
    result.decision = "INSUFFICIENT_EVIDENCE";
    result.reason_codes.push("RC_RATE_LIMIT_OR_RPC_BLOCKED");
    result.confidence = 0.95;
    result.evidence.push(`RPC balance lookup failed: ${error instanceof Error ? error.message : String(error)}`);
    return result;
  }

  const balanceSol = balanceLamports / LAMPORTS_PER_SOL;
  result.evidence.push(`Pre-check balance: ${balanceSol.toFixed(6)} SOL.`);

  const minimumRequired = input.amountSol + REQUIRED_MIN_BALANCE_SOL;
  if (balanceSol < minimumRequired) {
    result.decision = "BLOCK";
    result.reason_codes.push("RC_POLICY_VIOLATION");
    result.confidence = 0.99;
    result.evidence.push(
      `Insufficient policy reserve: ${balanceSol.toFixed(6)} SOL available, ${minimumRequired.toFixed(6)} SOL required.`
    );
    return result;
  }

  let receiver: PublicKey;
  try {
    receiver = new PublicKey(input.targetPubkey);
  } catch {
    result.decision = "INSUFFICIENT_EVIDENCE";
    result.reason_codes.push("RC_MISSING_EVIDENCE");
    result.confidence = 0.99;
    result.evidence.push("targetPubkey is not a valid Solana address.");
    return result;
  }

  const tx = new Transaction().add(
    SystemProgram.transfer({
      fromPubkey: payer.publicKey,
      toPubkey: receiver,
      lamports: Math.floor(input.amountSol * LAMPORTS_PER_SOL)
    }),
    new TransactionInstruction({
      keys: [{ pubkey: payer.publicKey, isSigner: true, isWritable: true }],
      programId: MEMO_PROGRAM_ID,
      data: Buffer.from(input.contextMemo, "utf-8")
    })
  );

  if (mode !== "real") {
    result.decision = "ALLOW";
    result.confidence = 0.9;
    result.required_followups.push("Dry-run only. Use --mode=real --human-approved=true to broadcast.");
    result.evidence.push("Policy gates passed. Transaction not broadcast.");
    return result;
  }

  let signature: string;
  try {
    signature = await sendAndConfirmTransaction(connection, tx, [payer], { commitment: "confirmed" });
  } catch (error) {
    result.decision = "INSUFFICIENT_EVIDENCE";
    result.reason_codes.push("RC_TOOL_FAILURE");
    result.confidence = 0.93;
    result.evidence.push(`On-chain settlement failed: ${error instanceof Error ? error.message : String(error)}`);
    return result;
  }

  const explorerUrl = buildExplorerUrl(signature, DEFAULT_SOLANA_NETWORK);
  result.artifacts = { txHash: signature, explorerUrl };
  result.evidence.push(`Settlement confirmed on-chain. txHash=${signature}`);
  result.evidence.push(`Explorer URL: ${explorerUrl}`);

  try {
    const txInfo = await connection.getTransaction(signature, {
      commitment: "confirmed",
      maxSupportedTransactionVersion: 0
    });
    if (txInfo?.meta?.logMessages?.some((line) => line.includes("Memo"))) {
      result.evidence.push("Memo program execution confirmed in transaction logs.");
    } else {
      result.evidence.push("Transaction confirmed, but memo log not found in fetched logs.");
    }
  } catch (error) {
    result.reason_codes.push("RC_TOOL_FAILURE");
    result.evidence.push(`Post-confirmation fetch failed: ${error instanceof Error ? error.message : String(error)}`);
  }

  const proofIntentId = input.intentId ?? `intent_x402_${Date.now()}`;
  const proofResult = await submitMetaplexProof({
    intentId: proofIntentId,
    settlementTxHash: signature,
    settlementMemo: input.contextMemo,
    payerWallet: payer.publicKey.toBase58(),
    receiverWallet: receiver.toBase58(),
    amountSol: input.amountSol,
    network: DEFAULT_SOLANA_NETWORK
  });

  result.artifacts.receiptHash = proofResult.receiptHash;
  result.evidence.push(`Settlement receipt hash: ${proofResult.receiptHash}`);

  if (proofResult.status === "anchored") {
    result.evidence.push(`Metaplex proof submission accepted. statusCode=${proofResult.statusCode}`);
    if (proofResult.proofTxHash) {
      result.artifacts.metaplexProofTxHash = proofResult.proofTxHash;
      result.evidence.push(`Metaplex proof txHash=${proofResult.proofTxHash}`);
    }
    result.artifacts.metaplexProofStatusCode = proofResult.statusCode;
  } else if (proofResult.status === "skipped") {
    result.required_followups.push("Set METAPLEX_PROOF_ENDPOINT to emit on-chain proof receipt.");
    result.evidence.push("Metaplex proof skipped: missing METAPLEX_PROOF_ENDPOINT.");
  } else {
    result.reason_codes.push("RC_TOOL_FAILURE");
    if (proofResult.statusCode === 429 || proofResult.statusCode === 503 || proofResult.statusCode === 504) {
      result.reason_codes.push("RC_RATE_LIMIT_OR_RPC_BLOCKED");
    }
    result.required_followups.push("Fix Metaplex proof endpoint/auth and retry receipt emission.");
    result.evidence.push(
      `Metaplex proof failed (${proofResult.reason}${proofResult.statusCode ? `:${proofResult.statusCode}` : ""}): ${proofResult.detail}`
    );
  }

  result.decision = "ALLOW";
  result.confidence = 1;
  return result;
}

const isMain = (() => {
  if (typeof process === "undefined" || !process.argv[1]) return false;
  const entry = process.argv[1].replace(/\\/g, "/");
  return entry.endsWith("/scripts/a2a_payment.ts") || entry.endsWith("a2a_payment.ts");
})();

if (isMain) {
  (async () => {
    const args = parseCliArgs();
    const mode = args.mode === "real" ? "real" : "dry-run";
    const targetPubkey = args.target ?? (mode === "dry-run" ? Keypair.generate().publicKey.toBase58() : "");
    const amountSol = parseAmount(args.amount, 0.001);
    const contextMemo = args.memo ?? "MIND_x402_PAYMENT: AI inference service";
    const humanApproved = parseBool(args["human-approved"], parseBool(process.env.HUMAN_APPROVED, false));
    const intentId = args["intent-id"];

    const decision = await executeX402Settlement({
      targetPubkey,
      amountSol,
      contextMemo,
      mode,
      humanApproved,
      intentId
    });

    console.log(JSON.stringify(decision, null, 2));
    if (decision.decision !== "ALLOW") {
      process.exit(1);
    }
  })().catch((error) => {
    const message = error instanceof Error ? error.message : String(error);
    const decision: DecisionContract = {
      decision: "INSUFFICIENT_EVIDENCE",
      reason_codes: ["RC_TOOL_FAILURE"],
      confidence: 0.9,
      assumptions: [],
      required_followups: ["Inspect runtime error and retry."],
      evidence: [message]
    };
    console.log(JSON.stringify(decision, null, 2));
    process.exit(1);
  });
}
