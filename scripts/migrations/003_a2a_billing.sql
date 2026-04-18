create table if not exists a2a_billing_events (
  id text primary key,
  session_id text not null,
  event_type text not null,
  units integer not null,
  idempotency_key text,
  metadata jsonb not null,
  created_at timestamptz not null
);
