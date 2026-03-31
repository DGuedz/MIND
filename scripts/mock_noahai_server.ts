import express from "express";
import type { Request, Response } from "express";

const app = express();
app.use(express.json());

// Enable CORS for frontend SSE
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
  next();
});

const PORT = 3009;

// SSE Clients
let clients: Response[] = [];

app.get("/v1/events", (req: Request, res: Response) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders();

  clients.push(res);
  console.log(`\n📡 [SSE] Novo cliente conectado (Total: ${clients.length})`);

  req.on("close", () => {
    clients = clients.filter(client => client !== res);
    console.log(`\n📡 [SSE] Cliente desconectado (Total: ${clients.length})`);
  });
});

const broadcastEvent = (event: string, data: any) => {
  clients.forEach(client => {
    client.write(`event: ${event}\n`);
    client.write(`data: ${JSON.stringify(data)}\n\n`);
  });
};

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
    const successData = {
      decision: "ALLOW",
      risk_score: "LOW",
      confidence: 0.98,
      summary: `Inferência processada com sucesso. Oráculo validou os dados on-chain com base no recibo x402: ${paymentProof.txHash}`,
      agent_action: "Proceed with trade execution.",
      timestamp: new Date().toISOString()
    };
    
    // Dispara evento SSE para o Frontend avisando que houve sucesso
    broadcastEvent("payment_success", { txHash: paymentProof.txHash, intentId });

    res.status(200).json(successData);
  }, 800);
});

app.listen(PORT, () => {
  console.log(`\n✅ [NoahAI Mock] Servidor de Oráculo de IA rodando na porta ${PORT}`);
  console.log(`   Endpoint: http://localhost:${PORT}/v1/inference`);
  console.log(`   Esperando pagamentos x402 e comprovantes Metaplex...`);
});