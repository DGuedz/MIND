import { TurnkeyClient } from "@turnkey/http";
import { ApiKeyStamper } from "@turnkey/api-key-stamper";
import dotenv from "dotenv";

dotenv.config();

// Script para revogar chaves API expostas via Turnkey
// Baseado em: https://docs.turnkey.com/api-reference/activities/delete-api-keys

async function revokeTurnkeyKeys() {
  const organizationId = process.env.TURNKEY_ORGANIZATION_ID;
  const userId = process.env.TURNKEY_USER_ID; // The user whose keys need to be deleted
  const compromisedApiKeyId = "REPLACE_WITH_COMPROMISED_API_KEY_ID"; // O ID da chave exposta no histórico

  if (!organizationId || !userId) {
    console.error("ERRO: TURNKEY_ORGANIZATION_ID e TURNKEY_USER_ID são obrigatórios no .env");
    process.exit(1);
  }

  if (compromisedApiKeyId === "REPLACE_WITH_COMPROMISED_API_KEY_ID") {
    console.error("ERRO: Edite o script para incluir o ID da chave API comprometida.");
    process.exit(1);
  }

  // Você precisará de uma chave de admin válida (diferente da exposta) para assinar esta requisição
  const stamper = new ApiKeyStamper({
    apiPublicKey: process.env.TURNKEY_API_PUBLIC_KEY!,
    apiPrivateKey: process.env.TURNKEY_API_PRIVATE_KEY!,
  });

  const client = new TurnkeyClient({ baseUrl: "https://api.turnkey.com" }, stamper);

  console.log(`Iniciando revogação da chave API [${compromisedApiKeyId}] para o usuário [${userId}]...`);

  try {
    const response = await client.deleteApiKeys({
      organizationId: organizationId,
      parameters: {
        userId: userId,
        apiKeyIds: [compromisedApiKeyId],
      },
      type: "ACTIVITY_TYPE_DELETE_API_KEYS",
      timestampMs: String(Date.now()),
    });

    console.log("Sucesso! Resposta da API:", JSON.stringify(response, null, 2));
    console.log("A chave foi revogada com sucesso e não pode mais ser utilizada.");
  } catch (error) {
    console.error("Falha ao revogar chaves:", error);
  }
}

revokeTurnkeyKeys();
