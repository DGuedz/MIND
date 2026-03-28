import express, { Request, Response } from "express";

const app = express();
app.use(express.json());

const PORT = 3009;

app.post("/v1/inference", (req: Request, res: Response) => {
  console.log("\n🤖 [NoahAI Mock] Requisição recebida!");
  console.log("   Headers Auth:", req.headers.authorization);
  console.log("   Payload:", JSON.stringify(req.body, null, 2));

  // Valida o contrato mínimo esperado do Agente MIND
  const { intentId, paymentProof } = req.body;
  if (!paymentProof?.txHash) {
    return res.status(402).json({
      error: "Payment Required. A2A x402 settlement txHash is missing."
    });
  }

  // Simula latência de inferência
  setTimeout(() => {
    res.status(200).json({
      decision: "ALLOW",
      risk_score: "LOW",
      confidence: 0.98,
      summary: `Inferência processada com sucesso. Oráculo validou os dados on-chain com base no recibo x402: ${paymentProof.txHash}`,
      agent_action: "Proceed with trade execution.",
      timestamp: new Date().toISOString()
    });
  }, 800);
});

app.listen(PORT, () => {
  console.log(`\n✅ [NoahAI Mock] Servidor de Oráculo de IA rodando na porta ${PORT}`);
  console.log(`   Endpoint: http://localhost:${PORT}/v1/inference`);
  console.log(`   Esperando pagamentos x402 e comprovantes Metaplex...`);
});