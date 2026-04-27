# Zero-Trust Release Ops (SPV Builder)

**Description:** Automatiza a criação de repositórios "Clean Room" (branches órfãs) para auditoria pública, isolando o ativo final do passivo histórico.
**Layer:** DevOps / SecOps
**TradFi Analogy:** Special Purpose Vehicle (SPV) / Clean Room Audit.

## Objetivo
Transformar a entrega de código público em um ativo auditável (Release Candidate Imutável). Elimina 100% do risco de vazamento de chaves antigas (ex: Turnkey KMS) ao expurgar a árvore de histórico de desenvolvimento (R&D).

## Quando usar
Sempre que o usuário solicitar "criar versão para hackathon", "limpar histórico para auditoria", "publicar repositório público", ou "preparar release limpa".

## Regras de Execução (Zero-Trust)
1. **NUNCA** fazer force-push na branch `main`. A `main` é o livro-razão interno (on-premise/private).
2. O artefato público DEVE ser uma branch órfã (`git checkout --orphan`).
3. A branch pública DEVE possuir um único commit inicial (o hash criptográfico atua como o selo de auditoria).
4. **Segregation of Duties:** O código deve ser movido do ambiente de *Staging/Internal* para o ambiente de *Public Audit*.

## Procedimento Padrão (O Algoritmo SPV)
O agente deve executar o seguinte fluxo ao ser invocado:
1. Validar se a árvore de trabalho atual está limpa.
2. Criar a branch órfã: `git checkout --orphan <nome-da-branch-publica>`.
3. Adicionar todos os arquivos rastreados (que não estejam no `.gitignore`): `git add -A`.
4. Criar o commit de fundação: `git commit -m "chore(release): establish clean room audit artifact [Zero-Trust SPV]"`.
5. Fornecer ao usuário as instruções para envio ao repositório remoto (`git push -u origin <nome-da-branch-publica>`).

## Discurso Institucional Integrado
Ao finalizar a operação, o agente deve emitir o seguinte laudo de maturidade:
> "O repositório público atua como um contrato inteligente estático, purgado de metadados internos e vetores de vazamento de credenciais. A equipe MIND não publica rascunhos; publica ativos auditáveis."
