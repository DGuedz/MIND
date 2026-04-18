# MIND Protocol - GitHub-Only Stabilization Plan

Devido à instabilidade de I/O do ambiente iCloud (conflitos de lock/sync), o desenvolvimento local está **congelado em modo leitura** até a normalização de um workspace 100% nativo.

O `release/hackathon-submission` é a nossa **branch operacional temporária e Fonte de Verdade**.

## Fluxo Operacional Exigido:
1. Trabalhar estritamente via PR no GitHub.
2. Não buildar/servir via IDE Local.
3. Usar Vercel Preview Deploy por Branch/PR.
4. Exigir checks verdes no PR Template antes de merge (CI/CD ou Preview Vercel).

---

## 📋 Pacote de Issues de Estabilização (Ações Imediatas no GitHub)

Copie o conteúdo abaixo e crie as **Issues** correspondentes na aba do seu repositório:

### Issue #1: `[Docs] Padronização Definitiva do Link Oficial Vercel`
**Descrição:** O repositório possui links antigos apontando para `mind-protocol.vercel.app` (que direciona para um proxy morto), enquanto o build oficial gerado pelo nosso repositório é `landingpage-dgs-projects-ac3c4a7c.vercel.app`.
**Ações da Issue:**
- [x] Alterar link do README.md.
- [x] Alterar link no HACKATHON_SUBMISSION.md.
- [x] Alterar no MARKETING_MATERIALS.md.
*(Nota: O agente já comitou essa alteração, basta documentar o ticket como DONE).*

### Issue #2: `[Frontend] Validação do Preview Vercel (CI/CD)`
**Descrição:** Confirmar se as edições no Copy (B2B, Invisible Toll, A2A) na branch `release/hackathon-submission` estão buildando corretamente através do CI/CD do Vercel sem travamentos de `node_modules`.
**Ações da Issue:**
- [ ] Validar se o build na Vercel está verde para o último commit.
- [ ] Acessar `landingpage-dgs-projects-ac3c4a7c.vercel.app` e confirmar visualmente a headline "The Invisible Toll".
- [ ] Validar o clique no botão do Telegram abrindo com `?start=connect`.

### Issue #3: `[E2E] Registro do Smoke Test Definitivo no HACKATHON_SUBMISSION.md`
**Descrição:** Garantir que temos um log seguro e estático no documento de submissão provando a execução atômica via KMS + Telegram, para que os juízes possam auditar sem precisarem rodar nada local.
**Ações da Issue:**
- [x] Rodar script KMS e capturar Hash (Já registrado).
- [x] Atualizar o HACKATHON_SUBMISSION.md com o log E2E estático.
- [ ] Manter este Hash como prova incontestável para submissão caso a demonstração on-live falhe.

---

## Criação de Pull Requests (Regras)
*   1 PR = 1 Objetivo.
*   Todo PR deve obrigatoriamente preencher o `.github/pull_request_template.md`.
*   O merge para `release/hackathon-submission` só ocorre se a evidência visual (Vercel Preview) estiver aprovada e limpa.