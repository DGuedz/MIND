# MIND Master Skill (DevOps & Onboarding)

A `master-skill` é o coração do ecossistema de desenvolvimento do **MIND Protocol**. Ela transforma a experiência de instalação de dependências, frameworks e novas skills (como SpecKit, OpenClaw, etc.) em um processo conversacional, guiado e seguro.

Esta ferramenta demonstra a **escalabilidade** do MIND: qualquer desenvolvedor pode criar uma nova "Skill de IA", e o Master Skill a encontrará e a acoplará ao repositório instantaneamente.

## 🌟 Funcionalidades Principais

1. **Parser Robusto (Natural Language):** 
   - Suporta comandos técnicos tradicionais (`pnpm master-skill install speckit`) e linguagem natural em português (`pnpm master-skill buscar repositório SpecKit`).
   - Ignora *stopwords* (ex: "repositório", "buscar", "por", "favor") para focar na intenção real.

2. **Gerenciamento de Configuração Global (`~/.codex/Config`):**
   - Configura interativamente os diretórios base de repositórios e skills (TTY).
   - Mantém estado persistente entre execuções.

3. **Varredura e Busca Inteligente:**
   - Procura em `skillsRoot`, `reposRoot` e no `repos-index` integrado.
   - Suporta *alias* e tags para encontrar ferramentas (ex: "SpecKit" mapeia para "claude-speckit").

4. **Auto-Clone e Instalação (Zero-Friction):**
   - Se a skill solicitada for conhecida mas não estiver baixada, a `master-skill` faz o `git clone` do repositório oficial em background e, em seguida, realiza a instalação (cópia + configuração) no projeto alvo.
   - Gerencia conflitos com a flag `--force`.

---

## 🛠️ Playbook Operacional

### Como usar no MIND

A `master-skill` está exposta como um atalho no `package.json` do projeto principal.

**1. Ver a ajuda e comandos disponíveis:**
```bash
pnpm master-skill --help
```

**2. Listar todas as skills e frameworks conhecidos/instalados:**
```bash
pnpm master-skill listar skills disponíveis
```

**3. Buscar uma skill específica (Linguagem Natural):**
```bash
pnpm master-skill buscar repositório SpecKit
```
*(O parser entenderá que você quer "speckit" e procurará nos índices).*

**4. Instalar uma skill no projeto:**
```bash
# Formato CLI
pnpm master-skill instalar playwright --project ./

# Formato Natural / Semântico
pnpm master-skill instalar playwright --project ./
```
*(Isso copiará os arquivos da skill estruturalmente via clone ou copy para `agents/skills/playwright` ou o destino adequado, injetando as dependências necessárias).*

---

## 🧠 Arquitetura Técnica

O script `scripts/master-skill.mjs` opera em 3 camadas:
1. **Intention Router:** Extrai verbos (`buscar`, `instalar`, `listar`) e alvos.
2. **Context Provider:** Lê o `~/.codex/Config` e os diretórios locais para entender o que já existe.
3. **Execution Engine:** Executa as ações reais de File System (`fs.cpSync`, `git clone`, `npm install` equivalente para skills).

## 🚀 Como Criar uma Nova Skill para o MIND
1. Crie um repositório ou pasta com sua lógica de Agente/IA.
2. Crie um arquivo de manifesto `manifest.json` ou `SKILL.md` na raiz.
3. Publique. Qualquer usuário do MIND agora pode rodar `pnpm master-skill instalar <sua-skill>` e ela será imediatamente integrada à *Agentic Economy*!
