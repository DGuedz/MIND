CREATE TABLE IF NOT EXISTS ecosystem_signals (
  id TEXT PRIMARY KEY,
  protocol_name TEXT NOT NULL,
  source_url TEXT NOT NULL,
  source_type TEXT NOT NULL,
  published_at TIMESTAMPTZ,
  headline TEXT NOT NULL,
  summary TEXT NOT NULL,
  claim_type TEXT NOT NULL,
  classification_layer TEXT NOT NULL,
  confidence_score NUMERIC NOT NULL,
  content_hash TEXT NOT NULL UNIQUE,
  timestamp TIMESTAMPTZ NOT NULL,
  last_seen_at TIMESTAMPTZ NOT NULL,
  first_seen_at TIMESTAMPTZ NOT NULL,
  evidence JSONB DEFAULT '[]',
  metadata JSONB DEFAULT '{}'
);
