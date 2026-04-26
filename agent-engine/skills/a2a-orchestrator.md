# SKILL: A2A-ORCHESTRATOR

## Objective
Gerenciar o handshake entre agentes, controlando sessão, pagamento e prova atômica.

## Domain
A2A Coordination

## Inputs
- target_agent_id: ID do agente a ser chamado.
- payload: Dados da microtask.
- x402_offer: Preço oferecido pela execução.

## Outputs
- session_receipt: Mindprint cNFT payload confirmando handshake.

## Execution
1. Load minimal context.
2. Authenticate agents (KMS handshake).
3. Validate x402 budget constraints.
4. Execute A2A payload exchange.
5. Generate evidence of interaction.
6. Store in memory.

## Acceptance
- output validado
- evidência anexada
- sem claim absoluto

## Memory Hook
- salvar evento no Neural Memory (type: execution)

## Proof
- logs / tx / trace
