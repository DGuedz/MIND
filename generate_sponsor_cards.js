const fs = require('fs');
const path = require('path');

const sponsors = [
  { name: "Adevar Labs Inc.", prize: "$50,000 in Security Audit Credits", track: "Security Audit" },
  { name: "Eitherway", prize: "20,000 USDC", track: "Live dApp" },
  { name: "Encrypt", prize: "15,000 USDC", track: "Capital Markets" },
  { name: "Superteam Singapore", prize: "10,000 USDG", track: "Regional Track" },
  { name: "Superteam Turkey", prize: "10,000 USDG", track: "Regional Track" },
  { name: "Superteam Japan", prize: "10,000 USDG", track: "Regional Track" },
  { name: "Superteam Georgia", prize: "10,000 USDG", track: "Regional Track" },
  { name: "Tether", prize: "10,000 USDT", track: "Stablecoin Integration" },
  { name: "Superteam India", prize: "10,000 USDG", track: "Regional Track" },
  { name: "Superteam Germany", prize: "10,000 USDG", track: "Regional Track" },
  { name: "Umbra", prize: "10,000 USDC", track: "Privacy" },
  { name: "Superteam Ukraine", prize: "10,000 USDG", track: "Regional Track" },
  { name: "Superteam Nigeria", prize: "10,000 USDG", track: "Regional Track" },
  { name: "La Familia", prize: "10,000 USDG", track: "Regional Track" },
  { name: "Superteam Canada", prize: "10,000 USDG", track: "Regional Track" },
  { name: "Superteam Balkan", prize: "10,000 USDG", track: "Regional Track" },
  { name: "Superteam Malaysia", prize: "10,000 USDC", track: "Regional Track" },
  { name: "Superteam Brasil", prize: "10,000 USDG", track: "Regional Track" },
  { name: "Superteam Indonesia", prize: "10,000 USDG", track: "Regional Track" },
  { name: "Superteam Ireland", prize: "10,000 USDG", track: "Regional Track" },
  { name: "Superteam Nepal", prize: "10,000 USDG", track: "Regional Track" },
  { name: "Superteam Korea", prize: "10,000 USDG", track: "Regional Track" },
  { name: "Superteam Poland", prize: "10,000 USDG", track: "Regional Track" },
  { name: "RPC Fast", prize: "10,000 USDC", track: "RPC Infrastructure" },
  { name: "Superteam UAE", prize: "10,000 USDG", track: "Regional Track" },
  { name: "100xDevs", prize: "10,000 USDC", track: "Developer Tooling" },
  { name: "Superteam Australia", prize: "8,000 USDG", track: "Regional Track" },
  { name: "Superteam Netherlands", prize: "8,000 USDG", track: "Regional Track" },
  { name: "Dune", prize: "6,000 USDC", track: "Data Analytics" },
  { name: "Cloak", prize: "5,010 USDC", track: "Privacy & Payments" },
  { name: "SNS", prize: "5,000 USDC", track: "Identity" },
  { name: "Zerion", prize: "5,000 USDC", track: "Autonomous Agents" },
  { name: "Superteam Pakistan", prize: "5,000 USDC", track: "Regional Track" },
  { name: "MagicBlock", prize: "5,000 USDC", track: "Privacy" },
  { name: "Superteam Kazakhstan", prize: "4,000 USDG", track: "Regional Track" },
  { name: "Torque", prize: "3,000 USDC", track: "MCP Integration" },
  { name: "Covalent", prize: "3,000 USDC", track: "Data Infrastructure" },
  { name: "Jupiter", prize: "3,000 jupUSD", track: "DeFi" },
  { name: "LI.FI", prize: "2,500 USDC", track: "Cross-chain" },
  { name: "JET Europa", prize: "2,000 USDC", track: "Jito Infrastructure" },
  { name: "KIRAPAY", prize: "1,505 USDC", track: "Payments" },
  { name: "SagaPad", prize: "1,000 USDC", track: "Agentic Skills" },
  { name: "Nimbus Data Labs", prize: "900 USDC", track: "API Integration" },
  { name: "Dum.fun", prize: "500 USDC", track: "Token Launch" },
  { name: "Palm USD", prize: "10,000 PUSD", track: "Stablecoin" }
];

