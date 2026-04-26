import { execFileSync } from "child_process";

// Helper para extrair o contrato de decisão do stdout
const extractDecisionFromOutput = (raw: string) => {
  const lines = raw.split(/\r?\n/);
  const startLine = lines.findIndex((line) => line.trim().startsWith("{"));
  if (startLine < 0) return null;
  const candidate = lines.slice(startLine).join("\n").trim();
  try {
    return JSON.parse(candidate);
  } catch {
    return null;
  }
};

async function runSmokeE2E() {
  console.log("💨 Iniciando Smoke Test E2E (Modo Seguro / Dry-Run)...\n");
  
  const intentId = `MIND-INTENT-SMOKE-${Math.floor(Math.random() * 10000)}`;
  console.log(`1️⃣  [Telegram] Simulando aprovação humana para Intent: ${intentId}`);
  console.log("   - Humano clicou em '✅ Aprovar x402'");
  
  console.log("\n2️⃣  [Solana x402] Acionando gateway de liquidação em modo dry-run...");
  
  try {
    const raw = execFileSync(
      "npx",
      [
        "tsx",
        "scripts/a2a_payment.ts",
        "--mode=dry-run",
        "--amount=0.001",
        "--memo=MIND_x402_PAYMENT: AI inference service smoke test",
        `--intent-id=${intentId}`,
        `--target=11111111111111111111111111111111`
      ],
      { encoding: "utf8" }
    );

    const decision = extractDecisionFromOutput(raw);
    if (!decision) {
      console.error("❌ Falha ao interpretar resposta do a2a_payment.ts.");
      console.error(raw);
      process.exit(1);
    }

    console.log("📋 Contrato de Decisão x402 Retornado:");
    console.log(JSON.stringify(decision, null, 2));

    if (decision.decision !== "ALLOW") {
      console.error("\n❌ Liquidação bloqueada no pre-check do dry-run. Abortando fluxo E2E.");
      process.exit(1);
    }

    console.log("\n3️⃣  [NoahAI / OpenClaw SDK] Simulando chamada de inferência com recibos Metaplex...");
    
    // Mocking the AI SDK logic that would normally happen in callNoahAI()
    console.log(`   - Enviando Payload para POST /inference com TxHash: ${decision.artifacts?.txHash || "simulated_hash"}`);
    
    // Fake latency
    await new Promise(resolve => setTimeout(resolve, 800));

    const mockOpenClawResponse = {
      decision: "ALLOW",
      reason_codes: [],
      evidence: [
        "openclaw.status=200",
        JSON.stringify({
          risk_score: "LOW",
          confidence: 0.98,
          summary: "Inferência aprovada: Oráculo validou os dados on-chain com sucesso baseado no recibo x402.",
          agent_action: "Proceed with trade execution."
        })
      ]
    };

    console.log("🤖 Resposta do Oráculo/IA (Mock):");
    console.log(JSON.stringify(mockOpenClawResponse, null, 2));
    
    console.log("\n✅ Smoke Test E2E concluído! Pipeline (Telegram -> Solana x402 -> Oráculo IA) operando perfeitamente sem risco de capital.");

  } catch (e: any) {
    console.error("\n❌ Erro durante o smoke test:", e.message);
    process.exit(1);
  }
}

runSmokeE2E().catch(console.error);