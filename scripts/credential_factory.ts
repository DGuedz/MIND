import {
  Connection,
  Keypair,
  LAMPORTS_PER_SOL,
} from "@solana/web3.js";
import fs from "fs";
import path from "path";
import crypto from "crypto";

/**
 * MIND CREDENTIAL FACTORY (ONLY AGENTS)
 * 
 * Este script gera o ativo visual (SVG procedural) baseado no branding MIND
 * e simula o mint de um NFT Metaplex Core (Credential).
 */

const log = {
  info: (msg: string) => console.log(`\x1b[36m[INFO]\x1b[0m ${msg}`),
  success: (msg: string) => console.log(`\x1b[32m[SUCCESS]\x1b[0m ${msg}`),
  neural: (msg: string) => console.log(`\x1b[35m[NEURAL]\x1b[0m ${msg}`),
  bold: (msg: string) => console.log(`\x1b[1m${msg}\x1b[0m`),
};

/**
 * Gera um SVG procedural baseado no branding MIND:
 * Minimalista, P&B, Linhas concêntricas, Identidade Única.
 */
function generateAgentSVG(agentId: string, tier: string): string {
  // Usar o hash do agentId para gerar variações visuais únicas
  const hash = crypto.createHash('sha256').update(agentId).digest('hex');
  const seed = parseInt(hash.substring(0, 8), 16);
  
  // Cores baseadas no branding MIND (Preto e Branco / Escala de Cinza)
  const bgColor = "#050505";
  const strokeColor = "#ffffff";
  const accentColor = tier === "Institutional" ? "#ffffff" : "#a1a1aa"; // zinc-400

  // Gerar círculos concêntricos com variações baseadas no seed
  let circles = "";
  for (let i = 0; i < 6; i++) {
    const radius = 40 + i * 25;
    const dashArray = (seed % (i + 2)) * 10 + 5;
    const opacity = 1 - i * 0.15;
    circles += `<circle cx="250" cy="250" r="${radius}" fill="none" stroke="${strokeColor}" stroke-width="0.5" stroke-dasharray="${dashArray}" opacity="${opacity}" />\n`;
  }

  // Gerar "linhas neurais" únicas
  let paths = "";
  for (let i = 0; i < 12; i++) {
    const angle = (i * 30 + (seed % 30)) * (Math.PI / 180);
    const x2 = 250 + Math.cos(angle) * 200;
    const y2 = 250 + Math.sin(angle) * 200;
    paths += `<line x1="250" y1="250" x2="${x2}" y2="${y2}" stroke="${accentColor}" stroke-width="0.2" opacity="0.3" />\n`;
  }

  return `
<svg width="500" height="500" viewBox="0 0 500 500" xmlns="http://www.w3.org/2000/svg">
  <rect width="500" height="500" fill="${bgColor}" />
  <defs>
    <radialGradient id="grad1" cx="50%" cy="50%" r="50%" fx="50%" fy="50%">
      <stop offset="0%" style="stop-color:${strokeColor};stop-opacity:0.1" />
      <stop offset="100%" style="stop-color:${bgColor};stop-opacity:0" />
    </radialGradient>
  </defs>
  <circle cx="250" cy="250" r="240" fill="url(#grad1)" />
  ${circles}
  ${paths}
  <text x="250" y="260" font-family="monospace" font-size="24" fill="${strokeColor}" text-anchor="middle" letter-spacing="8" font-weight="bold">MIND</text>
  <text x="250" y="460" font-family="monospace" font-size="10" fill="#525252" text-anchor="middle" letter-spacing="2">AGENT CREDENTIAL [${tier.toUpperCase()}]</text>
  <text x="250" y="475" font-family="monospace" font-size="8" fill="#333333" text-anchor="middle">${agentId.substring(0, 16)}...</text>
</svg>
  `.trim();
}

async function main() {
  log.bold("\n========================================================");
  log.bold("🛠️  MIND PROTOCOL: CREDENTIAL FACTORY (METAPLEX CORE) 🛠️");
  log.bold("========================================================\n");

  const agentId = Keypair.generate().publicKey.toBase58();
  const tier = process.argv[2] || "Pro"; // Tier padrão: Pro
  
  log.info(`Batizando novo Agente: ${agentId}`);
  log.info(`Nível de Acesso: [${tier.toUpperCase()}]`);

  // 1. Gerar Ativo Visual
  log.neural("Gerando Ativo Visual Procedural (SVG)...");
  const svgContent = generateAgentSVG(agentId, tier);
  
  const outputDir = path.join(process.cwd(), 'assets', 'credentials');
  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });
  
  const svgPath = path.join(outputDir, `credential_${agentId.substring(0, 8)}.svg`);
  fs.writeFileSync(svgPath, svgContent);
  log.success(`Ativo Visual salvo em: ${svgPath}`);

  // 2. Simular Metadados Metaplex Core
  log.neural("Preparando Metadados Metaplex Core...");
  const metadata = {
    name: `MIND Credential: ${agentId.substring(0, 6)}`,
    symbol: "MINDID",
    description: `On-chain execution credential for autonomous agents on the MIND Protocol. Tier: ${tier}.`,
    image: `https://arweave.net/mock_path_${agentId}`, // Mock URL
    attributes: [
      { trait_type: "Tier", value: tier },
      { trait_type: "AgentID", value: agentId },
      { trait_type: "Status", value: "Active" }
    ],
    properties: {
      files: [{ uri: svgPath, type: "image/svg+xml" }],
      category: "image"
    }
  };
  
  const metadataPath = path.join(outputDir, `metadata_${agentId.substring(0, 8)}.json`);
  fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2));
  log.success(`Metadados salvos em: ${metadataPath}`);

  // 3. Simular Mint na Devnet
  log.info("\nIniciando Mint na Solana Devnet (Simulação Metaplex Core)...");
  log.neural(`Broadcasting Transaction...`);
  
  // Simulação de delay de rede
  await new Promise(r => setTimeout(r, 1500));
  
  const mockMintAddress = Keypair.generate().publicKey.toBase58();
  log.success(`MINT BEM SUCEDIDO!`);
  log.bold(`NFT Credential Address: ${mockMintAddress}`);
  log.info(`Visualizar na Wallet: [Imagens Procedurais MIND Ativadas]`);

  log.bold("\nSTATUS: AGENTE BATIZADO E CREDENCIADO PARA OPERAR.");
}

main().catch(console.error);
