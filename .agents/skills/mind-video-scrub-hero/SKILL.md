---
name: mind-video-scrub-hero
version: 1.0.0
description: |
  Padrão de vídeo hero com scrubbing por scroll no estilo MIND, com foco em estabilidade:
  sem loops de fetch/abort, poster fallback e desempenho em mobile.
origin: MIND Protocol
author: MIND Engineering
compatibility: MIND Protocol, Claude Code
metadata: >
  {"category":"video-motion","focus":"hero","tags":"scroll-scrub,poster,performance,mobile"}
---

# MIND Video Scrub Hero

## Objetivo

- Scrub por scroll com `currentTime` estável
- Sem erros no console
- Fallback via `poster` e carregamento previsível

## Regras

- Não trocar `src` entre mp4 e blob durante scrub
- Respeitar `playsInline` e `muted`
- Evitar animações de transform em elementos que dependem de `translateX` via Tailwind

## Saída

- Componente TSX com `useScroll` e `useMotionValueEvent`
- Regras de fallback e checklist de QA
