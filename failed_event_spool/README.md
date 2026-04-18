# Failed Event Spool

Local fallback queue for runtime events that could not be dispatched to `event-router-service`.

- `pending/`: events with `pending_dispatch` status.
- `dispatched/`: events that were replayed successfully or rejected permanently.
- `dispatch_failures.jsonl`: append-only failure evidence log.

This directory is used by `shared/router_client.ts`.
