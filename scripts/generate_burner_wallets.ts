import { Keypair } from "@solana/web3.js";
import bs58 from "bs58";
import * as fs from "fs";
import * as path from "path";

const generateWallets = () => {
  // Gera carteira pagadora (Agent MIND)
  const payer = Keypair.generate();
  // Gera carteira recebedora (NoahAI)
  const receiver = Keypair.generate();

  const data = {
    _WARNING: "NUNCA COMITE ESTE ARQUIVO. ELE CONTEM CHAVES PRIVADAS REAIS.",
    AGENT_PAYER_WALLET: {
      publicKey: payer.publicKey.toBase58(),
      privateKeyBase58: bs58.encode(payer.secretKey),
      privateKeyArray: JSON.stringify(Array.from(payer.secretKey)),
      description: "Use a privateKeyBase58 ou privateKeyArray no seu .env como METAPLEX_KEYPAIR. Envie ~0.03 SOL para a publicKey para cobrir as taxas."
    },
    NOAHAI_RECEIVER_WALLET: {
      publicKey: receiver.publicKey.toBase58(),
      privateKeyBase58: bs58.encode(receiver.secretKey),
      description: "Use a publicKey no seu .env como NOAHAI_SETTLEMENT_WALLET."
    }
  };

  const filePath = path.join(process.cwd(), "burner_wallets.json");
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));

  console.log("✅ Wallets reais geradas com sucesso!");
  console.log(`🏦 Agent Payer Public Key: ${data.AGENT_PAYER_WALLET.publicKey}`);
  console.log(`📡 NoahAI Receiver Public Key: ${data.NOAHAI_RECEIVER_WALLET.publicKey}`);
  console.log(`\n🔐 As chaves privadas foram salvas localmente em: ${filePath}`);
  console.log("⚠️  ATENÇÃO: Por regras de segurança institucionais, as chaves privadas não foram impressas no terminal.");
};

generateWallets();