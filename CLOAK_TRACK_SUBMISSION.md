# MIND Protocol: Cloak Track Submission (Colosseum Frontier)

## The Problem
Public blockchains force a fatal trade-off on institutional capital: **to automate operations, you must broadcast your strategy.** Every payload, payroll, and treasury rebalance becomes a live intelligence feed for competitors. 

Transparency isn't just bad UX; it's a structural barrier to institutional A2A (Agent-to-Agent) coordination.

## The Solution: MIND Treasury Console + Cloak
MIND Protocol combines deterministic A2A coordination with **Cloak's shielded execution layer**. 

We have built the **MIND Treasury Console**: an autonomous execution environment where institutional agents can negotiate off-chain, enforce policies via Zero-Trust KMS, and settle atomically on Solana **without leaking amounts or recipients to public explorers**.

> "MIND turns public blockchains into private execution environments for institutional capital."

---

## 🔒 Integration Depth (Why this wins the Cloak Track)
Cloak isn't an accessory in our architecture; it is the **load-bearing execution rail**. 

MIND uses the `@cloak.dev/sdk` to execute the following shielded flows autonomously:
1. **Private Batch Disbursement (`/cloak-pay`)**: An agent evaluates a DAO's monthly obligations and executes payroll to multiple contributors in a single shielded transaction.
2. **Shielded Treasury Rebalance (`/cloak-shield`)**: The agent moves stablecoins (USDC/USDT) between operational accounts to capture yield, hiding the exact liquidity depth from market observers.
3. **Selective Auditability (Viewing Keys)**: Every shielded execution emits a cryptographic proof hash to the MIND Protocol registry, alongside a scoped viewing key. This allows the treasury admin to prove compliance to auditors without exposing the flow to the public.

## ⚙️ Architecture & Flow
1. **Intent (Input):** The Admin sets the parameters (e.g., "Pay these 5 developers $3,200 USDC each if milestones are met").
2. **Policy Enforcement (A2A):** The MIND Agent evaluates the conditions off-chain and requests permission via a Session Key (PDA delegated by Solflare).
3. **Shielded Execution:** The MIND Engine invokes the Cloak SDK (`transact` and `fullWithdraw`) to process the batch payment.
4. **Settlement & Proof:** The recipients get paid privately. A Mindprint cNFT is minted as an immutable proof of execution, containing the Cloak Root Hash.

## 🚀 Setup & Run Instructions
```bash
# 1. Clone the repository
git clone https://github.com/DGuedz/MIND.git
cd MIND

# 2. Install dependencies (PNPM required)
pnpm install

# 3. Add Cloak Claude Skills for local development
npx @cloak.dev/claude-skills

# 4. Run the Treasury Console locally
pnpm --filter landingpage dev
```
*Note: Ensure you have `KEYPAIR_PATH` and `SOLANA_RPC_URL` configured in your `.env` to test live shielded transactions.*

## 🏆 Differentiation
Other submissions will build simple private wallets. MIND delivers **Autonomous Private Treasury Execution**. We bridge the gap between agentic decision-making and privacy-preserving settlement.