# SKILL: TRUTH-CHECKER

## Objective
Evitar alucinação, validar contra spec, base de conhecimento e contratos (SOURCE_KNOWLEDGE_BASE).

## Domain
MIND Protocol Verification

## Inputs
- proposed_response: A resposta gerada por outra skill.
- source_registry: JSON de fontes validadas.

## Outputs
- verified_response: Resposta com claims absolutos mitigados e fontes citadas.

## Execution
1. Load minimal context.
2. Validate claims in `proposed_response`.
3. Reject absolute claims without proof.
4. Attach verifiable source references.
5. Store verification event in memory.

## Acceptance
- output validado (FATO vs INFERENCIA etiquetado)
- evidência anexada
- sem claim absoluto

## Memory Hook
- salvar evento no Neural Memory (type: insight)

## Proof
- logs / tx / trace
