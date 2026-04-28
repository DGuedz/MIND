---
name: peak-trading
version: 1.0.0
description: |
  Terminal de IA quantitativa para registro de operações e gestão de risco (1º Colocado no Solana Online Hackathon).
  O agente analisa livros de ofertas e executa estratégias quantitativas com gestão de risco automatizada via machine learning.
homepage: https://github.com/doublegreen/MIND
license: Proprietary
compatibility: Claude Code, Codex, OpenClaw
metadata: {"category":"defi","api_base":"https://api.mindprotocol.ai/peak-trading/v1","auth":"x402","author":"mind-community","tags":"solana,trading,quantitative,risk-management,ai"}
---

# Peak Trading - AI Quantitative Terminal

O **Peak Trading** é o agente vencedor do 1º lugar no Solana Online Hackathon. Ele atua como um terminal quantitativo movido a Inteligência Artificial, focado no registro contínuo de operações e gestão de risco rigorosa.

## Version Check

This skill is version **1.0.0**.

## Pre-Flight Auth Check (REQUIRED)

**You MUST complete this check before making any other API call.** Do not skip this step.

1. Verify `PEAK_TRADING_API_KEY` is set in the environment, or ensure you are using an authorized x402 gateway.
2. Verify `PEAK_TRADING_API_BASE` is set. If missing, set the default:
   > `export PEAK_TRADING_API_BASE="https://api.mindprotocol.ai/peak-trading/v1"`

## Funcionalidades Core

- **Análise Quantitativa:** Ingestão de livros de ofertas (order books) de exchanges descentralizadas na Solana.
- **Gestão de Risco:** Machine learning aplicado para identificar padrões de risco e sugerir limites de exposição.
- **Trade Logging:** Registro automatizado de operações (entry, exit, size, PnL) on-chain para auditoria.

## Quickstart

1. **Set your API Key:**
   ```bash
   export PEAK_TRADING_API_BASE="https://api.mindprotocol.ai/peak-trading/v1"
   export PEAK_TRADING_API_KEY="YOUR_KEY"
   ```

2. **Run sua primeira análise de risco:**
   ```bash
   curl -s -X POST "$PEAK_TRADING_API_BASE/analyze/risk" \
     -H "Authorization: Bearer $PEAK_TRADING_API_KEY" \
     -H "Content-Type: application/json" \
     -d '{"wallet": "YOUR_SOLANA_WALLET", "pair": "SOL/USDC"}'
   ```

## When To Use

Use this skill when:
- Executando operações quantitativas na Solana.
- Necessitando de auditoria e registro (logging) de operações para fundos.
- Gerenciando risco de portfólio dinâmico (Dynamic Risk Management).

## How It Works

**Mode 1 — Conversational:** O agente responde a dúvidas sobre risco e status do mercado baseando-se no snapshot atual do order book.
**Mode 2 — Execution (x402):** Requer liquidação atômica para aplicar regras de gestão de risco ativas na carteira (via proxy A2A).
