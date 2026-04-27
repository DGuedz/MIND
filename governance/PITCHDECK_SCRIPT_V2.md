# MIND Protocol: Pitch Deck V2

Status: draft board version
Rule: slide visible copy <= 70 chars
Date: 2026-04-25

## Board Thesis

MIND should not pitch itself as another agent marketplace.
The stronger wedge is private, policy-checked payments for AI agents.

Kuka framing:
MIND is the card network risk desk for autonomous agents.
x402 is the payment message.
Cloak is the private settlement layer.
Agent Cards are the merchant terminals.
Proof bundles are the receipt and dispute file.

## Evidence Gate

Colosseum Copilot API was not called because `COLOSSEUM_COPILOT_PAT`
is not set. External Colosseum public pages were used instead.

`aclock` was not verified as a public entity. Evidence supports `Cloak`.
Use `Cloak`, not `aclock`, unless the team provides proof.

## PMF Read

The market does not need another bot demo.
It needs spend control, private settlement, and receipts for agents.

Best ICP now:
1. Solana builders selling APIs, data, and agents.
2. Stablecoin/payment teams needing private B2B flows.
3. The Garage teams that can become first Agent Cards.

Do not claim:
1. Production revenue.
2. Enterprise adoption.
3. Zero hallucination.
4. Mainnet settlement by MIND unless a tx hash is shown.

Can claim:
1. Repo has A2A intent, policy, approval, proof components.
2. Cloak is a public C4 Brazil privacy company.
3. x402 supports machine payments and Solana settlement paths.
4. Solana has high throughput and real stablecoin/DEX activity.

## Data Points to Use

- Solana: $5.544B TVL, $15.437B stablecoins, $1.194B DEX volume
  in 24h, 2.4M active addresses, 73.74M transactions in 24h.
- Visa: stablecoin supply near $250B in 2025, 47M monthly active
  users, $817.5B adjusted stablecoin volume in last 30 days.
- Colosseum Cypherpunk: 9,000+ participants, 1,576 final projects.
- Colosseum C4: 11 startups selected, roughly 0.67% acceptance.
- Cloak: Cypherpunk Stablecoin Track third prize; C4 Brazil.
- Cloak site claim: 24,187 shielded transactions; verify before deck.
- x402: Solana support; CDP facilitator free tier 1,000 tx/month,
  then $0.001/transaction.
- GitHub MIND: public repo, 3 merged PRs, 1 fork, 1 open issue,
  2 contributors, latest push 2026-04-25.

## Narrative Impact From GitHub

GitHub proves build velocity, not demand.
Use it as proof that the marketplace can absorb external builders:
PR #3 adds CLINT as an external Agent Card from The Garage/Superteam.

Narrative correction:
Do not say "we have traction".
Say "the first supply-side integration path is already visible".

## New Deck

### Slide 1

Visible:
Private agent payments on Solana.

Speaker:
MIND is the control plane for agents that need to pay, prove, and
hide sensitive intent. This is not a bot. It is payment risk infra.

### Slide 2

Visible:
Agents can act. They still cannot safely spend.

Speaker:
x402 makes API-native agent payment possible. The missing layer is
policy, private settlement, escrow, and proof after the payment.

### Slide 3

Visible:
x402 moves money. MIND decides, shields, proves.

Speaker:
MIND wraps each payment with policy checks, Cloak UTXO privacy,
human approval when needed, and proof bundles for audit.

### Slide 4

Visible:
Cloak gives MIND private stablecoin settlement.

Speaker:
Cloak is a Colosseum C4 Brazil company building a ZK UTXO privacy
layer on Solana. MIND should partner as the agent payment/control
layer, not compete on privacy circuits.

### Slide 5

Visible:
Agent Cards turn tools into paid endpoints.

Speaker:
Each card is a productized skill: price, SLA, policy, proof, owner,
and payout route. This is the supply side of the marketplace.

### Slide 6

Visible:
The first wedge is The Garage supply.

