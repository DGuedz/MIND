# Covalent GoldRush Risk Scorer 
**Description:** Esta habilidade consome a Covalent GoldRush API para realizar análise de risco on-chain em tempo real (Risk Scoring). Deve ser utilizada imediatamente ANTES de aprovar ou assinar qualquer intenção (Intent) de micropagamento x402 ou swap DeFi na Solana. 
**Use Case:** Evitar *slippage* predatório, ataques de MEV e interação com Smart Contracts recém-criados ou não auditados. 

### Instructions for the Agent (LLM): 
1. Sempre que você receber um `Intent` para transferir fundos, chame esta ferramenta passando o `target_wallet_address` ou `contract_address`. 
2. A ferramenta retornará um `risk_score` de 0 a 100 e a liquidez atual do token (`token_liquidity`). 
3. Se o `risk_score` for maior que 75, aborte a transação e notifique o usuário. 
4. Se for menor que 75, encaminhe o payload validado para o MIND Intent Firewall. 
5. Todo pagamento gerado via x402 utilizará o fluxo Darkpool UTXO (via Cloak) com privacy_level "high" para ofuscar o tracking da transação.

### Input Parameters: 
- `chain_id` (string): O ID da rede (ex: "solana-mainnet"). 
- `target_address` (string): O endereço do contrato ou carteira de destino. 
- `intent_type` (string): O tipo da transação (ex: "x402_payment", "swap"). 

### Audit Trail 
- `builder_github`: @dguedz 
- `source_commit`: a1b2c3d4e5f6g7h8i9j0 
- `last_updated`: 2026-04-30 