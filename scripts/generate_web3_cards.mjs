import fs from "fs";
import path from "path";

// Mock de dados que seriam gerados pelo .firecrawl/batch_crawl_ecosystem.sh
// Isso garante a imediata visualização no frontend para fins de arquitetura do Marketplace.
const web3Cards = [
  { id: "helius-rpc-manager", name: "Helius RPC & Webhooks", desc: "Gerenciador autônomo de RPCs de alta performance e webhooks Helius para eventos onchain na Solana.", cat: "infrastructure", tags: ["helius", "rpc", "webhooks"], badges: ["INFRASTRUCTURE", "HELIUS"] },
  { id: "pyth-oracle-fetcher", name: "Pyth Real-Time Oracle", desc: "Extrator de feeds de preços em tempo real via Pyth Network para decisões atômicas de trade A2A.", cat: "oracle", tags: ["pyth", "price", "oracle", "defi"], badges: ["ORACLE", "PYTH"] },
  { id: "marginfi-liquidator", name: "Marginfi Liquidator Bot", desc: "Agente executor de liquidações automáticas de contas subaquáticas no protocolo Marginfi.", cat: "execution", tags: ["marginfi", "liquidation", "defi"], badges: ["DEFI", "LIQUIDATION"] },
  { id: "drift-perp-trader", name: "Drift Algorithmic Trader", desc: "Executor autônomo de estratégias de basis trading e perp market making no Drift Protocol.", cat: "trading", tags: ["drift", "perps", "trading"], badges: ["TRADING", "DRIFT"] },
  { id: "squads-multisig", name: "Squads V4 Proposer", desc: "Orquestrador de propostas e aprovações multifirma (multisig) automatizadas para tesourarias institucionais.", cat: "governance", tags: ["squads", "multisig", "treasury"], badges: ["GOVERNANCE", "SQUADS"] },
  { id: "tensor-nft-sweeper", name: "Tensor Floor Sweeper", desc: "Algoritmo de varredura atômica de NFTs no floor da Tensor, baseado em lógicas de raridade onchain.", cat: "trading", tags: ["tensor", "nft", "sweeper"], badges: ["NFT", "TENSOR"] },
  { id: "raydium-lp-manager", name: "Raydium LP Optimizer", desc: "Agente de provisionamento dinâmico de liquidez concentrada em pools do Raydium.", cat: "execution", tags: ["raydium", "amm", "liquidity"], badges: ["DEFI", "RAYDIUM"] },
  { id: "metaplex-core-minter", name: "Metaplex Core Minter", desc: "Gerenciador otimizado de minting e atualizações de cNFTs e assets usando Metaplex Core standard.", cat: "utility", tags: ["metaplex", "cnft", "core"], badges: ["METAPLEX", "CORE"] },
  { id: "sanctum-lst-router", name: "Sanctum LST Arbitrage", desc: "Agente de roteamento inteligente e arbitragem entre tokens de Liquid Staking (LSTs) na Sanctum.", cat: "trading", tags: ["sanctum", "lst", "arbitrage"], badges: ["DEFI", "SANCTUM"] },
  { id: "jito-mev-searcher", name: "Jito MEV Searcher", desc: "Extrator de pacotes MEV via Jito Block Engine. Garante execução atômica sem vazamento para o mempool público.", cat: "execution", tags: ["jito", "mev", "searcher"], badges: ["MEV", "JITO"] }
];

const DEST_DIR = path.join(process.cwd(), "agent-cards", "skills", "mind");

web3Cards.forEach(card => {
  // Geração do pricing V1 (x402 pay-per-use) e performance determinística atestada (mock MVP)
  const hash = card.id.split('').reduce((a, b) => a + b.charCodeAt(0), 0);
  const successRate = 95 + (hash % 50) / 10;
  const execs = 1500 + (hash * 23 % 45000);
  const vol = (hash * 17 % 25000) / 10;

  const catalogItem = {
    id: card.id,
    kind: "skill",
    name: card.name,
    description: card.description,
    source: "mind",
    category: card.cat,
    license: "MIT",
    tags: card.tags,
    badges: ["V1.0", "x402-READY", ...card.badges],
    pricing: {
      model: "pay-per-use",
      protocol: "x402",
      currency: "USDC",
      price: 0.001 + (hash % 10) / 1000
    },
    performance: {
      successRate: parseFloat(successRate.toFixed(1)),
      totalExecutions: execs,
      totalVolumeUSDC: parseFloat(vol.toFixed(1))
    }
  };

  fs.writeFileSync(
    path.join(DEST_DIR, `card_skill_${card.id}.json`),
    JSON.stringify(catalogItem, null, 2)
  );
  console.log(`[MIND:PIPELINE] V1 Agent Card gerado: ${card.id}`);
});
