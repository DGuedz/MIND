# Spec: Repo Organization (Local Hygiene)

## Contexto
O repo local possui artefatos duplicados e pastas “shadow” (ex: arquivos com sufixo ` 2.*`, `node_modules 2/`, `README 2.md`, etc.). Isso aumenta risco de:
- builds pegarem arquivos errados (TypeScript incluir `**/*.ts` e compilar cópias)
- import paths quebrarem após movimentações não controladas
- confusão entre “source of truth” (skills/cards) e snapshots locais

Esta spec define um processo seguro (spec-driven) para reorganizar o repo **sem quebrar código**, preservando os 3 caminhos como âncoras:
- `.agents/skills/kuka/`
- `.agents/skills/colosseum-copilot/`
- `agent-cards/skills/mind/`

## Objetivos
- Reduzir ruído no repo local (duplicatas e artefatos) sem mudar semântica do produto.
- Preservar como “fonte canônica”:
  - Skills instaladas em `.agents/skills/**/SKILL.md`
  - Agent Cards geradas em `agent-cards/skills/mind/*.json`
- Impedir que arquivos duplicados entrem no pipeline de build/test.
- Tornar a organização verificável via checagens determinísticas.

## Não-Objetivos
- Não alterar lógica de produto, rotas, UI, ou contratos on-chain.
- Não “refatorar” serviços por estilo.
- Não regenerar cards/skills (a menos que a verificação aponte inconsistência objetiva).

## Fonte de Verdade e Invariantes
### Invariantes de paths (NÃO mover)
- `.agents/skills/kuka/SKILL.md` deve permanecer em `repo_path: ".agents/skills/kuka/SKILL.md"` (referenciado em `agent-cards/skills/mind/card_skill_kuka.json`).
- `.agents/skills/colosseum-copilot/**` deve manter `SKILL.md` e `references/` juntos (o skill descreve fluxo e endpoints; mover quebra referências e onboarding).
- `agent-cards/skills/mind/*.json` é tratado como artefato “distribuível” para marketplace/descoberta; sua localização é estável.

### Invariantes de governança (VSC)
- Nunca mover/duplicar segredos. Nunca adicionar chaves. Nunca logar payloads sensíveis.
- Mudanças devem ser auditáveis: cada movimento de arquivo precisa ser rastreável por “antes/depois”.

## Escopo de Reorganização
### 1) Duplicatas locais (“shadow copies”)
Qualquer arquivo/pasta com padrão:
- `* 2.*` (ex: `index 2.ts`, `README 2.md`)
- `*_ 2/` ou pastas com sufixo equivalente (ex: `node_modules 2/`, `products 2/`)

Tratamento padrão:
- Se for binário/artefato (logs, reports, mp4, jpg): mover para `artifacts/_local_dupes/` (mantendo subpastas por origem).
- Se for código (`.ts/.tsx/.js/.mjs/.cjs/.rs` etc): **não mover automaticamente**. Primeiro rodar checagens de inclusão (TypeScript) e referência (imports). Só então decidir:
  - deletar (se comprovadamente não referenciado e não incluído no build), ou
  - mover para `backup/_shadow_code/` (fora do include de build), ou
  - consolidar (se for o arquivo correto e o “sem sufixo” for o inválido).

### 2) Artefatos e logs
Normalizar para diretórios existentes:
- `artifacts/` para relatórios, dumps, outputs de scripts
- `logs_/` para logs rotativos e fora do controle de versão (quando aplicável)
- `assets/` para mídia estática que não pertence a um app específico

### 3) Apps e domínios
Não mover nada dentro de `apps/*/src` sem checagem de imports. Em especial, o `apps/landingpage/` deve continuar com seus `public/` e `src/` intactos.

## Checagens Determinísticas (Quality Gates)
### Gate A — Integridade de Skills ↔ Cards
Para cada card em `agent-cards/skills/mind/*.json` que tiver:
- `skill.repo_path`

Validar:
- o arquivo existe no repo nesse path
- o frontmatter `name:` em `SKILL.md` bate com a identidade do card (mínimo: conter o mesmo slug/skill name esperado)

Resultado:
- PASS: todos os repo_paths resolvem
- FAIL: listar cards quebrados e interromper movimentos

### Gate B — TypeScript Include Safety
Para cada workspace/pacote (root e serviços), inspecionar `tsconfig*.json` para:
- `include` / `files` / `exclude`

Objetivo:
- provar se `* 2.ts` está sendo compilado ou não

Resultado:
- Se estiver incluído: bloquear reorganização até remover do include (via exclusão) ou remover/mover o arquivo com segurança.

### Gate C — Import/Require Reference Scan
Antes de mover qualquer arquivo que não seja artefato:
- buscar por referências de path (imports, requires, URLs locais, scripts)
- atualizar referências somente se necessário e com build validado

## Plano de Pastas (Target Layout)
- `backup/_shadow_code/` (somente cópias de código, fora de build)
- `artifacts/_local_dupes/` (relatórios, dumps, mídias duplicadas)
- `docs/_archive/` (READMEs duplicados e documentação antiga, se não referenciada por CI)

## Riscos e Mitigações
- Risco: TypeScript compilar arquivos duplicados e causar conflitos silenciosos.
  - Mitigação: Gate B + rodar `tsc --noEmit` por pacote após cada lote.
- Risco: scripts/CI referenciar caminhos antigos.
  - Mitigação: Gate C + procurar referências em `.github/workflows`, `scripts/`, `package.json`.
- Risco: cards quebrarem por `repo_path` inválido.
  - Mitigação: Gate A como bloqueio hard.

## Saída Esperada (Definition of Done)
- Nenhum arquivo `* 2.ts(x)` fica incluído em builds TypeScript.
- `agent-cards/skills/mind/*.json` continua resolvendo `skill.repo_path` válido.
- Estrutura final reduz duplicatas e ruído sem alterar comportamento do produto.

