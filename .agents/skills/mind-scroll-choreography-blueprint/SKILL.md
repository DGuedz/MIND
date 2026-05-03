---
name: mind-scroll-choreography-blueprint
version: 1.0.0
description: |
  Blueprint da coreografia de scroll do MIND: ordem de seções, pacing, transições,
  spacing premium, e regras de motion seguras para mobile.
origin: MIND Protocol
author: MIND Engineering
compatibility: MIND Protocol, Claude Code
metadata: >
  {"category":"ux-motion","focus":"scroll","tags":"sections,pacing,spacing,framer-motion,mobile"}
---

# MIND Scroll Choreography Blueprint

## Entrega

- Mapa de seções (ordem e intenção)
- Intervalos de scroll (quando aparece e quando some)
- Regras de transição (sem sobreposição de textos)
- Padrões de spacing (premium, sem secura extrema)

## Regras

- Evitar scroll-jacking agressivo em mobile
- Suportar `prefers-reduced-motion`
- Não usar transforms que conflitam (ex: opacity animado e opacity por scroll no mesmo node)

## Saída

- Checklist de implementação
- Parâmetros sugeridos de `useScroll/useTransform`
