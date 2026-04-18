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

      const executionServiceBase = `http://localhost:${process.env.EXECUTION_SERVICE_PORT || 3006}`;
      const executionMode =
        (payload.mode as "simulated" | "real" | undefined) ??
        ((process.env.EXECUTION_DEFAULT_MODE as "simulated" | "real" | undefined) ?? "simulated");

      const planResponse = await fetch(`${executionServiceBase}/v1/executions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          intentId: payload.intentId || contextId,
          mode: executionMode,
          protocol: payload.protocol || "JUPITER",
          policyHash: payload.policyHash
        })
      });

      if (!planResponse.ok) {
        const errorText = await planResponse.text();
        throw new Error(`Execution Service plan failed: ${errorText}`);
      }

      const planResult = await planResponse.json() as { executionId?: string };
      if (!planResult.executionId) {
        throw new Error("Execution Service plan missing executionId");
      }

      const runPayload = {
        executionId: planResult.executionId,
        intentId: payload.intentId || contextId,
        taskId: task.id,
        mode: executionMode,
        protocol: payload.protocol || "JUPITER",
        action: actionStr === "TRANSFER" ? "TRANSFER" : "SWAP",
        amount: payload.amount || 1,
        amountAtomic: payload.amountAtomic,
        asset: payload.assetIn || payload.asset || "SOL",
        assetIn: payload.assetIn || payload.asset || "SOL",
        assetOut: payload.assetOut || undefined,
        destination: payload.destination || undefined,
        walletId:
          process.env.TURNKEY_SIGN_WITH ||
          process.env.X402_AGENT_PUBLIC_KEY ||
          process.env.VITE_AGENT_PUBLIC_KEY ||
          "EyMoTToyaKWw3dvCYYsGAg6PfE6g5f6df8p5c4ropnan",
        maxSlippageBps: payload.maxSlippageBps ?? 50,
        expiresAt: payload.expiresAt || new Date(Date.now() + 5 * 60_000).toISOString(),
        policyHash: payload.policyHash
      };

      const runResponse = await fetch(`${executionServiceBase}/v1/executions/run`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(runPayload)
      });

      if (!runResponse.ok) {
        const errorText = await runResponse.text();
        throw new Error(`Execution Service run failed: ${errorText}`);
      }

      const result = await runResponse.json() as {
        txHash?: string | null;
        receiptHash?: string | null;
        routeHash?: string | null;
        executionHash?: string | null;
        policyHash?: string | null;
        status?: string;
      };
      
      this.logger.info({ contextId, taskId: task.id, result }, "ExecutionBridge: Execution successful");

      // Update task status to 'completed'
      await db.update(a2aTasks).set({ status: "completed" }).where(eq(a2aTasks.id, task.id));

      // Append proof of intent to the context timeline
      const eventPayload = {
        taskId: task.id,
        executionStatus: result.status ?? "unknown",
        txHash: result.txHash ?? null,
        receiptHash: result.receiptHash ?? null,
        routeHash: result.routeHash ?? null,
        executionHash: result.executionHash ?? null,
        policyHash: result.policyHash ?? null,
        timestamp: new Date().toISOString()
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
