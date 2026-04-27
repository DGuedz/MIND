# Checklist: Repo Organization (Local Hygiene)

## Safety
- [ ] Nenhum segredo/credencial foi movido para dentro do repo (nem apareceu em diffs/logs).
- [ ] Nenhuma alteração em flows financeiros/on-chain foi feita.
- [ ] Os 3 paths âncora permanecem intactos:
  - [ ] `.agents/skills/kuka/`
  - [ ] `.agents/skills/colosseum-copilot/`
  - [ ] `agent-cards/skills/mind/`

## Gate A — Skills ↔ Cards
- [ ] Para todo `agent-cards/skills/mind/*.json` com `skill.repo_path`, o arquivo existe.
- [ ] `SKILL.md` correspondente possui `name:` consistente com o slug esperado.

## Gate B — TypeScript Include Safety
- [ ] Nenhum arquivo `* 2.ts` / `* 2.tsx` está incluído em `tsconfig include/files`.
- [ ] `tsc --noEmit` passa (root + workspaces relevantes) ou `pnpm -r typecheck` passa.

## Gate C — Reference Scan
- [ ] Não há referências quebradas em `.github/workflows/**`.
- [ ] Não há scripts quebrados em `scripts/**` por paths alterados.
- [ ] Imports/paths no `apps/landingpage/**` continuam válidos.

## Hygiene
- [ ] Duplicatas de mídia/logs foram movidas para `artifacts/_local_dupes/`.
- [ ] Duplicatas de docs foram movidas para `docs/_archive/`.
- [ ] Duplicatas de código (quando não eliminadas) foram isoladas em `backup/_shadow_code/`.
- [ ] `.gitignore` previne reintrodução de `backup/_shadow_code/` e `artifacts/_local_dupes/` (se forem locais).

## Done
- [ ] Repo abre e navega sem “pastas sombra” no root.
- [ ] Marketplace/catalog continua encontrando cards em `agent-cards/skills/mind/`.

