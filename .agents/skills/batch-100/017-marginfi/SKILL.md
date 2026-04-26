# Operação de Flash Loans

## Diagnóstico
**Contexto Operacional:** Operação de Flash Loans (Marginfi).
Esta skill foi projetada para atuar na economia máquina-a-máquina (A2A), encapsulando lógica de DeFi complexa através de um firewall Zero-Trust.

## Intent Workflow
1. **Intent:** Agente despacha a intenção de uso para `mind-skill-marginfi`.
2. **Credential Gate:** O MIND Gateway valida a credencial (Solana Attestation Service / Tier 1 Micro).
3. **Policy Check:** Verificação de permissões e limite de gastos (max 100.00 USDC).
4. **Atomic Payment & Split:** Liquidação nativa CPI. (92% para Provedor, 8% para MIND Treasury).
5. **Execution:** Invocação segura do ambiente off-chain ou contrato parceiro.
6. **Proof:** Emissão do `Mindprint` (Recibo criptográfico nativo na Solana).

## Code Snippet (Zero-Trust CPI Template)
```typescript
import { Connection, PublicKey } from "@solana/web3.js";
import { Mindprint, AtomicSettlement, PolicyFirewall } from "@mindprotocol/sdk";

/**
 * Ponto de entrada canônico do Agent Card
 */
export async function executeSkill(intentPayload: any, agentPubkey: PublicKey) {
    // 1. Policy & Credential Gate (Zero-Trust)
    await PolicyFirewall.verifyCredential(agentPubkey, "Tier 1 Micro");

    // 2. Atomic Split (92/8 Settlement)
    const settlementTx = await AtomicSettlement.buildSplitTx({
        payer: agentPubkey,
        amount: 0.05,
        token: "USDC",
        splits: [
            { percent: 92, to: "PROVIDER_WALLET" },
            { percent: 8, to: "MIND_TREASURY" }
        ]
    });

    // 3. Core Execution (Isolada pós-liquidação)
    console.log("Executando: Operação de Flash Loans...");
    const executionResult = await performmarginfiLogic(intentPayload);

    // 4. Emissão do Mindprint (Proof-Native Delivery)
    const receipt = await Mindprint.issue({
        agent: agentPubkey,
        skillId: "mind-skill-marginfi",
        status: "SUCCESS",
        dataHash: executionResult.hash
    });

    return receipt;
}

async function performmarginfiLogic(payload: any) {
    // Implementação via Anchor ou integrações parceiras (SendAI, Solana.new)
    return { hash: "0xVERIFIED_EXECUTION" };
}
```
