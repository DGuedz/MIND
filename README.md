# MIND — Bloomberg of Agents on Solana 

**Autonomous Intent Infrastructure • Real-time Liquidity Rail • Intent Defense** 

[![Built for Solana Agent Economy Hackathon](https://img.shields.io/badge/Built_for-Solana_Agent_Economy_Hackathon-9945FF?style=for-the-badge&logo=solana&logoColor=white)](https://solana.com/hackathon) 
[![Telegram Onboard 45s](https://img.shields.io/badge/Telegram_Onboard-45s-1DA1F2?style=for-the-badge&logo=telegram)](https://t.me/) 
[![A2A x402](https://img.shields.io/badge/A2A-x402-00FF9D?style=for-the-badge)](https://x402.org) 

**MIND** is the infrastructure that transforms autonomous agents into **real economic participants** on Solana.  
It captures intents -> validates policies -> executes atomically via x402 and delivers total visibility of the "liquidity rail" in real-time. 

> "Where the Money Flows" — the dashboard that shows exactly where agents are arbitraging, paying, and generating revenue. 

--- 

### Live Demo 
- **Landing + Dashboard**: [https://landingpage-dgs-projects-ac3c4a7c.vercel.app](https://landingpage-dgs-projects-ac3c4a7c.vercel.app)
- **Telegram Onboard**: [MIND Protocol Bot](https://t.me/Mind_Agent_Protocol_bot)
- **App Control Center**: `/app` (live agent dashboard) 

--- 

### Built for Solana Agent Economy Hackathon: Agent Talent Show 
- **Track Metaplex** -> Agents with on-chain identity + A2A payments via Metaplex Core 
- **Track Covalent** -> Data-driven agents consuming GoldRush API in real-time 
- **Track NoahAI / OpenClaw** -> Onboard in <45 seconds via Telegram Bot 

**Prize Pool**: $45,500 USDC 

--- 

### Key Features 

| Feature | Description | Hackathon Track | 
|---------|-------------|-----------------| 
| **Agentic Settlement Log** | Live dashboard tracking KMS TVL, x402 revenue, and execution fees. | All Tracks | 
| **A2A Micropayments (x402)** | Native programmatic Solana Pay checkout with on-chain reference validation. | Metaplex / Infra | 
| **Telegram Onboard 45s** | Connect, approve strategy, and monitor agents directly from chat. | NoahAI | 
| **Institutional Policy Gates** | Mathematical validation via Turnkey KMS. Block trades exceeding max slippage. | Protection / Infra | 
| **Atomic Execution** | Zero private key exposure on server. Signatures delegated to KMS. | Infrastructure | 
| **ASCII Proof of Intent** | Telegram generates NFC-e style verifiable cryptographic receipts for every action. | Protection | 
| **JIT Liquidity (Treasury)** | Idle capital routed to Meteora for baseline yield while waiting for arb. | Infrastructure |

--- 

### TRL 7 (Technology Readiness Level) - Mainnet Proven
MIND is not a lab concept. We have executed **real A2A micropayments** on the Solana Mainnet using the following stack:
1. **Solana x402:** Atomic `0.001 SOL` transfers for API data inference.
2. **Covalent ZEE SDK:** Multi-agent orchestration (Risk Agent + Execution Agent).
3. **Metaplex Core:** Verifiable `receiptHash` generation for executed intents.
4. **Human-in-the-Loop:** Intent approval strictly gated via Telegram UX.

MIND doesn't promise "magical profits", but it **maximizes capital efficiency** by shielding intents from network surveillance (MEV bots):

1. **On-Chain Private Computer:** Instead of exposing state, we use ZK-compressed notes (commitments/nullifiers). The network only sees hashes, hiding your exact positions.
2. **Treasury Agent:** Your capital remains in a cryptographic vault, only released Just-In-Time (JIT) when execution is atomic and verified.
3. **A2A Dark Pools:** Agents negotiate P2P without public orderbooks. This reduces information leakage and MEV exposure, with risk controls designed to minimize slippage.

*MIND retains your maximum margin by eliminating predators.*

### Institutional Thesis: The A2A Server

For the source-backed thesis and pitch narrative (line-by-line with references), see:

- `governance/A2A_SERVER_THESIS.md`
- `governance/REVENUE_MODEL.md`
- `governance/PROFIT_MACHINE.md`
- `governance/KMS_TURNKEY_SETUP.md`

---

### How MIND Makes Money (The Unfair Advantage)

MIND is not a retail trading bot. We are the **institutional toll road** orchestrating the Agent Economy. Our revenue scales directly with the volume of autonomous transactions we secure:

| Revenue Stream | Description | Monetization Mechanics |
|------|-------|--------------|
| **Market Intelligence (x402)** | Oracle data sales for agents | Pay-per-query micropayments (SOL) |
| **A2A Routing & Atomic Settlement** | Dark pool execution protecting agents from MEV | 0.1% to 1% Execution Fee per match |
| **Capital Optimization (JIT Yield)** | Activating idle treasury capital in Meteora/Kamino | 10-20% Performance Fee on generated APY |
| **Governance & Audit (SaaS)** | Strict Policy Gates (Turnkey KMS) & Cryptographic Proofs | Recurring B2B SaaS for institutional treasuries |

**The Proof of Intent (ASCII Receipts):**
Every approved execution generates an immutable, on-chain verifiable ASCII receipt directly in Telegram, proving institutional-grade compliance with zero extra cost.

---

### Future Work / Scalability: Phase 3 (The Cross-Chain A2A Vision)

Hoje, a MIND utiliza a Solana como sua camada de liquidação (Settlement Layer) devido à sua extrema baixa latência e profunda integração com as infraestruturas da Metaplex e Covalent. No entanto, a nossa arquitetura A2A (Agent-to-Agent) foi desenhada para ser inerentemente agnóstica de rede.

No futuro, integraremos a TON como a nossa camada primária de distribuição B2C (Distribution Layer). 
- O **Agente** continuará operando o capital institucional pesado na Solana via ZK Dark Pools.
- O **Usuário Final** (O Humano Guardião) interagirá, governará o agente e receberá *airdrops* via TonConnect nativo diretamente no Telegram.

Isso criará a primeira ponte de coordenação de agentes *cross-chain* do mercado, unindo a rede mais rápida do mundo (Solana) com a rede de maior adoção social (TON).

---

### Screenshots 

- **Home – Where the Money Flows** (toggle Agent Economy) 
- **App Dashboard** – Recent Intents + Agent Status + Manual Override 
- **Features** – Grid with A2A, Intent Validation, On-chain Proofs 
- **Infrastructure** – Complete diagram (Intent Capture -> MIND Engine -> Settlement) 

*(Images available in the `/public/screenshots` folder)* 

--- 

### Architecture & Tech Stack 

- **Frontend**: React + Vite + Tailwind (Glassmorphism Dashboard)
- **Backend Services** (monorepo pnpm): 
  - `a2a-service` -> The core engine. Generates Solana Pay requests, validates references, and monitors on-chain settlement.
  - `TurnkeyKmsProvider` -> Cloud-based KMS. Never exposes private keys to the server memory, signing transactions securely via API.
  - `audit_logger` -> Persistent append-only logging of all A2A financial decisions.
- **Infra**: Vercel (Frontend) + Helius RPC (Solana Mainnet) + Turnkey (Key Management)
- **Integrations**: OpenClaw Telegram Bot, Jupiter (Dark Pool Sim), Meteora DLMM, Solana Pay.

**Security Policy**: All keys are handled off-server by Turnkey KMS. Policy Gates (e.g., max slippage, daily limits) can be mathematically enforced at the cloud signing level, ensuring the *Circuit Breaker* never fails. 

--- 

### Developer Experience (Master Skill)

MIND includes a robust CLI and natural language parser to instantly onboard new AI capabilities.
Read the full operational guide here: **[`docs/MASTER_SKILL.md`](docs/MASTER_SKILL.md)**

```bash
# Example: Natural Language Skill Installation
pnpm master-skill buscar repositório SpecKit
pnpm master-skill instalar playwright --project ./
```

---

### How to Run (Local) 

```bash 
git clone https://github.com/DGuedz/MIND.git 
cd MIND 
pnpm install 
pnpm dev                  # Frontend (port 5174) 
pnpm dev:services         # Backend services 
docker compose up -d      # Database + dependencies 
```

#### Smoke Tests
```bash 
bash scripts/smoke_all.sh 
bash scripts/smoke_hero_flow.sh   # Tests complete onboard 
```

#### Colab in VS Code/Trae (Local IDE + Google Runtime)
```bash
pnpm setup:colab
pnpm verify:colab-runtime
pnpm check:tailwind
```

- Open any `.ipynb` and select kernel `Colab`.
- For integrated local/remote workflow, use `Colab: Mount Server to Workspace...` (enabled in `.vscode/settings.json`).
- Full operational guide: `COLAB_VSCODE_WORKFLOW.md`.
- Important: free Colab GPU type is dynamic; T4 is preferred when available, not guaranteed.
- Troubleshooting Tailwind false positive:
  - Run `pnpm check:tailwind`
  - If warning persists in IDE, run `Tailwind CSS: Restart Language Server` then `Developer: Reload Window`
  - For cleanup: `pnpm clean:heavy` (or `pnpm clean:heavy -- --with-editor-cache`)

#### Telegram Onboard (45 seconds)
1. In your OpenClaw / SolClaw agent chat, type `/mind` 
2. Confirm Solana wallet 
3. Approve A2A permissions 
4. Done. Your agent now appears in the MIND Dashboard with live metrics. 

---

### Hackathon Submission
- **X Article**: [Thread Link]
- **Demo Video**: 45s (screen recording of the complete flow) 
- **Repo**: [https://github.com/DGuedz/MIND](https://github.com/DGuedz/MIND) 
- **Live**: [https://landingpage-dgs-projects-ac3c4a7c.vercel.app](https://landingpage-dgs-projects-ac3c4a7c.vercel.app)

MIND is not just a dashboard. 
It is the infrastructure that proves agents can act economically in a safe, transparent, and profitable way on Solana.

---
© 2026 MIND • Built for the Agent Economy 
SOLANA • METAPLEX • COVALENT • OPENCLAW

create table if not exists approvals (
  id text primary key,
  intent_id text not null,
  channel text not null,
  requester_id text not null,
  decision text,
  decided_at timestamptz,
  created_at timestamptz not null
);

create table if not exists approval_events (
  id text primary key,
  approval_id text not null,
  event_type text not null,
  payload_hash text not null,
  prev_hash text,
  event_hash text not null,
  created_at timestamptz not null
);

create table if not exists executions (
  id text primary key,
  intent_id text not null,
  mode text not null,
  status text not null,
  tx_hash text,
  receipt_hash text,
  created_at timestamptz not null,
  executed_at timestamptz
);

create table if not exists execution_events (
  id text primary key,
  execution_id text not null,
  event_type text not null,
  payload_hash text not null,
  prev_hash text,
  event_hash text not null,
  created_at timestamptz not null
);

create table if not exists proofs (
  id text primary key,
  intent_id text not null,
  approval_id text,
  execution_id text,
  proof_hash text not null,
  created_at timestamptz not null
);

create table if not exists proof_anchors (
  proof_id text not null,
  type text not null,
  hash text not null
);

create table if not exists proof_events (
  id text primary key,
  proof_id text not null,
  event_type text not null,
  payload_hash text not null,
  prev_hash text,
  event_hash text not null,
  created_at timestamptz not null
);
SQL
```

Aplicar migração consolidada

```bash
psql "$DATABASE_URL" -f scripts/migrations/001_init.sql
psql "$DATABASE_URL" -f scripts/migrations/002_a2a.sql
psql "$DATABASE_URL" -f scripts/migrations/003_a2a_billing.sql
```

Smoke test do HERO FLOW

```bash
API_GATEWAY_URL=http://localhost:3000 ./scripts/smoke_hero_flow.sh
```

Smoke test de DB health

```bash
API_GATEWAY_URL=http://localhost:3000 ./scripts/smoke_health_db.sh
```

Smoke test de proof bundle

```bash
API_GATEWAY_URL=http://localhost:3000 ./scripts/smoke_proof_bundle.sh
```

Smoke test de A2A

```bash
API_GATEWAY_URL=http://localhost:3000 ./scripts/smoke_a2a.sh
```

Smoke test do signer

```bash
SIGNER_SERVICE_URL=http://localhost:3007 ./scripts/smoke_signer.sh
```

Smoke test completo

```bash
API_GATEWAY_URL=http://localhost:3000 SIGNER_SERVICE_URL=http://localhost:3007 ./scripts/smoke_all.sh
```

Release bundle

```bash
API_GATEWAY_URL=http://localhost:3000 SIGNER_SERVICE_URL=http://localhost:3007 ./scripts/release_bundle.sh
```

Verify proof manual

```bash
curl -X POST http://localhost:3000/v1/proofs/{proofId}/verify \
  -H "content-type: application/json" \
  -d '{
    "anchors": [
      { "type": "market_context", "hash": "..." },
      { "type": "approval_event", "hash": "..." },
      { "type": "execution_event", "hash": "..." },
      { "type": "execution_receipt", "hash": "..." }
    ]
  }'
```

2) Rodar o fluxo

```bash
curl -X POST http://localhost:3000/v1/hero-flow/run \
  -H "content-type: application/json" \
  -d '{
    "agent": {
      "name": "Scan Agent",
      "role": "scan",
      "wallet": "So1anaWallet111111111111111111111111111111111",
      "capabilities": ["scan", "signal"],
      "status": "active"
    },
    "intent": {
      "creatorAgentId": "agent_scan_001",
      "asset": "SOL",
      "action": "buy",
      "amount": "0.5",
      "confidence": 0.82,
      "riskScore": 0.35,
      "expiryTs": "<ISO-8601-futuro>",
      "policyId": "policy_v1"
    },
    "marketContext": {
      "source": "covalent",
      "payload": {
        "asset": "SOL",
        "timeframe": "1h"
      }
    },
    "approval": {
      "channel": "telegram",
      "requesterId": "123456789"
    },
    "execution": {
      "mode": "simulated",
      "amount": "0.5",
      "maxSlippageBps": 50,
      "expiresAt": "<ISO-8601-futuro>"
    }
  }'
```
