import fs from "node:fs/promises";
import path from "node:path";
import { DecisionContract } from "./a2a_payment.js";

const AUDIT_LOG_FILE = path.join(process.cwd(), "governance", "audit_log.json");

export async function logAuditDecision(
  intentId: string, 
  userId: string, 
  decision: DecisionContract
) {
  const logEntry = {
    timestamp: new Date().toISOString(),
    intentId,
    userId,
    decision: decision.decision,
    reasonCodes: decision.reason_codes,
    confidence: decision.confidence,
    txHash: decision.artifacts?.txHash || null,
    receiptHash: decision.artifacts?.receiptHash || null
  };

  try {
    let logs = [];
    try {
      const data = await fs.readFile(AUDIT_LOG_FILE, "utf8");
      logs = JSON.parse(data);
    } catch (e) {
      // Se não existir, cria o array vazio
    }

    logs.push(logEntry);
    
    // Mantém o diretório governance se não existir
    await fs.mkdir(path.dirname(AUDIT_LOG_FILE), { recursive: true });
    
    await fs.writeFile(AUDIT_LOG_FILE, JSON.stringify(logs, null, 2), "utf8");
    console.log(`[AUDIT] Decision logged persistently for intent ${intentId}.`);
  } catch (error) {
    console.error(`[AUDIT ERROR] Failed to write to audit log:`, error instanceof Error ? error.message : String(error));
  }
}

export async function logOpenClawProgressEvent(event: { action: string, details: string, status: string }) {
  const PROGRESS_LOG_FILE = path.join(process.cwd(), "governance", "progress_log.json");
  const logEntry = {
    timestamp: new Date().toISOString(),
    ...event
  };

  try {
    let logs = [];
    try {
      const data = await fs.readFile(PROGRESS_LOG_FILE, "utf8");
      logs = JSON.parse(data);
    } catch (e) {}

    logs.push(logEntry);
    await fs.mkdir(path.dirname(PROGRESS_LOG_FILE), { recursive: true });
    await fs.writeFile(PROGRESS_LOG_FILE, JSON.stringify(logs, null, 2), "utf8");
    console.log(`[PROGRESS] ${event.action}: ${event.status}`);
  } catch (error) {
    console.error(`[PROGRESS ERROR] Failed to write to progress log:`, error instanceof Error ? error.message : String(error));
  }
}