const outputDir = path.join(__dirname, 'agent-cards', 'skills', 'colosseum-sponsors');

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

sponsors.forEach(sponsor => {
  const safeName = sponsor.name.toLowerCase().replace(/[^a-z0-9]/g, '_').replace(/_+/g, '_').replace(/^_|_$/g, '');
  
  const card = {
    "$schema": "https://mindprotocol.ai/schemas/agent-card/v1.json",
    "metadata": {
      "name": `${sponsor.name} Bounty Copilot (Skill)`,
      "version": "1.0.0",
      "description": `Copiloto, Validador e PMF Matchmaker oficial para o track de ${sponsor.track} patrocinado por ${sponsor.name}. Esta skill avalia a tese do seu projeto (ex: MIND) e identifica o Product-Market Fit exato com as demandas deste sponsor e do ecossistema Solana, guiando você na decisão de submissão. Instale na sua IDE para obter boilerplates e scaffolding direcionado. Ao final do hackathon, audita o código e libera o prêmio de ${sponsor.prize} via liquidação atômica (x402).`,
      "tags": [
        "solana",
        "colosseum-hackathon",
        "bounty-copilot",
        "pmf-matchmaker",
        "bounty-validator",
        safeName,
        "smart-contract",
        "x402-settlement"
      ],
      "license": "Proprietary",
      "author": {
        "name": sponsor.name,
        "contact": "https://arena.colosseum.org"
      }
    },
    "discovery": {
      "intent": "bounty_acceleration_and_validation",
      "category": "hackathon",
      "keywords": [
        "colosseum",
        "bounty",
        "copilot",
        "validator",
        sponsor.track.toLowerCase(),
        safeName
      ],
      "compatibleFrameworks": [
        "mind-protocol",
        "claude-code",
        "trae"
      ]
    },
    "data": {
      "type": "service",
      "format": "agent-skill",
      "schema": {
        "fields": [
          {
            "name": "repository_url",
            "type": "string",
            "description": "URL do repositório submetido para avaliação"
          },
          {
            "name": "wallet_address",
            "type": "string",
            "description": "Endereço Solana do builder para liquidação do bounty"
          }
        ],
        "commands": {
          "pmf_analysis": `okto-route "Analyze my PMF for the ${sponsor.name} bounty based on my current repo thesis"`,
          "scaffold": `okto-route "Scaffold integration for ${sponsor.name} bounty"`,
          "audit": `okto-route "Audit my code against ${sponsor.name} bounty requirements"`
        }
      },
      "samples": [],
      "qualityScore": 0.95
    },
    "access": {
      "authentication": "none",
      "endpoints": {
        "discovery": "https://arena.colosseum.org",
        "metadata": "https://arena.colosseum.org",
        "data": "https://arena.colosseum.org"
      },
      "rateLimit": {
        "requests": 10,
        "per": "minute"
      }
    },
    "pricing": {
      "model": "dynamic_performance",
      "currency": "USDC",
      "base_price": 0.01,
      "multiplier_index": 1.0
    },
    "governance": {
      "escrow_enabled": false,
      "auditor_required": true,
      "slashing_condition": "false_positive_validation > 0"
    },
    "performance": {
      "success_rate": 0.99,
      "avg_roi_multiplier": 1.0,
      "reorder_rate": 0.0
    },
    "provenance": {
      "source": `Colosseum Frontier Hackathon / ${sponsor.name}`,
      "createdAt": new Date().toISOString(),
      "updatedAt": new Date().toISOString(),
      "signature": "unsigned",
      "origin": sponsor.name,
      "badges": [
        "Colosseum Official",
        "PMF Matchmaker",
        "Bounty Copilot",
        "x402 Ready"
      ]
    },
    "skill": {
      "source_url": "https://arena.colosseum.org",
      "repo_path": `.agents/skills/${safeName}/SKILL.md`
    }
  };

  const filePath = path.join(outputDir, `card_skill_validator_${safeName}.json`);
  fs.writeFileSync(filePath, JSON.stringify(card, null, 2));
});

console.log(`Generated ${sponsors.length} agent cards for Colosseum sponsors in ${outputDir}`);
