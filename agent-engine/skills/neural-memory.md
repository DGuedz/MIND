# SKILL: NEURAL-MEMORY

## Objective
Gerenciar operações append-only, compressão semântica e retrieval contextual para evitar context bloat.

## Domain
MIND Storage & Intelligence

## Inputs
- event_payload: JSON contendo type, source, payload e evidence.
- query: String para retrieval seletivo.

## Outputs
- memory_event_id: ID do evento armazenado.
- context_snippet: Bloco condensado de memória para injeção.

## Execution
1. Load minimal context.
2. Validate append-only constraints (no overwrites).
3. Hash payload for integrity.
4. Store in Vector DB / On-chain PDA.
5. Generate retrieval index.

## Acceptance
- output validado
- evidência anexada
- sem claim absoluto

## Memory Hook
- salvar evento no Neural Memory (type: insight)

## Proof
- logs / tx / trace
