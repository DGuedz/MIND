create table if not exists agents (
  id text primary key,
  name text not null,
  role text not null,
  wallet text not null,
  status text not null,
  policy_id text,
  created_at timestamptz not null
);

create table if not exists agent_capabilities (
  agent_id text not null,
  capability text not null
);

create table if not exists market_contexts (
  id text primary key,
  source text not null,
  snapshot_hash text not null,
  score numeric not null,
  created_at timestamptz not null
);

create table if not exists intents (
  id text primary key,
  creator_agent_id text not null,
  target_agent_id text,
  asset text not null,
  action text not null,
  amount text not null,
  confidence numeric not null,
  risk_score numeric not null,
  expiry_ts timestamptz not null,
  policy_id text not null,
  policy_hash text,
  market_context_id text,
  status text not null,
  created_at timestamptz not null,
  updated_at timestamptz not null
);

create table if not exists intent_events (
  id text primary key,
  intent_id text not null,
  event_type text not null,
  payload_hash text not null,
  prev_hash text,
  event_hash text not null,
  created_at timestamptz not null
);

create table if not exists approvals (
  id text primary key,
  intent_id text not null,
  channel text not null,
  requester_id text not null,
  decision text,
  decided_at timestamptz,
  created_at timestamptz not null
);

create table if not exists approval_events (
  id text primary key,
  approval_id text not null,
  event_type text not null,
  payload_hash text not null,
  prev_hash text,
  event_hash text not null,
  created_at timestamptz not null
);

create table if not exists executions (
  id text primary key,
  intent_id text not null,
  mode text not null,
  status text not null,
  tx_hash text,
  receipt_hash text,
  created_at timestamptz not null,
  executed_at timestamptz
);

create table if not exists execution_events (
  id text primary key,
  execution_id text not null,
  event_type text not null,
  payload_hash text not null,
  prev_hash text,
  event_hash text not null,
  created_at timestamptz not null
);

create table if not exists proofs (
  id text primary key,
  intent_id text not null,
  approval_id text,
  execution_id text,
  proof_hash text not null,
  created_at timestamptz not null
);

create table if not exists proof_anchors (
  proof_id text not null,
  type text not null,
  hash text not null
);

create table if not exists proof_events (
  id text primary key,
  proof_id text not null,
  event_type text not null,
  payload_hash text not null,
  prev_hash text,
  event_hash text not null,
  created_at timestamptz not null
);
