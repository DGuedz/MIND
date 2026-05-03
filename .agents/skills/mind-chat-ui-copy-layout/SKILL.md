---
name: mind-chat-ui-copy-layout
version: 1.0.0
description: |
  Ajusta copy e tipografia do Chat UI para alinhar com a linha de design do MIND,
  mantendo cards intactos e garantindo compatibilidade mobile/desktop.
origin: MIND Protocol
author: MIND Engineering
compatibility: MIND Protocol, Claude Code
metadata: >
  {"category":"copy-layout","focus":"chat-ui","tags":"typography,spacing,pt-br,ui"}
---

# MIND Chat UI Copy & Layout

## Objetivo

- Melhorar legibilidade e hierarquia do topo do chat
- Manter os cards abaixo inalterados
- Garantir que nada quebre em mobile

## Invariantes

- Não mover nem alterar cards
- Não introduzir sombras coloridas pesadas
- Não usar tracking agressivo em telas pequenas

## Saída

- Headline (1 a 2 linhas) + subcopy curta
- Classes Tailwind para layout do header
- Checklist de validação (mobile: 360px, 390px; desktop: 1280px)
