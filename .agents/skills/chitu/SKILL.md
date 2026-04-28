---
name: chitu
version: 1.0.0
description: |
  Sistema de captura de Alpha on-chain na Solana para comunidades e equipes de pesquisa (3º Colocado no Solana Online Hackathon).
  O agente monitora os movimentos do "smart money" e notifica sobre oportunidades de trade em tempo real.
homepage: https://github.com/doublegreen/MIND
license: Proprietary
compatibility: Claude Code, Codex, OpenClaw
metadata: {"category":"analytics","api_base":"https://api.mindprotocol.ai/chitu/v1","auth":"x402","author":"mind-community","tags":"solana,alpha-discovery,onchain,smart-money"}
---

# Chitu - On-Chain Alpha Capture

O **Chitu** é o agente vencedor de Alpha Discovery no Solana Online Hackathon (3º Colocado Geral). Ele foca exclusivamente na extração e captura de Alpha através do monitoramento on-chain, acompanhando carteiras identificadas como "smart money".

## Version Check

This skill is version **1.0.0**.

## Pre-Flight Auth Check (REQUIRED)

**You MUST complete this check before making any other API call.** Do not skip this step.

1. Verify `CHITU_API_KEY` is set in the environment, or ensure you are using an authorized x402 gateway.
2. Verify `CHITU_API_BASE` is set. If missing, set the default:
   > `export CHITU_API_BASE="https://api.mindprotocol.ai/chitu/v1"`

## Funcionalidades Core

- **Smart Money Tracking:** Segue grandes players, carteiras de VC e formadores de mercado na Solana.
- **Notificações em Tempo Real:** Dispara alertas quando detecta fluxos anômalos de liquidez.
- **Análise de Endereço (Wallet Profiling):** Atribui scores de sucesso a carteiras on-chain.

## Quickstart

1. **Set your API Key:**
   ```bash
   export CHITU_API_BASE="https://api.mindprotocol.ai/chitu/v1"
   export CHITU_API_KEY="YOUR_KEY"
   ```

2. **Monitore uma carteira específica:**
   ```bash
   curl -s -X POST "$CHITU_API_BASE/monitor/wallet" \
     -H "Authorization: Bearer $CHITU_API_KEY" \
     -H "Content-Type: application/json" \
     -d '{"wallet_address": "YOUR_TARGET_SOLANA_WALLET", "threshold": 10000}'
   ```

## When To Use

Use this skill when:
- Necessitando rastrear a movimentação de tokens antes de tendências de mercado.
- Fazendo due diligence em fluxos de carteiras específicas (DEX/CEX flow).
- Criando alertas para eventos de liquidez e despejo de grandes carteiras.

## How It Works

**Mode 1 — Conversational:** Fornece um resumo estático e análise do histórico da carteira especificada (profiling).
**Mode 2 — Deep Monitor (x402):** Requer subscrição via liquidação atômica para adicionar a carteira no motor de streaming RPC do Chitu, ativando webhooks ou push notifications ativas.
