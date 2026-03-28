import { Agent, ZeeWorkflow } from "@covalenthq/ai-agent-sdk";
import * as dotenv from "dotenv";

dotenv.config();

/**
 * Cria o Agente Analista de Risco (NoahAI) usando o Covalent ZEE SDK
 */
const noahRiskAgent = new Agent({
    name: "NoahRiskAnalyst",
    model: {
        provider: "openai",
        id: "gpt-4o-mini", // Pode ser ajustado para modelos suportados pelo SDK
    },
    description: "Analista de risco on-chain especializado em dados Covalent.",
    instructions: [
        "Analise o histórico de transações e saldos on-chain.",
        "Se o usuário tiver um histórico limpo e saldo suficiente, aprove a transação.",
        "Sempre retorne uma decisão clara: ALLOW ou BLOCK, junto com um risk_score (LOW, MEDIUM, HIGH)."
    ],
});

/**
 * Cria o Agente Executor (MIND Protocol) usando o Covalent ZEE SDK
 */
const mindExecutorAgent = new Agent({
    name: "MindProtocolExecutor",
    model: {
        provider: "openai",
        id: "gpt-4o-mini",
    },
    description: "Agente executor de transações on-chain focado em arbitragem.",
    instructions: [
        "Execute a transação se o Agente de Risco (NoahAI) retornar ALLOW e LOW risk_score.",
        "Comunique o sucesso da operação de forma concisa."
    ],
});

/**
 * ZEE Workflow: Orquestra a colaboração entre os agentes (Agent-to-Agent)
 */
export const mindZeeWorkflow = new ZeeWorkflow({
    goal: "Analisar o risco de uma carteira usando dados on-chain e decidir sobre a execução de uma transação de arbitragem (A2A).",
    agents: [noahRiskAgent, mindExecutorAgent],
    model: {
        provider: "openai",
        id: "gpt-4o-mini",
    },
});

async function runWorkflow() {
    console.log("🤖 Iniciando ZEE Workflow (Covalent AI Agent SDK)...");
    try {
        const result = await mindZeeWorkflow.run();
        console.log("\n✅ Resultado do ZEE Workflow:");
        console.log(result);
    } catch (error) {
        console.error("\n❌ Erro na execução do ZEE Workflow:", error);
    }
}

// Se executado diretamente via CLI
if (typeof process !== "undefined" && process.argv[1] && process.argv[1].endsWith("covalent_zee_workflow.ts")) {
    runWorkflow();
}
