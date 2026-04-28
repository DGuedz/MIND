# docs-link-integrity

Garante que links de documentação expostos no frontend (landingpage) não apontem para rotas inexistentes ou caminhos locais. Normaliza para fontes canônicas (GitHub blob) quando não houver rota `/docs/*` implementada.

## O que faz

- Varre o frontend por links do tipo `/docs/*` e por referências a arquivos locais.
- Valida se existe rota/página correspondente.
- Se não existir, substitui o link por URL canônica (GitHub `blob/main/...`).
- Produz evidência: lista de links alterados + motivo (rota ausente vs rota existente).

## Regras de segurança (obrigatórias)

- Nunca expor caminhos locais do ambiente do desenvolvedor no site publicado.
- Nunca inserir tokens, chaves, headers `Authorization` ou `x-api-key` no frontend.
- Se o conteúdo exibido for “demo/mock”, rotular explicitamente como DEMO/OFFLINE e não alegar “verificado on-chain”.

## Input

- `repo_root`: caminho do repo
- `frontend_path`: caminho do app web (ex: `apps/landingpage`)
- `canonical_repo_url`: URL base do GitHub (ex: `https://github.com/DGuedz/MIND`)

## Output

- `patch_summary`: mudanças aplicadas
- `changed_links`: array `{ from, to, reason }`
- `evidence`: arquivos e linhas afetadas (sem segredos)

