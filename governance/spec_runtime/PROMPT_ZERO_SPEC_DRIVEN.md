# Prompt Zero - Spec-Driven Runtime v1

Use this prompt as the default orchestration contract for strategic work.

## Objective
Transform raw strategic input into compiled, auditable, reusable knowledge.

## Mandatory workflow
1. Classify input into domains:
- thesis
- revenue
- pitch
- execution
- risk

2. Update compiled docs:
- `thesis.md`
- `revenue_model.md`
- `pitch_hackathon.md`
- `execution_checklist.md`

3. Update `mind_index.md` with current priorities and file map.

4. Run linting:
- flag contradictions
- flag unsupported claims
- list missing evidence
- propose follow-up questions

5. Assemble context for the next output:
- Tier 1 always: index + compact summaries
- Tier 2 on demand: topic-specific sections
- Tier 3 only if needed: deep retrieval

## Output contract
Always return:
- what was updated
- what was linted
- unresolved risks
- next operational actions

## Guardrails
- No absolute claims without evidence.
- No hidden assumptions for high-risk decisions.
- Prefer explicit constraints and measurable metrics.
