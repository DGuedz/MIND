create table if not exists a2a_sessions (
  id text primary key,
  intent_id text not null,
  initiator_agent_id text not null,
  counterparty_agent_id text,
  status text not null,
  accepted_proposal_id text,
  expires_at timestamptz not null,
  created_at timestamptz not null,
  updated_at timestamptz not null
);

create table if not exists a2a_proposals (
  id text primary key,
  session_id text not null,
  proposer_agent_id text not null,
  version integer not null,
  idempotency_key text,
  payload jsonb not null,
  created_at timestamptz not null
);

create table if not exists a2a_session_events (
  id text primary key,
  session_id text not null,
  event_type text not null,
  payload_hash text not null,
  prev_hash text,
  event_hash text not null,
  created_at timestamptz not null
);

create table if not exists a2a_billing_events (
  id text primary key,
  session_id text not null,
  event_type text not null,
  units integer not null,
  idempotency_key text,
  metadata jsonb not null,
  created_at timestamptz not null
);
