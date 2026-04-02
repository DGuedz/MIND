import { describe, it, expect, vi, beforeEach } from "vitest";
import { server } from "../index.js";
import * as repository from "../db/repository.js";

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

describe("Idempotency & Concurrency Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Idempotency: Repeating Accept", () => {
    it("should return 200 OK (idempotent) if accepting an already accepted context", async () => {
      // The handler will check getContextById first. It will see "accepted" and return 200 early.
      vi.mocked(repository.getContextById).mockResolvedValue({
        id: "ctx_idem_001" as any,
        intentId: "intent_1",
        initiatorAgentId: "client_agent",
        counterpartyAgentId: null,
        status: "accepted", // Already accepted!
        acceptedTaskId: "tsk_idem_001",
        expiresAt: new Date(Date.now() + 86400000),
        createdAt: new Date(),
        updatedAt: new Date()
      });

      const acceptRes = await server.inject({
        method: "POST",
        url: "/v1/a2a/contexts/ctx_idem_001/accept",
        headers: { authorization: "Bearer MIND_INSTITUTIONAL_TEST" },
        payload: {
          taskId: "tsk_idem_001",
          acceptedByAgentId: "human_operator"
        }
      });

      expect(acceptRes.statusCode).toBe(200);
      expect(acceptRes.json().idempotent).toBe(true);
      expect(repository.updateContextStatus).not.toHaveBeenCalled();
    });
  });

  describe("Concurrency: Racing Accept and Cancel", () => {
    it("should fail to accept if context was just cancelled by another process", async () => {
      // Simulate that updateContextStatus throws stale_context_state
      vi.mocked(repository.updateContextStatus).mockRejectedValue(new Error("stale_context_state"));

      // First call returns "open", second call (in the catch block) returns "cancelled"
      vi.mocked(repository.getContextById)
        .mockResolvedValueOnce({
          id: "ctx_race_001" as any,
          intentId: "intent_3",
          initiatorAgentId: "client_agent",
          counterpartyAgentId: null,
          status: "open", // Initial read sees it as open
          acceptedTaskId: null,
          expiresAt: new Date(Date.now() + 86400000),
          createdAt: new Date(),
          updatedAt: new Date()
        })
        .mockResolvedValueOnce({
          id: "ctx_race_001" as any,
          intentId: "intent_3",
          initiatorAgentId: "client_agent",
          counterpartyAgentId: null,
          status: "cancelled", // Lost the race, someone else cancelled it
          acceptedTaskId: null,
          expiresAt: new Date(Date.now() + 86400000),
          createdAt: new Date(),
          updatedAt: new Date()
        });

      vi.mocked(repository.getTaskById).mockResolvedValue({
        id: "tsk_race_001",
        contextId: "ctx_race_001",
        executorAgentId: "mind_risk_agent",
        status: "approval_required",
        version: 1,
        idempotencyKey: null,
        payload: {},
        createdAt: new Date()
      });

      const acceptRes = await server.inject({
        method: "POST",
        url: "/v1/a2a/contexts/ctx_race_001/accept",
        headers: { authorization: "Bearer MIND_INSTITUTIONAL_TEST" },
        payload: {
          taskId: "tsk_race_001",
          acceptedByAgentId: "human_operator"
        }
      });

      // 409 Conflict because the state we refreshed is NOT 'accepted'
      expect(acceptRes.statusCode).toBe(409);
      expect(acceptRes.json().error).toBe("a2a_context_not_open");
      expect(acceptRes.json().status).toBe("cancelled");
    });
  });
});
