# Hackathon Pitch Script

## One-liner
MIND is the trust and execution control plane for A2A finance on Solana.
It is also the policy layer for institutional stablecoin B2B agent payments.

## Demo flow
Scenario A:
- strict mode enabled
- external anchor pending
- result: BLOCK

Scenario B:
- strict mode enabled
- external anchor confirmed
- result: ALLOW + proof tx

## Metrics to show
- `EV_net`
- end-to-end latency
- allow vs block rate
- `proofVerified`
- `externalAnchorStatus`
- stablecoin settlement count
- policy-compliant settlement ratio

## Claims policy
Do not claim:
- guaranteed profits
- zero slippage
- perfect safety

Use:
- conditioned execution
- explicit policy gates
- verifiable proof outputs
