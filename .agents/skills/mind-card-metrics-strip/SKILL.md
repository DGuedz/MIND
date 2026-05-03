---
name: mind-card-metrics-strip
version: 1.0.0
description: |
  Cria um strip de métricas (estilo onchain) para cards, minimalista e seguro
  para mobile/desktop, sem sobreposição.
origin: MIND Protocol
author: MIND Engineering
compatibility: MIND Protocol, Claude Code
metadata: >
  {"category":"cards","focus":"metrics","tags":"grid,labels,values,responsive,tailwind"}
---

# MIND Card Metrics Strip

## Entradas

- metrics: lista de {label, value, hint}
- columns: 1, 2 ou 4 (responsivo)

## Regras

- `min-w-0` + `truncate` para labels
- `grid` com `gap` contido
- Sem animação e sem glow forte
- Manter altura previsível do bloco

## Saída

- JSX/TSX do bloco de métricas
- Recomendações de breakpoints para 320/360/390px
