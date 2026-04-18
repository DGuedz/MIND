# MIND Protocol - Technical Documentation (Only Agents Vision)

## Overview
MIND is the **Settlement Layer** for the Agentic Economy on Solana. It enables autonomous agents to discover, negotiate, and pay for services (Agent Cards) with zero human intervention. The protocol operates under the **"Only Agents"** vision, where humans act as architects (defining policies and issuing credentials) while machines execute with sovereign authority.

## Core Architecture: The Neural Rails
The protocol functions as a distributed network of **Neural Rails** coordinated via an API Gateway and secured by KMS:

### 1. Services
- **API Gateway**: Entry point for all external requests. Centralizes status for `sourceOfTruth` and `x402` payments.
- **A2A Service**: The heart of Neural Rails. Manages agent sessions, intent propagation, and **Intent Firewall** (Credential Gating).
- **Execution Service**: Interfaces with Solana protocols (Jupiter, Meteora, Kamino). Implements the **Atomic Split (92/8)** for every transaction.
- **Signer Service (KMS)**: Institutional-grade key management using **Turnkey**. Validates Metaplex Credentials before signing any payload.
- **Market Context Service**: Aggregates real-time intelligence from **Colosseum Copilot**, **Covalent GoldRush**, and DEXs.
- **Proof Service**: Generates **Mindprint cNFTs** (Metaplex Core) as immutable cryptographic evidence of execution.

## The A2A Settlement Flow (x402)
1. **Discovery**: Agent A broadcasts a **Neural Message** (JSON Intent + Signature) to find a service.
2. **Payment (x402)**: Agent A attaches a payment instruction. The MIND Kernel detects the `Payment Required (402)` status and triggers the rails.
3. **Validation**: The **Intent Firewall** verifies:
   - **Metaplex Credential**: Does the agent possess the required NFT Tier (Micro, Pro, Institutional)?
   - **Policy Compliance**: Does the intent respect slippage and amount limits?
4. **Execution**: The **Execution Service** builds the transaction with an **Atomic Split**:
   - **92%** to the Service Provider.
   - **8%** to the MIND Protocol Treasury.
5. **Signing**: **Turnkey KMS** signs the transaction after a final policy check.
6. **Settlement**: Transaction is broadcasted to Solana.
7. **Proof**: **MindprintMinter** generates a cNFT receipt on-chain.

## Credential Tiers (Metaplex-Gated)
- **MICRO**: Up to 1 SOL per operation.
- **PRO**: Up to 50 SOL per operation.
- **INSTITUTIONAL**: Unlimited. Requires multi-sig policy.

## Security & Guardrails
- **Zero-Trust KMS**: Private keys never touch application memory.
- **Credential Gating**: Possession of a Metaplex NFT is the only "key" for autonomous execution.
- **Proof-as-a-Service**: Every machine decision is backed by an immutable on-chain record.

## Technical Stack
- **Languages**: TypeScript (Node.js/Fastify), Python.
- **Blockchain**: Solana (Web3.js, Metaplex Core, Anchor).
- **KMS**: Turnkey (Institutional-grade).
- **Oracles**: Covalent (Portfolio/Balances), Jupiter (Liquidity), Colosseum (Market Intel).

## Deployment Flow
1. **Pre-flight**: Linting, type checking, and unit tests.
2. **Staging**: Deploy to Vercel preview/Staging environment.
3. **Production**: Promote to production via GitHub Actions.

## Monitoring
- **Quality Dashboard**: Real-time health checks of all microservices.
- **Event Router**: Centralized logging and incident reporting.
- **Sentry/LogRocket**: Error tracking and user session monitoring.

---
© 2026 MIND Protocol. All rights reserved.
