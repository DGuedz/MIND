# PRD: Arquitetura Anchor para Session Keys (Solflare x MIND) e Verticais de Agent Cards

## 1. Visao Geral e UX (A "Conta Corrente" e o "Cartao Corporativo")
Para atingir o padrao ouro de UX da Solflare ("para sua mae e para um degen"), a interacao humana deve ser minimizada a uma unica aprovacao de risco (Setup). O MIND Protocol utiliza PDAs (Program Derived Addresses) no Anchor para criar "Session Keys" (Chaves Efemeras). 

A Solflare atua como o "Cofre" (Stronghold). A Chave Efemera atua como o "Cartao de Credito Corporativo com Limite". Se a chave efemera for comprometida, o dano e matematicamente limitado ao estabelecido no PDA, e o usuario pode revoga-la a qualquer momento.

## 2. Modelagem de Dados: O PDA Base
Todo agente operando no MIND Protocol precisa instanciar uma `AgentPolicy`.

```rust
#[account]
pub struct AgentPolicy {
    pub authority: Pubkey,         // A carteira Solflare do dono (Humano)
    pub session_key: Pubkey,       // A chave efemera do Agente
    pub vertical_id: u8,           // Identificador da Vertical (1=Yield, 2=Data, 3=Risk)
    pub valid_until: i64,          // Timestamp de expiracao
    pub total_spent: u64,          // Acumulado de gastos (para tracking)
    pub bump: u8,
}
```

## 3. As Verticais de Dados (Agent Cards)
O poder do MIND Protocol e que cada Agent Card pertence a uma vertical especifica. O contrato Anchor deve possuir extensoes da `AgentPolicy` dependendo do que o agente tem permissao para fazer.

### Vertical 1: Yield & Trading Agents (Ex: Volan)
Foco: Movimentacao financeira e alocacao de liquidez (JIT).
- **Regra de Contrato:** O agente nao pode sacar para carteiras desconhecidas. Ele so pode assinar transacoes (CPIs) direcionadas a programas aprovados (ex: Kamino, Raydium) ou enviar de volta para a Solflare da `authority`.
- **Extensao de Dados no PDA:**
```rust
pub struct YieldPolicyExt {
    pub max_spend_per_tx: u64,     // Limite por transacao
    pub max_total_spend: u64,      // Limite global da sessao
    pub allowed_programs: [Pubkey; 5], // Whitelist de DEXes/Vaults
}
```

### Vertical 2: Data & Oracle Agents (Ex: Dexter)
Foco: Compra e venda de inteligencia (Market Signals) e execucao de APIs via A2A.
- **Regra de Contrato:** O risco financeiro por chamada e minusculo (micropagamentos x402), mas o risco de spam (DDoS de transacoes) e alto. O contrato foca em rate-limits.
- **Extensao de Dados no PDA:**
```rust
pub struct DataPolicyExt {
    pub max_micro_lamports: u64,   // Orcamento maximo para chamadas A2A
    pub max_calls_per_hour: u16,   // Rate limit on-chain
    pub last_call_timestamp: i64,  // Tracking de frequencia
}
```

### Vertical 3: Risk & Firewall Agents (Ex: Krios)
Foco: Seguranca, monitoramento e circuit-breakers.
- **Regra de Contrato:** Este agente nao tem permissao para gastar fundos (exceto taxas de rede basicas). Sua unica permissao e alterar o estado de outros PDAs para "Frozen" em caso de anomalia.
- **Extensao de Dados no PDA:**
```rust
pub struct RiskPolicyExt {
    pub can_freeze_yield_agents: bool,
    pub can_revoke_sessions: bool,
}
```

## 4. O Fluxo de Execucao (Anchor Walkthrough)

### A. Setup da Sessao (Assinado pela Solflare)
A unica vez que a interface da Solflare aparece para o usuario.
```rust
#[derive(Accounts)]
pub struct InitializeSession<'info> {
    #[account(mut)]
    pub authority: Signer<'info>, // O Humano assinando
    
    #[account(
        init,
        payer = authority,
        space = 8 + std::mem::size_of::<AgentPolicy>(),
        seeds = [b"policy", authority.key().as_ref(), session_key.key().as_ref()],
        bump
    )]
    pub policy: Account<'info, AgentPolicy>,
    
    /// CHECK: Apenas registrando a chave publica gerada no frontend
    pub session_key: UncheckedAccount<'info>,
    pub system_program: Program<'info, System>,
}
```

### B. Execucao Autonoma (Assinada pela Chave Efemera)
O agente esta rodando no servidor. Ele encontra uma oportunidade, monta a transacao e assina localmente. O contrato Anchor valida se a assinatura bate com a policy registrada.
```rust
#[derive(Accounts)]
pub struct ExecuteA2A<'info> {
    pub session_key: Signer<'info>, // O Agente assinando (sem interrupcao humana)
    
    #[account(
        mut,
        seeds = [b"policy", authority.key().as_ref(), session_key.key().as_ref()],
        bump = policy.bump,
        constraint = policy.session_key == session_key.key() @ ErrorCode::InvalidSessionKey,
        constraint = policy.valid_until > Clock::get()?.unix_timestamp @ ErrorCode::SessionExpired,
    )]
    pub policy: Account<'info, AgentPolicy>,
    
    /// CHECK: Validado internamente na logica
    pub authority: UncheckedAccount<'info>,
    
    // Contas necessarias para o split x402 (92/8)
    // ...
}
```

## 5. Liquidacao Atomica (x402)
Durante a execucao autonoma (`ExecuteA2A`), o codigo Rust interno deve garantir que o pagamento pelo servico do Agent Card seja feito na hora.
Se o custo do servico e 100 lamports:
1. O contrato debita 100 lamports do cofre autorizado pela Policy.
2. Transfere 92 lamports para o Provedor.
3. Transfere 8 lamports para a Treasury (Protocolo).
4. Se o `total_spent` ultrapassar o limite, a transacao sofre *revert*.

## Conclusao
Esta arquitetura blinda o capital do usuario (Solflare) enquanto remove 100% do atrito de UX. O Agente e livre para interagir no Marketplace de Agent Cards do MIND Protocol, desde que respeite as grades estruturais definidas na `AgentPolicy`.
