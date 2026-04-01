# Solana Payments Layer Rationale

## 1. O Desafio (A Vantagem Injusta)
O padrão comum de pagamentos na Solana (Solana Pay) é construído para humanos (B2C/C2C), focado na geração de QR Codes que são escaneados por carteiras móveis (Phantom, Solflare). 
No MIND Protocol, a nossa "vantagem injusta" é transformar esse protocolo para **Agent-to-Agent (A2A) Programmatic Checkout**. 

Agentes precisam negociar, gerar faturas e pagar uns aos outros **sem intervenção humana** ("Zero-Click Agentic Payments").

## 2. A Arquitetura Implementada
Para alcançar esse objetivo, a infraestrutura base de pagamentos (`SolanaPaymentsLayer`) atua como uma câmara de compensação (clearinghouse) automática.
O fluxo de vida da fatura on-chain:

1. **Request (Geração da Fatura):**
   - O Agente vendedor (ou o A2A Server em nome dele) gera uma requisição de pagamento via `/v1/payments/solana/request`.
   - Um `reference` (Keypair.generate().publicKey) único é injetado. Ele atua como ID da fatura on-chain.
   - Retorna um URL no formato `solana:`.

2. **Checkout (Assinatura Autônoma via KMS):**
   - O Agente comprador recebe o payload `solana:...`.
   - Em vez de um humano abrir o app do celular, o Agente submete o pagamento ao `TurnkeyKmsProvider` (configurado na fase anterior).
   - O KMS verifica o *Policy Enforcement* (Ex: < 0.05 SOL diário) e assina instantaneamente.

3. **Verify (Reconciliação e Liberação do Serviço):**
   - O A2A Server monitora o `reference` on-chain através de `/v1/payments/solana/verify`.
   - Analisa assinaturas, `preBalances` e `postBalances` do recebedor (SOL ou SPL Token) via `ParsedTransactionWithMeta`.
   - Retorna `confirmed`, permitindo que o Agente Vendedor entregue o serviço/dado ao Agente Comprador.

## 3. Segurança e "Verify-Address" (Source-Grounded)
De acordo com a documentação oficial da Solana sobre Pagamentos (2026-04-01):
- A validação ocorre estritamente sobre a conta final e o montante (`amountMinor` x `decimals`).
- O sistema verifica qual programa rege o ativo (`Token Program` vs `Token-2022`) consultando o catálogo seguro em `supportedAssets.ts`.
- Evitamos o risco de "rent-drain" (onde o pagador arca com o ATA do recebedor) pois o Agente Vendedor já deve possuir o ATA válido.

## 4. Evoluções Próximas
- Adicionar um worker assíncrono para retry de `getSignaturesForAddress` para lidar com HTTP 429 de RPC.
- Mapeamento avançado com yield-bearing accounts (Kamino/Meteora) atuando como Escrow transitório.