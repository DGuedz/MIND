# Publish.new Flow Analysis

## Source Signals

- `https://publish.new/` exposes a three-step seller flow: upload, set price, share link.
- `https://github.com/publish-new/cli` exposes the machine flow: publish, list, get metadata, get price, buy content.
- `skills/publish-new/SKILL.md` documents the API contract: upload creates a slug, metadata is public, content is gated by `402 Payment Required`.

## Extracted Sale Flow

1. Seller submits title, price, recipient wallet, and content or file.
2. Server creates an artifact record and public slug.
3. Marketplace page shows metadata, preview, price, and sale count.
4. Buyer or agent checks metadata and price.
5. Buyer requests the content endpoint.
6. Unpaid request returns `402 Payment Required` with payment instructions.
7. x402-compatible client pays and retries.
8. Server returns the gated content as text or streamed file.

## MIND Mapping

| publish.new primitive | MIND primitive |
| --- | --- |
| artifact | Agent Card or executable skill |
| walletAddress | builder settlement wallet |
| price | Agent Card execution price |
| `/api/artifact/:slug/price` | `/api/agent-card/:slug/price` |
| `/api/artifact/:slug/content` | `/api/agent-card/:slug/execute` |
| `402 Payment Required` | x402 settlement challenge |
| unlocked content | execution result, file, proof, or payload |

## Implemented Local Cut

Route:
- `/agent-checkout`

Local API:
- `POST /api/mind-artifact/upload`
- `GET /api/mind-artifact`
- `GET /api/mind-artifact/:slug`
- `GET /api/mind-artifact/:slug/price`
- `GET /api/mind-artifact/:slug/content?chain=solana-devnet`

Behavior:
- Upload creates an in-memory artifact with slug and checksum.
- Price endpoint returns USDC pricing metadata.
- Content endpoint returns `402` without proof.
- Content endpoint returns `200` with `x-mind-payment-proof: dev-paid`.

## Not Implemented

- Real x402 payment verification.
- On-chain Solana/Cloak settlement.
- File upload streaming.
- Persistent artifact storage.
- Production wallet/KMS ownership verification.

## Production Gate

Until on-chain settlement is wired and verified:

```json
{
  "decision": "INSUFFICIENT_EVIDENCE",
  "reason_codes": ["RC_MISSING_EVIDENCE"],
  "confidence": 0.78,
  "evidence": ["local 402 challenge implemented", "dev proof unlock implemented"]
}
```
