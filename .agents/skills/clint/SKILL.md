---
name: clint
version: 1.0.0
description: |
  DePIN proof verifier for the CNB Mobile network on Solana.
  Ingests on-chain session Memos and Anchor PDA data to compute a
  Node Health Index (NHI, 0–100) with Sybil-risk classification.
  Built as a trust primitive for the A2A DePIN attention economy in Latin America.
origin: The Garage - Superteam BR
badges:
  - The Garage Premium
  - Colosseum Frontier
campaign: the_garage_frontier_sp
license: MIT
author: CriptonoBolso
compatibility: MIND Protocol, Claude Code
metadata: >
  {
    "category": "depin-analytics",
    "network": "solana",
    "program_id": "BoVj5VrUx4zzE9JWFrneGWyePNt4DYGP2AHb9ZUxXZmo",
    "tags": "depin,cnb-mobile,proof-of-activity,sybil-detection,latam,solana"
  }
---

# CLINT — CNB Link Intelligence

**Camada:** DePIN Analytics · On-Chain Proof Verification  
**Rede:** Solana (devnet → mainnet)  
**Fee:** $0.05 USDC / chamada · Split 92/8  
**Escrow Logic:** Standard  
**Latency Power:** p95 ≤ 1 200 ms (modo `full`) · p95 ≤ 400 ms (modo `quick`)  

---

## Motivation & Network Value

O CNB Mobile é o primeiro protocolo DePIN de atenção móvel da América Latina: usuários ganham tokens CNB verificáveis on-chain por sessões de carregamento de bateria no Android. Cada sessão gera uma **Solana Memo transaction** imutável com payload:

```json
{ "event": "session", "uidHash": "...", "timestamp": 0, "duration": 0, "points": 0 }
```

O CLINT existe para transformar esse fluxo de provas brutas em um **primitivo de confiança legível por agentes**. Sem o CLINT, um agente de Staking ou Marketplace que queira validar a legitimidade de um nó CNB precisaria reimplementar toda a lógica de leitura de Memo, derivação de PDA e análise de entropia. Com o CLINT, basta uma chamada de $0.05.

**Casos de uso A2A:**

| Agente comprador | Gatilho | Output relevante |
|-----------------|---------|-----------------|
| Agente de Staking CNB | Verificar elegibilidade para tier de multiplicador | `node_health_index ≥ 70` + `sybil_risk = "low"` |
| Agente de Marketplace | Auditoria de credencial antes de trade OTC | `proof_hashes[]` como evidência imutável |
| Agente de Cobertura Regional | Agregar saúde de múltiplos nós em área geográfica | Batch de 50 chamadas por `uid_hash` |
| Agente de Seguro DePIN | Calcular prêmio baseado em histórico verificável | `verified_minutes` + `longest_streak_hours` |

---

## Interface de Entrada

```typescript
interface ClintInput {
  /**
   * Endereço Solana base58 do nó.
   * Forneça `wallet` OU `uid_hash` — não ambos.
   */
  wallet?: string;

  /**
   * sha256(firebase_uid), hex-encoded, 64 chars.
   * Os primeiros 16 bytes são usados como seed do PDA.
   */
  uid_hash?: string;

  /**
   * Janela de análise em horas. Padrão: 24. Máximo: 720 (30 dias).
   */
  window_hours?: number;

  /**
   * quick   → últimas 10 Memos, NHI aproximado, p95 400 ms
   * full    → janela completa, análise detalhada, p95 1 200 ms
   * sybil_check → heurística de entropia temporal, p95 900 ms
   */
  mode?: "quick" | "full" | "sybil_check";
}
```

---

## Interface de Saída

```typescript
interface ClintOutput {
  node_health_index: number;        // 0–100
  verified_minutes: number;         // minutos com Memo on-chain confirmada
  total_sessions: number;
  longest_streak_hours: number;
  points_accumulated: number;       // lido do UserAccount PDA
  tokens_redeemed: number;
  sybil_risk: "low" | "medium" | "high";
  proof_hashes: string[];           // tx signatures usadas como evidência
  anchor_pda: string;               // UserAccount PDA address
  analysis_window: { from: string; to: string }; // ISO 8601
  verdict: string;                  // resumo legível por humano / agente
}
```

---

## Lógica de Execução

### Step 1 — Resolução do PDA

