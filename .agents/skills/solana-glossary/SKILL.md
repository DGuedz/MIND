# solana-glossary

Skill de base de conhecimento para termos do ecossistema Solana usando o SDK `@stbr/solana-glossary` (1001 termos, 14 categorias, cross-references e i18n pt/es).

## O que faz

- Busca termo por id ou alias (ex.: "pda", "PoH")
- Busca full-text (nome, definição, aliases)
- Lista termos por categoria
- Retorna definições curtas (1–3 frases) com cross-references quando disponível

## Dependências

- npm: `@stbr/solana-glossary`

## Como usar (prompts)

- "defina PDA"
- "o que é proof-of-history? inclua termos relacionados"
- "liste termos da categoria defi"
- "busque por 'account' e me devolva os 10 mais relevantes"
- "responda em pt-br usando a tradução quando existir"

## API sugerida (wrapper)

- getTerm(idOuAlias)
- searchTerms(query)
- getTermsByCategory(category)
- getLocalizedTerms(locale)
