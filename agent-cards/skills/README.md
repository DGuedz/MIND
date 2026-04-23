# Skills Marketplace Agent Cards

Esta pasta contém Agent Cards que descrevem skills (capabilities) para o marketplace de skills do ecossistema Solana.

Estrutura:
- `sources/`: manifestos de fontes externas (ex: GitHub) usados para gerar cards.
- `sendaifun/`: cards gerados a partir do catálogo público `sendaifun/skills` (Apache-2.0).
- `mind/`: cards de skills internas do repositório MIND (ex: `kuka`, `solana-defi-ecosystem-intel`).

Geração:
- Use `scripts/generate_skill_cards.mjs --write` para (re)gerar os cards a partir dos manifestos em `sources/`.

Regras:
- Não trate referências externas como features implementadas no MIND sem evidência no código.
- Mantenha `metadata.license` consistente com a licença da fonte.
