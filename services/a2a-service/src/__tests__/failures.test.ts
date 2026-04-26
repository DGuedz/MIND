import { describe, it, expect, vi, beforeEach } from "vitest";
import { server } from "../index.js";
import * as repository from "../db/repository.js";
import * as dbClient from "../db/client.js";

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

vi.mock("../db/client.js", () => ({
  checkDb: vi.fn(),
  db: {}
}));

describe("Operational Failures & AuthZ Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("AuthZ Tests", () => {
    it("should return 401 Unauthorized if missing Bearer token on /contexts", async () => {
      const res = await server.inject({
        method: "POST",
        url: "/v1/a2a/contexts",
        payload: {
          intentId: "intent_happy",
          initiatorAgentId: "client_agent",
          expiresAt: new Date(Date.now() + 86400000).toISOString()
        }
      });
      expect(res.statusCode).toBe(401);
      expect(res.json().error).toBe("unauthorized");
    });

    it("should return 401 Unauthorized if invalid Bearer token on /accept", async () => {
      const res = await server.inject({
        method: "POST",
        url: "/v1/a2a/contexts/ctx_authz_001/accept",
        headers: { authorization: "Bearer WRONG_TOKEN" },
        payload: {
          taskId: "tsk_authz_001",
          acceptedByAgentId: "human_operator"
        }
      });
      expect(res.statusCode).toBe(401);
      expect(res.json().error).toBe("unauthorized");
    });
  });

  describe("Operational Failures", () => {
    it("should handle Database connection failure on /health/db", async () => {
      vi.mocked(dbClient.checkDb).mockRejectedValue(new Error("Connection timeout"));

      const res = await server.inject({
        method: "GET",
        url: "/health/db"
      });

      expect(res.statusCode).toBe(500);
      expect(res.json().db).toBe("error");
    });

    it("should return 500 if database fails during createContext", async () => {
      vi.mocked(repository.createContext).mockRejectedValue(new Error("Postgres offline"));

      const res = await server.inject({
        method: "POST",
        url: "/v1/a2a/contexts",
        headers: { authorization: "Bearer MIND_INSTITUTIONAL_TEST" },
        payload: {
          intentId: "intent_db_fail",
          initiatorAgentId: "client_agent",
          expiresAt: new Date(Date.now() + 86400000).toISOString()
        }
      });

      expect(res.statusCode).toBe(500);
    });

    it("should handle missing context gracefully on /tasks", async () => {
      vi.mocked(repository.getContextById).mockResolvedValue(undefined);

      const res = await server.inject({
        method: "POST",
        url: "/v1/a2a/contexts/ctx_missing/tasks",
        headers: { authorization: "Bearer MIND_INSTITUTIONAL_TEST" },
        payload: {
          executorAgentId: "mind_risk_agent",
          payload: {}
        }
      });

      expect(res.statusCode).toBe(404);
      expect(res.json().error).toBe("a2a_context_not_found");
    });
  });
});
