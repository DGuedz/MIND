# SKILL: X402-MONETIZATION

## Objective
Cobrar por execução, validar liquidação atômica e processar split determinístico (92% creator / 8% protocol).

## Domain
Atomic Settlement

## Inputs
- execution_receipt: Prova da tarefa realizada.
- payment_amount: Valor em lamports (SOL/USDC).

## Outputs
- settlement_tx: Transaction Hash da liquidação.

## Execution
1. Load minimal context.
2. Validate inputs (check pending payment).
3. Execute token transfer (92/8 split).
4. Mint proof via Metaplex Core (Mindprint).
5. Store settlement event in memory.

## Acceptance
- output validado
- evidência anexada (Tx Hash)
- sem claim absoluto

## Memory Hook
- salvar evento no Neural Memory (type: execution)

## Proof
- logs / tx / trace
