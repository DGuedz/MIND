import * as dotenv from "dotenv";
import { TurnkeyKmsProvider } from "../services/a2a-service/src/core/kms/TurnkeyKmsProvider.js";

// Carrega o .env da raiz onde as chaves estão guardadas
dotenv.config({ path: ".env" });

const looksLikePlaceholder = (value: string | undefined): boolean => {
  if (!value) return true;
  const trimmed = value.trim();
  if (!trimmed) return true;
  if (/^<.*>$/.test(trimmed)) return true;
  const lower = trimmed.toLowerCase();
  return (
    lower.includes("sua-public-key") ||
    lower.includes("sua-private-key") ||
    lower.includes("endereco-da-wallet-turnkey") ||
    lower.includes("missingwalletpublickey")
  );
};

async function runHealthCheck() {
  console.log("=== KMS HEALTH CHECK (TURNKEY) ===");
  
  const organizationId = process.env.TURNKEY_ORGANIZATION_ID;
  const apiPublicKey = process.env.TURNKEY_API_PUBLIC_KEY;
  const apiPrivateKey = process.env.TURNKEY_API_PRIVATE_KEY;
  
  // Pegamos a chave pública da carteira do frontend (onde ficou mantida como pública)
  // ou passamos uma string vazia só para testar a auth da API
  dotenv.config({ path: "apps/landingpage/.env" });
  const agentPublicKey = process.env.VITE_AGENT_PUBLIC_KEY || "MissingWalletPublicKey";

  if (
    looksLikePlaceholder(organizationId) ||
    looksLikePlaceholder(apiPublicKey) ||
    looksLikePlaceholder(apiPrivateKey) ||
    looksLikePlaceholder(agentPublicKey)
  ) {
    console.error("❌ ERRO: variáveis TURNKEY_* ou chave pública do agente ausentes/placeholder.");
    console.log("Variáveis atuais:");
    console.log(`- TURNKEY_ORGANIZATION_ID: ${looksLikePlaceholder(organizationId) ? "MISSING_OR_PLACEHOLDER" : "OK"}`);
    console.log(`- TURNKEY_API_PUBLIC_KEY: ${looksLikePlaceholder(apiPublicKey) ? "MISSING_OR_PLACEHOLDER" : "OK"}`);
    console.log(`- TURNKEY_API_PRIVATE_KEY: ${looksLikePlaceholder(apiPrivateKey) ? "MISSING_OR_PLACEHOLDER" : "OK"}`);
    console.log(`- VITE_AGENT_PUBLIC_KEY: ${looksLikePlaceholder(agentPublicKey) ? "MISSING_OR_PLACEHOLDER" : "OK"}`);
    process.exit(1);
  }

  console.log("Credenciais encontradas no .env. Inicializando provedor...");
  
  try {
    const provider = new TurnkeyKmsProvider(
      apiPublicKey,
      apiPrivateKey,
      organizationId,
      agentPublicKey
    );

    // O initialize() vai disparar um getWhoami no Turnkey
    await provider.initialize();
    
    console.log("✅ KMS HEALTH CHECK PASSOU!");
    console.log("O provedor Turnkey conseguiu autenticar na API com sucesso.");
  } catch (error) {
    console.error("❌ KMS HEALTH CHECK FALHOU:");
    console.error((error as Error).message);
    process.exit(1);
  }
}

runHealthCheck();
