# Runtime Package Spec (5 files)

This file defines the exact contract for the first autonomy cycle package.

## 1) `scripts/event_router.ts`
### Purpose
Single ingress adapter for runtime events.

### Inputs
- `--event-file=<path>` or `--event-json=<json>` or stdin JSON.

### Responsibilities
1. validate event envelope
2. normalize `event_type`
3. apply queue priority from `policy_priorities.yaml`
4. append event to `event_stream.jsonl`
5. invoke `trigger_resolver.ts`
6. persist router outcomes

### Outputs
- `governance/spec_runtime/event_router_ingress.jsonl`
- `governance/spec_runtime/event_router_outcomes.jsonl`
- stdout JSON summary

## 2) `shared/event_emitter.ts`
### Purpose
Shared runtime event contract + local emitter utilities.

### Exports
- `RuntimeEvent`
- `createRuntimeEvent(input)`
- `validateRuntimeEvent(event)`
- `appendToEventStream(event)`

### Output
- `governance/spec_runtime/event_stream.jsonl`

## 3) `governance/spec_runtime/policy_priorities.yaml`
### Purpose
Priority policy map (high/medium/low) by event and condition.

### Fields
- `priorities.{high|medium|low}`
- `event_priority_map.<event_type>.when[]`
- `event_priority_map.<event_type>.default`

## 4) `scripts/runtime_metrics.ts`
### Purpose
Compute governance/runtime KPIs from persisted outcomes.

### KPIs
- trigger volume by class
- allow vs block
- proof verified rate
- policy breach count
- mean response time
- top recurring risks
- context update rate

### Output
- `artifacts/runtime-metrics-<timestamp>.json`

## 5) `scripts/context_feedback_loop.ts`
### Purpose
Close feedback loop from outcomes to next context and policy posture.

### Responsibilities
1. aggregate latest decisions and learnings
2. compute `risk_pressure_score`
3. persist `context_feedback_state.json`
4. update `mind_index.md` feedback snapshot
5. open review request when risk threshold is breached

### Output
- `governance/spec_runtime/context_feedback_state.json`
- `governance/spec_runtime/review_requests.jsonl` (conditional)
