const fs = require('fs');
const path = require('path');

const rawText = `
### 🏦 1. Finanças Descentralizadas (DeFi) & Trading Operacional
**1.** Execução de swaps em ultra-baixa latência (Jupiter Ultra Swap).
**2.** Orquestração de compras programadas via DCA (Jupiter).
**3.** Posicionamento de Limit Orders condicionais (Jupiter).
**4.** Execução de trading de futuros perpétuos (Jupiter Perps).
**5.** Depósitos e saques programados em Vaults de rendimento (Kamino).
**6.** Gerenciamento autônomo de posições de alavancagem (Kamino).
**7.** Operações de empréstimo e tomada de crédito (Lending/Borrowing via Kamino).
**8.** Provisão dinâmica de liquidez (Meteora DLMM).
**9.** Depósitos otimizados em Alpha Vaults (Meteora).
**10.** Execução de criação de liquidez via Dynamic Bonding Curves (Meteora).
**11.** Roteamento de Swaps em pools CPMM/CLMM (Raydium).
**12.** Participação automatizada em lançamentos de tokens (Raydium LaunchLab).
**13.** Provisão e rebalanceamento de liquidez concentrada (Orca Whirlpools).
**14.** Lançamento instantâneo de tokens e trade em curvas de adesão (PumpFun).
**15.** Execução de trading spot com captura de orderflow (DFlow).
**16.** Posicionamento autônomo em mercados de previsão (DFlow).
**17.** Operação de Flash Loans (Marginfi).
**18.** Execução de posições alavancadas em looping (Marginfi).
**19.** Roteamento de yield lending otimizado multi-protocolo (Lulo).
**20.** Swaps arbitráveis de Liquid Staking Tokens (Sanctum).
**21.** Operações e provisão na Infinity pool (Sanctum).
**22.** Leitura de mercado e colocação de ordens em CLOB (Manifest DEX).
**23.** Trading alavancado de RWAs, commodities e memecoins (Lavarage).
**24.** Agregação de perps cross-protocol para melhor taxa (Ranger Finance).
**25.** Gestão de tesouraria de agentes e execução em lote (Squads Multisig).

### 🔐 2. Identidade, Compliance (zk-KYC) & Política Zero-Trust
**26.** Emissão de atestados off-chain vinculados a carteiras (Solana Attestation Service).
**27.** Verificação de Prova de Humanidade para evitar ataques Sybil.
**28.** Gating geográfico para acesso regional a ativos ou airdrops.
**29.** Checagem de status de Investidor Acreditado para RWA.
**30.** Emissão e verificação de Identidades via Tokens Intransferíveis (Soulbound).
**31.** Validação reutilizável de KYC e integração com Sumsub ID.
**32.** Emissão de passaportes de permissão via Civic Pass.
**33.** Verificação de identidade digital e residência on-chain (RNS.ID).
**34.** Validação de compliance institucional orientada por IA (Trusta Labs).
**35.** Execução de zk-KYC (provas de conhecimento zero) para privacidade em mercados regulados.
**36.** Gestão de "Transfer Hooks" para bloqueio e permissão em tokens SPL-2022.
**37.** Gerenciamento de Tokens de Capacidade (Clearance Tokens) para acessos militares/privados.
**38.** Registro e verificação de reputação para agentes autônomos (SAID Protocol).
**39.** Assinaturas Multi-party (Threshold Cryptography) para destrancar vaults.
**40.** Auditoria segura de transações cifradas via "Auditor Key Escrow".

### 📊 3. Inteligência de Mercado, Dados & Oráculos
**41.** Consulta de preços de ativos em tempo real (Pyth Network).
**42.** Extração de Médias Móveis Exponenciais on-chain (EMA via Pyth).
**43.** Geração de entropia e aleatoriedade verificável on-chain (Switchboard VRF).
**44.** Fornecimento de dados off-chain sob demanda (Switchboard On-Demand).
**45.** Análise gráfica OHLCV e dados de pools em tempo real (CoinGecko API).
**46.** Rastreamento de P&L de carteiras e descoberta de tokens (Birdeye).
**47.** Disparo de streaming de "Alertas de Baleia" via WebSockets.
**48.** Análise preditiva e de "Smart Money" em pools LP (Metengine).
**49.** Pesquisa semântica autônoma para IA na web (Exa Search).
**50.** Extração de narrativas crypto e tendências no X/Twitter (CT-Alpha / xAI).
**51.** Ranqueamento de credibilidade de publicadores sociais (TweetRank).
**52.** Monitoramento de trending topics globais por geolocalização.
**53.** Varredura de resoluções de problemas em comunidades do Discord (Answer Overflow).
**54.** Rastreio de histórico de transações e portfólios complexos (Octav API).
**55.** Streaming gRPC para alimentação de infraestrutura de análise de dados (Carbium/Yellowstone).

### 🛡️ 4. Segurança, Infraestrutura e Transações Privadas
**56.** Detecção profunda de vulnerabilidades e perigos em código Solana (Vulnhunter).
**57.** Mapeamento arquitetural de código para preparação de auditorias (Code Recon).
**58.** Varredura multi-agente para flaws lógicos em smart contracts (Trident Arena).
**59.** Execução de computação criptografada em Dark Pools (Arcium).
**60.** Orquestração de Leilões de Lance Selado sem revelar valores (Arcium).
**61.** Transferências Confidenciais (ocultando valores via SPL-2022).
**62.** Compressão ZK para criar PDAs e tokens isentos de aluguel (Light Protocol).
**63.** Configuração ágil de RPCs e DAS APIs para indexação de NFTs (Helius / QuickNode).
**64.** Orquestração de Webhooks para reações em tempo real a eventos on-chain.
**65.** Streaming de blocos completos com latência ultrabaixa (LaserStream/Surge).
**66.** Cálculo e aplicação inteligente de Priority Fees dinâmicos.
**67.** Provisionamento de Ephemeral Rollups para transações sem taxa de gás (Magicblock).
**68.** Orquestração de mensageria e transferências cross-chain EVM-Solana (deBridge).
**69.** Criação de ambientes de desenvolvimento clonando o estado da mainnet (Surfpool).
**70.** Limpeza automatizada de carteiras com queima de tokens/NFTs de scam (SOL Incinerator).

### 🧠 5. Integrações Web2, Agentes Companions e Multimídia
**71.** Geração de imagens via inteligência artificial com input rápido (Nano-banana).
**72.** Criação de vídeos com áudio e diálogo sincronizados (Sora-2).
**73.** Execução de chamadas telefônicas autônomas gerenciadas por agentes (PollyReach).
**74.** Compras autônomas em marketplaces (ex: Amazon) pagas nativamente em USDC (SP3ND).
**75.** Sincronização e consultas avançadas a calendários (Caldav).
**76.** Interação autônoma, respostas e moderação no Slack.
**77.** Gerenciamento e atualização autônoma de fluxos no Trello.
**78.** Criação e consulta de gráficos de conhecimento em ontologia de dados.
**79.** Autoavaliação, auto-crítica e correção contínua de erros de agentes em produção.
**80.** Inscrições digitais criadas a partir de entropia on-chain nativa (Sentients).

### ⚙️ 6. Capacidades Nativas da Camada MIND Protocol
**81.** Interceptação rígida via **Intent Firewall**, impedindo execuções de risco sem credencial.
**82.** Liquidação **x402 Autônoma** sem necessidade de assinaturas mensais ou chaves de API.
**83.** Execução do **Atomic Settlement 92/8** direto no contrato inteligente.
**84.** Geração do **Mindprint** (Recibo Criptográfico/cNFT) ao final da operação.
**85.** Controle de limite de gasto via "Session Keys" e PDAs delegados (Proteção tipo Solflare).
**86.** Conversão dinâmica de um script bruto em um manifesto **Agent Card** JSON/MD.
**87.** Empacotamento de capacidades com Tiers baseados na reputação on-chain.
**88.** Bloqueio de reversão (Rollback garantido) caso a liquidação do Card falhe atômicamente.
**89.** Orquestração de precificação dinâmica orientada por raridade e timing de mercado.
**90.** Leitura de metadados nativos para "Zero-Trust Payload" (onde o preço vem do blockchain e não do agente).

### 🏛️ 7. E-Gov, Ativos do Mundo Real (RWA) e Arquiteturas Exóticas
**91.** Tokenização de Ativos do Mundo Real em RWA com atrelamento à identidades civis.
**92.** Orquestração de fluxos para Neobanks Regionais e Remessas FX em Stablecoins.
**93.** Lançamento de Mercados Condicionais em escala ("Se X acontecer, liquide Y").
**94.** Emissão de Notas de Participação de Receita (Rev-share notes) com custódia autônoma.
**95.** Configuração de cofres (Vaults) multi-layer de Produtos Estruturados (Crédito/Opções).
**96.** Gestão de Perpetual Options contínuas sem data de expiração.
**97.** Cômputo eletrônico para E-Voting utilizando criptografia homomórfica garantindo sigilo absoluto.
**98.** Provisionamento de infraestrutura primária de crédito privado e contratos de mineração.
**99.** Lançamento de Mercados de Ações Pré-IPO (Xstocks) sob KYC restrito.
**100.** Criação de intercâmbio de tokens de acesso à modelos grandes de linguagem (LLM Inference Credits).
`;

