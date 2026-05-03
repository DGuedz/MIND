---
name: mind-hero-typography-builder
version: 1.0.0
description: |
  Gera tipografia de Hero no estilo MIND: mono, uppercase, tracking controlado,
  cinza oficial com acentos Solana leves, e responsividade sem quebra.
origin: MIND Protocol
author: MIND Engineering
compatibility: MIND Protocol, Claude Code
metadata: >
  {"category":"typography","focus":"hero","tags":"headline,mono,uppercase,tracking,solana"}
---

# MIND Hero Typography Builder

## Entradas

- headline (texto principal)
- highlight_words (palavras a destacar)
- tone (pt-BR, institucional, builder)

## Regras

- Sempre prever mobile: evitar tracking alto em telas < 360px
- Preferir 2 a 4 linhas no máximo com quebras explícitas
- Destaques com borda discreta e fundo translúcido (sem glow forte)
- Subcopy curta (1 a 2 frases)

## Saída

- JSX/TSX com classes Tailwind prontas
- Variante desktop e variante mobile
