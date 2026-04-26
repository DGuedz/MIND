import { TurnkeyClient } from "@turnkey/http";
import { ApiKeyStamper } from "@turnkey/api-key-stamper";

export const createTurnkeyClient = () => {
  const apiPublicKey = process.env.TURNKEY_API_PUBLIC_KEY;
  const apiPrivateKey = process.env.TURNKEY_API_PRIVATE_KEY;
  const baseUrl = process.env.TURNKEY_BASE_URL || "https://api.turnkey.com";

  if (!apiPublicKey || !apiPrivateKey) {
    throw new Error("TURNKEY_API_PUBLIC_KEY or TURNKEY_API_PRIVATE_KEY not set");
  }

  const stamper = new ApiKeyStamper({
    apiPublicKey,
    apiPrivateKey,
  });

  return new TurnkeyClient({ baseUrl }, stamper);
};
