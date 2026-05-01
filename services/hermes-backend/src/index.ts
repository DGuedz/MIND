import Fastify from "fastify";
import cors from "@fastify/cors";
import "dotenv/config";
import fs from "fs/promises";
import path from "path";

const fastify = Fastify({ logger: true });

// Enable CORS for frontend
fastify.register(cors, {
  origin: "*", // allow all for local dev
});

const PORT = Number(process.env.HERMES_PORT || 8001);
const HOST = process.env.HERMES_HOST || "0.0.0.0";

fastify.post("/hermes/events", async (request, reply) => {
  // Read forwarded headers set by Traefik + ForwardAuth
  const subject = request.headers["x-auth-subject"];
  const issuer = request.headers["x-auth-issuer"];
  const audience = request.headers["x-auth-audience"];

  fastify.log.info({ subject, issuer, audience, body: request.body }, "Received protected hermes event");

  return {
    status: "hermes-accepted",
    identity: { subject, issuer, audience },
    receivedAt: new Date().toISOString()
  };
});

fastify.get("/health", async (request, reply) => {
  return { status: "hermes-backend-ok" };
});

fastify.get("/hermes/health", async (request, reply) => {
  return { status: "hermes-backend-ok" };
});

fastify.post("/hermes/generate-skill", async (request, reply) => {
  try {
    const { prompt } = request.body as { prompt: string };
    if (!prompt) return reply.code(400).send({ error: "prompt is required" });

    // Generate Skill Name from prompt (take first two words)
    // e.g., "Oi Mind, eu quero criar" -> "Oi_Mind"
    const cleaned = prompt.replace(/[^a-zA-Z0-9_ ]/g, '').trim();
    const words = cleaned.split(" ");
    let skillName = words.slice(0, 2).join("_") || "Custom_Skill";
    
    // If it's "Oi_Mind" or similar, just use it directly for display
    const slug = skillName.toLowerCase();

    const jsonCode = `{
  "agent_identity": {
    "name": "${skillName}_Agent",
    "version": "1.0.0",
    "protocol": "A2A_v1",
    "pib_agentico_fee": "0.005_per_transaction"
  },
  "capabilities": [
    {
      "service": "${slug}_execution",
      "methods": ["GET", "POST"],
      "auth_required": true,
      "encryption": "AES-256"
    }
  ],
  "compliance": {
    "standard": "A2A_Agentic_Safety_Card",
    "guarantees": "Zero-knowledge_proofs"
  }
}`;

    const mdCode = `# SPINS: ${skillName} Agent
## Contexto: Integre este conhecimento ao Mind Orchestrator.

### Regras de Ouro:
- Prioridade Máxima: Integridade da Carta Agêntica.
- Protocolo: A2A_v1.
- Restrição: Bloquear qualquer handshake sem assinatura digital válida.

### Instrução de Processamento:
"Se o Mind Orchestrator solicitar ${skillName}, execute a rotina e valide o custo no JSON."`;

    // Calculate paths - assume workspace is 3 levels up from `services/hermes-backend/src`
    // src -> hermes-backend -> services -> root
    const rootDir = path.resolve(__dirname, "../../../");
    const hermesCardsDir = path.join(rootDir, "agent-cards/skills/hermes");

    // Ensure directory exists
    await fs.mkdir(hermesCardsDir, { recursive: true });

    // Write JSON
    const jsonPath = path.join(hermesCardsDir, `card_skill_hermes-${slug}.json`);
    await fs.writeFile(jsonPath, jsonCode, "utf-8");

    // Write MD
    const mdPath = path.join(hermesCardsDir, `card_skill_hermes-${slug}_spins.md`);
    await fs.writeFile(mdPath, mdCode, "utf-8");

    return reply.send({
      skillName,
      slug,
      jsonCode,
      mdCode,
      message: "Skill generated and files created successfully."
    });
  } catch (error: any) {
    fastify.log.error(error);
    return reply.code(500).send({ error: "Internal Server Error", details: error.message });
  }
});

const start = async () => {
  try {
    await fastify.listen({ port: PORT, host: HOST });
    fastify.log.info(`Hermes Backend listening on ${HOST}:${PORT}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
