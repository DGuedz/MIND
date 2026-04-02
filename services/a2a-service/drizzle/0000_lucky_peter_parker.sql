CREATE TABLE "a2a_billing_events" (
	"id" text PRIMARY KEY NOT NULL,
	"context_id" text NOT NULL,
	"event_type" text NOT NULL,
	"units" integer NOT NULL,
	"idempotency_key" text,
	"metadata" jsonb NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	CONSTRAINT "a2a_billing_idempotency_idx" UNIQUE("context_id","idempotency_key")
);
--> statement-breakpoint
CREATE TABLE "a2a_context_events" (
	"id" text PRIMARY KEY NOT NULL,
	"context_id" text NOT NULL,
	"event_type" text NOT NULL,
	"payload_hash" text NOT NULL,
	"prev_hash" text,
	"event_hash" text NOT NULL,
	"created_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "a2a_contexts" (
	"id" text PRIMARY KEY NOT NULL,
	"intent_id" text NOT NULL,
	"initiator_agent_id" text NOT NULL,
	"counterparty_agent_id" text,
	"status" text NOT NULL,
	"accepted_task_id" text,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "a2a_tasks" (
	"id" text PRIMARY KEY NOT NULL,
	"context_id" text NOT NULL,
	"executor_agent_id" text NOT NULL,
	"status" text NOT NULL,
	"version" integer NOT NULL,
	"idempotency_key" text,
	"payload" jsonb NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	CONSTRAINT "a2a_tasks_idempotency_idx" UNIQUE("context_id","idempotency_key")
);
