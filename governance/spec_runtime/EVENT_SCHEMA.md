# Runtime Event Schema

Use this envelope for trigger resolution.

```json
{
  "event_id": "evt_001",
  "event_type": "intent.policy.checked",
  "timestamp": "2026-04-06T12:00:00Z",
  "agent_id": "mind_router",
  "context": {
    "intent_id": "int_123",
    "topic": "revenue",
    "decision": "ALLOW",
    "proof_status": "verified"
  },
  "policy": {
    "severity": "medium",
    "dedupe_key": "int_123",
    "run_spec_update": true
  }
}
```

## Recommended event types
- `conversation.message.received`
- `intent.created`
- `intent.policy.checked`
- `execution.submitted`
- `tx.confirmed`
- `proof.anchored`
- `drift.detected`
- `market.runtime.signal`

## Rule chain
`signal -> policy -> actions`

## Runtime outputs
- `governance/spec_runtime/trigger_outcomes.jsonl`
- `governance/spec_runtime/decision_log.jsonl`
- `governance/spec_runtime/risk_register.json`
- `governance/spec_runtime/execution_learnings.jsonl`
