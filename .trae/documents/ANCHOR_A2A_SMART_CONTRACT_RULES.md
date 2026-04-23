# Diretrizes de Arquitetura: Contratos Anchor para A2A e Session Keys (Solflare)

Este documento define as regras inegociáveis para a construção de Smart Contracts (via Anchor) no ecossistema MIND Protocol. O objetivo é permitir que agentes autônomos assinem transações atomicamente em nome de usuários humanos, utilizando carteiras efêmeras (Session Keys) delegadas através de carteiras robustas como a **Solflare**, mantendo a segurança institucional e a liquidação atômica (x402).

## 1. O Modelo de Delegação (Session Keys)

Para que a experiência seja "Frictionless" (sem pop-ups do Solflare a cada milissegundo), o contrato inteligente não deve exigir a assinatura da carteira principal para operações corriqueiras do agente.

*   **Wallet Principal (Solflare):** O cofre. Assina apenas transações de alto risco e a criação da delegação.
*   **Wallet Efêmera (Agent Keypair):** O motorista. Uma chave privada gerada localmente (ou no KMS da MIND) que vive apenas na sessão ou no backend do agente.

### Regra de Implementação (Anchor)
O contrato deve possuir um PDA de `AgentPolicy` que mapeia a `authority` (Solflare) para a `session_key` (Efêmera), com limites rígidos.

```rust
#[account]
public struct AgentPolicy {
    public authority: Pubkey,      // A carteira Solflare do usuário
    public session_key: Pubkey,    // A carteira efêmera do Agente
    public max_spend_lamports: u64,// Limite máximo de gasto permitido
    public expiry_slot: u64,       // Quando a procuração expira
}
```

## 2. Regras Inegociáveis do Contrato Inteligente (MIND x402)

Para que os agentes interajam com o ecossistema MIND, o contrato Anchor deve aplicar os seguintes guardrails:

### Regra 1: Validação Estrita de Assinatura (Authority vs Delegate)
O contrato deve aceitar a instrução se ela for assinada pela `authority` (Solflare) **OU** pela `session_key` (Efêmera), mas se for assinada pela efêmera, o contrato deve obrigatoriamente checar o limite de gastos e a validade da sessão (`expiry_slot`).

### Regra 2: Liquidação Atômica (O Split 92/8)
Nenhum agente executa um serviço de graça. A instrução de negócio (ex: pedir um dado, executar um swap) deve incluir as transferências CPI (Cross-Program Invocation) do padrão x402.
*   O contrato deduz o valor do saldo autorizado.
*   Transfere 92% para o `Provider` (quem executou a skill).
*   Transfere 8% para a `Treasury` da MIND.
*   Tudo na mesma instrução. Se a transferência falhar, a lógica inteira sofre *rollback*.

### Regra 3: Verificação de Mindprint (Identidade)
Antes de permitir que o agente efêmero execute uma ação de alto nível no ecossistema, o contrato Anchor deve verificar se a conta principal possui o cNFT (Mindprint) válido emitido pela MIND. Isso blinda o contrato contra ataques Sybil.

### Regra 4: Zero-Trust Payload (Proteção de Calldata)
O contrato não deve confiar em cálculos off-chain passados como argumento pelos agentes. Exemplo: O agente não passa `fee_amount = 5`. O contrato lê a tabela de preços on-chain (do Agent Card) e calcula a fee nativamente.

## 3. O Fluxo de Integração com Solflare (Frontend -> On-chain)

1. **Conexão:** O usuário conecta a Solflare no dApp da MIND.
2. **Geração:** O dApp (ou o KMS Turnkey) gera um `Keypair` efêmero nos bastidores.
3. **Aprovação:** A Solflare é chamada uma única vez para assinar a instrução `InitializeSession`, pagando a taxa de rede e criando o PDA `AgentPolicy` na blockchain.
4. **Execução Autônoma:** A partir desse momento, o agente humano pode fechar o dApp. O Agente Autônomo usa o `Keypair` efêmero para assinar milhares de micro-transações atômicas com os contratos inteligentes, até que o limite financeiro ou de tempo se esgote.

---
**Status:** Aprovado para o playbook de desenvolvimento dos Smart Contracts (Anchor) da MIND Protocol.
