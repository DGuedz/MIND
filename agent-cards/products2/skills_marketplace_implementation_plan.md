# Skills Marketplace — Plano de Implementação (Site + Catálogo)

## Objetivo
Publicar no site (landing + /app) um marketplace de skills com catálogo consistente, proveniência e curadoria, usando os Agent Cards já gerados no repo.

## Estado Atual (evidência no repo)
- UI:
  - A Home tem seção “Agent Cards Marketplace” (`id="marketplace"`) com cards hardcoded.
  - O menu “Marketplace” aponta para `/app` (redirect de `/marketplace`).
- Catálogo:
  - Cards de skills existem em `agent-cards/skills/{sendaifun,mind}`.
  - Manifestos de fonte e sumário de geração existem em `agent-cards/skills/sources` e `agent-cards/skills/generation.summary.json`.
- Backend:
  - O `registry-service` persiste `agents` e projeta “cards” a partir de `agents`.
  - Não existe tabela/CRUD específico para “Agent Cards” como JSON.

## Estratégia de Implementação

### Fase 1 — Catálogo no site (sem depender de banco)
1) Criar um endpoint estático de catálogo para o frontend consumir:
   - Opção A (mais simples): publicar um JSON consolidado em `apps/landingpage/public/catalog/skills.json` gerado por script.
   - Opção B (mais flexível): criar endpoint no `api-gateway` que lê `agent-cards/skills/generation.summary.json` e retorna cards.
2) Implementar UI no `/app`:
   - Grid com busca e filtros por `source` (mind vs sendaifun) e `category`.
   - Link para “Install / Activate” quando existir (`/plugin install ...`).
3) Atualizar o teaser da Home:
   - Substituir hardcode por top N do mesmo catálogo.

Critério de aceite:
- `/app` lista cards reais do repo.
- Home “teaser” e `/app` usam a mesma fonte.
- Cada card expõe `license`, `source`, e “as_of”.

### Fase 2 — Curadoria + Qualidade
Adicionar metadados de curadoria (no próprio card ou em overlay separado):
- `recommended_for`: casos de uso (swap, rpc, nft, security, devops).
- `risk_notes`: avisos operacionais (ex: requer chave, custo, limites).
- `maintainer_score` (manual) e `freshness` (data de ingestão).

Critério de aceite:
- Lista “Top Skills” por trilha (ex: DeFi Starter Kit, Infra Kit, Security Kit).

### Fase 3 — Banco de dados (alimentar Agent Cards de forma correta)
Motivação: não inventar campos críticos (ex: `wallet`) para encaixar cards como `agents`.

1) Criar tabela dedicada (ex: `agent_cards`) com:
   - `id` (slug), `kind` (skill/product), `source`, `license`, `card_json` (JSONB), `created_at`, `updated_at`.
2) Criar endpoints no `registry-service`:
   - `POST /v1/cards/import` (ingestão em lote)
   - `GET /v1/cards?kind=skill&source=sendaifun&q=...`
3) Criar um importer:
   - Script lê `agent-cards/skills/**.json` e faz upsert via endpoint.

Critério de aceite:
- Catálogo é servível via API e versionável.
- Atualização do catálogo não exige redeploy do frontend.

### Fase 4 — Monetização (somente depois de catálogo robusto)
- Freemium: listagem gratuita + “verified/curated” pago.
- Per-request (x402) para:
  - “Auto-install bundles”
  - “Research packs” (ecosystem intel)
  - “Audit packs” (security)
- Split atômico 92/8 aplicado no rail de pagamento do MIND (mantendo compliance e policy gates).

## Go-To-Market (entrada no mercado)
Wedge: “Índice + Curadoria + Proveniência” para skills Solana.
- Indexar `sendaifun/skills` como catálogo base (Apache-2.0) e criar camadas MIND:
  - curadoria por trilhas (use-cases)
  - policy-first guidance (o que exigir de credenciais/chaves)
  - qualidade mínima (docs, exemplos, compatibilidade)
- Canal de distribuição:
  - builders que já usam Claude/Cursor/Codex (integração via Agent Cards e links de install).
  - sinergia com stacks tipo `solana.new` (MIND como “marketplace curado + rails de execução e prova”).

Métricas:
- Discovery: buscas -> cliques em card -> installs
- Ativação: primeira execução guiada por card
- Retenção: uso recorrente por trilha
- Receita: attach rate em bundles premium

## Riscos e Mitigações
- Proliferação de “claims” não verificáveis: separar “catálogo” (fato) de “capacidade MIND” (implementação real).
- Licenças: preservar `metadata.license` por fonte e manter rastreabilidade.
- Segurança: nunca embutir chaves/segredos; cards só descrevem.