let currentCategory = "Utility";
const lines = rawText.split('\n');
const skills = [];

for (let line of lines) {
  if (line.startsWith('### ')) {
    if (line.includes('DeFi')) currentCategory = 'DeFi';
    else if (line.includes('Identidade')) currentCategory = 'Identity';
    else if (line.includes('Dados')) currentCategory = 'Data';
    else if (line.includes('Segurança')) currentCategory = 'Infra';
    else if (line.includes('Web2')) currentCategory = 'A2A';
    else if (line.includes('MIND Protocol')) currentCategory = 'Meta-Skill';
    else currentCategory = 'RWA';
  } else {
    const match = line.match(/^\*\*(\d+)\.\*\* (.*)/);
    if (match) {
      skills.push({
        id: parseInt(match[1], 10),
        desc: match[2].trim(),
        category: currentCategory
      });
    }
  }
}

const agentsDir = path.join(__dirname, '.agents', 'skills', 'batch-100');
if (!fs.existsSync(agentsDir)) fs.mkdirSync(agentsDir, { recursive: true });

skills.forEach(skill => {
  // Extrair nome da integração entre parênteses, se houver
  const nameMatch = skill.desc.match(/\((.*?)\)/);
  let integrationName = nameMatch ? nameMatch[1].replace(/[^a-zA-Z0-9]/g, '-').toLowerCase() : `skill-${skill.id}`;
  if(integrationName.length < 2) integrationName = `skill-${skill.id}`;
  
  const skillName = skill.desc.split('(')[0].trim().replace(/\.$/, '');
  const folderName = `${String(skill.id).padStart(3, '0')}-${integrationName}`;
  const skillDir = path.join(agentsDir, folderName);
  
  if (!fs.existsSync(skillDir)) fs.mkdirSync(skillDir, { recursive: true });

  const manifest = {
    id: `mind-skill-${integrationName}`,
    name: skillName,
    category: skill.category,
    description: skill.desc,
    price_model: {
      execution_fee: "0.05",
      payment_asset: "USDC"
    },
    execution_mode: "atomic_cpi",
    policy_requirements: {
      credential_gated: true,
      required_tier: "Tier 1 Micro",
      max_spend_limit: "100.00"
    },
    settlement: {
      type: "atomic_split",
      treasury_split: { creator: 92, protocol: 8 }
    },
    proof_schema: "mindprint_v1"
  };

  fs.writeFileSync(path.join(skillDir, 'manifest.json'), JSON.stringify(manifest, null, 2));

  const mdContent = `# ${skillName}

## Diagnóstico
**Contexto Operacional:** ${skill.desc}
Esta skill foi projetada para atuar na economia máquina-a-máquina (A2A), encapsulando lógica de ${skill.category} complexa através de um firewall Zero-Trust.

## Intent Workflow
1. **Intent:** Agente despacha a intenção de uso para \`${manifest.id}\`.
2. **Credential Gate:** O MIND Gateway valida a credencial (Solana Attestation Service / Tier 1 Micro).
3. **Policy Check:** Verificação de permissões e limite de gastos (max 100.00 USDC).
4. **Atomic Payment & Split:** Liquidação nativa CPI. (92% para Provedor, 8% para MIND Treasury).
5. **Execution:** Invocação segura do ambiente off-chain ou contrato parceiro.
6. **Proof:** Emissão do \`Mindprint\` (Recibo criptográfico nativo na Solana).

## Code Snippet (Zero-Trust CPI Template)
\`\`\`typescript
import { Connection, PublicKey } from "@solana/web3.js";
import { Mindprint, AtomicSettlement, PolicyFirewall } from "@mindprotocol/sdk";

/**
 * Ponto de entrada canônico do Agent Card
 */
export async function executeSkill(intentPayload: any, agentPubkey: PublicKey) {
    // 1. Policy & Credential Gate (Zero-Trust)
    await PolicyFirewall.verifyCredential(agentPubkey, "Tier 1 Micro");

    // 2. Atomic Split (92/8 Settlement)
    const settlementTx = await AtomicSettlement.buildSplitTx({
        payer: agentPubkey,
        amount: 0.05,
        token: "USDC",
        splits: [
            { percent: 92, to: "PROVIDER_WALLET" },
            { percent: 8, to: "MIND_TREASURY" }
        ]
    });

    // 3. Core Execution (Isolada pós-liquidação)
    console.log("Executando: ${skillName}...");
    const executionResult = await perform${integrationName.replace(/-/g,'')}Logic(intentPayload);

    // 4. Emissão do Mindprint (Proof-Native Delivery)
    const receipt = await Mindprint.issue({
        agent: agentPubkey,
        skillId: "${manifest.id}",
        status: "SUCCESS",
        dataHash: executionResult.hash
    });

    return receipt;
}

async function perform${integrationName.replace(/-/g,'')}Logic(payload: any) {
    // Implementação via Anchor ou integrações parceiras (SendAI, Solana.new)
    return { hash: "0xVERIFIED_EXECUTION" };
}
\`\`\`
`;

  fs.writeFileSync(path.join(skillDir, 'SKILL.md'), mdContent);
});

console.log(`Geradas ${skills.length} skills no diretório ${agentsDir}`);
