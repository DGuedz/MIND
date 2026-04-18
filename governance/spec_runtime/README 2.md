# Spec Runtime for MIND

This directory turns strategic conversation into reusable operational knowledge.

## Architecture (6 layers)
1. Raw Memory Layer
- Source data from chats, decisions, outputs, fixes, and specs.

2. Compiled Knowledge Layer
- Human-readable dossiers that organize context and decisions.

3. Memory Index Layer
- A short index (`mind_index.md`) that routes context quickly.

4. Filing Layer
- Valuable outputs are persisted back into docs as reusable knowledge.

5. Memory Linting Layer
- Contradictions, overclaims, and missing evidence are flagged.

6. Tiered Retrieval Layer
- Tier 1: index + short summaries
- Tier 2: targeted sections by topic
- Tier 3: deep retrieval when Tier 1 and 2 are insufficient

## Core documents
- `thesis.md`
- `revenue_model.md`
- `pitch_hackathon.md`
- `execution_checklist.md`
- `mind_index.md`
- `skills_map.md`
- `PROMPT_ZERO_SPEC_DRIVEN.md`
- `FILES_SPEC.md` (exact contract for event router package)
- `LIVE_RUNTIME_WIRING_SPEC.md` (service ingress + adapters + guardrails)

## Runtime commands
- `pnpm spec:assemble-context`
- `pnpm spec:assemble-context --topic=revenue`
- `pnpm spec:lint-claims`
- `pnpm spec:resolve-trigger --event-file=governance/spec_runtime/samples/intent_block_event.json`
- `pnpm spec:test-triggers` (runs all trigger classes with `--ignore-policy=true`)
- `pnpm spec:event-router --event-file=governance/spec_runtime/samples/intent_block_event.json`
- `pnpm spec:event-router-service`
- `pnpm spec:test-event-router-service`
- `pnpm spec:validate-deployment-pack`
- `pnpm spec:runtime-metrics`
- `pnpm spec:context-feedback`
- `pnpm spec:runtime-health`

## Recommended operating cycle
1. Capture new strategic input.
2. Update one or more core documents.
3. Refresh `mind_index.md`.
4. Run linting.
5. Assemble Tier 1 context before generating outputs (deck, docs, demo, pitch).
