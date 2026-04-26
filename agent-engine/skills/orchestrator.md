# SKILL: ORCHESTRATOR

## Objective
Classificar intenção, selecionar skill apropriada, injetar contexto mínimo, validar policy e exigir evidência final.

## Domain
MIND Protocol Core Routing

## Inputs
- user_intent: Texto ou JSON com a intenção.
- agent_context: Estado atual da memória neural.
- policy_constraints: Regras de segurança (KMS, VSC Economy).

## Outputs
- execution_plan: Plano validado de execução da skill selecionada.

## Execution
1. Load minimal context from Neural Memory.
2. Validate inputs against global constraints (`policy_constraints`).
3. Select target skill based on intent match.
4. Delegate execution to target skill.
5. Store orchestration event in memory.

## Acceptance
- output validado
- evidência anexada
- sem claim absoluto

## Memory Hook
- salvar evento no Neural Memory (type: intent)

## Proof
- logs / tx / trace
