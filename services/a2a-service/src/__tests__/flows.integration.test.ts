import { describe, it, expect, vi, beforeEach } from "vitest";
import { server } from "../index.js";
import * as repository from "../db/repository.js";
import { A2AContextStatus, A2ATaskStatus } from "../db/repository.js";

// Mock the repository layer completely
vi.mock("../db/repository.js", () => {
  return {
    createContext: vi.fn(),
    createTask: vi.fn(),
    getContextById: vi.fn(),
    getTaskById: vi.fn(),
    updateContextStatus: vi.fn(),
    recordBillingEvent: vi.fn(),
    listContextEvents: vi.fn(),
    listTasksByContextId: vi.fn(),
    listBillingEventsByContextId: vi.fn(),
    getA2AMetrics: vi.fn(),
  };
});

// Also mock db check and solana connection if necessary, but fastify routes shouldn't trigger them
// unless we hit /health/db or specific routes.

describe("A2A Server Integration Flows", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("1. Happy Path (Auto-Execution / Approved)", () => {
    it("should open context and create a task successfully", async () => {
      // Mock createContext
      vi.mocked(repository.createContext).mockResolvedValue({
        contextId: "123e4567-e89b-12d3-a456-426614174000",
        event: { id: "123e4567-e89b-12d3-a456-426614174001" as any, contextId: "123e4567-e89b-12d3-a456-426614174000", eventType: "a2a.context.created", payloadHash: "hash1", prevHash: null, eventHash: "hash1", createdAt: new Date() }
      });

      // Step 1: Client opens context
      const ctxRes = await server.inject({
        method: "POST",
        url: "/v1/a2a/contexts",
        headers: {
          authorization: "Bearer MIND_INSTITUTIONAL_TEST_TOKEN"
        },
        payload: {
          intentId: "intent_happy",
          initiatorAgentId: "client_agent",
          expiresAt: new Date(Date.now() + 86400000).toISOString() // +1 day
        }
      });

      expect(ctxRes.statusCode).toBe(201);
      const ctxJson = ctxRes.json();
      expect(ctxJson.contextId).toBe("123e4567-e89b-12d3-a456-426614174000");

      // Mock getContextById for the next step
      vi.mocked(repository.getContextById).mockResolvedValue({
        id: "123e4567-e89b-12d3-a456-426614174000" as any,
        intentId: "intent_happy",
        initiatorAgentId: "client_agent",
        counterpartyAgentId: null,
        status: "open",
        acceptedTaskId: null,
        expiresAt: new Date(Date.now() + 86400000),
        createdAt: new Date(),
        updatedAt: new Date()
      });

      // Mock createTask
      vi.mocked(repository.createTask).mockResolvedValue({
        taskId: "123e4567-e89b-12d3-a456-426614174002",
        version: 1,
        event: { id: "123e4567-e89b-12d3-a456-426614174003" as any, contextId: "123e4567-e89b-12d3-a456-426614174000", eventType: "a2a.task.created", payloadHash: "hash2", prevHash: "hash1", eventHash: "hash2", createdAt: new Date() }
      });

      // Step 2: Enqueue a task (e.g., Risk Check)
      const taskRes = await server.inject({
        method: "POST",
        url: "/v1/a2a/contexts/123e4567-e89b-12d3-a456-426614174000/tasks",
        headers: {
          authorization: "Bearer MIND_INSTITUTIONAL_TEST_TOKEN"
        },
        payload: {
          executorAgentId: "mind_risk_agent",
          payload: { action: "SWAP", amount: 5 } // < 10 SOL, auto-approve simulation
        }
      });

      expect(taskRes.statusCode).toBe(201);
      const taskJson = taskRes.json();
      expect(taskJson.taskId).toBe("123e4567-e89b-12d3-a456-426614174002");
      expect(taskJson.event).toBeDefined();
    });
  });

  describe("2. Approval Required Flow (> 10 SOL)", () => {
    it("should accept context after human approval", async () => {
      // Mock Context & Task exists
      vi.mocked(repository.getContextById).mockResolvedValue({
        id: "ctx_approval_001",
        intentId: "intent_large",
        initiatorAgentId: "client_agent",
        counterpartyAgentId: null,
        status: "open",
        acceptedTaskId: null,
        expiresAt: new Date(Date.now() + 86400000),
        createdAt: new Date(),
        updatedAt: new Date()
      });

      vi.mocked(repository.getTaskById).mockResolvedValue({
        id: "tsk_large_001",
        contextId: "ctx_approval_001",
        executorAgentId: "mind_risk_agent",
        status: "approval_required",
        version: 1,
        idempotencyKey: null,
        payload: { action: "SWAP", amount: 50 }, // > 10 SOL
        createdAt: new Date()
      });

      vi.mocked(repository.updateContextStatus).mockResolvedValue({
        id: "123e4567-e89b-12d3-a456-426614174003" as any, contextId: "ctx_approval_001", eventType: "a2a.context.accepted", payloadHash: "hash3", prevHash: "hash2", eventHash: "hash3", createdAt: new Date()
      });

      vi.mocked(repository.recordBillingEvent).mockResolvedValue({
        id: "123e4567-e89b-12d3-a456-426614174004" as any, contextId: "ctx_approval_001", eventType: "a2a.context.accepted", units: 1, metadata: {}, idempotencyKey: null, createdAt: new Date()
      });

      // Step 3: Human approves via Telegram -> calls /accept
      const acceptRes = await server.inject({
        method: "POST",
        url: "/v1/a2a/contexts/ctx_approval_001/accept",
        headers: {
          authorization: "Bearer MIND_INSTITUTIONAL_TEST_TOKEN"
        },
        payload: {
          taskId: "tsk_large_001",
          acceptedByAgentId: "human_operator"
        }
      });

      expect(acceptRes.statusCode).toBe(202);
      const acceptJson = acceptRes.json();
      expect(acceptJson.status).toBe("accepted");
      expect(acceptJson.contextId).toBe("ctx_approval_001");
      expect(acceptJson.taskId).toBe("tsk_large_001");

      expect(repository.updateContextStatus).toHaveBeenCalledWith(expect.objectContaining({
        contextId: "ctx_approval_001",
        status: "accepted",
        acceptedTaskId: "tsk_large_001"
      }));
    });
  });

  describe("3. Blocked Flow (Cancelled by Policy/Risk)", () => {
    it("should cancel context when policy fails", async () => {
      vi.mocked(repository.getContextById).mockResolvedValue({
        id: "ctx_blocked_001",
        intentId: "intent_invalid",
        initiatorAgentId: "client_agent",
        counterpartyAgentId: null,
        status: "open",
        acceptedTaskId: null,
        expiresAt: new Date(Date.now() + 86400000),
        createdAt: new Date(),
        updatedAt: new Date()
      });

      vi.mocked(repository.updateContextStatus).mockResolvedValue({
        id: "123e4567-e89b-12d3-a456-426614174005" as any, contextId: "ctx_blocked_001", eventType: "a2a.context.cancelled", payloadHash: "hash4", prevHash: "hash3", eventHash: "hash4", createdAt: new Date()
      });

      // IntentFirewall logic is separated from these API endpoints (the API acts as the orchestrator).
      // Here we simulate the Orchestrator calling /cancel because Policy failed.
      const cancelRes = await server.inject({
        method: "POST",
        url: "/v1/a2a/contexts/ctx_blocked_001/cancel",
        headers: {
          authorization: "Bearer MIND_INSTITUTIONAL_TEST_TOKEN"
        },
        payload: {
          cancelledByAgentId: "mind_policy_agent",
          reason: "RC_POLICY_VIOLATION"
        }
      });

      expect(cancelRes.statusCode).toBe(202);
      expect(cancelRes.json().status).toBe("cancelled");
      expect(cancelRes.json().event).toBeDefined();

      expect(repository.updateContextStatus).toHaveBeenCalledWith(expect.objectContaining({
        status: "cancelled",
        eventType: "a2a.context.cancelled"
      }));
    });
  });

  describe("4. Audit Trail (Timeline Endpoint)", () => {
    it("should return the append-only event queue and tasks", async () => {
      vi.mocked(repository.getContextById).mockResolvedValue({
        id: "ctx_audit_001",
        intentId: "intent_audit",
        initiatorAgentId: "client_agent",
        counterpartyAgentId: null,
        status: "accepted",
        acceptedTaskId: "tsk_audit_001",
        expiresAt: new Date(Date.now() + 86400000),
        createdAt: new Date(),
        updatedAt: new Date()
      });

      vi.mocked(repository.listContextEvents).mockResolvedValue([
        { id: "evt_1", contextId: "ctx_audit_001", eventType: "a2a.context.created", payloadHash: "hash1", prevHash: null, eventHash: "hash1", createdAt: new Date() },
        { id: "evt_2", contextId: "ctx_audit_001", eventType: "a2a.task.created", payloadHash: "hash2", prevHash: "hash1", eventHash: "hash2", createdAt: new Date() },
        { id: "evt_3", contextId: "ctx_audit_001", eventType: "a2a.context.accepted", payloadHash: "hash3", prevHash: "hash2", eventHash: "hash3", createdAt: new Date() }
      ]);

      vi.mocked(repository.listTasksByContextId).mockResolvedValue([
        { id: "tsk_audit_001", contextId: "ctx_audit_001", executorAgentId: "mind_risk_agent", status: "completed", version: 1, idempotencyKey: null, payload: {}, createdAt: new Date() }
      ]);

      vi.mocked(repository.listBillingEventsByContextId).mockResolvedValue([]);

      const timelineRes = await server.inject({
        method: "GET",
        url: "/v1/a2a/contexts/ctx_audit_001/timeline"
      });

      expect(timelineRes.statusCode).toBe(200);
      const json = timelineRes.json();
      expect(json.contextId).toBe("ctx_audit_001");
      expect(json.status).toBe("accepted");
      expect(json.events).toHaveLength(3);
      expect(json.tasks).toHaveLength(1);
      
      // Asserts that the chain is linked
      expect(json.events[1].prevHash).toBe(json.events[0].eventHash);
      expect(json.events[2].prevHash).toBe(json.events[1].eventHash);
    });
  });
});
