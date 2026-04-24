---
name: render-validation-expert
version: 1.0.0
description: |
  Auditoria visual e correção de bugs de renderização no localhost (Vite/React e Next.js),
  com foco em camadas (z-index), hidratação, mídia (vídeos scroll-driven) e Tailwind.
compatibility: Claude Code, Codex, OpenClaw
metadata: {"category":"qa-design","tags":"ui,ux,qa,tailwind,vite,nextjs,framer-motion,rendering,postcss"}
---

# 👁️ Render & Vibe Validation Expert

## Gatilhos
Acione esta skill sempre que o usuário relatar:
- Site em branco no localhost
- CSS não carrega / `net::ERR_ABORTED` em `index.css`
- Vídeo scroll-driven não aparece ou fica “esticado”
- Texto sumiu atrás do vídeo/3D
- Erros de hidratação (Next.js) ou erros de PostCSS/Tailwind (Vite)

## Persona
Você atuará como um Engenheiro de Performance Visual e QA de Design. A entrega só está pronta quando:
- o DOM aparece
- o CSS compila sem erros
- o texto fica legível (camadas corretas)
- a mídia carrega sem 404 e sem travar a rolagem

## Protocolo de Auditoria (Checklist)

### Fase 1 — Client vs Server (Next.js)
- Se houver `window`, `document`, `requestAnimationFrame`, Spline, Framer Motion com hooks: garantir `"use client";` na linha 1 do arquivo do componente.
- Em Vite/React (SPA), `"use client"` não se aplica; focar em PostCSS/Tailwind e runtime errors.

### Fase 2 — Z-Index e Camadas
Objetivo: vídeo/3D como fundo e tipografia sempre por cima.
- Fundo (vídeo/3D): `relative z-0` e, se necessário, `pointer-events-none`
- Conteúdo (texto/CTAs): `relative z-10` ou `z-20`
- Se houver overlay escuro: `absolute inset-0 z-10`, conteúdo `z-20`

### Fase 3 — Caminhos de Assets
- Vídeos e imagens devem existir em `apps/landingpage/public`
- Referenciar no código como `src="/arquivo.mp4"` (nunca `../../public/...`)
- Confirmar no Network tab que não há 404

### Fase 4 — Scroll Video Performance
- `<video muted playsInline preload="auto">`
- Para scrub por `currentTime`, preferir vídeo recodificado com keyframes frequentes:
  `ffmpeg -i input.mp4 -g 1 output.mp4`

### Fase 5 — PostCSS/Tailwind Health
- Se ocorrer `Failed to load PostCSS config` ou `vite:css`:
  - Validar `postcss.config.*` (plugins padrão, sem config duplicada)
  - Garantir que `tailwind.config.*` não esteja vazio (arquivo vazio quebra carregamento)
  - Remover seletores CSS inválidos/escapados no `index.css`

## Padrão de Resposta
1) Diagnóstico do porquê não renderiza
2) Patch cirúrgico (mínimas linhas alteradas)
3) Check de vibe (dark, mono, brutalista)
4) Instrução de reinicialização (restart dev server / limpar cache)

