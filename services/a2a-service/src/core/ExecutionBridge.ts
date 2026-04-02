import { FastifyBaseLogger } from "fastify";
import { db } from "../db/client.js";
import { a2aTasks } from "../db/schema.js";
import { eq } from "drizzle-orm";
import crypto from "crypto";
import { appendContextEvent } from "../db/repository.js";

export class ExecutionBridge {
  constructor(private logger: FastifyBaseLogger) {}

  async executeAcceptedTask(contextId: string, task: any) {
    this.logger.info({ contextId, taskId: task.id }, "ExecutionBridge: Initiating execution of accepted task");
    
    // Update task status to 'executing'
    await db.update(a2aTasks).set({ status: "executing" }).where(eq(a2aTasks.id, task.id));

    try {
      const payload = task.payload || {};
      
      let actionStr = payload.action || "SWAP";
      if (typeof actionStr === "string") actionStr = actionStr.toUpperCase();

      const executionPayload = {
        taskId: task.id,
        action: actionStr === "TRANSFER" ? "TRANSFER" : "SWAP",
        amount: payload.amount || 1,
        asset: payload.assetIn || payload.asset || "SOL",
        destination: payload.destination || undefined,
        walletId:
          process.env.TURNKEY_SIGN_WITH ||
          process.env.X402_AGENT_PUBLIC_KEY ||
          process.env.VITE_AGENT_PUBLIC_KEY ||
          "EyMoTToyaKWw3dvCYYsGAg6PfE6g5f6df8p5c4ropnan"
      };

      const executionServiceUrl = `http://localhost:${process.env.EXECUTION_SERVICE_PORT || 3006}/v1/execution/execute`;
      
      const response = await fetch(executionServiceUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(executionPayload)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Execution Service failed: ${errorText}`);
      }

      const result = await response.json();
      
      this.logger.info({ contextId, taskId: task.id, result }, "ExecutionBridge: Execution successful");

      // Update task status to 'completed'
      await db.update(a2aTasks).set({ status: "completed" }).where(eq(a2aTasks.id, task.id));

      // Append proof of intent to the context timeline
      const eventPayload = {
        taskId: task.id,
        proofOfIntent: result.proofOfIntent,
        network: result.network,
        timestamp: result.timestamp
      };

      const payloadHash = crypto.createHash("sha256").update(JSON.stringify(eventPayload)).digest("hex");
      await appendContextEvent(contextId, "a2a.execution.completed", payloadHash);

    } catch (error: any) {
      this.logger.error({ contextId, taskId: task.id, err: error.message }, "ExecutionBridge: Execution failed");
      
      // Update task status to 'failed'
      await db.update(a2aTasks).set({ status: "failed" }).where(eq(a2aTasks.id, task.id));

      const eventPayload = {
        taskId: task.id,
        error: error.message
      };

      const payloadHash = crypto.createHash("sha256").update(JSON.stringify(eventPayload)).digest("hex");
      await appendContextEvent(contextId, "a2a.execution.failed", payloadHash);
    }
  }
}
