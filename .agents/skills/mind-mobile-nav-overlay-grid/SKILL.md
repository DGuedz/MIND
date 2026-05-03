---
name: mind-mobile-nav-overlay-grid
version: 1.0.0
description: |
  Gera um menu mobile overlay em grade (grid) no estilo MIND, evitando quebra
  de layout e garantindo leitura e clique em telas pequenas.
origin: MIND Protocol
author: MIND Engineering
compatibility: MIND Protocol, Claude Code
metadata: >
  {"category":"navigation","focus":"mobile","tags":"grid,truncate,spacing,tailwind"}
---

# MIND Mobile Nav Overlay Grid

## Objetivo

- Menu overlay que não quebra em mobile
- Itens com largura total, truncation e números/ícones opcionais
- Tipografia compacta e consistente

## Regras

- Usar `grid-cols-1` no mobile e `sm:grid-cols-2` quando houver espaço
- Aplicar `min-w-0` + `truncate` para evitar estouro
- Padding e gap reduzidos (sem poluição)
- Alvos de toque confortáveis (altura mínima do item)

## Saída

- JSX/TSX do nav overlay (lista de itens)
- Lista de classes Tailwind sugeridas para ajustes finos
