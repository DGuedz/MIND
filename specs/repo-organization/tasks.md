# Tasks: Repo Organization (Local Hygiene)

## Fase 0 — Inventário (read-only)
1. Mapear duplicatas por padrões:
   - `* 2.*`
   - pastas com sufixo ` 2/`
2. Classificar por tipo:
   - código (ts/tsx/js/mjs/cjs/rust/go)
   - docs (md)
   - mídia (png/jpg/webp/svg/mp4)
   - logs/dumps (log/json/jsonl/sql)
3. Identificar diretórios “âncora” que NÃO podem mover:
   - `.agents/skills/kuka/`
   - `.agents/skills/colosseum-copilot/`
   - `agent-cards/skills/mind/`

## Fase 1 — Geração de um “Move Plan” (read-only)
4. Rodar Gate A (Skills ↔ Cards):
   - listar `agent-cards/skills/mind/*.json`
   - para cada `skill.repo_path`, validar existência do arquivo
5. Rodar Gate B (TypeScript Include Safety):
   - inspecionar `tsconfig*.json` no root, apps, services e packages
   - detectar se arquivos `* 2.ts(x)` entram em `include/files`
6. Rodar Gate C (Reference Scan):
   - buscar referências de paths alvo em:
     - `.github/workflows/**`
     - `package.json` (root + workspaces)
     - `scripts/**`
     - `apps/**`
     - `services/**`

Saída desta fase:
- uma tabela “before → after” com cada movimento proposto
- lista do que será deletado vs arquivado (com critério)

## Fase 2 — Movimentos seguros (write)
7. Criar pastas alvo:
   - `backup/_shadow_code/`
   - `artifacts/_local_dupes/`
   - `docs/_archive/`
8. Mover somente classes “seguras” primeiro:
   - mídia duplicada → `artifacts/_local_dupes/media/`
   - logs/reports duplicados → `artifacts/_local_dupes/logs/`
   - docs duplicadas (ex: `README 2.md`) → `docs/_archive/`
9. Para duplicatas de código:
   - aplicar estratégia por pacote:
     - se não incluído + não referenciado: mover para `backup/_shadow_code/`
     - se incluído ou referenciado: resolver (consolidar ou excluir do build) antes de mover
10. Se necessário, ajustar `.gitignore` para evitar reintrodução de ruído (ex: `backup/_shadow_code/`, `artifacts/_local_dupes/`).

## Fase 3 — Verificação (write + comandos)
11. Re-rodar Gate A/B/C após movimentos.
12. Validar builds TypeScript:
   - `pnpm -r -w lint` (se existir)
   - `pnpm -r -w typecheck` (se existir)
   - fallback: `tsc --noEmit` por workspace com `tsconfig.json`
13. Validar pipeline do catálogo (se aplicável):
   - garantir que `scripts/build_catalog.js` não depende de paths que mudaram

## Fase 4 — Documentação mínima (write)
14. Registrar no `docs/_archive/README.md` o critério de arquivamento (1 página).
15. Adicionar nota curta no README root (opcional) explicando onde ficam artifacts/backup.

