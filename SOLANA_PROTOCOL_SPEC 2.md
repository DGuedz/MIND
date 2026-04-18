# MIND Protocol: Solana Technical Specification

**Versão**: 1.0 (Frontier Hackathon MVP)
**Status**: Draft
**Data**: 15/04/2026

## Visão Geral
O MIND Protocol é um registry de Agent Cards nativo do GitHub, com liquidação atômica em USDC na rede Solana. Ele conecta desenvolvedores (creators) a agentes autônomos (buyers) garantindo execução verificável, descoberta programática e split de receita atômico (ex: 92% dev / 8% protocol).

## 1. Arquitetura de Contas (State)

O estado do protocolo utiliza PDAs (Program Derived Addresses) para garantir determinismo e segurança.

### 1.1 `CreatorProfile`
Armazena metadados do desenvolvedor/time que publica os Agent Cards.
* **Seeds**: `["creator", creator_wallet_pubkey]`
* **Fields**:
  * `authority: Pubkey` (wallet do dev)
  * `total_cards: u32`
  * `reputation_score: u64`
  * `created_at: i64`

### 1.2 `AgentCardRegistry`
Armazena a definição onchain do Agent Card.
* **Seeds**: `["card", card_id_hash]`
* **Fields**:
  * `authority: Pubkey` (dono do card)
  * `price_usdc: u64` (preço base em USDC, ex: 0.009 USDC)
  * `metadata_uri: String` (pointer para metadados JSON/GitHub)
  * `status: u8` (0=Inactive, 1=Active)
  * `total_executions: u64`

### 1.3 `ProtocolConfig`
Configuração global do protocolo MIND.
* **Seeds**: `["config"]`
* **Fields**:
  * `admin: Pubkey`
  * `treasury_wallet: Pubkey`
  * `mind_fee_bps: u16` (ex: 800 para 8%)

### 1.4 `UsageReceipt`
Recibo emitido após execução com sucesso.
* **Seeds**: `["receipt", card_id_hash, buyer_wallet, nonce]`
* **Fields**:
  * `card_id: [u8; 32]`
  * `buyer: Pubkey`
  * `amount_paid: u64`
  * `timestamp: i64`

---

## 2. Instruções do Programa (Instructions)

### 2.1 `InitializeConfig`
Inicializa a conta global do protocolo e o treasury. (Apenas admin).

### 2.2 `RegisterCreator`
Cria um `CreatorProfile` para um desenvolvedor.
* **Signer**: Creator Wallet
* **Custo**: Rent-exempt mínimo da Solana.

### 2.3 `PublishAgentCard`
Publica um novo serviço.
* **Signer**: Creator Wallet
* **Inputs**: `price_usdc`, `metadata_uri`
* **Actions**: Cria a conta `AgentCardRegistry`.

### 2.4 `AtomicPurchaseAndSettle` (Core)
Instrução principal de liquidação. Agrupa validação e split financeiro numa única transação atômica.
* **Signers**: Buyer Wallet (ou Agent Wallet)
* **Inputs**: `card_id`
* **Actions**:
  1. Verifica se `AgentCardRegistry` está Active.
  2. Calcula o split: `fee_mind = price_usdc * mind_fee_bps / 10000`, `creator_share = price_usdc - fee_mind`.
  3. Transfere `creator_share` de USDC do Buyer para Creator.
  4. Transfere `fee_mind` de USDC do Buyer para MIND Treasury.
  5. Cria/Logga o `UsageReceipt`.
  6. Incrementa `total_executions` no Card e `reputation_score` no Creator.

---

## 3. O Fluxo Atômico (Atomic Buy Flow)

Graças ao paralelismo e atomicidade da Solana, o fluxo ocorre em ~400ms:

1. **Discovery**: Agente (Buyer) encontra o Card via MIND API / GitHub.
2. **Intent**: Agente monta a transação chamando `AtomicPurchaseAndSettle`.
3. **Validation**: Programa valida as contas (Vaults de USDC existem? Preço bate?).
4. **Settlement**: 
   - `Transfer USDC` (Buyer -> Creator) [92%]
   - `Transfer USDC` (Buyer -> Treasury) [8%]
5. **Proof**: Programa emite o evento/recibo na chain.
6. **Execution**: O Agente anexa o TX Hash na request HTTPS para o endpoint do Card, que verifica a transação e retorna o serviço.

Se o Agente não tiver saldo, ou se o Card for inválido, a transação falha antes de qualquer estado ser alterado. **0 risco de calote.**

---

## 4. Economia e Sustentabilidade (Modelagem)

### A Fórmula do MIND Protocol
O take rate (margem do protocolo) é programado em `mind_fee_bps`. 

**Regra de Margem Sustentável:**
`Share_MIND = max[(v + F/N_meta)/P, 0.08]`
Onde:
* **v**: Custo variável de RPC/Log por uso
* **F**: Custo fixo mensal do protocolo
* **N_meta**: Volume meta de execuções
* **P**: Preço do Card

No MVP, a configuração global (`ProtocolConfig`) fixa `mind_fee_bps = 800` (8%). O desenvolvedor recebe 92%.

---

## 5. Roadmap Tecnológico

### Fase 1: MVP Frontier (Agora)
* Liquidação Atômica em USDC (SPL Token padrão).
* PDAs para Registry e Receipts.
* Autenticação via `wallet-adapter`.
* Preço fixo por Card.

### Fase 2: Escrow e Conditional Payments
* Implementação baseada no `solana-program/escrow` oficial.
* Pagamento travado num vault; liberado apenas quando o Agent Card posta o resultado onchain via callback (proof of delivery).

### Fase 3: ZK Scale & Privacy
* **State Compression (Light Protocol)**: Compressão de `UsageReceipt` para baratear custos em cenários de milhões de execuções/segundo.
* **Confidential Transfers (Token2022)**: Permite que Agentes institucionais paguem cards sem revelar o montante na ledger pública, preservando alfa comercial.
