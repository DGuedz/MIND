# Critical Event Coverage

This matrix defines the mandatory critical events for live service wiring and how they are emitted automatically through `event-router-service`.

## Coverage Matrix

| Service | Critical Event | Adapter | Emitted Automatically | Validated |
|---|---|---|---:|---:|
| intent | `intent.created` | `services/intent-service/src/runtime_events.ts` | yes | yes |
| intent | `intent.policy.checked` | `services/intent-service/src/runtime_events.ts` | yes | yes |
| intent | `intent.blocked` | `services/intent-service/src/runtime_events.ts` | yes | yes |
| intent | `intent.allowed` | `services/intent-service/src/runtime_events.ts` | yes | yes |
| proof | `proof.generated` | `services/proof-service/src/runtime_events.ts` | yes | yes |
| proof | `proof.verified` | `services/proof-service/src/runtime_events.ts` | yes | yes |
| proof | `proof.failed` | `services/proof-service/src/runtime_events.ts` | yes | yes |
| execution | `execution.submitted` | `services/execution-service/src/runtime_events.ts` | yes | yes |
| execution | `execution.confirmed` | `services/execution-service/src/runtime_events.ts` | yes | yes |
| execution | `execution.failed` | `services/execution-service/src/runtime_events.ts` | yes | yes |
| market | `market.slippage.alert` | `services/market-context-service/src/runtime_events.ts` | yes | yes |
| market | `market.latency.alert` | `services/market-context-service/src/runtime_events.ts` | yes | yes |
| market | `market.route.degraded` | `services/market-context-service/src/runtime_events.ts` | yes | yes |

## Integration Gate

Command:

```bash
pnpm exec tsx scripts/service_router_integration_test.ts
```

Expected:
- service adapters emit through `shared/router_client.ts`
- router ingress/outcome/security logs are persisted
- resolver receives emitted events
- replay is blocked
- guardrail breach is captured
- dispatch failure is spooled and later drained successfully

Latest validation snapshot:
- `artifacts/service-router-integration-2026-04-06T12-21-08-765Z/report.json`
- status: `pass`

## Shared Contracts

- Runtime event contract: `shared/runtime_event_contract.ts`
- Router HTTP client + retry/fallback: `shared/router_client.ts`
- Local fallback spool: `failed_event_spool/`
