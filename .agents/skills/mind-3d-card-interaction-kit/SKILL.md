---
name: mind-3d-card-interaction-kit
version: 1.0.0
description: |
  Receitas de interação 3D (tilt/hover) para cards no estilo MIND, com limites
  e proteção para mobile (sem jitter e sem quebrar layout).
origin: MIND Protocol
author: MIND Engineering
compatibility: MIND Protocol, Claude Code
metadata: >
  {"category":"motion","focus":"cards","tags":"framer-motion,tilt,bounds,mobile-safe"}
---

# MIND 3D Card Interaction Kit

## Objetivo

- Card interativo com sensação 3D premium
- Limite de rotação baixo (estável e institucional)
- Mobile: reduzir ou desativar tilt

## Regras

- Não aplicar transform 3D no container de layout (apenas no card)
- Limitar rotação a poucos graus
- Respeitar `prefers-reduced-motion`
- Evitar blur/glow pesado

## Saída

- Exemplo TSX com Framer Motion
- Parâmetros recomendados (rotacao max, spring, damping)
