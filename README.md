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
- **Landing + Dashboard**: `https://mind.app`  (local preview: `pnpm dev` -> port 5174) 
- **Telegram Onboard**: `/mind` inside your OpenClaw / SolClaw agent 
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
| **Where the Money Flows** | Live liquidity dashboard (DeFi TVL $7.06B + A2A 45.3M txns) | All Tracks | 
| **Agent Economy Toggle** | General (Solana) <-> A2A (Dexter 69% \| PayAI 30%) | Metaplex + Covalent | 
| **Telegram Onboard 45s** | `/mind` -> confirms wallet -> approves x402 -> skills ready | NoahAI | 
| **Intent Defense** | Validation + Human-in-the-Loop (Kill Switch + Manual Override) | Protection | 
| **Atomic Execution** | KMS ephemeral keys + verifiable receiptHash | Infrastructure | 
| **A2A Micropayments** | Native x402 (Dexter + PayAI) | Metaplex | 
| **ZK Compressed State** | Protection against MEV and front-running via ZK proofs | Infrastructure |

--- 

### Security & Profit Maximization (Zero-Knowledge)

MIND doesn't promise "magical profits", but it **maximizes capital efficiency** by shielding intents from network surveillance (MEV bots):

1. **On-Chain Private Computer:** Instead of exposing state, we use ZK-compressed notes (commitments/nullifiers). The network only sees hashes, hiding your exact positions.
2. **Treasury Agent:** Your capital remains in a cryptographic vault, only released Just-In-Time (JIT) when execution is atomic and verified.
3. **A2A Dark Pools:** Agents negotiate P2P without public orderbooks. This guarantees zero information leakage, zero front-running, and minimized slippage.

*MIND retains your maximum margin by eliminating predators.*

---

### How MIND Makes Money (Revenue Model)

MIND is the "Intent Defense Layer". We don't take your trading profit, we secure it. Our revenue scales with the Agent Economy:

| Tier | Price | What you get |
|------|-------|--------------|
| **Free** | $0 | Basic Dashboard + 5 intents/day |
| **Pro** | $19/mo or 0.5% profit share | Unlimited intents + Autonomous Mode + Advanced Alerts |
| **Enterprise** | 5-10% profit share | White-label KMS + Dedicated Execution Priority |

**Future Revenue Streams:**
- **x402 Fees:** Fractional fees when other agents query MIND API (e.g. $0.03 per liquidity read).
- **Revenue Share:** A slice of A2A payments facilitated via Dexter/PayAI on our rails.

---

### Screenshots 

- **Home – Where the Money Flows** (toggle Agent Economy) 
- **App Dashboard** – Recent Intents + Agent Status + Manual Override 
- **Features** – Grid with A2A, Intent Validation, On-chain Proofs 
- **Infrastructure** – Complete diagram (Intent Capture -> MIND Engine -> Settlement) 

*(Images available in the `/public/screenshots` folder)* 

--- 

### Architecture & Tech Stack 

- **Frontend**: React + TypeScript + Tailwind (Dark Glassmorphism) 
- **Backend Services** (monorepo pnpm): 
  - `signer-service` -> KMS ephemeral keys (never logs private key) 
  - `execution-service` -> Atomic execution + `receiptHash` 
  - `approval-gateway-service` -> `/v1/onboard/tg-agent` (deep link) 
  - `registry-service` -> Metaplex Core adapter 
- **Infra**: Docker Compose + PostgreSQL + Solana RPC 
- **Integrations**: OpenClaw Telegram Bot, Covalent GoldRush, Metaplex Core, x402 (Dexter / PayAI) 

**Security**: All keys are ephemeral. Logs only show `action` + `bodyHash` + `signatureHash`. 

--- 

### How to Run (Local) 

```bash 
git clone https://github.com/dg-doublegreen/MIND.git 
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

#### Telegram Onboard (45 seconds)
1. In your OpenClaw / SolClaw agent chat, type `/mind` 
2. Confirm Solana wallet 
3. Approve A2A permissions 
4. Done. Your agent now appears in the MIND Dashboard with live metrics. 

---

### Hackathon Submission
- **X Article**: [Thread Link]
- **Demo Video**: 45s (screen recording of the complete flow) 
- **Repo**: [https://github.com/dg-doublegreen/MIND](https://github.com/DGuedz/MIND) 
- **Live**: `https://mind.app`  

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
