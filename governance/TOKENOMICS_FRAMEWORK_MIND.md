# MIND Tokenomics Framework (Stage-Gated)

Status:
- Proposed framework for investment planning and ecosystem design.
- Not a live token launch plan.

## 1. Tokenomics Principle
MIND must be economically strong before being tokenized.

Rule:
- revenue-first,
- utility-first,
- governance-last.

This avoids speculative token dependence before operational maturity.

## 2. Economic Objective
Align four actors:
- protocol operators,
- integrators/design partners,
- treasury/governance participants,
- end users paying for reliable A2A execution.

Tokenomics should reinforce:
- reliability,
- policy compliance,
- long-term liquidity and treasury health.

## 3. Phased Model
### Phase A - No token dependency
Protocol monetizes directly through:
- execution fee,
- proof fee,
- policy/risk fee,
- x402 micropayments,
- treasury optimization share.

Readiness gates to move to Phase B:
- stable recurring revenue window,
- production SLO compliance,
- incident governance maturity,
- partner demand for network incentives.

### Phase B - Utility token activation
Token utilities:
- staking for operator participation,
- slashing for harmful behavior,
- fee rebates for aligned usage,
- access tiering for high-value routing services.

Economic guardrails:
- no mandatory token for basic safety-critical flows,
- no emissions disconnected from productive activity,
- no promises of fixed yield.

### Phase C - Governance and treasury flywheel
Token enables:
- parameter governance,
- ecosystem grants,
- security budget scaling,
- partner incentive programs.

## 4. Proposed Utility Set
1. `Stake-to-Operate`
- Operators stake to run privileged routing or proof services.

2. `Stake-to-Signal`
- Integrators stake to receive higher throughput quotas and fee discounts.

3. `Slash-on-Violation`
- Stake reduction on policy bypass, repeated failure, or evidence tampering.

4. `Governance Rights`
- Voting on non-critical protocol parameters (fees, thresholds, grants).

## 5. Emission and Supply Design (Proposed)
Initial approach:
- fixed maximum supply cap with slow unlock profile,
- dynamic emissions linked to productive volume,
- treasury reserve for long-term protocol sustainability.

Suggested controls:
- linear vesting for core contributors and investors,
- cliff + long vesting to avoid early sell pressure,
- emissions budget reviewed by governance epochs.

## 6. Proposed Allocation Bands (Preliminary)
Not final. For modeling only.

- ecosystem incentives: 25% to 35%
- protocol treasury: 15% to 25%
- core contributors: 15% to 22%
- investors: 10% to 20%
- strategic reserves: 8% to 15%

Final split depends on:
- legal structuring,
- acceleration terms,
- long-term treasury and security budget needs.

## 7. Fee Routing Logic
Revenue in stable rails should be allocated by policy:
- operating reserve,
- security and incident buffer,
- ecosystem incentives,
- treasury growth.

A token buyback model is optional and should be activated only with:
- positive cash flow consistency,
- audited treasury discipline,
- explicit governance approval.

## 8. Slashing and Risk Controls
Slashing must be objective and evidence-based.

Slash trigger examples:
- repeated policy bypass attempts,
- fake or unverifiable proof claims,
- sustained SLO failure above threshold,
- replay abuse or malicious event injection.

Requirements:
- evidence bundle per slash event,
- appeal window and governance process,
- transparency logs.

## 9. Token Launch Readiness Checklist
All must be true before token launch proposal:
- 3 to 5 active design partners,
- recurring paid usage window validated,
- operational SLOs met for defined period,
- incident severity process active (P0-P3),
- external anchor proof path functioning,
- legal and regulatory review completed.

If any condition is unmet:
- keep fee-first model,
- postpone token launch.

## 10. KPI System for Token Health
Core token-economy KPIs:
- productive fee volume,
- active staked operators,
- slash rate and root causes,
- treasury runway in months,
- partner retention and expansion,
- proof verification reliability rate.

## 11. Anti-Overclaim Policy
Never claim:
- guaranteed APY,
- guaranteed token appreciation,
- zero-risk yield.

Always communicate:
- utility and governance purpose,
- stage-gated activation criteria,
- explicit operational dependencies.

## 12. Fatos, Inferencias, Limites, Fontes
### FATOS
- MIND currently supports fee-generating rails without token dependency.
- Governance and runtime controls already exist in the stack.
- Source-grounded policy requires explicit limits and evidence.

### INFERENCIAS
- A utility token can improve alignment after PMF and operational maturity.
- Slashing and staking can reduce adverse behavior in operator networks.

### LIMITES
- This framework is not legal advice or a public token offer.
- Final tokenomics must pass legal, tax, and governance review.

### FONTES
- governance/REVENUE_MODEL.md
- governance/FLASH_LIQUIDITY_COORDINATION_THESIS.md
- governance/SOURCE_KNOWLEDGE_BASE.md
- governance/SOURCE_REGISTRY.json
- docs/STRICT_MODE_POLICY.md
- services/event-router-service/incident_severity.yaml