```typescript
import { PublicKey } from "@solana/web3.js";

const PROGRAM_ID = new PublicKey("BoVj5VrUx4zzE9JWFrneGWyePNt4DYGP2AHb9ZUxXZmo");

function resolveUserPDA(uid_hash: string): PublicKey {
  // seeds: ["user", uid_hash_bytes[0..8]]
  const seed = Buffer.from(uid_hash.slice(0, 16), "hex"); // 8 bytes
  const [pda] = PublicKey.findProgramAddressSync(
    [Buffer.from("user"), seed],
    PROGRAM_ID
  );
  return pda;
}
```

### Step 2 — Varredura de Memos

Busca todas as transações cujo account-list inclui `MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr` dentro da janela temporal. Payloads com `event !== "session"` ou JSON inválido são ignorados silenciosamente.

```typescript
const MEMO_PROGRAM_ID = "MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr";

interface SessionProof {
  event: "session";
  uidHash: string;
  timestamp: number;  // unix ms
  duration: number;   // minutos
  points: number;
}
```

> **Nota RPC:** Memos com payload > 566 bytes são truncados pelo Solana runtime — o CLINT descarta payloads incompletos. Use Helius ou Triton para janelas > 7 dias (melhor retenção de histórico).

### Step 3 — Cálculo do Node Health Index (NHI)

```typescript
function calcNHI(sessions: SessionProof[], pda: UserAccount): number {
  // A. Volume            → 30 pts  (minutos verificados / janela)
  const volumeScore      = Math.min(totalMinutes(sessions) / 4, 30);

  // B. Consistência      → 25 pts  (distribuição temporal uniforme)
  const consistencyScore = calcConsistency(sessions) * 25;

  // C. Acumulação PDA    → 20 pts  (pontos no contrato vs. soma dos Memos)
  const pdaScore         = Math.min(pda.pontos / expectedPoints(sessions), 1) * 20;

  // D. Streak            → 15 pts  (maior bloco contínuo de atividade)
  const streakScore      = Math.min(calcLongestStreak(sessions) / 24, 1) * 15;

  // E. Entropia          → 10 pts  (variância de duração — humanos ≠ bots)
  const entropyScore     = calcEntropy(sessions) * 10;

  return Math.round(volumeScore + consistencyScore + pdaScore + streakScore + entropyScore);
}
```

### Step 4 — Sybil Check (modo `sybil_check`)

| Sinal | Risco baixo | Risco alto |
|-------|------------|------------|
| Desvio-padrão de duração | > 8 min | < 2 min (sessões idênticas) |
| Gap noturno inferível | ≥ 1 gap/dia | Zero gaps em 7+ dias |
| Clustering de timestamps | Distribuído | Múltiplas sessões em janela de 30 s |
| Ratio `pda.pontos / memo_total` | 0.95 – 1.05 | < 0.8 ou > 1.2 |

---

## Exemplo A2A Completo

**Request:**
```json
{
  "agent": "clint",
  "version": "1.0.0",
  "input": {
    "wallet": "PENDING_REAL_WALLET_FROM_MARIANO",
    "window_hours": 168,
    "mode": "full"
  }
}
```

**Response:**
```json
{
  "node_health_index": 84,
  "verified_minutes": 2340,
  "total_sessions": 31,
  "longest_streak_hours": 18,
  "points_accumulated": 187200,
  "tokens_redeemed": 2,
  "sybil_risk": "low",
  "proof_hashes": ["5xGk...9aQp", "2mNr...7bLw"],
  "anchor_pda": "GvKp...3ZnR",
  "analysis_window": {
    "from": "2026-04-16T00:00:00Z",
    "to": "2026-04-23T00:00:00Z"
  },
  "verdict": "Nó ativo com 39 h verificadas em 7 dias. Padrão humano confirmado. Risco Sybil baixo. NHI 84/100 — elegível para multiplicador de staking tier-2."
}
```

---

## Dependências

```json
{
  "@solana/web3.js": "^1.98.0",
  "@noble/hashes": "^1.7.2",
  "@coral-xyz/anchor": "^0.30.1"
}
```

---

## Segurança (VSC Compliance)

- **Read-only:** Nenhuma chave privada necessária. Todo acesso via RPC público.
- **Sem segredos:** Não lê `.env`. URL do RPC é injetada pelo KMS da MIND em runtime.
- **Determinístico:** Dado o mesmo `wallet` + `window_hours`, o output é reproduzível por qualquer RPC com histórico completo — auditável independentemente.
- **KMS-compatible:** Assinaturas on-chain são lidas, nunca produzidas. Payload sempre JSON válido e inspecionável.
