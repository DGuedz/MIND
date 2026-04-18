const { TurnkeyClient } = require("@turnkey/http");
const { ApiKeyStamper } = require("@turnkey/api-key-stamper");
require("dotenv").config();

async function testTurnkey() {
  const apiPublicKey = process.env.TURNKEY_API_PUBLIC_KEY;
  const apiPrivateKey = process.env.TURNKEY_API_PRIVATE_KEY;
  const orgId = process.env.TURNKEY_ORGANIZATION_ID;

  if (!apiPublicKey || !apiPrivateKey || !orgId) {
    console.error("❌ Faltam credenciais do Turnkey no .env");
    process.exit(1);
  }

  try {
    const stamper = new ApiKeyStamper({
      apiPublicKey,
      apiPrivateKey,
    });

    const client = new TurnkeyClient({ baseUrl: "https://api.turnkey.com" }, stamper);

    console.log("🔐 Testando autenticação KMS (Zero-Trust) com a Turnkey API...");
    
    const response = await client.getWhoami({
      organizationId: orgId,
    });

    console.log(`✅ Sucesso! Conectado como: ${response.organizationId}`);
    console.log(`🆔 ID do Usuário API: ${response.userId}`);
    
  } catch (error) {
    console.error("❌ Falha na autenticação KMS com as credenciais atuais.");
    if (error.body) {
       console.error(error.body);
    } else {
       console.error(error.message);
    }
  }
}

testTurnkey();