Speaker:
Use Superteam Brasil and The Garage as the first distribution loop.
Every approved builder gets an Agent Card and a payment/proof path.

### Slide 7

Visible:
Solana already has the liquidity rails.

Speaker:
DefiLlama shows Solana with $15.437B stablecoins, $1.194B DEX
volume in 24h, and 73.74M transactions in 24h on 2026-04-25.

### Slide 8

Visible:
Stablecoins are big. Agent control is unsolved.

Speaker:
Visa reports stablecoin supply near $250B in 2025 and $817.5B
adjusted volume over 30 days. But bots and programmatic flows add
noise. MIND sells control, not just throughput.

### Slide 9

Visible:
Revenue: fee per paid, proven agent execution.

Speaker:
Model: 8% protocol fee on paid execution, plus proof/API fees.
For demo, keep 92/8 because it already appears in repo artifacts.
Do not project revenue until real paid usage exists.

### Slide 10

Visible:
Moat: policy, privacy, proof, and builder graph.

Speaker:
The moat is orchestration across four surfaces: x402 payment,
Cloak shielded transfer, Agent Card registry, and proof/audit.
Competitors may own one layer; MIND packages the operating rail.

### Slide 11

Visible:
90 days: ship the private Agent Card checkout.

Speaker:
Milestone 1: replace mock Cloak fallback with real SDK integration.
Milestone 2: one live Agent Card paid through x402.
Milestone 3: proof bundle with tx hash and policy decision.

### Slide 12

Visible:
Ask: Cloak partnership plus 10 paid Agent Cards.

Speaker:
The ask is not broad funding language. It is concrete:
co-build MIND x Cloak checkout, onboard 10 The Garage Agent Cards,
and measure paid executions, proof verification, and repeat usage.

## One-Minute Pitch

AI agents are ready to act, but they are not ready to spend safely.
x402 gives them a payment primitive. Cloak gives Solana private UTXO
settlement. MIND connects both into an agent control plane: policy
before spend, private settlement during spend, and proof after spend.

We start in The Garage, where builders already ship Solana skills.
Each skill becomes an Agent Card: price, SLA, owner, policy, payout,
and proof. The first goal is 10 paid Agent Cards, not vanity traffic.

Our wedge is simple: private agent checkout for Solana.

## Business Model

Supply:
Builders publish Agent Cards and receive 92% of paid execution.

Demand:
Agents, teams, and protocols pay per execution, not per SaaS seat.

Protocol:
MIND captures 8% per paid execution and can add proof/API fees.

Partner:
Cloak earns privacy-layer usage and becomes the default shielded
settlement primitive for MIND flows.

## PMF Metrics

Track weekly:
1. Approved Agent Cards.
2. Paid executions.
3. Repeat buyers.
4. Proof verification rate.
5. Blocked unsafe intents.
6. Average fee per execution.
7. Builder payout volume.
8. Cloak shielded settlement count.

Do not track as headline:
1. Stars.
2. Page views.
3. Mock UI completions.
4. Claims without tx hash.

## Source Notes

- DefiLlama Solana chain page, accessed 2026-04-25:
  https://defillama.com/chain/solana
- Visa stablecoin analysis, published 2025-07-21:
  https://corporate.visa.com/en/sites/visa-perspectives/trends-insights/making-sense-of-stablecoins.html
- Coinbase x402 documentation, accessed 2026-04-25:
  https://docs.cdp.coinbase.com/x402/welcome
- Colosseum Cypherpunk winners, published 2025-12-13:
  https://blog.colosseum.com/announcing-the-winners-of-the-solana-cypherpunk-hackathon/
- Colosseum C4 cohort, published 2025-12-22:
  https://blog.colosseum.com/announcing-colosseums-accelerator-cohort-4/
- Cloak website and docs, accessed 2026-04-25:
  https://www.cloak.ag/
  https://docs.cloak.ag/platform/overview
- GitHub repository API, accessed 2026-04-25:
  https://api.github.com/repos/DGuedz/MIND

