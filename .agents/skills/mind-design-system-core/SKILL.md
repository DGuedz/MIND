---
name: mind-design-system-core
version: 1.0.0
description: |
  Exporta o design system premium dark metallic do MIND como tokens, utilitários Tailwind/CSS
  e receitas de componentes. Foco: consistência, brilho contido, acentos Solana (verde/roxo).
origin: MIND Protocol
author: MIND Engineering
compatibility: MIND Protocol, Claude Code
metadata: >
  {"category":"design-system","focus":"ui","tags":"tailwind,css,tokens,metallic,solana"}
---

# MIND Design System Core

## Entrega

- Tokens de cor e contraste (cinzas oficiais + acentos Solana)
- Classes base para containers/cards (premium dark metallic)
- Regras de glow (restrito e contido)
- Padrões de tipografia (mono, tracking, hierarquia)
- Checklist de responsividade (mobile-first)

## Regras

- Base sempre em cinzas (zinc), com acentos Solana apenas como detalhe
- Sem glow grande e sem blur agressivo
- Bordas finas e discretas, evitando ruído visual
- Evitar transform 3D em containers de layout; 3D apenas em cards e com limite

## Saída esperada

- Um bloco com tokens (cores, bordas, sombras)
- Um bloco com receitas de componentes (Header, Card, Badge, Nav overlay)
- Um checklist de validação visual em mobile e desktop
